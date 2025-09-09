# Phase 2 + 3 Implementation Guide: AI + Business Features

> **Purpose:** Step-by-step instructions for building AI and business features without breaking existing code.

## Prerequisites

- ✅ Phase 1 completed (applications, payments, uploads, reminders)
- ✅ All existing tests passing
- ✅ Database migrations up to date
- ✅ Feature flag system in place

## Implementation Order

**Phase 2: AI Features (Parts 1-4)**
1. Document Search & AI Chat
2. Smart Property Matching 
3. AI Lease Generation
4. AI Leasing Assistant

**Phase 3: Business Features (Parts 5-8)**
5. Advanced Analytics
6. Multi-tenant Dashboard
7. Affiliate Program
8. Pricing Structure

**Phase 4: Quality Assurance (Part 9)**
9. Testing & Documentation

---

# PHASE 2: AI FEATURES

## Part 1 – Document Search & AI Chat

### Overview
- Implement document upload, processing, and AI-powered search
- Add conversational chat interface for property queries
- Support PDF, images, and text documents

### Step 1.1: Database Schema Updates

```sql
-- Add to schema.prisma
model Document {
  id            String          @id @default(cuid())
  filename      String
  originalName  String
  mimeType      String
  size          Int
  storageUrl    String          // S3 or local path
  processedText String?         // Extracted text content
  metadata      Json?           // OCR results, page count, etc
  
  // Relations
  propertyId    String?
  uploadedById  String
  property      Property?       @relation(fields: [propertyId], references: [id])
  uploadedBy    User            @relation(fields: [uploadedById], references: [id])
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([propertyId])
  @@index([uploadedById])
  @@map("documents")
}

model ChatSession {
  id         String     @id @default(cuid())
  userId     String
  title      String?    @default("New Chat")
  context    Json?      // Conversation context
  messages   ChatMessage[]
  user       User       @relation(fields: [userId], references: [id])
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@index([userId])
  @@map("chat_sessions")
}

model ChatMessage {
  id          String      @id @default(cuid())
  sessionId   String
  role        String      // 'user' | 'assistant' | 'system'
  content     String      @db.Text
  metadata    Json?       // Sources, confidence, etc
  session     ChatSession @relation(fields: [sessionId], references: [id])
  createdAt   DateTime    @default(now())

  @@index([sessionId])
  @@map("chat_messages")
}
```

### Step 1.2: Create Migration

```bash
cd server
npx prisma migrate dev --name add_document_chat_models
```

### Step 1.3: Document Processing Service

**Create: `server/src/modules/ai/services/documentService.js`**

```javascript
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

class DocumentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processDocument(filePath, mimeType) {
    let extractedText = '';

    try {
      if (mimeType === 'application/pdf') {
        extractedText = await this.extractFromPDF(filePath);
      } else if (mimeType.startsWith('image/')) {
        extractedText = await this.extractFromImage(filePath);
      } else if (mimeType.startsWith('text/')) {
        extractedText = await this.extractFromText(filePath);
      }

      // Use OpenAI to enhance and structure the extracted text
      const enhancedText = await this.enhanceText(extractedText);
      
      return {
        rawText: extractedText,
        enhancedText,
        wordCount: extractedText.split(' ').length,
        language: await this.detectLanguage(extractedText)
      };
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  async extractFromPDF(filePath) {
    const fs = require('fs');
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  async extractFromImage(filePath) {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    return text;
  }

  async extractFromText(filePath) {
    const fs = require('fs');
    return fs.readFileSync(filePath, 'utf-8');
  }

  async enhanceText(text) {
    if (!text || text.length < 50) return text;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Clean up and structure the following extracted text. Fix OCR errors, organize sections, but preserve all important information:'
        },
        { role: 'user', content: text }
      ],
      max_tokens: Math.min(4000, text.length * 2)
    });

    return response.choices[0].message.content;
  }

  async detectLanguage(text) {
    // Simple language detection - can be enhanced
    if (/[^\x00-\x7F]/.test(text)) return 'non-english';
    return 'english';
  }

  async searchDocuments(query, propertyId = null, userId) {
    // Implement semantic search using OpenAI embeddings
    const embedding = await this.getEmbedding(query);
    
    // For now, use simple text search - can be enhanced with vector DB
    const prisma = require('../../../config/prisma');
    
    const whereClause = {
      AND: [
        {
          OR: [
            { processedText: { contains: query, mode: 'insensitive' } },
            { originalName: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    if (propertyId) {
      whereClause.AND.push({ propertyId });
    }

    // Ensure user can only search their own documents or properties they manage
    whereClause.AND.push({
      OR: [
        { uploadedById: userId },
        { property: { landlordId: userId } }
      ]
    });

    return await prisma.document.findMany({
      where: whereClause,
      include: {
        property: true,
        uploadedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      take: 20
    });
  }

  async getEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    
    return response.data[0].embedding;
  }
}

module.exports = DocumentService;
```

### Step 1.4: Chat Service

**Create: `server/src/modules/ai/services/chatService.js`**

```javascript
const OpenAI = require('openai');
const DocumentService = require('./documentService');

class ChatService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.documentService = new DocumentService();
  }

  async createChatSession(userId, title = 'New Chat') {
    const prisma = require('../../../config/prisma');
    
    return await prisma.chatSession.create({
      data: {
        userId,
        title,
        context: {}
      }
    });
  }

  async getChatHistory(sessionId, userId) {
    const prisma = require('../../../config/prisma');
    
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    return session;
  }

  async sendMessage(sessionId, userId, message) {
    const prisma = require('../../../config/prisma');
    
    // Verify session ownership
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!session) {
      throw new Error('Chat session not found');
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message
      }
    });

    // Generate AI response
    const aiResponse = await this.generateResponse(session, message, userId);

    // Save AI response
    const savedResponse = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata || {}
      }
    });

    return {
      userMessage: message,
      aiResponse: savedResponse
    };
  }

  async generateResponse(session, userMessage, userId) {
    try {
      // Check if message is document-related
      const isDocumentQuery = this.isDocumentQuery(userMessage);
      let context = '';
      let sources = [];

      if (isDocumentQuery) {
        // Search relevant documents
        const documents = await this.documentService.searchDocuments(
          userMessage, 
          null, 
          userId
        );
        
        if (documents.length > 0) {
          context = documents.map(doc => 
            `Document: ${doc.originalName}\n${doc.processedText?.substring(0, 500)}...`
          ).join('\n\n');
          
          sources = documents.map(doc => ({
            id: doc.id,
            name: doc.originalName,
            property: doc.property?.title || 'General'
          }));
        }
      }

      // Build conversation history
      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt(context)
        }
      ];

      // Add recent conversation history
      session.messages.reverse().forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content,
        metadata: {
          model: 'gpt-4',
          sources,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Chat generation error:', error);
      return {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: { error: error.message }
      };
    }
  }

  isDocumentQuery(message) {
    const documentKeywords = [
      'document', 'file', 'lease', 'contract', 'agreement',
      'search', 'find', 'show me', 'what does', 'extract'
    ];
    
    return documentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  getSystemPrompt(documentContext = '') {
    return `You are PropertyPulse AI, a helpful assistant for property management.

${documentContext ? `\nRelevant Documents:\n${documentContext}\n` : ''}

Guidelines:
- Be helpful, professional, and concise
- Focus on property management, leasing, and tenant relations
- If asked about documents, use the provided context
- If you don't know something, say so rather than guessing
- Suggest practical solutions when appropriate
- Always maintain user privacy and confidentiality

Current date: ${new Date().toLocaleDateString()}`;
  }
}

module.exports = ChatService;
```

### Step 1.5: API Routes

**Create: `server/src/modules/ai/routes/documentsRoutes.js`**

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateUser, authorizeRoles } = require('../../../middleware/auth');
const DocumentService = require('../services/documentService');

const router = express.Router();
const documentService = new DocumentService();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/documents/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Upload and process document
router.post('/upload',
  authenticateUser,
  authorizeRoles('LANDLORD', 'PROPERTY_MANAGER'),
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { propertyId } = req.body;
      
      // Process document
      const processedData = await documentService.processDocument(
        req.file.path,
        req.file.mimetype
      );

      // Save to database
      const prisma = require('../../../config/prisma');
      const document = await prisma.document.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          storageUrl: req.file.path,
          processedText: processedData.enhancedText,
          metadata: {
            wordCount: processedData.wordCount,
            language: processedData.language
          },
          propertyId: propertyId || null,
          uploadedById: req.user.id
        }
      });

      res.json({
        success: true,
        document: {
          id: document.id,
          name: document.originalName,
          size: document.size,
          type: document.mimeType,
          uploadedAt: document.createdAt
        }
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }
);

// Search documents
router.get('/search',
  authenticateUser,
  async (req, res) => {
    try {
      const { q: query, propertyId } = req.query;

      if (!query || query.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Query must be at least 3 characters long'
        });
      }

      const results = await documentService.searchDocuments(
        query,
        propertyId,
        req.user.id
      );

      res.json({
        success: true,
        query,
        results: results.map(doc => ({
          id: doc.id,
          name: doc.originalName,
          property: doc.property?.title || 'General',
          uploadedBy: `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`,
          uploadedAt: doc.createdAt,
          excerpt: doc.processedText?.substring(0, 200) + '...'
        }))
      });

    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed'
      });
    }
  }
);

