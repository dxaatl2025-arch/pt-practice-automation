// Load environment variables
require('dotenv').config();

// ===================================
// CANARY DEPLOYMENT CONFIGURATION
// ===================================

// Windows Debug - add this right after dotenv config:
console.log('🪟 Windows Environment Debug:');
console.log('- Working Directory:', process.cwd());
console.log('- __dirname:', __dirname);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_TARGET:', process.env.DB_TARGET);
console.log('- APPLICATIONS_E2E:', process.env.APPLICATIONS_E2E);
console.log('- .env file should be at:', require('path').join(process.cwd(), '.env'));

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
console.log('- .env file exists:', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  console.log('- .env file size:', fs.statSync(envPath).size, 'bytes');
}

const { 
  enhancedRateLimits, 
  corsOptions, 
  helmetConfig, 
  sanitizeInput,
  securityHeaders,
  securityLogger,
  validateRequestSize,
  validateDatabaseTarget
} = require('./src/middleware/security');

const canaryConfig = {
  mode: process.env.CANARY_MODE === 'enabled',
  primaryDb: 'prisma', // Force Prisma only
  fallbackEnabled: false, // No MongoDB fallback
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000
};

console.log('🎯 Canary Configuration:', canaryConfig);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

console.log('🗄️ Database Target: prisma (PostgreSQL)');
console.log('🎪 Canary Mode:', canaryConfig.mode ? 'ENABLED' : 'DISABLED');
console.log('🐘 PostgreSQL URL:', process.env.DATABASE_URL ? 'Configured' : 'Missing');

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const propertyRoutes = require('./src/routes/properties');
const leaseRoutes = require('./src/routes/leases');
const paymentRoutes = require('./src/routes/payments');
const tenantRoutes = require('./src/routes/tenants');
const landlordRoutes = require('./src/routes/landlords');
const maintenanceRoutes = require('./src/routes/maintenance');
const userRoutes = require('./src/routes/users');
const rentalApplicationRoutes = require('./src/routes/rentalApplications');
const healthRoutes = require('./src/routes/health');
const paymentIntegrationRoutes = require('./src/routes/paymentIntegration');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { limiter } = require('./src/middleware/rateLimiter');

// CREATE EXPRESS APP
const app = express();

// Connect to database
//connectDB();
async function initializeDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection established (Prisma/PostgreSQL)');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

initializeDatabase();

// MIDDLEWARE SETUP (must come BEFORE routes)
app.use(require('helmet')(helmetConfig));
app.use(compression());
app.set('trust proxy', 1);
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Stripe webhook endpoint (raw body required)
if (process.env.STRIPE_CORE?.trim() === 'true') {
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const { stripe } = require('./src/config/stripe');
      const PaymentsService = require('./src/modules/payments/service/paymentsService');
      
      if (!stripe) {
        return res.status(500).send('Stripe not configured');
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        console.error('❌ Stripe webhook secret not configured');
        return res.status(500).send('Webhook secret not configured');
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const paymentsService = new PaymentsService();
      await paymentsService.handleStripeWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Stripe webhook error:', error);
      res.status(500).send('Webhook handler failed');
    }
  });
  console.log('✅ Stripe webhook endpoint registered');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Canary deployment middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  
  // Only expose database info in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Database-Target', 'prisma');
    res.setHeader('X-Database-Type', 'postgresql');
    res.setHeader('X-Canary-Mode', canaryConfig.mode ? 'enabled' : 'disabled');
  }
  
  next();
});

// Response time logging
app.use((req, res, next) => {
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
    }
  });
  next();
});

// Rate limiting
app.use('/api/auth', enhancedRateLimits.auth);
app.use('/api/payment-integration', enhancedRateLimits.payment);
app.use('/api/ai', enhancedRateLimits.ai);
app.use('/api/', enhancedRateLimits.api);
app.use('/api/admin', require('./src/routes/admin'));
// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({
    message: 'PropertyPulse API Server',
    version: process.env.npm_package_version || '2.0.0',
    canary: canaryConfig,
    database: {
      target: 'prisma',  // ← PRISMA ONLY
      type: 'postgresql',
      status: 'production-ready'
    },
    timestamp: new Date().toISOString()
  });
});

