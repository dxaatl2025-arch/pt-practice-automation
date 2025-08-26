const express = require('express');
const router = express.Router();

// Simple test route - NO auth middleware
router.get('/', async (req, res) => {
  try {
    console.log('🧪 Testing tenant profile repository...');
    
    const repositoryFactory = require('../repositories/factory');
    const tenantRepo = repositoryFactory.getTenantProfileRepository();
    
    // Use a real tenant user ID from your database
    const realUserId = 'cmebz1cm80002u620h4gvm3j4'; // testuser@example.com
    console.log('🔍 Testing repository with user ID:', realUserId);
    
    // Try to find profile
    const profile = await tenantRepo.findByUserId(realUserId);
    console.log('📋 Found profile:', profile);
    
    res.json({ 
      success: true, 
      message: 'Repository test successful',
      data: profile,
      userId: realUserId,
      dbTarget: process.env.DB_TARGET
    });
  } catch (error) {
    console.error('❌ Repository test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack
    });
  }
});

router.post('/create', async (req, res) => {
  try {
    console.log('🧪 Testing tenant profile creation...');
    
    const repositoryFactory = require('../repositories/factory');
    const tenantRepo = repositoryFactory.getTenantProfileRepository();
    
    // Use a real tenant user ID from your database
    const realUserId = 'cmebz1cm80002u620h4gvm3j4'; // testuser@example.com
    const testData = {
      budgetMin: 1500,
      budgetMax: 2500,
      beds: 2,
      pets: ['cat'],
      smoker: false,
      vehicle: true,
      locations: ['Atlanta', 'Decatur'],
      mustHaves: ['parking', 'gym'],
      noGos: ['smoking']
    };
    
    console.log('🔍 Creating profile for real user:', realUserId);
    console.log('📝 Test data:', testData);
    
    const profile = await tenantRepo.upsert(realUserId, testData);
    console.log('✅ Profile created:', profile);
    
    res.json({ 
      success: true, 
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('❌ Creation test error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;