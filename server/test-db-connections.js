// Test file: server/test-db-connections.js
const prisma = require('./src/db/prisma');
const mongoose = require('mongoose');

async function testDatabaseConnections() {
  console.log('🔍 Testing database connections...\n');

  try {
    // Test MongoDB (existing)
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB: Connected');
    } else {
      console.log('❌ MongoDB: Not connected');
    }

    // Test PostgreSQL (new Prisma)
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ PostgreSQL: Connected');
    console.log(`   Current time: ${result[0].current_time}`);

    // Test rental applications table (should exist)
    const appCount = await prisma.rentalApplication.count();
    console.log(`✅ Rental Applications table: ${appCount} records found`);

    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('\n📋 PostgreSQL Tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testDatabaseConnections();