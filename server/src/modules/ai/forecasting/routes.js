const express = require('express');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const ForecastingService = require('./service');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const forecastingService = new ForecastingService();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs (forecasting is computationally expensive)
  message: 'Too many AI forecasting requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/ai/forecast/portfolio
 * @desc Generate comprehensive financial forecast for property portfolio
 * @access Private (Landlord, Admin)
 */
router.post('/portfolio', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_FORECASTING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Forecasting feature is not enabled'
      });
    }

    const { 
      landlordId, 
      forecastPeriodMonths = 12, 
      includeGrowthScenarios = true, 
      includeMarketFactors = true 
    } = req.body;

    // If landlordId not provided, use current user's ID (for landlord users)
    const targetLandlordId = landlordId || req.user.id;

    // Admin can forecast any landlord's portfolio, landlords can only forecast their own
    if (req.user.role !== 'ADMIN' && targetLandlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only forecast your own portfolio.'
      });
    }

    // Validate input parameters
    if (forecastPeriodMonths < 1 || forecastPeriodMonths > 36) {
      return res.status(400).json({
        success: false,
        error: 'Forecast period must be between 1 and 36 months'
      });
    }

    const forecast = await forecastingService.generatePortfolioForecast(targetLandlordId, {
      forecastPeriodMonths,
      includeGrowthScenarios,
      includeMarketFactors
    });

    res.status(200).json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('Error in portfolio forecasting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate portfolio forecast'
    });
  }
});

/**
 * @route POST /api/ai/forecast/property/:propertyId
 * @desc Generate forecast for a specific property
 * @access Private (Landlord, Admin)
 */
router.post('/property/:propertyId', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_FORECASTING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Forecasting feature is not enabled'
      });
    }

    const { propertyId } = req.params;
    const { forecastPeriodMonths = 12 } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    // Verify property ownership for landlords
    if (req.user.role === 'LANDLORD') {
      const property = await forecastingService.prisma.property.findUnique({
        where: { id: propertyId },
        select: { landlordId: true }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      if (property.landlordId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only forecast your own properties.'
        });
      }
    }

    // Validate input parameters
    if (forecastPeriodMonths < 1 || forecastPeriodMonths > 24) {
      return res.status(400).json({
        success: false,
        error: 'Forecast period must be between 1 and 24 months for individual properties'
      });
    }

    const forecast = await forecastingService.generatePropertyForecast(propertyId, forecastPeriodMonths);

    res.status(200).json({
      success: true,
      data: forecast
    });

  } catch (error) {
    console.error('Error in property forecasting:', error);
    
    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate property forecast'
    });
  }
});

/**
 * @route GET /api/ai/forecast/summary/:landlordId
 * @desc Get forecast summary and key metrics
 * @access Private (Landlord, Admin)
 */
router.get('/summary/:landlordId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { landlordId } = req.params;

    // Landlords can only access their own summary
    if (req.user.role !== 'ADMIN' && landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own forecast summary.'
      });
    }

    // Get basic portfolio metrics for quick summary
    const portfolioStats = await forecastingService.prisma.property.aggregate({
      where: {
        landlordId,
        status: 'ACTIVE'
      },
      _sum: { rentAmount: true },
      _count: { id: true }
    });

    const activeLeases = await forecastingService.prisma.lease.count({
      where: {
        property: { landlordId },
        status: 'ACTIVE'
      }
    });

    // Get upcoming lease expirations (next 6 months)
    const upcomingExpirations = await forecastingService.prisma.lease.count({
      where: {
        property: { landlordId },
        status: 'ACTIVE',
        endDate: {
          lte: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months from now
        }
      }
    });

    // Calculate occupancy rate
    const totalProperties = portfolioStats._count.id;
    const occupancyRate = totalProperties > 0 ? (activeLeases / totalProperties) * 100 : 0;

    // Get recent maintenance costs (last 3 months)
    const recentMaintenanceCosts = await forecastingService.prisma.maintenanceTicket.aggregate({
      where: {
        property: { landlordId },
        actualCost: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) // Last 3 months
        }
      },
      _sum: { actualCost: true }
    });

    const monthlyMaintenanceCost = (recentMaintenanceCosts._sum.actualCost || 0) / 3;

    res.status(200).json({
      success: true,
      data: {
        portfolio: {
          totalProperties: totalProperties,
          activeLeases: activeLeases,
          occupancyRate: Math.round(occupancyRate),
          totalMonthlyRevenue: Math.round(portfolioStats._sum.rentAmount || 0),
          avgMonthlyMaintenance: Math.round(monthlyMaintenanceCost)
        },
        riskFactors: {
          upcomingExpirations: upcomingExpirations,
          occupancyRisk: occupancyRate < 85 ? 'medium' : 'low',
          maintenanceCostTrend: monthlyMaintenanceCost > 500 ? 'high' : 'normal'
        },
        recommendations: [
          {
            priority: 'high',
            title: 'Generate Full Forecast',
            description: 'Run comprehensive AI forecast to plan for next 12 months',
            action: 'generate_forecast'
          },
          upcomingExpirations > 0 ? {
            priority: 'medium',
            title: 'Lease Renewals',
            description: `${upcomingExpirations} lease(s) expiring in next 6 months`,
            action: 'plan_renewals'
          } : null,
          occupancyRate < 85 ? {
            priority: 'medium',
            title: 'Improve Occupancy',
            description: `Occupancy at ${Math.round(occupancyRate)}% - consider marketing improvements`,
            action: 'boost_occupancy'
          } : null
        ].filter(Boolean),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching forecast summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast summary'
    });
  }
});

