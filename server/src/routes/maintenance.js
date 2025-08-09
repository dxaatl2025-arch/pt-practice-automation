 // src/routes/maintenance.js
const express = require('express');
const { body, query } = require('express-validator');
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/maintenance
// @desc    Get all maintenance tickets with filters
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['open', 'acknowledged', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'on_hold']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'emergency']),
  query('category').optional().isIn(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest_control', 'locks_security', 'general_maintenance', 'other']),
  query('property').optional().isMongoId(),
  query('tenant').optional().isMongoId(),
  query('landlord').optional().isMongoId()
], maintenanceController.getTickets);

// @route   GET /api/maintenance/urgent
// @desc    Get urgent maintenance tickets
// @access  Private
router.get('/urgent', maintenanceController.getUrgentTickets);

// @route   GET /api/maintenance/:id
// @desc    Get maintenance ticket by ID
// @access  Private
router.get('/:id', maintenanceController.getTicket);

// @route   POST /api/maintenance
// @desc    Create new maintenance ticket
// @access  Private
router.post('/', [
  body('property').isMongoId().withMessage('Valid property ID required'),
  body('tenant').isMongoId().withMessage('Valid tenant ID required'),
  body('title').isLength({ min: 3 }).withMessage('Title required'),
  body('description').isLength({ min: 10 }).withMessage('Description required'),
  body('category').isIn(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest_control', 'locks_security', 'general_maintenance', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'emergency']),
  body('location').isLength({ min: 2 }).withMessage('Location required')
], maintenanceController.createTicket);

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance ticket
// @access  Private
router.put('/:id', maintenanceController.updateTicket);

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance ticket
// @access  Private
router.delete('/:id', maintenanceController.deleteTicket);

// @route   POST /api/maintenance/:id/assign
// @desc    Assign maintenance ticket to contractor
// @access  Private (Landlords only)
router.post('/:id/assign', [
  body('assignedTo').isLength({ min: 2 }).withMessage('Contractor name required'),
  body('estimatedCost').optional().isNumeric({ min: 0 }),
  body('scheduledDate').optional().isISO8601()
], maintenanceController.assignTicket);

// @route   POST /api/maintenance/:id/comment
// @desc    Add comment to maintenance ticket
// @access  Private
router.post('/:id/comment', [
  body('message').isLength({ min: 1 }).withMessage('Comment message required'),
  body('type').optional().isIn(['note', 'status_update', 'cost_estimate', 'completion_notice'])
], maintenanceController.addComment);

module.exports = router;
