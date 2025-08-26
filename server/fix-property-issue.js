// fix-property-issue.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPropertyIssue() {
  try {
    // Check if property already exists
    const existing = await prisma.property.findUnique({
      where: { id: 'test-property-id' }
    });
    
    if (existing) {
      console.log('✅ Property already exists! Your form should work now.');
      return;
    }

    // Create minimal property
    await prisma.property.create({
      data: {
        id: 'test-property-id',
        title: 'Test Property',
        landlordId: 'test-landlord-id',
        addressStreet: '123 Test St',
        addressCity: 'Atlanta',
        addressState: 'GA',
        addressZip: '30309',
        rentAmount: 1500,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'APARTMENT',
        status: 'AVAILABLE',
        isAvailable: true
      }
    });
    
    console.log('✅ Test property created successfully!');
    
  } catch (error) {
    if (error.code === 'P2003') {
      console.log('Need to create landlord first...');
      
      // Create landlord
      await prisma.user.create({
        data: {
          id: 'test-landlord-id',
          email: 'test@landlord.com',
          firstName: 'Test',
          lastName: 'Landlord',
          role: 'LANDLORD',
          password: 'temp123'
        }
      });
      
      // Try property again
      await prisma.property.create({
        data: {
          id: 'test-property-id',
          title: 'Test Property',
          landlordId: 'test-landlord-id',
          addressStreet: '123 Test St',
          addressCity: 'Atlanta',
          addressState: 'GA',
          addressZip: '30309',
          rentAmount: 1500,
          bedrooms: 2,
          bathrooms: 1,
          propertyType: 'APARTMENT',
          status: 'AVAILABLE',
          isAvailable: true
        }
      });
      
      console.log('✅ Both landlord and property created!');
    } else {
      console.log('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixPropertyIssue();