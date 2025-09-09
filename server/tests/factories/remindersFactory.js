const { getClient } = require('../utils/testPrisma');

async function createReminderSchedule(overrides = {}) {
  const prisma = getClient();
  const now = new Date('2025-01-15T10:00:00Z');
  // Adjust model/fields to match your Prisma schema names:
  return prisma.reminderSchedule.create({
    data: {
      type: overrides.type || 'RENT_DUE', // enum in your schema
      channel: overrides.channel || 'EMAIL',
      frequency: overrides.frequency || 'DAILY',
      timezone: overrides.timezone || 'UTC',
      userId: overrides.userId || null,
      tenantId: overrides.tenantId || null,
      propertyId: overrides.propertyId || null,
      leaseId: overrides.leaseId || null,
      // nextRunAt must be due:
      nextRunAt: overrides.nextRunAt || now,
      isActive: overrides.isActive ?? true,
      metaJson: overrides.metaJson || {}
    }
  });
}

async function createUser(overrides = {}) {
  const prisma = getClient();
  return prisma.user.create({
    data: {
      email: overrides.email || `reminders+${Date.now()}@test.com`,
      role: overrides.role || 'TENANT',
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User'
    }
  });
}

module.exports = { createReminderSchedule, createUser };