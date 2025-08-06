 const express = require('express');
const { body, query } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/properties
// @desc    Get all properties with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('city').optional().trim(),
  query('state').optional().trim(),
  query('minRent').optional().isNumeric(),
  query('maxRent').optional().isNumeric(),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('propertyType').optional().isIn(['apartment', 'house', 'condo', 'townhouse', 'studio', 'other'])
], propertyController.getProperties);

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', propertyController.getProperty);

// @route   POST /api/properties
// @desc    Create new property
// @access  Private (Landlords only)
router.post('/', [
  body('title').trim().isLength({ min: 5 }),
  body('description').trim().isLength({ min: 20 }),
  body('address.street').notEmpty(),
  body('address.city').notEmpty(),
  body('address.state').notEmpty(),
  body('address.zipCode').notEmpty(),
  body('propertyType').isIn(['apartment', 'house', 'condo', 'townhouse', 'studio', 'other']),
  body('bedrooms').isInt({ min: 0 }),
  body('bathrooms').isNumeric({ min: 0 }),
  body('rent.amount').isNumeric({ min: 0 })
], authenticateUser, authorizeRoles('landlord'), propertyController.createProperty);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Property owner only)
router.put('/:id', authenticateUser, propertyController.updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Property owner only)
router.delete('/:id', authenticateUser, propertyController.deleteProperty);

module.exports = router;
