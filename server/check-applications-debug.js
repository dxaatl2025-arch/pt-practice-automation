const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApplications() {
  try {
    console.log('🔍 Checking all applications in database...');
    
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        propertyId: true,
        fullName: true,
        email: true,
        status: true,
        submittedAt: true
      }
    });
    
    console.log('📊 Total applications found:', applications.length);
    
    applications.forEach(app => {
      console.log(`- ID: ${app.id}`);
      console.log(`  Property ID: ${app.propertyId}`);
      console.log(`  Name: ${app.fullName}`);
      console.log(`  Status: ${app.status}`);
      console.log('---');
    });
    
    // Check specifically for your property
    const forYourProperty = applications.filter(app => app.propertyId === 'cmegj06qt0002u6sogn0akpxf');
    console.log('\n🏠 Applications for your property (cmegj06qt0002u6sogn0akpxf):', forYourProperty.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplications();