const express = require('express');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const TurnoverPredictorService = require('./service');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const turnoverService = new TurnoverPredictorService();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 requests per windowMs
  message: 'Too many AI turnover prediction requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/ai/turnover/predict/:leaseId
 * @desc Predict turnover risk for a specific lease/tenant
 * @access Private (Landlord, Admin)
 */
router.post('/predict/:leaseId', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_TURNOVER_PREDICTOR !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Turnover Predictor feature is not enabled'
      });
    }

    const { leaseId } = req.params;

    if (!leaseId) {
      return res.status(400).json({
        success: false,
        error: 'Lease ID is required'
      });
    }

    // Verify lease ownership for landlords
    if (req.user.role === 'LANDLORD') {
      const lease = await turnoverService.prisma.lease.findUnique({
        where: { id: leaseId },
        include: { property: true }
      });

      if (!lease) {
        return res.status(404).json({
          success: false,
          error: 'Lease not found'
        });
      }

      if (lease.property.landlordId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only analyze your own properties.'
        });
      }
    }

    const prediction = await turnoverService.predictTenantTurnover(leaseId);

    res.status(200).json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Error in turnover prediction:', error);
    
    if (error.message === 'Lease not found') {
      return res.status(404).json({
        success: false,
        error: 'Lease not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to predict tenant turnover'
    });
  }
});

/**
 * @route POST /api/ai/turnover/portfolio
 * @desc Analyze turnover risk for entire portfolio
 * @access Private (Landlord, Admin)
 */
router.post('/portfolio', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_TURNOVER_PREDICTOR !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Turnover Predictor feature is not enabled'
      });
    }

    const { landlordId } = req.body;

    // If landlordId not provided, use current user's ID (for landlord users)
    const targetLandlordId = landlordId || req.user.id;

    // Admin can analyze any landlord's portfolio, landlords can only analyze their own
    if (req.user.role !== 'ADMIN' && targetLandlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only analyze your own portfolio.'
      });
    }

    const portfolioAnalysis = await turnoverService.analyzePortfolioTurnover(targetLandlordId);

    res.status(200).json({
      success: true,
      data: portfolioAnalysis
    });

  } catch (error) {
    console.error('Error in portfolio turnover analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio turnover risk'
    });
  }
});

/**
 * @route GET /api/ai/turnover/dashboard/:landlordId
 * @desc Get turnover risk dashboard for landlord
 * @access Private (Landlord, Admin)
 */
