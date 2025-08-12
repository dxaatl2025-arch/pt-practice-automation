// server/debug-factory.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Repository Factory Loading...\n');

// Check if files exist
const filesToCheck = [
  './src/repositories/interfaces/IPropertyRepository.js',
  './src/repositories/mongo/PropertyRepository.js', 
  './src/repositories/prisma/PropertyRepository.js',
  './src/repositories/factory.js',
  './src/models/Property.js',
  './src/models/property.js'
];

filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🧪 Testing Direct Imports...\n');

// Test direct imports
try {
  console.log('1️⃣ Testing IPropertyRepository import...');
  const IPropertyRepository = require('./src/repositories/interfaces/IPropertyRepository');
  console.log(`✅ IPropertyRepository: ${IPropertyRepository.name}`);
} catch (error) {
  console.log(`❌ IPropertyRepository import failed: ${error.message}`);
}

try {
  console.log('\n2️⃣ Testing MongoPropertyRepository import...');
  const MongoPropertyRepository = require('./src/repositories/mongo/PropertyRepository');
  console.log(`✅ MongoPropertyRepository: ${MongoPropertyRepository.name}`);
  
  // Check if it has methods
  const instance = new MongoPropertyRepository({});
  console.log(`   Methods: create=${typeof instance.create}, list=${typeof instance.list}`);
} catch (error) {
  console.log(`❌ MongoPropertyRepository import failed: ${error.message}`);
}

try {
  console.log('\n3️⃣ Testing PrismaPropertyRepository import...');
  const PrismaPropertyRepository = require('./src/repositories/prisma/PropertyRepository');
  console.log(`✅ PrismaPropertyRepository: ${PrismaPropertyRepository.name}`);
  
  // Check if it has methods
  const instance = new PrismaPropertyRepository({});
  console.log(`   Methods: create=${typeof instance.create}, list=${typeof instance.list}`);
} catch (error) {
  console.log(`❌ PrismaPropertyRepository import failed: ${error.message}`);
}

try {
  console.log('\n4️⃣ Testing Property Model import...');
  let PropertyModel = null;
  try {
    PropertyModel = require('./src/models/Property');
    console.log(`✅ Property model (uppercase): ${PropertyModel.modelName || 'loaded'}`);
  } catch (e1) {
    try {
      PropertyModel = require('./src/models/property');
      console.log(`✅ Property model (lowercase): ${PropertyModel.modelName || 'loaded'}`);
    } catch (e2) {
      console.log(`❌ Property model not found: ${e1.message}`);
    }
  }
} catch (error) {
  console.log(`❌ Property model test failed: ${error.message}`);
}

console.log('\n5️⃣ Testing Factory Import...');
try {
  const repositoryFactory = require('./src/repositories/factory');
  console.log(`✅ Factory loaded, dbTarget: ${repositoryFactory.dbTarget}`);
  
  // Test factory method
  repositoryFactory.switchDatabase('mongo');
  const repo = repositoryFactory.getPropertyRepository();
  console.log(`✅ Repository created: ${repo.constructor.name}`);
  console.log(`   Methods: create=${typeof repo.create}, list=${typeof repo.list}`);
} catch (error) {
  console.log(`❌ Factory test failed: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}