// Get document content
router.get('/:id',
  authenticateUser,
  async (req, res) => {
    try {
      const prisma = require('../../../config/prisma');
      
      const document = await prisma.document.findFirst({
        where: {
          id: req.params.id,
          OR: [
            { uploadedById: req.user.id },
            { property: { landlordId: req.user.id } }
          ]
        },
        include: {
          property: true,
          uploadedBy: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        document: {
          id: document.id,
          name: document.originalName,
          content: document.processedText,
          metadata: document.metadata,
          property: document.property?.title || 'General',
          uploadedBy: `${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`,
          uploadedAt: document.createdAt
        }
      });

    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document'
      });
    }
  }
);

module.exports = router;
```

**Create: `server/src/modules/ai/routes/chatRoutes.js`**

```javascript
const express = require('express');
const { authenticateUser } = require('../../../middleware/auth');
const ChatService = require('../services/chatService');

const router = express.Router();
const chatService = new ChatService();

// Create new chat session
router.post('/sessions',
  authenticateUser,
  async (req, res) => {
    try {
      const { title } = req.body;
      
      const session = await chatService.createChatSession(
        req.user.id,
        title
      );

      res.json({
        success: true,
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt
        }
      });

    } catch (error) {
      console.error('Create chat session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session'
      });
    }
  }
);

// Get chat sessions for user
router.get('/sessions',
  authenticateUser,
  async (req, res) => {
    try {
      const prisma = require('../../../config/prisma');
      
      const sessions = await prisma.chatSession.findMany({
        where: { userId: req.user.id },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      res.json({
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          title: session.title,
          lastMessage: session.messages[0]?.content?.substring(0, 100) || '',
          updatedAt: session.updatedAt
        }))
      });

    } catch (error) {
      console.error('Get chat sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat sessions'
      });
    }
  }
);

// Get chat history
router.get('/sessions/:sessionId',
  authenticateUser,
  async (req, res) => {
    try {
      const session = await chatService.getChatHistory(
        req.params.sessionId,
        req.user.id
      );

      res.json({
        success: true,
        session: {
          id: session.id,
          title: session.title,
          messages: session.messages
        }
      });

    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Chat session not found'
      });
    }
  }
);

// Send message
router.post('/sessions/:sessionId/messages',
  authenticateUser,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty'
        });
      }

      const result = await chatService.sendMessage(
        req.params.sessionId,
        req.user.id,
        message.trim()
      );

      res.json({
        success: true,
        userMessage: result.userMessage,
        aiResponse: {
          id: result.aiResponse.id,
          content: result.aiResponse.content,
          metadata: result.aiResponse.metadata,
          createdAt: result.aiResponse.createdAt
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }
);

module.exports = router;
```

### Step 1.6: Feature Flag Integration

**Update `server/server.js`:**

```javascript
// AI Document Search routes (feature-flagged)
if (process.env.AI_DOCUMENT_SEARCH === 'true') {
  console.log('📄 Loading AI document search routes...');
  app.use('/api/ai/documents', require('./src/modules/ai/routes/documentsRoutes'));
  app.use('/api/ai/chat', require('./src/modules/ai/routes/chatRoutes'));
  console.log('✅ AI document search routes loaded');
} else {
  console.log('⚠️ AI document search disabled - AI_DOCUMENT_SEARCH is not "true"');
}
```

**Update `.env.example`:**

```bash
# AI Features
AI_DOCUMENT_SEARCH=false
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 1.7: Install Dependencies

```bash
cd server
npm install openai pdf-parse sharp tesseract.js multer
```

### Step 1.8: Testing

**Create: `server/tests/api/ai-documents.test.js`**

```javascript
const request = require('supertest');
const app = require('../../server');
const { createUser, createProperty } = require('../utils/testHelpers');

describe('AI Document Search API', () => {
  let landlord, property, authToken;

  beforeEach(async () => {
    // Set feature flag
    process.env.AI_DOCUMENT_SEARCH = 'true';
    
    landlord = await createUser({ role: 'LANDLORD' });
    property = await createProperty({ landlordId: landlord.id });
    authToken = `Bearer ${landlord.firebaseToken}`;
  });

  describe('POST /api/ai/documents/upload', () => {
    it('should upload and process document successfully', async () => {
      const response = await request(app)
        .post('/api/ai/documents/upload')
        .set('Authorization', authToken)
        .field('propertyId', property.id)
        .attach('document', Buffer.from('Sample lease agreement content'), 'lease.txt')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.document).toHaveProperty('id');
      expect(response.body.document.name).toBe('lease.txt');
    });

    it('should reject unsupported file types', async () => {
      await request(app)
        .post('/api/ai/documents/upload')
        .set('Authorization', authToken)
        .attach('document', Buffer.from('test'), 'file.xyz')
        .expect(400);
    });
  });

  describe('GET /api/ai/documents/search', () => {
    it('should search documents successfully', async () => {
      // First upload a document
      await request(app)
        .post('/api/ai/documents/upload')
        .set('Authorization', authToken)
        .field('propertyId', property.id)
        .attach('document', Buffer.from('Lease agreement for downtown apartment'), 'lease.txt');

      const response = await request(app)
        .get('/api/ai/documents/search?q=lease')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toBeInstanceOf(Array);
    });

    it('should require minimum query length', async () => {
      await request(app)
        .get('/api/ai/documents/search?q=ab')
        .set('Authorization', authToken)
        .expect(400);
    });
  });
});
```

---

## Part 2 – Smart Property Matching

### Overview
- AI-powered tenant-property matching based on preferences
- Scoring algorithm considering multiple factors
- Learning from user interactions and successful matches

### Step 2.1: Database Schema Updates

```sql
-- Add to schema.prisma
model MatchPreference {
  id          String    @id @default(cuid())
  userId      String
  name        String    // "Budget Range", "Location", "Amenities", etc.
  weight      Float     @default(1.0) // Importance weight 0.1-2.0
  criteria    Json      // Specific criteria data
  isActive    Boolean   @default(true)
  user        User      @relation(fields: [userId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@map("match_preferences")
}

model PropertyMatch {
  id          String    @id @default(cuid())
  tenantId    String
  propertyId  String
  score       Float     // 0.0 - 1.0 matching score
  factors     Json      // Breakdown of scoring factors
  status      String    @default("SUGGESTED") // SUGGESTED, VIEWED, INTERESTED, APPLIED, REJECTED
  tenant      User      @relation("TenantMatches", fields: [tenantId], references: [id])
  property    Property  @relation(fields: [propertyId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tenantId, propertyId])
  @@index([tenantId])
  @@index([propertyId])
  @@index([score])
  @@map("property_matches")
}
```

### Step 2.2: Smart Matching Service

**Create: `server/src/modules/ai/services/matchingService.js`**

```javascript
const OpenAI = require('openai');

class SmartMatchingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateMatches(tenantId, limit = 10) {
    const prisma = require('../../../config/prisma');

    try {
      // Get tenant preferences and profile
      const tenant = await prisma.user.findUnique({
        where: { id: tenantId },
        include: {
          matchPreferences: true
        }
      });

      if (!tenant || tenant.role !== 'TENANT') {
        throw new Error('Invalid tenant');
      }

      // Get available properties
      const properties = await prisma.property.findMany({
        where: {
          isAvailable: true,
          status: 'ACTIVE'
        },
        include: {
          landlord: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      // Calculate matches
      const matches = [];
      
      for (const property of properties) {
        const score = await this.calculateMatchScore(tenant, property);
        
        if (score.overall >= 0.3) { // Minimum threshold
          matches.push({
            tenantId,
            propertyId: property.id,
            score: score.overall,
            factors: score.factors,
            property
          });
        }
      }

      // Sort by score and limit results
      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, limit);

      // Save matches to database
      for (const match of topMatches) {
        await prisma.propertyMatch.upsert({
          where: {
            tenantId_propertyId: {
              tenantId: match.tenantId,
              propertyId: match.propertyId
            }
          },
          update: {
            score: match.score,
            factors: match.factors,
            updatedAt: new Date()
          },
          create: {
            tenantId: match.tenantId,
            propertyId: match.propertyId,
            score: match.score,
            factors: match.factors
          }
        });
      }

      return topMatches;

    } catch (error) {
      console.error('Generate matches error:', error);
      throw error;
    }
  }

  async calculateMatchScore(tenant, property) {
    const factors = {};
    let totalWeight = 0;
    let weightedScore = 0;

    // Budget compatibility (weight: 2.0)
    const budgetScore = this.calculateBudgetScore(tenant, property);
    factors.budget = budgetScore;
    const budgetWeight = 2.0;
    weightedScore += budgetScore * budgetWeight;
    totalWeight += budgetWeight;

    // Location preferences (weight: 1.5)
    const locationScore = this.calculateLocationScore(tenant, property);
    factors.location = locationScore;
    const locationWeight = 1.5;
    weightedScore += locationScore * locationWeight;
    totalWeight += locationWeight;

    // Size/bedrooms match (weight: 1.2)
    const sizeScore = this.calculateSizeScore(tenant, property);
    factors.size = sizeScore;
    const sizeWeight = 1.2;
    weightedScore += sizeScore * sizeWeight;
    totalWeight += sizeWeight;

    // Amenities match (weight: 1.0)
    const amenitiesScore = this.calculateAmenitiesScore(tenant, property);
    factors.amenities = amenitiesScore;
    const amenitiesWeight = 1.0;
    weightedScore += amenitiesScore * amenitiesWeight;
    totalWeight += amenitiesWeight;

    // Pet policy (weight: 1.8 if tenant has pets)
    if (tenant.profilePreferences?.pets && tenant.profilePreferences.pets.length > 0) {
      const petScore = this.calculatePetScore(tenant, property);
      factors.pets = petScore;
      const petWeight = 1.8;
      weightedScore += petScore * petWeight;
      totalWeight += petWeight;
    }

    const overall = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      overall: Math.min(Math.max(overall, 0), 1), // Clamp between 0 and 1
      factors
    };
  }

  calculateBudgetScore(tenant, property) {
    const tenantBudget = {
      min: tenant.budgetMin || 0,
      max: tenant.budgetMax || Infinity
    };
    
    const rent = property.rentAmount || 0;
    
    if (rent < tenantBudget.min) {
      // Too cheap might be suspicious
      return Math.max(0, 1 - (tenantBudget.min - rent) / tenantBudget.min);
    } else if (rent <= tenantBudget.max) {
      // Within budget - perfect score if at 80% of max budget
      const optimal = tenantBudget.max * 0.8;
      if (rent <= optimal) {
        return 1.0;
      } else {
        return 1 - ((rent - optimal) / (tenantBudget.max - optimal)) * 0.3;
      }
    } else {
      // Over budget
      const overage = rent - tenantBudget.max;
      const tolerance = tenantBudget.max * 0.1; // 10% tolerance
      return Math.max(0, 1 - overage / tolerance);
    }
  }

  calculateLocationScore(tenant, property) {
    const preferredLocations = tenant.preferredLocations || [];
    
    if (preferredLocations.length === 0) {
      return 0.5; // Neutral if no preferences
    }

    const propertyLocation = `${property.addressCity}, ${property.addressState}`.toLowerCase();
    
    for (const preferred of preferredLocations) {
      if (propertyLocation.includes(preferred.toLowerCase())) {
        return 1.0;
      }
    }

    // Check for nearby matches (same state, etc.)
    if (preferredLocations.some(loc => 
      loc.toLowerCase().includes(property.addressState?.toLowerCase())
    )) {
      return 0.6;
    }

    return 0.1; // Not preferred location
  }

  calculateSizeScore(tenant, property) {
    const preferredBedrooms = tenant.preferredBedrooms;
    
    if (!preferredBedrooms || !property.bedrooms) {
      return 0.5; // Neutral if no data
    }

    const difference = Math.abs(property.bedrooms - preferredBedrooms);
    
    if (difference === 0) {
      return 1.0; // Perfect match
    } else if (difference === 1) {
      return 0.7; // Close match
    } else if (difference === 2) {
      return 0.4; // Acceptable
    } else {
      return 0.1; // Poor match
    }
  }

  calculateAmenitiesScore(tenant, property) {
    const tenantPrefs = tenant.profilePreferences?.amenities || [];
    const propertyAmenities = property.amenities || [];
    
    if (tenantPrefs.length === 0) {
      return 0.5; // Neutral if no preferences
    }

    let matches = 0;
    for (const desired of tenantPrefs) {
      if (propertyAmenities.some(amenity => 
        amenity.toLowerCase().includes(desired.toLowerCase())
      )) {
        matches++;
      }
    }

    return matches / tenantPrefs.length;
  }

  calculatePetScore(tenant, property) {
    const tenantPets = tenant.profilePreferences?.pets || [];
    const petPolicy = property.petPolicy || '';
    
    if (tenantPets.length === 0) {
      return 1.0; // No pets, no problem
    }

    const policyLower = petPolicy.toLowerCase();
    
    if (policyLower.includes('no pets') || policyLower.includes('not allowed')) {
      return 0.0; // No pets allowed
    } else if (policyLower.includes('pets allowed') || policyLower.includes('pet friendly')) {
      return 1.0; // Pets welcome
    } else if (policyLower.includes('case by case') || policyLower.includes('deposit')) {
      return 0.7; // Negotiable
    } else {
      return 0.3; // Unclear policy
    }
  }

  async updateMatchStatus(tenantId, propertyId, status, feedback = null) {
    const prisma = require('../../../config/prisma');

    const match = await prisma.propertyMatch.update({
      where: {
        tenantId_propertyId: {
          tenantId,
          propertyId
        }
      },
      data: {
        status,
        factors: feedback ? { 
          ...match.factors, 
          userFeedback: feedback 
        } : match.factors
      }
    });

    // Use feedback to improve future matching (machine learning integration point)
    if (feedback) {
      await this.learnFromFeedback(tenantId, propertyId, feedback);
    }

    return match;
  }

  async learnFromFeedback(tenantId, propertyId, feedback) {
    // This is where you'd integrate with ML models to improve matching
    // For now, we'll just log the feedback for analysis
    console.log('Learning from feedback:', {
      tenantId,
      propertyId,
      feedback,
      timestamp: new Date()
    });

    // Future: Update user preference weights based on positive/negative feedback
    // Future: Train ML model with feedback data
  }

  async getAIMatchExplanation(tenantId, propertyId) {
    try {
      const prisma = require('../../../config/prisma');

      const match = await prisma.propertyMatch.findUnique({
        where: {
          tenantId_propertyId: {
            tenantId,
            propertyId
          }
        },
        include: {
          tenant: true,
          property: true
        }
      });

      if (!match) {
        throw new Error('Match not found');
      }

      const prompt = `Explain why this property matches the tenant's preferences:

Tenant Profile:
- Budget: $${match.tenant.budgetMin}-$${match.tenant.budgetMax}
- Preferred bedrooms: ${match.tenant.preferredBedrooms}
- Preferred locations: ${match.tenant.preferredLocations?.join(', ')}

Property Details:
- Rent: $${match.property.rentAmount}
- Bedrooms: ${match.property.bedrooms}
- Location: ${match.property.addressCity}, ${match.property.addressState}
- Type: ${match.property.propertyType}

Match Score: ${(match.score * 100).toFixed(1)}%
Scoring Factors: ${JSON.stringify(match.factors, null, 2)}

Provide a friendly, personalized explanation of why this property is a good match.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful property matching assistant. Explain matches in a friendly, conversational way.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('AI explanation error:', error);
      return 'This property matches several of your key preferences, making it a great option to consider.';
    }
  }
}

