// server/create-test-property.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestProperty() {
  console.log('🚀 Creating test property and landlord...');
  
  try {
    // Create test landlord first
    console.log('👤 Creating test landlord...');
    const landlord = await prisma.user.upsert({
      where: { email: 'landlord@test.com' },
      update: {},
      create: {
        id: 'test-landlord-id',
        email: 'landlord@test.com',
        firstName: 'Test',
        lastName: 'Landlord',
        role: 'LANDLORD',
        phone: '555-0123',
        password: 'hashedpassword123' // In real app, this should be properly hashed
      }
    });
    console.log('✅ Landlord created:', landlord.email);

    // Create the test property that your form expects
    console.log('🏠 Creating test property...');
    const property = await prisma.property.upsert({
      where: { id: 'test-property-id' },
      update: {},
      create: {
        id: 'test-property-id', // This matches what your ApplicationForm sends
        title: 'Test Property for Applications',
        landlordId: landlord.id,
        addressStreet: '123 Test Street',
        addressCity: 'Atlanta',
        addressState: 'GA',
        addressZip: '30309',
        rentAmount: 1500,
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000,
        propertyType: 'APARTMENT',
        status: 'AVAILABLE',
        isAvailable: true,
        description: 'Test property for application submissions'
      }
    });
    console.log('✅ Test property created:', property.title);
    console.log('📍 Property ID:', property.id);
    console.log('💰 Rent Amount: $' + property.rentAmount);

    // Verify the property exists
    const verification = await prisma.property.findUnique({
      where: { id: 'test-property-id' },
      include: {
        landlord: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (verification) {
      console.log('✅ Verification successful!');
      console.log('   Property:', verification.title);
      console.log('   Landlord:', verification.landlord.firstName, verification.landlord.lastName);
      console.log('   Status:', verification.status);
      console.log('');
      console.log('🎉 You can now submit rental applications!');
      console.log('   The form will use propertyId: "test-property-id"');
    } else {
      console.log('❌ Verification failed - property not found');
    }

  } catch (error) {
    console.error('❌ Failed to create test property:', error.message);
    
    if (error.code === 'P2002') {
      console.log('ℹ️  This might mean the data already exists, which is fine!');
    }
  } finally {
    await prisma.$disconnect();
    console.log('📚 Database connection closed');
  }
}

// Run the function
createTestProperty();