router.get('/dashboard/:landlordId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { landlordId } = req.params;

    // Landlords can only access their own dashboard
    if (req.user.role !== 'ADMIN' && landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own dashboard.'
      });
    }

    // Get basic lease statistics
    const leaseStats = await turnoverService.prisma.lease.aggregate({
      where: {
        property: { landlordId },
        status: 'ACTIVE'
      },
      _count: { id: true }
    });

    // Get leases expiring soon (next 90 days)
    const expiringLeases = await turnoverService.prisma.lease.findMany({
      where: {
        property: { landlordId },
        status: 'ACTIVE',
        endDate: {
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      },
      include: {
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { title: true } }
      },
      orderBy: { endDate: 'asc' }
    });

    // Get recent maintenance tickets (potential risk indicator)
    const recentMaintenanceCount = await turnoverService.prisma.maintenanceTicket.aggregate({
      where: {
        property: { landlordId },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: { id: true }
    });

    // Calculate quick insights
    const insights = [];
    
    if (expiringLeases.length > 0) {
      insights.push({
        type: 'expiring_leases',
        priority: 'high',
        title: 'Leases Expiring Soon',
        value: expiringLeases.length,
        description: `${expiringLeases.length} lease${expiringLeases.length === 1 ? '' : 's'} expiring in next 90 days`
      });
    }

    if (recentMaintenanceCount._count.id > 0) {
      insights.push({
        type: 'maintenance_issues',
        priority: 'medium',
        title: 'Active Maintenance Issues',
        value: recentMaintenanceCount._count.id,
        description: `${recentMaintenanceCount._count.id} open maintenance ticket${recentMaintenanceCount._count.id === 1 ? '' : 's'}`
      });
    }

    insights.push({
      type: 'total_leases',
      priority: 'info',
      title: 'Active Leases',
      value: leaseStats._count.id,
      description: `${leaseStats._count.id} active lease${leaseStats._count.id === 1 ? '' : 's'} in portfolio`
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActiveLeases: leaseStats._count.id,
          expiringIn90Days: expiringLeases.length,
          activeMaintenance: recentMaintenanceCount._count.id
        },
        expiringLeases: expiringLeases.map(lease => ({
          leaseId: lease.id,
          tenant: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          property: lease.property.title,
          endDate: lease.endDate,
          daysUntilExpiry: Math.ceil((new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        })),
        insights,
        actionItems: [
          {
            priority: 'high',
            title: 'Review Expiring Leases',
            description: 'Contact tenants with leases expiring in the next 60 days to discuss renewal options.',
            action: 'schedule_renewals'
          },
          {
            priority: 'medium',
            title: 'Run Turnover Risk Analysis',
            description: 'Use AI to analyze which tenants are most likely to not renew their leases.',
            action: 'run_analysis'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching turnover dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch turnover dashboard'
    });
  }
});

/**
 * @route GET /api/ai/turnover/risk-factors/:leaseId
 * @desc Get detailed risk factors for a specific lease
 * @access Private (Landlord, Admin)
 */
router.get('/risk-factors/:leaseId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { leaseId } = req.params;

    if (!leaseId) {
      return res.status(400).json({
        success: false,
        error: 'Lease ID is required'
      });
    }

    // Get lease and verify ownership
    const lease = await turnoverService.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
        property: {
          include: { landlord: true }
        },
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 12
        }
      }
    });

    if (!lease) {
      return res.status(404).json({
        success: false,
        error: 'Lease not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'ADMIN' && lease.property.landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own properties.'
      });
    }

    // Get maintenance tickets
    const maintenanceTickets = await turnoverService.prisma.maintenanceTicket.findMany({
      where: {
        propertyId: lease.propertyId,
        tenantId: lease.tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate risk factors (without AI prediction)
    const riskFactors = await turnoverService.calculateRiskFactors(lease, maintenanceTickets);

    res.status(200).json({
      success: true,
      data: {
        lease: {
          id: lease.id,
          tenant: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          property: lease.property.title,
          startDate: lease.startDate,
          endDate: lease.endDate,
          monthlyRent: lease.monthlyRent,
          status: lease.status
        },
        riskFactors
      }
    });

  } catch (error) {
    console.error('Error fetching risk factors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch risk factors'
    });
  }
});

/**
 * @route GET /api/ai/turnover/interventions/:leaseId
 * @desc Get intervention recommendations for a lease
 * @access Private (Landlord, Admin)
 */
router.get('/interventions/:leaseId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { leaseId } = req.params;

    if (!leaseId) {
      return res.status(400).json({
        success: false,
        error: 'Lease ID is required'
      });
    }

    // Verify lease ownership
    if (req.user.role === 'LANDLORD') {
      const lease = await turnoverService.prisma.lease.findUnique({
        where: { id: leaseId },
        include: { property: true }
      });

      if (!lease) {
        return res.status(404).json({
          success: false,
          error: 'Lease not found'
        });
      }

      if (lease.property.landlordId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own properties.'
        });
      }
    }

    // Get full turnover prediction (includes interventions)
    const prediction = await turnoverService.predictTenantTurnover(leaseId);

    res.status(200).json({
      success: true,
      data: {
        leaseId,
        riskLevel: prediction.prediction.turnoverRisk,
        interventions: prediction.interventions,
        retentionStrategies: prediction.recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching interventions:', error);
    
    if (error.message === 'Lease not found') {
      return res.status(404).json({
        success: false,
        error: 'Lease not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch intervention recommendations'
    });
  }
});

module.exports = router;