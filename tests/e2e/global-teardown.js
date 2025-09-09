// Global teardown for E2E tests
async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Any cleanup operations can go here
  // Database will be cleaned by next test run
  
  console.log('✅ E2E test environment cleaned up');
}

module.exports = globalTeardown;