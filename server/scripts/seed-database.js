// scripts/seed-database.js
// Idempotent seed script for PostgreSQL via Prisma

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting PostgreSQL database seeding...');
  
  try {
    // Clean existing data (for idempotency)
    console.log('🧹 Cleaning existing seed data...');
    await prisma.payment.deleteMany({
      where: { description: { contains: '[SEED]' } }
    });
    await prisma.maintenanceTicket.deleteMany({
      where: { title: { contains: '[SEED]' } }
    });
    await prisma.lease.deleteMany({
      where: { 
        OR: [
          { tenant: { email: { endsWith: '@seed.example.com' } } },
          { property: { title: { contains: '[SEED]' } } }
        ]
      }
    });
    await prisma.property.deleteMany({
      where: { title: { contains: '[SEED]' } }
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@seed.example.com' } }
    });

    // 1. Create Landlord User
    console.log('👨‍💼 Creating landlord user...');
    const hashedPassword = await bcrypt.hash('landlord123', 10);
    const landlord = await prisma.user.create({
      data: {
        email: 'alex.landlord@seed.example.com',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'PropertyOwner',
        role: 'LANDLORD',
        phone: '+1-555-LAND-LORD',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Landlord created: ${landlord.firstName} ${landlord.lastName} (${landlord.id})`);

    // 2. Create Tenant User
    console.log('👤 Creating tenant user...');
    const tenantPassword = await bcrypt.hash('tenant123', 10);
    const tenant = await prisma.user.create({
      data: {
        email: 'maria.tenant@seed.example.com',
        password: tenantPassword,
        firstName: 'Maria',
        lastName: 'Renter',
        role: 'TENANT',
        phone: '+1-555-TENANT-01',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Tenant created: ${tenant.firstName} ${tenant.lastName} (${tenant.id})`);

    // 3. Create Property
    console.log('🏠 Creating property...');
    const property = await prisma.property.create({
      data: {
        title: '[SEED] Modern Downtown Loft',
        description: 'Beautiful 2-bedroom loft in the heart of downtown with exposed brick walls, high ceilings, and modern amenities. Walking distance to restaurants, shopping, and public transit.',
        propertyType: 'APARTMENT',
        addressStreet: '1234 Seed Street',
        addressCity: 'Atlanta',
        addressState: 'GA',
        addressZip: '30309',
        addressCountry: 'US',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        rentAmount: 2200,
        rentCurrency: 'USD',
        rentPeriod: 'MONTHLY',
        deposit: 2200,
        status: 'ACTIVE',
        isAvailable: false, // Will be occupied by lease
        availableFrom: new Date('2025-01-01'),
        amenities: ['Pool', 'Gym', 'Parking', 'Balcony', 'In-unit Laundry'],
        utilities: {
          included: ['Water', 'Trash', 'Internet'],
          excluded: ['Electricity', 'Gas']
        },
        petPolicy: {
          allowed: true,
          deposit: 500,
          restrictions: ['Under 50lbs', 'No aggressive breeds']
        },
        landlordId: landlord.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Property created: ${property.title} (${property.id})`);

    // 4. Create Lease
    console.log('📄 Creating lease...');
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    const lease = await prisma.lease.create({
      data: {
        propertyId: property.id,
        tenantId: tenant.id,
        startDate: startDate,
        endDate: endDate,
        monthlyRent: 2200,
        securityDeposit: 2200,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Lease created: ${lease.monthlyRent}/month (${lease.id})`);

    // 5. Create Payment Records
    console.log('💰 Creating payment records...');
    
    // January payment (paid)
    const januaryPayment = await prisma.payment.create({
      data: {
        leaseId: lease.id,
        tenantId: tenant.id,
        amount: 2200,
        dueDate: new Date('2025-01-01'),
        paidDate: new Date('2024-12-28'),
        status: 'PAID',
        type: 'RENT',
        description: '[SEED] January 2025 Rent Payment',
        createdAt: new Date('2024-12-28'),
        updatedAt: new Date('2024-12-28')
      }
    });

    // February payment (pending)
    const februaryPayment = await prisma.payment.create({
      data: {
        leaseId: lease.id,
        tenantId: tenant.id,
        amount: 2200,
        dueDate: new Date('2025-02-01'),
        status: 'PENDING',
        type: 'RENT',
        description: '[SEED] February 2025 Rent Payment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Security deposit payment
    const depositPayment = await prisma.payment.create({
      data: {
        leaseId: lease.id,
        tenantId: tenant.id,
        amount: 2200,
        dueDate: new Date('2024-12-15'),
        paidDate: new Date('2024-12-15'),
        status: 'PAID',
        type: 'SECURITY_DEPOSIT',
        description: '[SEED] Security Deposit Payment',
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-15')
      }
    });

    console.log(`   ✅ Payments created: 3 payments (${januaryPayment.id}, ${februaryPayment.id}, ${depositPayment.id})`);

    // 6. Create Maintenance Tickets
    console.log('🔧 Creating maintenance tickets...');
    
    // Open ticket
    const openTicket = await prisma.maintenanceTicket.create({
      data: {
        propertyId: property.id,
        tenantId: tenant.id,
        title: '[SEED] Kitchen Faucet Dripping',
        description: 'The kitchen faucet has been dripping constantly for the past week. It seems to be getting worse and is wasting water. Please send someone to repair or replace it.',
        priority: 'MEDIUM',
        status: 'OPEN',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      }
    });

    // Resolved ticket
    const resolvedTicket = await prisma.maintenanceTicket.create({
      data: {
        propertyId: property.id,
        tenantId: tenant.id,
        title: '[SEED] Heater Not Working',
        description: 'The heating system stopped working yesterday evening. The apartment is getting very cold. This is urgent as temperatures are dropping.',
        priority: 'HIGH',
        status: 'RESOLVED',
        createdAt: new Date('2024-12-20'),
        updatedAt: new Date('2024-12-22')
      }
    });

    console.log(`   ✅ Maintenance tickets created: 2 tickets (${openTicket.id}, ${resolvedTicket.id})`);

    // 7. Summary
    console.log('');
    console.log('📊 Seed Data Summary:');
    console.log('===================');
    console.log(`✅ Landlord: ${landlord.firstName} ${landlord.lastName} (${landlord.email})`);
    console.log(`✅ Tenant: ${tenant.firstName} ${tenant.lastName} (${tenant.email})`);
    console.log(`✅ Property: ${property.title}`);
    console.log(`   📍 Address: ${property.addressStreet}, ${property.addressCity}, ${property.addressState}`);
    console.log(`   💰 Rent: $${property.rentAmount}/month`);
    console.log(`✅ Lease: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    console.log(`✅ Payments: 3 total (1 pending, 2 paid)`);
    console.log(`✅ Maintenance: 2 tickets (1 open, 1 resolved)`);
    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('🧪 Test the seeded data:');
    console.log('   curl http://localhost:5000/api/users');
    console.log('   curl http://localhost:5000/api/properties');
    console.log('   curl http://localhost:5000/api/leases');
    console.log('   curl http://localhost:5000/api/payments');
    console.log('   curl http://localhost:5000/api/maintenance');

    return {
      landlord,
      tenant,
      property,
      lease,
      payments: [januaryPayment, februaryPayment, depositPayment],
      tickets: [openTicket, resolvedTicket]
    };

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;