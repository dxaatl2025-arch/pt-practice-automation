// src/contexts/AuthContext.js - Fixed Firebase Imports
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    
    // Add auth token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Monitor Firebase auth state
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser) {
        console.log('👤 Firebase user found, fetching profile...');
        setFirebaseUser(firebaseUser);
        await fetchUserData(firebaseUser);
      } else {
        console.log('👤 No Firebase user found');
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        
        // Clean up auth tokens
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('authToken');
      }
    });

    return unsubscribe;
  }, []);

  // Fetch user data from your backend
  const fetchUserData = async (firebaseUser) => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching user data for Firebase UID:', firebaseUser.uid);

      // Get Firebase token for API authentication
      const token = await firebaseUser.getIdToken();
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);

      // Fetch user data from your backend using Firebase UID
      const response = await axios.get(`/users/firebase/${firebaseUser.uid}`);
      
      if (response.data.success && response.data.data) {
        const userData = {
          ...response.data.data,
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: `${response.data.data.firstName} ${response.data.data.lastName}` // Add name for display
        };
        setUser(userData);
        console.log('✅ User data loaded:', userData.email, 'Role:', userData.role);
      } else {
        console.error('❌ Failed to fetch user data:', response.data.message);
        setError('Failed to load user profile');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      
      if (error.response?.status === 404) {
        setError('User profile not found. Please contact support.');
      } else {
        setError('Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');

      console.log('🔐 Attempting login for:', email);
      
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase login successful');
      
      // User data will be fetched automatically by onAuthStateChanged
      return { success: true };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');

      const { email, password, firstName, lastName, role, phone } = userData;
      
      console.log('📝 Attempting registration for:', email);
      
      // 1. Create Firebase user first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase user created successfully');
      
      // 2. Create user in your backend database
      const token = await firebaseUser.getIdToken();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const backendResponse = await axios.post('/users', {
        email,
        firstName,
        lastName,
        role,
        phone,
        firebaseUid: firebaseUser.uid
      });
      
      if (backendResponse.data.success) {
        console.log('✅ Backend user created successfully');
        
        // User data will be fetched automatically by onAuthStateChanged
        return { success: true };
      } else {
        throw new Error(backendResponse.data.message || 'Failed to create user profile');
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // If backend creation failed, clean up Firebase user
      if (auth.currentUser && error.response) {
        try {
          await auth.currentUser.delete();
          console.log('🧹 Firebase user cleaned up after backend failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup Firebase user:', cleanupError);
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      console.log('🚪 Logging out user');
      
      await signOut(auth);
      
      // Clean up state and tokens
      setUser(null);
      setFirebaseUser(null);
      setError('');
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
      
      console.log('✅ Logout successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updateData) => {
    try {
      setLoading(true);
      setError('');

      if (!user) {
        throw new Error('No user logged in');
      }

      const response = await axios.put(`/users/${user.id}`, updateData);
      
      if (response.data.success) {
        const updatedUser = { 
          ...user, 
          ...response.data.data,
          name: `${response.data.data.firstName || user.firstName} ${response.data.data.lastName || user.lastName}`
        };
        setUser(updatedUser);
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('❌ Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const isAuthenticated = !!user;
  const isLandlord = user?.role === 'LANDLORD';
  const isTenant = user?.role === 'TENANT';

  // Context value
  const value = {
    // User state
    user,
    firebaseUser,
    loading,
    error,
    isAuthenticated,
    isLandlord,
    isTenant,
    
    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    
    // Utility methods
    clearError: () => setError(''),
    refreshUser: () => firebaseUser && fetchUserData(firebaseUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};