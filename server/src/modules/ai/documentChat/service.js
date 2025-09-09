const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class DocumentChatService {
  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Upload and process a document
   */
  async uploadDocument(userId, file, propertyId = null) {
    try {
      // Create document record
      const document = await this.prisma.document.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageUrl: file.location || file.path,
          uploadedById: userId,
          propertyId: propertyId,
          metadata: {
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Extract text content if applicable
      if (this.isTextExtractable(file.mimetype)) {
        const extractedText = await this.extractText(file);
        await this.prisma.document.update({
          where: { id: document.id },
          data: { processedText: extractedText }
        });
      }

      return document;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Search documents using AI
   */
  async searchDocuments(userId, query, propertyId = null) {
    try {
      // Get user's documents
      const whereClause = {
        uploadedById: userId
      };
      
      if (propertyId) {
        whereClause.propertyId = propertyId;
      }

      const documents = await this.prisma.document.findMany({
        where: whereClause,
        include: {
          property: {
            select: { title: true, id: true }
          }
        }
      });

      if (documents.length === 0) {
        return {
          results: [],
          summary: "No documents found to search through."
        };
      }

      // Create context from document texts
      const context = documents
        .filter(doc => doc.processedText)
        .map(doc => `Document: ${doc.originalName}\nContent: ${doc.processedText.substring(0, 2000)}`)
        .join('\n\n');

      if (!context) {
        return {
          results: [],
          summary: "No text content available in your documents for searching."
        };
      }

      // Use AI to search and summarize
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a document search assistant. Search through the provided documents and answer the user's query. Provide specific references to document names when possible.`
          },
          {
            role: 'user',
            content: `Search Query: ${query}\n\nDocument Context:\n${context}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        results: documents.map(doc => ({
          id: doc.id,
          name: doc.originalName,
          property: doc.property?.title || 'No Property',
          relevanceScore: this.calculateRelevance(query, doc.processedText || '')
        })).sort((a, b) => b.relevanceScore - a.relevanceScore),
        summary: response.choices[0].message.content,
        query: query
      };

    } catch (error) {
      console.error('Document search failed:', error);
      throw new Error('Failed to search documents');
    }
  }

  /**
   * Create or continue a chat session
   */
  async chat(userId, message, sessionId = null) {
    try {
      let session;

      if (sessionId) {
        // Get existing session
        session = await this.prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 20 // Last 20 messages for context
            }
          }
        });

        if (!session || session.userId !== userId) {
          throw new Error('Chat session not found or access denied');
        }
      } else {
        // Create new session
        session = await this.prisma.chatSession.create({
          data: {
            userId: userId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
          },
          include: { messages: [] }
        });
      }

      // Add user message
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message
        }
      });

      // Get user's documents for context
      const documents = await this.prisma.document.findMany({
        where: { uploadedById: userId },
        select: {
          originalName: true,
          processedText: true,
          property: {
            select: { title: true }
          }
        },
        take: 10 // Most recent documents
      });

      // Prepare conversation context
      const conversationHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: message
      });

      // Create document context
      const documentContext = documents
        .filter(doc => doc.processedText)
        .map(doc => `Document: ${doc.originalName} (${doc.property?.title || 'No Property'})\nContent: ${doc.processedText.substring(0, 1000)}`)
        .join('\n\n');

      // Generate AI response
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for PropertyPulse, a property management platform. Help users with questions about their properties, leases, documents, and general property management tasks. Use the provided document context when relevant.

Available Document Context:
${documentContext || 'No documents available'}

Be helpful, professional, and specific when referencing documents or properties.`
          },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content;

      // Save AI response
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: aiResponse
        }
      });

      return {
        sessionId: session.id,
        message: aiResponse,
        conversationTitle: session.title
      };

    } catch (error) {
      console.error('Chat failed:', error);
      throw new Error('Failed to process chat message');
    }
  }

  /**
   * Get user's chat sessions
   */
  async getChatSessions(userId, limit = 20) {
    return await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
  }

  /**
   * Get chat session with messages
   */
  async getChatSession(userId, sessionId) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session || session.userId !== userId) {
      throw new Error('Chat session not found or access denied');
    }

    return session;
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId, propertyId = null) {
    const whereClause = { uploadedById: userId };
    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    return await this.prisma.document.findMany({
      where: whereClause,
      include: {
        property: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Helper methods
  isTextExtractable(mimeType) {
    const extractableTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return extractableTypes.includes(mimeType);
  }

  async extractText(file) {
    // Simplified text extraction - in production, use proper PDF/document parsers
    if (file.mimetype === 'text/plain') {
      return file.buffer ? file.buffer.toString() : 'Text file uploaded';
    }
    
    // For other types, return placeholder - implement actual extraction as needed
    return `${file.originalname} - Text extraction not implemented for ${file.mimetype}`;
  }

  calculateRelevance(query, text) {
    if (!text) return 0;
    
    const queryWords = query.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    let matches = 0;
    
    queryWords.forEach(word => {
      if (textWords.includes(word)) matches++;
    });
    
    return (matches / queryWords.length) * 100;
  }
}

module.exports = DocumentChatService;