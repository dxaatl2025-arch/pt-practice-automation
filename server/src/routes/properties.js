// server/src/routes/properties.js - FIXED with Authentication
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Middleware to handle validation errors
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

// PUBLIC ROUTES (No authentication required)
// @route   GET /api/properties
// @desc    List all properties (public for browsing)
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('city').optional().trim(),
  query('state').optional().trim(),
  query('minRent').optional().isFloat({ min: 0 }).withMessage('Minimum rent must be positive'),
  query('maxRent').optional().isFloat({ min: 0 }).withMessage('Maximum rent must be positive'),
  query('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  query('bathrooms').optional().isFloat({ min: 0 }).withMessage('Bathrooms must be non-negative'),
  handleValidationErrors
], propertyController.listProperties);

// @route   GET /api/properties/:id
// @desc    Get single property (public for viewing)
// @access  Public
router.get('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Property ID is required'),
  handleValidationErrors
], propertyController.getProperty);

// PROTECTED ROUTES - Require authentication
// Apply authentication middleware to all routes below
router.use(authenticateUser);

// @route   POST /api/properties
// @desc    Create new property
// @access  Private (Landlords only)
router.post('/', [
  authorizeRoles('LANDLORD', 'ADMIN'),
  body('title').trim().notEmpty().withMessage('Property title is required'),
  body('description').trim().notEmpty().withMessage('Property description is required'),
  body('propertyType').isIn(['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO']).withMessage('Invalid property type'),
  body('addressStreet').trim().notEmpty().withMessage('Street address is required'),
  body('addressCity').trim().notEmpty().withMessage('City is required'),
  body('addressState').trim().notEmpty().withMessage('State is required'),
  body('addressZip').trim().notEmpty().withMessage('ZIP code is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be non-negative'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('squareFeet').optional().isInt({ min: 1 }).withMessage('Square feet must be positive'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('petPolicy').optional().isIn(['NO_PETS', 'CATS_ONLY', 'DOGS_ONLY', 'CATS_AND_DOGS']).withMessage('Invalid pet policy'),
  handleValidationErrors
], propertyController.createProperty);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Property owner or Admin)
router.put('/:id', [
  authorizeRoles('LANDLORD', 'ADMIN'),
  param('id').isLength({ min: 1 }).withMessage('Property ID is required'),
  body('title').optional().trim().notEmpty().withMessage('Property title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Property description cannot be empty'),
  body('propertyType').optional().isIn(['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO']).withMessage('Invalid property type'),
  body('addressStreet').optional().trim().notEmpty().withMessage('Street address cannot be empty'),
  body('addressCity').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('addressState').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('addressZip').optional().trim().notEmpty().withMessage('ZIP code cannot be empty'),
  body('bedrooms').optional().isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').optional().isFloat({ min: 0 }).withMessage('Bathrooms must be non-negative'),
  body('rentAmount').optional().isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('squareFeet').optional().isInt({ min: 1 }).withMessage('Square feet must be positive'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('petPolicy').optional().isIn(['NO_PETS', 'CATS_ONLY', 'DOGS_ONLY', 'CATS_AND_DOGS']).withMessage('Invalid pet policy'),
  handleValidationErrors
], propertyController.updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Property owner or Admin)
router.delete('/:id', [
  authorizeRoles('LANDLORD', 'ADMIN'),
  param('id').isLength({ min: 1 }).withMessage('Property ID is required'),
  handleValidationErrors
], propertyController.deleteProperty);

module.exports = router;