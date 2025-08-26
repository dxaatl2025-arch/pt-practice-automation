// diagnose-routes.js - Check what's actually loaded
const axios = require('axios');

async function diagnoseRoutes() {
  console.log('🔍 DIAGNOSING ROUTE IMPLEMENTATION');
  console.log('='.repeat(60));

  // Test 1: Check test endpoint for rate limiting indicator
  console.log('\n1. Checking test endpoint...');
  try {
    const response = await axios.get('http://localhost:5000/api/applications-test');
    console.log('✅ Test endpoint response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.rateLimiting) {
      console.log('✅ Rate limiting appears to be configured');
    } else {
      console.log('❌ Rate limiting configuration not detected');
    }
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
  }

  // Test 2: Check for rate limit headers
  console.log('\n2. Checking for rate limit headers...');
  try {
    const response = await axios.post('http://localhost:5000/api/applications', {});
    
    console.log('Response headers:');
    Object.keys(response.headers).forEach(key => {
      if (key.toLowerCase().includes('limit') || key.toLowerCase().includes('rate')) {
        console.log(`  ${key}: ${response.headers[key]}`);
      }
    });
    
    if (!Object.keys(response.headers).some(key => key.toLowerCase().includes('limit'))) {
      console.log('❌ No rate limit headers found - rate limiting not active');
    }
    
  } catch (error) {
    console.log('Headers check failed:', error.response?.status || error.message);
  }

  // Test 3: Test authentication with no token
  console.log('\n3. Testing no authentication token...');
  try {
    const response = await axios.get('http://localhost:5000/api/applications?propertyId=test');
    console.log('❌ NO AUTH: Got response without token - auth middleware not working');
    console.log(`Status: ${response.status}, Data: ${response.data.data?.length || 0} items`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ AUTH: Properly rejected request without token');
    } else {
      console.log(`❓ Unexpected status: ${error.response?.status}`);
    }
  }

  // Test 4: Check server logs capability
  console.log('\n4. Making request to see server logs...');
  try {
    await axios.post('http://localhost:5000/api/applications', {
      propertyId: 'test',
      fullName: 'Test User',
      email: 'test@test.com'
    });
  } catch (error) {
    console.log('Request made - check your server console for logs');
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check your server console for any middleware logs');
  console.log('2. Verify your routes file was actually updated and server restarted');
  console.log('3. Check if auth middleware file exists');
}

diagnoseRoutes();