// server/src/controllers/authController.js
const admin = require('../config/firebase');
const { validationResult } = require('express-validator');
const repositoryFactory = require('../repositories/factory');

const authController = {
  
  /**
   * Register a new user
   * Creates user in Firebase Auth and our database
   */
  register: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { email, firstName, lastName, role, phone } = req.body;
      
      console.log('🔧 Creating Firebase user:', email);
      
      // Create user in Firebase Auth
      const firebaseUser = await admin.auth().createUser({
        email,
        emailVerified: false,
        displayName: `${firstName} ${lastName}`,
        disabled: false
      });

      console.log('✅ Firebase user created with UID:', firebaseUser.uid);

      // Create user in our database
      const userRepo = repositoryFactory.getUserRepository();
      const user = await userRepo.create({
        firebaseUid: firebaseUser.uid,
        email,
        firstName,
        lastName,
        role: role.toUpperCase(), // Convert to match schema enum
        phone,
        profileUpdatedAt: new Date()
      });

      console.log('✅ Database user created:', user.id);

      // Generate custom token for immediate login
      const customToken = await admin.auth().createCustomToken(firebaseUser.uid, {
        role: role.toUpperCase(),
        email,
        databaseId: user.id
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            firebaseUid: firebaseUser.uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          customToken // Client can exchange this for ID token
        }
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already registered'
        });
      }
      
      if (error.code === 'auth/invalid-email') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  /**
   * Login user with Firebase ID token
   * Validates token and returns user data
   */
  login: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { idToken } = req.body;
      
      console.log('🔧 Verifying Firebase ID token...');
      
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('✅ Firebase token verified for UID:', decodedToken.uid);

      // Get user from database using your existing repository
      const userRepo = repositoryFactory.getUserRepository();
      const user = await userRepo.findByFirebaseUid(decodedToken.uid);
      
      if (!user) {
        console.log('❌ User not found in database for Firebase UID:', decodedToken.uid);
        return res.status(404).json({
          status: 'error',
          message: 'User not found in database. Please register first.'
        });
      }

      console.log('✅ User authenticated:', user.email, 'Role:', user.role);

      // Update last login time (optional)
      try {
        await userRepo.update(user.id, { 
          profileUpdatedAt: new Date() 
        });
      } catch (updateError) {
        console.log('⚠️ Could not update last login time:', updateError.message);
      }

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone
          },
          token: idToken // Return the same token for frontend to use
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired. Please login again.'
        });
      }
      
      if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token provided.'
        });
      }

      res.status(401).json({
        status: 'error',
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid credentials'
      });
    }
  },

  /**
   * Get current authenticated user
   * Middleware sets req.user from token
   */
  getMe: async (req, res) => {
    try {
      // req.user is set by authenticateUser middleware
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
      }

      res.json({
        status: 'success',
        data: {
          user: {
            id: req.user.id,
            firebaseUid: req.user.firebaseUid,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            phone: req.user.phone,
            budgetMin: req.user.budgetMin,
            budgetMax: req.user.budgetMax,
            preferredBedrooms: req.user.preferredBedrooms,
            preferredLocations: req.user.preferredLocations
          }
        }
      });

    } catch (error) {
      console.error('❌ GetMe error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user data'
      });
    }
  },

  /**
   * Update user profile
   * Updates both Firebase and database records
   */
  updateProfile: async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { firstName, lastName, phone, budgetMin, budgetMax, preferredBedrooms, preferredLocations } = req.body;
      
      console.log('🔧 Updating profile for user:', req.user.id);

      // Update Firebase user profile
      if (firstName || lastName) {
        try {
          await admin.auth().updateUser(req.user.firebaseUid, {
            displayName: `${firstName || req.user.firstName} ${lastName || req.user.lastName}`
          });
          console.log('✅ Firebase profile updated');
        } catch (firebaseError) {
          console.log('⚠️ Could not update Firebase profile:', firebaseError.message);
        }
      }

      // Update database user
      const updateData = {
        profileUpdatedAt: new Date()
      };
      
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (budgetMin !== undefined) updateData.budgetMin = budgetMin;
      if (budgetMax !== undefined) updateData.budgetMax = budgetMax;
      if (preferredBedrooms !== undefined) updateData.preferredBedrooms = preferredBedrooms;
      if (preferredLocations !== undefined) updateData.preferredLocations = preferredLocations;

      const userRepo = repositoryFactory.getUserRepository();
      const updatedUser = await userRepo.update(req.user.id, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      console.log('✅ Database profile updated');

      res.json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            firebaseUid: updatedUser.firebaseUid,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            phone: updatedUser.phone,
            budgetMin: updatedUser.budgetMin,
            budgetMax: updatedUser.budgetMax,
            preferredBedrooms: updatedUser.preferredBedrooms,
            preferredLocations: updatedUser.preferredLocations
          }
        }
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = authController;