/**
 * @route GET /api/ai/forecast/trends/:landlordId
 * @desc Get historical trends for forecasting context
 * @access Private (Landlord, Admin)
 */
router.get('/trends/:landlordId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { landlordId } = req.params;
    const { months = 12 } = req.query;

    // Landlords can only access their own trends
    if (req.user.role !== 'ADMIN' && landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own trends.'
      });
    }

    // Validate months parameter
    const monthsNum = parseInt(months);
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 36) {
      return res.status(400).json({
        success: false,
        error: 'Months parameter must be between 1 and 36'
      });
    }

    // Get historical trends using existing service method
    const historicalData = await forecastingService.getHistoricalFinancialData(landlordId, monthsNum);

    // Calculate additional trend metrics
    const trends = {
      revenue: {
        monthlyTrends: historicalData.monthlyTrends.map(trend => ({
          month: trend.month,
          amount: trend.revenue
        })),
        averageMonthly: Math.round(historicalData.averageMonthlyRevenue),
        growthRate: Math.round(historicalData.revenueGrowthRate * 100) / 100,
        trend: historicalData.revenueGrowthRate > 2 ? 'increasing' : 
               historicalData.revenueGrowthRate < -2 ? 'decreasing' : 'stable'
      },
      maintenance: {
        monthlyTrends: historicalData.monthlyTrends.map(trend => ({
          month: trend.month,
          amount: trend.maintenanceCosts
        })),
        averageMonthly: Math.round(historicalData.averageMonthlyMaintenance),
        trend: this.calculateMaintenanceTrend(historicalData.monthlyTrends)
      },
      netIncome: {
        monthlyTrends: historicalData.monthlyTrends.map(trend => ({
          month: trend.month,
          amount: trend.netIncome
        })),
        averageMonthly: Math.round(historicalData.averageMonthlyRevenue - historicalData.averageMonthlyMaintenance)
      }
    };

    res.status(200).json({
      success: true,
      data: {
        period: `${monthsNum} months`,
        trends,
        insights: this.generateTrendInsights(trends),
        dataQuality: {
          monthsOfData: historicalData.totalMonths,
          completeness: historicalData.totalMonths >= 12 ? 'good' : 'limited'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical trends'
    });
  }
});

/**
 * @route POST /api/ai/forecast/scenarios
 * @desc Generate what-if scenarios for portfolio planning
 * @access Private (Landlord, Admin)
 */
