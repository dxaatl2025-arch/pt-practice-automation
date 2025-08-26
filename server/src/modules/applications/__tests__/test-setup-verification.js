// test-setup-verification.js - Run: node test-setup-verification.js
const fs = require('fs');
const path = require('path');

console.log('🧪 PropertyPulse Test Setup Verification');
console.log('='.repeat(50));

// Check current directory structure
console.log('📁 Current directory:', process.cwd());

// Check if test directories exist
const testPaths = [
  'src/modules/applications/__tests__',
  'tests', // Jest default
  'src/modules/applications/__tests__'
];

console.log('\n📂 Checking test directories...');
testPaths.forEach(testPath => {
  const fullPath = path.join(process.cwd(), testPath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${testPath} - ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check if test files exist
const testFiles = [
  'src/modules/applications/__tests__/applicationsService.test.js',
  'src/modules/applications/__tests__/applications.integration.test.js'
];

console.log('\n📄 Checking test files...');
testFiles.forEach(testFile => {
  const fullPath = path.join(process.cwd(), testFile);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${testFile} - ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`    Size: ${Math.round(stats.size / 1024)}KB`);
  }
});

// Check package.json configuration
console.log('\n📦 Checking package.json Jest configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.jest) {
    console.log('✅ Jest configuration found:');
    console.log('   testMatch:', packageJson.jest.testMatch);
    console.log('   testPathIgnorePatterns:', packageJson.jest.testPathIgnorePatterns);
  } else {
    console.log('❌ No Jest configuration found in package.json');
  }
  
  if (packageJson.scripts) {
    const testScripts = Object.keys(packageJson.scripts).filter(key => key.includes('test'));
    console.log('✅ Test scripts found:', testScripts);
  }
} catch (error) {
  console.log('❌ Could not read package.json:', error.message);
}

// Check if Jest is installed
console.log('\n📦 Checking Jest installation...');
try {
  const nodeModulesJest = fs.existsSync('node_modules/jest');
  console.log(`${nodeModulesJest ? '✅' : '❌'} Jest installed: ${nodeModulesJest ? 'YES' : 'NO'}`);
  
  if (nodeModulesJest) {
    const jestPackage = JSON.parse(fs.readFileSync('node_modules/jest/package.json', 'utf8'));
    console.log(`   Version: ${jestPackage.version}`);
  }
} catch (error) {
  console.log('❌ Could not check Jest installation');
}

console.log('\n🎯 DIAGNOSIS:');
console.log('='.repeat(30));

// Provide diagnosis
const testDirExists = fs.existsSync('src/modules/applications/__tests__');
const testFilesExist = testFiles.every(file => fs.existsSync(file));

if (!testDirExists) {
  console.log('❌ Test directory missing');
  console.log('💡 Solution: mkdir -p src\\modules\\applications\\__tests__');
}

if (!testFilesExist) {
  console.log('❌ Test files missing');
  console.log('💡 Solution: Create the test files from the artifacts provided');
}

// Check Jest pattern matching
console.log('\n🔍 Jest Pattern Analysis:');
console.log('Current Jest testMatch: **/tests/**/*.test.js');
console.log('Your test files are in: src/modules/applications/__tests__/');
console.log('❌ PATTERN MISMATCH - Jest looks for "tests" but files are in "__tests__"');

console.log('\n🔧 SOLUTIONS:');
console.log('1. Update Jest configuration to match your structure');
console.log('2. Or move test files to match Jest default pattern');
console.log('3. Or use explicit file paths in Jest commands');

console.log('\n📋 Next Steps:');
console.log('1. Create test directory if missing');
console.log('2. Create test files from artifacts');
console.log('3. Update Jest configuration');
console.log('4. Run tests again');