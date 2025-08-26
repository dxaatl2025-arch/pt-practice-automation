// server/src/routes/rentalApplications.js
const express = require('express');
const router = express.Router();
const RentalApplicationController = require('../controllers/rentalApplicationController');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Import authentication middleware
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Rate limiting for application submissions
const applicationSubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 applications per windowMs
  message: {
    success: false,
    message: 'Too many applications submitted. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Application submission validation rules
const applicationValidationRules = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('phone')
    .matches(/^[\+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Valid phone number is required'),
  
  body('dateOfBirth')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const age = new Date().getFullYear() - value.getFullYear();
      if (age < 18) {
        throw new Error('Applicant must be 18 years or older');
      }
      return true;
    }),
  
  body('monthlyGrossIncome')
    .isFloat({ min: 0 })
    .withMessage('Monthly gross income must be a positive number'),
  
  body('numberOfOccupants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of occupants must be at least 1'),
  
  body('backgroundCheckConsent')
    .isBoolean()
    .custom((value) => {
      if (!value) {
        throw new Error('Background check consent is required');
      }
      return true;
    }),
  
  body('desiredMoveInDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value < new Date()) {
        throw new Error('Desired move-in date cannot be in the past');
      }
      return true;
    })
];

// IMPORTANT: Put all static routes BEFORE dynamic routes

/**
 * @route   GET /api/rental-applications/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rental applications service is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/rental-applications/search
 * @desc    Search applications with filters
 * @access  Private (landlords only)
 */
router.get('/search',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  query('email').optional().isEmail().withMessage('Valid email format required'),
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected']),
  query('landlordId').optional().isInt().withMessage('Valid landlord ID required'),
  query('propertyId').optional().isInt().withMessage('Valid property ID required'),
  query('dateFrom').optional().isISO8601().withMessage('Valid date format required for dateFrom'),
  query('dateTo').optional().isISO8601().withMessage('Valid date format required for dateTo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  handleValidationErrors,
  RentalApplicationController.searchApplications
);

/**
 * @route   GET /api/rental-applications/stats
 * @desc    Get application statistics
 * @access  Private (landlords only)
 */
router.get('/stats',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  query('landlordId').optional().isInt().withMessage('Valid landlord ID required'),
  handleValidationErrors,
  RentalApplicationController.getApplicationStats
);

/**
 * @route   POST /api/rental-applications
 * @desc    Submit a new rental application
 * @access  Public
 */
router.post('/', 
  applicationSubmissionLimit,
  applicationValidationRules,
  handleValidationErrors,
  RentalApplicationController.submitApplication
);

/**
 * @route   GET /api/rental-applications
 * @desc    Get applications with optional filters (role-based access)
 * @access  Private (tenants see own, landlords see by property)
 */
router.get('/',
  authenticateUser, // Add authentication middleware
  // Add query parameter validation
  query('applicantId').optional().isLength({ min: 1 }).withMessage('Valid applicant ID required'),
  query('landlordId').optional().isInt().withMessage('Valid landlord ID required'),
  query('propertyId').optional().isInt().withMessage('Valid property ID required'),
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().isLength({ max: 255 }).withMessage('Search term too long'),
  handleValidationErrors,
  RentalApplicationController.listApplications
);

/**
 * @route   GET /api/rental-applications/landlord/:landlordId
 * @desc    Get all applications for a specific landlord
 * @access  Private (landlords only)
 */
router.get('/landlord/:landlordId',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  param('landlordId').isInt().withMessage('Valid landlord ID is required'),
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  RentalApplicationController.getLandlordApplications
);

/**
 * @route   POST /api/rental-applications/:id/ai-score
 * @desc    Trigger AI scoring for an application
 * @access  Private (landlords only)
 */
router.post('/:id/ai-score',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  param('id').isInt().withMessage('Valid application ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const aiScoringService = require('../services/aiScoringService');
      const result = await aiScoringService.scoreApplication(req.params.id);
      
      res.json({
        success: true,
        message: 'AI scoring completed',
        data: result
      });
    } catch (error) {
      console.error('AI scoring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to score application',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/rental-applications/:id/pdf
 * @desc    Download application as PDF
 * @access  Private (landlords only)
 */
router.get('/:id/pdf',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  param('id').isInt().withMessage('Valid application ID is required'),
  handleValidationErrors,
  RentalApplicationController.downloadApplicationPDF
);

/**
 * @route   PUT /api/rental-applications/:id/status
 * @desc    Update application status
 * @access  Private (landlords only)
 */
router.put('/:id/status',
  authenticateUser,
  authorizeRoles('LANDLORD', 'ADMIN'), // Add role-based authorization
  param('id').isInt().withMessage('Valid application ID is required'),
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, under_review, approved, rejected'),
  body('reason').optional().trim().isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
  handleValidationErrors,
  RentalApplicationController.updateApplicationStatus
);

/**
 * @route   GET /api/rental-applications/:id
 * @desc    Get application by ID or application number
 * @access  Public (for applicants) / Private (for landlords)
 */
router.get('/:id',
  authenticateUser, // Add authentication middleware
  param('id').notEmpty().withMessage('Application ID is required'),
  handleValidationErrors,
  RentalApplicationController.getApplication
);

module.exports = router;