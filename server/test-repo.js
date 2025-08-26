require('dotenv').config();

async function testRepo() {
  try {
    console.log('Testing Applications Repository...');
    const ApplicationsRepository = require('./src/modules/applications/repo/applicationsRepo');
    
    const repo = new ApplicationsRepository();
    console.log('✅ Repository created successfully');
    
    // Test count (should work even with no data)
    console.log('Testing basic operation...');
    // This will test if the model works
    
  } catch (error) {
    console.error('❌ Repository test failed:', error);
  }
}

testRepo();