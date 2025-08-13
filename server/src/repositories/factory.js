// server/src/repositories/factory.js - UPDATED WITH ALL REPOSITORIES
const prisma = require('../db/prisma');

// Import all available repositories
const MongoUserRepository = require('./mongo/UserRepository');
const MongoPropertyRepository = require('./mongo/PropertyRepository');
const MongoLeaseRepository = require('./mongo/LeaseRepository');
const MongoPaymentRepository = require('./mongo/PaymentRepository');
const MongoMaintenanceTicketRepository = require('./mongo/MaintenanceTicketRepository');
const PrismaUserRepository = require('./prisma/UserRepository');
const PrismaPropertyRepository = require('./prisma/PropertyRepository');

class RepositoryFactory {
  constructor() {
    this.dbTarget = (process.env.DB_TARGET || 'mongo').trim();
    this.repositories = {};
    this.modelsLoaded = false;
    console.log(`🔧 Repository Factory initialized with DB_TARGET: ${this.dbTarget}`);
  }

  _loadMongooseModels() {
    if (!this.modelsLoaded) {
      try {
        this.User = require('../models/User');
        this.Property = require('../models/Property');
        this.Lease = require('../models/Lease');
        this.Payment = require('../models/Payment');
        this.MaintenanceTicket = require('../models/MaintenanceTicket');
        this.modelsLoaded = true;
        console.log('✅ Loaded all MongoDB models');
      } catch (error) {
        console.warn('⚠️  Some MongoDB models not found:', error.message);
      }
    }
  }

  getUserRepository() {
    const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
    const cacheKey = `user_${currentTarget}`;
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        console.log('🐘 Prisma UserRepository initialized');
        this.repositories[cacheKey] = new PrismaUserRepository(prisma);
      } else {
        console.log('🍃 MongoDB UserRepository initialized');
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoUserRepository(this.User);
      }
    }
    return this.repositories[cacheKey];
  }

  getPropertyRepository() {
    const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
    const cacheKey = `property_${currentTarget}`;
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        console.log('🐘 Prisma PropertyRepository initialized');
        this.repositories[cacheKey] = new PrismaPropertyRepository(prisma);
      } else {
        console.log('🍃 MongoDB PropertyRepository initialized');
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoPropertyRepository(this.Property);
      }
    }
    return this.repositories[cacheKey];
  }

  getLeaseRepository() {
    const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
    const cacheKey = `lease_${currentTarget}`;
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        throw new Error('Prisma LeaseRepository not implemented yet - MongoDB only for now');
      } else {
        console.log('🍃 MongoDB LeaseRepository initialized');
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoLeaseRepository(this.Lease);
      }
    }
    return this.repositories[cacheKey];
  }

  getPaymentRepository() {
    const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
    const cacheKey = `payment_${currentTarget}`;
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        throw new Error('Prisma PaymentRepository not implemented yet - MongoDB only for now');
      } else {
        console.log('🍃 MongoDB PaymentRepository initialized');
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoPaymentRepository(this.Payment);
      }
    }
    return this.repositories[cacheKey];
  }

  getMaintenanceTicketRepository() {
    const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
    const cacheKey = `ticket_${currentTarget}`;
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        throw new Error('Prisma MaintenanceTicketRepository not implemented yet - MongoDB only for now');
      } else {
        console.log('🍃 MongoDB MaintenanceTicketRepository initialized');
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoMaintenanceTicketRepository(this.MaintenanceTicket);
      }
    }
    return this.repositories[cacheKey];
  }

  // Health check method
  async healthCheck() {
    try {
      const currentTarget = (process.env.DB_TARGET || 'mongo').trim();
      
      if (currentTarget === 'prisma') {
        await prisma.$queryRaw`SELECT 1 as health`;
        return { status: 'healthy', database: 'postgresql', target: 'prisma' };
      } else {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
          throw new Error('MongoDB connection not ready');
        }
        await mongoose.connection.db.admin().ping();
        return { status: 'healthy', database: 'mongodb', target: 'mongo' };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: (process.env.DB_TARGET || 'mongo').trim() === 'prisma' ? 'postgresql' : 'mongodb',
        target: (process.env.DB_TARGET || 'mongo').trim(),
        error: error.message 
      };
    }
  }

  // Switch database target
  switchDatabase(target) {
    if (target !== 'mongo' && target !== 'prisma') {
      throw new Error('Invalid DB_TARGET. Must be "mongo" or "prisma"');
    }
    
    // Update environment variable
    process.env.DB_TARGET = target;
    this.dbTarget = target.trim();
    this.repositories = {}; // Clear cached repositories
    console.log(`🔄 Switched to database target: ${target}`);
    
    return { success: true, newTarget: target };
  }
}

// Export singleton instance
const repositoryFactory = new RepositoryFactory();
module.exports = repositoryFactory;