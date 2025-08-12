// server/src/repositories/factory.js - FINAL FIXED VERSION
const prisma = require('../db/prisma');

// Import all available repositories
const MongoUserRepository = require('./mongo/UserRepository');
const MongoPropertyRepository = require('./mongo/PropertyRepository');
const PrismaUserRepository = require('./prisma/UserRepository');
const PrismaPropertyRepository = require('./prisma/PropertyRepository');

class RepositoryFactory {
  constructor() {
    this.dbTarget = process.env.DB_TARGET || 'mongo';
    this.repositories = {};
    this.modelsLoaded = false;
    console.log(`🔧 Repository Factory initialized with DB_TARGET: ${this.dbTarget}`);
  }

  _loadMongooseModels() {
    if (!this.modelsLoaded) {
      try {
        // Load User model (consistent casing)
        try {
          this.User = require('../models/User');
        } catch (e) {
          console.warn('⚠️  User model not found');
        }

        // Load Property model (already working)
        this.Property = require('../models/Property');

        // Try to load other models
        try {
          this.Lease = require('../models/Lease');
        } catch (e) {
          console.warn('⚠️  Lease model not found');
        }

        try {
          this.Payment = require('../models/Payment');
        } catch (e) {
          console.warn('⚠️  Payment model not found');
        }

        try {
          this.MaintenanceTicket = require('../models/MaintenanceTicket');
        } catch (e) {
          try {
            this.MaintenanceTicket = require('../models/Ticket');
          } catch (e2) {
            console.warn('⚠️  MaintenanceTicket/Ticket model not found');
          }
        }

        this.modelsLoaded = true;
        console.log('✅ Loaded available MongoDB models');
      } catch (error) {
        console.warn('⚠️  Some MongoDB models not found:', error.message);
      }
    }
  }

