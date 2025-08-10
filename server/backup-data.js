// server/backup-data.js
const prisma = require('./src/db/prisma');
const fs = require('fs');

async function backupData() {
  console.log('📦 Backing up rental applications...');
  
  try {
    // Get all rental applications
    const apps = await prisma.$queryRaw`SELECT * FROM rental_applications`;
    
    console.log(`✅ Found ${apps.length} rental applications`);
    
    if (apps.length > 0) {
      // Save to backup file
      const backup = {
        timestamp: new Date().toISOString(),
        data: apps
      };
      
      fs.writeFileSync('rental-applications-backup.json', JSON.stringify(backup, null, 2));
      console.log('✅ Backup saved to: rental-applications-backup.json');
      
      // Also log to console for manual copy if needed
      console.log('\n📋 Backup Data (copy this if needed):');
      console.log('=====================================');
      apps.forEach((app, index) => {
        console.log(`\nRecord ${index + 1}:`);
        console.log(`  Application #: ${app.application_number}`);
        console.log(`  Name: ${app.first_name} ${app.last_name}`);
        console.log(`  Email: ${app.email}`);
        console.log(`  Created: ${app.created_at}`);
      });
      console.log('=====================================');
    } else {
      console.log('ℹ️  No rental applications to backup');
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

backupData();