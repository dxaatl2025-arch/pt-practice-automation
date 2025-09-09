// Applications API Tests
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Import mocked modules
const { sendEmail } = require('../../src/utils/email');
const { generateApplicationPdf } = require('../../src/utils/pdf');

// Mock PDF generation
jest.mock('../../src/utils/pdf', () => ({
  generateApplicationPdf: jest.fn()
}));

describe('Applications API', () => {
  let app;
  let landlordToken, tenantToken;
  let landlord, tenant, property;

  beforeAll(async () => {
    // Enable applications module for tests
    process.env.APPLICATIONS_E2E = 'true';
    
    // Import app after setting env vars
    app = require('../../server');
  });

  beforeEach(async () => {
    // Clear mocks
    testUtils.getEmailMock().clearSentEmails();
    generateApplicationPdf.mockClear();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    landlord = await testPrisma.user.create({
      data: {
        email: 'landlord@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Landlord',
        role: 'LANDLORD'
      }
    });

    tenant = await testPrisma.user.create({
      data: {
        email: 'tenant@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Tenant',
        role: 'TENANT'
      }
    });

    // Create test property
    property = await testPrisma.property.create({
      data: testUtils.generateProperty(landlord.id, {
        title: 'Test Property for Applications'
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

  describe('POST /api/applications', () => {
    it('should create application without authentication', async () => {
      const applicationData = testUtils.generateApplication(property.id);
      
      // Mock PDF generation
      generateApplicationPdf.mockResolvedValue(Buffer.from('fake pdf content'));

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('submitted');

      // Verify application was created in database
      const dbApplication = await testPrisma.application.findUnique({
        where: { id: response.body.data.id }
      });
      expect(dbApplication).toBeTruthy();
      expect(dbApplication.email).toBe(applicationData.email);
    });

    it('should send email to landlord on submission', async () => {
      const applicationData = testUtils.generateApplication(property.id);
      generateApplicationPdf.mockResolvedValue(Buffer.from('fake pdf content'));

      await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      // Verify email was sent
      const emailMock = testUtils.getEmailMock();
      expect(emailMock.getEmailCount()).toBe(1);
      
      const sentEmail = emailMock.getLastEmail();
      expect(sentEmail.to).toBe(landlord.email);
      expect(sentEmail.subject).toContain('New Application');
      expect(sentEmail.attachments).toHaveLength(1);
    });

    it('should reject application without consent', async () => {
      const applicationData = testUtils.generateApplication(property.id, {
        consentBackground: false
      });

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('consent');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/applications')
        .send({
          propertyId: property.id,
          firstName: 'Test'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/applications', () => {
    let application;

    beforeEach(async () => {
      application = await testPrisma.application.create({
        data: testUtils.generateApplication(property.id, {
          applicantId: tenant.id
        })
      });
    });

    it('should return applications for landlord who owns property', async () => {
      const response = await request(app)
        .get(`/api/applications?propertyId=${property.id}`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(application.id);
    });

    it('should reject landlord accessing other property applications', async () => {
      // Create another landlord and property
      const otherLandlord = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'LANDLORD', email: 'other@test.com' })
      });

      const otherProperty = await testPrisma.property.create({
        data: testUtils.generateProperty(otherLandlord.id)
      });

      await request(app)
        .get(`/api/applications?propertyId=${otherProperty.id}`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/applications?propertyId=${property.id}`)
        .expect(401);
    });
  });

  describe('PATCH /api/applications/:id/status', () => {
    let application;

    beforeEach(async () => {
      application = await testPrisma.application.create({
        data: testUtils.generateApplication(property.id, {
          status: 'PENDING'
        })
      });
    });

    it('should update application status and send email', async () => {
      const response = await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: 'APPROVED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');

      // Verify email was sent to applicant
      const emailMock = testUtils.getEmailMock();
      expect(emailMock.getEmailCount()).toBe(1);
      
      const sentEmail = emailMock.getLastEmail();
      expect(sentEmail.to).toBe(application.email);
      expect(sentEmail.subject).toContain('Approved');
    });

    it('should reject invalid status values', async () => {
      await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should require landlord authentication', async () => {
      await request(app)
        .patch(`/api/applications/${application.id}/status`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ status: 'APPROVED' })
        .expect(403);
    });
  });

  describe('GET /api/applications/:id/pdf', () => {
    let application;

    beforeEach(async () => {
      application = await testPrisma.application.create({
        data: testUtils.generateApplication(property.id)
      });
    });

    it('should generate and return PDF for landlord', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');
      generateApplicationPdf.mockResolvedValue(mockPdfBuffer);

      const response = await request(app)
        .get(`/api/applications/${application.id}/pdf`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(Buffer.compare(response.body, mockPdfBuffer)).toBe(0);
      expect(generateApplicationPdf).toHaveBeenCalledWith(expect.objectContaining({
        id: application.id
      }));
    });

    it('should reject unauthorized access', async () => {
      await request(app)
        .get(`/api/applications/${application.id}/pdf`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent application', async () => {
      await request(app)
        .get('/api/applications/nonexistent/pdf')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(404);
    });
  });
});