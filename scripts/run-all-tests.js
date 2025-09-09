#!/usr/bin/env node
// Comprehensive test runner script
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 PropertyPulse - Comprehensive Test Suite\n');

async function runTests() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  const tests = [
    {
      name: 'Database Migration & Setup',
      command: 'npm run test:setup',
      cwd: './server'
    },
    {
      name: 'Seed Test Data',
      command: 'npm run seed:test',
      cwd: './server'
    },
    {
      name: 'Applications API Tests',
      command: 'jest tests/api/applications.test.js --runInBand --verbose',
      cwd: './server',
      env: { APPLICATIONS_E2E: 'true' }
    },
    {
      name: 'Payments API Tests', 
      command: 'jest tests/api/payments.test.js --runInBand --verbose',
      cwd: './server',
      env: { STRIPE_CORE: 'true' }
    },
    {
      name: 'Uploads API Tests',
      command: 'jest tests/api/uploads.test.js --runInBand --verbose', 
      cwd: './server',
      env: { S3_UPLOADS: 'true' }
    },
    {
      name: 'Reminders Service Tests',
      command: 'jest tests/api/reminders.test.js --runInBand --verbose',
      cwd: './server',
      env: { REMINDERS: 'true' }
    }
  ];

  for (const testSuite of tests) {
    console.log(`\n🔍 Running: ${testSuite.name}`);
    console.log('─'.repeat(50));
    
    try {
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test_user:test_pass@localhost:5432/propertypulse_test',
        JWT_SECRET: 'test_jwt_secret_32_characters_long',
        ...testSuite.env
      };

      execSync(testSuite.command, {
        cwd: testSuite.cwd,
        stdio: 'inherit',
        env
      });
      
      console.log(`✅ ${testSuite.name} - PASSED`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${testSuite.name} - FAILED`);
      console.error(error.message);
      failed++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Ready for Phase 2.');
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Tests interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Tests terminated');
  process.exit(1);
});

runTests().catch((error) => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});