module.exports = SmartMatchingService;
```

### Step 2.3: Matching API Routes

**Create: `server/src/modules/ai/routes/matchingRoutes.js`**

```javascript
const express = require('express');
const { authenticateUser, authorizeRoles } = require('../../../middleware/auth');
const SmartMatchingService = require('../services/matchingService');

const router = express.Router();
const matchingService = new SmartMatchingService();

// Generate property matches for tenant
router.post('/generate',
  authenticateUser,
  authorizeRoles('TENANT'),
  async (req, res) => {
    try {
      const { limit = 10 } = req.body;

      const matches = await matchingService.generateMatches(
        req.user.id,
        Math.min(limit, 20) // Cap at 20
      );

      res.json({
        success: true,
        matches: matches.map(match => ({
          score: match.score,
          factors: match.factors,
          property: {
            id: match.property.id,
            title: match.property.title,
            rent: match.property.rentAmount,
            bedrooms: match.property.bedrooms,
            bathrooms: match.property.bathrooms,
            location: `${match.property.addressCity}, ${match.property.addressState}`,
            type: match.property.propertyType,
            landlord: `${match.property.landlord.firstName} ${match.property.landlord.lastName}`
          }
        }))
      });

    } catch (error) {
      console.error('Generate matches error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate matches'
      });
    }
  }
);

// Get existing matches for tenant
router.get('/my-matches',
  authenticateUser,
  authorizeRoles('TENANT'),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const prisma = require('../../../config/prisma');

      const whereClause = {
        tenantId: req.user.id
      };

      if (status) {
        whereClause.status = status;
      }

      const matches = await prisma.propertyMatch.findMany({
        where: whereClause,
        include: {
          property: {
            include: {
              landlord: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        },
        orderBy: { score: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.propertyMatch.count({ where: whereClause });

      res.json({
        success: true,
        matches: matches.map(match => ({
          id: match.id,
          score: match.score,
          factors: match.factors,
          status: match.status,
          createdAt: match.createdAt,
          property: {
            id: match.property.id,
            title: match.property.title,
            description: match.property.description,
            rent: match.property.rentAmount,
            bedrooms: match.property.bedrooms,
            bathrooms: match.property.bathrooms,
            squareFeet: match.property.squareFeet,
            location: `${match.property.addressStreet}, ${match.property.addressCity}, ${match.property.addressState}`,
            type: match.property.propertyType,
            amenities: match.property.amenities,
            images: match.property.images,
            landlord: `${match.property.landlord.firstName} ${match.property.landlord.lastName}`
          }
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve matches'
      });
    }
  }
);

// Update match status with feedback
router.patch('/matches/:matchId/status',
  authenticateUser,
  authorizeRoles('TENANT'),
  async (req, res) => {
    try {
      const { status, feedback } = req.body;
      const validStatuses = ['VIEWED', 'INTERESTED', 'APPLIED', 'REJECTED'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const prisma = require('../../../config/prisma');

      // Verify match belongs to user
      const match = await prisma.propertyMatch.findFirst({
        where: {
          id: req.params.matchId,
          tenantId: req.user.id
        }
      });

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found'
        });
      }

      const updatedMatch = await matchingService.updateMatchStatus(
        req.user.id,
        match.propertyId,
        status,
        feedback
      );

      res.json({
        success: true,
        match: {
          id: updatedMatch.id,
          status: updatedMatch.status,
          updatedAt: updatedMatch.updatedAt
        }
      });

    } catch (error) {
      console.error('Update match status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update match status'
      });
    }
  }
);

// Get AI explanation for a match
router.get('/matches/:matchId/explanation',
  authenticateUser,
  authorizeRoles('TENANT'),
  async (req, res) => {
    try {
      const prisma = require('../../../config/prisma');

      // Verify match belongs to user and get property ID
      const match = await prisma.propertyMatch.findFirst({
        where: {
          id: req.params.matchId,
          tenantId: req.user.id
        }
      });

      if (!match) {
        return res.status(404).json({
          success: false,
          message: 'Match not found'
        });
      }

      const explanation = await matchingService.getAIMatchExplanation(
        req.user.id,
        match.propertyId
      );

      res.json({
        success: true,
        explanation
      });

    } catch (error) {
      console.error('Get match explanation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get match explanation'
      });
    }
  }
);

// Update user preferences (affects future matching)
router.post('/preferences',
  authenticateUser,
  authorizeRoles('TENANT'),
  async (req, res) => {
    try {
      const { preferences } = req.body;
      const prisma = require('../../../config/prisma');

      // Update user profile preferences
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          budgetMin: preferences.budgetMin,
          budgetMax: preferences.budgetMax,
          preferredBedrooms: preferences.bedrooms,
          preferredLocations: preferences.locations || [],
          profilePreferences: {
            ...req.user.profilePreferences,
            amenities: preferences.amenities || [],
            pets: preferences.pets || [],
            propertyTypes: preferences.propertyTypes || []
          }
        }
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          budgetMin: user.budgetMin,
          budgetMax: user.budgetMax,
          bedrooms: user.preferredBedrooms,
          locations: user.preferredLocations,
          amenities: user.profilePreferences?.amenities || [],
          pets: user.profilePreferences?.pets || [],
          propertyTypes: user.profilePreferences?.propertyTypes || []
        }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences'
      });
    }
  }
);

