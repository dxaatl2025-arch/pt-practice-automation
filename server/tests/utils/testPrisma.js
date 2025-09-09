// Minimal, safe Prisma test helper
const { PrismaClient } = require('@prisma/client');

let prisma;
function getClient() {
  if (!prisma) {
    // Use test database URL
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://propertypulse_user:PropertyPulse2024!@localhost:5432/propertypulse_test';
    prisma = new PrismaClient();
  }
  return prisma;
}

// Optional hooks used by some suites; keep no-ops if not required
async function beforeAllDb() { /* no-op */ }
async function afterAllDb()  { if (prisma) { await prisma.$disconnect(); prisma = null; } }

// If your tests call resetDb(), keep it minimal & non-destructive:
// Prefer not to delete; tests that need clean DB should rely on seed script.
async function resetDb() {
  const client = getClient();
  const deletions = [];
  const maybe = (fn) => deletions.push(fn().catch(() => {}));

  // Adjust these names ONLY if they exist in prisma schema:
  maybe(() => client.payment.deleteMany());
  maybe(() => client.maintenanceTicket.deleteMany());
  maybe(() => client.application.deleteMany());
  maybe(() => client.lease.deleteMany());
  maybe(() => client.property.deleteMany());
  maybe(() => client.user.deleteMany());

  await Promise.all(deletions);
}

module.exports = {
  prisma: getClient(),
  getClient,
  beforeAllDb,
  afterAllDb,
  resetDb
};