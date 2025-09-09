const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class ForecastingService {
  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate comprehensive financial forecast for a property portfolio
   */
  async generatePortfolioForecast(landlordId, options = {}) {
    try {
      const {
        forecastPeriodMonths = 12,
        includeGrowthScenarios = true,
        includeMarketFactors = true
      } = options;

      // Get portfolio data
      const portfolioData = await this.getPortfolioData(landlordId);
      
      if (!portfolioData.properties.length) {
        return {
          error: 'No properties found for forecast',
          summary: { totalProperties: 0 }
        };
      }

      // Get historical data for trend analysis
      const historicalData = await this.getHistoricalFinancialData(landlordId, 24); // 24 months

      // Generate base forecast
      const baseForecast = await this.generateBaseForecast(portfolioData, historicalData, forecastPeriodMonths);

      // Generate scenario forecasts if requested
      let scenarios = {};
      if (includeGrowthScenarios) {
        scenarios = await this.generateGrowthScenarios(baseForecast, portfolioData);
      }

      // Get market insights if requested
      let marketInsights = {};
      if (includeMarketFactors) {
        marketInsights = await this.getMarketInsights(portfolioData.properties);
      }

      // Generate AI-powered insights
      const aiInsights = await this.generateForecastInsights(baseForecast, scenarios, marketInsights, portfolioData);

      return {
        summary: {
          landlordId,
          totalProperties: portfolioData.properties.length,
          forecastPeriodMonths,
          currentMonthlyRevenue: portfolioData.totalMonthlyRevenue,
          generatedAt: new Date()
        },
        baseForecast,
        scenarios,
        marketInsights,
        aiInsights,
        recommendations: this.generateForecastRecommendations(baseForecast, scenarios, aiInsights)
      };

    } catch (error) {
      console.error('Error generating portfolio forecast:', error);
      throw new Error('Failed to generate portfolio forecast');
    }
  }

  /**
   * Get current portfolio data
   */
  async getPortfolioData(landlordId) {
    const properties = await this.prisma.property.findMany({
      where: {
        landlordId,
        status: 'ACTIVE'
      },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: true,
            payments: {
              where: {
                dueDate: {
                  gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // Last 6 months
                }
              },
              orderBy: { dueDate: 'desc' }
            }
          }
        },
        maintenanceTickets: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
            }
          }
        }
      }
    });

    const totalMonthlyRevenue = properties.reduce((sum, property) => {
      const activeLease = property.leases.find(l => l.status === 'ACTIVE');
      return sum + (activeLease?.monthlyRent || property.rentAmount || 0);
    }, 0);

    const occupancyRate = properties.length > 0 
      ? (properties.filter(p => p.leases.some(l => l.status === 'ACTIVE')).length / properties.length) * 100
      : 0;

    // Calculate average maintenance costs
    const totalMaintenanceCosts = properties.reduce((sum, property) => {
      return sum + property.maintenanceTickets.reduce((ticketSum, ticket) => {
        return ticketSum + (ticket.actualCost || ticket.estimatedCost || 0);
      }, 0);
    }, 0);

    return {
      properties,
      totalMonthlyRevenue,
      occupancyRate,
      averageMonthlyMaintenanceCost: totalMaintenanceCosts / 12,
      propertyCount: properties.length
    };
  }

  /**
   * Get historical financial data for trend analysis
   */
  async getHistoricalFinancialData(landlordId, months) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get historical payment data
    const payments = await this.prisma.payment.findMany({
      where: {
        lease: {
          property: { landlordId }
        },
        dueDate: { gte: startDate }
      },
      include: {
        lease: {
          include: {
            property: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Get historical maintenance costs
    const maintenanceTickets = await this.prisma.maintenanceTicket.findMany({
      where: {
        property: { landlordId },
        createdAt: { gte: startDate },
        actualCost: { not: null }
      },
      select: {
        actualCost: true,
        createdAt: true,
        propertyId: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Aggregate by month
    const monthlyData = {};
    
    // Process payments
    payments.forEach(payment => {
      const monthKey = `${payment.dueDate.getFullYear()}-${payment.dueDate.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          maintenanceCosts: 0,
          paymentCount: 0,
          onTimePayments: 0
        };
      }
      
      if (payment.status === 'PAID') {
        monthlyData[monthKey].revenue += payment.amount;
        monthlyData[monthKey].paymentCount += 1;
        
        // Check if payment was on time
        if (payment.paidDate && new Date(payment.paidDate) <= new Date(payment.dueDate)) {
          monthlyData[monthKey].onTimePayments += 1;
        }
      }
    });

    // Process maintenance costs
    maintenanceTickets.forEach(ticket => {
      const monthKey = `${ticket.createdAt.getFullYear()}-${ticket.createdAt.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          maintenanceCosts: 0,
          paymentCount: 0,
          onTimePayments: 0
        };
      }
      
      monthlyData[monthKey].maintenanceCosts += ticket.actualCost;
    });

    // Convert to array and calculate trends
    const historicalTrends = Object.keys(monthlyData)
      .sort()
      .map(monthKey => ({
        month: monthKey,
        revenue: monthlyData[monthKey].revenue,
        maintenanceCosts: monthlyData[monthKey].maintenanceCosts,
        netIncome: monthlyData[monthKey].revenue - monthlyData[monthKey].maintenanceCosts,
        paymentSuccessRate: monthlyData[monthKey].paymentCount > 0 
          ? (monthlyData[monthKey].onTimePayments / monthlyData[monthKey].paymentCount) * 100 
          : 100
      }));

    return {
      monthlyTrends: historicalTrends,
      totalMonths: historicalTrends.length,
      averageMonthlyRevenue: historicalTrends.reduce((sum, month) => sum + month.revenue, 0) / (historicalTrends.length || 1),
      averageMonthlyMaintenance: historicalTrends.reduce((sum, month) => sum + month.maintenanceCosts, 0) / (historicalTrends.length || 1),
      revenueGrowthRate: this.calculateGrowthRate(historicalTrends.map(t => t.revenue))
    };
  }

  /**
   * Calculate growth rate from historical data
   */
  calculateGrowthRate(values) {
    if (values.length < 2) return 0;
    
    const firstValue = values[0] || 1;
    const lastValue = values[values.length - 1] || 1;
    const months = values.length - 1;
    
    if (firstValue === 0) return 0;
    
    // Monthly growth rate
    const monthlyGrowthRate = Math.pow(lastValue / firstValue, 1 / months) - 1;
    return monthlyGrowthRate * 100; // Convert to percentage
  }

  /**
   * Generate base forecast using historical trends and current data
   */
  async generateBaseForecast(portfolioData, historicalData, forecastMonths) {
    const forecast = [];
    const currentDate = new Date();
    
    // Base monthly revenue from current leases
    let baseMonthlyRevenue = portfolioData.totalMonthlyRevenue;
    let baseMonthlyMaintenance = portfolioData.averageMonthlyMaintenanceCost;
    
    // Apply historical growth trend
    const monthlyRevenueGrowth = historicalData.revenueGrowthRate / 100;
    const monthlyMaintenanceInflation = 0.002; // 2.4% annual inflation assumption
    
    for (let month = 1; month <= forecastMonths; month++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + month);
      
      // Apply growth/inflation
      baseMonthlyRevenue *= (1 + monthlyRevenueGrowth);
      baseMonthlyMaintenance *= (1 + monthlyMaintenanceInflation);
      
      // Factor in seasonality (basic model - higher maintenance in winter/summer)
      const seasonalityFactor = this.getSeasonalityFactor(forecastDate.getMonth());
      const adjustedMaintenance = baseMonthlyMaintenance * seasonalityFactor;
      
      // Factor in occupancy changes (simple model based on lease expirations)
      const occupancyAdjustment = await this.calculateOccupancyAdjustment(portfolioData, forecastDate);
      const adjustedRevenue = baseMonthlyRevenue * occupancyAdjustment;
      
      forecast.push({
        month: month,
        date: forecastDate,
        projectedRevenue: Math.round(adjustedRevenue),
        projectedMaintenance: Math.round(adjustedMaintenance),
        projectedNetIncome: Math.round(adjustedRevenue - adjustedMaintenance),
        occupancyRate: Math.round(portfolioData.occupancyRate * occupancyAdjustment),
        confidence: this.calculateConfidence(month, historicalData.totalMonths)
      });
    }
    
    // Calculate summary statistics
    const totalProjectedRevenue = forecast.reduce((sum, month) => sum + month.projectedRevenue, 0);
    const totalProjectedMaintenance = forecast.reduce((sum, month) => sum + month.projectedMaintenance, 0);
    const totalProjectedNetIncome = totalProjectedRevenue - totalProjectedMaintenance;
    
    return {
      monthlyForecasts: forecast,
      summary: {
        totalProjectedRevenue,
        totalProjectedMaintenance,
        totalProjectedNetIncome,
        averageMonthlyNetIncome: Math.round(totalProjectedNetIncome / forecastMonths),
        projectedROI: portfolioData.totalMonthlyRevenue > 0 
          ? ((totalProjectedNetIncome - (portfolioData.totalMonthlyRevenue * forecastMonths)) / (portfolioData.totalMonthlyRevenue * forecastMonths)) * 100
          : 0
      }
    };
  }

  /**
   * Get seasonality factor for maintenance costs
   */
  getSeasonalityFactor(month) {
    // 0-based month (0 = January)
    const seasonalityMap = {
      0: 1.2,  // January - high heating/maintenance
      1: 1.1,  // February
      2: 1.0,  // March
      3: 0.9,  // April
      4: 0.9,  // May
      5: 1.1,  // June - AC season starts
      6: 1.2,  // July - peak AC
      7: 1.2,  // August - peak AC
      8: 1.0,  // September
      9: 0.9,  // October
      10: 1.0, // November
      11: 1.1  // December - heating season
    };
    
    return seasonalityMap[month] || 1.0;
  }

  /**
   * Calculate occupancy adjustment based on lease expirations
   */
  async calculateOccupancyAdjustment(portfolioData, forecastDate) {
    // Count leases expiring before forecast date
    let expiringLeases = 0;
    
    portfolioData.properties.forEach(property => {
      property.leases.forEach(lease => {
        if (lease.status === 'ACTIVE' && new Date(lease.endDate) <= forecastDate) {
          expiringLeases++;
        }
      });
    });
    
    // Assume 80% renewal rate and 2-month average vacancy
    const renewalRate = 0.8;
    const avgVacancyMonths = 2;
    const totalLeases = portfolioData.properties.filter(p => p.leases.some(l => l.status === 'ACTIVE')).length;
    
    if (totalLeases === 0) return 1.0;
    
    // Simple occupancy model
    const lossFromExpiration = (expiringLeases * (1 - renewalRate)) / totalLeases;
    const occupancyAdjustment = 1 - (lossFromExpiration * 0.1); // 10% revenue impact per 100% lease loss
    
    return Math.max(0.7, Math.min(1.0, occupancyAdjustment)); // Cap between 70% and 100%
  }

  /**
   * Calculate forecast confidence based on data availability
   */
  calculateConfidence(forecastMonth, historicalMonths) {
    let baseConfidence = 90;
    
    // Reduce confidence for longer forecasts
    baseConfidence -= (forecastMonth - 1) * 3; // 3% reduction per month
    
    // Reduce confidence if limited historical data
    if (historicalMonths < 12) {
      baseConfidence -= (12 - historicalMonths) * 2; // 2% reduction per missing month
    }
    
    return Math.max(20, Math.min(95, baseConfidence)); // Cap between 20% and 95%
  }

  /**
   * Generate optimistic, pessimistic, and conservative growth scenarios
   */
  async generateGrowthScenarios(baseForecast, portfolioData) {
    const scenarios = {};
    
    // Optimistic scenario (20% revenue growth, low maintenance)
    scenarios.optimistic = this.adjustForecastScenario(baseForecast, {
      revenueMultiplier: 1.2,
      maintenanceMultiplier: 0.8,
      occupancyBonus: 0.05, // 5% better occupancy
      name: 'Optimistic Growth',
      description: '20% revenue growth, reduced maintenance costs, improved occupancy'
    });
    
    // Conservative scenario (5% revenue growth, higher maintenance)
    scenarios.conservative = this.adjustForecastScenario(baseForecast, {
      revenueMultiplier: 1.05,
      maintenanceMultiplier: 1.15,
      occupancyBonus: -0.05, // 5% worse occupancy
      name: 'Conservative Growth',
      description: '5% revenue growth, increased maintenance costs, lower occupancy'
    });
    
    // Pessimistic scenario (flat revenue, high maintenance)
    scenarios.pessimistic = this.adjustForecastScenario(baseForecast, {
      revenueMultiplier: 1.0,
      maintenanceMultiplier: 1.3,
      occupancyBonus: -0.1, // 10% worse occupancy
      name: 'Economic Downturn',
      description: 'No revenue growth, high maintenance costs, market challenges'
    });
    
    return scenarios;
  }

  /**
   * Adjust base forecast for different scenarios
   */
  adjustForecastScenario(baseForecast, adjustments) {
    const adjustedMonthlyForecasts = baseForecast.monthlyForecasts.map(month => {
      const adjustedRevenue = month.projectedRevenue * adjustments.revenueMultiplier;
      const adjustedMaintenance = month.projectedMaintenance * adjustments.maintenanceMultiplier;
      const adjustedOccupancy = Math.max(50, Math.min(100, month.occupancyRate + (adjustments.occupancyBonus * 100)));
      
      return {
        ...month,
        projectedRevenue: Math.round(adjustedRevenue),
        projectedMaintenance: Math.round(adjustedMaintenance),
        projectedNetIncome: Math.round(adjustedRevenue - adjustedMaintenance),
        occupancyRate: Math.round(adjustedOccupancy)
      };
    });
    
    // Calculate summary for scenario
    const totalRevenue = adjustedMonthlyForecasts.reduce((sum, month) => sum + month.projectedRevenue, 0);
    const totalMaintenance = adjustedMonthlyForecasts.reduce((sum, month) => sum + month.projectedMaintenance, 0);
    const totalNetIncome = totalRevenue - totalMaintenance;
    
    return {
      name: adjustments.name,
      description: adjustments.description,
      monthlyForecasts: adjustedMonthlyForecasts,
      summary: {
        totalProjectedRevenue: totalRevenue,
        totalProjectedMaintenance: totalMaintenance,
        totalProjectedNetIncome: totalNetIncome,
        averageMonthlyNetIncome: Math.round(totalNetIncome / adjustedMonthlyForecasts.length),
        projectedROI: baseForecast.summary.projectedROI * adjustments.revenueMultiplier
      }
    };
  }

  /**
   * Get market insights for forecast context
   */
  async getMarketInsights(properties) {
    try {
      // Group properties by market (city)
      const markets = {};
      properties.forEach(property => {
        const market = `${property.addressCity}, ${property.addressState}`;
        if (!markets[market]) {
          markets[market] = [];
        }
        markets[market].push(property);
      });
      
      const marketInsights = {};
      
      // Analyze each market
      for (const [marketName, marketProperties] of Object.entries(markets)) {
        const marketData = await this.analyzeMarketTrends(marketProperties);
        marketInsights[marketName] = marketData;
      }
      
      return {
        markets: marketInsights,
        diversification: {
          marketCount: Object.keys(markets).length,
          concentrationRisk: this.calculateConcentrationRisk(markets)
        }
      };
      
    } catch (error) {
      console.error('Error getting market insights:', error);
      return {
        markets: {},
        diversification: { marketCount: 0, concentrationRisk: 'unknown' }
      };
    }
  }

  /**
   * Analyze market trends for a set of properties
   */
  async analyzeMarketTrends(marketProperties) {
    if (marketProperties.length === 0) return null;
    
    const sampleProperty = marketProperties[0];
    
    // Get comparable properties in the market
    const comparables = await this.prisma.property.findMany({
      where: {
        addressCity: sampleProperty.addressCity,
        addressState: sampleProperty.addressState,
        status: 'ACTIVE',
        rentAmount: { not: null }
      },
      select: {
        rentAmount: true,
        bedrooms: true,
        propertyType: true,
        createdAt: true
      },
      take: 50
    });
    
    if (comparables.length === 0) {
      return {
        averageRent: 0,
        marketSize: 0,
        trend: 'unknown'
      };
    }
    
    // Calculate market statistics
    const rents = comparables.map(p => p.rentAmount);
    const averageRent = rents.reduce((sum, rent) => sum + rent, 0) / rents.length;
    
    // Simple trend analysis (recent vs older listings)
    const recentCutoff = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000); // 6 months ago
    const recentComparables = comparables.filter(p => new Date(p.createdAt) > recentCutoff);
    const olderComparables = comparables.filter(p => new Date(p.createdAt) <= recentCutoff);
    
    let trend = 'stable';
    if (recentComparables.length > 0 && olderComparables.length > 0) {
      const recentAvg = recentComparables.reduce((sum, p) => sum + p.rentAmount, 0) / recentComparables.length;
      const olderAvg = olderComparables.reduce((sum, p) => sum + p.rentAmount, 0) / olderComparables.length;
      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (changePercent > 3) trend = 'increasing';
      else if (changePercent < -3) trend = 'decreasing';
    }
    
    return {
      averageRent: Math.round(averageRent),
      marketSize: comparables.length,
      trend,
      propertyCount: marketProperties.length
    };
  }

  /**
   * Calculate concentration risk across markets
   */
  calculateConcentrationRisk(markets) {
    const totalProperties = Object.values(markets).reduce((sum, props) => sum + props.length, 0);
    if (totalProperties === 0) return 'unknown';
    
    // Calculate market share percentages
    const marketShares = Object.values(markets).map(props => (props.length / totalProperties) * 100);
    const maxShare = Math.max(...marketShares);
    
    if (maxShare >= 75) return 'high';
    if (maxShare >= 50) return 'medium';
    return 'low';
  }

  /**
   * Generate AI-powered forecast insights
   */
  async generateForecastInsights(baseForecast, scenarios, marketInsights, portfolioData) {
    try {
      const systemPrompt = `You are a real estate financial analyst providing insights on property portfolio forecasts. Analyze the provided data and generate actionable insights.

Portfolio Overview:
- Total Properties: ${portfolioData.propertyCount}
- Current Monthly Revenue: $${portfolioData.totalMonthlyRevenue}
- Current Occupancy Rate: ${portfolioData.occupancyRate.toFixed(1)}%
- Average Monthly Maintenance: $${portfolioData.averageMonthlyMaintenanceCost}

Base Forecast Summary (12 months):
- Projected Total Revenue: $${baseForecast.summary.totalProjectedRevenue}
- Projected Total Net Income: $${baseForecast.summary.totalProjectedNetIncome}
- Projected ROI: ${baseForecast.summary.projectedROI.toFixed(1)}%

Scenario Comparison:
- Optimistic Net Income: $${scenarios.optimistic?.summary.totalProjectedNetIncome || 'N/A'}
- Conservative Net Income: $${scenarios.conservative?.summary.totalProjectedNetIncome || 'N/A'}
- Pessimistic Net Income: $${scenarios.pessimistic?.summary.totalProjectedNetIncome || 'N/A'}

Market Context:
- Markets: ${marketInsights.diversification?.marketCount || 'Unknown'}
- Concentration Risk: ${marketInsights.diversification?.concentrationRisk || 'Unknown'}

Provide analysis in JSON format with:
- keyInsights: array of 3-4 key insights (strings)
- opportunities: array of 2-3 growth opportunities (strings)
- risks: array of 2-3 key risks (strings)
- marketOutlook: string describing market conditions
- confidenceLevel: "high", "medium", or "low"`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this portfolio forecast and provide strategic insights." }
        ],
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      return {
        keyInsights: Array.isArray(analysis.keyInsights) ? analysis.keyInsights : [],
        opportunities: Array.isArray(analysis.opportunities) ? analysis.opportunities : [],
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
        marketOutlook: analysis.marketOutlook || 'Market conditions require further analysis.',
        confidenceLevel: analysis.confidenceLevel || 'medium'
      };

    } catch (error) {
      console.error('Error generating AI insights:', error);
      
      // Fallback insights
      return {
        keyInsights: [
          `Portfolio of ${portfolioData.propertyCount} properties generating $${portfolioData.totalMonthlyRevenue}/month`,
          `Base forecast projects $${baseForecast.summary.totalProjectedNetIncome} net income over 12 months`,
          `Current occupancy rate of ${portfolioData.occupancyRate.toFixed(1)}% indicates ${portfolioData.occupancyRate > 90 ? 'strong' : 'moderate'} demand`
        ],
        opportunities: [
          'Optimize rent prices based on market analysis',
          'Improve operational efficiency to reduce maintenance costs'
        ],
        risks: [
          'Market volatility could impact rental demand',
          'Rising maintenance costs may reduce profit margins'
        ],
        marketOutlook: 'Analysis based on historical trends and current portfolio performance.',
        confidenceLevel: 'medium'
      };
    }
  }

  /**
   * Generate actionable recommendations from forecast
   */
  generateForecastRecommendations(baseForecast, scenarios, aiInsights) {
    const recommendations = [];

    // Revenue optimization recommendations
    const revenueGrowthPotential = scenarios.optimistic 
      ? ((scenarios.optimistic.summary.totalProjectedRevenue - baseForecast.summary.totalProjectedRevenue) / baseForecast.summary.totalProjectedRevenue) * 100
      : 0;

    if (revenueGrowthPotential > 15) {
      recommendations.push({
        category: 'Revenue Optimization',
        priority: 'high',
        title: 'Significant Growth Opportunity',
        description: `Optimistic scenario shows ${revenueGrowthPotential.toFixed(1)}% revenue potential. Consider rent optimization and occupancy improvements.`,
        impact: 'high',
        timeline: '3-6 months'
      });
    }

    // Risk management recommendations
    const pessimisticImpact = scenarios.pessimistic 
      ? ((baseForecast.summary.totalProjectedNetIncome - scenarios.pessimistic.summary.totalProjectedNetIncome) / baseForecast.summary.totalProjectedNetIncome) * 100
      : 0;

    if (pessimisticImpact > 25) {
      recommendations.push({
        category: 'Risk Management',
        priority: 'high',
        title: 'Downside Risk Mitigation',
        description: `Pessimistic scenario shows ${pessimisticImpact.toFixed(1)}% income risk. Implement defensive strategies and cost controls.`,
        impact: 'high',
        timeline: 'immediate'
      });
    }

    // Maintenance cost recommendations
    const avgMaintenanceRatio = (baseForecast.summary.totalProjectedMaintenance / baseForecast.summary.totalProjectedRevenue) * 100;
    
    if (avgMaintenanceRatio > 15) {
      recommendations.push({
        category: 'Cost Management',
        priority: 'medium',
        title: 'High Maintenance Costs',
        description: `Maintenance costs represent ${avgMaintenanceRatio.toFixed(1)}% of revenue. Consider preventive maintenance programs.`,
        impact: 'medium',
        timeline: '1-3 months'
      });
    }

    // Seasonal recommendations
    recommendations.push({
      category: 'Operational Planning',
      priority: 'low',
      title: 'Seasonal Maintenance Planning',
      description: 'Plan maintenance activities during low-cost seasons (April-May, September-October) to optimize expenses.',
      impact: 'medium',
      timeline: 'ongoing'
    });

    // AI insights-based recommendations
    if (aiInsights.confidenceLevel === 'low') {
      recommendations.push({
        category: 'Data Management',
        priority: 'medium',
        title: 'Improve Data Quality',
        description: 'Limited historical data reduces forecast accuracy. Implement better tracking of revenue and maintenance costs.',
        impact: 'medium',
        timeline: '1-2 months'
      });
    }

    return recommendations;
  }

  /**
   * Generate property-specific forecast
   */
  async generatePropertyForecast(propertyId, forecastMonths = 12) {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          leases: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: true,
              payments: {
                orderBy: { dueDate: 'desc' },
                take: 12
              }
            }
          },
          maintenanceTickets: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000) // Last 24 months
              }
            }
          }
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Generate single-property forecast
      const propertyData = {
        properties: [property],
        totalMonthlyRevenue: property.rentAmount || 0,
        occupancyRate: property.leases.length > 0 ? 100 : 0,
        averageMonthlyMaintenanceCost: this.calculatePropertyMaintenanceCost(property),
        propertyCount: 1
      };

      const historicalData = await this.getPropertyHistoricalData(property, 12);
      const forecast = await this.generateBaseForecast(propertyData, historicalData, forecastMonths);

      return {
        property: {
          id: property.id,
          title: property.title,
          currentRent: property.rentAmount,
          occupancyStatus: property.leases.length > 0 ? 'occupied' : 'vacant'
        },
        forecast,
        insights: this.generatePropertyInsights(property, forecast)
      };

    } catch (error) {
      console.error('Error generating property forecast:', error);
      throw new Error('Failed to generate property forecast');
    }
  }

  /**
   * Calculate average monthly maintenance cost for a property
   */
  calculatePropertyMaintenanceCost(property) {
    const maintenanceCosts = property.maintenanceTickets
      .filter(ticket => ticket.actualCost)
      .map(ticket => ticket.actualCost);

    if (maintenanceCosts.length === 0) return 0;

    const totalCosts = maintenanceCosts.reduce((sum, cost) => sum + cost, 0);
    const monthsOfData = Math.max(1, property.maintenanceTickets.length / 2); // Assume roughly 2 tickets per month on average
    
    return totalCosts / monthsOfData;
  }

  /**
   * Get historical data for a single property
   */
  async getPropertyHistoricalData(property, months) {
    // Simplified version for single property
    const payments = property.leases.flatMap(lease => lease.payments);
    const avgMonthlyRevenue = payments.length > 0 
      ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length
      : property.rentAmount || 0;

    return {
      monthlyTrends: [],
      totalMonths: 0,
      averageMonthlyRevenue: avgMonthlyRevenue,
      averageMonthlyMaintenance: this.calculatePropertyMaintenanceCost(property),
      revenueGrowthRate: 0 // Simplified for single property
    };
  }

  /**
   * Generate insights for single property forecast
   */
  generatePropertyInsights(property, forecast) {
    const insights = [];

    const isOccupied = property.leases.length > 0;
    const monthlyRevenue = property.rentAmount || 0;
    const annualProjection = forecast.summary.totalProjectedNetIncome;

    if (isOccupied) {
      insights.push(`Property is currently occupied generating $${monthlyRevenue}/month`);
    } else {
      insights.push('Property is currently vacant - find tenant to activate revenue');
    }

    insights.push(`Projected annual net income: $${annualProjection}`);

    if (forecast.summary.projectedROI > 10) {
      insights.push('Strong ROI projection indicates good investment performance');
    } else if (forecast.summary.projectedROI < 5) {
      insights.push('Low ROI projection - consider rent optimization or cost reduction');
    }

    return insights;
  }
}

module.exports = ForecastingService;