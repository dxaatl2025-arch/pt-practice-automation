const DocumentChatService = require('../service');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('openai');

const mockPrisma = {
  document: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  chatSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  chatMessage: {
    create: jest.fn()
  }
};

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

describe('DocumentChatService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    PrismaClient.mockImplementation(() => mockPrisma);
    require('openai').mockImplementation(() => mockOpenAI);
    service = new DocumentChatService();
  });

  describe('uploadDocument', () => {
    it('should successfully upload a document', async () => {
      const mockFile = {
        filename: 'test-doc.pdf',
        originalname: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        location: '/uploads/test-doc.pdf'
      };

      const mockDocument = {
        id: 'doc-123',
        filename: mockFile.filename,
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
        size: mockFile.size,
        storageUrl: mockFile.location,
        createdAt: new Date()
      };

      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument('user-123', mockFile, 'property-123');

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          filename: mockFile.filename,
          originalName: mockFile.originalname,
          mimeType: mockFile.mimetype,
          size: mockFile.size,
          storageUrl: mockFile.location,
          uploadedById: 'user-123',
          propertyId: 'property-123',
          metadata: expect.any(Object)
        }
      });

      expect(result).toEqual(mockDocument);
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = {
        filename: 'test-doc.pdf',
        originalname: 'Test Document.pdf',
        mimetype: 'application/pdf',
        size: 12345,
        location: '/uploads/test-doc.pdf'
      };

      mockPrisma.document.create.mockRejectedValue(new Error('Database error'));

      await expect(service.uploadDocument('user-123', mockFile))
        .rejects.toThrow('Failed to upload document');
    });
  });

  describe('searchDocuments', () => {
    it('should return empty results when no documents exist', async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.searchDocuments('user-123', 'test query');

      expect(result).toEqual({
        results: [],
        summary: "No documents found to search through."
      });
    });

    it('should search documents with AI when documents exist', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          originalName: 'Lease Agreement.pdf',
          processedText: 'This is a lease agreement for property at 123 Main St...',
          property: { title: 'Main St Property', id: 'prop-1' }
        }
      ];

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Based on your documents, I found information about the lease agreement...'
          }
        }]
      };

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.searchDocuments('user-123', 'lease terms');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      expect(result.summary).toContain('lease agreement');
      expect(result.results).toHaveLength(1);
      expect(result.query).toBe('lease terms');
    });
  });

  describe('chat', () => {
    it('should create new chat session for first message', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        title: 'Hello, how can I help?',
        messages: []
      };

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Hello! I can help you with your property management questions.'
          }
        }]
      };

      mockPrisma.chatSession.create.mockResolvedValue(mockSession);
      mockPrisma.chatMessage.create.mockResolvedValue({});
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.chat('user-123', 'Hello, how can I help?');

      expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          title: 'Hello, how can I help?'
        },
        include: { messages: [] }
      });

      expect(result.sessionId).toBe('session-123');
      expect(result.message).toContain('Hello!');
    });

    it('should continue existing chat session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        title: 'Existing Chat',
        messages: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' }
        ]
      };

      const mockAIResponse = {
        choices: [{
          message: {
            content: 'Here is my response to your follow-up question.'
          }
        }]
      };

      mockPrisma.chatSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.chatMessage.create.mockResolvedValue({});
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse);

      const result = await service.chat('user-123', 'Follow-up question', 'session-123');

      expect(mockPrisma.chatSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20
          }
        }
      });

      expect(result.sessionId).toBe('session-123');
    });

    it('should reject access to other users sessions', async () => {
      mockPrisma.chatSession.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'other-user',
        messages: []
      });

      await expect(service.chat('user-123', 'Message', 'session-123'))
        .rejects.toThrow('Chat session not found or access denied');
    });
  });

  describe('helper methods', () => {
    it('should identify text extractable files correctly', () => {
      expect(service.isTextExtractable('text/plain')).toBe(true);
      expect(service.isTextExtractable('application/pdf')).toBe(true);
      expect(service.isTextExtractable('application/msword')).toBe(true);
      expect(service.isTextExtractable('image/jpeg')).toBe(false);
      expect(service.isTextExtractable('video/mp4')).toBe(false);
    });

    it('should calculate relevance score correctly', () => {
      const score1 = service.calculateRelevance('lease agreement', 'This lease agreement contains important terms');
      const score2 = service.calculateRelevance('rent payment', 'This lease agreement contains important terms');
      
      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBe(100); // Both words match
      expect(score2).toBe(0); // No words match
    });
  });
});