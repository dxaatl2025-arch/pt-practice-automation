const winston = require('winston');

// Create logger with structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'propertypulse-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Optional Sentry integration
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    }
  });

  // Add Sentry transport to winston - use valid winston transport pattern
  const SentryTransport = class extends winston.Transport {
    log(info, callback) {
      if (info.level === 'error') {
        Sentry.captureException(info.error || new Error(info.message), {
          tags: {
            component: info.component || 'unknown',
            userId: info.userId
          },
          extra: info.meta
        });
      }
      callback();
    }
  };

  logger.add(new SentryTransport({ level: 'error' }));
  console.log('✅ Sentry initialized');
} else {
  console.log('⚠️ Sentry not configured (SENTRY_DSN missing)');
}

module.exports = logger;