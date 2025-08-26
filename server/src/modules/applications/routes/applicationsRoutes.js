// server/src/modules/applications/routes/applicationsRoutes.js
// UPDATED FOR FIREBASE AUTHENTICATION

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

console.log('🔍 Applications routes file loaded');
console.log('🔍 APPLICATIONS_E2E =', JSON.stringify(process.env.APPLICATIONS_E2E));

// Feature flag check - FIXED with trim()
if (process.env.APPLICATIONS_E2E?.trim() !== 'true') {
  console.log('⚠️ Applications routes disabled by feature flag');
  module.exports = router;
  return;
}

console.log('✅ Applications routes enabled, defining routes...');

// RATE LIMITERS
const applicationSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 applications per 15 minutes
  message: {
    success: false,
    error: 'Too many applications submitted. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many applications submitted. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

const generalAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Import dependencies AFTER feature flag check
const applicationsController = require('../controller/applicationsController');
const { authenticateUser, authorizeRoles } = require('../../../middleware/auth');

console.log('📦 Dependencies imported successfully');

// PUBLIC ROUTES

// TEST ROUTE (updated to show rate limiting is configured)
router.get('/applications-test', (req, res) => {
  console.log('🧪 GET /api/applications-test route hit');
  res.json({
    success: true,
    message: 'Applications routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    rateLimiting: 'enabled',
    authentication: 'firebase'
  });
});

// Submit application WITH RATE LIMITING (PUBLIC - no auth needed for submissions)
router.post('/applications', applicationSubmissionLimiter, (req, res) => {
  console.log('📝 POST /api/applications route hit with rate limiting');
  applicationsController.submitApplication(req, res);
});

console.log('✅ Public routes defined with rate limiting');

// PROTECTED ROUTES - Require Firebase authentication
console.log('🔐 Setting up Firebase authentication middleware...');

// Apply authentication to protected routes
router.use('/applications/:id/status', authenticateUser);
router.use('/applications/:id/pdf', authenticateUser);

// For listing applications, we need both auth and the specific route
router.get('/applications', authenticateUser, authorizeRoles('LANDLORD', 'ADMIN'), (req, res) => {
  console.log('📋 GET /api/applications route hit (protected, Firebase auth)');
  console.log('🔍 Firebase user:', req.user.uid, req.user.email);
  applicationsController.listApplications(req, res);
});

// PROTECTED LANDLORD ROUTES (specific routes first)
router.patch('/applications/:id/status', authorizeRoles('LANDLORD', 'ADMIN'), (req, res) => {
  console.log('✏️ PATCH /api/applications/:id/status route hit (protected, Firebase auth)');
  console.log('🔍 Firebase user:', req.user.uid, req.user.email);
  applicationsController.updateStatus(req, res);
});

router.get('/applications/:id/pdf', authorizeRoles('LANDLORD', 'ADMIN'), (req, res) => {
  console.log('📄 GET /api/applications/:id/pdf route hit (protected, Firebase auth)');
  console.log('🔍 Firebase user:', req.user.uid, req.user.email);
  applicationsController.downloadPdf(req, res);
});

// Get single application - PROTECTED
router.get('/applications/:id', authenticateUser, authorizeRoles('LANDLORD', 'ADMIN'), (req, res) => {
  console.log('👀 GET /api/applications/:id route hit for ID:', req.params.id, '(protected, Firebase auth)');
  console.log('🔍 Firebase user:', req.user.uid, req.user.email);
  applicationsController.getApplication(req, res);
});

console.log('✅ All applications routes registered with Firebase authentication and rate limiting:');
console.log('   GET  /api/applications-test (public)');
console.log('   POST /api/applications (public, rate limited: 3 per 15min)');
console.log('   GET  /api/applications (protected, Firebase auth, landlord only)');
console.log('   PATCH /api/applications/:id/status (protected, Firebase auth, landlord only)');
console.log('   GET  /api/applications/:id/pdf (protected, Firebase auth, landlord only)');
console.log('   GET  /api/applications/:id (protected, Firebase auth, landlord only)');

module.exports = router;