// server/scripts/verify-final-migration.js
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function quickVerification() {
  console.log('🚀 PropertyPulse Final Migration Verification');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Platform: Windows');
  
  try {
    console.log('Connecting to databases...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Connect to Prisma
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Prisma');
    
    // Load models
    const User = require('../src/models/User');
    const Property = require('../src/models/Property');
    
    // Count records
    console.log('Counting records...');
    const mongoUsers = await User.countDocuments();
    const mongoProperties = await Property.countDocuments();
    
    const prismaUsers = await prisma.user.count();
    const prismaProperties = await prisma.property.count();
    
    console.log('\\n📊 Migration Status:');
    console.log('Users - MongoDB:', mongoUsers, 'Prisma:', prismaUsers);
    console.log('Properties - MongoDB:', mongoProperties, 'Prisma:', prismaProperties);
    
    // Validation
    const errors = [];
    if (mongoUsers !== prismaUsers) {
      errors.push(`User count mismatch: MongoDB=${mongoUsers}, Prisma=${prismaUsers}`);
    }
    if (mongoProperties !== prismaProperties) {
      errors.push(`Property count mismatch: MongoDB=${mongoProperties}, Prisma=${prismaProperties}`);
    }
    
    if (errors.length === 0) {
      console.log('\\n✅ ALL VERIFICATIONS PASSED');
      console.log('🚀 Ready for production cutover!');
      return true;
    } else {
      console.log('\\n❌ ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    if (error.message.includes('Cannot find module')) {
      console.log('💡 Make sure you have run: npm install');
    }
    return false;
  } finally {
    try {
      await mongoose.disconnect();
      await prisma.$disconnect();
      console.log('✅ Database connections closed');
    } catch (err) {
      console.log('Warning: Error closing connections:', err.message);
    }
  }
}

// Run verification
if (require.main === module) {
  quickVerification().then(success => {
    console.log('\\nVerification', success ? 'PASSED' : 'FAILED');
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = quickVerification;