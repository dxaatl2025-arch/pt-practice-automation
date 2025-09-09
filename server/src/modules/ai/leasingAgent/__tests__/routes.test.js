const request = require('supertest');
const express = require('express');
const routes = require('../routes');
const LeasingAgentService = require('../service');

// Mock the service
jest.mock('../service');

// Mock auth middleware
jest.mock('../../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: 'user1', role: 'LANDLORD' };
    next();
  }),
  authorize: jest.fn((roles) => (req, res, next) => next())
}));

describe('AI Leasing Agent Routes', () => {
  let app;
  let mockService;

  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/ai/leasing', routes);

    // Setup service mock
    mockService = {
      captureLeadInfo: jest.fn(),
      generateResponse: jest.fn(),
      simulateConversation: jest.fn(),
      getLeadInsights: jest.fn(),
      prisma: {
        lead: {
          findMany: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
          findUnique: jest.fn()
        },
        user: {
          findUnique: jest.fn()
        }
      }
    };

    LeasingAgentService.mockImplementation(() => mockService);

    // Clear environment
    delete process.env.AI_LEASING;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /lead', () => {
    beforeEach(() => {
      process.env.AI_LEASING = 'true';
    });

    it('should create lead and return AI response', async () => {
      const leadData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        message: 'Looking for a 2BR apartment'
      };

      const mockLead = {
        id: 'lead1',
        score: 25,
        temperature: 'COLD'
      };

      const mockResponse = {
        response: 'Hi John! I\'d be happy to help you find a 2BR apartment.',
        matchingProperties: [],
        suggestedActions: []
      };

      mockService.captureLeadInfo.mockResolvedValue(mockLead);
      mockService.generateResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/leasing/lead')
        .send(leadData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leadId).toBe('lead1');
      expect(response.body.data.response).toBe(mockResponse.response);
      expect(response.body.data.leadScore).toBe(25);
      expect(response.body.data.temperature).toBe('COLD');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/ai/leasing/lead')
        .send({
          firstName: 'John'
          // missing email and message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email and message are required');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/ai/leasing/lead')
        .send({
          email: 'invalid-email',
          message: 'Hello'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should return 501 when feature is disabled', async () => {
      process.env.AI_LEASING = 'false';

      const response = await request(app)
        .post('/api/ai/leasing/lead')
        .send({
          email: 'test@example.com',
          message: 'Hello'
        });

      expect(response.status).toBe(501);
      expect(response.body.error).toBe('AI Leasing feature is not enabled');
    });

    it('should handle service errors', async () => {
      mockService.captureLeadInfo.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/ai/leasing/lead')
        .send({
          email: 'test@example.com',
          message: 'Hello'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process lead inquiry');
    });
  });

  describe('POST /simulate', () => {
    beforeEach(() => {
      process.env.AI_LEASING = 'true';
    });

    it('should simulate conversation for admin users', async () => {
      const simulationData = {
        leadData: {
          email: 'test@example.com',
          firstName: 'John'
        },
        messages: [
          'Hello',
          'I need a 2BR apartment'
        ]
      };

      const mockSimulation = {
        leadId: 'lead1',
        conversation: [
          { user: 'Hello', sienna: 'Hi! How can I help?' },
          { user: 'I need a 2BR apartment', sienna: 'I can help with that!' }
        ],
        finalScore: 45,
        finalTemperature: 'WARM'
      };

      mockService.simulateConversation.mockResolvedValue(mockSimulation);

      const response = await request(app)
        .post('/api/ai/leasing/simulate')
        .send(simulationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation).toHaveLength(2);
      expect(response.body.data.finalScore).toBe(45);
    });

    it('should validate simulation data', async () => {
      const response = await request(app)
        .post('/api/ai/leasing/simulate')
        .send({
          leadData: { email: 'test@example.com' }
          // missing messages
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Lead data with email and messages array are required');
    });

    it('should validate messages array length', async () => {
      const response = await request(app)
        .post('/api/ai/leasing/simulate')
        .send({
          leadData: { email: 'test@example.com' },
          messages: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Messages array must contain 1-10 messages');
    });
  });

  describe('GET /leads/:leadId', () => {
    it('should return lead insights', async () => {
      const mockInsights = {
        lead: {
          id: 'lead1',
          email: 'test@example.com',
          score: 75
        },
        insights: {
          qualificationLevel: 'Highly Qualified',
          engagementLevel: 'Engaged',
          interests: ['Pet-Friendly', 'Parking'],
          nextBestAction: 'Schedule property viewing'
        },
        topProperties: []
      };

      mockService.getLeadInsights.mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/api/ai/leasing/leads/lead1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.insights.qualificationLevel).toBe('Highly Qualified');
    });

    it('should return 404 for non-existent lead', async () => {
      mockService.getLeadInsights.mockRejectedValue(new Error('Lead not found'));

      const response = await request(app)
        .get('/api/ai/leasing/leads/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Lead not found');
    });
  });

  describe('POST /leads/:leadId/message', () => {
    it('should process message and return AI response', async () => {
      const mockResponse = {
        response: 'That sounds great! Let me find some options for you.',
        matchingProperties: [],
        suggestedActions: []
      };

      mockService.generateResponse.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/leasing/leads/lead1/message')
        .send({
          message: 'I need something pet-friendly'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(mockResponse.response);
    });

    it('should validate message parameter', async () => {
      const response = await request(app)
        .post('/api/ai/leasing/leads/lead1/message')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Lead ID and message are required');
    });
  });

  describe('GET /leads', () => {
    it('should return paginated leads list', async () => {
      const mockLeads = [
        { id: 'lead1', email: 'test1@example.com', score: 75 },
        { id: 'lead2', email: 'test2@example.com', score: 45 }
      ];

      mockService.prisma.lead.findMany.mockResolvedValue(mockLeads);
      mockService.prisma.lead.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/ai/leasing/leads');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leads).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter leads by status', async () => {
      mockService.prisma.lead.findMany.mockResolvedValue([]);
      mockService.prisma.lead.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/ai/leasing/leads?status=QUALIFIED&temperature=HOT&minScore=50');

      expect(response.status).toBe(200);
      expect(mockService.prisma.lead.findMany).toHaveBeenCalledWith({
        where: {
          status: 'QUALIFIED',
          temperature: 'HOT',
          score: { gte: 50 }
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
    });
  });

  describe('PUT /leads/:leadId/assign', () => {
    it('should assign lead to user', async () => {
      mockService.prisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        firstName: 'Agent',
        lastName: 'Smith'
      });

      const mockUpdatedLead = {
        id: 'lead1',
        assignedToId: 'user1',
        status: 'CONTACTED',
        assignedTo: {
          id: 'user1',
          firstName: 'Agent',
          lastName: 'Smith'
        }
      };

      mockService.prisma.lead.update.mockResolvedValue(mockUpdatedLead);

      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/assign')
        .send({
          assignedToId: 'user1'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedToId).toBe('user1');
      expect(response.body.data.status).toBe('CONTACTED');
    });

    it('should validate assigned user exists', async () => {
      mockService.prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/assign')
        .send({
          assignedToId: 'nonexistent'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Assigned user not found');
    });

    it('should unassign lead when no assignedToId provided', async () => {
      const mockUpdatedLead = {
        id: 'lead1',
        assignedToId: null,
        status: 'NEW'
      };

      mockService.prisma.lead.update.mockResolvedValue(mockUpdatedLead);

      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/assign')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.assignedToId).toBe(null);
      expect(response.body.data.status).toBe('NEW');
    });
  });

  describe('PUT /leads/:leadId/status', () => {
    it('should update lead status', async () => {
      const mockUpdatedLead = {
        id: 'lead1',
        status: 'QUALIFIED'
      };

      mockService.prisma.lead.update.mockResolvedValue(mockUpdatedLead);

      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/status')
        .send({
          status: 'QUALIFIED'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('QUALIFIED');
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/status')
        .send({
          status: 'INVALID_STATUS'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should require status parameter', async () => {
      const response = await request(app)
        .put('/api/ai/leasing/leads/lead1/status')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Lead ID and status are required');
    });
  });
});