module.exports = router;
```

### Step 2.4: Add to Server Routes

**Update `server/server.js`:**

```javascript
// Smart Property Matching routes (feature-flagged)
if (process.env.SMART_MATCHING === 'true') {
  console.log('🎯 Loading smart property matching routes...');
  app.use('/api/ai/matching', require('./src/modules/ai/routes/matchingRoutes'));
  console.log('✅ Smart property matching routes loaded');
} else {
  console.log('⚠️ Smart property matching disabled - SMART_MATCHING is not "true"');
}
```

**Update `.env.example`:**

```bash
# Smart Matching
SMART_MATCHING=false
```

---

## Part 3 – AI Lease Generation

### Overview
- Generate customized lease agreements using AI
- Support multiple property types and jurisdictions
- Template management with dynamic clauses
- Legal compliance checking and suggestions

### Step 3.1: Database Schema Updates

```sql
-- Add to schema.prisma
model LeaseTemplate {
  id            String          @id @default(cuid())
  name          String
  description   String?
  jurisdiction  String          // "CA", "NY", "TX", etc.
  propertyType  PropertyType    @default(APARTMENT)
  baseTemplate  String          @db.Text // Base template with placeholders
  clauses       Json            // Available clauses and conditions
  isActive      Boolean         @default(true)
  createdById   String
  createdBy     User            @relation("CreatedTemplates", fields: [createdById], references: [id])
  generatedLeases GeneratedLease[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([jurisdiction])
  @@index([propertyType])
  @@index([isActive])
  @@map("lease_templates")
}

model GeneratedLease {
  id              String        @id @default(cuid())
  templateId      String
  propertyId      String
  tenantId        String?
  landlordId      String
  content         String        @db.Text // Generated lease content
  variables       Json          // Variables used in generation
  status          String        @default("DRAFT") // DRAFT, REVIEW, FINAL, SIGNED
  reviewNotes     String?       @db.Text
  signatureData   Json?         // E-signature information
  
  template        LeaseTemplate @relation(fields: [templateId], references: [id])
  property        Property      @relation(fields: [propertyId], references: [id])
  tenant          User?         @relation("TenantGeneratedLeases", fields: [tenantId], references: [id])
  landlord        User          @relation("LandlordGeneratedLeases", fields: [landlordId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([propertyId])
  @@index([tenantId])
  @@index([landlordId])
  @@index([status])
  @@map("generated_leases")
}

model LeaseClause {
  id            String    @id @default(cuid())
  category      String    // "RENT", "SECURITY_DEPOSIT", "PETS", "MAINTENANCE", etc.
  title         String
  content       String    @db.Text
  jurisdiction  String?   // If specific to jurisdiction
  isRequired    Boolean   @default(false)
  conditions    Json?     // When this clause should be included
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([category])
  @@index([jurisdiction])
  @@map("lease_clauses")
}
```

### Step 3.2: Update User Relations

**Add to User model in schema.prisma:**

```sql
// Add these relations to the User model
createdTemplates    LeaseTemplate[]    @relation("CreatedTemplates")
tenantGeneratedLeases GeneratedLease[] @relation("TenantGeneratedLeases")
landlordGeneratedLeases GeneratedLease[] @relation("LandlordGeneratedLeases")
```

**Add to Property model:**

```sql
// Add this relation to the Property model
generatedLeases     GeneratedLease[]
```

### Step 3.3: Lease Generation Service

**Create: `server/src/modules/ai/services/leaseGenerationService.js`**

```javascript
const OpenAI = require('openai');
const { format } = require('date-fns');

class LeaseGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateLease(templateId, propertyId, landlordId, options = {}) {
    const prisma = require('../../../config/prisma');

    try {
      // Get template, property, and landlord data
      const [template, property, landlord] = await Promise.all([
        prisma.leaseTemplate.findUnique({
          where: { id: templateId },
          include: { clauses: true }
        }),
        prisma.property.findUnique({
          where: { id: propertyId },
          include: { landlord: true }
        }),
        prisma.user.findUnique({
          where: { id: landlordId }
        })
      ]);

      if (!template) throw new Error('Template not found');
      if (!property) throw new Error('Property not found');
      if (!landlord || landlord.role !== 'LANDLORD') throw new Error('Invalid landlord');

      // Prepare variables for lease generation
      const variables = {
        // Property information
        propertyAddress: `${property.addressStreet}, ${property.addressCity}, ${property.addressState} ${property.addressZip}`,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.squareFeet,
        rentAmount: property.rentAmount,
        deposit: property.deposit,
        
        // Landlord information
        landlordName: `${landlord.firstName} ${landlord.lastName}`,
        landlordEmail: landlord.email,
        landlordPhone: landlord.phone || '',
        
        // Lease terms
        leaseStartDate: options.startDate ? format(new Date(options.startDate), 'MMMM dd, yyyy') : '[START_DATE]',
        leaseEndDate: options.endDate ? format(new Date(options.endDate), 'MMMM dd, yyyy') : '[END_DATE]',
        leaseTerm: options.termMonths || 12,
        
        // Additional options
        petsAllowed: options.petsAllowed || false,
        smokingAllowed: options.smokingAllowed || false,
        utilitiesIncluded: options.utilitiesIncluded || [],
        
        // System values
        generationDate: format(new Date(), 'MMMM dd, yyyy'),
        state: property.addressState,
        jurisdiction: template.jurisdiction
      };

      // Select appropriate clauses based on property and options
      const selectedClauses = await this.selectClauses(template, property, options);
      
      // Generate the lease content using AI
      const leaseContent = await this.generateLeaseContent(
        template,
        variables,
        selectedClauses,
        options
      );

      // Save generated lease
      const generatedLease = await prisma.generatedLease.create({
        data: {
          templateId,
          propertyId,
          tenantId: options.tenantId || null,
          landlordId,
          content: leaseContent,
          variables,
          status: 'DRAFT'
        }
      });

      return {
        id: generatedLease.id,
        content: leaseContent,
        variables,
        createdAt: generatedLease.createdAt
      };

    } catch (error) {
      console.error('Lease generation error:', error);
      throw error;
    }
  }

  async selectClauses(template, property, options) {
    const prisma = require('../../../config/prisma');

    // Get all available clauses for this jurisdiction
    const availableClauses = await prisma.leaseClause.findMany({
      where: {
        OR: [
          { jurisdiction: template.jurisdiction },
          { jurisdiction: null } // Universal clauses
        ]
      }
    });

    const selectedClauses = [];

    // Always include required clauses
    selectedClauses.push(...availableClauses.filter(clause => clause.isRequired));

    // Add conditional clauses based on property and options
    for (const clause of availableClauses) {
      if (clause.isRequired) continue; // Already added

      const shouldInclude = this.evaluateClauseConditions(clause, property, options);
      if (shouldInclude) {
        selectedClauses.push(clause);
      }
    }

    return selectedClauses;
  }

  evaluateClauseConditions(clause, property, options) {
    const conditions = clause.conditions || {};

    // Pet clause
    if (clause.category === 'PETS') {
      return options.petsAllowed === true;
    }

    // Smoking clause
    if (clause.category === 'SMOKING') {
      return options.smokingAllowed === false; // Usually no-smoking clause
    }

    // Parking clause
    if (clause.category === 'PARKING') {
      const amenities = property.amenities || [];
      return amenities.some(amenity => 
        amenity.toLowerCase().includes('parking') || 
        amenity.toLowerCase().includes('garage')
      );
    }

    // Utilities clause
    if (clause.category === 'UTILITIES') {
      return options.utilitiesIncluded && options.utilitiesIncluded.length > 0;
    }

    // Property-type specific clauses
    if (conditions.propertyTypes && conditions.propertyTypes.length > 0) {
      return conditions.propertyTypes.includes(property.propertyType);
    }

    // Default inclusion for basic clauses
    const basicCategories = ['RENT', 'SECURITY_DEPOSIT', 'MAINTENANCE', 'TERMINATION'];
    return basicCategories.includes(clause.category);
  }

  async generateLeaseContent(template, variables, clauses, options) {
    try {
      // Prepare clauses text
      const clausesText = clauses.map(clause => 
        `**${clause.title}**\n${clause.content}`
      ).join('\n\n');

      const prompt = `Generate a comprehensive residential lease agreement using the following information:

TEMPLATE BASE:
${template.baseTemplate}

PROPERTY DETAILS:
- Address: ${variables.propertyAddress}
- Type: ${variables.propertyType}
- Bedrooms: ${variables.bedrooms}, Bathrooms: ${variables.bathrooms}
- Square Feet: ${variables.squareFeet || 'Not specified'}
- Monthly Rent: $${variables.rentAmount}
- Security Deposit: $${variables.deposit}

PARTIES:
- Landlord: ${variables.landlordName}
- Landlord Email: ${variables.landlordEmail}
- Landlord Phone: ${variables.landlordPhone}
- Tenant: ${variables.tenantName || '[TENANT_NAME]'}

LEASE TERMS:
- Start Date: ${variables.leaseStartDate}
- End Date: ${variables.leaseEndDate}
- Term Length: ${variables.leaseTerm} months
- Jurisdiction: ${variables.jurisdiction}

APPLICABLE CLAUSES:
${clausesText}

SPECIAL CONDITIONS:
- Pets Allowed: ${options.petsAllowed ? 'Yes' : 'No'}
- Smoking Allowed: ${options.smokingAllowed ? 'Yes' : 'No'}
- Utilities Included: ${options.utilitiesIncluded?.join(', ') || 'None specified'}

Please generate a complete, legally-structured lease agreement that:
1. Follows ${variables.jurisdiction} state laws and regulations
2. Includes all applicable clauses in proper legal format
3. Uses clear, professional language
4. Includes proper numbering and section headers
5. Contains signature blocks for all parties
6. Is ready for legal review

Generate the complete lease document:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a legal document expert specializing in residential lease agreements. Generate complete, professional lease agreements that comply with state laws. Use proper legal formatting, clear numbering, and comprehensive terms. Always include standard clauses for rent, security deposits, maintenance responsibilities, and termination conditions.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3 // Lower temperature for more consistent legal language
      });

      let generatedContent = response.choices[0].message.content;

      // Post-process the content to ensure consistency
      generatedContent = this.postProcessLeaseContent(generatedContent, variables);

      return generatedContent;

    } catch (error) {
      console.error('AI lease generation error:', error);
      throw new Error('Failed to generate lease content');
    }
  }

  postProcessLeaseContent(content, variables) {
    // Replace any remaining placeholders
    let processedContent = content;

    // Standard replacements
    const replacements = {
      '[LANDLORD_NAME]': variables.landlordName,
      '[PROPERTY_ADDRESS]': variables.propertyAddress,
      '[RENT_AMOUNT]': `$${variables.rentAmount}`,
      '[SECURITY_DEPOSIT]': `$${variables.deposit}`,
      '[LEASE_START]': variables.leaseStartDate,
      '[LEASE_END]': variables.leaseEndDate,
      '[GENERATION_DATE]': variables.generationDate
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    }

    // Ensure proper formatting
    processedContent = processedContent
      .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+/gm, '') // Remove leading whitespace from lines
      .trim();

    return processedContent;
  }

  async reviewLeaseForCompliance(leaseId, userId) {
    const prisma = require('../../../config/prisma');

    try {
      const lease = await prisma.generatedLease.findFirst({
        where: {
          id: leaseId,
          OR: [
            { landlordId: userId },
            { tenant: { id: userId } }
          ]
        },
        include: {
          template: true,
          property: true
        }
      });

      if (!lease) {
        throw new Error('Lease not found or access denied');
      }

      const reviewPrompt = `Review the following lease agreement for legal compliance and completeness:

JURISDICTION: ${lease.template.jurisdiction}
PROPERTY TYPE: ${lease.property.propertyType}

LEASE CONTENT:
${lease.content}

Please analyze this lease and provide:
1. Compliance issues or missing required clauses for ${lease.template.jurisdiction}
2. Suggestions for improvement
3. Potential legal risks or ambiguities
4. Overall compliance score (1-10)

Focus on:
- State-specific requirements
- Fair housing compliance
- Required disclosures
- Clear terms and conditions
- Proper legal language`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a legal expert specializing in residential lease agreements. Provide thorough compliance reviews focusing on state laws, fair housing requirements, and best practices. Be specific about legal requirements and potential issues.'
          },
          { role: 'user', content: reviewPrompt }
        ],
        max_tokens: 1500
      });

      const reviewNotes = response.choices[0].message.content;

      // Update lease with review notes
      await prisma.generatedLease.update({
        where: { id: leaseId },
        data: {
          reviewNotes,
          status: 'REVIEW'
        }
      });

      return {
        leaseId,
        reviewNotes,
        status: 'REVIEW'
      };

    } catch (error) {
      console.error('Lease review error:', error);
      throw error;
    }
  }

  async getTemplates(landlordId, filters = {}) {
    const prisma = require('../../../config/prisma');

    const whereClause = {
      isActive: true
    };

    if (filters.jurisdiction) {
      whereClause.jurisdiction = filters.jurisdiction;
    }

    if (filters.propertyType) {
      whereClause.propertyType = filters.propertyType;
    }

    const templates = await prisma.leaseTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            generatedLeases: true
          }
        }
      }
    });

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      jurisdiction: template.jurisdiction,
      propertyType: template.propertyType,
      timesUsed: template._count.generatedLeases,
      createdAt: template.createdAt
    }));
  }

  async createCustomTemplate(landlordId, templateData) {
    const prisma = require('../../../config/prisma');

    const template = await prisma.leaseTemplate.create({
      data: {
        name: templateData.name,
        description: templateData.description,
        jurisdiction: templateData.jurisdiction,
        propertyType: templateData.propertyType || 'APARTMENT',
        baseTemplate: templateData.baseTemplate,
        clauses: templateData.clauses || {},
        createdById: landlordId
      }
    });

    return template;
  }
}

module.exports = LeaseGenerationService;
```

### Step 3.4: Lease Generation API Routes

**Create: `server/src/modules/ai/routes/leaseGenerationRoutes.js`**

```javascript
const express = require('express');
const { authenticateUser, authorizeRoles } = require('../../../middleware/auth');
const LeaseGenerationService = require('../services/leaseGenerationService');

const router = express.Router();
const leaseService = new LeaseGenerationService();

// Get available lease templates
router.get('/templates',
  authenticateUser,
  authorizeRoles('LANDLORD', 'PROPERTY_MANAGER'),
  async (req, res) => {
    try {
      const { jurisdiction, propertyType } = req.query;
      
      const templates = await leaseService.getTemplates(req.user.id, {
        jurisdiction,
        propertyType
      });

      res.json({
        success: true,
        templates
      });

    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve templates'
      });
    }
  }
);

// Generate new lease
router.post('/generate',
  authenticateUser,
  authorizeRoles('LANDLORD', 'PROPERTY_MANAGER'),
  async (req, res) => {
    try {
      const {
        templateId,
        propertyId,
        options = {}
      } = req.body;

      if (!templateId || !propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID and Property ID are required'
        });
      }

      // Validate property ownership
      const prisma = require('../../../config/prisma');
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          landlordId: req.user.id
        }
      });

      if (!property) {
        return res.status(403).json({
          success: false,
          message: 'Property not found or access denied'
        });
      }

      const generatedLease = await leaseService.generateLease(
        templateId,
        propertyId,
        req.user.id,
        options
      );

      res.json({
        success: true,
        lease: generatedLease
      });

    } catch (error) {
      console.error('Generate lease error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate lease'
      });
    }
  }
);

// Get generated lease
router.get('/leases/:leaseId',
  authenticateUser,
  async (req, res) => {
    try {
      const prisma = require('../../../config/prisma');

      const lease = await prisma.generatedLease.findFirst({
        where: {
          id: req.params.leaseId,
          OR: [
            { landlordId: req.user.id },
            { tenantId: req.user.id }
          ]
        },
        include: {
          template: {
            select: { name: true, jurisdiction: true }
          },
          property: {
            select: { title: true, addressStreet: true, addressCity: true, addressState: true }
          },
          tenant: {
            select: { firstName: true, lastName: true, email: true }
          },
          landlord: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      if (!lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found or access denied'
        });
      }

      res.json({
        success: true,
        lease: {
          id: lease.id,
          content: lease.content,
          status: lease.status,
          variables: lease.variables,
          reviewNotes: lease.reviewNotes,
          template: lease.template,
          property: lease.property,
          tenant: lease.tenant,
          landlord: lease.landlord,
          createdAt: lease.createdAt,
          updatedAt: lease.updatedAt
        }
      });

    } catch (error) {
      console.error('Get lease error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lease'
      });
    }
  }
);

// Get user's generated leases
router.get('/leases',
  authenticateUser,
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const prisma = require('../../../config/prisma');

      const whereClause = {
        OR: [
          { landlordId: req.user.id },
          { tenantId: req.user.id }
        ]
      };

      if (status) {
        whereClause.status = status;
      }

      const leases = await prisma.generatedLease.findMany({
        where: whereClause,
        include: {
          template: {
            select: { name: true }
          },
          property: {
            select: { title: true, addressCity: true, addressState: true }
          },
          tenant: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.generatedLease.count({ where: whereClause });

      res.json({
        success: true,
        leases: leases.map(lease => ({
          id: lease.id,
          status: lease.status,
          template: lease.template.name,
          property: `${lease.property.title} (${lease.property.addressCity}, ${lease.property.addressState})`,
          tenant: lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : 'Not assigned',
          createdAt: lease.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get leases error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leases'
      });
    }
  }
);

// Review lease for compliance
router.post('/leases/:leaseId/review',
  authenticateUser,
  authorizeRoles('LANDLORD', 'PROPERTY_MANAGER'),
  async (req, res) => {
    try {
      const review = await leaseService.reviewLeaseForCompliance(
        req.params.leaseId,
        req.user.id
      );

      res.json({
        success: true,
        review
      });

    } catch (error) {
      console.error('Review lease error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to review lease'
      });
    }
  }
);

// Update lease status
router.patch('/leases/:leaseId/status',
  authenticateUser,
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ['DRAFT', 'REVIEW', 'FINAL', 'SIGNED'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const prisma = require('../../../config/prisma');

      // Check access rights
      const lease = await prisma.generatedLease.findFirst({
        where: {
          id: req.params.leaseId,
          OR: [
            { landlordId: req.user.id },
            { tenantId: req.user.id }
          ]
        }
      });

      if (!lease) {
        return res.status(404).json({
          success: false,
          message: 'Lease not found or access denied'
        });
      }

      // Only landlords can change to FINAL, tenants can change to SIGNED
      if (status === 'FINAL' && lease.landlordId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only landlord can finalize lease'
        });
      }

      if (status === 'SIGNED' && lease.tenantId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only tenant can sign lease'
        });
      }

      const updatedLease = await prisma.generatedLease.update({
        where: { id: req.params.leaseId },
        data: { 
          status,
          ...(status === 'SIGNED' && {
            signatureData: {
              signedAt: new Date(),
              signedBy: req.user.id,
              userAgent: req.headers['user-agent']
            }
          })
        }
      });

      res.json({
        success: true,
        lease: {
          id: updatedLease.id,
          status: updatedLease.status,
          updatedAt: updatedLease.updatedAt
        }
      });

    } catch (error) {
      console.error('Update lease status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lease status'
      });
    }
  }
);

// Create custom template
router.post('/templates',
  authenticateUser,
  authorizeRoles('LANDLORD', 'PROPERTY_MANAGER'),
  async (req, res) => {
    try {
      const templateData = req.body;

      if (!templateData.name || !templateData.jurisdiction || !templateData.baseTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Name, jurisdiction, and base template are required'
        });
      }

      const template = await leaseService.createCustomTemplate(
        req.user.id,
        templateData
      );

      res.json({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          jurisdiction: template.jurisdiction,
          propertyType: template.propertyType,
          createdAt: template.createdAt
        }
      });

    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }
  }
);

module.exports = router;
```

---

## Part 4 – AI Leasing Assistant

### Overview
- Conversational AI assistant for leasing inquiries
- Handles property questions, scheduling, and application guidance
- Integrated with property data and availability
- Free-form message support with intelligent routing

### Step 4.1: Database Schema Updates

```sql
-- Add to schema.prisma
model LesingConversation {
  id             String    @id @default(cuid())
  propertyId     String?
  inquirerEmail  String
  inquirerName   String?
  inquirerPhone  String?
  status         String    @default("ACTIVE") // ACTIVE, CLOSED, TRANSFERRED
  context        Json?     // Conversation context and history
  assignedToId   String?   // If transferred to human agent
  
  property       Property? @relation(fields: [propertyId], references: [id])
  assignedTo     User?     @relation("AssignedConversations", fields: [assignedToId], references: [id])
  messages       LeasingMessage[]
  
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([propertyId])
  @@index([inquirerEmail])
  @@index([status])
  @@map("leasing_conversations")
}

model LeasingMessage {
  id             String              @id @default(cuid())
  conversationId String
  role           String              // 'user' | 'assistant' | 'agent'
  content        String              @db.Text
  metadata       Json?               // AI confidence, intent, entities
  attachments    Json?               // File attachments, links
  
  conversation   LesingConversation  @relation(fields: [conversationId], references: [id])
  
  createdAt      DateTime            @default(now())

  @@index([conversationId])
  @@map("leasing_messages")
}

model LeasingIntent {
  id          String   @id @default(cuid())
  name        String   // "SCHEDULE_TOUR", "ASK_PRICE", "CHECK_AVAILABILITY", etc.
  description String
  keywords    String[] // Keywords that trigger this intent
  response    String   @db.Text // Template response
  actions     Json?    // Actions to take (schedule, send info, etc.)
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@map("leasing_intents")
}
```

### Step 4.2: Update User Relations

**Add to User model:**

```sql
// Add this relation to the User model
assignedConversations  LesingConversation[] @relation("AssignedConversations")
```

**Add to Property model:**

```sql
// Add this relation to the Property model  
leasingConversations   LesingConversation[]
```

### Step 4.3: Leasing Assistant Service

**Create: `server/src/modules/ai/services/leasingAssistantService.js`**

```javascript
const OpenAI = require('openai');
const { format, addDays, addHours } = require('date-fns');

class LeasingAssistantService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async startConversation(propertyId, inquirerEmail, inquirerName, inquirerPhone, initialMessage) {
    const prisma = require('../../../config/prisma');

    try {
      // Get property information
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          landlord: {
            select: { firstName: true, lastName: true, email: true, phone: true }
          }
        }
      });

      if (!property || !property.isAvailable) {
        throw new Error('Property not available for leasing');
      }

      // Check for existing conversation
      let conversation = await prisma.leasingConversation.findFirst({
        where: {
          propertyId,
          inquirerEmail,
          status: 'ACTIVE'
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      });

      // Create new conversation if needed
      if (!conversation) {
        conversation = await prisma.leasingConversation.create({
          data: {
            propertyId,
            inquirerEmail,
            inquirerName,
            inquirerPhone,
            context: {
              propertyInfo: {
                title: property.title,
                rent: property.rentAmount,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                location: `${property.addressCity}, ${property.addressState}`
              }
            }
          },
          include: {
            messages: true
          }
        });
      }

      // Save initial user message
      await prisma.leasingMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: initialMessage
        }
      });

      // Generate AI response
      const aiResponse = await this.generateResponse(
        conversation,
        property,
        initialMessage,
        []
      );

      // Save AI response
      const savedResponse = await prisma.leasingMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse.content,
          metadata: aiResponse.metadata
        }
      });

      return {
        conversationId: conversation.id,
        userMessage: initialMessage,
        aiResponse: {
          id: savedResponse.id,
          content: savedResponse.content,
          metadata: savedResponse.metadata,
          createdAt: savedResponse.createdAt
        }
      };

    } catch (error) {
      console.error('Start conversation error:', error);
      throw error;
    }
  }

  async continueConversation(conversationId, message) {
    const prisma = require('../../../config/prisma');

    try {
      // Get conversation with history
      const conversation = await prisma.leasingConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          property: {
            include: {
              landlord: {
                select: { firstName: true, lastName: true, email: true, phone: true }
              }
            }
          }
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.status !== 'ACTIVE') {
        throw new Error('Conversation is no longer active');
      }

      // Save user message
      await prisma.leasingMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: message
        }
      });

      // Generate AI response
      const aiResponse = await this.generateResponse(
        conversation,
        conversation.property,
        message,
        conversation.messages.reverse()
      );

      // Check if conversation should be transferred to human
      const shouldTransfer = this.shouldTransferToHuman(aiResponse.metadata.intent, message);
      
      if (shouldTransfer) {
        await this.transferToHuman(conversationId, aiResponse.metadata.intent);
      }

      // Save AI response
      const savedResponse = await prisma.leasingMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: aiResponse.content,
          metadata: aiResponse.metadata
        }
      });

      return {
        conversationId,
        userMessage: message,
        aiResponse: {
          id: savedResponse.id,
          content: savedResponse.content,
          metadata: savedResponse.metadata,
          createdAt: savedResponse.createdAt
        },
        transferred: shouldTransfer
      };

    } catch (error) {
      console.error('Continue conversation error:', error);
      throw error;
    }
  }

  async generateResponse(conversation, property, userMessage, messageHistory) {
    try {
      // Analyze intent
      const intent = await this.analyzeIntent(userMessage);

      // Get property context
      const propertyContext = this.buildPropertyContext(property);

      // Build conversation history
      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt(property, propertyContext)
        }
      ];

      // Add conversation history (limited to recent messages)
      messageHistory.slice(-10).forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Handle specific intents with custom logic
      let responseContent = '';
      let additionalInfo = {};

      switch (intent.name) {
        case 'SCHEDULE_TOUR':
          const tourInfo = await this.handleTourScheduling(property, userMessage);
          responseContent = tourInfo.response;
          additionalInfo = { tourOptions: tourInfo.options };
          break;

        case 'CHECK_AVAILABILITY':
          responseContent = await this.handleAvailabilityCheck(property);
          break;

        case 'ASK_PRICE':
          responseContent = this.handlePriceInquiry(property);
          break;

        case 'APPLICATION_PROCESS':
          responseContent = await this.handleApplicationProcess(property);
          break;

        case 'ASK_AMENITIES':
          responseContent = this.handleAmenitiesInquiry(property);
          break;

        default:
          // Generate general AI response
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 500,
            temperature: 0.7
          });
          responseContent = response.choices[0].message.content;
      }

      return {
        content: responseContent,
        metadata: {
          intent: intent.name,
          confidence: intent.confidence,
          timestamp: new Date().toISOString(),
          ...additionalInfo
        }
      };

    } catch (error) {
      console.error('Generate response error:', error);
      return {
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact our leasing team directly.",
        metadata: {
          error: error.message,
          intent: 'ERROR'
        }
      };
    }
  }

  async analyzeIntent(message) {
    const prisma = require('../../../config/prisma');

    // Get predefined intents
    const intents = await prisma.leasingIntent.findMany({
      where: { isActive: true }
    });

    // Simple keyword-based intent detection
    const messageLower = message.toLowerCase();
    
    for (const intent of intents) {
      const matchCount = intent.keywords.filter(keyword => 
        messageLower.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > 0) {
        return {
          name: intent.name,
          confidence: matchCount / intent.keywords.length,
          description: intent.description
        };
      }
    }

    // Use AI for more complex intent detection
    try {
      const intentPrompt = `Analyze the following message and classify the intent:

Message: "${message}"

Possible intents:
- SCHEDULE_TOUR: User wants to schedule a property tour
- CHECK_AVAILABILITY: User asking about property availability
- ASK_PRICE: User asking about rent or pricing
- APPLICATION_PROCESS: User asking about how to apply
- ASK_AMENITIES: User asking about property features/amenities
- ASK_LOCATION: User asking about neighborhood/location
- ASK_UTILITIES: User asking about utilities/bills
- ASK_PETS: User asking about pet policy
- GENERAL_QUESTION: General inquiry
- OTHER: Doesn't fit other categories

Respond with just the intent name:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: intentPrompt }],
        max_tokens: 50,
        temperature: 0.3
      });

      const detectedIntent = response.choices[0].message.content.trim();

      return {
        name: detectedIntent,
        confidence: 0.8,
        description: `AI-detected intent: ${detectedIntent}`
      };

    } catch (error) {
      console.error('Intent analysis error:', error);
      return {
        name: 'GENERAL_QUESTION',
        confidence: 0.5,
        description: 'Default fallback intent'
      };
    }
  }

  buildPropertyContext(property) {
    return {
      title: property.title,
      description: property.description,
      rent: property.rentAmount,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.squareFeet,
      address: `${property.addressStreet}, ${property.addressCity}, ${property.addressState} ${property.addressZip}`,
      propertyType: property.propertyType,
      amenities: property.amenities || [],
      petPolicy: property.petPolicy,
      utilities: property.utilities,
      isAvailable: property.isAvailable,
      availableFrom: property.availableFrom,
      landlord: {
        name: `${property.landlord.firstName} ${property.landlord.lastName}`,
        email: property.landlord.email,
        phone: property.landlord.phone
      }
    };
  }

  getSystemPrompt(property, context) {
    return `You are PropertyPulse AI, a helpful leasing assistant for the property "${context.title}".

PROPERTY DETAILS:
- Location: ${context.address}
- Rent: $${context.rent}/month
- Type: ${context.propertyType}
- Bedrooms: ${context.bedrooms}
- Bathrooms: ${context.bathrooms}
- Square Feet: ${context.squareFeet || 'Not specified'}
- Available: ${context.isAvailable ? 'Yes' : 'No'}
- Available From: ${context.availableFrom ? format(new Date(context.availableFrom), 'MMMM dd, yyyy') : 'Immediately'}

AMENITIES: ${context.amenities.length > 0 ? context.amenities.join(', ') : 'Standard amenities'}

PET POLICY: ${context.petPolicy || 'Please inquire about pet policy'}

LANDLORD CONTACT: ${context.landlord.name}

GUIDELINES:
- Be friendly, helpful, and professional
- Focus on this specific property
- Provide accurate information based on the property details above
- For tours, suggest contacting the landlord or offer to help schedule
- For applications, guide them through the process
- If you can't answer something, offer to connect them with the landlord
- Always be honest about what you know and don't know
- Keep responses conversational and not too formal
- Don't make up information not provided in the property details

Current date: ${format(new Date(), 'MMMM dd, yyyy')}`;
  }

  async handleTourScheduling(property, message) {
    // Extract potential dates/times from message
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const dayAfterTomorrow = addDays(now, 2);

    const tourOptions = [
      {
        date: format(tomorrow, 'EEEE, MMMM dd'),
        times: ['10:00 AM', '2:00 PM', '4:00 PM']
      },
      {
        date: format(dayAfterTomorrow, 'EEEE, MMMM dd'),
        times: ['10:00 AM', '2:00 PM', '4:00 PM']
      }
    ];

    const response = `I'd be happy to help you schedule a tour of ${property.title}! 

Here are some available times:

${tourOptions.map(option => 
  `**${option.date}:**\n${option.times.map(time => `- ${time}`).join('\n')}`
).join('\n\n')}

Would any of these times work for you? If not, let me know what times work better and I'll check availability.

You can also contact the landlord directly:
📧 ${property.landlord.email}
📞 ${property.landlord.phone || 'Phone available upon request'}`;

    return {
      response,
      options: tourOptions
    };
  }

  async handleAvailabilityCheck(property) {
    if (property.isAvailable) {
      const availableFrom = property.availableFrom 
        ? format(new Date(property.availableFrom), 'MMMM dd, yyyy')
        : 'immediately';

      return `Great news! ${property.title} is currently available for rent starting ${availableFrom}.

**Key Details:**
- Monthly Rent: $${property.rentAmount}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Location: ${property.addressCity}, ${property.addressState}

Would you like to schedule a tour or learn more about the application process?`;
    } else {
      return `Unfortunately, ${property.title} is not currently available for rent. However, I'd be happy to help you find similar properties in the area or add you to our waitlist in case something opens up.

Would you like me to help you search for similar properties?`;
    }
  }

  handlePriceInquiry(property) {
    const rent = property.rentAmount;
    const deposit = property.deposit || rent;

    return `Here's the pricing information for ${property.title}:

**Monthly Rent:** $${rent}
**Security Deposit:** $${deposit}
${property.squareFeet ? `**Price per sq ft:** $${(rent / property.squareFeet).toFixed(2)}` : ''}

This rent includes: ${property.utilities?.included?.length > 0 ? property.utilities.included.join(', ') : 'Basic utilities (please confirm with landlord)'}

Additional costs may include:
- Utility setup and monthly bills (if not included)
- Parking (if applicable)
- Pet deposit/fee (if you have pets)

Would you like more details about what's included or help with the application process?`;
  }

  async handleApplicationProcess(property) {
    return `I'm happy to walk you through the application process for ${property.title}!

**How to Apply:**
1. **Schedule a Tour** - See the property in person first
2. **Prepare Documents** - You'll typically need:
   • Photo ID
   • Proof of income (pay stubs, employment letter)
   • Bank statements
   • References from previous landlords
   • Completed rental application
3. **Submit Application** - Along with application fee (if required)
4. **Background Check** - Credit and background screening
5. **Lease Signing** - If approved, review and sign lease agreement

**Timeline:** Most applications are processed within 2-3 business days.

**Next Steps:** 
- Schedule a tour if you haven't already
- Start gathering your documents
- Contact the landlord with any specific questions

Would you like help scheduling a tour or do you have questions about any of these steps?`;
  }

  handleAmenitiesInquiry(property) {
    const amenities = property.amenities || [];
    
    if (amenities.length === 0) {
      return `${property.title} includes standard residential amenities. For a complete list of features and amenities, I'd recommend scheduling a tour or contacting the landlord directly at ${property.landlord.email}.

Would you like me to help you schedule a tour to see all the features in person?`;
    }

    return `Here are the amenities available at ${property.title}:

${amenities.map(amenity => `• ${amenity}`).join('\n')}

${property.petPolicy ? `\n**Pet Policy:** ${property.petPolicy}` : ''}

Is there a specific amenity you were looking for? I'd be happy to provide more details or help you schedule a tour to see everything in person!`;
  }

  shouldTransferToHuman(intent, message) {
    // Transfer conditions
    const transferIntents = ['COMPLEX_QUESTION', 'COMPLAINT', 'LEGAL_QUESTION'];
    const transferKeywords = [
      'speak to human', 'talk to person', 'real person',
      'manager', 'complaint', 'legal', 'lawyer',
      'discrimination', 'violation', 'problem'
    ];

    if (transferIntents.includes(intent)) {
      return true;
    }

    const messageLower = message.toLowerCase();
    return transferKeywords.some(keyword => messageLower.includes(keyword));
  }

  async transferToHuman(conversationId, reason) {
    const prisma = require('../../../config/prisma');

    await prisma.leasingConversation.update({
      where: { id: conversationId },
      data: {
        status: 'TRANSFERRED',
        context: {
          transferReason: reason,
          transferredAt: new Date()
        }
      }
    });

    // Here you would typically:
    // 1. Notify human agents
    // 2. Send email to landlord
    // 3. Create ticket in support system
    console.log(`Conversation ${conversationId} transferred to human: ${reason}`);
  }
}

