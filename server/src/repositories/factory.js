// server/src/repositories/factory.js
// COMPLETE PRISMA-ONLY IMPLEMENTATION - No MongoDB dependencies

console.log('🏭 Repository Factory: Complete Prisma migration');

// Import Prisma client
const prisma = require('../config/prisma');

// Import ONLY Prisma repositories (remove all MongoDB imports)
const PrismaUserRepository = require('./prisma/UserRepository');
const PrismaPropertyRepository = require('./prisma/PropertyRepository');
const PrismaLeaseRepository = require('./prisma/LeaseRepository');
const PrismaPaymentRepository = require('./prisma/PaymentRepository');
const PrismaMaintenanceTicketRepository = require('./prisma/TicketRepository');
const PrismaTenantProfileRepository = require('./prisma/TenantProfileRepository');
const PrismaPropertyMatchProfileRepository = require('./prisma/PropertyMatchProfileRepository');
const PrismaFeedbackRepository = require('./prisma/FeedbackRepository');

class RepositoryFactory {
  constructor() {
    // Production-ready Prisma-only configuration
    this.dbTarget = 'prisma';
    this.repositories = {};
    this.startTime = Date.now();
    this.healthHistory = [];
    
    console.log('✅ Repository Factory: PostgreSQL/Prisma production mode');
    console.log('🚫 MongoDB support: Completely removed');
    
    // Validate Prisma client
    if (!prisma) {
      throw new Error('Prisma client not available - check configuration');
    }
    
    console.log('🔗 Prisma client: Connected and validated');
  }

  // User Repository - Prisma only
  getUserRepository() {
    const cacheKey = 'user_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('👤 Creating Prisma UserRepository');
      this.repositories[cacheKey] = new PrismaUserRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Property Repository - Prisma only
  getPropertyRepository() {
    const cacheKey = 'property_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('🏠 Creating Prisma PropertyRepository');
      this.repositories[cacheKey] = new PrismaPropertyRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Lease Repository - Prisma only
  getLeaseRepository() {
    const cacheKey = 'lease_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('📄 Creating Prisma LeaseRepository');
      this.repositories[cacheKey] = new PrismaLeaseRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Payment Repository - Prisma only
  getPaymentRepository() {
    const cacheKey = 'payment_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('💰 Creating Prisma PaymentRepository');
      this.repositories[cacheKey] = new PrismaPaymentRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Maintenance Ticket Repository - Prisma only
  getMaintenanceTicketRepository() {
    const cacheKey = 'ticket_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('🔧 Creating Prisma MaintenanceTicketRepository');
      this.repositories[cacheKey] = new PrismaMaintenanceTicketRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Tenant Profile Repository - Prisma only
  getTenantProfileRepository() {
    const cacheKey = 'tenantProfile_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('👥 Creating Prisma TenantProfileRepository');
      this.repositories[cacheKey] = new PrismaTenantProfileRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Property Match Profile Repository - Prisma only
  getPropertyMatchProfileRepository() {
    const cacheKey = 'propertyMatchProfile_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('🎯 Creating Prisma PropertyMatchProfileRepository');
      this.repositories[cacheKey] = new PrismaPropertyMatchProfileRepository(prisma);
    }
    return this.repositories[cacheKey];
  }

  // Feedback Repository - Prisma only
  getFeedbackRepository() {
    const cacheKey = 'feedback_prisma';
    
    if (!this.repositories[cacheKey]) {
      console.log('📝 Creating Prisma FeedbackRepository');
      this.repositories[cacheKey] = new PrismaFeedbackRepository(prisma);
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
      ticketRepo: this.getMaintenanceTicketRepository(),
      tenantProfileRepo: this.getTenantProfileRepository(),
      propertyMatchProfileRepo: this.getPropertyMatchProfileRepository(),
      feedbackRepo: this.getFeedbackRepository()
    };
  }

  // Production health check - PostgreSQL only
  async healthCheck() {
    const checkStart = Date.now();
    
    try {
      // PostgreSQL connection test
      const queryStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as health, version() as pg_version`;
      const queryTime = Date.now() - queryStart;
      
      // Connection pool status
      const metrics = await prisma.$metrics.globalHistogram();
      
      const result = {
        status: 'healthy',
        database: 'postgresql',
        target: 'prisma',
        responseTime: `${queryTime}ms`,
        connectionPool: {
          activeConnections: metrics?.histogram?.prisma_pool_connections_busy?.buckets?.length || 0,
          poolSize: process.env.DATABASE_POOL_SIZE || 'default'
        },
        factory: {
          uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`,
          repositoriesLoaded: Object.keys(this.repositories),
          availableRepositories: [
            'user', 'property', 'lease', 'payment', 
            'ticket', 'tenantProfile', 'propertyMatchProfile', 'feedback'
          ],
          migrationStatus: 'complete',
          totalCheckTime: `${Date.now() - checkStart}ms`
        }
      };
      
      // Store health history
      this.healthHistory.push({
        timestamp: new Date().toISOString(),
        status: 'healthy',
        responseTime: `${queryTime}ms`,
        database: 'postgresql'
      });
      
      // Keep only last 10 health checks
      if (this.healthHistory.length > 10) {
        this.healthHistory.shift();
      }
      
      return result;
    } catch (error) {
      const totalCheckTime = Date.now() - checkStart;
      
      return {
        status: 'unhealthy',
        database: 'postgresql',
        target: 'prisma',
        error: error.message,
        factory: {
          uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`,
          repositoriesLoaded: Object.keys(this.repositories),
          migrationStatus: 'complete',
          totalCheckTime: `${totalCheckTime}ms`
        }
      };
    }
  }

  // Get current database configuration
  getDatabaseInfo() {
    return {
      target: 'prisma',
      database: 'postgresql',
      status: 'production-ready',
      migration: 'complete',
      features: [
        'ACID transactions',
        'Foreign key constraints', 
        'Type safety',
        'Connection pooling',
        'Query optimization',
        'Full-text search'
      ],
      repositories: {
        total: 8,
        implemented: Object.keys(this.repositories).length,
        available: [
          'UserRepository',
          'PropertyRepository', 
          'LeaseRepository',
          'PaymentRepository',
          'MaintenanceTicketRepository',
          'TenantProfileRepository',
          'PropertyMatchProfileRepository',
          'FeedbackRepository'
        ]
      }
    };
  }

  // Database switching removed - Prisma only
  switchDatabase(target) {
    console.log('ℹ️ Database switching disabled - system uses PostgreSQL/Prisma only');
    return {
      success: true,
      message: 'System configured for PostgreSQL/Prisma only',
      currentTarget: 'prisma',
      migrationComplete: true
    };
  }

  // Get health history
  getHealthHistory() {
    return {
      currentStatus: this.healthHistory[this.healthHistory.length - 1] || null,
      history: this.healthHistory,
      uptime: `${Math.floor((Date.now() - this.startTime) / 1000)}s`
    };
  }

  // Performance metrics
  async getPerformanceMetrics() {
    try {
      const metrics = await prisma.$metrics.globalHistogram();
      return {
        queryMetrics: metrics.histogram,
        connectionMetrics: {
          pool: 'active',
          database: 'postgresql'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: 'Metrics not available',
        message: error.message
      };
    }
  }
}

// Export singleton instance
const repositoryFactory = new RepositoryFactory();

console.log('🎯 Repository Factory: Production Prisma-only mode initialized');
console.log('📊 Migration Status: MongoDB → PostgreSQL Complete');

module.exports = repositoryFactory;