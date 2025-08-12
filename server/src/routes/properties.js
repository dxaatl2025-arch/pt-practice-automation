// server/src/routes/properties.js - BASIC VERSION THAT WORKS
const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const propertyController = require('../controllers/propertyController');

// @route   GET /api/properties
// @desc    Get all properties with filtering and pagination
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
// @access  Private
router.post('/', propertyController.createProperty);

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', propertyController.updateProperty);

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private
router.delete('/:id', propertyController.deleteProperty);

// Export the router
module.exports = router;