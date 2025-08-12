// server/src/routes/health.js - Health Monitoring for Windows
const express = require('express');
const router = express.Router();
const repositoryFactory = require('../repositories/factory');
const mongoose = require('mongoose');

// Simple health check cache (30 second TTL)
let healthCache = {
  data: null,
  timestamp: 0,
  ttl: 30000
};

class HealthService {
  constructor() {
    this.startTime = Date.now();
  }

  // Test MongoDB connection
  async checkMongoDB() {
    try {
      const start = Date.now();
      
      // Check connection state
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB connection not ready');
      }

      // Perform actual query
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        database: 'mongodb',
        responseTime: Date.now() - start,
        connectionState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'localhost',
        port: mongoose.connection.port || 27017
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'mongodb',
        error: error.message,
        connectionState: mongoose.connection.readyState
      };
    }
  }

  // Test PostgreSQL connection
  async checkPostgreSQL() {
    try {
      const start = Date.now();
      
      // Check if Prisma is available
      let prisma;
      try {
        prisma = require('../db/prisma');
      } catch (error) {
        throw new Error('Prisma client not available');
      }
      
      // Perform health query
      await prisma.$queryRaw`SELECT 1 as health`;
      
      return {
        status: 'healthy',
        database: 'postgresql',
        responseTime: Date.now() - start,
        client: 'prisma'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'postgresql',
        error: error.message,
        client: 'prisma'
      };
    }
  }

  // Test repository factory
  async checkRepositoryFactory() {
    try {
      const start = Date.now();
      
      // Test repository instantiation
      const userRepo = repositoryFactory.getUserRepository();
      const propertyRepo = repositoryFactory.getPropertyRepository();
      
      return {
        status: 'healthy',
        currentTarget: repositoryFactory.dbTarget,
        responseTime: Date.now() - start,
        repositories: {
          user: !!userRepo,
          property: !!propertyRepo
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        currentTarget: repositoryFactory.dbTarget,
        error: error.message
      };
    }
  }

  // System metrics
  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    
    return {
      uptime: uptime,
      uptimeHuman: this.formatDuration(uptime),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  // Format duration in human readable format
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Comprehensive health check
  async performHealthCheck() {
    const checkStart = Date.now();
    
    // Run all checks in parallel
    const [mongoHealth, postgresHealth, factoryHealth] = await Promise.all([
      this.checkMongoDB(),
      this.checkPostgreSQL(),
      this.checkRepositoryFactory()
    ]);

    // Determine overall health
    const allHealthy = [mongoHealth, postgresHealth, factoryHealth]
      .every(check => check.status === 'healthy');

    const canaryModeEnabled = process.env.CANARY_MODE === 'enabled';
    const primaryDbHealthy = repositoryFactory.dbTarget === 'prisma' 
      ? postgresHealth.status === 'healthy'
      : mongoHealth.status === 'healthy';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - checkStart,
      canary: {
        enabled: canaryModeEnabled,
        primaryDatabase: repositoryFactory.dbTarget,
        primaryHealthy: primaryDbHealthy,
        fallbackAvailable: process.env.ENABLE_MONGODB_FALLBACK === 'true'
      },
      databases: {
        mongodb: mongoHealth,
        postgresql: postgresHealth
      },
      services: {
        repositoryFactory: factoryHealth
      },
      system: this.getSystemMetrics(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        dbTarget: process.env.DB_TARGET,
        platform: 'windows'
      }
    };
  }
}

const healthService = new HealthService();

// @route   GET /health
// @desc    Quick health check (primary database only)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const health = await repositoryFactory.healthCheck();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      status: health.status,
      database: health.target,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /health/detailed
// @desc    Comprehensive health check (both databases + system metrics)
// @access  Public
router.get('/detailed', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (healthCache.data && (now - healthCache.timestamp) < healthCache.ttl) {
      return res.json(healthCache.data);
    }

    // Perform comprehensive health check
    const healthData = await healthService.performHealthCheck();
    
    // Update cache
    healthCache = {
      data: healthData,
      timestamp: now,
      ttl: 30000
    };

    // Set appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   POST /health/switch-database
// @desc    Switch database target (for canary management)
// @access  Public (should be restricted in production)
router.post('/switch-database', async (req, res) => {
  try {
    const { target } = req.body;
    
    if (!target || !['mongo', 'prisma'].includes(target)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target. Must be "mongo" or "prisma"'
      });
    }

    // Switch database
    repositoryFactory.switchDatabase(target);
    
    // Verify health of new target
    const health = await repositoryFactory.healthCheck();
    
    res.json({
      success: true,
      message: `Database switched to ${target}`,
      health: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /health/canary
// @desc    Canary deployment status
// @access  Public
router.get('/canary', (req, res) => {
  const canaryStatus = {
    enabled: process.env.CANARY_MODE === 'enabled',
    primaryDatabase: process.env.DB_TARGET || 'mongo',
    fallbackEnabled: process.env.ENABLE_MONGODB_FALLBACK === 'true',
    currentTarget: repositoryFactory.dbTarget,
    environment: process.env.NODE_ENV,
    platform: 'windows',
    timestamp: new Date().toISOString()
  };

  res.json(canaryStatus);
});

module.exports = router; 
