// scripts/migrateProperties.ts - Fixed to match your Prisma schema
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const { MigrationLogger, createIdMap, saveIdMapping } = require('./shared/migrationUtils');
const fs = require('fs');
require('dotenv').config();

const Property = require('../src/models/Property');
const propertyPrisma = new PrismaClient();

const BATCH_SIZE = 500;

async function migrateProperties() {
  const logger = new MigrationLogger('migrateProperties');
  const propertyIdMap = createIdMap();

  try {
    // Load user ID mapping
    const userIdMapFile = './scripts/userIdMap.json';
    if (!fs.existsSync(userIdMapFile)) {
      throw new Error('User ID mapping not found. Run migrateUsers first.');
    }
    const userIdMapping = JSON.parse(fs.readFileSync(userIdMapFile, 'utf8'));
    console.log(`📋 Loaded ${Object.keys(userIdMapping).length} user ID mappings`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB');

    const totalProperties = await Property.countDocuments();
    logger.setTotal(totalProperties);
    console.log(`🏠 Found ${totalProperties} properties to migrate`);

    let skip = 0;
    let batch = 1;

    while (skip < totalProperties) {
      console.log(`\n🔄 Processing batch ${batch} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalProperties)})`);
      
      const properties = await Property.find()
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      for (const property of properties) {
        try {
          // Check if already migrated
          const existing = await propertyPrisma.property.findFirst({
            where: { legacyId: property._id.toString() }
          });

          if (existing) {
            logger.logSkip(property._id.toString());
            propertyIdMap.set(property._id.toString(), existing.id);
            continue;
          }

          // Map landlord ID to landlordId (not ownerId!)
          const landlordPrismaId = userIdMapping[property.landlord?.toString()];
          if (!landlordPrismaId) {
            logger.logError(property, `Landlord not found in mapping: ${property.landlord}`);
            continue;
          }

          // Map property type to enum
          const mapPropertyType = (mongoType) => {
            switch (mongoType?.toLowerCase()) {
              case 'apartment': return 'APARTMENT';
              case 'house': return 'HOUSE';
              case 'condo': return 'CONDO';
              case 'townhouse': return 'TOWNHOUSE';
              case 'studio': return 'STUDIO';
              default: return 'OTHER';
            }
          };

          // Map status to enum
          const mapStatus = (mongoStatus) => {
            switch (mongoStatus?.toLowerCase()) {
              case 'available': return 'ACTIVE';
              case 'rented': return 'RENTED';
              case 'maintenance': return 'MAINTENANCE';
              default: return 'ACTIVE';
            }
          };

          // Migrate property with correct field names
          const newProperty = await propertyPrisma.property.create({
            data: {
              legacyId: property._id.toString(),
              title: property.title || `Property at ${property.address?.street || 'Unknown Address'}`,
              description: property.description || property.title || 'No description provided',
              propertyType: mapPropertyType(property.propertyType),
              
              // Address fields (flattened)
              addressStreet: property.address?.street || '',
              addressCity: property.address?.city || '',
              addressState: property.address?.state || '',
              addressZip: property.address?.zipCode || '',
              addressCountry: property.address?.country || 'US',
              
              // Physical details
              bedrooms: property.bedrooms || 1,
              bathrooms: property.bathrooms || 1,
              squareFeet: property.squareFeet || null,
              
              // Financial details (flattened rent structure)
              rentAmount: property.rent?.amount || property.rent || 0,
              rentCurrency: property.rent?.currency || 'USD',
              rentPeriod: 'MONTHLY',
              deposit: property.deposit || 0,
              
              // Status and availability
              status: mapStatus(property.status),
              isAvailable: property.availability?.isAvailable !== false,
              availableFrom: property.availability?.availableFrom || null,
              availableTo: property.availability?.availableTo || null,
              
              // JSON fields for complex data
              amenities: property.amenities || null,
              images: property.images || null,
              utilities: property.utilities || null,
              petPolicy: property.petPolicy || null,
              
              // Relations
              landlordId: landlordPrismaId,
              
              // Timestamps
              createdAt: property.createdAt || new Date(),
              updatedAt: property.updatedAt || new Date()
            }
          });

          logger.logSuccess(property._id.toString(), newProperty.id);
          propertyIdMap.set(property._id.toString(), newProperty.id);

        } catch (error) {
          logger.logError(property, error.message || 'Unknown error');
        }
      }

      skip += BATCH_SIZE;
      batch++;
      logger.logProgress(skip, totalProperties);
    }

    // Save property ID mapping
    saveIdMapping('propertyIdMap.json', propertyIdMap);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await propertyPrisma.$disconnect();
    await logger.finish();
  }
}

if (require.main === module) {
  migrateProperties().catch(console.error);
}

module.exports = { migrateProperties };