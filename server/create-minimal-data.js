// create-minimal-data.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMinimalData() {
  try {
    console.log('🚀 Creating minimal required data...');

    // First, let's see what enum values are available by checking the schema
    // We'll use the most basic values that should exist
    
    // Create a basic user first
    console.log('👤 Creating test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'LANDLORD', // Try LANDLORD first
        password: 'temp123'
      }
    });
    console.log('✅ User created:', user.id);

    // Now create a property with basic enum values
    console.log('🏠 Creating test property...');
    
    // Try different status values to see what works
    const propertyData = {
      title: 'Test Property',
      landlordId: user.id,
      addressStreet: '123 Test St',
      addressCity: 'Atlanta',
      addressState: 'GA',
      addressZip: '30309',
      rentAmount: 1500,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'APARTMENT',
      isAvailable: true
    };

    // Try without status first
    let property;
    try {
      property = await prisma.property.create({
        data: propertyData
      });
      console.log('✅ Property created without status:', property.id);
    } catch (error) {
      console.log('❌ Failed without status:', error.message);
      
      // Try with different status values
      const statusesToTry = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
      
      for (const status of statusesToTry) {
        try {
          property = await prisma.property.create({
            data: { ...propertyData, status }
          });
          console.log(`✅ Property created with status "${status}":`, property.id);
          break;
        } catch (err) {
          console.log(`❌ Failed with status "${status}"`);
        }
      }
    }

    if (property) {
      console.log('\n🎉 Success! You can now use this property ID in your form:');
      console.log('Property ID:', property.id);
      console.log('Property Title:', property.title);
      
      // Update your ApplicationForm to use this ID
      console.log('\n📝 Update your ApplicationForm to use:');
      console.log(`propertyId: "${property.id}"`);
    } else {
      console.log('❌ Could not create property. Let\'s check your schema...');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Code:', error.code);
    
    if (error.code === 'P2000') {
      console.log('This might be a field length issue');
    } else if (error.code === 'P2002') {
      console.log('This might be a unique constraint issue');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createMinimalData();