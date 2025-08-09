// src/routes/users.js
const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users
// @desc    Get all users with filters
// @access  Public (for now)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('role').optional().isIn(['landlord', 'tenant', 'admin'])
], userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public (for now)
router.get('/:id', userController.getUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Public
router.post('/', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name required'),
  body('role').isIn(['landlord', 'tenant', 'admin']).withMessage('Valid role required')
], userController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name required'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name required'),
  body('role').optional().isIn(['landlord', 'tenant', 'admin']).withMessage('Valid role required')
], userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private
router.delete('/:id', userController.deleteUser);

// @route   POST /api/users/login
// @desc    User login
// @access  Public
router.post('/login', [
  body('email').optional().isEmail(),
  body('firebaseUid').optional().notEmpty()
], userController.loginUser);

module.exports = router; 
