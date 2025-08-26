const admin = require('firebase-admin');

// Use your Firebase project configuration
const firebaseConfig = {
  projectId: "propertypulse-d01b7", // Your project ID from frontend
  // Add other config if needed
};

// Initialize Firebase Admin without service account (for development)
// This will use Application Default Credentials or Firebase emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

console.log('✅ Firebase Admin initialized for project:', firebaseConfig.projectId);
module.exports = admin;