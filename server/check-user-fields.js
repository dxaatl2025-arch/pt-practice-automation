// check-user-fields.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserFields() {
  try {
    console.log('🔍 Checking what fields are available...');
    
    // Try to create a user with minimal fields
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LANDLORD'
        // Removed password field
      }
    });
    
    console.log('✅ User created successfully:', user);
    
    // Now try to create a property
    console.log('\n🏠 Creating property...');
    
    const property = await prisma.property.create({
      data: {
        title: 'Test Property',
        landlordId: user.id, // Use the user ID we just created
        addressStreet: '123 Test St',
        addressCity: 'Atlanta',
        addressState: 'GA',
        addressZip: '30309',
        rentAmount: 1500,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'APARTMENT',
        isAvailable: true
        // Removed status field to see if it has a default
      }
    });
    
    console.log('✅ Property created successfully:', property);
    console.log('\n🎯 Use this property ID in your form:', property.id);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('Unknown argument')) {
      console.log('\n💡 Try creating user with just basic fields:');
      
      try {
        const basicUser = await prisma.user.create({
          data: {
            email: 'basic@example.com',
            firstName: 'Basic',
            lastName: 'User'
            // Even more minimal
          }
        });
        console.log('✅ Basic user created:', basicUser.id);
        
        // Try property with this user
        const basicProperty = await prisma.property.create({
          data: {
            title: 'Basic Property',
            landlordId: basicUser.id,
            addressStreet: '456 Basic St',
            addressCity: 'Atlanta',
            addressState: 'GA',
            addressZip: '30309',
            rentAmount: 1200,
            bedrooms: 1,
            bathrooms: 1
            // Very minimal property
          }
        });
        console.log('✅ Basic property created:', basicProperty.id);
        console.log('\n🎯 Use this property ID in your form:', basicProperty.id);
        
      } catch (err) {
        console.log('❌ Even basic creation failed:', err.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUserFields();