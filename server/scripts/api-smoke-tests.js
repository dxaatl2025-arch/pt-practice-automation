// scripts/api-smoke-tests.js
// Comprehensive CRUD API testing for all endpoints

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_TIMEOUT = 10000;

// Configure axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testData = {};
  }

  log(message, type = 'info') {
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async test(description, testFn) {
    try {
      this.log(`Testing: ${description}`);
      await testFn();
      this.results.passed++;
      this.log(`PASSED: ${description}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ description, error: error.message });
      this.log(`FAILED: ${description} - ${error.message}`, 'error');
    }
  }

  async runSmokeTests() {
    this.log('🚀 Starting API Smoke Tests');
    this.log('============================');

    // Health Check
    await this.test('Health endpoint responds', async () => {
      const response = await api.get('/health');
      if (response.status !== 200 || response.data.status !== 'healthy') {
        throw new Error('Health check failed');
      }
    });

    await this.test('Detailed health endpoint responds', async () => {
      const response = await api.get('/health/detailed');
      if (response.status !== 200) {
        throw new Error('Detailed health check failed');
      }
      if (!response.data.databases?.postgresql?.status) {
        throw new Error('PostgreSQL status not found in health check');
      }
    });

    // User CRUD Tests
    await this.testUserCRUD();
    
    // Property CRUD Tests
    await this.testPropertyCRUD();
    
    // Lease CRUD Tests
    await this.testLeaseCRUD();
    
    // Payment CRUD Tests
    await this.testPaymentCRUD();
    
    // Maintenance CRUD Tests
    await this.testMaintenanceCRUD();
    
    // Relationship Tests
    await this.testRelationships();

    // Seeded Data Verification
    await this.testSeededData();

    this.printResults();
  }

  async testUserCRUD() {
    this.log('\n👥 Testing Users API (CRUD)');
    this.log('============================');

    // CREATE
    await this.test('Create new user', async () => {
      const userData = {
        email: 'test.api@example.com',
        password: 'testpass123',
        firstName: 'API',
        lastName: 'TestUser',
        role: 'TENANT',
        phone: '+1-555-API-TEST'
      };
      const response = await api.post('/api/users', userData);
      if (response.status !== 201 || !response.data.success) {
        throw new Error('User creation failed');
      }
      this.testData.user = response.data.data;
    });

    // READ (List)
    await this.test('Get all users', async () => {
      const response = await api.get('/api/users');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get users failed');
      }
      if (!Array.isArray(response.data.data)) {
        throw new Error('Users data is not an array');
      }
    });

    // READ (Single)
    await this.test('Get user by ID', async () => {
      if (!this.testData.user) throw new Error('No test user available');
      const response = await api.get(`/api/users/${this.testData.user.id}`);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get user by ID failed');
      }
      if (response.data.data.id !== this.testData.user.id) {
        throw new Error('Returned user ID does not match');
      }
    });

    // UPDATE
    await this.test('Update user', async () => {
      if (!this.testData.user) throw new Error('No test user available');
      const updateData = { firstName: 'UpdatedAPI' };
      const response = await api.put(`/api/users/${this.testData.user.id}`, updateData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('User update failed');
      }
      if (response.data.data.firstName !== 'UpdatedAPI') {
        throw new Error('User update did not persist');
      }
    });

    // DELETE
    await this.test('Delete user', async () => {
      if (!this.testData.user) throw new Error('No test user available');
      const response = await api.delete(`/api/users/${this.testData.user.id}`);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('User deletion failed');
      }
    });
  }

  async testPropertyCRUD() {
    this.log('\n🏠 Testing Properties API (CRUD)');
    this.log('=================================');

    // First, get a landlord for property creation
    await this.test('Get landlord for property creation', async () => {
      const response = await api.get('/api/users?role=LANDLORD');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to get landlords');
      }
      const landlords = response.data.data.filter(user => user.role === 'LANDLORD');
      if (landlords.length === 0) {
        throw new Error('No landlords found for property creation');
      }
      this.testData.landlord = landlords[0];
    });

    // CREATE
    await this.test('Create new property', async () => {
      const propertyData = {
        title: 'API Test Property',
        description: 'Test property created by API smoke tests',
        propertyType: 'APARTMENT',
        addressStreet: '123 API Test Street',
        addressCity: 'Atlanta',
        addressState: 'GA',
        addressZip: '30309',
        bedrooms: 2,
        bathrooms: 1,
        rentAmount: 1500,
        landlordId: this.testData.landlord.id
      };
      const response = await api.post('/api/properties', propertyData);
      if (response.status !== 201 || !response.data.success) {
        throw new Error('Property creation failed');
      }
      this.testData.property = response.data.data;
    });

    // READ (List)
    await this.test('Get all properties', async () => {
      const response = await api.get('/api/properties');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get properties failed');
      }
      if (!Array.isArray(response.data.data)) {
        throw new Error('Properties data is not an array');
      }
    });

    // READ (Single)
    await this.test('Get property by ID', async () => {
      if (!this.testData.property) throw new Error('No test property available');
      const response = await api.get(`/api/properties/${this.testData.property.id}`);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get property by ID failed');
      }
    });

    // UPDATE
    await this.test('Update property', async () => {
      if (!this.testData.property) throw new Error('No test property available');
      const updateData = { title: 'Updated API Test Property' };
      const response = await api.put(`/api/properties/${this.testData.property.id}`, updateData);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Property update failed');
      }
    });

    // DELETE
    await this.test('Delete property', async () => {
      if (!this.testData.property) throw new Error('No test property available');
      const response = await api.delete(`/api/properties/${this.testData.property.id}`);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Property deletion failed');
      }
    });
  }

  async testLeaseCRUD() {
    this.log('\n📄 Testing Leases API (CRUD)');
    this.log('=============================');

    // READ (List)
    await this.test('Get all leases', async () => {
      const response = await api.get('/api/leases');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get leases failed');
      }
      if (!Array.isArray(response.data.data)) {
        throw new Error('Leases data is not an array');
      }
    });

    // Get existing lease from seeded data for other tests
    await this.test('Find seeded lease for testing', async () => {
      const response = await api.get('/api/leases');
      const leases = response.data.data;
      if (leases.length > 0) {
        this.testData.lease = leases[0];
      }
    });

    // READ (Single) - if lease exists
    if (this.testData.lease) {
      await this.test('Get lease by ID', async () => {
        const response = await api.get(`/api/leases/${this.testData.lease.id}`);
        if (response.status !== 200 || !response.data.success) {
          throw new Error('Get lease by ID failed');
        }
      });
    }
  }

  async testPaymentCRUD() {
    this.log('\n💰 Testing Payments API (CRUD)');
    this.log('===============================');

    // READ (List)
    await this.test('Get all payments', async () => {
      const response = await api.get('/api/payments');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get payments failed');
      }
      if (!Array.isArray(response.data.data)) {
        throw new Error('Payments data is not an array');
      }
    });

    // Get existing payment from seeded data for other tests
    await this.test('Find seeded payment for testing', async () => {
      const response = await api.get('/api/payments');
      const payments = response.data.data;
      if (payments.length > 0) {
        this.testData.payment = payments[0];
      }
    });

    // READ (Single) - if payment exists
    if (this.testData.payment) {
      await this.test('Get payment by ID', async () => {
        const response = await api.get(`/api/payments/${this.testData.payment.id}`);
        if (response.status !== 200 || !response.data.success) {
          throw new Error('Get payment by ID failed');
        }
      });
    }
  }

  async testMaintenanceCRUD() {
    this.log('\n🔧 Testing Maintenance API (CRUD)');
    this.log('==================================');

    // READ (List)
    await this.test('Get all maintenance tickets', async () => {
      const response = await api.get('/api/maintenance');
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Get maintenance tickets failed');
      }
      if (!Array.isArray(response.data.data)) {
        throw new Error('Maintenance tickets data is not an array');
      }
    });

    // Get existing ticket from seeded data for other tests
    await this.test('Find seeded maintenance ticket for testing', async () => {
      const response = await api.get('/api/maintenance');
      const tickets = response.data.data;
      if (tickets.length > 0) {
        this.testData.ticket = tickets[0];
      }
    });

    // READ (Single) - if ticket exists
    if (this.testData.ticket) {
      await this.test('Get maintenance ticket by ID', async () => {
        const response = await api.get(`/api/maintenance/${this.testData.ticket.id}`);
        if (response.status !== 200 || !response.data.success) {
          throw new Error('Get maintenance ticket by ID failed');
        }
      });
    }
  }

  async testRelationships() {
    this.log('\n🔗 Testing Data Relationships');
    this.log('==============================');

    await this.test('Verify lease has property and tenant relationships', async () => {
      const response = await api.get('/api/leases');
      if (response.data.data.length === 0) {
        this.log('No leases found, skipping relationship test', 'warning');
        return;
      }
      
      const lease = response.data.data[0];
      if (!lease.property && !lease.propertyId) {
        throw new Error('Lease missing property relationship');
      }
      if (!lease.tenant && !lease.tenantId) {
        throw new Error('Lease missing tenant relationship');
      }
    });

    await this.test('Verify payment has lease and tenant relationships', async () => {
      const response = await api.get('/api/payments');
      if (response.data.data.length === 0) {
        this.log('No payments found, skipping relationship test', 'warning');
        return;
      }
      
      const payment = response.data.data[0];
      if (!payment.lease && !payment.leaseId) {
        throw new Error('Payment missing lease relationship');
      }
      if (!payment.tenant && !payment.tenantId) {
        throw new Error('Payment missing tenant relationship');
      }
    });

    await this.test('Verify property has landlord relationship', async () => {
      const response = await api.get('/api/properties');
      if (response.data.data.length === 0) {
        throw new Error('No properties found for relationship test');
      }
      
      const property = response.data.data[0];
      if (!property.landlord && !property.landlordId) {
        throw new Error('Property missing landlord relationship');
      }
    });
  }

  async testSeededData() {
    this.log('\n🌱 Testing Seeded Data Verification');
    this.log('====================================');

    await this.test('Verify seeded landlord exists', async () => {
      const response = await api.get('/api/users');
      const seedLandlord = response.data.data.find(u => 
        u.email === 'alex.landlord@seed.example.com'
      );
      if (!seedLandlord) {
        throw new Error('Seeded landlord not found');
      }
      if (seedLandlord.role !== 'LANDLORD') {
        throw new Error('Seeded user is not a landlord');
      }
    });

    await this.test('Verify seeded tenant exists', async () => {
      const response = await api.get('/api/users');
      const seedTenant = response.data.data.find(u => 
        u.email === 'maria.tenant@seed.example.com'
      );
      if (!seedTenant) {
        throw new Error('Seeded tenant not found');
      }
      if (seedTenant.role !== 'TENANT') {
        throw new Error('Seeded user is not a tenant');
      }
    });

    await this.test('Verify seeded property exists', async () => {
      const response = await api.get('/api/properties');
      const seedProperty = response.data.data.find(p => 
        p.title.includes('[SEED]')
      );
      if (!seedProperty) {
        throw new Error('Seeded property not found');
      }
    });

    await this.test('Verify seeded lease exists', async () => {
      const response = await api.get('/api/leases');
      if (response.data.data.length === 0) {
        throw new Error('No leases found - seeded lease missing');
      }
    });

    await this.test('Verify seeded payments exist', async () => {
      const response = await api.get('/api/payments');
      const seedPayments = response.data.data.filter(p => 
        p.description && p.description.includes('[SEED]')
      );
      if (seedPayments.length === 0) {
        throw new Error('No seeded payments found');
      }
    });

    await this.test('Verify seeded maintenance tickets exist', async () => {
      const response = await api.get('/api/maintenance');
      const seedTickets = response.data.data.filter(t => 
        t.title && t.title.includes('[SEED]')
      );
      if (seedTickets.length === 0) {
        throw new Error('No seeded maintenance tickets found');
      }
    });
  }

  printResults() {
    this.log('\n📊 API Smoke Test Results');
    this.log('=========================');
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.results.errors.forEach(({ description, error }) => {
        this.log(`   • ${description}: ${error}`, 'error');
      });
    }

    this.log(`\n${this.results.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
  }
}

// Run smoke tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runSmokeTests()
    .then(() => {
      const exitCode = tester.results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Smoke tests crashed:', error);
      process.exit(1);
    });
}

module.exports = APITester;