// TEST ROUTES (NO AUTH) - Add before protected routes
app.use('/test-profiles', require('./src/routes/test-profiles'));

// API ROUTES (must come AFTER middleware)
app.use('/api/applications', require('./src/routes/rentalApplications'));
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
app.use('/api/payment-integration', paymentIntegrationRoutes);
// Applications routes (feature-flagged)
if (String(process.env.APPLICATIONS_E2E).trim() === 'true') {
  app.use('/api', require('./src/modules/applications/routes/applicationsRoutes'));
  console.log('🧩 Applications routes mounted (APPLICATIONS_E2E=true)');
} else {
  console.log('🚫 Applications routes NOT mounted (APPLICATIONS_E2E=false)');
}

// Payments routes (feature-flagged)
if (process.env.STRIPE_CORE?.trim() === 'true') {
  console.log('💳 Loading payments routes...');
  app.use('/api', require('./src/modules/payments/routes/paymentsRoutes'));
  console.log('✅ Payments routes loaded');
  console.log('📝 Payment endpoints available:');
  console.log('   POST /api/payments/intent (tenant)');
  console.log('   POST /api/payments/manual (landlord)');
  console.log('   GET  /api/payments/:id (tenant/landlord)');
  console.log('   POST /api/webhooks/stripe (public webhook)');
} else {
  console.log('⚠️ Payments module disabled - STRIPE_CORE is not "true"');
}

// S3 Uploads routes (feature-flagged)
if (process.env.S3_UPLOADS?.trim() === 'true') {
  console.log('📁 Loading S3 uploads routes...');
  app.use('/api', require('./src/modules/uploads/routes/uploadsRoutes'));
  console.log('✅ S3 uploads routes loaded');
  console.log('📝 Upload endpoints available:');
  console.log('   POST /api/uploads/signed-url (authenticated)');
} else {
  console.log('⚠️ S3 uploads module disabled - S3_UPLOADS is not "true"');
}

// Matching profiles routes (feature-flagged)
if (process.env.MATCHING_PROFILES === 'true') {
  console.log('🎯 Loading matching profile routes...');
  
  app.use('/api/profiles', require('./src/routes/profiles'));
  app.use('/api/feedback', require('./src/routes/feedback'));
  
  console.log('✅ Matching profile routes loaded');
}

// ===================================
// BUSINESS MODULES (NEW)
// ===================================

// Owner Portal Features (Feature Flag)
if (process.env.OWNER_PORTAL === 'true') {
  app.use('/api/owners', require('./src/modules/owners/routes/ownersRoutes'));
  console.log('✅ Owner portal routes loaded');
  console.log('🏢 Owner endpoints available:');
  console.log('   GET    /api/owners/:ownerId/portfolio');
  console.log('   POST   /api/owners/:ownerId/reports');
  console.log('   GET    /api/owners/:ownerId/reports/:reportId/download');
} else {
  console.log('⏭️  Owner portal disabled (OWNER_PORTAL=false)');
}

// Accounting Features (Feature Flag)
if (process.env.ACCOUNTING === 'true') {
  app.use('/api/accounting', require('./src/modules/accounting/routes/accountingRoutes'));
  console.log('✅ Accounting routes loaded');
  console.log('📊 Accounting endpoints available:');
  console.log('   GET    /api/accounting/chart-of-accounts');
  console.log('   POST   /api/accounting/chart-of-accounts');
  console.log('   GET    /api/accounting/journal-entries');
  console.log('   POST   /api/accounting/journal-entries');
  console.log('   GET    /api/accounting/trial-balance');
} else {
  console.log('⏭️  Accounting disabled (ACCOUNTING=false)');
}

// Affiliate Portal Features (Feature Flag)
if (process.env.AFFILIATE_PORTAL === 'true') {
  app.use('/api/affiliates', require('./src/modules/affiliates/routes/affiliatesRoutes'));
  console.log('✅ Affiliate portal routes loaded');
  console.log('🤝 Affiliate endpoints available:');
  console.log('   POST   /api/affiliates/signup');
  console.log('   GET    /api/affiliates/dashboard');
  console.log('   POST   /api/affiliates/links');
} else {
  console.log('⏭️  Affiliate portal disabled (AFFILIATE_PORTAL=false)');
}

