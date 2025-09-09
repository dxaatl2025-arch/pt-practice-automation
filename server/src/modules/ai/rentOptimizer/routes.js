const express = require('express');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const RentOptimizerService = require('./service');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const rentOptimizerService = new RentOptimizerService();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many AI rent analysis requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/ai/rent/analyze/:propertyId
 * @desc Analyze optimal rent for a specific property
 * @access Private (Landlord, Admin)
 */
router.post('/analyze/:propertyId', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_RENT_OPTIMIZER !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Rent Optimizer feature is not enabled'
      });
    }

    const { propertyId } = req.params;
    const { goal = 'maximize_revenue', includeComparables = true } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    // Validate goal parameter
    const validGoals = ['maximize_revenue', 'maintain_occupancy', 'balance_both'];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: `Invalid goal. Valid goals: ${validGoals.join(', ')}`
      });
    }

    const analysis = await rentOptimizerService.analyzePropertyRent(propertyId, {
      goal,
      includeComparables
    });

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error in rent analysis:', error);
    
    if (error.message === 'Property not found') {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze property rent'
    });
  }
});

/**
 * @route POST /api/ai/rent/portfolio
 * @desc Analyze optimal rent for all properties in a portfolio
 * @access Private (Landlord, Admin)
 */
router.post('/portfolio', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_RENT_OPTIMIZER !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Rent Optimizer feature is not enabled'
      });
    }

    const { landlordId, goal = 'maximize_revenue' } = req.body;

    // If landlordId not provided, use current user's ID (for landlord users)
    const targetLandlordId = landlordId || req.user.id;

    // Admin can analyze any landlord's portfolio, landlords can only analyze their own
    if (req.user.role !== 'ADMIN' && targetLandlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only analyze your own properties.'
      });
    }

    const validGoals = ['maximize_revenue', 'maintain_occupancy', 'balance_both'];
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: `Invalid goal. Valid goals: ${validGoals.join(', ')}`
      });
    }

    const portfolioAnalysis = await rentOptimizerService.analyzePortfolio(targetLandlordId, {
      goal
    });

    res.status(200).json({
      success: true,
      data: portfolioAnalysis
    });

  } catch (error) {
    console.error('Error in portfolio analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio rent optimization'
    });
  }
});

/**
 * @route GET /api/ai/rent/market/:propertyId
 * @desc Get market data and comparables for a property without full AI analysis
 * @access Private (Landlord, Admin)
 */
router.get('/market/:propertyId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    // Get the property
    const property = await rentOptimizerService.prisma.property.findUnique({
      where: { id: propertyId },
      include: { landlord: true }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership (landlords can only access their own properties)
    if (req.user.role !== 'ADMIN' && property.landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own properties.'
      });
    }

    // Get market data and comparables
    const [marketData, comparables] = await Promise.all([
      rentOptimizerService.getMarketData(property),
      rentOptimizerService.findComparableProperties(property)
    ]);

    res.status(200).json({
      success: true,
      data: {
        property: {
          id: property.id,
          title: property.title,
          currentRent: property.rentAmount,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.squareFeet,
          address: rentOptimizerService.formatAddress(property)
        },
        marketData,
        comparables: comparables.slice(0, 10) // Top 10 comparables
      }
    });

  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
});

/**
 * @route GET /api/ai/rent/insights/dashboard
 * @desc Get rent optimization dashboard insights for landlord
 * @access Private (Landlord, Admin)
 */