module.exports = LeasingAssistantService;
```

### Step 4.4: Leasing Assistant API Routes

**Create: `server/src/modules/ai/routes/leasingAssistantRoutes.js`**

```javascript
const express = require('express');
const LeasingAssistantService = require('../services/leasingAssistantService');

const router = express.Router();
const assistantService = new LeasingAssistantService();

// Start new leasing conversation (public endpoint)
router.post('/start',
  async (req, res) => {
    try {
      const {
        propertyId,
        inquirerEmail,
        inquirerName,
        inquirerPhone,
        message
      } = req.body;

      if (!propertyId || !inquirerEmail || !message) {
        return res.status(400).json({
          success: false,
          message: 'Property ID, email, and message are required'
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inquirerEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required'
        });
      }

      const conversation = await assistantService.startConversation(
        propertyId,
        inquirerEmail,
        inquirerName,
        inquirerPhone,
        message
      );

      res.json({
        success: true,
        conversation
      });

    } catch (error) {
      console.error('Start conversation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start conversation'
      });
    }
  }
);

// Continue existing conversation (public endpoint)
router.post('/continue',
  async (req, res) => {
    try {
      const { conversationId, message } = req.body;

      if (!conversationId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID and message are required'
        });
      }

      const response = await assistantService.continueConversation(
        conversationId,
        message.trim()
      );

      res.json({
        success: true,
        response
      });

    } catch (error) {
      console.error('Continue conversation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to continue conversation'
      });
    }
  }
);

