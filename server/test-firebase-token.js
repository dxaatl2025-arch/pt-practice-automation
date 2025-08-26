// test-firebase-token.js - Create this file in your server root
const admin = require('./src/config/firebase');

async function generateTestToken() {
  try {
    console.log('🔧 Generating Firebase custom token for testing...');
    
    // Create a custom token for the existing Firebase UID
    const customToken = await admin.auth().createCustomToken('FjWk9Jg5xuPbvzWDrn67N7FaEAf2', {
      role: 'TENANT',
      email: 'test@example.com',
      // Add any custom claims you need
    });

    console.log('✅ Custom Token Generated:');
    console.log(customToken);
    console.log('\n📋 To use this token:');
    console.log('1. Exchange it for an ID token in your frontend');
    console.log('2. Or use it directly with Firebase Admin SDK');
    
    console.log('\n🧪 Test Commands:');
    console.log('# Register a test user:');
    console.log(`curl -X POST "http://localhost:5000/api/auth/register" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"test@example.com","firstName":"Test","lastName":"User","role":"tenant","phone":"+1234567890"}'`);
    
    console.log('\n# Login with Firebase ID token (you need to get this from Firebase):');
    console.log(`curl -X POST "http://localhost:5000/api/auth/login" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"idToken":"YOUR_FIREBASE_ID_TOKEN_HERE"}'`);

  } catch (error) {
    console.error('❌ Error generating token:', error);
  }
}

// Also create a test user in your database
async function createTestUser() {
  try {
    console.log('\n🔧 Creating test user in database...');
    
    const repositoryFactory = require('./src/repositories/factory');
    const userRepo = repositoryFactory.getUserRepository();
    
    // Check if user already exists
    const existingUser = await userRepo.findByFirebaseUid('FjWk9Jg5xuPbvzWDrn67N7FaEAf2');
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }

    // Create test user
    const testUser = await userRepo.create({
      firebaseUid: 'FjWk9Jg5xuPbvzWDrn67N7FaEAf2',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'TENANT',
      phone: '+1234567890'
    });

    console.log('✅ Test user created:', testUser.email);
    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

// Run both functions
async function main() {
  await createTestUser();
  await generateTestToken();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Replace your auth files with the fixed versions');
  console.log('2. Add the findByFirebaseUid method to your User repository');
  console.log('3. Restart your server');
  console.log('4. Test the endpoints above');
  console.log('5. For the applications endpoint, use a real Firebase ID token');
  
  process.exit(0);
}

main();