// Development seed script with environment support
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isTestEnv = args.includes('--env') && args[args.indexOf('--env') + 1] === 'test';

async function main() {
  console.log(`🌱 Seeding ${isTestEnv ? 'test' : 'development'} data...`);

  // For test environment, the DATABASE_URL should be set via the test scripts
  // We don't override it here to avoid conflicts

  // Clean existing data (more aggressive for test environment)
  if (isTestEnv) {
    console.log('🧹 Cleaning existing test data...');
    try {
      // Skip reminder_schedules as table doesn't exist yet
      // await prisma.reminderSchedule.deleteMany({ where: { user: { email: { contains: '@propertyplus.us' } } } });
      await prisma.payment.deleteMany({ where: { tenant: { email: { contains: '@propertyplus.us' } } } });
      await prisma.application.deleteMany({ where: { email: { contains: '@propertyplus.us' } } });
      await prisma.lease.deleteMany({ where: { tenant: { email: { contains: '@propertyplus.us' } } } });
      await prisma.maintenanceTicket.deleteMany({ where: { tenant: { email: { contains: '@propertyplus.us' } } } });
      await prisma.property.deleteMany({ where: { landlord: { email: { contains: '@propertyplus.us' } } } });
      await prisma.user.deleteMany({ where: { email: { contains: '@propertyplus.us' } } });
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error.message);
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('Database tables may not exist yet. Migrations needed first.');
        console.log('Run: npm run test:db:migrate');
        process.exit(1);
      }
      console.log('Continuing with seeding despite cleanup error...');
    }
  } else {
    // Development cleanup - more conservative
    console.log('🧹 Checking for existing development data...');
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log(`Found ${existingUsers} existing users. Skipping seed to avoid duplicates.`);
      console.log('Use --force flag to override or clear database first.');
      return;
    }
  }

  // Create users
  const hashedPassword = await bcrypt.hash(isTestEnv ? 'testpass123' : 'devpass123', 10);
  
  const emailSuffix = isTestEnv ? '.test@propertyplus.us' : '@devlord.com';
  const tenantSuffix = isTestEnv ? '.test@propertyplus.us' : '@dev.com';
  
  const landlord = await prisma.user.create({
    data: {
      email: `landlord${emailSuffix}`,
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Landlord',
      role: 'LANDLORD',
      phone: '555-0100'
    }
  });

  const tenant1 = await prisma.user.create({
    data: {
      email: `tenant1${tenantSuffix}`,
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Tenant',
      role: 'TENANT',
      phone: '555-0101',
      budgetMax: 1500,
      budgetMin: 1000
    }
  });

  const tenant2 = await prisma.user.create({
    data: {
      email: `tenant2${tenantSuffix}`,
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Renter',
      role: 'TENANT',
      phone: '555-0102',
      budgetMax: 2000,
      budgetMin: 1200
    }
  });

  console.log('✅ Created users');

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Downtown Studio Apartment',
      description: 'Modern studio in the heart of downtown with all amenities.',
      bedrooms: 0,
      bathrooms: 1,
      squareFeet: 500,
      rentAmount: 1200,
      deposit: 1200,
      addressStreet: '123 Main St',
      addressCity: isTestEnv ? 'Testville' : 'Devville',
      addressState: 'CA',
      addressZip: '90210',
      propertyType: 'STUDIO',
      status: 'ACTIVE',
      isAvailable: true,
      availableFrom: new Date(),
      landlordId: landlord.id,
      amenities: ['wifi', 'gym', 'parking'],
      utilities: ['water', 'trash']
    }
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Suburban 2BR House',
      description: 'Spacious 2-bedroom house with yard and garage.',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      rentAmount: 1800,
      deposit: 1800,
      addressStreet: '456 Oak Ave',
      addressCity: isTestEnv ? 'Suburbia' : 'Devburbs',
      addressState: 'CA',
      addressZip: '90211',
      propertyType: 'HOUSE',
      status: 'ACTIVE',
      isAvailable: true,
      availableFrom: new Date(),
      landlordId: landlord.id,
      amenities: ['parking', 'yard', 'garage'],
      utilities: ['gas', 'electric']
    }
  });

  const property3 = await prisma.property.create({
    data: {
      title: 'Luxury 1BR Condo',
      description: 'High-end 1-bedroom condo with city views.',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 800,
      rentAmount: 2200,
      deposit: 2200,
      addressStreet: '789 Tower Blvd',
      addressCity: isTestEnv ? 'Metropolis' : 'Dev City',
      addressState: 'CA',
      addressZip: '90212',
      propertyType: 'CONDO',
      status: 'ACTIVE',
      isAvailable: false, // Occupied
      landlordId: landlord.id,
      amenities: ['concierge', 'pool', 'gym', 'parking'],
      utilities: ['water', 'trash', 'internet']
    }
  });

  console.log('✅ Created properties');

  // Create lease (for occupied property)
  const lease1 = await prisma.lease.create({
    data: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      monthlyRent: 2200,
      securityDeposit: 2200,
      status: 'ACTIVE',
      terms: 'Standard lease terms and conditions apply.',
      propertyId: property3.id,
      tenantId: tenant2.id
    }
  });

  console.log('✅ Created lease');

  // Create applications
  const app1 = await prisma.application.create({
    data: {
      propertyId: property1.id,
      applicantId: tenant1.id,
      firstName: 'Alice',
      lastName: 'Tenant',
      email: `tenant1${tenantSuffix}`,
      phone: '555-0101',
      dateOfBirth: new Date('1990-05-15'),
      currentAddress: '999 Current St',
      currentCity: 'Currentville',
      currentState: 'CA',
      currentZip: '90000',
      yearsAtAddress: 2.5,
      reasonForMoving: 'Job relocation',
      employerName: 'Tech Corp',
      jobTitle: 'Software Developer',
      employerAddress: '100 Tech Way',
      employerPhone: '555-TECH',
      employmentLength: '3 years',
      monthlyIncome: 5000,
      otherIncome: 500,
      refName: 'Jane Reference',
      refRelationship: 'Former Landlord',
      refContact: 'jane@ref.com',
      occupants: 1,
      pets: null,
      vehicles: [{ make: 'Toyota', model: 'Camry', year: 2020 }],
      wasEvicted: false,
      felony: false,
      desiredMoveIn: new Date('2024-03-01'),
      consentBackground: true,
      signature: 'Alice Tenant',
      signedAt: new Date(),
      status: 'PENDING'
    }
  });

  const app2 = await prisma.application.create({
    data: {
      propertyId: property2.id,
      firstName: 'Charlie',
      lastName: 'Applicant',
      email: `charlie${tenantSuffix}`,
      phone: '555-0103',
      dateOfBirth: new Date('1985-08-20'),
      currentAddress: '777 Another St',
      currentCity: 'Otherville',
      currentState: 'CA',
      currentZip: '90001',
      yearsAtAddress: 1.0,
      reasonForMoving: 'Need more space',
      employerName: 'Business Inc',
      jobTitle: 'Manager',
      employerAddress: '200 Business Rd',
      employerPhone: '555-BUSI',
      employmentLength: '5 years',
      monthlyIncome: 6000,
      refName: 'Bob Reference',
      refRelationship: 'Supervisor',
      refContact: 'bob@business.com',
      occupants: 2,
      pets: [{ type: 'dog', breed: 'Golden Retriever', weight: 60 }],
      vehicles: null,
      wasEvicted: false,
      felony: false,
      desiredMoveIn: new Date('2024-04-01'),
      consentBackground: true,
      signature: 'Charlie Applicant',
      signedAt: new Date(),
      status: 'APPROVED'
    }
  });

  console.log('✅ Created applications');

  // Create payments
  const payment1 = await prisma.payment.create({
    data: {
      amount: 2200,
      dueDate: new Date('2024-02-01'),
      paidDate: new Date('2024-01-28'),
      status: 'PAID',
      type: 'RENT',
      leaseId: lease1.id,
      tenantId: tenant2.id
    }
  });

  const payment2 = await prisma.payment.create({
    data: {
      amount: 2200,
      dueDate: new Date('2024-03-01'),
      status: 'PENDING',
      type: 'RENT',
      leaseId: lease1.id,
      tenantId: tenant2.id
    }
  });

  const payment3 = await prisma.payment.create({
    data: {
      amount: 1500,
      dueDate: new Date('2024-01-15'),
      paidDate: new Date('2024-01-14'),
      status: 'PAID',
      type: 'RENT',
      description: 'Cash payment received',
      leaseId: lease1.id,
      tenantId: tenant2.id
    }
  });

  console.log('✅ Created payments');

  // Create maintenance tickets
  const ticket1 = await prisma.maintenanceTicket.create({
    data: {
      title: 'Leaky Faucet',
      description: 'Kitchen faucet drips constantly, needs repair.',
      priority: 'MEDIUM',
      status: 'OPEN',
      category: 'Plumbing',
      estimatedCost: 150,
      propertyId: property3.id,
      tenantId: tenant2.id
    }
  });

  const ticket2 = await prisma.maintenanceTicket.create({
    data: {
      title: 'Broken Window',
      description: 'Living room window cracked, needs replacement.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      category: 'Glass/Windows',
      estimatedCost: 300,
      actualCost: 275,
      assignedTo: 'ABC Glass Company',
      propertyId: property3.id,
      tenantId: tenant2.id
    }
  });

  console.log('✅ Created maintenance tickets');

  // Create reminders - Skip for now as table doesn't exist
  // const now = new Date();
  // const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  // const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // const reminder1 = await prisma.reminderSchedule.create({
  //   data: {
  //     userId: tenant2.id,
  //     kind: 'RENT_DUE',
  //     nextRunAt: oneHourFromNow, // Due soon for testing
  //     meta: {
  //       leaseId: lease1.id,
  //       amount: 2200,
  //       dueDate: '2024-04-01'
  //     }
  //   }
  // });

  // const reminder2 = await prisma.reminderSchedule.create({
  //   data: {
  //     userId: tenant1.id,
  //     kind: 'PAYMENT_RECEIPT',
  //     nextRunAt: twoDaysFromNow,
  //     meta: {
  //       paymentId: payment1.id
  //     }
  //   }
  // });

  // console.log('✅ Created reminders');

  console.log(`\n🎉 ${isTestEnv ? 'Test' : 'Development'} data seeding completed!`);
  console.log('\nUsers Created:');
  console.log(`👔 Landlord: landlord${emailSuffix} / ${isTestEnv ? 'testpass123' : 'devpass123'}`);
  console.log(`🏠 Tenant 1: tenant1${tenantSuffix} / ${isTestEnv ? 'testpass123' : 'devpass123'}`);
  console.log(`🏠 Tenant 2: tenant2${tenantSuffix} / ${isTestEnv ? 'testpass123' : 'devpass123'}`);
  console.log('\nData Summary:');
  console.log('📋 Properties: 3 (1 available studio, 1 available house, 1 occupied condo)');
  console.log('📝 Applications: 2 (1 pending, 1 approved)');
  console.log('📄 Leases: 1 active lease');
  console.log('💰 Payments: 3 (1 paid rent, 1 pending rent, 1 manual payment)');
  console.log('🔧 Maintenance: 2 tickets (1 open, 1 in progress)');
  console.log('⏰ Reminders: Skipped (table not migrated yet)');

  if (isTestEnv) {
    // Test IDs for reference
    console.log('\n📋 Test Entity IDs for API Testing:');
    console.log(`Landlord ID: ${landlord.id}`);
    console.log(`Tenant 1 ID: ${tenant1.id}`);
    console.log(`Tenant 2 ID: ${tenant2.id}`);
    console.log(`Property 1 ID: ${property1.id} (studio)`);
    console.log(`Property 2 ID: ${property2.id} (house)`);
    console.log(`Property 3 ID: ${property3.id} (condo)`);
    console.log(`Application 1 ID: ${app1.id} (pending)`);
    console.log(`Application 2 ID: ${app2.id} (approved)`);
    console.log(`Lease 1 ID: ${lease1.id}`);
    console.log(`Payment 1 ID: ${payment1.id} (paid)`);
    console.log(`Payment 2 ID: ${payment2.id} (pending)`);
    console.log(`Ticket 1 ID: ${ticket1.id} (open)`);
  }

  // Seed reminders (additive)
  try {
    const dueAt = new Date('2025-01-15T10:00:00Z');
    const schedule = await prisma.reminderSchedule.create({
      data: {
        type: 'RENT_DUE',
        channel: 'EMAIL',
        frequency: 'DAILY',
        timezone: 'UTC',
        isActive: true,
        nextRunAt: dueAt,
        userId: null,
        tenantId: null,
        propertyId: null,
        leaseId: null,
        metaJson: {}
      }
    });
    console.log(`Seeded ReminderSchedule ID: ${schedule.id}`);
  } catch (e) {
    console.log('[seed] ReminderSchedule skipped:', e?.message || e);
  }
}

main()
  .catch((e) => {
    console.error(`❌ ${isTestEnv ? 'Test' : 'Development'} seed script error:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });