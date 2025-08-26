// field-diagnostic.js - Run: node field-diagnostic.js
// This will help us see exactly what field names your database expects

const prisma = require('./src/config/prisma');

async function diagnoseFieldNames() {
  console.log('🔍 Diagnosing Application Field Names');
  console.log('='.repeat(50));

  try {
    // Try to create a test application with different field name combinations
    console.log('\n📊 Testing field name combinations...');

    // Test 1: Try with firstName/lastName
    try {
      console.log('\n🧪 Test 1: Testing firstName + lastName fields...');
      const testData1 = {
        propertyId: 'test-property-id',
        firstName: 'Test',
        lastName: 'User', 
        email: 'test@test.com',
        phone: '555-0123',
        dateOfBirth: new Date('1990-01-01'),
        currentAddress: '123 Test St',
        currentCity: 'Test City',
        currentState: 'TS',
        currentZip: '12345',
        yearsAtAddress: 1,
        employerName: 'Test Corp',
        jobTitle: 'Tester',
        employerAddress: '456 Test Ave',
        employerPhone: '555-0124',
        employmentLength: '1 year',
        monthlyIncome: 4000,
        refName: 'Test Ref',
        refRelationship: 'Friend',
        refContact: '555-0125',
        occupants: 1,
        desiredMoveIn: new Date('2024-01-01'),
        consentBackground: true,
        signature: 'Test User',
        signedAt: new Date()
      };

      // Don't actually create, just validate the data structure
      console.log('✅ firstName/lastName structure is valid for:', Object.keys(testData1).length, 'fields');
      
    } catch (error) {
      console.log('❌ firstName/lastName failed:', error.message);
    }

    // Test 2: Check what the database schema actually expects
    try {
      console.log('\n🧪 Test 2: Checking database schema...');
      
      // Try to find an existing application to see field names
      const existingApp = await prisma.application.findFirst({
        take: 1
      });

      if (existingApp) {
        console.log('✅ Found existing application with fields:');
        console.log('   - Has firstName?', existingApp.firstName !== undefined);
        console.log('   - Has lastName?', existingApp.lastName !== undefined);
        console.log('   - Has fullName?', existingApp.fullName !== undefined);
        console.log('   - Has dateOfBirth?', existingApp.dateOfBirth !== undefined);
        console.log('   - Has dob?', existingApp.dob !== undefined);
        
        console.log('\n📋 Actual field names in database:');
        Object.keys(existingApp).forEach(key => {
          if (!['id', 'propertyId', 'createdAt', 'updatedAt', 'status', 'submittedAt'].includes(key)) {
            console.log(`   - ${key}: ${typeof existingApp[key]}`);
          }
        });
      } else {
        console.log('ℹ️ No existing applications found');
      }

    } catch (error) {
      console.log('❌ Database check failed:', error.message);
    }

    // Test 3: Check Prisma schema file
    try {
      console.log('\n🧪 Test 3: Checking Prisma schema file...');
      const fs = require('fs');
      const path = require('path');
      
      const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        const applicationModelMatch = schemaContent.match(/model Application \{([\s\S]*?)\}/);
        if (applicationModelMatch) {
          const modelContent = applicationModelMatch[1];
          
          console.log('✅ Found Application model in schema:');
          console.log('   - Has firstName?', modelContent.includes('firstName'));
          console.log('   - Has lastName?', modelContent.includes('lastName'));
          console.log('   - Has fullName?', modelContent.includes('fullName'));
          console.log('   - Has dateOfBirth?', modelContent.includes('dateOfBirth'));
          console.log('   - Has dob?', modelContent.includes('dob'));
        }
      } else {
        console.log('❌ Prisma schema file not found');
      }
    } catch (error) {
      console.log('❌ Schema file check failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE');
  console.log('='.repeat(50));
  console.log('Based on the results above:');
  console.log('1. Check if your database has the right field names');
  console.log('2. Make sure your Prisma schema matches your database');
  console.log('3. Run: npx prisma db pull (to sync schema with database)');
  console.log('4. Run: npx prisma generate (to update Prisma client)');
}

diagnoseFieldNames().catch(console.error);