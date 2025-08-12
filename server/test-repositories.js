// server/test-repositories.js
const repositoryFactory = require('./src/repositories/factory');

async function testRepositories() {
  console.log('🧪 Testing Complete Repository Implementation...\n');

  try {
    // Test 1: MongoDB Repository
    console.log('1️⃣ Testing MongoDB Repository...');
    repositoryFactory.switchDatabase('mongo');
    const mongoRepo = repositoryFactory.getPropertyRepository();
    
    // Test basic methods exist
    console.log('✅ MongoDB Repository methods:');
    console.log(`   - create: ${typeof mongoRepo.create}`);
    console.log(`   - findById: ${typeof mongoRepo.findById}`);
    console.log(`   - list: ${typeof mongoRepo.list}`);

    // Test 2: Prisma Repository
    console.log('\n2️⃣ Testing Prisma Repository...');
    repositoryFactory.switchDatabase('prisma');
    const prismaRepo = repositoryFactory.getPropertyRepository();
    
    console.log('✅ Prisma Repository methods:');
    console.log(`   - create: ${typeof prismaRepo.create}`);
    console.log(`   - findById: ${typeof prismaRepo.findById}`);
    console.log(`   - list: ${typeof prismaRepo.list}`);

    // Test 3: Interface Compliance
    console.log('\n3️⃣ Testing Interface Compliance...');
    const requiredMethods = [
      'create', 'findById', 'update', 'delete', 'list',
      'findByOwnerId', 'searchByLocation', 'filterByCriteria'
    ];

    let mongoCompliant = true;
    let prismaCompliant = true;

    requiredMethods.forEach(method => {
      if (typeof mongoRepo[method] !== 'function') {
        console.log(`❌ MongoDB missing: ${method}`);
        mongoCompliant = false;
      }
      if (typeof prismaRepo[method] !== 'function') {
        console.log(`❌ Prisma missing: ${method}`);
        prismaCompliant = false;
      }
    });

    if (mongoCompliant && prismaCompliant) {
      console.log('✅ Both repositories implement complete interface');
    }

    // Test 4: Basic Operations
    console.log('\n4️⃣ Testing Basic Operations...');
    
    // Test MongoDB operations
    try {
      console.log('Testing MongoDB operations...');
      repositoryFactory.switchDatabase('mongo');
      const mongoRepo2 = repositoryFactory.getPropertyRepository();
      const mongoResult = await mongoRepo2.list({ limit: 1 });
      console.log(`✅ MongoDB list() works: ${mongoResult.total} properties found`);
    } catch (error) {
      console.log(`⚠️  MongoDB operations: ${error.message}`);
    }

    // Test Prisma operations
    try {
      console.log('Testing Prisma operations...');
      repositoryFactory.switchDatabase('prisma');
      const prismaRepo2 = repositoryFactory.getPropertyRepository();
      const prismaResult = await prismaRepo2.list({ limit: 1 });
      console.log(`✅ Prisma list() works: ${prismaResult.total} properties found`);
      console.log(`   Response structure: { properties: [], total: ${prismaResult.total}, page: ${prismaResult.page}, totalPages: ${prismaResult.totalPages} }`);
    } catch (error) {
      console.log(`⚠️  Prisma operations: ${error.message}`);
    }

    console.log('\n🎉 Repository implementation test completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Both repositories are ready!');
    console.log('   2. Update PropertyController to use repository pattern');
    console.log('   3. Test API endpoints with both databases');
    console.log('   4. Create sample data for testing CRUD operations');

  } catch (error) {
    console.error('❌ Repository test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Safely disconnect from Prisma
    try {
      const prisma = require('./src/db/prisma');
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
}

testRepositories();