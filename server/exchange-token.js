// exchange-token.js - Production-ready token exchange
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');

// Your Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdyc9TuyqBKAnfVs8NtkTr7oIZOKt15ls",
  authDomain: "propertypulse-d01b7.firebaseapp.com",
  projectId: "propertypulse-d01b7",
  storageBucket: "propertypulse-d01b7.firebasestorage.app",
  messagingSenderId: "408124680823",
  appId: "1:408124680823:web:0bbed417388e9eca463472",
  measurementId: "G-1GTRJ30EMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function exchangeCustomTokenForIdToken(customToken) {
  try {
    console.log('🔄 Exchanging custom token for ID token...');
    
    // Sign in with the custom token
    const userCredential = await signInWithCustomToken(auth, customToken);
    const user = userCredential.user;
    
    console.log('✅ Successfully signed in user:', user.email);
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    console.log('✅ ID Token obtained successfully');
    console.log('\n📋 Use this ID token for API requests:');
    console.log(idToken);
    
    console.log('\n🧪 Test command for applications endpoint:');
    console.log(`curl -H "Authorization: Bearer ${idToken}" "http://localhost:5000/api/rental-applications?applicantId=${user.uid}"`);
    
    return idToken;
    
  } catch (error) {
    console.error('❌ Error exchanging token:', error);
    throw error;
  }
}

// Use the custom token from your registration
const customToken = process.argv[2];

if (!customToken) {
  console.log('Usage: node exchange-token.js <customToken>');
  console.log('Example: node exchange-token.js "eyJhbGciOiJSUzI1NiIs..."');
  process.exit(1);
}

exchangeCustomTokenForIdToken(customToken)
  .then(() => {
    console.log('\n✅ Token exchange complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Token exchange failed:', error.message);
    process.exit(1);
  });