// Pricing & Subscriptions Features (Feature Flag)
if (process.env.PRICING === 'true') {
  app.use('/api/pricing', require('./src/modules/pricing/routes/pricingRoutes'));
  console.log('✅ Pricing routes loaded');
  console.log('💳 Pricing endpoints available:');
  console.log('   GET    /api/pricing/plans');
  console.log('   GET    /api/pricing/subscription');
  console.log('   POST   /api/pricing/subscribe');
  console.log('   POST   /api/pricing/checkout');
  console.log('   POST   /api/pricing/cancel');
} else {
  console.log('⏭️  Pricing disabled (PRICING=false)');
}

// ===================================
// APPLICATIONS MODULE (NEW)
// ===================================
console.log('🔍 Debug: APPLICATIONS_E2E =', process.env.APPLICATIONS_E2E);
console.log('🔍 Debug: Raw value:', JSON.stringify(process.env.APPLICATIONS_E2E));
console.log('🔍 Debug: Checking applications module...');

if (process.env.APPLICATIONS_E2E?.trim() === 'true') {
  console.log('🔍 Debug: Feature flag is TRUE, attempting to load applications module...');
  try {
    console.log('🔍 Debug: Loading applications routes file...');
    const applicationsRoutes = require('./src/modules/applications/routes/applicationsRoutes');
    console.log('🔍 Debug: Applications routes loaded, registering with Express...');
    
    // Register the applications routes
    app.use('/api', applicationsRoutes);
    
    console.log('✅ Applications module enabled successfully');
    console.log('📝 Applications endpoints available:');
    console.log('   POST /api/applications (public)');
    console.log('   GET  /api/applications (landlord)');
    console.log('   GET  /api/applications/:id (landlord)');
    console.log('   PATCH /api/applications/:id/status (landlord)');
    console.log('   GET  /api/applications/:id/pdf (landlord)');
    
  } catch (error) {
    console.log('❌ Applications module failed to load:', error.message);
    console.log('❌ Full error stack:', error.stack);
  }
} else {
  console.log('⚠️ Applications module disabled - APPLICATIONS_E2E is not "true"');
  console.log('⚠️ Current value after trim:', JSON.stringify(process.env.APPLICATIONS_E2E?.trim()));
}

// ===================================
// TEST ROUTES FOR DEBUGGING
// ===================================
app.get('/test-applications', (req, res) => {
  res.json({
    success: true,
    message: 'Applications controller test endpoint working',
    controller: 'working',
    timestamp: new Date().toISOString()
  });
});

app.post('/test-applications', (req, res) => {
  try {
    const applicationsController = require('./src/modules/applications/controller/applicationsController');
    res.json({
      success: true,
      message: 'Applications controller loaded successfully',
      controller: typeof applicationsController,
      methods: Object.getOwnPropertyNames(applicationsController).filter(name => typeof applicationsController[name] === 'function')
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Failed to load applications controller',
      error: error.message
    });
  }
});

// Route debugging endpoint
app.get('/debug-routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router' && middleware.regexp) {
      const baseRoute = middleware.regexp.source.replace(/\\\//g, '/').replace(/\$.*/, '');
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: baseRoute + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    message: 'Registered routes',
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// ===================================
// ERROR HANDLERS
// ===================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// ===================================
// SERVER STARTUP
// ===================================
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
🧪 Debug Routes: http://localhost:${PORT}/debug-routes
  `);
  
  try {
    const emailService = require('./src/services/emailService');
    emailService.testConnection();
  } catch (error) {
    console.log('Email service not yet configured');
  }

  // Start reminders worker if enabled
  if (process.env.REMINDERS?.trim() === 'true') {
    try {
      const { startRemindersWorker } = require('./src/modules/reminders/worker');
      startRemindersWorker();
      console.log('🔔 Reminders worker started');
    } catch (error) {
      console.error('❌ Failed to start reminders worker:', error);
    }
  } else {
    console.log('⚠️ Reminders worker disabled - REMINDERS is not "true"');
  }
});

module.exports = app;