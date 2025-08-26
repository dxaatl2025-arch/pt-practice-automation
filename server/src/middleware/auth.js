const admin = require('../config/firebase');
const repositoryFactory = require('../repositories/factory');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    console.log('🔐 Verifying token...');
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Firebase token verified for UID:', decodedToken.uid);
    
    // Get full user data from database using your existing repository
    const userRepo = repositoryFactory.getUserRepository();
    const user = await userRepo.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      console.log('❌ User not found in database for Firebase UID:', decodedToken.uid);
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    console.log('✅ User authenticated:', user.email, 'Role:', user.role);
    
    // Set complete user data (not just Firebase token)
    req.user = user;
    req.firebaseUser = decodedToken;
    next();
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('❌ Access denied. User role:', req.user?.role, 'Required:', roles);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };