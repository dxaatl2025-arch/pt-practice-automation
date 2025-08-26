// complete-mongodb-elimination.js
// Run this to completely eliminate MongoDB from your system

const fs = require('fs');
const path = require('path');

console.log('🧹 PropertyPulse: Complete MongoDB Elimination');
console.log('='.repeat(50));

// Step 1: Check current state
console.log('\n📊 Step 1: Current State Analysis');
console.log('-'.repeat(30));

try {
  // Check environment
  console.log('Environment Variables:');
  console.log('  DB_TARGET:', process.env.DB_TARGET);
  console.log('  CANARY_MODE:', process.env.CANARY_MODE);
  console.log('  ENABLE_MONGODB_FALLBACK:', process.env.ENABLE_MONGODB_FALLBACK);
  console.log('  MONGODB_URI exists:', !!process.env.MONGODB_URI);
  
  // Check if Prisma is working
  console.log('\nPrisma Status:');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log('  ✅ Prisma client can be created');
    console.log('  ✅ Application model exists:', typeof prisma.application === 'object');
  } catch (error) {
    console.log('  ❌ Prisma issue:', error.message);
  }
  
  // Check repository factory
  console.log('\nRepository Factory:');
  try {
    const factory = require('./src/repositories/factory');
    console.log('  ✅ Factory loaded');
    console.log('  Current target:', factory.dbTarget || 'unknown');
  } catch (error) {
    console.log('  ❌ Factory issue:', error.message);
  }
  
} catch (error) {
  console.log('❌ Analysis failed:', error.message);
}

// Step 2: Find MongoDB references
console.log('\n📊 Step 2: Finding MongoDB References');
console.log('-'.repeat(30));

const findMongoReferences = (dir) => {
  const references = [];
  
  const searchFiles = (currentDir) => {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchFiles(filePath);
      } else if (file.endsWith('.js') && !file.includes('node_modules')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for MongoDB patterns
          const patterns = [
            /mongoose/gi,
            /mongodb/gi,
            /mongo.*repo/gi,
            /models\/[A-Z]/g,
            /'mongo'/g,
            /"mongo"/g,
            /DB_TARGET.*mongo/g,
            /MONGODB_URI/g
          ];
          
          patterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
              references.push({
                file: filePath.replace(process.cwd(), '.'),
                pattern: pattern.toString(),
                matches: matches.length
              });
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  };
  
  searchFiles(dir);
  return references;
};

const mongoRefs = findMongoReferences('./src');
console.log('MongoDB references found:');
mongoRefs.forEach(ref => {
  console.log(`  📄 ${ref.file}: ${ref.matches} matches for ${ref.pattern}`);
});

// Step 3: Solution plan
console.log('\n🎯 Step 3: Elimination Plan');
console.log('-'.repeat(30));

console.log('Required actions:');

if (mongoRefs.length > 0) {
  console.log('❌ MongoDB references still exist in code');
  console.log('Action: Remove or comment out MongoDB imports/references');
} else {
  console.log('✅ No MongoDB references found in source code');
}

// Check specific files that commonly cause issues
const problematicFiles = [
  'src/repositories/factory.js',
  'server.js',
  'src/config/database.js'
];

console.log('\nChecking problematic files:');
problematicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const hasMongoRef = /mongo|mongoose/gi.test(content);
    console.log(`  ${file}: ${hasMongoRef ? '❌ Has MongoDB references' : '✅ Clean'}`);
  } else {
    console.log(`  ${file}: ⚠️ Does not exist`);
  }
});

// Step 4: Provide fix script
console.log('\n🔧 Step 4: Auto-Fix Recommendations');
console.log('-'.repeat(30));

console.log('1. Force environment variables:');
console.log('   set DB_TARGET=prisma');
console.log('   set CANARY_MODE=disabled');
console.log('   set ENABLE_MONGODB_FALLBACK=false');

console.log('\n2. Replace repository factory completely');
console.log('3. Remove MongoDB model imports from controllers');
console.log('4. Update server.js canary configuration');

console.log('\n📋 Step 5: Next Actions');
console.log('-'.repeat(30));
console.log('1. Replace src/repositories/factory.js with Prisma-only version');
console.log('2. Comment out MongoDB model imports in controllers');
console.log('3. Update server.js to remove mongo defaults');
console.log('4. Restart server and test');

console.log('\n✅ Analysis Complete');
console.log('Run the recommended actions above to eliminate MongoDB completely.');

process.exit(0);