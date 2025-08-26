const repositoryFactory = require('./src/repositories/factory');

async function testProfileRepos() {
  console.log('🧪 Testing Profile Repositories...');
  
  try {
    const tenantRepo = repositoryFactory.getTenantProfileRepository();
    console.log('✅ TenantProfile repository loaded');
    
    const propertyRepo = repositoryFactory.getPropertyMatchProfileRepository();
    console.log('✅ PropertyMatchProfile repository loaded');
    
    const feedbackRepo = repositoryFactory.getFeedbackRepository();
    console.log('✅ Feedback repository loaded');
    
    console.log('🎉 All repositories working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProfileRepos();