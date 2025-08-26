// server/src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user with Firebase and database
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['landlord', 'tenant', 'admin'])
    .withMessage('Role must be landlord, tenant, or admin'),
  body('phone')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Valid phone number required if provided')
], authLimiter, authController.register);

// @route   POST /api/auth/login
// @desc    Login user with Firebase ID token
// @access  Public
router.post('/login', [
  body('idToken')
    .notEmpty()
    .isLength({ min: 50 })
    .withMessage('Valid Firebase ID token is required')
], authLimiter, authController.login);

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', authenticateUser, authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^[\+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Valid phone number required'),
  body('budgetMin')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budgetMax')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('preferredBedrooms')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Preferred bedrooms must be between 0 and 10'),
  body('preferredLocations')
    .optional()
    .isArray()
    .withMessage('Preferred locations must be an array')
], authenticateUser, authController.updateProfile);

// @route   POST /api/auth/refresh
// @desc    Refresh Firebase token (for frontend to handle)
// @access  Private
router.post('/refresh', authenticateUser, (req, res) => {
  res.json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.id,
        firebaseUid: req.user.firebaseUid,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user (revoke token)
// @access  Private
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    // Revoke all refresh tokens for the user
    const admin = require('../config/firebase');
    await admin.auth().revokeRefreshTokens(req.user.firebaseUid);
    
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to logout'
    });
  }
});

module.exports = router;