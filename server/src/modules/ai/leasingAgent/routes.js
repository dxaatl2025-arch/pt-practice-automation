const express = require('express');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const LeasingAgentService = require('./service');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const leasingService = new LeasingAgentService();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/ai/leasing/lead
 * @desc Create lead and start AI conversation
 * @access Public (with rate limiting)
 */
router.post('/lead', aiRateLimit, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_LEASING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Leasing feature is not enabled'
      });
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      message,
      source = 'website'
    } = req.body;

    // Validation
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Create/update lead and generate initial AI response
    const lead = await leasingService.captureLeadInfo({
      email,
      firstName,
      lastName,
      phone,
      source,
      initialMessage: message
    });

    const aiResponse = await leasingService.generateResponse(lead.id, message);

    res.status(200).json({
      success: true,
      data: {
        leadId: lead.id,
        response: aiResponse.response,
        leadScore: lead.score,
        temperature: lead.temperature,
        matchingProperties: aiResponse.matchingProperties,
        suggestedActions: aiResponse.suggestedActions
      }
    });

  } catch (error) {
    console.error('Error in lead creation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process lead inquiry'
    });
  }
});

/**
 * @route POST /api/ai/leasing/simulate
 * @desc Simulate AI conversation for demo/testing
 * @access Private (Admin only)
 */
router.post('/simulate', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_LEASING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Leasing feature is not enabled'
      });
    }

    const { leadData, messages } = req.body;

    // Validation
    if (!leadData || !leadData.email || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Lead data with email and messages array are required'
      });
    }

    if (messages.length === 0 || messages.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Messages array must contain 1-10 messages'
      });
    }

    const simulation = await leasingService.simulateConversation(leadData, messages);

    res.status(200).json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Error in conversation simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate conversation'
    });
  }
});

/**
 * @route GET /api/ai/leasing/leads/:leadId
 * @desc Get lead details and insights
 * @access Private (Landlord, Admin)
 */
router.get('/leads/:leadId', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID is required'
      });
    }

    const insights = await leasingService.getLeadInsights(leadId);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error fetching lead insights:', error);
    
    if (error.message === 'Lead not found') {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead insights'
    });
  }
});

/**
 * @route POST /api/ai/leasing/leads/:leadId/message
 * @desc Continue conversation with a lead
 * @access Private (Landlord, Admin)
 */
router.post('/leads/:leadId/message', authenticate, authorize(['LANDLORD', 'ADMIN']), aiRateLimit, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { message } = req.body;

    if (!leadId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID and message are required'
      });
    }

    const response = await leasingService.generateResponse(leadId, message);

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing message:', error);
    
    if (error.message === 'Lead not found') {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

/**
 * @route GET /api/ai/leasing/leads
 * @desc Get all leads with filtering options
 * @access Private (Landlord, Admin)
 */
router.get('/leads', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const {
      status,
      temperature,
      minScore,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (temperature) where.temperature = temperature;
    if (minScore) where.score = { gte: parseInt(minScore) };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const orderBy = {};
    orderBy[sortBy] = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [leads, total] = await Promise.all([
      leasingService.prisma.lead.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }),
      leasingService.prisma.lead.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
});

/**
 * @route PUT /api/ai/leasing/leads/:leadId/assign
 * @desc Assign lead to a user
 * @access Private (Landlord, Admin)
 */
router.put('/leads/:leadId/assign', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { leadId } = req.params;
    const { assignedToId } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID is required'
      });
    }

    // If assignedToId is provided, verify user exists
    if (assignedToId) {
      const user = await leasingService.prisma.user.findUnique({
        where: { id: assignedToId }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not found'
        });
      }
    }

    const updatedLead = await leasingService.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: assignedToId || null,
        status: assignedToId ? 'CONTACTED' : 'NEW'
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedLead
    });

  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign lead'
    });
  }
});

/**
 * @route PUT /api/ai/leasing/leads/:leadId/status
 * @desc Update lead status
 * @access Private (Landlord, Admin)
 */
router.put('/leads/:leadId/status', authenticate, authorize(['LANDLORD', 'ADMIN']), async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'APPLICATION_STARTED', 'APPLIED', 'CONVERTED', 'LOST'];

    if (!leadId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID and status are required'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const updatedLead = await leasingService.prisma.lead.update({
      where: { id: leadId },
      data: { status }
    });

    res.status(200).json({
      success: true,
      data: updatedLead
    });

  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead status'
    });
  }
});

module.exports = router;