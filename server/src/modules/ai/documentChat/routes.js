const express = require('express');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const DocumentChatService = require('./service');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const router = express.Router();
const documentChatService = new DocumentChatService();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept documents and images
    if (file.mimetype.startsWith('text/') || 
        file.mimetype.startsWith('application/pdf') ||
        file.mimetype.startsWith('application/msword') ||
        file.mimetype.startsWith('application/vnd.openxmlformats') ||
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs for document operations
  message: 'Too many AI document requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const chatRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 chat messages per 5 minutes
  message: 'Too many chat requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/ai/documents/upload
 * @desc Upload and process document
 * @access Private (Authenticated users)
 */
router.post('/documents/upload', 
  aiRateLimit, 
  authenticate, 
  upload.single('document'), 
  async (req, res) => {
    try {
      // Check feature flag
      if (process.env.AI_DOCUMENT_SEARCH !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'AI Document Search feature is not enabled'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document file provided'
        });
      }

      const { propertyId } = req.body;
      const document = await documentChatService.uploadDocument(
        req.user.id, 
        req.file, 
        propertyId
      );

      res.json({
        success: true,
        data: {
          document: {
            id: document.id,
            filename: document.filename,
            originalName: document.originalName,
            size: document.size,
            mimeType: document.mimeType,
            createdAt: document.createdAt
          }
        }
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/ai/documents
 * @desc Get user's documents
 * @access Private (Authenticated users)
 */
router.get('/documents', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.query;
    const documents = await documentChatService.getUserDocuments(
      req.user.id, 
      propertyId
    );

    res.json({
      success: true,
      data: { documents }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents'
    });
  }
});

/**
 * @route POST /api/ai/documents/search
 * @desc Search through documents using AI
 * @access Private (Authenticated users)
 */
router.post('/documents/search', aiRateLimit, authenticate, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_DOCUMENT_SEARCH !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Document Search feature is not enabled'
      });
    }

    const { query, propertyId } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Search query is too long (max 500 characters)'
      });
    }

    const results = await documentChatService.searchDocuments(
      req.user.id, 
      query, 
      propertyId
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/ai/chat
 * @desc Start or continue AI chat conversation
 * @access Private (Authenticated users)
 */
router.post('/chat', chatRateLimit, authenticate, async (req, res) => {
  try {
    // Check feature flag
    if (process.env.AI_DOCUMENT_CHAT !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'AI Document Chat feature is not enabled'
      });
    }

    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long (max 2000 characters)'
      });
    }

    const response = await documentChatService.chat(
      req.user.id, 
      message, 
      sessionId
    );

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/ai/chat/sessions
 * @desc Get user's chat sessions
 * @access Private (Authenticated users)
 */
router.get('/chat/sessions', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const sessions = await documentChatService.getChatSessions(
      req.user.id, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: { sessions }
    });

  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat sessions'
    });
  }
});

/**
 * @route GET /api/ai/chat/sessions/:sessionId
 * @desc Get chat session with messages
 * @access Private (Authenticated users)
 */
router.get('/chat/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await documentChatService.getChatSession(
      req.user.id, 
      sessionId
    );

    res.json({
      success: true,
      data: { session }
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat session'
    });
  }
});

module.exports = router;