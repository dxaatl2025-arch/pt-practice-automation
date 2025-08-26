const { PrismaClient } = require('@prisma/client');
const PrismaTenantProfileRepository = require('../../../src/repositories/prisma/TenantProfileRepository');

// Mock Prisma Client
const mockPrisma = {
  tenantProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn()
  }
};

describe('PrismaTenantProfileRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new PrismaTenantProfileRepository(mockPrisma);
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find profile by user ID', async () => {
      const mockProfile = {
        id: 'profile123',
        userId: 'user123',
        budgetMin: 1500,
        user: { id: 'user123', firstName: 'Test', lastName: 'User' }
      };

      mockPrisma.tenantProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findByUserId('user123');

      expect(mockPrisma.tenantProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrisma.tenantProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId('user123');

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create or update profile', async () => {
      const userData = {
        budgetMin: 1500,
        budgetMax: 2500,
        beds: 2
      };

      const mockResult = {
        id: 'profile123',
        userId: 'user123',
        ...userData
      };

      mockPrisma.tenantProfile.upsert.mockResolvedValue(mockResult);

      const result = await repository.upsert('user123', userData);

      expect(mockPrisma.tenantProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: { userId: 'user123', ...userData },
        update: userData,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle Prisma errors correctly', async () => {
      const error = new Error('Foreign key constraint failed');
      error.code = 'P2003';
      
      mockPrisma.tenantProfile.upsert.mockRejectedValue(error);

      await expect(repository.upsert('invalid-user', {}))
        .rejects.toThrow('Foreign key constraint failed');
    });
  });
});