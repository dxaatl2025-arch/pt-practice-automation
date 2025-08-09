// server/src/config/database.js - Real MongoDB Atlas Configuration
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MongoDB URI not configured - using mock data mode');
      return;
    }

    // Skip local MongoDB URIs
    if (process.env.MONGODB_URI.includes('localhost')) {
      console.log('⚠️  Local MongoDB detected - skipping connection');
      return;
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Seed database with sample data
    await seedDatabase();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Continuing with mock data mode...');
  }
};

// Seed database with PropertyPulse sample data
const seedDatabase = async () => {
  try {
    const User = require('../models/User');
    const Property = require('../models/Property');

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('📊 Database already seeded with existing data');
      return;
    }

    console.log('🌱 Seeding PropertyPulse database with sample data...');

    // Create sample landlord
    const sampleLandlord = new User({
      firebaseUid: 'sample-landlord-123',
      email: 'john.smith@propertypulse.com',
      firstName: 'John',
      lastName: 'Smith',
      role: 'landlord',
      phone: '+1-404-555-0123',
      address: {
        street: '123 PropertyPulse Ave',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30309',
        country: 'US'
      },
      isActive: true,
      emailVerified: true
    });
    await sampleLandlord.save();

    // Create sample tenant users
    const tenant1 = new User({
      firebaseUid: 'sample-tenant-456',
      email: 'sarah.johnson@email.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'tenant',
      phone: '+1-404-555-0124',
      isActive: true,
      emailVerified: true
    });
    await tenant1.save();

    const tenant2 = new User({
      firebaseUid: 'sample-tenant-789',
      email: 'mike.chen@email.com',
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'tenant',
      phone: '+1-404-555-0125',
      isActive: true,
      emailVerified: true
    });
    await tenant2.save();

    // Create AI-optimized sample properties
    const sampleProperties = [
      {
        landlord: sampleLandlord._id,
        title: 'Luxury Downtown Apartment',
        description: 'Beautiful 2-bedroom apartment in the heart of downtown Atlanta with stunning city views, premium amenities, and smart home features. Perfect for professionals.',
        address: {
          street: '100 Peachtree St NE',
          city: 'Atlanta',
          state: 'GA',
          zipCode: '30309',
          country: 'US'
        },
        propertyType: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        rent: { amount: 2500, currency: 'USD', period: 'monthly' },
        deposit: 2500,
        amenities: ['Pool', 'Gym', 'Parking', 'Balcony', 'In-unit Laundry', 'Smart Home', 'Concierge'],
        status: 'active',
        availability: { 
          isAvailable: false, 
          availableFrom: new Date('2024-03-01'),
          availableTo: new Date('2025-02-28')
        },
        utilities: {
          included: ['Water', 'Trash', 'Internet'],
          excluded: ['Electricity', 'Gas']
        },
        petPolicy: {
          allowed: true,
          deposit: 500,
          restrictions: ['Under 50lbs', 'No aggressive breeds']
        }
      },
      {
        landlord: sampleLandlord._id,
        title: 'Cozy Midtown Studio',
        description: 'Perfect studio apartment for young professionals. Walking distance to MARTA, trendy restaurants, and shopping. Modern amenities included.',
        address: {
          street: '200 14th St NE',
          city: 'Atlanta',
          state: 'GA',
          zipCode: '30309',
          country: 'US'
        },
        propertyType: 'studio',
        bedrooms: 0,
        bathrooms: 1,
        squareFeet: 650,
        rent: { amount: 1800, currency: 'USD', period: 'monthly' },
        deposit: 1800,
        amenities: ['Gym', 'Rooftop Deck', 'Concierge', 'Package Service'],
        status: 'active',
        availability: { 
          isAvailable: false,
          availableFrom: new Date('2024-02-15'),
          availableTo: new Date('2025-01-15')
        },
        utilities: {
          included: ['Water', 'Trash', 'Internet', 'Electricity'],
          excluded: ['Gas']
        },
        petPolicy: {
          allowed: false,
          deposit: 0,
          restrictions: []
        }
      },
      {
        landlord: sampleLandlord._id,
        title: 'Spacious Buckhead House',
        description: 'Prestigious 4-bedroom house in exclusive Buckhead neighborhood. Perfect for families with top-rated schools nearby. Luxury finishes throughout.',
        address: {
          street: '500 W Paces Ferry Rd',
          city: 'Atlanta',
          state: 'GA',
          zipCode: '30327',
          country: 'US'
        },
        propertyType: 'house',
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2800,
        rent: { amount: 4500, currency: 'USD', period: 'monthly' },
        deposit: 4500,
        amenities: ['Garage', 'Yard', 'Fireplace', 'Hardwood Floors', 'Updated Kitchen'],
        status: 'active',
        availability: { 
          isAvailable: true,
          availableFrom: new Date('2024-03-01')
        },
        utilities: {
          included: ['Water', 'Trash'],
          excluded: ['Electricity', 'Gas', 'Internet']
        },
        petPolicy: {
          allowed: true,
          deposit: 750,
          restrictions: ['Under 75lbs', 'Maximum 2 pets']
        }
      }
    ];

    await Property.insertMany(sampleProperties);
    
    console.log('🎉 PropertyPulse database successfully seeded!');
    console.log(`📊 Created ${sampleProperties.length} properties for landlord: ${sampleLandlord.email}`);
    console.log(`👥 Created ${await User.countDocuments()} users total`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
  }
};

module.exports = connectDB;