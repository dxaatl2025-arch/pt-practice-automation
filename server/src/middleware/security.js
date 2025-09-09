// src/middleware/security.js - Quick implementation for immediate use
const prisma = require('../config/prisma');
const rateLimit = require('express-rate-limit');

// Enhanced rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { 
    success: false, 
    status: 'error',
    message,
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path.startsWith('/health/'),
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

const enhancedRateLimits = {
  auth: createRateLimit(
    15 * 60 * 1000,
    parseInt(process.env.RATE_LIMIT_AUTH) || 10,
    'Too many authentication attempts, please try again later'
  ),
  api: createRateLimit(
    15 * 60 * 1000,
    parseInt(process.env.RATE_LIMIT_GENERAL) || 200,
    'Too many requests, please try again later'
  ),
  payment: createRateLimit(
    5 * 60 * 1000,
    20,
    'Too many payment requests, please slow down'
  ),
  ai: createRateLimit(
    60 * 1000,
    10,
    'Too many AI requests, please wait'
  )
};

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      process.env.CLIENT_URL,
      ...(process.env.SECURITY_CORS_ORIGINS || '').split(',').filter(Boolean)
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      callback(error);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-API-Key',
    'Accept',
    'Origin'
  ]
};

// Enhanced Helmet configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: [
        "'self'", 
        "https://api.stripe.com", 
        "https://*.googleapis.com",
        "https://*.amazonaws.com",
        "https://*.s3.amazonaws.com",
        process.env.S3_ENDPOINT || ""
      ].filter(Boolean),
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Security-Enhanced': 'true'
  });
  next();
};

module.exports = {
  enhancedRateLimits,
  corsOptions,
  helmetConfig,
  sanitizeInput,
  securityHeaders
};