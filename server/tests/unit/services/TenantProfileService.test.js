const TenantProfileService = require('../../../src/services/TenantProfileService');

// Mock repository
const mockTenantProfileRepo = {
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn()
};

// Mock factory
jest.mock('../../../src/repositories/factory', () => ({
  getTenantProfileRepository: () => mockTenantProfileRepo
}));

describe('TenantProfileService', () => {
  let service;

  beforeEach(() => {
    service = new TenantProfileService();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: 'profile123',
        userId: 'user123',
        budgetMin: 1500,
        budgetMax: 2500
      };
      
      mockTenantProfileRepo.findByUserId.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user123');

      expect(mockTenantProfileRepo.findByUserId).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockTenantProfileRepo.findByUserId.mockResolvedValue(null);

      const result = await service.getProfile('user123');

      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      const error = new Error('Database connection failed');
      mockTenantProfileRepo.findByUserId.mockRejectedValue(error);

      await expect(service.getProfile('user123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('upsertProfile', () => {
    it('should create new profile when none exists', async () => {
      const userData = {
        budgetMin: 1500,
        budgetMax: 2500,
        beds: 2,
        pets: ['cat']
      };
      
      const mockCreatedProfile = {
        id: 'profile123',
        userId: 'user123',
        ...userData
      };

      mockTenantProfileRepo.findByUserId.mockResolvedValue(null);
      mockTenantProfileRepo.create.mockResolvedValue(mockCreatedProfile);

      const result = await service.upsertProfile('user123', userData);

      expect(mockTenantProfileRepo.findByUserId).toHaveBeenCalledWith('user123');
      expect(mockTenantProfileRepo.create).toHaveBeenCalledWith({
        userId: 'user123',
        ...userData
      });
      expect(result).toEqual(mockCreatedProfile);
    });

    it('should update existing profile', async () => {
      const existingProfile = { id: 'profile123', userId: 'user123' };
      const updateData = { budgetMin: 2000, budgetMax: 3000 };
      const updatedProfile = { ...existingProfile, ...updateData };

      mockTenantProfileRepo.findByUserId.mockResolvedValue(existingProfile);
      mockTenantProfileRepo.update.mockResolvedValue(updatedProfile);

      const result = await service.upsertProfile('user123', updateData);

      expect(mockTenantProfileRepo.update).toHaveBeenCalledWith('user123', updateData);
      expect(result).toEqual(updatedProfile);
    });

    it('should validate budget range', async () => {
      const invalidData = {
        budgetMin: 3000,
        budgetMax: 2000 // Max less than min
      };

      await expect(service.upsertProfile('user123', invalidData))
        .rejects.toThrow('Budget max must be greater than budget min');
    });
  });
});