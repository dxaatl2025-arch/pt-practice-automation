// src/config/database.js - FIXED VERSION
const { PrismaClient } = require('@prisma/client');

console.log('🗄️ Database configuration loading...');
console.log('🗄️ Platform:', process.platform);
console.log('🗄️ DB_TARGET:', process.env.DB_TARGET);

// Remove the Windows permissions check - it's not needed
let prisma;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
}

// Test connection
const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Prisma database connection failed:', error);
    return false;
  }
};

module.exports = {
  prisma,
  testConnection
};