// Get conversation history (public endpoint - limited access)
router.get('/conversations/:conversationId',
  async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required to access conversation'
        });
      }

      const prisma = require('../../../config/prisma');

      const conversation = await prisma.leasingConversation.findFirst({
        where: {
          id: req.params.conversationId,
          inquirerEmail: email // Security: only allow access with matching email
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              addressCity: true,
              addressState: true
            }
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied'
        });
      }

      res.json({
        success: true,
        conversation: {
          id: conversation.id,
          status: conversation.status,
          property: conversation.property,
          messages: conversation.messages,
          createdAt: conversation.createdAt
        }
      });

    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation'
      });
    }
  }
);

// Simulate message endpoint (for testing)
router.post('/simulate',
  async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
          success: false,
          message: 'Endpoint not available in production'
        });
      }

      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Mock AI response for testing
      const mockResponses = {
        'schedule tour': 'I\'d be happy to help you schedule a tour! What days work best for you?',
        'what is the rent': 'The monthly rent for this property is listed in the details above. Would you like more information about what\'s included?',
        'is it available': 'Yes, this property is currently available for rent. Would you like to schedule a tour?',
        'application process': 'The application process typically involves submitting an application with required documents, background check, and lease signing. Would you like me to walk you through the details?'
      };

      const messageLower = message.toLowerCase();
      let response = 'Thank you for your message! I\'m here to help you with any questions about this property. How can I assist you today?';

      for (const [key, value] of Object.entries(mockResponses)) {
        if (messageLower.includes(key)) {
          response = value;
          break;
        }
      }

      res.json({
        success: true,
        aiResponse: {
          content: response,
          timestamp: new Date().toISOString(),
          isSimulated: true
        }
      });

    } catch (error) {
      console.error('Simulate message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to simulate message'
      });
    }
  }
);

