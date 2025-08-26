// check-enums.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnums() {
  try {
    // Try to get an existing property to see what enum values are valid
    const existingProperty = await prisma.property.findFirst();
    
    if (existingProperty) {
      console.log('✅ Found existing property:');
      console.log('Status:', existingProperty.status);
      console.log('Property Type:', existingProperty.propertyType);
      console.log('Available:', existingProperty.isAvailable);
      
      // Use this property for applications
      console.log('\n🎯 Use this property ID in your form:', existingProperty.id);
    } else {
      console.log('❌ No existing properties found');
    }
    
    // Also check what users exist
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    
    console.log('\n👥 Existing users:');
    console.log(users);
    
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnums();