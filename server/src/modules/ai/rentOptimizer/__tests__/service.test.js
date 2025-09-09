const RentOptimizerService = require('../service');
const { PrismaClient } = require('@prisma/client');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    property: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    }
  }))
}));

describe('RentOptimizerService', () => {
  let service;
  let mockPrisma;
  let mockOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new RentOptimizerService();
    mockPrisma = service.prisma;
    mockOpenAI = service.openai;
  });

  describe('analyzePropertyRent', () => {
    it('should analyze property rent with comparables', async () => {
      const mockProperty = {
        id: 'prop1',
        title: 'Test Property',
        rentAmount: 2000,
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000,
        addressCity: 'Test City',
        addressState: 'CA',
        propertyType: 'APARTMENT',
        landlord: { id: 'landlord1' },
        leases: []
      };

      const mockComparables = [
        {
          id: 'comp1',
          rentAmount: 2100,
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 1050,
          propertyType: 'APARTMENT',
          addressCity: 'Test City',
          addressState: 'CA',
          leases: []
        },
        {
          id: 'comp2',
          rentAmount: 1950,
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 950,
          propertyType: 'APARTMENT',
          addressCity: 'Test City',
          addressState: 'CA',
          leases: []
        }
      ];

      const mockMarketProperties = [
        { rentAmount: 2000, bedrooms: 2, squareFeet: 1000, propertyType: 'APARTMENT', createdAt: new Date() },
        { rentAmount: 2100, bedrooms: 2, squareFeet: 1050, propertyType: 'APARTMENT', createdAt: new Date() },
        { rentAmount: 1950, bedrooms: 2, squareFeet: 950, propertyType: 'APARTMENT', createdAt: new Date() }
      ];

      // Mock Prisma calls
      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.property.findMany
        .mockResolvedValueOnce(mockComparables) // findComparableProperties call
        .mockResolvedValueOnce(mockMarketProperties); // getMarketData call

      // Mock OpenAI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              suggestedRent: 2050,
              confidence: 'high',
              reasoning: 'Property is slightly undervalued based on market comparables.',
              adjustmentFactors: ['market_position', 'property_condition'],
              rentRange: { min: 1950, max: 2150 },
              marketPosition: 'below_market'
            })
          }
        }]
      });

      const result = await service.analyzePropertyRent('prop1');

      expect(result.property.id).toBe('prop1');
      expect(result.property.currentRent).toBe(2000);
      expect(result.analysis.suggestedRent).toBe(2050);
      expect(result.analysis.confidence).toBe('high');
      expect(result.comparables).toHaveLength(2);
      expect(result.metrics.monthlyIncrease).toBe(50);
      expect(result.metrics.annualIncrease).toBe(600);
      expect(result.recommendations).toBeDefined();
    });

    it('should handle property not found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);

      await expect(service.analyzePropertyRent('nonexistent'))
        .rejects.toThrow('Property not found');
    });

    it('should handle OpenAI API failures gracefully', async () => {
      const mockProperty = {
        id: 'prop1',
        rentAmount: 2000,
        bedrooms: 2,
        addressCity: 'Test City',
        addressState: 'CA',
        propertyType: 'APARTMENT',
        landlord: { id: 'landlord1' },
        leases: []
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.property.findMany.mockResolvedValue([]);
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));

      const result = await service.analyzePropertyRent('prop1');

      expect(result.analysis.confidence).toBe('low');
      expect(result.analysis.suggestedRent).toBeDefined();
      expect(result.analysis.reasoning).toContain('unavailability');
    });
  });

  describe('findComparableProperties', () => {
    it('should find and rank comparable properties', async () => {
      const targetProperty = {
        id: 'target',
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000,
        propertyType: 'APARTMENT',
        addressCity: 'Test City',
        addressState: 'CA'
      };

      const mockComparables = [
        {
          id: 'comp1',
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 1000,
          propertyType: 'APARTMENT',
          addressCity: 'Test City',
          addressState: 'CA',
          rentAmount: 2000,
          leases: []
        },
        {
          id: 'comp2',
          bedrooms: 1,
          bathrooms: 1,
          squareFeet: 800,
          propertyType: 'APARTMENT',
          addressCity: 'Test City',
          addressState: 'CA',
          rentAmount: 1800,
          leases: []
        }
      ];

      mockPrisma.property.findMany.mockResolvedValue(mockComparables);

      const result = await service.findComparableProperties(targetProperty);

      expect(result).toHaveLength(2);
      expect(result[0].similarityScore).toBeGreaterThan(result[1].similarityScore);
      expect(result[0].id).toBe('comp1'); // Exact match should rank higher
    });
  });

  describe('calculateSimilarityScore', () => {
    it('should calculate higher scores for more similar properties', () => {
      const target = {
        addressCity: 'Test City',
        addressZip: '12345',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000
      };

      const exactMatch = {
        addressCity: 'Test City',
        addressZip: '12345',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 1000
      };

      const partialMatch = {
        addressCity: 'Test City',
        addressZip: '54321',
        propertyType: 'APARTMENT',
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 800
      };

      const exactScore = service.calculateSimilarityScore(target, exactMatch);
      const partialScore = service.calculateSimilarityScore(target, partialMatch);

      expect(exactScore).toBeGreaterThan(partialScore);
      expect(exactScore).toBe(100); // Perfect match
    });
  });

  describe('getMarketData', () => {
    it('should calculate market statistics correctly', async () => {
      const property = {
        addressCity: 'Test City',
        addressState: 'CA',
        rentAmount: 2000
      };

      const mockMarketProperties = [
        { rentAmount: 1800, bedrooms: 1, squareFeet: 800, propertyType: 'APARTMENT', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { rentAmount: 2000, bedrooms: 2, squareFeet: 1000, propertyType: 'APARTMENT', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { rentAmount: 2200, bedrooms: 2, squareFeet: 1200, propertyType: 'CONDO', createdAt: new Date() },
        { rentAmount: 2400, bedrooms: 3, squareFeet: 1400, propertyType: 'HOUSE', createdAt: new Date() }
      ];

      mockPrisma.property.findMany.mockResolvedValue(mockMarketProperties);

      const result = await service.getMarketData(property);

      expect(result.averageRent).toBe(2100); // (1800+2000+2200+2400)/4
      expect(result.medianRent).toBe(2100); // Median of sorted [1800,2000,2200,2400]
      expect(result.marketSize).toBe(4);
      expect(result.byPropertyType).toBeDefined();
      expect(result.byBedrooms).toBeDefined();
      expect(result.trends).toBeDefined();
    });

    it('should handle empty market data', async () => {
      const property = {
        addressCity: 'Empty City',
        addressState: 'CA',
        rentAmount: 2000
      };

      mockPrisma.property.findMany.mockResolvedValue([]);

      const result = await service.getMarketData(property);

      expect(result.averageRent).toBe(2000);
      expect(result.medianRent).toBe(2000);
      expect(result.marketSize).toBe(0);
    });
  });

  describe('analyzePortfolio', () => {
    it('should analyze multiple properties and provide portfolio summary', async () => {
      const mockProperties = [
        {
          id: 'prop1',
          title: 'Property 1',
          rentAmount: 2000,
          landlordId: 'landlord1',
          status: 'ACTIVE',
          leases: []
        },
        {
          id: 'prop2',
          title: 'Property 2',
          rentAmount: 1800,
          landlordId: 'landlord1',
          status: 'ACTIVE',
          leases: []
        }
      ];

      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      // Mock individual property analyses
      const mockAnalysis1 = {
        analysis: { suggestedRent: 2100 },
        metrics: { annualIncrease: 1200, increasePercent: 5 }
      };
      const mockAnalysis2 = {
        analysis: { suggestedRent: 1900 },
        metrics: { annualIncrease: 1200, increasePercent: 5.5 }
      };

      // Mock the analyzePropertyRent method
      service.analyzePropertyRent = jest.fn()
        .mockResolvedValueOnce(mockAnalysis1)
        .mockResolvedValueOnce(mockAnalysis2);

      const result = await service.analyzePortfolio('landlord1');

      expect(result.portfolio).toHaveLength(2);
      expect(result.summary.totalProperties).toBe(2);
      expect(result.summary.totalCurrentRent).toBe(3800);
      expect(result.summary.totalOptimizedRent).toBe(4000);
      expect(result.summary.totalAnnualIncrease).toBe(2400);
      expect(result.priorityProperties).toBeDefined();
    });

    it('should handle empty portfolio', async () => {
      mockPrisma.property.findMany.mockResolvedValue([]);

      const result = await service.analyzePortfolio('landlord1');

      expect(result.portfolio).toHaveLength(0);
      expect(result.summary.totalProperties).toBe(0);
      expect(result.summary.totalCurrentRent).toBe(0);
    });
  });

  describe('calculateRentMetrics', () => {
    it('should calculate correct metrics for rent increase', () => {
      const property = { rentAmount: 2000 };
      const comparables = [
        { rentAmount: 2100 },
        { rentAmount: 2000 },
        { rentAmount: 2200 }
      ];
      const suggestedRent = 2100;

      const metrics = service.calculateRentMetrics(property, comparables, suggestedRent);

      expect(metrics.currentRent).toBe(2000);
      expect(metrics.suggestedRent).toBe(2100);
      expect(metrics.monthlyIncrease).toBe(100);
      expect(metrics.annualIncrease).toBe(1200);
      expect(metrics.increasePercent).toBe(5);
      expect(metrics.competitivePosition.totalComparables).toBe(3);
      expect(metrics.riskAssessment.level).toBe('low');
    });

    it('should assess high risk for large increases', () => {
      const property = { rentAmount: 1000 };
      const comparables = [{ rentAmount: 1200 }];
      const suggestedRent = 1250; // 25% increase

      const metrics = service.calculateRentMetrics(property, comparables, suggestedRent);

      expect(metrics.riskAssessment.level).toBe('high');
      expect(metrics.increasePercent).toBe(25);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate appropriate recommendations for different scenarios', () => {
      const property = { rentAmount: 2000 };
      const analysis = {
        marketPosition: 'below_market',
        confidence: 'high'
      };
      const metrics = {
        increasePercent: 15,
        riskAssessment: { level: 'high' }
      };

      const recommendations = service.generateRecommendations(property, analysis, metrics);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.some(r => r.type === 'pricing')).toBe(true);
      expect(recommendations.some(r => r.type === 'positioning')).toBe(true);
      expect(recommendations.some(r => r.type === 'risk')).toBe(true);
    });

    it('should suggest gradual increase for large rent changes', () => {
      const property = { rentAmount: 2000 };
      const analysis = { marketPosition: 'at_market', confidence: 'high' };
      const metrics = { increasePercent: 15, riskAssessment: { level: 'high' } };

      const recommendations = service.generateRecommendations(property, analysis, metrics);
      
      const gradualRec = recommendations.find(r => r.title.includes('Gradual'));
      expect(gradualRec).toBeDefined();
      expect(gradualRec.priority).toBe('high');
    });
  });

  describe('identifyPriorityProperties', () => {
    it('should identify and rank properties by optimization potential', () => {
      const analyses = [
        {
          propertyId: 'prop1',
          title: 'Property 1',
          currentRent: 2000,
          analysis: { suggestedRent: 2300, confidence: 'high' },
          metrics: { annualIncrease: 3600, increasePercent: 15 }
        },
        {
          propertyId: 'prop2',
          title: 'Property 2',
          currentRent: 1800,
          analysis: { suggestedRent: 1900, confidence: 'medium' },
          metrics: { annualIncrease: 1200, increasePercent: 5.5 }
        },
        {
          propertyId: 'prop3',
          title: 'Property 3',
          currentRent: 2200,
          analysis: { suggestedRent: 2150, confidence: 'low' },
          metrics: { annualIncrease: -600, increasePercent: -2.3 }
        }
      ];

      const priorities = service.identifyPriorityProperties(analyses);

      expect(priorities).toHaveLength(2); // Only properties with >5% increase
      expect(priorities[0].propertyId).toBe('prop1'); // Highest annual increase
      expect(priorities[0].priority).toBe('high'); // >2000 annual increase
      expect(priorities[1].propertyId).toBe('prop2');
      expect(priorities[1].priority).toBe('medium');
    });
  });
});