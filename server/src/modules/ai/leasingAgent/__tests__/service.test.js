const LeasingAgentService = require('../service');
const { PrismaClient } = require('@prisma/client');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    lead: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    property: {
      findMany: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }))
}));

describe('LeasingAgentService', () => {
  let service;
  let mockPrisma;
  let mockOpenAI;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    service = new LeasingAgentService();
    mockPrisma = service.prisma;
    mockOpenAI = service.openai;
  });

  describe('captureLeadInfo', () => {
    it('should create new lead with basic information', async () => {
      const leadData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0123',
        source: 'website',
        initialMessage: 'Looking for a 2BR apartment under $2000'
      };

      // Mock OpenAI response for qualification extraction
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              budgetMax: 2000,
              bedrooms: 2
            })
          }
        }]
      });

      // Mock Prisma upsert
      const mockLead = {
        id: 'lead1',
        email: 'test@example.com',
        score: 10,
        temperature: 'COLD'
      };
      mockPrisma.lead.upsert.mockResolvedValue(mockLead);

      // Mock calculateLeadScore
      const updatedLead = { ...mockLead, score: 25 };
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue(updatedLead);

      const result = await service.captureLeadInfo(leadData);

      expect(mockPrisma.lead.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-0123',
          source: 'website',
          budgetMax: 2000,
          bedrooms: 2
        }),
        create: expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '555-0123',
          source: 'website',
          budgetMax: 2000,
          bedrooms: 2
        })
      });

      expect(result.score).toBe(25);
    });

    it('should handle OpenAI extraction errors gracefully', async () => {
      const leadData = {
        email: 'test@example.com',
        initialMessage: 'Hello'
      };

      // Mock OpenAI error
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI error'));

      // Mock Prisma responses
      const mockLead = { id: 'lead1', score: 10 };
      mockPrisma.lead.upsert.mockResolvedValue(mockLead);
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue(mockLead);

      const result = await service.captureLeadInfo(leadData);

      expect(result).toBeDefined();
      // Should still create lead even if qualification extraction fails
      expect(mockPrisma.lead.upsert).toHaveBeenCalled();
    });
  });

  describe('extractQualificationFromMessage', () => {
    it('should extract budget and bedroom information', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              budgetMax: 2000,
              bedrooms: 2,
              desiredArea: 'downtown'
            })
          }
        }]
      });

      const result = await service.extractQualificationFromMessage('Looking for a 2BR under $2000 in downtown');

      expect(result).toEqual({
        budgetMax: 2000,
        bedrooms: 2,
        desiredArea: 'downtown'
      });
    });

    it('should handle invalid JSON response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      const result = await service.extractQualificationFromMessage('Hello');

      expect(result).toEqual({});
    });
  });

  describe('generateResponse', () => {
    it('should generate AI response for existing lead', async () => {
      const leadId = 'lead1';
      const userMessage = 'What properties do you have?';

      // Mock lead data
      const mockLead = {
        id: leadId,
        firstName: 'John',
        budgetMax: 2000,
        bedrooms: 2,
        conversationHistory: []
      };
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);

      // Mock matching properties
      const mockProperties = [
        { id: 'prop1', title: 'Nice Apartment', rentAmount: 1800 },
        { id: 'prop2', title: 'Downtown Loft', rentAmount: 1900 }
      ];
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      // Mock OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'I have several great properties that match your criteria!'
          }
        }]
      });

      // Mock conversation update
      mockPrisma.lead.update.mockResolvedValue(mockLead);

      const result = await service.generateResponse(leadId, userMessage);

      expect(result.response).toBe('I have several great properties that match your criteria!');
      expect(result.matchingProperties).toHaveLength(2);
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: expect.objectContaining({
          lastInteraction: expect.any(Date),
          totalInteractions: { increment: 1 }
        })
      });
    });

    it('should throw error for non-existent lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.generateResponse('nonexistent', 'Hello'))
        .rejects.toThrow('Lead not found');
    });
  });

  describe('calculateLeadScore', () => {
    it('should calculate score based on qualification and engagement', async () => {
      const mockLead = {
        id: 'lead1',
        budgetMax: 2000,
        bedrooms: 2,
        desiredArea: 'downtown',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0123',
        totalInteractions: 3,
        lastInteraction: new Date()
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      
      const updatedLead = { ...mockLead, score: 65, temperature: 'WARM' };
      mockPrisma.lead.update.mockResolvedValue(updatedLead);

      const result = await service.calculateLeadScore('lead1');

      expect(result.score).toBeGreaterThan(50);
      expect(result.temperature).toBe('WARM');
    });

    it('should assign HOT temperature for high scores', async () => {
      const mockLead = {
        id: 'lead1',
        budgetMax: 2000,
        budgetMin: 1500,
        bedrooms: 2,
        desiredArea: 'downtown',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0123',
        moveInDate: new Date(),
        totalInteractions: 5,
        lastInteraction: new Date()
      };

      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      
      const updatedLead = { ...mockLead, score: 85, temperature: 'HOT' };
      mockPrisma.lead.update.mockResolvedValue(updatedLead);

      const result = await service.calculateLeadScore('lead1');

      expect(result.temperature).toBe('HOT');
    });
  });

  describe('findMatchingProperties', () => {
    it('should find properties within budget range', async () => {
      const mockLead = {
        budgetMin: 1500,
        budgetMax: 2000,
        bedrooms: 2
      };

      const mockProperties = [
        { id: 'prop1', rentAmount: 1800, bedrooms: 2 },
        { id: 'prop2', rentAmount: 1900, bedrooms: 2 }
      ];

      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.findMatchingProperties(mockLead);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          isAvailable: true,
          rentAmount: {
            gte: 1500,
            lte: 2000
          },
          bedrooms: 2
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      expect(result).toHaveLength(2);
    });

    it('should handle area-based search', async () => {
      const mockLead = {
        desiredArea: 'downtown'
      };

      mockPrisma.property.findMany.mockResolvedValue([]);

      await service.findMatchingProperties(mockLead);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          isAvailable: true,
          OR: [
            { addressCity: { contains: 'downtown', mode: 'insensitive' } },
            { addressStreet: { contains: 'downtown', mode: 'insensitive' } },
            { description: { contains: 'downtown', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    });
  });

  describe('simulateConversation', () => {
    it('should simulate multi-message conversation', async () => {
      const leadData = {
        email: 'test@example.com',
        firstName: 'John',
        initialMessage: 'Hi'
      };

      const messages = [
        'What properties do you have?',
        'I need 2 bedrooms under $2000'
      ];

      // Mock lead creation
      const mockLead = { id: 'lead1', score: 10, temperature: 'COLD' };
      mockPrisma.lead.upsert.mockResolvedValue(mockLead);
      mockPrisma.lead.findUnique.mockResolvedValue(mockLead);
      mockPrisma.lead.update.mockResolvedValue(mockLead);

      // Mock OpenAI responses
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '{}' } }] // qualification extraction
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'I have several great properties!' } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Let me find 2BR options under $2000!' } }]
        });

      // Mock property search
      mockPrisma.property.findMany.mockResolvedValue([
        { id: 'prop1', title: 'Nice Apartment' }
      ]);

      const result = await service.simulateConversation(leadData, messages);

      expect(result.conversation).toHaveLength(2);
      expect(result.conversation[0].user).toBe('What properties do you have?');
      expect(result.conversation[0].sienna).toBe('I have several great properties!');
      expect(result.leadId).toBe('lead1');
    });
  });

  describe('assessment methods', () => {
    it('should assess qualification level correctly', () => {
      const highlyQualifiedLead = {
        budgetMin: 1500,
        budgetMax: 2000,
        bedrooms: 2,
        bathrooms: 1,
        desiredArea: 'downtown',
        moveInDate: new Date(),
        phone: '555-0123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = service.assessQualificationLevel(highlyQualifiedLead);
      expect(result).toBe('Highly Qualified');

      const poorlyQualifiedLead = {
        firstName: 'John'
      };

      const result2 = service.assessQualificationLevel(poorlyQualifiedLead);
      expect(result2).toBe('Needs Qualification');
    });

    it('should assess engagement level correctly', () => {
      const highlyEngagedLead = {
        totalInteractions: 6,
        lastInteraction: new Date()
      };

      const result = service.assessEngagementLevel(highlyEngagedLead);
      expect(result).toBe('Highly Engaged');

      const lowEngagementLead = {
        totalInteractions: 1,
        lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      };

      const result2 = service.assessEngagementLevel(lowEngagementLead);
      expect(result2).toBe('Low Engagement');
    });

    it('should extract interests from conversation history', () => {
      const conversationHistory = [
        { content: 'I need a pet-friendly apartment' },
        { content: 'Do you have parking?' },
        { content: 'I prefer something quiet and peaceful' }
      ];

      const result = service.extractInterests(conversationHistory);
      expect(result).toContain('Pet-Friendly');
      expect(result).toContain('Parking');
      expect(result).toContain('Quiet Area');
    });

    it('should suggest next actions appropriately', () => {
      const hotLead = {
        temperature: 'HOT',
        assignedTo: null
      };

      const result = service.suggestNextAction(hotLead);
      expect(result).toBe('Assign to human agent immediately');

      const qualifiedLead = {
        score: 60,
        totalInteractions: 4,
        temperature: 'WARM'
      };

      const result2 = service.suggestNextAction(qualifiedLead);
      expect(result2).toBe('Schedule property viewing');
    });
  });
});