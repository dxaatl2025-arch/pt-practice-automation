// Comprehensive test data seed script for all user roles and features
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding comprehensive test data for all user roles and features...');

  // Clean existing test data
  console.log('🧹 Cleaning existing test data...');
  await prisma.payment.deleteMany({ where: { tenant: { email: { contains: '@manual-test.com' } } } });
  await prisma.application.deleteMany({ where: { email: { contains: '@manual-test.com' } } });
  await prisma.lease.deleteMany({ where: { tenant: { email: { contains: '@manual-test.com' } } } });
  await prisma.maintenanceTicket.deleteMany({ where: { tenant: { email: { contains: '@manual-test.com' } } } });
  await prisma.property.deleteMany({ where: { landlord: { email: { contains: '@manual-test.com' } } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@manual-test.com' } } });

  // Create test users for all roles
  const hashedPassword = await bcrypt.hash('TestPass123!', 10);
  
  // 1. ADMIN User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@manual-test.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '555-0001'
    }
  });

  // 2. LANDLORD User
  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@manual-test.com',
      password: hashedPassword,
      firstName: 'Property',
      lastName: 'Owner',
      role: 'LANDLORD',
      phone: '555-0002'
    }
  });

  // 3. PROPERTY_MANAGER User
  const propertyManager = await prisma.user.create({
    data: {
      email: 'manager@manual-test.com',
      password: hashedPassword,
      firstName: 'Professional',
      lastName: 'Manager',
      role: 'PROPERTY_MANAGER',
      phone: '555-0003'
    }
  });

  // 4. TENANT Users (multiple for different scenarios)
  const tenant1 = await prisma.user.create({
    data: {
      email: 'tenant1@manual-test.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Tenant',
      role: 'TENANT',
      phone: '555-0011',
      budgetMax: 1800,
      budgetMin: 1200
    }
  });

  const tenant2 = await prisma.user.create({
    data: {
      email: 'tenant2@manual-test.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Renter',
      role: 'TENANT',
      phone: '555-0012',
      budgetMax: 2500,
      budgetMin: 1800
    }
  });

  const tenant3 = await prisma.user.create({
    data: {
      email: 'tenant3@manual-test.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Student',
      role: 'TENANT',
      phone: '555-0013',
      budgetMax: 1200,
      budgetMin: 800
    }
  });

  console.log('✅ Created test users for all roles');

  // Create diverse properties
  const property1 = await prisma.property.create({
    data: {
      title: 'Modern Downtown Studio',
      description: 'Sleek studio apartment in the heart of downtown with premium amenities and city views.',
      bedrooms: 0,
      bathrooms: 1,
      squareFeet: 600,
      rentAmount: 1400,
      deposit: 1400,
      addressStreet: '123 Urban Ave',
      addressCity: 'Metropolitan City',
      addressState: 'CA',
      addressZip: '90210',
      propertyType: 'STUDIO',
      status: 'ACTIVE',
      isAvailable: true,
      availableFrom: new Date(),
      landlordId: landlord.id,
      amenities: ['wifi', 'gym', 'rooftop', 'concierge', 'parking'],
      utilities: ['water', 'trash', 'internet'],
      petPolicy: JSON.stringify({
        allowed: false
      }),
      images: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'])
    }
  });

  const property2 = await prisma.property.create({
    data: {
      title: 'Spacious 2BR Family Apartment',
      description: 'Perfect for small families or roommates. Includes balcony, in-unit laundry, and parking.',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1100,
      rentAmount: 2000,
      deposit: 2000,
      addressStreet: '456 Family Lane',
      addressCity: 'Suburban Heights',
      addressState: 'CA',
      addressZip: '90211',
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      isAvailable: false, // Will be occupied
      landlordId: landlord.id,
      amenities: ['parking', 'laundry', 'balcony', 'dishwasher'],
      utilities: ['water', 'trash'],
      petPolicy: JSON.stringify({
        allowed: true,
        deposit: 300,
        restrictions: ['Under 40lbs', 'Max 2 pets']
      }),
      images: JSON.stringify(['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'])
    }
  });

  const property3 = await prisma.property.create({
    data: {
      title: 'Luxury 3BR Penthouse',
      description: 'Exclusive penthouse with panoramic views, premium finishes, and private terrace.',
      bedrooms: 3,
      bathrooms: 3,
      squareFeet: 2200,
      rentAmount: 4500,
      deposit: 9000,
      addressStreet: '789 Elite Towers',
      addressCity: 'Luxury District',
      addressState: 'CA',
      addressZip: '90212',
      propertyType: 'CONDO',
      status: 'ACTIVE',
      isAvailable: true,
      availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Available in 30 days
      landlordId: landlord.id,
      amenities: ['concierge', 'valet', 'pool', 'spa', 'gym', 'parking', 'terrace'],
      utilities: ['water', 'trash', 'internet', 'cable'],
      petPolicy: JSON.stringify({
        allowed: true,
        deposit: 1000,
        restrictions: ['Professional pet interview required']
      }),
      images: JSON.stringify(['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'])
    }
  });

  const property4 = await prisma.property.create({
    data: {
      title: 'Budget-Friendly 1BR',
      description: 'Affordable 1-bedroom apartment perfect for students or young professionals.',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 650,
      rentAmount: 950,
      deposit: 950,
      addressStreet: '321 College St',
      addressCity: 'University Town',
      addressState: 'CA',
      addressZip: '90213',
      propertyType: 'APARTMENT',
      status: 'ACTIVE',
      isAvailable: true,
      landlordId: landlord.id,
      amenities: ['laundry', 'parking'],
      utilities: ['water'],
      petPolicy: JSON.stringify({
        allowed: true,
        deposit: 200,
        restrictions: ['Cats only', 'Max 1 pet']
      }),
      images: JSON.stringify(['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'])
    }
  });

  console.log('✅ Created diverse test properties');

  // Create active lease
  const activeLease = await prisma.lease.create({
    data: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      monthlyRent: 2000,
      securityDeposit: 2000,
      status: 'ACTIVE',
      terms: 'Standard lease agreement with all applicable terms and conditions.',
      propertyId: property2.id,
      tenantId: tenant2.id,
    }
  });

  console.log('✅ Created active lease');

  // Create comprehensive applications
  const applications = [];

  // Pending application
  applications.push(await prisma.application.create({
    data: {
      propertyId: property1.id,
      applicantId: tenant1.id,
      firstName: 'John',
      lastName: 'Tenant',
      email: 'tenant1@manual-test.com',
      phone: '555-0011',
      dateOfBirth: new Date('1990-05-15'),
      currentAddress: '999 Current Place',
      currentCity: 'Current City',
      currentState: 'CA',
      currentZip: '90000',
      yearsAtAddress: 2.5,
      reasonForMoving: 'Job relocation to downtown area',
      employerName: 'Tech Solutions Inc',
      jobTitle: 'Software Developer',
      employerAddress: '100 Tech Blvd',
      employerPhone: '555-TECH-01',
      employmentLength: '3 years',
      monthlyIncome: 6000,
      otherIncome: 500,
      refName: 'Previous Landlord',
      refRelationship: 'Landlord',
      refContact: 'landlord@previous.com',
      occupants: 1,
      pets: null,
      vehicles: [{ make: 'Honda', model: 'Civic', year: 2020, license: 'ABC123' }],
      wasEvicted: false,
      felony: false,
      desiredMoveIn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      consentBackground: true,
      signature: 'John Tenant',
      signedAt: new Date(),
      status: 'PENDING',
    }
  }));

  // Approved application
  applications.push(await prisma.application.create({
    data: {
      propertyId: property4.id,
      applicantId: tenant3.id,
      firstName: 'Mike',
      lastName: 'Student',
      email: 'tenant3@manual-test.com',
      phone: '555-0013',
      dateOfBirth: new Date('1995-08-20'),
      currentAddress: '777 Dorm Hall',
      currentCity: 'University Town',
      currentState: 'CA',
      currentZip: '90213',
      yearsAtAddress: 1.0,
      reasonForMoving: 'Graduating, need own place',
      employerName: 'State University',
      jobTitle: 'Research Assistant',
      employerAddress: '200 University Dr',
      employerPhone: '555-UNI-GRAD',
      employmentLength: '2 years',
      monthlyIncome: 2500,
      otherIncome: 1000, // Parental support
      refName: 'Academic Advisor',
      refRelationship: 'Professor',
      refContact: 'advisor@university.edu',
      occupants: 1,
      pets: [{ type: 'cat', breed: 'Domestic Shorthair', weight: 8, name: 'Whiskers' }],
      vehicles: null,
      wasEvicted: false,
      felony: false,
      desiredMoveIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      consentBackground: true,
      signature: 'Mike Student',
      signedAt: new Date(),
      status: 'APPROVED'
    }
  }));

  // Rejected application (for testing rejection flow)
  applications.push(await prisma.application.create({
    data: {
      propertyId: property3.id,
      firstName: 'Test',
      lastName: 'Rejected',
      email: 'rejected@manual-test.com',
      phone: '555-0099',
      dateOfBirth: new Date('1985-03-10'),
      currentAddress: '123 Rejection St',
      currentCity: 'Rejection City',
      currentState: 'CA',
      currentZip: '90099',
      yearsAtAddress: 0.5,
      reasonForMoving: 'Financial difficulties',
      employerName: 'Unstable Corp',
      jobTitle: 'Part-time Worker',
      employerAddress: '999 Unstable Ave',
      employerPhone: '555-UNSTABLE',
      employmentLength: '3 months',
      monthlyIncome: 2000, // Too low for luxury property
      refName: 'Friend',
      refRelationship: 'Friend',
      refContact: 'friend@email.com',
      occupants: 3, // Too many for application
      pets: [
        { type: 'dog', breed: 'Great Dane', weight: 120, name: 'Huge' },
        { type: 'cat', breed: 'Maine Coon', weight: 15, name: 'Large Cat' }
      ],
      vehicles: [{ make: 'Broken', model: 'Car', year: 1995, license: 'BROKEN1' }],
      wasEvicted: true,
      felony: false,
      desiredMoveIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      consentBackground: true,
      signature: 'Test Rejected',
      signedAt: new Date(),
      status: 'DECLINED'
    }
  }));

  console.log('✅ Created comprehensive applications');

  // Create payment records with various statuses
  const payments = [];
  
  // Paid payments (historical)
  for (let i = 1; i <= 3; i++) {
    const paymentDate = new Date(2024, i - 1, 1); // Jan, Feb, Mar 2024
    const paidDate = new Date(2024, i - 1, 28); // Paid late in previous month
    
    payments.push(await prisma.payment.create({
      data: {
        amount: 2000,
        dueDate: paymentDate,
        paidDate: paidDate,
        status: 'PAID',
        type: 'RENT',
        description: `${new Date(2024, i - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Rent Payment`,
        leaseId: activeLease.id,
        tenantId: tenant2.id,
      }
    }));
  }

  // Current month - pending payment
  payments.push(await prisma.payment.create({
    data: {
      amount: 2000,
      dueDate: new Date(2024, 8, 1), // September 2024
      status: 'PENDING',
      type: 'RENT',
      description: 'September 2024 Rent Payment',
      leaseId: activeLease.id,
      tenantId: tenant2.id,
    }
  }));

  // Overdue payment
  payments.push(await prisma.payment.create({
    data: {
      amount: 2000,
      dueDate: new Date(2024, 7, 1), // August 2024 (overdue)
      status: 'OVERDUE',
      type: 'RENT',
      description: 'August 2024 Rent Payment - OVERDUE',
      lateFee: 75,
      leaseId: activeLease.id,
      tenantId: tenant2.id,
    }
  }));

  console.log('✅ Created payment records with various statuses');

  // Create maintenance tickets with different priorities and statuses
  const tickets = [];

  // High priority - open
  tickets.push(await prisma.maintenanceTicket.create({
    data: {
      title: 'Water Heater Not Working',
      description: 'Hot water heater completely stopped working. Tenant has no hot water for showers or dishes. Needs immediate attention.',
      priority: 'HIGH',
      status: 'OPEN',
      category: 'Plumbing',
      estimatedCost: 800,
      propertyId: property2.id,
      tenantId: tenant2.id,
    }
  }));

  // Medium priority - in progress
  tickets.push(await prisma.maintenanceTicket.create({
    data: {
      title: 'Kitchen Faucet Dripping',
      description: 'Kitchen faucet has been dripping for a week. Water waste and annoying sound. Probably needs new washers.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      category: 'Plumbing',
      estimatedCost: 150,
      actualCost: 125,
      assignedTo: 'Reliable Plumbing Co.',
      propertyId: property2.id,
      tenantId: tenant2.id
    }
  }));

  // Low priority - resolved
  tickets.push(await prisma.maintenanceTicket.create({
    data: {
      title: 'Light Bulb Replacement',
      description: 'Hallway light bulb burned out. Standard LED replacement needed.',
      priority: 'LOW',
      status: 'RESOLVED',
      category: 'Electrical',
      estimatedCost: 25,
      actualCost: 15,
      assignedTo: 'Property Maintenance Team',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      propertyId: property2.id,
      tenantId: tenant2.id
    }
  }));

  // Emergency ticket - urgent
  tickets.push(await prisma.maintenanceTicket.create({
    data: {
      title: 'Gas Leak Smell Detected',
      description: 'EMERGENCY: Strong gas smell in kitchen area. Tenant evacuated apartment. Gas company and emergency repair needed immediately.',
      priority: 'URGENT',
      status: 'OPEN',
      category: 'Gas/Emergency',
      estimatedCost: 1200,
      propertyId: property2.id,
      tenantId: tenant2.id
    }
  }));

  console.log('✅ Created maintenance tickets with various priorities');

  console.log('✅ Skipping reminders (table may not exist yet)');

  console.log('\n🎉 Comprehensive test data seeding completed!');
  console.log('\n👥 TEST USERS CREATED:');
  console.log('==========================================');
  console.log('🔑 ADMIN:           admin@manual-test.com           | TestPass123!');
  console.log('🏠 LANDLORD:        landlord@manual-test.com        | TestPass123!');
  console.log('👔 PROPERTY_MANAGER: manager@manual-test.com        | TestPass123!');
  console.log('🏡 TENANT 1:        tenant1@manual-test.com         | TestPass123!');
  console.log('🏡 TENANT 2:        tenant2@manual-test.com         | TestPass123! (has active lease)');
  console.log('🏡 TENANT 3:        tenant3@manual-test.com         | TestPass123! (approved application)');

  console.log('\n📊 TEST DATA SUMMARY:');
  console.log('==========================================');
  console.log(`📋 Properties: 4 (2 available, 1 occupied, 1 luxury)`);
  console.log(`📝 Applications: ${applications.length} (1 pending, 1 approved, 1 rejected)`);
  console.log(`📄 Leases: 1 active lease`);
  console.log(`💰 Payments: ${payments.length} (3 paid, 1 pending, 1 overdue)`);
  console.log(`🔧 Maintenance: ${tickets.length} (2 open, 1 in-progress, 1 resolved)`);
  console.log(`⏰ Reminders: Skipped (may be added later)`);

  console.log('\n🧪 TESTING SCENARIOS:');
  console.log('==========================================');
  console.log('1. Admin Dashboard - Login as admin to see system overview');
  console.log('2. Landlord Portal - Login as landlord to manage properties');
  console.log('3. Property Manager - Login as manager for property management tasks');
  console.log('4. Tenant Experience - Login as tenant1, tenant2, or tenant3 for different scenarios');
  console.log('5. Applications Flow - Test pending/approved/rejected applications');
  console.log('6. Payment Processing - Test various payment statuses and methods');
  console.log('7. Maintenance Requests - Test different priority levels and statuses');
  console.log('8. AI Features - Test all AI-powered features with sample data');
  console.log('9. Reminders System - Test automated notifications');
  console.log('10. Matching Profiles - Test tenant-property matching');

  console.log('\n📋 ENTITY IDs FOR API TESTING:');
  console.log('==========================================');
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Landlord ID: ${landlord.id}`);
  console.log(`Property Manager ID: ${propertyManager.id}`);
  console.log(`Tenant 1 ID: ${tenant1.id}`);
  console.log(`Tenant 2 ID: ${tenant2.id}`);
  console.log(`Tenant 3 ID: ${tenant3.id}`);
  console.log(`Studio Property ID: ${property1.id}`);
  console.log(`Family Apartment ID: ${property2.id} (occupied)`);
  console.log(`Luxury Penthouse ID: ${property3.id}`);
  console.log(`Budget Apartment ID: ${property4.id}`);
  console.log(`Active Lease ID: ${activeLease.id}`);

  return {
    users: { admin, landlord, propertyManager, tenant1, tenant2, tenant3 },
    properties: { property1, property2, property3, property4 },
    applications,
    lease: activeLease,
    payments,
    tickets
  };
}

main()
  .catch((e) => {
    console.error('❌ Comprehensive seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });