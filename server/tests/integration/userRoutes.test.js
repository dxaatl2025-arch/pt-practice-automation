// tests/integration/userRoutes.test.js - FIXED VERSION
const request = require('supertest');
const prisma = require('../../src/db/prisma');

// Import app directly without starting server
const express = require('express');
const app = require('../../server'); // Make sure server.js exports app

describe('User Routes Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_TARGET = 'prisma';

    // Clean database
    await prisma.user.deleteMany({});
    await prisma.property.deleteMany({});

    console.log('✅ Test database cleaned');
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean between tests
    await prisma.user.deleteMany({});
  });

  describe('POST /api/users', () => {
    it('should create a new user with repository pattern', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'TENANT',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User created successfully',
        data: expect.objectContaining({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        })
      });

      // Verify password is not returned
      expect(response.body.data.password).toBeUndefined();

      // Verify user was created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(userData.email);
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'TENANT'
      };

      // Create first user
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User already exists'
      });
    });
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2b$10$hashed', // Pre-hashed password
          firstName: 'Test',
          lastName: 'User',
          role: 'TENANT'
        }
      });
    });

    it('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          total: 1
        })
      });

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].password).toBeUndefined();
    });

    it('should filter users by role', async () => {
      // Create a landlord
      await prisma.user.create({
        data: {
          email: 'landlord@example.com',
          password: '$2b$10$hashed',
          firstName: 'Landlord',
          lastName: 'User',
          role: 'LANDLORD'
        }
      });

      const response = await request(app)
        .get('/api/users?role=LANDLORD')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('LANDLORD');
    });
  });

  describe('GET /api/users/:id', () => {
    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2b$10$hashed',
          firstName: 'Test',
          lastName: 'User',
          role: 'TENANT'
        }
      });
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName
        })
      });

      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxx';
      
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      });
    });
  });
});