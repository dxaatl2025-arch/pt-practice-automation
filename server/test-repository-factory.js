// server/test-repository-factory.js
const repositoryFactory = require('./src/repositories/factory');

async function testFactory() {
  console.log('🧪 Testing Repository Factory...\n');

  try {
    // Test 1: Default MongoDB target
    console.log('1️⃣ Testing default MongoDB target...');
    const mongoRepo = repositoryFactory.getPropertyRepository();
    console.log(`✅ Created repository for target: ${repositoryFactory.dbTarget}`);

    // Test 2: Switch to Prisma
    console.log('\n2️⃣ Switching to Prisma target...');
    repositoryFactory.switchDatabase('prisma');
    const prismaRepo = repositoryFactory.getPropertyRepository();
    console.log(`✅ Created repository for target: ${repositoryFactory.dbTarget}`);

    // Test 3: Health check
    console.log('\n3️⃣ Testing health check...');
    const health = await repositoryFactory.healthCheck();
    console.log('✅ Health check result:', health);

    // Test 4: Switch back to MongoDB
    console.log('\n4️⃣ Switching back to MongoDB...');
    repositoryFactory.switchDatabase('mongo');
    const mongoRepo2 = repositoryFactory.getPropertyRepository();
    console.log(`✅ Created repository for target: ${repositoryFactory.dbTarget}`);

    console.log('\n🎉 Repository Factory test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create PropertyRepository interface');
    console.log('   2. Implement MongoDB PropertyRepository');
    console.log('   3. Implement Prisma PropertyRepository');
    console.log('   4. Update PropertyController to use repository');

  } catch (error) {
    console.error('❌ Factory test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testFactory();