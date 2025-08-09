// src/services/firebase.js - Real Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdyc9TuyqBKAnfVs8NtkTr7oIZOKt15ls",
  authDomain: "propertypulse-d01b7.firebaseapp.com",
  projectId: "propertypulse-d01b7",
  storageBucket: "propertypulse-d01b7.firebasestorage.app",
  messagingSenderId: "408124680823",
  appId: "1:408124680823:web:0bbed417388e9eca463472"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