router.post('/scenarios', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_FORECASTING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Forecasting feature is not enabled'
      });
    }

    const { 
      landlordId, 
      scenarios = ['optimistic', 'conservative', 'pessimistic'],
      forecastMonths = 12 
    } = req.body;

    // If landlordId not provided, use current user's ID
    const targetLandlordId = landlordId || req.user.id;

    // Admin can analyze any landlord's scenarios, landlords can only analyze their own
    if (req.user.role !== 'ADMIN' && targetLandlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only generate scenarios for your own portfolio.'
      });
    }

    // Generate base forecast first
    const portfolioData = await forecastingService.getPortfolioData(targetLandlordId);
    const historicalData = await forecastingService.getHistoricalFinancialData(targetLandlordId, 12);
    const baseForecast = await forecastingService.generateBaseForecast(portfolioData, historicalData, forecastMonths);

    // Generate requested scenarios
    const scenarioResults = await forecastingService.generateGrowthScenarios(baseForecast, portfolioData);

    // Filter to requested scenarios
    const requestedScenarios = {};
    scenarios.forEach(scenarioName => {
      if (scenarioResults[scenarioName]) {
        requestedScenarios[scenarioName] = scenarioResults[scenarioName];
      }
    });

    res.status(200).json({
      success: true,
      data: {
        baseForecast: baseForecast.summary,
        scenarios: requestedScenarios,
        comparison: this.generateScenarioComparison(baseForecast, requestedScenarios),
        recommendations: this.generateScenarioRecommendations(baseForecast, requestedScenarios)
      }
    });

  } catch (error) {
    console.error('Error generating scenarios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast scenarios'
    });
  }
});

/**
 * Helper function to calculate maintenance trend
 */
function calculateMaintenanceTrend(monthlyTrends) {
  if (monthlyTrends.length < 2) return 'stable';
  
  const firstHalf = monthlyTrends.slice(0, Math.floor(monthlyTrends.length / 2));
  const secondHalf = monthlyTrends.slice(Math.floor(monthlyTrends.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.maintenanceCosts, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.maintenanceCosts, 0) / secondHalf.length;
  
  const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  
  if (changePercent > 15) return 'increasing';
  if (changePercent < -15) return 'decreasing';
  return 'stable';
}

/**
 * Helper function to generate trend insights
 */
function generateTrendInsights(trends) {
  const insights = [];
  
  if (trends.revenue.trend === 'increasing') {
    insights.push(`Revenue is trending upward with ${trends.revenue.growthRate}% growth rate`);
  } else if (trends.revenue.trend === 'decreasing') {
    insights.push(`Revenue is declining - consider rent optimization strategies`);
  }
  
  if (trends.maintenance.trend === 'increasing') {
    insights.push('Maintenance costs are rising - review preventive maintenance programs');
  }
  
  const netIncomeRatio = trends.revenue.averageMonthly > 0 
    ? (trends.netIncome.averageMonthly / trends.revenue.averageMonthly) * 100 
    : 0;
    
  if (netIncomeRatio > 70) {
    insights.push('Strong profit margins indicate efficient operations');
  } else if (netIncomeRatio < 50) {
    insights.push('Low profit margins - review cost structure and pricing');
  }
  
  return insights;
}

/**
 * Helper function to generate scenario comparison
 */
function generateScenarioComparison(baseForecast, scenarios) {
  const comparison = {};
  
  Object.keys(scenarios).forEach(scenarioName => {
    const scenario = scenarios[scenarioName];
    const baseRevenue = baseForecast.summary.totalProjectedRevenue;
    const scenarioRevenue = scenario.summary.totalProjectedRevenue;
    
    comparison[scenarioName] = {
      revenueDifference: scenarioRevenue - baseRevenue,
      revenueDifferencePercent: baseRevenue > 0 ? ((scenarioRevenue - baseRevenue) / baseRevenue) * 100 : 0,
      netIncomeDifference: scenario.summary.totalProjectedNetIncome - baseForecast.summary.totalProjectedNetIncome
    };
  });
  
  return comparison;
}

/**
 * Helper function to generate scenario recommendations
 */
function generateScenarioRecommendations(baseForecast, scenarios) {
  const recommendations = [];
  
  if (scenarios.optimistic) {
    const upside = scenarios.optimistic.summary.totalProjectedNetIncome - baseForecast.summary.totalProjectedNetIncome;
    if (upside > 10000) {
      recommendations.push({
        priority: 'high',
        scenario: 'optimistic',
        title: 'Significant Growth Potential',
        description: `Optimistic scenario shows $${upside} additional net income potential`,
        action: 'Implement aggressive growth strategies'
      });
    }
  }
  
  if (scenarios.pessimistic) {
    const downside = baseForecast.summary.totalProjectedNetIncome - scenarios.pessimistic.summary.totalProjectedNetIncome;
    if (downside > 5000) {
      recommendations.push({
        priority: 'high',
        scenario: 'pessimistic',
        title: 'Significant Downside Risk',
        description: `Pessimistic scenario shows $${downside} at-risk income`,
        action: 'Implement risk mitigation strategies'
      });
    }
  }
  
  return recommendations;
}

module.exports = router;