// server/src/routes/tenants.js
const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const userController = require('../controllers/userController');

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

// @route   GET /api/tenants
// @desc    Get all tenants
// @access  Private (Landlord/Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], userController.getTenants);

module.exports = router;