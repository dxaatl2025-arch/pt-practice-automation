@echo off
echo Updating package.json with cutover scripts...

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

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

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json with cutover scripts');
"

echo Done!
pause