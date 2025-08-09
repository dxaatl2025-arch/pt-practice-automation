// src/routes/payments.js
const express = require('express');
const { body, query } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with filters
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'failed', 'refunded', 'cancelled']),
  query('paymentType').optional().isIn(['rent', 'security_deposit', 'late_fee', 'maintenance', 'utilities', 'other']),
  query('tenant').optional().isMongoId(),
  query('landlord').optional().isMongoId(),
  query('lease').optional().isMongoId()
], paymentController.getPayments);

// @route   GET /api/payments/overdue
// @desc    Get overdue payments
// @access  Private
router.get('/overdue', paymentController.getOverduePayments);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', paymentController.getPayment);

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', [
  body('lease').isMongoId().withMessage('Valid lease ID required'),
  body('amount').isNumeric({ min: 0 }).withMessage('Valid amount required'),
  body('paymentType').isIn(['rent', 'security_deposit', 'late_fee', 'maintenance', 'utilities', 'other']),
  body('dueDate').isISO8601().withMessage('Valid due date required')
], paymentController.createPayment);

// @route   POST /api/payments/generate-rent
// @desc    Generate monthly rent payments for a lease
// @access  Private (Landlords only)
router.post('/generate-rent', [
  body('leaseId').isMongoId().withMessage('Valid lease ID required'),
  body('months').optional().isInt({ min: 1, max: 60 })
], paymentController.generateRentPayments);

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', paymentController.updatePayment);

// @route   POST /api/payments/:id/pay
// @desc    Mark payment as paid
// @access  Private
router.post('/:id/pay', [
  body('paymentMethod').optional().isIn(['credit_card', 'bank_transfer', 'check', 'cash', 'online', 'ach']),
  body('transactionId').optional().isString()
], paymentController.markAsPaid);

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private
router.delete('/:id', paymentController.deletePayment);

module.exports = router;