router.get('/insights/dashboard', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const landlordId = req.user.role === 'ADMIN' 
      ? req.query.landlordId || req.user.id 
      : req.user.id;

    // Get basic portfolio stats
    const properties = await rentOptimizerService.prisma.property.findMany({
      where: {
        landlordId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        rentAmount: true,
        bedrooms: true,
        addressCity: true,
        addressState: true,
        isAvailable: true,
        createdAt: true
      }
    });

    if (properties.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          portfolioStats: {
            totalProperties: 0,
            totalRent: 0,
            averageRent: 0,
            occupancyRate: 0
          },
          quickInsights: [],
          actionItems: []
        }
      });
    }

    // Calculate basic stats
    const totalRent = properties.reduce((sum, p) => sum + (p.rentAmount || 0), 0);
    const occupiedProperties = properties.filter(p => !p.isAvailable).length;
    const occupancyRate = (occupiedProperties / properties.length) * 100;

    // Group by market (city)
    const markets = {};
    properties.forEach(p => {
      const market = `${p.addressCity}, ${p.addressState}`;
      if (!markets[market]) {
        markets[market] = { count: 0, totalRent: 0 };
      }
      markets[market].count++;
      markets[market].totalRent += p.rentAmount || 0;
    });

    // Generate quick insights
    const quickInsights = [
      {
        type: 'portfolio_size',
        title: 'Portfolio Overview',
        value: `${properties.length} properties generating $${Math.round(totalRent).toLocaleString()}/month`,
        trend: 'neutral'
      },
      {
        type: 'occupancy',
        title: 'Occupancy Rate',
        value: `${Math.round(occupancyRate)}%`,
        trend: occupancyRate >= 90 ? 'positive' : occupancyRate >= 80 ? 'neutral' : 'negative'
      },
      {
        type: 'markets',
        title: 'Market Diversification',
        value: `Active in ${Object.keys(markets).length} market${Object.keys(markets).length === 1 ? '' : 's'}`,
        trend: 'neutral'
      }
    ];

    // Generate action items
    const actionItems = [];
    
    if (occupancyRate < 85) {
      actionItems.push({
        priority: 'high',
        title: 'Low Occupancy Alert',
        description: `Occupancy rate is ${Math.round(occupancyRate)}%. Consider rent optimization to improve competitiveness.`,
        action: 'Run portfolio rent analysis'
      });
    }

    if (properties.some(p => !p.rentAmount)) {
      actionItems.push({
        priority: 'medium',
        title: 'Missing Rent Data',
        description: 'Some properties are missing rent amounts. Update property data for better analysis.',
        action: 'Update property information'
      });
    }

    actionItems.push({
      priority: 'low',
      title: 'Regular Rent Review',
      description: 'Run quarterly rent optimization analysis to maximize revenue.',
      action: 'Schedule rent analysis'
    });

    res.status(200).json({
      success: true,
      data: {
        portfolioStats: {
          totalProperties: properties.length,
          totalRent: Math.round(totalRent),
          averageRent: Math.round(totalRent / properties.length),
          occupancyRate: Math.round(occupancyRate)
        },
        marketBreakdown: Object.keys(markets).map(market => ({
          market,
          properties: markets[market].count,
          totalRent: Math.round(markets[market].totalRent),
          averageRent: Math.round(markets[market].totalRent / markets[market].count)
        })),
        quickInsights,
        actionItems
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard insights'
    });
  }
});

/**
 * @route GET /api/ai/rent/history/:propertyId
 * @desc Get rent history and trends for a property
 * @access Private (Landlord, Admin)
 */
router.get('/history/:propertyId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    // Get property and verify ownership
    const property = await rentOptimizerService.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        leases: {
          orderBy: { startDate: 'asc' },
          include: {
            tenant: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'ADMIN' && property.landlordId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own properties.'
      });
    }

    // Build rent history from leases
    const rentHistory = property.leases.map(lease => ({
      startDate: lease.startDate,
      endDate: lease.endDate,
      monthlyRent: lease.monthlyRent,
      tenant: lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : 'Unknown',
      status: lease.status,
      duration: Math.ceil((new Date(lease.endDate) - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30)) // months
    }));

    // Calculate trends
    let trend = 'stable';
    if (rentHistory.length > 1) {
      const oldestRent = rentHistory[0].monthlyRent;
      const newestRent = rentHistory[rentHistory.length - 1].monthlyRent;
      const changePercent = ((newestRent - oldestRent) / oldestRent) * 100;
      
      if (changePercent > 5) trend = 'increasing';
      else if (changePercent < -5) trend = 'decreasing';
    }

    res.status(200).json({
      success: true,
      data: {
        property: {
          id: property.id,
          title: property.title,
          currentRent: property.rentAmount
        },
        rentHistory,
        trends: {
          direction: trend,
          totalLeases: rentHistory.length,
          averageRent: rentHistory.length > 0 
            ? Math.round(rentHistory.reduce((sum, h) => sum + h.monthlyRent, 0) / rentHistory.length)
            : 0,
          rentRange: rentHistory.length > 0 
            ? {
                min: Math.min(...rentHistory.map(h => h.monthlyRent)),
                max: Math.max(...rentHistory.map(h => h.monthlyRent))
              }
            : { min: 0, max: 0 }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching rent history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rent history'
    });
  }
});

module.exports = router;