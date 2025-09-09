// Payments API Tests
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

describe('Payments API', () => {
  let app;
  let landlordToken, tenantToken;
  let landlord, tenant, property, lease;

  beforeAll(async () => {
    // Enable payments module for tests
    process.env.STRIPE_CORE = 'true';
    
    // Import app after setting env vars
    app = require('../../server');
  });

  beforeEach(async () => {
    // Clear mocks
    testUtils.getStripeMock().clearPaymentIntents();
    testUtils.getStripeMock().clearWebhooks();
    
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

    // Create test property and lease
    property = await testPrisma.property.create({
      data: testUtils.generateProperty(landlord.id)
    });

    lease = await testPrisma.lease.create({
      data: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        monthlyRent: 1200,
        securityDeposit: 1200,
        status: 'ACTIVE',
        propertyId: property.id,
        tenantId: tenant.id
      }
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

  describe('POST /api/payments/intent', () => {
    it('should create payment intent for tenant', async () => {
      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          leaseId: lease.id,
          amount: 1200
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data.amount).toBe(1200);

      // Verify payment was created in database
      const dbPayment = await testPrisma.payment.findUnique({
        where: { id: response.body.data.paymentId }
      });
      expect(dbPayment).toBeTruthy();
      expect(dbPayment.provider).toBe('stripe');
      expect(dbPayment.status).toBe('PENDING');
    });

    it('should reject tenant accessing other tenant lease', async () => {
      // Create another tenant and lease
      const otherTenant = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'TENANT', email: 'other@test.com' })
      });

      const otherLease = await testPrisma.lease.create({
        data: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 1500,
          propertyId: property.id,
          tenantId: otherTenant.id
        }
      });

      await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          leaseId: otherLease.id,
          amount: 1500
        })
        .expect(403);
    });

    it('should validate amount is positive', async () => {
      await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          leaseId: lease.id,
          amount: -100
        })
        .expect(400);
    });

    it('should require tenant role', async () => {
      await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          leaseId: lease.id,
          amount: 1200
        })
        .expect(403);
    });
  });

  describe('POST /api/payments/manual', () => {
    it('should create manual payment for landlord', async () => {
      const response = await request(app)
        .post('/api/payments/manual')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          leaseId: lease.id,
          amount: 1200,
          description: 'Cash payment received'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.provider).toBe('manual');
      expect(response.body.data.status).toBe('PAID');
      expect(response.body.data.amount).toBe(1200);

      // Verify payment was created in database
      const dbPayment = await testPrisma.payment.findUnique({
        where: { id: response.body.data.id }
      });
      expect(dbPayment).toBeTruthy();
      expect(dbPayment.description).toBe('Cash payment received');
    });

    it('should require landlord role', async () => {
      await request(app)
        .post('/api/payments/manual')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          leaseId: lease.id,
          amount: 1200
        })
        .expect(403);
    });

    it('should reject landlord accessing other landlord property', async () => {
      // Create another landlord and property
      const otherLandlord = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'LANDLORD', email: 'other@test.com' })
      });

      const otherProperty = await testPrisma.property.create({
        data: testUtils.generateProperty(otherLandlord.id)
      });

      const otherLease = await testPrisma.lease.create({
        data: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 1500,
          propertyId: otherProperty.id,
          tenantId: tenant.id
        }
      });

      await request(app)
        .post('/api/payments/manual')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          leaseId: otherLease.id,
          amount: 1500
        })
        .expect(403);
    });
  });

  describe('GET /api/payments/:id', () => {
    let payment;

    beforeEach(async () => {
      payment = await testPrisma.payment.create({
        data: {
          amount: 1200,
          dueDate: new Date(),
          status: 'PENDING',
          type: 'RENT',
          provider: 'stripe',
          leaseId: lease.id,
          tenantId: tenant.id
        }
      });
    });

    it('should return payment for tenant', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(payment.id);
      expect(response.body.data.amount).toBe(1200);
    });

    it('should return payment for landlord', async () => {
      const response = await request(app)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(payment.id);
    });

    it('should reject unauthorized access', async () => {
      // Create another tenant
      const otherTenant = await testPrisma.user.create({
        data: testUtils.generateUser({ role: 'TENANT', email: 'other@test.com' })
      });

      const otherToken = jwt.sign(
        { id: otherTenant.id, role: 'TENANT' },
        process.env.JWT_SECRET || 'test_jwt_secret_32_characters_long'
      );

      await request(app)
        .get(`/api/payments/${payment.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('POST /api/webhooks/stripe', () => {
    let payment;

    beforeEach(async () => {
      payment = await testPrisma.payment.create({
        data: {
          amount: 1200,
          dueDate: new Date(),
          status: 'PENDING',
          type: 'RENT',
          provider: 'stripe',
          providerIntentId: 'pi_mock_test_succeeded',
          leaseId: lease.id,
          tenantId: tenant.id
        }
      });
    });

    it('should handle successful payment webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('Stripe-Signature', 'test_signature')
        .send({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_mock_test_succeeded',
              status: 'succeeded'
            }
          }
        })
        .expect(200);

      expect(response.body).toEqual({ received: true });

      // Verify payment status was updated
      const updatedPayment = await testPrisma.payment.findUnique({
        where: { id: payment.id }
      });
      expect(updatedPayment.status).toBe('PAID');
      expect(updatedPayment.paidDate).toBeTruthy();
    });

    it('should reject webhook without signature', async () => {
      await request(app)
        .post('/api/webhooks/stripe')
        .send({
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test' } }
        })
        .expect(400);
    });

    it('should handle unknown payment intent', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('Stripe-Signature', 'test_signature')
        .send({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_unknown_intent',
              status: 'succeeded'
            }
          }
        })
        .expect(200);

      expect(response.body).toEqual({ received: true });
      // Should not crash even if payment not found
    });
  });

  describe('Service Integration Tests', () => {
    it('should handle Stripe service failures gracefully', async () => {
      // Make Stripe mock fail
      testUtils.getStripeMock().setShouldFail(true, 'Mock Stripe error');

      const response = await request(app)
        .post('/api/payments/intent')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          leaseId: lease.id,
          amount: 1200
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Mock Stripe error');

      // Reset mock
      testUtils.getStripeMock().setShouldFail(false);
    });
  });
});