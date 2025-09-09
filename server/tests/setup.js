// Global test setup
const { PrismaClient } = require('@prisma/client');

// Mock external services for all tests
jest.mock('../src/utils/email');
jest.mock('../src/config/stripe');  
jest.mock('../src/config/s3');

jest.setTimeout(15000);

// Test database setup
let prisma;

beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/propertypulse_test';
  process.env.NODE_ENV = 'test';
  process.env.DB_TARGET = 'prisma';
  
  // Disable feature flags for controlled testing
  process.env.APPLICATIONS_E2E = 'false';
  process.env.STRIPE_CORE = 'false';
  process.env.S3_UPLOADS = 'false';
  process.env.REMINDERS = 'false';
  
  prisma = new PrismaClient();
  
  // Ensure database is connected
  try {
    await prisma.$connect();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Clear database between tests
beforeEach(async () => {
  if (process.env.CLEAR_DB_BETWEEN_TESTS !== 'false') {
    // Clear in dependency order (child to parent)
    try {
      await prisma.reminderSchedule.deleteMany();
    } catch (e) {
      // Table might not exist yet
    }
    try {
      await prisma.lead.deleteMany();
    } catch (e) {
      // Table might not exist yet  
    }
    await prisma.payment.deleteMany();
    await prisma.application.deleteMany();
    await prisma.lease.deleteMany();
    await prisma.maintenanceTicket.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
  }
});

// Make prisma available to tests
global.testPrisma = require('./utils/testPrisma').prisma;

// Test utilities
global.testUtils = {
  // Email mock utilities
  getEmailMock: () => require('../src/utils/email').__testUtils,
  
  // Stripe mock utilities
  getStripeMock: () => require('../src/config/stripe').__testUtils,
  
  // S3 mock utilities
  getS3Mock: () => require('../src/config/s3').__testUtils,
  
  // Test data generators
  generateUser: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User', 
    role: 'TENANT',
    ...overrides
  }),
  
  generateProperty: (landlordId, overrides = {}) => ({
    title: 'Test Property',
    bedrooms: 1,
    bathrooms: 1,
    rentAmount: 1000,
    addressStreet: '123 Test St',
    addressCity: 'Test City',
    addressState: 'CA',
    addressZip: '90210',
    landlordId,
    ...overrides
  }),
  
  generateApplication: (propertyId, overrides = {}) => ({
    propertyId,
    firstName: 'Test',
    lastName: 'Applicant',
    email: `applicant-${Date.now()}@example.com`,
    phone: '555-0123',
    dateOfBirth: new Date('1990-01-01'),
    currentAddress: '456 Current St',
    currentCity: 'Current City',
    currentState: 'CA',
    currentZip: '90211',
    yearsAtAddress: 2,
    employerName: 'Test Corp',
    jobTitle: 'Tester',
    employerAddress: '789 Work St',
    employerPhone: '555-WORK',
    employmentLength: '2 years',
    monthlyIncome: 4000,
    refName: 'Test Reference',
    refRelationship: 'Friend',
    refContact: 'ref@example.com',
    occupants: 1,
    desiredMoveIn: new Date('2024-04-01'),
    consentBackground: true,
    signature: 'Test Applicant',
    signedAt: new Date(),
    ...overrides
  }),
  
  // Date utilities
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  addHours: (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }
}; 

const path = require('path');
const fs = require('fs');

// Ensure NODE_ENV for tests
process.env.NODE_ENV = 'test';

// Load .env if present
const dotenvPath = path.join(__dirname, '..', '.env.test');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
} else {
  // Fallback to server/.env for local runs if needed
  const serverEnv = path.join(__dirname, '..', '.env');
  if (fs.existsSync(serverEnv)) {
    require('dotenv').config({ path: serverEnv });
  }
}

// Reasonable default timeouts for integration tests
jest.setTimeout(30000);

// ---- Safe Mocks for External Services ----

// Stripe mock (prevents real network calls)
jest.mock('stripe', () => {
  return function StripeMock() {
    return {
      paymentIntents: {
        create: jest.fn(async (args) => ({
          id: 'pi_test_123',
          client_secret: 'pi_secret_test_123',
          amount: args.amount || 1000,
          currency: args.currency || 'usd',
          status: 'requires_confirmation'
        })),
      },
      charges: {
        create: jest.fn(async (args) => ({
          id: 'ch_test_123',
          amount: args.amount || 1000,
          currency: args.currency || 'usd',
          status: 'succeeded'
        })),
      }
    };
  };
});

// --- Firebase Admin mocks (supports apps.length, getApps, getApp) ---

// Shared in-memory app registry for both mocks
const __firebaseApps = [];

// Helper to create a fake app object
function __createFakeApp(name = '[DEFAULT]', options = {}) {
  return {
    name,
    options,
    delete: jest.fn(async () => {
      const idx = __firebaseApps.findIndex((a) => a.name === name);
      if (idx >= 0) __firebaseApps.splice(idx, 1);
    })
  };
}