module.exports = router;
```

### Step 4.5: Feature Flag Integration

**Update `server/server.js`:**

```javascript
// AI Lease Generation routes (feature-flagged)
if (process.env.AI_LEASE_GENERATION === 'true') {
  console.log('📄 Loading AI lease generation routes...');
  app.use('/api/ai/leases', require('./src/modules/ai/routes/leaseGenerationRoutes'));
  console.log('✅ AI lease generation routes loaded');
} else {
  console.log('⚠️ AI lease generation disabled - AI_LEASE_GENERATION is not "true"');
}

// AI Leasing Assistant routes (feature-flagged)
if (process.env.AI_LEASING_ASSISTANT === 'true') {
  console.log('🤖 Loading AI leasing assistant routes...');
  app.use('/api/ai/assistant', require('./src/modules/ai/routes/leasingAssistantRoutes'));
  console.log('✅ AI leasing assistant routes loaded');
} else {
  console.log('⚠️ AI leasing assistant disabled - AI_LEASING_ASSISTANT is not "true"');
}
```

**Update `.env.example`:**

```bash
# AI Lease Generation
AI_LEASE_GENERATION=false

# AI Leasing Assistant  
AI_LEASING_ASSISTANT=false
```

### Step 4.6: Seed Default Intents and Clauses

**Create: `server/scripts/seedAIData.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedLeasingIntents() {
  const intents = [
    {
      name: 'SCHEDULE_TOUR',
      description: 'User wants to schedule a property tour',
      keywords: ['tour', 'visit', 'see property', 'schedule', 'viewing', 'show'],
      response: 'I\'d be happy to help you schedule a tour! What times work best for you?'
    },
    {
      name: 'CHECK_AVAILABILITY',
      description: 'User asking about property availability',
      keywords: ['available', 'when available', 'move in', 'vacant', 'open'],
      response: 'Let me check the current availability for you.'
    },
    {
      name: 'ASK_PRICE',
      description: 'User asking about rent or pricing',
      keywords: ['rent', 'price', 'cost', 'how much', 'monthly', 'deposit'],
      response: 'Here\'s the pricing information for this property.'
    },
    {
      name: 'APPLICATION_PROCESS',
      description: 'User asking about how to apply',
      keywords: ['apply', 'application', 'how to rent', 'process', 'requirements'],
      response: 'I\'ll walk you through our application process step by step.'
    },
    {
      name: 'ASK_AMENITIES',
      description: 'User asking about property features/amenities',
      keywords: ['amenities', 'features', 'include', 'facilities', 'gym', 'parking', 'laundry'],
      response: 'Here are the amenities and features available at this property.'
    },
    {
      name: 'ASK_PETS',
      description: 'User asking about pet policy',
      keywords: ['pet', 'dog', 'cat', 'animal', 'pet policy', 'pet friendly'],
      response: 'Let me provide you with information about our pet policy.'
    }
  ];

  for (const intent of intents) {
    await prisma.leasingIntent.upsert({
      where: { name: intent.name },
      update: intent,
      create: intent
    });
  }

  console.log(`✅ Seeded ${intents.length} leasing intents`);
}

