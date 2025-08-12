// server/src/routes/leases.js - FIXED TO MATCH CONTROLLER
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const leaseController = require('../controllers/leaseController');

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

// @route   GET /api/leases
// @desc    Get all leases with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status'),
  query('propertyId').optional().isLength({ min: 1 }).withMessage('Invalid property ID'),
  query('tenantId').optional().isLength({ min: 1 }).withMessage('Invalid tenant ID'),
  handleValidationErrors
], leaseController.getLeases);

// @route   GET /api/leases/:id
// @desc    Get lease by ID
// @access  Private
router.get('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Lease ID is required'),
  handleValidationErrors
], leaseController.getLease);

// @route   POST /api/leases
// @desc    Create new lease
// @access  Private
router.post('/', [
  body('property').isLength({ min: 1 }).withMessage('Property ID is required'),
  body('tenant').isLength({ min: 1 }).withMessage('Tenant ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('monthlyRent').isNumeric({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('securityDeposit').optional().isNumeric({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status'),
  handleValidationErrors
], leaseController.createLease);

// @route   PUT /api/leases/:id
// @desc    Update lease
// @access  Private
router.put('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Lease ID is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date required'),
  body('monthlyRent').optional().isNumeric({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('securityDeposit').optional().isNumeric({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status'),
  handleValidationErrors
], leaseController.updateLease);

// @route   DELETE /api/leases/:id
// @desc    Delete lease
// @access  Private
router.delete('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Lease ID is required'),
  handleValidationErrors
], leaseController.deleteLease);

// @route   GET /api/leases/property/:propertyId
// @desc    Get leases by property
// @access  Private
router.get('/property/:propertyId', [
  param('propertyId').isLength({ min: 1 }).withMessage('Property ID is required'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  handleValidationErrors
], leaseController.getLeasesByProperty);

// @route   GET /api/leases/tenant/:tenantId
// @desc    Get leases by tenant
// @access  Private
router.get('/tenant/:tenantId', [
  param('tenantId').isLength({ min: 1 }).withMessage('Tenant ID is required'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  handleValidationErrors
], leaseController.getLeasesByTenant);

// @route   GET /api/leases/active
// @desc    Get all active leases
// @access  Private
router.get('/active', leaseController.getActiveLeases);

// @route   GET /api/leases/expiring
// @desc    Get expiring leases
// @access  Private
router.get('/expiring', [
  query('days').optional().isInt({ min: 1 }).withMessage('Days must be a positive integer'),
  handleValidationErrors
], leaseController.getExpiringLeases);

module.exports = router;