  getUserRepository() {
    // Always check current DB_TARGET, don't rely on cached instance target
    const currentTarget = process.env.DB_TARGET || 'mongo';
    const cacheKey = `user_${currentTarget}`;
    
    // Clear cache if target changed
    if (this.dbTarget !== currentTarget) {
      this.dbTarget = currentTarget;
      this.repositories = {};
      this.modelsLoaded = false;
    }
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        this.repositories[cacheKey] = new PrismaUserRepository(prisma);
      } else {
        this._loadMongooseModels();
        if (this.User) {
          this.repositories[cacheKey] = new MongoUserRepository(this.User);
        } else {
          throw new Error('User model not found - please ensure User model exists');
        }
      }
    }
    return this.repositories[cacheKey];
  }

  getPropertyRepository() {
    // Always check current DB_TARGET, don't rely on cached instance target
    const currentTarget = process.env.DB_TARGET || 'mongo';
    const cacheKey = `property_${currentTarget}`;
    
    // Clear cache if target changed
    if (this.dbTarget !== currentTarget) {
      this.dbTarget = currentTarget;
      this.repositories = {};
      this.modelsLoaded = false;
    }
    
    if (!this.repositories[cacheKey]) {
      if (currentTarget === 'prisma') {
        this.repositories[cacheKey] = new PrismaPropertyRepository(prisma);
      } else {
        this._loadMongooseModels();
        this.repositories[cacheKey] = new MongoPropertyRepository(this.Property);
      }
    }
    return this.repositories[cacheKey];
  }

  // Placeholder methods for repositories not yet implemented
 
 getPaymentRepository() {
  const currentTarget = process.env.DB_TARGET || 'mongo';
  const cacheKey = `payment_${currentTarget}`;
  
  if (this.dbTarget !== currentTarget) {
    this.dbTarget = currentTarget;
    this.repositories = {};
    this.modelsLoaded = false;
  }
  
  if (!this.repositories[cacheKey]) {
    if (currentTarget === 'prisma') {
      const PrismaPaymentRepository = require('./prisma/PaymentRepository');
      this.repositories[cacheKey] = new PrismaPaymentRepository(prisma);
    } else {
      this._loadMongooseModels();
      if (this.Payment) {
        const MongoPaymentRepository = require('./mongo/PaymentRepository');
        this.repositories[cacheKey] = new MongoPaymentRepository(this.Payment);
      } else {
        throw new Error('Payment model not found - please ensure Payment model exists');
      }
    }
  }
  return this.repositories[cacheKey];
}
 getTicketRepository() {
  const currentTarget = process.env.DB_TARGET || 'mongo';
  const cacheKey = `ticket_${currentTarget}`;
  
  if (this.dbTarget !== currentTarget) {
    this.dbTarget = currentTarget;
    this.repositories = {};
    this.modelsLoaded = false;
  }
  
  if (!this.repositories[cacheKey]) {
    if (currentTarget === 'prisma') {
      const PrismaTicketRepository = require('./prisma/TicketRepository');
      this.repositories[cacheKey] = new PrismaTicketRepository(prisma);
    } else {
      this._loadMongooseModels();
      if (this.MaintenanceTicket) {
        const MongoTicketRepository = require('./mongo/TicketRepository');
        this.repositories[cacheKey] = new MongoTicketRepository(this.MaintenanceTicket);
      } else {
        console.warn('⚠️  MaintenanceTicket model not found - TicketRepository not available');
        this.repositories[cacheKey] = {
          create: () => { throw new Error('MaintenanceTicket model not implemented yet'); },
          findById: () => { throw new Error('MaintenanceTicket model not implemented yet'); },
          list: () => { throw new Error('MaintenanceTicket model not implemented yet'); },
          update: () => { throw new Error('MaintenanceTicket model not implemented yet'); },
          delete: () => { throw new Error('MaintenanceTicket model not implemented yet'); }
        };
      }
    }
  }
  return this.repositories[cacheKey];
}

  // Get all available repositories
 getAvailableRepositories() {
  return {
    userRepo: this.getUserRepository(),
    propertyRepo: this.getPropertyRepository(),
    leaseRepo: this.getLeaseRepository(),
    paymentRepo: this.getPaymentRepository(),
    ticketRepo: this.getTicketRepository()
  };
}
getLeaseRepository() {
  const currentTarget = process.env.DB_TARGET || 'mongo';
  const cacheKey = `lease_${currentTarget}`;
  
  if (this.dbTarget !== currentTarget) {
    this.dbTarget = currentTarget;
    this.repositories = {};
    this.modelsLoaded = false;
  }
  
  if (!this.repositories[cacheKey]) {
    if (currentTarget === 'prisma') {
      const PrismaLeaseRepository = require('./prisma/LeaseRepository');
      this.repositories[cacheKey] = new PrismaLeaseRepository(prisma);
    } else {
      this._loadMongooseModels();
      if (this.Lease) {
        const MongoLeaseRepository = require('./mongo/LeaseRepository');
        this.repositories[cacheKey] = new MongoLeaseRepository(this.Lease);
      } else {
        // Return a placeholder that throws helpful errors
        console.warn('⚠️  Lease model not found - LeaseRepository not available');
        this.repositories[cacheKey] = {
          create: () => { throw new Error('Lease model not implemented yet'); },
          findById: () => { throw new Error('Lease model not implemented yet'); },
          list: () => { throw new Error('Lease model not implemented yet'); },
          update: () => { throw new Error('Lease model not implemented yet'); },
          delete: () => { throw new Error('Lease model not implemented yet'); }
        };
      }
    }
  }
  return this.repositories[cacheKey];
}
  // Switch database target
  switchDatabase(target) {
    if (target !== 'mongo' && target !== 'prisma') {
      throw new Error('Invalid DB_TARGET. Must be "mongo" or "prisma"');
    }
    
    this.dbTarget = target;
    this.repositories = {}; // Clear ALL cached repositories
    this.modelsLoaded = false; // Reset model loading state
    process.env.DB_TARGET = target; // Update environment variable
    console.log(`🔄 Switched to database target: ${target}`);
  }

  // Health check
  async healthCheck() {
    try {
      if (this.dbTarget === 'prisma') {
        await prisma.$queryRaw`SELECT 1 as health`;
        return { status: 'healthy', database: 'postgresql', target: 'prisma' };
      } else {
        return { status: 'healthy', database: 'mongodb', target: 'mongo' };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: this.dbTarget === 'prisma' ? 'postgresql' : 'mongodb',
        target: this.dbTarget,
        error: error.message 
      };
    }
  }
}

// Export singleton instance
const repositoryFactory = new RepositoryFactory();
module.exports = repositoryFactory;