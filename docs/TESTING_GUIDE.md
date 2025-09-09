# Testing Guide - PropertyPulse

## Overview

Comprehensive testing suite to validate all 6 parts of the PropertyPulse platform before Phase 2 implementation.

## Test Architecture

### 1. Mock Services
All external services are mocked to prevent network calls and ensure deterministic testing:

- **Email Service**: `src/utils/__mocks__/email.js`
- **Stripe Service**: `src/config/__mocks__/stripe.js` 
- **S3 Service**: `src/config/__mocks__/s3.js`

### 2. Test Database
- **Database**: PostgreSQL test instance
- **Connection**: `postgresql://test_user:test_pass@localhost:5432/propertypulse_test`
- **Setup**: Automatic migration and cleanup between tests
- **Seeding**: Rich test data via `scripts/seed-test-data.js`

### 3. Test Types

#### API Tests (`tests/api/`)
- **applications.test.js**: Applications submission, management, PDF generation
- **payments.test.js**: Stripe integration, manual payments, webhooks  
- **uploads.test.js**: S3 signed URLs, file authorization
- **reminders.test.js**: Email reminder scheduling and delivery

#### E2E Tests (`tests/e2e/`)
- **applications.e2e.test.js**: Browser-based application workflows
- **playwright.config.js**: Cross-browser testing configuration

## Running Tests

### Complete Test Suite
```bash
# Run all tests with setup and validation
npm run test:comprehensive
```

### Individual Test Categories
```bash
# API tests only
cd server && npm run test:api

# E2E browser tests
npm run test:e2e

# Database setup and seeding
cd server && npm run test:setup && npm run seed:test
```

### Development Testing
```bash
# Single test file
cd server && jest tests/api/applications.test.js --verbose

# Watch mode for development
cd server && jest --watch tests/api/applications.test.js
```

## Test Coverage

### ✅ Part 1: Applications E2E
- [x] Public application submission
- [x] Email notifications to landlords with PDF attachments  
- [x] Application status management (approve/decline)
- [x] Tenant notification emails on status change
- [x] PDF generation and download
- [x] Authorization checks (landlord property ownership)
- [x] Form validation and error handling

### ✅ Part 2: Payments (Stripe)
- [x] Payment intent creation for tenants
- [x] Manual payment recording by landlords
- [x] Webhook handling for payment confirmations
- [x] Payment status updates in database
- [x] Authorization checks (tenant lease access, landlord property access)
- [x] Error handling for Stripe service failures

### ✅ Part 3: S3 Uploads  
- [x] Signed URL generation for authenticated uploads
- [x] Entity-based file organization (applications, properties, maintenance, leases)
- [x] Content type validation and passthrough
- [x] Authorization based on entity ownership
- [x] S3 service error handling

### ✅ Part 4: Reminders
- [x] Due reminder selection from database
- [x] Email dispatch for different reminder types (rent due, late, receipt)
- [x] Reminder scheduling (monthly, weekly, one-time)
- [x] Email template rendering with property/lease data
- [x] Email service failure handling

### ✅ Part 5: CI/CD & Security
- [x] Database connection and health checks
- [x] Rate limiting enforcement
- [x] Security header validation
- [x] Error response format consistency
- [x] Environment-based feature flag testing

### ✅ Part 6: Integration
- [x] End-to-end application workflows in browser
- [x] Cross-browser compatibility testing
- [x] Mobile responsive design validation
- [x] Complete user journeys (landlord and tenant)

## Test Data

### Seeded Users
- **Landlord**: `landlord@testlord.com / testpass123`
- **Tenant 1**: `tenant1@test.com / testpass123`  
- **Tenant 2**: `tenant2@test.com / testpass123`

### Seeded Properties
- **Studio**: Downtown Studio Apartment ($1,200/month, available)
- **House**: Suburban 2BR House ($1,800/month, available)
- **Condo**: Luxury 1BR Condo ($2,200/month, occupied)

### Seeded Applications
- **Pending**: Alice Tenant applying for studio
- **Approved**: Charlie Applicant approved for house

### Seeded Payments  
- **Paid**: February rent for occupied condo
- **Pending**: March rent for occupied condo
- **Manual**: Cash payment recorded by landlord

### Seeded Reminders
- **Due Soon**: Rent reminder for current tenant (1 hour from now)
- **Future**: Payment receipt reminder (2 days from now)

## Mock Service Testing

### Email Mock Utilities
```javascript
// In tests:
const emailMock = testUtils.getEmailMock();
emailMock.getEmailCount(); // Number of emails sent
emailMock.getLastEmail(); // Most recent email
emailMock.findEmailBySubject('Rent Due'); // Find by subject
emailMock.clearSentEmails(); // Reset for next test
```

### Stripe Mock Utilities
```javascript
const stripeMock = testUtils.getStripeMock();
stripeMock.getPaymentIntents(); // All created payment intents
stripeMock.simulateSuccessfulPayment(intentId); // Mock webhook event
stripeMock.setShouldFail(true, 'Mock error'); // Force failures
```

### S3 Mock Utilities
```javascript
const s3Mock = testUtils.getS3Mock();
s3Mock.getSignedUrls(); // All generated signed URLs
s3Mock.simulateFileUpload(key, contentType); // Mock file upload
s3Mock.findSignedUrlByKey('path/to/file'); // Find by key
```

## Debugging Tests

### Database State
```bash
# Open test database in Prisma Studio
cd server && npm run test:db:studio
```

### Test Logs
```bash
# Run with verbose logging
cd server && jest --verbose tests/api/applications.test.js

# Enable console logs in tests
SILENCE_LOGS=false jest tests/api/applications.test.js
```

### Mock State Inspection
```javascript
// In test files, inspect mock state:
console.log('Emails sent:', testUtils.getEmailMock().getSentEmails());
console.log('Stripe intents:', testUtils.getStripeMock().getPaymentIntents());
console.log('S3 URLs:', testUtils.getS3Mock().getSignedUrls());
```

## Test Requirements for Phase 2

Before implementing Phase 2 AI features, ALL tests must pass:

1. ✅ **Database Setup**: Migrations and seed data successful
2. ✅ **API Layer**: All endpoints functional with proper validation
3. ✅ **Service Layer**: Business logic working with mocked externals  
4. ✅ **Authorization**: Proper access control enforcement
5. ✅ **Error Handling**: Graceful degradation and error responses
6. ✅ **Integration**: End-to-end workflows functional

## Continuous Integration

### GitHub Actions Integration
Tests run automatically on:
- Pull requests to `main` branch
- Pushes to `develop` branch
- Manual workflow dispatch

### Required Passing Tests
- Database setup and migration
- All API test suites
- E2E browser tests (Chromium)
- Security and validation tests

## Performance Expectations

### Test Execution Times
- **Database Setup**: < 30 seconds
- **API Tests**: < 2 minutes per suite
- **E2E Tests**: < 5 minutes per browser
- **Complete Suite**: < 10 minutes total

### Mock Performance
- **Email Mock**: < 1ms per email
- **Stripe Mock**: < 5ms per payment intent
- **S3 Mock**: < 10ms per signed URL

---

**✅ All tests passing = Ready for Phase 2 AI Features**