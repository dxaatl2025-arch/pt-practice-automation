// server/src/routes/admin.js
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const adminController = require('../controllers/adminController');
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

// Apply authentication to all admin routes
router.use(authenticateUser);
router.use(authorizeRoles('ADMIN'));

// Dashboard and system overview
// @route   GET /api/admin/dashboard
// @desc    Get system dashboard with metrics
// @access  Private (Admin only)
router.get('/dashboard', adminController.getDashboard);

// User management routes
// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['ADMIN', 'LANDLORD', 'TENANT']).withMessage('Invalid role'),
  query('search').optional().trim(),
  handleValidationErrors
], adminController.getUsers);

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/users', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['ADMIN', 'LANDLORD', 'TENANT']).withMessage('Invalid role'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
], adminController.createUser);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', [
  param('id').isLength({ min: 1 }).withMessage('User ID is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['ADMIN', 'LANDLORD', 'TENANT']).withMessage('Invalid role'),
  body('phone').optional().matches(/^\+?[\d\s\-\(\)]+$/).withMessage('Invalid phone number format'),
  handleValidationErrors
], adminController.updateUser);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', [
  param('id').isLength({ min: 1 }).withMessage('User ID is required'),
  handleValidationErrors
], adminController.deleteUser);

// Property management routes
// @route   GET /api/admin/properties
// @desc    Get all properties across all landlords
// @access  Private (Admin only)
router.get('/properties', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RENTED']).withMessage('Invalid status'),
  query('landlordId').optional().isLength({ min: 1 }).withMessage('Invalid landlord ID'),
  handleValidationErrors
], adminController.getAllProperties);

// System management routes
// @route   GET /api/admin/system/health
// @desc    Get system health status
// @access  Private (Admin only)
router.get('/system/health', adminController.getSystemHealth);

// @route   PUT /api/admin/system/maintenance
// @desc    Toggle system maintenance mode
// @access  Private (Admin only)
router.put('/system/maintenance', [
  body('enabled').isBoolean().withMessage('Enabled must be a boolean'),
  handleValidationErrors
], adminController.toggleMaintenanceMode);

module.exports = router;