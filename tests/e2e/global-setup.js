// Global setup for E2E tests
const { execSync } = require('child_process');

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...');
  
  try {
    // Set up test database
    console.log('📊 Setting up test database...');
    execSync('npm run test:setup', { 
      cwd: './server',
      stdio: 'inherit'
    });
    
    // Seed test data
    console.log('🌱 Seeding test data...');
    execSync('npm run seed:test', { 
      cwd: './server',
      stdio: 'inherit'
    });
    
    // Enable all features for E2E tests
    process.env.APPLICATIONS_E2E = 'true';
    process.env.STRIPE_CORE = 'true';
    process.env.S3_UPLOADS = 'true';
    process.env.REMINDERS = 'true';
    
    console.log('✅ E2E test environment ready');
    
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  }
}

module.exports = globalSetup;