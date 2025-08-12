const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const { MigrationLogger } = require('./shared/migrationUtils');
const fs = require('fs');
require('dotenv').config();

const Payment = require('../src/models/Payment');
const prisma = new PrismaClient();

async function migratePayments() {
  const logger = new MigrationLogger('migratePayments');

  try {
    const userIdMapping = JSON.parse(fs.readFileSync('./scripts/userIdMap.json', 'utf8'));
    await mongoose.connect(process.env.MONGODB_URI);

    const payments = await Payment.find().lean();
    logger.setTotal(payments.length);

    for (const payment of payments) {
      try {
        const existing = await prisma.payment.findFirst({
          where: { legacyId: payment._id.toString() }
        });
        if (existing) {
          logger.logSkip(payment._id.toString());
          continue;
        }

        const tenantId = userIdMapping[payment.tenant?.toString()];
        if (!tenantId) {
          logger.logError(payment, 'Tenant not found');
          continue;
        }

        // Create without leaseId since no leases exist
        await prisma.payment.create({
          data: {
            legacyId: payment._id.toString(),
            amount: payment.amount || 0,
            dueDate: payment.dueDate || new Date(),
            paidDate: payment.paidDate || null,
            status: payment.status?.toUpperCase() || 'PENDING',
            type: payment.paymentType?.toUpperCase() || 'RENT',
            description: `Legacy payment - ${payment.paymentType || 'rent'}`,
            tenantId,
            leaseId: 'temp-lease-id', // You'll need to handle this
            createdAt: payment.createdAt || new Date(),
            updatedAt: payment.updatedAt || new Date()
          }
        });

        logger.logSuccess(payment._id.toString(), 'created');
      } catch (error) {
        logger.logError(payment, error.message);
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    await logger.finish();
  }
}

migratePayments();