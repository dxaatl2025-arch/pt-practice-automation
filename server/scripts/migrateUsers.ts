// scripts/migrateUsers.ts - Updated for Firebase Auth users
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const { MigrationLogger, createIdMap, saveIdMapping } = require('./shared/migrationUtils');
require('dotenv').config();

const User = require('../src/models/User');
const userPrisma = new PrismaClient();

const BATCH_SIZE = 500;

async function migrateUsers() {
  const logger = new MigrationLogger('migrateUsers');
  const idMap = createIdMap();

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB');

    // Get total count
    const totalUsers = await User.countDocuments();
    logger.setTotal(totalUsers);
    console.log(`📊 Found ${totalUsers} users to migrate`);

    let skip = 0;
    let batch = 1;

    while (skip < totalUsers) {
      console.log(`\n🔄 Processing batch ${batch} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalUsers)})`);
      
      const users = await User.find()
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      for (const user of users) {
        try {
          // Check if already migrated
          const existing = await userPrisma.user.findFirst({
            where: { legacyId: user._id.toString() }
          });

          if (existing) {
            logger.logSkip(user._id.toString());
            idMap.set(user._id.toString(), existing.id);
            continue;
          }

          // Migrate user (Firebase auth users don't have passwords)
          const newUser = await userPrisma.user.create({
            data: {
              legacyId: user._id.toString(),
              email: user.email,
              password: user.firebaseUid || `firebase_${user._id.toString()}`, // Use firebaseUid as password placeholder
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              role: user.role?.toUpperCase() || 'TENANT', // Ensure uppercase for enum
              phone: user.phone || null,
              createdAt: user.createdAt || new Date(),
              updatedAt: user.updatedAt || new Date()
            }
          });

          logger.logSuccess(user._id.toString(), newUser.id);
          idMap.set(user._id.toString(), newUser.id);

        } catch (error) {
          logger.logError(user, error.message || 'Unknown error');
        }
      }

      skip += BATCH_SIZE;
      batch++;
      logger.logProgress(skip, totalUsers);
    }

    // Save ID mapping for next migrations
    saveIdMapping('userIdMap.json', idMap);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await userPrisma.$disconnect();
    await logger.finish();
  }
}

if (require.main === module) {
  migrateUsers().catch(console.error);
}

module.exports = { migrateUsers };