// Load environment variables

require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const userRoutes = require('./src/routes/users');

console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Missing');


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

// Rate limiting
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'PropertyPulse API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

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
app.use('/api/health', healthRoutes);
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
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📋 Rental Applications API available at http://localhost:${PORT}/api/rental-applications`);
  
  // Test email service
  try {
    const emailService = require('./src/services/emailService');
    emailService.testConnection();
  } catch (error) {
    console.log('Email service not yet configured');
  }
});

module.exports = app;