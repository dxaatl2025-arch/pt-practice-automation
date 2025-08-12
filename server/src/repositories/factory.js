// server/src/repositories/factory.js - CLEAN WORKING VERSION
const prisma = require('../db/prisma');

// Import all available repositories
const MongoUserRepository = require('./mongo/UserRepository');
const MongoPropertyRepository = require('./mongo/PropertyRepository');
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
        this.modelsLoaded = true;
        console.log('✅ Loaded available MongoDB models');
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

  // Add these methods before getLeaseRepository() method:

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
  getLeaseRepository() {
    return { list: () => ({ data: [], pagination: { page: 1, totalPages: 0, total: 0, limit: 10 } }) };
  }

  getPaymentRepository() {
    return { list: () => ({ data: [], pagination: { page: 1, totalPages: 0, total: 0, limit: 10 } }) };
  }
}

// Export singleton instance
const repositoryFactory = new RepositoryFactory();
module.exports = repositoryFactory;