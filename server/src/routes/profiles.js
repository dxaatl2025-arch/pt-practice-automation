const express = require('express');
const { body, param, validationResult } = require('express-validator');
const tenantProfileController = require('../controllers/tenantProfileController');
const propertyMatchProfileController = require('../controllers/propertyMatchProfileController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Feature flag check
const checkFeatureFlag = (req, res, next) => {
  if (process.env.MATCHING_PROFILES !== 'true') {
    return res.status(404).json({ success: false, message: 'Feature not enabled' });
  }
  next();
};

// Validation middleware
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

// Tenant profile validation
const tenantProfileValidation = [
  body('budgetMin').optional().isInt({ min: 0 }).withMessage('Budget min must be positive'),
  body('budgetMax').optional().isInt({ min: 0 }).withMessage('Budget max must be positive'),
  body('beds').optional().isInt({ min: 0, max: 10 }).withMessage('Beds must be 0-10'),
  body('baths').optional().isInt({ min: 0, max: 10 }).withMessage('Baths must be 0-10'),
  body('pets').optional().isArray().withMessage('Pets must be an array'),
  body('smoker').optional().isBoolean().withMessage('Smoker must be boolean'),
  body('locations').optional().isArray().withMessage('Locations must be an array'),
  body('vehicle').optional().isBoolean().withMessage('Vehicle must be boolean'),
  body('householdSize').optional().isInt({ min: 1, max: 20 }).withMessage('Household size must be 1-20'),
  body('mustHaves').optional().isArray().withMessage('Must haves must be an array'),
  body('noGos').optional().isArray().withMessage('No gos must be an array')
];

// Property match profile validation
const propertyMatchProfileValidation = [
  body('rent').optional().isInt({ min: 0 }).withMessage('Rent must be positive'),
  body('beds').optional().isInt({ min: 0, max: 10 }).withMessage('Beds must be 0-10'),
  body('baths').optional().isInt({ min: 0, max: 10 }).withMessage('Baths must be 0-10'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('parking').optional().isBoolean().withMessage('Parking must be boolean'),
  body('termMonths').optional().isInt({ min: 1, max: 36 }).withMessage('Term months must be 1-36'),
  body('mustHaves').optional().isArray().withMessage('Must haves must be an array'),
  body('noGos').optional().isArray().withMessage('No gos must be an array')
];

// Routes with authentication and validation
router.get('/tenant', authenticateUser, checkFeatureFlag, tenantProfileController.getProfile);

router.put('/tenant', authenticateUser, checkFeatureFlag, tenantProfileValidation, handleValidationErrors, tenantProfileController.updateProfile);

router.get('/property/:propertyId', authenticateUser, checkFeatureFlag, 
  param('propertyId').isLength({ min: 1 }).withMessage('Property ID required'),
  handleValidationErrors,
  propertyMatchProfileController.getProfile
);

router.put('/property/:propertyId', authenticateUser, checkFeatureFlag,
  param('propertyId').isLength({ min: 1 }).withMessage('Property ID required'),
  propertyMatchProfileValidation,
  handleValidationErrors,
  propertyMatchProfileController.updateProfile
);

// Test routes for debugging
router.get('/test-mock', async (req, res) => {
  try {
    console.log('🧪 Testing with mock user...');
    
    // Mock a user for testing
    req.user = { id: 'test-user-123' };
    
    // Test the repository directly
    const repositoryFactory = require('../repositories/factory');
    const tenantRepo = repositoryFactory.getTenantProfileRepository();
    
    console.log('🔍 Testing repository with user ID:', req.user.id);
    
    // Try to find profile
    const profile = await tenantRepo.findByUserId(req.user.id);
    console.log('📋 Found profile:', profile);
    
    res.json({ 
      success: true, 
      message: 'Test successful',
      data: profile,
      userId: req.user.id,
      dbTarget: process.env.DB_TARGET
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

router.put('/test-mock', async (req, res) => {
  try {
    console.log('🧪 Testing profile upsert...');
    
    req.user = { id: 'test-user-123' };
    const testData = {
      budgetMin: 1500,
      budgetMax: 2500,
      beds: 2,
      pets: ['cat']
    };
    
    const repositoryFactory = require('../repositories/factory');
    const tenantRepo = repositoryFactory.getTenantProfileRepository();
    
    console.log('🔍 Creating/updating profile for user:', req.user.id);
    const profile = await tenantRepo.upsert(req.user.id, testData);
    
    res.json({ 
      success: true, 
      message: 'Profile created/updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Upsert test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
// Add at the bottom before module.exports
router.get('/debug-auth', (req, res) => {
  // Mock user for testing authenticated endpoints
  req.user = { id: 'cmebz1cm80002u620h4gvm3j4' }; // Real user ID
  tenantProfileController.getProfile(req, res);
});
router.put('/debug-auth', (req, res) => {
  console.log('🧪 Debug auth update route hit');
  req.user = { id: 'cmebz1cm80002u620h4gvm3j4' };
  req.body = {
    budgetMin: 1800,
    budgetMax: 2800,
    beds: 3,
    pets: ['cat', 'dog'],
    locations: ['Atlanta', 'Buckhead', 'Midtown']
  };
  tenantProfileController.updateProfile(req, res);
});
module.exports = router;