async function seedLeaseClauses() {
  const clauses = [
    {
      category: 'RENT',
      title: 'Rent Payment Terms',
      content: 'Tenant agrees to pay monthly rent of $[RENT_AMOUNT] on or before the [DUE_DAY] of each month. Late fees of $[LATE_FEE] will apply after [GRACE_PERIOD] days.',
      isRequired: true,
      jurisdiction: null
    },
    {
      category: 'SECURITY_DEPOSIT',
      title: 'Security Deposit',
      content: 'Tenant will pay a security deposit of $[DEPOSIT_AMOUNT] upon lease signing. This deposit will be held to cover any damages beyond normal wear and tear.',
      isRequired: true,
      jurisdiction: null
    },
    {
      category: 'PETS',
      title: 'Pet Policy',
      content: 'Pets are permitted with prior written approval from Landlord. Additional pet deposit of $[PET_DEPOSIT] and monthly pet rent of $[PET_RENT] may apply.',
      isRequired: false,
      conditions: { petsAllowed: true }
    },
    {
      category: 'MAINTENANCE',
      title: 'Maintenance Responsibilities',
      content: 'Landlord is responsible for major repairs and maintenance. Tenant is responsible for routine maintenance, cleaning, and repairs due to tenant negligence.',
      isRequired: true,
      jurisdiction: null
    },
    {
      category: 'TERMINATION',
      title: 'Lease Termination',
      content: 'Either party may terminate this lease with [NOTICE_PERIOD] days written notice. Early termination by tenant may result in forfeiture of security deposit.',
      isRequired: true,
      jurisdiction: null
    }
  ];

  for (const clause of clauses) {
    await prisma.leaseClause.upsert({
      where: { category_title: { category: clause.category, title: clause.title } },
      update: clause,
      create: clause
    });
  }

  console.log(`✅ Seeded ${clauses.length} lease clauses`);
}

async function main() {
  try {
    console.log('🌱 Seeding AI data...');
    
    await seedLeasingIntents();
    await seedLeaseClauses();
    
    console.log('✅ AI data seeding completed');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seed script error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { main };
```

### Step 4.7: Install Additional Dependencies

```bash
cd server
npm install date-fns multer
```

---

This completes **Part 3 (AI Lease Generation)** and **Part 4 (AI Leasing Assistant)** of Phase 2. 

The AI features now include:
- ✅ Document search and AI chat
- ✅ Smart property matching with scoring
- ✅ AI lease generation with templates and compliance
- ✅ Conversational leasing assistant

Next up would be **Phase 3: Business Features (Parts 5-8)**. Would you like me to continue with the business features or would you prefer to review and implement the AI features first?

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive implementation guide structure", "status": "completed", "activeForm": "Creating implementation guide structure"}, {"content": "Document AI features implementation (Parts 1-4)", "status": "in_progress", "activeForm": "Documenting AI features"}, {"content": "Document business features implementation (Parts 5-8)", "status": "pending", "activeForm": "Documenting business features"}, {"content": "Create QA and testing guidelines (Part 9)", "status": "pending", "activeForm": "Creating QA guidelines"}, {"content": "Add safety checks and rollback procedures", "status": "pending", "activeForm": "Adding safety procedures"}, {"content": "Create feature flag management guide", "status": "pending", "activeForm": "Creating feature flag guide"}]