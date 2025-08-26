// check-schema.js - Save and run: node check-schema.js
const prisma = require('./src/config/prisma');

async function checkSchemaFields() {
  console.log('🔍 Checking Application Schema Fields');
  console.log('====================================');

  try {
    // Try to find an existing application
    const app = await prisma.application.findFirst();
    
    if (app) {
      console.log('✅ Found existing application, checking fields:');
      console.log('   - Has firstName?', 'firstName' in app);
      console.log('   - Has lastName?', 'lastName' in app);
      console.log('   - Has fullName?', 'fullName' in app);
      console.log('   - Has dateOfBirth?', 'dateOfBirth' in app);
      console.log('   - Has dob?', 'dob' in app);
      console.log('   - Has reviewedAt?', 'reviewedAt' in app);
      console.log('   - Has reviewNotes?', 'reviewNotes' in app);
      
      console.log('\n📋 All fields in database:');
      Object.keys(app).forEach(key => {
        if (!['id', 'propertyId', 'createdAt', 'updatedAt'].includes(key)) {
          console.log(`   - ${key}: ${typeof app[key]}`);
        }
      });
    } else {
      console.log('ℹ️ No applications found in database');
      console.log('Will check Prisma schema instead...');
      
      // Check if the model exists
      if (prisma.application) {
        console.log('✅ Application model exists in Prisma client');
      } else {
        console.log('❌ Application model not found in Prisma client');
      }
    }
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
    
    if (error.message.includes('Unknown arg')) {
      console.log('💡 This suggests a field name mismatch in your repository');
    }
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

checkSchemaFields();