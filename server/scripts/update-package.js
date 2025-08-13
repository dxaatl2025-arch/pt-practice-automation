// server/scripts/update-package.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Updating package.json with cutover scripts...');

try {
  // Read current package.json
  const packagePath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  console.log('Current scripts:', Object.keys(pkg.scripts || {}).length);
  
  // Add cutover scripts
  pkg.scripts = {
    ...pkg.scripts,
    'verify:final': 'node scripts/verify-final-migration.js',
    'cutover:health': 'node scripts/monitor-cutover.js health',
    'cutover:monitor': 'node scripts/monitor-cutover.js monitor',
    'cutover:switch-prisma': 'node scripts/monitor-cutover.js switch-prisma',
    'cutover:switch-mongo': 'node scripts/monitor-cutover.js switch-mongo',
    'cutover:rollback': 'node scripts/monitor-cutover.js switch-mongo',
    'production:cutover': 'npm run verify:final'
  };
  
  // Write updated package.json
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  
  console.log('✅ Successfully updated package.json');
  console.log('New scripts:', Object.keys(pkg.scripts).length);
  console.log('\nAdded scripts:');
  console.log('- verify:final');
  console.log('- cutover:health');
  console.log('- cutover:monitor');
  console.log('- cutover:switch-prisma');
  console.log('- cutover:switch-mongo');
  console.log('- cutover:rollback');
  console.log('- production:cutover');
  
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
  process.exit(1);
}