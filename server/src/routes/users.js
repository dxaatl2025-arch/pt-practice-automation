// server/src/routes/users.js - FIXED ROUTES
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
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

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['ADMIN', 'LANDLORD', 'TENANT', 'PROPERTY_MANAGER']).withMessage('Invalid role'),
  handleValidationErrors
], userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', [
  param('id').isLength({ min: 1 }).withMessage('User ID is required'),
  handleValidationErrors
], userController.getUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['ADMIN', 'LANDLORD', 'TENANT', 'PROPERTY_MANAGER']).withMessage('Invalid role'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
], userController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Self/Admin)
router.put('/:id', [
  param('id').isLength({ min: 1 }).withMessage('User ID is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['ADMIN', 'LANDLORD', 'TENANT', 'PROPERTY_MANAGER']).withMessage('Invalid role'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
], userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', [
  param('id').isLength({ min: 1 }).withMessage('User ID is required'),
  handleValidationErrors
], userController.deleteUser);

module.exports = router;