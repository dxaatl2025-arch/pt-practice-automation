const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class TurnoverPredictorService {
  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Predict turnover risk for a specific tenant/lease
   */
  async predictTenantTurnover(leaseId) {
    try {
      const lease = await this.prisma.lease.findUnique({
        where: { id: leaseId },
        include: {
          tenant: true,
          property: {
            include: {
              landlord: true
            }
          },
          payments: {
            orderBy: { dueDate: 'desc' }
          }
        }
      });

      if (!lease) {
        throw new Error('Lease not found');
      }

      // Get maintenance tickets for this property/tenant
      const maintenanceTickets = await this.prisma.maintenanceTicket.findMany({
        where: {
          propertyId: lease.propertyId,
          tenantId: lease.tenantId
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate risk factors
      const riskFactors = await this.calculateRiskFactors(lease, maintenanceTickets);

      // Get AI prediction
      const aiAnalysis = await this.generateTurnoverPrediction(lease, riskFactors);

      // Calculate intervention recommendations
      const interventions = this.generateInterventionRecommendations(riskFactors, aiAnalysis);

      return {
        lease: {
          id: lease.id,
          tenant: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          property: lease.property.title,
          startDate: lease.startDate,
          endDate: lease.endDate,
          monthlyRent: lease.monthlyRent,
          status: lease.status
        },
        prediction: {
          turnoverRisk: aiAnalysis.turnoverRisk,
          confidence: aiAnalysis.confidence,
          probability: aiAnalysis.probability,
          timeframe: aiAnalysis.timeframe,
          reasoning: aiAnalysis.reasoning
        },
        riskFactors,
        interventions,
        recommendations: this.generateRetentionStrategies(riskFactors, aiAnalysis)
      };

    } catch (error) {
      console.error('Error predicting tenant turnover:', error);
      throw new Error('Failed to predict tenant turnover');
    }
  }

  /**
   * Calculate various risk factors for turnover prediction
   */
  async calculateRiskFactors(lease, maintenanceTickets) {
    const factors = {};

    // 1. Payment History Analysis
    factors.paymentHistory = this.analyzePaymentHistory(lease.payments);

    // 2. Lease Term Analysis
    factors.leaseTerm = this.analyzeLeaseTerm(lease);

    // 3. Maintenance Issues Analysis
    factors.maintenanceIssues = this.analyzeMaintenanceIssues(maintenanceTickets);

    // 4. Rent vs Market Analysis
    factors.rentCompetitiveness = await this.analyzeRentCompetitiveness(lease);

    // 5. Tenant Demographics
    factors.tenantProfile = this.analyzeTenantProfile(lease.tenant);

    // 6. Property Characteristics
    factors.propertyFactors = this.analyzePropertyFactors(lease.property);

    // 7. Historical Patterns
    factors.historicalPatterns = await this.analyzeHistoricalTurnover(lease.property);

    return factors;
  }

  /**
   * Analyze payment history for late payments, missed payments
   */
  analyzePaymentHistory(payments) {
    if (!payments || payments.length === 0) {
      return {
        riskLevel: 'unknown',
        score: 50,
        details: 'No payment history available'
      };
    }

    const last12Months = payments.filter(p => {
      const paymentDate = new Date(p.dueDate);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      return paymentDate >= twelveMonthsAgo;
    });

    const latePayments = last12Months.filter(p => p.late || 
      (p.paidDate && new Date(p.paidDate) > new Date(p.dueDate)));
    const missedPayments = last12Months.filter(p => p.status === 'OVERDUE' || p.status === 'FAILED');

    const latePaymentRate = last12Months.length > 0 ? (latePayments.length / last12Months.length) * 100 : 0;
    const missedPaymentRate = last12Months.length > 0 ? (missedPayments.length / last12Months.length) * 100 : 0;

    let riskLevel = 'low';
    let score = 100;

    if (missedPaymentRate > 10) {
      riskLevel = 'high';
      score = 20;
    } else if (latePaymentRate > 30 || missedPaymentRate > 0) {
      riskLevel = 'medium';
      score = 50;
    } else if (latePaymentRate > 10) {
      riskLevel = 'low-medium';
      score = 75;
    }

    return {
      riskLevel,
      score,
      latePaymentRate: Math.round(latePaymentRate),
      missedPaymentRate: Math.round(missedPaymentRate),
      totalPayments: last12Months.length,
      details: `${latePayments.length} late payments, ${missedPayments.length} missed payments in last 12 months`
    };
  }

  /**
   * Analyze lease term and renewal patterns
   */
  analyzeLeaseTerm(lease) {
    const now = new Date();
    const leaseEnd = new Date(lease.endDate);
    const leaseStart = new Date(lease.startDate);
    
    const daysUntilExpiry = Math.ceil((leaseEnd - now) / (1000 * 60 * 60 * 24));
    const leaseDurationMonths = Math.ceil((leaseEnd - leaseStart) / (1000 * 60 * 60 * 24 * 30));
    
    let riskLevel = 'low';
    let score = 100;

    if (daysUntilExpiry <= 60) {
      riskLevel = 'high';
      score = 30;
    } else if (daysUntilExpiry <= 90) {
      riskLevel = 'medium';
      score = 60;
    } else if (daysUntilExpiry <= 180) {
      riskLevel = 'low-medium';
      score = 80;
    }

    // Short-term leases have higher turnover risk
    if (leaseDurationMonths <= 6) {
      score = Math.max(score - 20, 10);
    }

    return {
      riskLevel,
      score,
      daysUntilExpiry,
      leaseDurationMonths,
      status: lease.status,
      details: `Lease expires in ${daysUntilExpiry} days (${leaseDurationMonths}-month lease)`
    };
  }

  /**
   * Analyze maintenance issues frequency and resolution
   */
  analyzeMaintenanceIssues(tickets) {
    if (!tickets || tickets.length === 0) {
      return {
        riskLevel: 'low',
        score: 100,
        details: 'No maintenance issues reported'
      };
    }

    const last12Months = tickets.filter(t => {
      const ticketDate = new Date(t.createdAt);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      return ticketDate >= twelveMonthsAgo;
    });

    const openTickets = last12Months.filter(t => t.status === 'OPEN');
    const highPriorityTickets = last12Months.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
    const avgResolutionTime = this.calculateAvgResolutionTime(last12Months.filter(t => t.status === 'RESOLVED'));

    let riskLevel = 'low';
    let score = 100;

    if (openTickets.length > 2 || highPriorityTickets.length > 1) {
      riskLevel = 'high';
      score = 25;
    } else if (last12Months.length > 5 || openTickets.length > 0) {
      riskLevel = 'medium';
      score = 50;
    } else if (last12Months.length > 2) {
      riskLevel = 'low-medium';
      score = 75;
    }

    return {
      riskLevel,
      score,
      totalTickets: last12Months.length,
      openTickets: openTickets.length,
      highPriorityTickets: highPriorityTickets.length,
      avgResolutionDays: Math.round(avgResolutionTime),
      details: `${last12Months.length} tickets in 12 months, ${openTickets.length} still open`
    };
  }

  /**
   * Calculate average resolution time for maintenance tickets
   */
  calculateAvgResolutionTime(resolvedTickets) {
    if (resolvedTickets.length === 0) return 0;

    const totalDays = resolvedTickets.reduce((sum, ticket) => {
      if (ticket.completedAt) {
        const created = new Date(ticket.createdAt);
        const completed = new Date(ticket.completedAt);
        const days = (completed - created) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);

    return totalDays / resolvedTickets.length;
  }

  /**
   * Analyze rent competitiveness compared to market
   */
  async analyzeRentCompetitiveness(lease) {
    try {
      // Find comparable properties
      const comparables = await this.prisma.property.findMany({
        where: {
          addressCity: lease.property.addressCity,
          addressState: lease.property.addressState,
          propertyType: lease.property.propertyType,
          bedrooms: lease.property.bedrooms,
          status: 'ACTIVE',
          id: { not: lease.propertyId },
          rentAmount: { not: null }
        },
        select: { rentAmount: true },
        take: 20
      });

      if (comparables.length === 0) {
        return {
          riskLevel: 'unknown',
          score: 50,
          details: 'No comparable properties found'
        };
      }

      const marketRents = comparables.map(c => c.rentAmount);
      const avgMarketRent = marketRents.reduce((sum, rent) => sum + rent, 0) / marketRents.length;
      const currentRent = lease.monthlyRent;
      
      const rentDifference = ((currentRent - avgMarketRent) / avgMarketRent) * 100;

      let riskLevel = 'low';
      let score = 100;

      if (rentDifference > 20) {
        riskLevel = 'high';
        score = 20;
      } else if (rentDifference > 10) {
        riskLevel = 'medium';
        score = 50;
      } else if (rentDifference > 5) {
        riskLevel = 'low-medium';
        score = 75;
      } else if (rentDifference < -10) {
        // Significantly below market might indicate other issues
        riskLevel = 'medium';
        score = 60;
      }

      return {
        riskLevel,
        score,
        currentRent,
        marketAverage: Math.round(avgMarketRent),
        rentDifference: Math.round(rentDifference * 100) / 100,
        comparableCount: comparables.length,
        details: `Rent is ${rentDifference > 0 ? '+' : ''}${rentDifference.toFixed(1)}% vs market average`
      };

    } catch (error) {
      console.error('Error analyzing rent competitiveness:', error);
      return {
        riskLevel: 'unknown',
        score: 50,
        details: 'Error analyzing market rent'
      };
    }
  }

  /**
   * Analyze tenant profile factors
   */
  analyzeTenantProfile(tenant) {
    let score = 100;
    const factors = [];

    // Budget match analysis
    if (tenant.budgetMax && tenant.budgetMin) {
      factors.push('Budget preferences available');
    } else {
      score -= 10;
      factors.push('Limited budget information');
    }

    // Profile completeness
    if (tenant.firstName && tenant.lastName && tenant.phone) {
      factors.push('Complete profile information');
    } else {
      score -= 15;
      factors.push('Incomplete profile');
    }

    // Tenant preferences
    if (tenant.profilePreferences) {
      factors.push('Preferences documented');
    } else {
      score -= 10;
    }

    const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      riskLevel,
      score,
      tenantId: tenant.id,
      profileCompleteness: score,
      factors,
      details: `Profile completeness: ${score}%`
    };
  }

  /**
   * Analyze property-specific factors
   */
  analyzePropertyFactors(property) {
    let score = 100;
    const factors = [];

    // Property age and condition indicators
    if (property.squareFeet) {
      factors.push('Size documented');
    } else {
      score -= 10;
    }

    // Amenities
    if (property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0) {
      factors.push(`${property.amenities.length} amenities listed`);
    } else {
      score -= 15;
      factors.push('Limited amenities information');
    }

    // Property type desirability
    const desirableTypes = ['HOUSE', 'CONDO', 'TOWNHOUSE'];
    if (desirableTypes.includes(property.propertyType)) {
      factors.push('Desirable property type');
    } else if (property.propertyType === 'STUDIO') {
      score -= 20;
      factors.push('Studio apartments have higher turnover');
    }

    const riskLevel = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';

    return {
      riskLevel,
      score,
      propertyType: property.propertyType,
      factors,
      details: `Property score: ${score}/100`
    };
  }

  /**
   * Analyze historical turnover patterns for the property
   */
  async analyzeHistoricalTurnover(property) {
    try {
      const historicalLeases = await this.prisma.lease.findMany({
        where: {
          propertyId: property.id,
          status: { in: ['TERMINATED', 'EXPIRED'] }
        },
        orderBy: { endDate: 'desc' },
        take: 10
      });

      if (historicalLeases.length === 0) {
        return {
          riskLevel: 'unknown',
          score: 50,
          details: 'No historical lease data'
        };
      }

      // Calculate average lease duration
      const leaseDurations = historicalLeases.map(lease => {
        const start = new Date(lease.startDate);
        const end = new Date(lease.endDate);
        return (end - start) / (1000 * 60 * 60 * 24 * 30); // months
      });

      const avgLeaseDuration = leaseDurations.reduce((sum, duration) => sum + duration, 0) / leaseDurations.length;
      
      // Analyze termination reasons (if available in notes or status)
      const terminatedEarly = historicalLeases.filter(l => l.status === 'TERMINATED').length;
      const terminationRate = (terminatedEarly / historicalLeases.length) * 100;

      let riskLevel = 'low';
      let score = 100;

      if (avgLeaseDuration < 8) {
        riskLevel = 'high';
        score = 30;
      } else if (avgLeaseDuration < 12) {
        riskLevel = 'medium';
        score = 60;
      }

      if (terminationRate > 30) {
        score = Math.min(score, 40);
        riskLevel = 'high';
      }

      return {
        riskLevel,
        score,
        avgLeaseDuration: Math.round(avgLeaseDuration),
        terminationRate: Math.round(terminationRate),
        totalHistoricalLeases: historicalLeases.length,
        details: `Avg lease: ${avgLeaseDuration.toFixed(1)} months, ${terminationRate}% early termination rate`
      };

    } catch (error) {
      console.error('Error analyzing historical turnover:', error);
      return {
        riskLevel: 'unknown',
        score: 50,
        details: 'Error analyzing historical data'
      };
    }
  }

  /**
   * Generate AI-powered turnover prediction
   */
  async generateTurnoverPrediction(lease, riskFactors) {
    try {
      const systemPrompt = `You are an expert property management analyst specializing in tenant retention and turnover prediction. Analyze the provided lease and risk factor data to predict turnover likelihood.

Lease Information:
- Tenant: ${lease.tenant.firstName} ${lease.tenant.lastName}
- Property: ${lease.property.title}
- Monthly Rent: $${lease.monthlyRent}
- Lease End Date: ${lease.endDate}
- Lease Status: ${lease.status}

Risk Factor Analysis:
- Payment History: ${riskFactors.paymentHistory.riskLevel} (Score: ${riskFactors.paymentHistory.score}/100)
  ${riskFactors.paymentHistory.details}
- Lease Term: ${riskFactors.leaseTerm.riskLevel} (Score: ${riskFactors.leaseTerm.score}/100)
  ${riskFactors.leaseTerm.details}
- Maintenance Issues: ${riskFactors.maintenanceIssues.riskLevel} (Score: ${riskFactors.maintenanceIssues.score}/100)
  ${riskFactors.maintenanceIssues.details}
- Rent Competitiveness: ${riskFactors.rentCompetitiveness.riskLevel} (Score: ${riskFactors.rentCompetitiveness.score}/100)
  ${riskFactors.rentCompetitiveness.details}
- Historical Patterns: ${riskFactors.historicalPatterns.riskLevel} (Score: ${riskFactors.historicalPatterns.score}/100)
  ${riskFactors.historicalPatterns.details}

Provide your analysis in JSON format with:
- turnoverRisk: "low", "medium", or "high"
- confidence: "low", "medium", or "high" 
- probability: number (0-100) representing likelihood of turnover
- timeframe: "immediate" (0-30 days), "short" (1-3 months), "medium" (3-6 months), or "long" (6+ months)
- reasoning: string explaining your prediction (2-3 sentences)`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this tenant's turnover risk and provide prediction." }
        ],
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      // Validate and sanitize the analysis
      return {
        turnoverRisk: analysis.turnoverRisk || 'medium',
        confidence: analysis.confidence || 'medium',
        probability: Math.min(100, Math.max(0, analysis.probability || 50)),
        timeframe: analysis.timeframe || 'medium',
        reasoning: analysis.reasoning || 'Analysis based on available risk factors.'
      };

    } catch (error) {
      console.error('Error generating AI turnover prediction:', error);
      
      // Fallback prediction based on risk scores
      const scores = Object.values(riskFactors).map(factor => factor.score || 50);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      let turnoverRisk = 'medium';
      let probability = 50;
      
      if (avgScore < 40) {
        turnoverRisk = 'high';
        probability = 75;
      } else if (avgScore < 70) {
        turnoverRisk = 'medium';
        probability = 50;
      } else {
        turnoverRisk = 'low';
        probability = 25;
      }

      return {
        turnoverRisk,
        confidence: 'low',
        probability,
        timeframe: 'medium',
        reasoning: 'Prediction based on risk factor analysis due to AI service unavailability.'
      };
    }
  }

  /**
   * Generate intervention recommendations to reduce turnover risk
   */
  generateInterventionRecommendations(riskFactors, aiAnalysis) {
    const interventions = [];

    // Payment-related interventions
    if (riskFactors.paymentHistory.riskLevel === 'high' || riskFactors.paymentHistory.riskLevel === 'medium') {
      interventions.push({
        type: 'payment',
        priority: 'high',
        title: 'Payment Plan Discussion',
        description: 'Schedule a meeting with tenant to discuss payment difficulties and potential payment plan options.',
        estimatedImpact: 'high',
        timeline: 'immediate'
      });
    }

    // Maintenance-related interventions
    if (riskFactors.maintenanceIssues.riskLevel === 'high') {
      interventions.push({
        type: 'maintenance',
        priority: 'high',
        title: 'Expedite Open Maintenance Requests',
        description: `Address ${riskFactors.maintenanceIssues.openTickets} open maintenance tickets immediately to improve tenant satisfaction.`,
        estimatedImpact: 'high',
        timeline: 'immediate'
      });
    }

    // Rent competitiveness interventions
    if (riskFactors.rentCompetitiveness.riskLevel === 'high' && riskFactors.rentCompetitiveness.rentDifference > 10) {
      interventions.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Consider Rent Adjustment',
        description: `Rent is ${riskFactors.rentCompetitiveness.rentDifference}% above market. Consider adjustment or justify with value-adds.`,
        estimatedImpact: 'high',
        timeline: 'short'
      });
    }

    // Lease renewal interventions
    if (riskFactors.leaseTerm.daysUntilExpiry <= 90) {
      interventions.push({
        type: 'renewal',
        priority: 'high',
        title: 'Proactive Lease Renewal Discussion',
        description: `Lease expires in ${riskFactors.leaseTerm.daysUntilExpiry} days. Initiate renewal conversation with incentives.`,
        estimatedImpact: 'high',
        timeline: 'immediate'
      });
    }

    // General retention interventions
    if (aiAnalysis.turnoverRisk === 'high') {
      interventions.push({
        type: 'retention',
        priority: 'high',
        title: 'Tenant Satisfaction Survey',
        description: 'Conduct a satisfaction survey to identify specific concerns and improvement opportunities.',
        estimatedImpact: 'medium',
        timeline: 'short'
      });
    }

    return interventions;
  }

  /**
   * Generate retention strategies based on risk analysis
   */
  generateRetentionStrategies(riskFactors, aiAnalysis) {
    const strategies = [];

    // High-impact strategies for high-risk tenants
    if (aiAnalysis.turnoverRisk === 'high') {
      strategies.push({
        category: 'Financial Incentives',
        strategies: [
          'Offer lease renewal bonus (1-month rent credit)',
          'Provide property upgrade allowance',
          'Consider temporary rent freeze'
        ]
      });

      strategies.push({
        category: 'Service Excellence',
        strategies: [
          'Priority maintenance response',
          'Quarterly property inspections',
          'Direct landlord communication channel'
        ]
      });
    }

    // Medium-risk retention strategies
    if (aiAnalysis.turnoverRisk === 'medium' || aiAnalysis.turnoverRisk === 'high') {
      strategies.push({
        category: 'Property Improvements',
        strategies: [
          'Minor upgrades (new appliances, paint, flooring)',
          'Enhanced amenities (smart thermostats, security)',
          'Landscaping and common area improvements'
        ]
      });
    }

    // General retention strategies
    strategies.push({
      category: 'Communication & Engagement',
      strategies: [
        'Regular check-ins and satisfaction surveys',
        'Holiday cards and appreciation gestures',
        'Quick response to tenant requests and concerns'
      ]
    });

    return strategies;
  }

  /**
   * Analyze portfolio-wide turnover patterns
   */
  async analyzePortfolioTurnover(landlordId) {
    try {
      // Get all active leases for the landlord
      const activeLeases = await this.prisma.lease.findMany({
        where: {
          property: { landlordId },
          status: 'ACTIVE'
        },
        include: {
          tenant: true,
          property: true,
          payments: {
            orderBy: { dueDate: 'desc' },
            take: 12
          }
        }
      });

      if (activeLeases.length === 0) {
        return {
          summary: {
            totalLeases: 0,
            highRiskLeases: 0,
            mediumRiskLeases: 0,
            lowRiskLeases: 0,
            averageRisk: 0
          },
          riskBreakdown: [],
          priorityActions: []
        };
      }

      // Analyze each lease
      const leaseAnalyses = await Promise.all(
        activeLeases.map(async (lease) => {
          try {
            const analysis = await this.predictTenantTurnover(lease.id);
            return {
              leaseId: lease.id,
              tenant: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
              property: lease.property.title,
              riskLevel: analysis.prediction.turnoverRisk,
              probability: analysis.prediction.probability,
              timeframe: analysis.prediction.timeframe,
              daysUntilExpiry: Math.ceil((new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24))
            };
          } catch (error) {
            console.error(`Error analyzing lease ${lease.id}:`, error);
            return {
              leaseId: lease.id,
              tenant: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
              property: lease.property.title,
              riskLevel: 'unknown',
              probability: 50,
              timeframe: 'unknown',
              error: true
            };
          }
        })
      );

      // Calculate summary statistics
      const riskCounts = {
        high: leaseAnalyses.filter(a => a.riskLevel === 'high').length,
        medium: leaseAnalyses.filter(a => a.riskLevel === 'medium').length,
        low: leaseAnalyses.filter(a => a.riskLevel === 'low').length
      };

      const averageRisk = leaseAnalyses.reduce((sum, a) => sum + a.probability, 0) / leaseAnalyses.length;

      // Identify priority actions
      const priorityActions = this.identifyPortfolioPriorities(leaseAnalyses);

      return {
        summary: {
          totalLeases: activeLeases.length,
          highRiskLeases: riskCounts.high,
          mediumRiskLeases: riskCounts.medium,
          lowRiskLeases: riskCounts.low,
          averageRisk: Math.round(averageRisk)
        },
        riskBreakdown: leaseAnalyses.sort((a, b) => b.probability - a.probability),
        priorityActions,
        trends: this.calculatePortfolioTrends(leaseAnalyses)
      };

    } catch (error) {
      console.error('Error analyzing portfolio turnover:', error);
      throw new Error('Failed to analyze portfolio turnover');
    }
  }

  /**
   * Identify priority actions for portfolio management
   */
  identifyPortfolioPriorities(leaseAnalyses) {
    const priorities = [];

    // Immediate action needed (high risk, expiring soon)
    const immediateRisk = leaseAnalyses.filter(a => 
      a.riskLevel === 'high' && a.daysUntilExpiry <= 60
    );

    if (immediateRisk.length > 0) {
      priorities.push({
        priority: 'critical',
        type: 'immediate_intervention',
        title: 'Critical Turnover Risk',
        description: `${immediateRisk.length} lease(s) at high risk with expiration within 60 days`,
        leases: immediateRisk.map(l => ({ leaseId: l.leaseId, tenant: l.tenant, property: l.property })),
        action: 'Schedule immediate tenant meetings and renewal discussions'
      });
    }

    // High risk but more time
    const highRiskLeases = leaseAnalyses.filter(a => 
      a.riskLevel === 'high' && a.daysUntilExpiry > 60
    );

    if (highRiskLeases.length > 0) {
      priorities.push({
        priority: 'high',
        type: 'retention_strategy',
        title: 'High Turnover Risk',
        description: `${highRiskLeases.length} lease(s) at high risk of turnover`,
        leases: highRiskLeases.map(l => ({ leaseId: l.leaseId, tenant: l.tenant, property: l.property })),
        action: 'Implement retention strategies and address underlying issues'
      });
    }

    // Portfolio-wide patterns
    const totalHighRisk = leaseAnalyses.filter(a => a.riskLevel === 'high').length;
    const riskPercentage = (totalHighRisk / leaseAnalyses.length) * 100;

    if (riskPercentage > 25) {
      priorities.push({
        priority: 'medium',
        type: 'portfolio_review',
        title: 'Portfolio Risk Assessment',
        description: `${riskPercentage.toFixed(1)}% of leases are high-risk - consider systemic improvements`,
        action: 'Review property management practices and market positioning'
      });
    }

    return priorities;
  }

  /**
   * Calculate portfolio-wide trends
   */
  calculatePortfolioTrends(leaseAnalyses) {
    const riskDistribution = {
      high: (leaseAnalyses.filter(a => a.riskLevel === 'high').length / leaseAnalyses.length) * 100,
      medium: (leaseAnalyses.filter(a => a.riskLevel === 'medium').length / leaseAnalyses.length) * 100,
      low: (leaseAnalyses.filter(a => a.riskLevel === 'low').length / leaseAnalyses.length) * 100
    };

    // Timeframe analysis
    const timeframeDistribution = {
      immediate: leaseAnalyses.filter(a => a.timeframe === 'immediate').length,
      short: leaseAnalyses.filter(a => a.timeframe === 'short').length,
      medium: leaseAnalyses.filter(a => a.timeframe === 'medium').length,
      long: leaseAnalyses.filter(a => a.timeframe === 'long').length
    };

    return {
      riskDistribution: Object.keys(riskDistribution).map(level => ({
        level,
        percentage: Math.round(riskDistribution[level])
      })),
      timeframeDistribution,
      insights: this.generatePortfolioInsights(riskDistribution, timeframeDistribution)
    };
  }

  /**
   * Generate insights from portfolio trends
   */
  generatePortfolioInsights(riskDistribution, timeframeDistribution) {
    const insights = [];

    if (riskDistribution.high > 30) {
      insights.push('High-risk portfolio: Consider comprehensive retention strategy');
    }

    if (timeframeDistribution.immediate + timeframeDistribution.short > 5) {
      insights.push('Multiple leases need immediate attention for renewals');
    }

    if (riskDistribution.low > 70) {
      insights.push('Strong tenant retention - maintain current practices');
    }

    return insights;
  }
}

module.exports = TurnoverPredictorService;