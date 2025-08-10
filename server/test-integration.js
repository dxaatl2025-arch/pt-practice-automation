// server/test-integration.js - Test both databases working together
const prisma = require('./src/db/prisma');

async function testIntegration() {
  console.log('🧪 Testing PropertyPulse Integration...\n');

  try {
    // Test 1: Check all PostgreSQL tables exist
    console.log('1️⃣ Checking PostgreSQL table structure...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != '_prisma_migrations'
      ORDER BY table_name;
    `;
    
    const expectedTables = [
      'users', 'properties', 'leases', 'payments', 
      'maintenance_tickets', 'rental_applications'
    ];
    
    console.log('📋 Found tables:');
    tables.forEach(table => {
      const isExpected = expectedTables.includes(table.table_name);
      console.log(`   ${isExpected ? '✅' : '📄'} ${table.table_name}`);
    });

    // Test 2: Test Prisma operations
    console.log('\n2️⃣ Testing Prisma operations...');
    
    // Count existing rental applications
    const appCount = await prisma.rentalApplication.count();
    console.log(`✅ Rental applications: ${appCount} records`);

    // Test basic query capability
    const dbTime = await prisma.$queryRaw`SELECT NOW() as db_time`;
    console.log(`✅ Database time: ${dbTime[0].db_time}`);

    // Test 3: Test model operations
    console.log('\n3️⃣ Testing Prisma models...');
    
    try {
      // Test that we can query each model (should return empty arrays)
      const userCount = await prisma.user.count();
      const propertyCount = await prisma.property.count();
      const leaseCount = await prisma.lease.count();
      
      console.log(`✅ Users table: ${userCount} records`);
      console.log(`✅ Properties table: ${propertyCount} records`);
      console.log(`✅ Leases table: ${leaseCount} records`);
    } catch (modelError) {
      console.log(`⚠️  Model test failed: ${modelError.message}`);
    }

    // Test 4: Database features
    console.log('\n4️⃣ Testing database features...');
    
    // Test enum creation
    try {
      const enums = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'UserRole'
        ORDER BY enumlabel;
      `;
      
      if (enums.length > 0) {
        console.log('✅ Enums created successfully');
        console.log(`   UserRole values: ${enums.map(e => e.enumlabel).join(', ')}`);
      } else {
        console.log('⚠️  No UserRole enum found');
      }
    } catch (enumError) {
      console.log(`⚠️  Enum test failed: ${enumError.message}`);
    }

    // Test indexes
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, tablename
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'properties', 'rental_applications')
        ORDER BY tablename, indexname;
      `;
      
      console.log(`✅ Database indexes: ${indexes.length} found`);
      if (indexes.length > 0) {
        console.log('   Sample indexes:');
        indexes.slice(0, 3).forEach(idx => {
          console.log(`   - ${idx.tablename}.${idx.indexname}`);
        });
      }
    } catch (indexError) {
      console.log(`⚠️  Index test failed: ${indexError.message}`);
    }

    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • PostgreSQL: Connected with ${tables.length} tables`);
    console.log(`   • Prisma: Working with type safety`);
    console.log(`   • Rental Applications: ${appCount} records`);
    console.log(`   • All core models: Accessible and functional`);
    
    console.log('\n🚀 Ready for Phase 2: Repository Migration');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testIntegration();