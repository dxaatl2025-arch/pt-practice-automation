 // src/routes/leases.js
const express = require('express');
const { body, query } = require('express-validator');
const leaseController = require('../controllers/leaseController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/leases
// @desc    Get all leases with filters
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['draft', 'active', 'expired', 'terminated', 'pending_approval']),
  query('landlord').optional().isMongoId(),
  query('tenant').optional().isMongoId(),
  query('property').optional().isMongoId()
], leaseController.getLeases);

// @route   GET /api/leases/:id
// @desc    Get lease by ID
// @access  Private
router.get('/:id', leaseController.getLease);

// @route   POST /api/leases
// @desc    Create new lease
// @access  Private (Landlords only)
router.post('/', [
  body('property').isMongoId().withMessage('Valid property ID required'),
  body('tenant').isMongoId().withMessage('Valid tenant ID required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('monthlyRent').isNumeric({ min: 0 }).withMessage('Valid monthly rent required'),
  body('securityDeposit').isNumeric({ min: 0 }).withMessage('Valid security deposit required'),
  body('terms').isLength({ min: 10 }).withMessage('Lease terms required')
], leaseController.createLease);

// @route   PUT /api/leases/:id
// @desc    Update lease
// @access  Private
router.put('/:id', leaseController.updateLease);

// @route   DELETE /api/leases/:id
// @desc    Delete lease
// @access  Private
router.delete('/:id', leaseController.deleteLease);

// @route   POST /api/leases/:id/sign
// @desc    Sign lease agreement
// @access  Private
router.post('/:id/sign', [
  body('signedBy').isIn(['tenant', 'landlord']).withMessage('signedBy must be tenant or landlord')
], leaseController.signLease);

module.exports = router;
