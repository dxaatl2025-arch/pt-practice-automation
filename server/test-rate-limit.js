// test-rate-limit.js - Quick test to verify rate limiting
const axios = require('axios');

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting...');
  console.log('='.repeat(50));

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`\nRequest ${i}:`);
      const response = await axios.post('http://localhost:5000/api/applications', {}, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Response: ${response.data.success ? 'Success' : 'Failed'}`);
      
      // Check for rate limit headers
      if (response.headers['ratelimit-limit']) {
        console.log(`🚦 Rate Limit: ${response.headers['ratelimit-remaining']}/${response.headers['ratelimit-limit']}`);
      }
      
    } catch (error) {
      console.log(`❌ Status: ${error.response?.status}`);
      if (error.response?.status === 429) {
        console.log(`🚫 RATE LIMITED! (This is expected after 3 requests)`);
        console.log(`📄 Error: ${error.response.data.error}`);
      } else {
        console.log(`📄 Error: ${error.response?.data?.error || error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Test authentication
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get('http://localhost:5000/api/applications?propertyId=cmegj06qt0002u6sogn0akpxf', {
      headers: { 'Authorization': 'Bearer fake_token' }
    });
    
    console.log(`❌ Authentication FAILED - Got response with fake token:`);
    console.log(`Status: ${response.status}`);
    console.log(`Data count: ${response.data.data?.length || 0} applications`);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Authentication WORKING - Properly rejected fake token`);
    } else {
      console.log(`❓ Unexpected error: ${error.response?.status} - ${error.response?.data?.error}`);
    }
  }
}

async function runTests() {
  await testRateLimit();
  await testAuth();
  
  console.log('\n🎯 SUMMARY:');
  console.log('If rate limiting is working: Request 4+ should be blocked');
  console.log('If authentication is working: Fake token should be rejected');
}

runTests();