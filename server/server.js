// Load environment variables

require('dotenv').config();

// ===================================
// CANARY DEPLOYMENT CONFIGURATION
// ===================================
const canaryConfig = {
  mode: process.env.CANARY_MODE === 'enabled',
  primaryDb: process.env.DB_TARGET || 'mongo',
  fallbackEnabled: process.env.ENABLE_MONGODB_FALLBACK === 'true',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
};

console.log('🎯 Canary Configuration:', canaryConfig);
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const userRoutes = require('./src/routes/users');

console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');
console.log('🗄️ Database Target:', process.env.DB_TARGET || 'mongo');
console.log('🎪 Canary Mode:', canaryConfig.mode ? 'ENABLED' : 'DISABLED');

// Import database connection
const connectDB = require('./src/config/database');




// Import routes (we'll create these next)
const authRoutes = require('./src/routes/auth');
const propertyRoutes = require('./src/routes/properties');
const leaseRoutes = require('./src/routes/leases');
const paymentRoutes = require('./src/routes/payments');
const tenantRoutes = require('./src/routes/tenants');
const landlordRoutes = require('./src/routes/landlords');
const maintenanceRoutes = require('./src/routes/maintenance');
const rentalApplicationRoutes = require('./src/routes/rentalApplications');
const healthRoutes = require('./src/routes/health');
// NEW: Import payment integration routes
const paymentIntegrationRoutes = require('./src/routes/paymentIntegration');

// ADD THIS DEBUG CODE HERE:
console.log('🔍 Checking route imports...');
console.log('authRoutes:', typeof authRoutes, authRoutes?.constructor?.name);
console.log('propertyRoutes:', typeof propertyRoutes, propertyRoutes?.constructor?.name);
console.log('leaseRoutes:', typeof leaseRoutes, leaseRoutes?.constructor?.name);
console.log('paymentRoutes:', typeof paymentRoutes, paymentRoutes?.constructor?.name);
console.log('tenantRoutes:', typeof tenantRoutes, tenantRoutes?.constructor?.name);
console.log('landlordRoutes:', typeof landlordRoutes, landlordRoutes?.constructor?.name);
console.log('maintenanceRoutes:', typeof maintenanceRoutes, maintenanceRoutes?.constructor?.name);
console.log('userRoutes:', typeof userRoutes, userRoutes?.constructor?.name);
console.log('rentalApplicationRoutes:', typeof rentalApplicationRoutes, rentalApplicationRoutes?.constructor?.name);
console.log('healthRoutes:', typeof healthRoutes, healthRoutes?.constructor?.name);
console.log('paymentIntegrationRoutes:', typeof paymentIntegrationRoutes, paymentIntegrationRoutes?.constructor?.name);


// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { limiter } = require('./src/middleware/rateLimiter');

const app = express();

// Root endpoint with canary info
app.get('/', (req, res) => {
  res.json({
    message: 'PropertyPulse API Server',
    version: process.env.npm_package_version || '2.0.0',
    canary: canaryConfig,
    database: {
      target: process.env.DB_TARGET || 'mongo',
      fallback: process.env.ENABLE_MONGODB_FALLBACK === 'true'
    },
    timestamp: new Date().toISOString()
  });
});
// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(compression());
app.set('trust proxy', 1);
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CLIENT_URL,
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));


app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Canary deployment middleware
app.use((req, res, next) => {
  // Add request timing
  req.startTime = Date.now();
  
  // Add canary headers
  res.setHeader('X-Database-Target', process.env.DB_TARGET || 'mongo');
  res.setHeader('X-Canary-Mode', canaryConfig.mode ? 'enabled' : 'disabled');
  
  next();
});

// Response time logging for slow requests
app.use((req, res, next) => {
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    if (responseTime > 1000) { // Log slow requests
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }
  });
  next();
});
// Rate limiting
app.use('/api/', limiter);

// Health check endpoint
//app.get('/api/health', (req, res) => {
 // res.redirect('/health');
//});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/landlords', landlordRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/rental-applications', rentalApplicationRoutes);
app.use('/health', healthRoutes);
// NEW: Payment integration routes
app.use('/api/payment-integration', paymentIntegrationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 PropertyPulse API Server Started
📍 Port: ${PORT}
🎯 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database Target: ${process.env.DB_TARGET || 'mongo'}
🏁 Canary Mode: ${canaryConfig.mode ? 'ENABLED' : 'DISABLED'}
🔄 Fallback: ${canaryConfig.fallbackEnabled ? 'ENABLED' : 'DISABLED'}
📊 Health Endpoint: http://localhost:${PORT}/health
🔍 Detailed Health: http://localhost:${PORT}/health/detailed
🎪 Canary Status: http://localhost:${PORT}/health/canary
📋 Rental Applications: http://localhost:${PORT}/api/rental-applications
  `);
  
  // Test email service
  try {
    const emailService = require('./src/services/emailService');
    emailService.testConnection();
  } catch (error) {
    console.log('Email service not yet configured');
  }
});

// ===================================
// PERIODIC HEALTH CHECKS
// ===================================
if (canaryConfig.mode && process.env.HEALTH_CHECK_BOTH_DBS === 'true') {
  const repositoryFactory = require('./src/repositories/factory');
  
  setInterval(async () => {
    try {
      const health = await repositoryFactory.healthCheck();
      if (health.status !== 'healthy') {
        console.warn('⚠️  Health check warning:', health);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }, canaryConfig.healthCheckInterval);
  
  console.log(`🔍 Periodic health checks enabled (${canaryConfig.healthCheckInterval}ms)`);
}
module.exports = app;