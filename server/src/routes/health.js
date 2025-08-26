// server/src/routes/health.js - Health Monitoring for Windows
const express = require('express');
const router = express.Router();
const repositoryFactory = require('../repositories/factory');
const prisma = require('../config/prisma');

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

  
// Test PostgreSQL connection only (MongoDB removed)
async checkDatabase() {
  try {
    const start = Date.now();
    
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
  // Test application functionality
async checkApplication() {
  try {
    const start = Date.now();
    
    // Test basic database operations
    const userCount = await prisma.user.count();
    const propertyCount = await prisma.property.count();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      data: {
        users: userCount,
        properties: propertyCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
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
// Comprehensive health check
async performHealthCheck() {
  const checkStart = Date.now();
  
  // Run all checks in parallel
  const [databaseHealth, applicationHealth] = await Promise.all([
    this.checkDatabase(),
    this.checkApplication()
  ]);

  // Determine overall health
  const allHealthy = [databaseHealth, applicationHealth]
    .every(check => check.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - checkStart,
    database: databaseHealth,
    application: applicationHealth,
    system: this.getSystemMetrics(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      platform: 'postgresql-only'
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
    await prisma.$queryRaw`SELECT 1 as health`;
    
    res.status(200).json({
      status: 'healthy',
      database: 'postgresql',
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


// @route   GET /health/canary
// @desc    Canary deployment status
// @access  Public
router.get('/canary', (req, res) => {
  const status = {
    database: 'postgresql',
    environment: process.env.NODE_ENV,
    platform: 'postgresql-only',
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

module.exports = router; 