// Mock for `firebase-admin` (classic)
jest.mock('firebase-admin', () => {
  const auth = {
    verifyIdToken: jest.fn(async () => ({ uid: 'test-user-uid' })),
    getUser: jest.fn(async () => ({ uid: 'test-user-uid', email: 'tenant.test@propertyplus.us' })),
  };

  const initializeApp = jest.fn((options = {}, name) => {
    const appName = name || (options && options.name) || '[DEFAULT]';
    // If already exists, return existing
    const existing = __firebaseApps.find((a) => a.name === appName);
    if (existing) return existing;
    const app = __createFakeApp(appName, options);
    __firebaseApps.push(app);
    return app;
  });

  const app = jest.fn((name) => {
    const appName = name || '[DEFAULT]';
    const found = __firebaseApps.find((a) => a.name === appName);
    if (!found) {
      // create on-demand to mimic permissive behavior
      const created = __createFakeApp(appName, {});
      __firebaseApps.push(created);
      return created;
    }
    return found;
  });

  // Important: expose `.apps` like real admin SDK
  const adminMock = {
    initializeApp,
    app,
    apps: __firebaseApps,
    credential: { cert: jest.fn((x) => x) },
    auth: () => auth
  };

  return adminMock;
});

// Mock for `firebase-admin/app` (modular)
jest.mock('firebase-admin/app', () => {
  const initializeApp = jest.fn((options = {}, name) => {
    const appName = name || (options && options.name) || '[DEFAULT]';
    const existing = __firebaseApps.find((a) => a.name === appName);
    if (existing) return existing;
    const app = __createFakeApp(appName, options);
    __firebaseApps.push(app);
    return app;
  });

  const getApp = jest.fn((name) => {
    const appName = name || '[DEFAULT]';
    const found = __firebaseApps.find((a) => a.name === appName);
    if (!found) throw new Error('No app named ' + appName);
    return found;
  });

  const getApps = jest.fn(() => __firebaseApps);

  return {
    initializeApp,
    getApp,
    getApps,
    // export type placeholders where needed
    applicationDefault: jest.fn(),
    cert: jest.fn()
  };
});

// Optional: Ensure clean slate between tests
afterEach(async () => {
  // delete all apps to prevent cross-test pollution
  // (simulates admin.apps = [])
  while (__firebaseApps.length) {
    const app = __firebaseApps.pop();
    try {
      await app.delete();
    } catch {}
  }
});

// Optional: S3/AWS SDK mocks if code imports them
try {
  jest.mock('@aws-sdk/client-s3', () => {
    const calls = {
      putObject: [],
      getObject: [],
      deleteObject: [],
      headObject: [],
    };

    class PutObjectCommand { constructor(input) { this.input = input; } }
    class GetObjectCommand { constructor(input) { this.input = input; } }
    class DeleteObjectCommand { constructor(input) { this.input = input; } }
    class HeadObjectCommand { constructor(input) { this.input = input; } }

    class S3Client {
      constructor(config = {}) { this.config = config; }
      async send(command) {
        const name = command?.constructor?.name;
        switch (name) {
          case 'PutObjectCommand':
            calls.putObject.push(command.input);
            // Simulate ETag response
            return { ETag: '"test-etag"', VersionId: '1' };
          case 'GetObjectCommand':
            calls.getObject.push(command.input);
            // Minimal shape with a Body stream substitute
            return {
              Body: Buffer.from('mock-object'),
              ContentType: 'application/octet-stream',
              ContentLength: 11
            };
          case 'DeleteObjectCommand':
            calls.deleteObject.push(command.input);
            return { DeleteMarker: true, VersionId: '1' };
          case 'HeadObjectCommand':
            calls.headObject.push(command.input);
            return { ContentLength: 11, ContentType: 'application/octet-stream' };
          default:
            throw new Error('Unmocked S3 command: ' + name);
        }
      }
    }

    // expose calls for test introspection if needed
    S3Client.__calls = calls;

    return {
      S3Client,
      PutObjectCommand,
      GetObjectCommand,
      DeleteObjectCommand,
      HeadObjectCommand,
    };
  });
} catch (_) {
  // not used, ignore
}

// S3 request presigner mock
try {
  jest.mock('@aws-sdk/s3-request-presigner', () => {
    return {
      // return a stable, obviously fake signed URL
      getSignedUrl: jest.fn(async (_client, _command, _opts) => 'https://s3.mock/signed-url'),
    };
  });
} catch (_) {
  // not used, ignore
}

// Helper: base URL for tests to supertest against, default localhost:5000
process.env.PP_BASE_URL = process.env.PP_BASE_URL || 'http://localhost:5000';

// ---- Deterministic time (no flaky tests)
jest.useFakeTimers({ now: new Date('2025-01-15T10:00:00Z') });

// ---- Cron scheduler mock (node-cron)
jest.mock('node-cron', () => {
  return {
    schedule: jest.fn((_expr, fn) => {
      // Return a minimal job with start/stop hooks
      return {
        start: jest.fn(() => {}),
        stop: jest.fn(() => {}),
        _run: fn // allow tests to run it manually if needed
      };
    })
  };
});

// ---- Email/SMS provider mocks (sendgrid/twilio or local mailer libs)
try {
  jest.mock('@sendgrid/mail', () => {
    return {
      setApiKey: jest.fn(),
      send: jest.fn(async (_msg) => [{ statusCode: 202 }])
    };
  });
} catch (_) {}

try {
  jest.mock('twilio', () => {
    return function TwilioMock() {
      return {
        messages: {
          create: jest.fn(async (_args) => ({ sid: 'SMxxxxxxxx', status: 'queued' }))
        }
      };
    };
  });
} catch (_) {}

// Generic internal mailer/service mocks, if your code uses them:
try {
  jest.mock('../../src/lib/mailer', () => ({
    sendEmail: jest.fn(async () => ({ ok: true }))
  }));
} catch (_) {}

try {
  jest.mock('../../src/lib/sms', () => ({
    sendSms: jest.fn(async () => ({ ok: true }))
  }));
} catch (_) {}
