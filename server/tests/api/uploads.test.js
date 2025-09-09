// Uploads API Tests
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Uploads API', () => {
  let app;
  let landlordToken, tenantToken;
  let landlord, tenant, property, application;

  beforeAll(async () => {
    // Enable uploads module for tests
    process.env.S3_UPLOADS = 'true';
    
    // Import app after setting env vars
    app = require('../../server');
  });

  beforeEach(async () => {
    // Clear mocks
    testUtils.getS3Mock().clearSignedUrls();
    testUtils.getS3Mock().clearUploadedFiles();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    landlord = await testPrisma.user.create({
      data: testUtils.generateUser({
        email: 'landlord@test.com',
        password: hashedPassword,
        role: 'LANDLORD'
      })
    });

    tenant = await testPrisma.user.create({
      data: testUtils.generateUser({
        email: 'tenant@test.com',
        password: hashedPassword,
        role: 'TENANT'
      })
    });

    // Create test property
    property = await testPrisma.property.create({
      data: testUtils.generateProperty(landlord.id)
    });

    // Create test application
    application = await testPrisma.application.create({
      data: testUtils.generateApplication(property.id, {
        applicantId: tenant.id
      })
    });

    // Generate JWT tokens
    landlordToken = jwt.sign(
      { id: landlord.id, role: 'LANDLORD' },
      process.env.JWT_SECRET || 'test_jwt_secret_32_characters_long'
    );

    tenantToken = jwt.sign(
      { id: tenant.id, role: 'TENANT' },
      process.env.JWT_SECRET || 'test_jwt_secret_32_characters_long'
    );
  });

  describe('POST /api/uploads/signed-url', () => {
    it('should generate signed URL for tenant uploading to their application', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'application',
          entityId: application.id,
          contentType: 'application/pdf',
          filename: 'employment_verification.pdf'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uploadUrl');
      expect(response.body.data).toHaveProperty('fileUrl');
      expect(response.body.data).toHaveProperty('key');
      expect(response.body.data.method).toBe('PUT');
      expect(response.body.data.headers['Content-Type']).toBe('application/pdf');

      // Verify mock recorded the signed URL
      const s3Mock = testUtils.getS3Mock();
      expect(s3Mock.getSignedUrls()).toHaveLength(1);
      expect(s3Mock.getLastSignedUrl().contentType).toBe('application/pdf');
    });

    it('should generate signed URL for landlord uploading to their property', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          entityType: 'property',
          entityId: property.id,
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toMatch(`property/${property.id}/`);
    });

    it('should reject tenant accessing other tenant application', async () => {
      // Create another tenant and application
      const otherTenant = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'TENANT', email: 'other@test.com' })
      });

      const otherApplication = await testPrisma.application.create({
        data: testUtils.generateApplication(property.id, {
          applicantId: otherTenant.id,
          email: 'other@test.com'
        })
      });

      await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'application',
          entityId: otherApplication.id,
          contentType: 'application/pdf'
        })
        .expect(403);
    });

    it('should reject landlord accessing other landlord property', async () => {
      const otherLandlord = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'LANDLORD', email: 'other@test.com' })
      });

      const otherProperty = await testPrisma.property.create({
        data: testUtils.generateProperty(otherLandlord.id)
      });

      await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          entityType: 'property',
          entityId: otherProperty.id,
          contentType: 'image/jpeg'
        })
        .expect(403);
    });

    it('should validate content type', async () => {
      await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'application',
          entityId: application.id,
          contentType: 'invalid/content-type'
        })
        .expect(400);
    });

    it('should validate entity type', async () => {
      await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'invalid_entity',
          entityId: application.id,
          contentType: 'application/pdf'
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/uploads/signed-url')
        .send({
          entityType: 'application',
          entityId: application.id,
          contentType: 'application/pdf'
        })
        .expect(401);
    });
  });

  describe('Maintenance Ticket Uploads', () => {
    let maintenanceTicket;

    beforeEach(async () => {
      // Create lease first
      const lease = await testPrisma.lease.create({
        data: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 1200,
          propertyId: property.id,
          tenantId: tenant.id
        }
      });

      maintenanceTicket = await testPrisma.maintenanceTicket.create({
        data: {
          title: 'Test Maintenance Issue',
          description: 'Something needs fixing',
          priority: 'MEDIUM',
          status: 'OPEN',
          propertyId: property.id,
          tenantId: tenant.id
        }
      });
    });

    it('should allow tenant to upload to their maintenance ticket', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'maintenance',
          entityId: maintenanceTicket.id,
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toMatch(`maintenance/${maintenanceTicket.id}/`);
    });

    it('should allow landlord to upload to their property maintenance ticket', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          entityType: 'maintenance',
          entityId: maintenanceTicket.id,
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Lease Document Uploads', () => {
    let lease;

    beforeEach(async () => {
      lease = await testPrisma.lease.create({
        data: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 1200,
          propertyId: property.id,
          tenantId: tenant.id
        }
      });
    });

    it('should allow tenant to upload to their lease', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'lease',
          entityId: lease.id,
          contentType: 'application/pdf'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toMatch(`lease/${lease.id}/`);
    });

    it('should allow landlord to upload to their property lease', async () => {
      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          entityType: 'lease',
          entityId: lease.id,
          contentType: 'application/pdf'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Service Integration Tests', () => {
    it('should handle S3 service failures gracefully', async () => {
      // Make S3 mock fail
      testUtils.getS3Mock().setShouldFail(true, 'Mock S3 error');

      const response = await request(app)
        .post('/api/uploads/signed-url')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          entityType: 'application',
          entityId: application.id,
          contentType: 'application/pdf'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('S3 not configured');

      // Reset mock
      testUtils.getS3Mock().setShouldFail(false);
    });

    it('should handle different content types correctly', async () => {
      const contentTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'text/plain'
      ];

      for (const contentType of contentTypes) {
        const response = await request(app)
          .post('/api/uploads/signed-url')
          .set('Authorization', `Bearer ${tenantToken}`)
          .send({
            entityType: 'application',
            entityId: application.id,
            contentType
          })
          .expect(200);

        expect(response.body.data.headers['Content-Type']).toBe(contentType);
      }
    });
  });
});