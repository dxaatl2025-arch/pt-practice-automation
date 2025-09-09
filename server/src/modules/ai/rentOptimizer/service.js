const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class RentOptimizerService {
  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze market rent for a property and provide optimization recommendations
   */
  async analyzePropertyRent(propertyId, options = {}) {
    try {
      // Get the target property
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          landlord: true,
          leases: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1
          }
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Find comparable properties
      const comparables = await this.findComparableProperties(property);

      // Get market data and trends
      const marketData = await this.getMarketData(property);

      // Calculate optimal rent using AI analysis
      const aiAnalysis = await this.generateRentAnalysis(property, comparables, marketData, options);

      // Calculate metrics
      const metrics = await this.calculateRentMetrics(property, comparables, aiAnalysis.suggestedRent);

      return {
        property: {
          id: property.id,
          title: property.title,
          currentRent: property.rentAmount,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.squareFeet,
          address: this.formatAddress(property)
        },
        analysis: aiAnalysis,
        comparables: comparables.slice(0, 5), // Top 5 comparables
        marketData,
        metrics,
        recommendations: this.generateRecommendations(property, aiAnalysis, metrics)
      };

    } catch (error) {
      console.error('Error analyzing property rent:', error);
      throw new Error('Failed to analyze property rent');
    }
  }

  /**
   * Find comparable properties based on location, size, and type
   */
  async findComparableProperties(targetProperty) {
    // Build search criteria
    const criteria = {
      status: 'ACTIVE',
      isAvailable: false, // Currently leased properties for market data
      id: { not: targetProperty.id },
      propertyType: targetProperty.propertyType
    };

    // Location-based filtering (same city/state)
    if (targetProperty.addressCity && targetProperty.addressState) {
      criteria.addressCity = targetProperty.addressCity;
      criteria.addressState = targetProperty.addressState;
    }

    // Size-based filtering (within reasonable range)
    if (targetProperty.bedrooms !== null) {
      criteria.bedrooms = {
        gte: Math.max(0, targetProperty.bedrooms - 1),
        lte: targetProperty.bedrooms + 1
      };
    }

    if (targetProperty.squareFeet) {
      const sqftRange = targetProperty.squareFeet * 0.3; // 30% variance
      criteria.squareFeet = {
        gte: targetProperty.squareFeet - sqftRange,
        lte: targetProperty.squareFeet + sqftRange
      };
    }

    const comparables = await this.prisma.property.findMany({
      where: criteria,
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      },
      take: 20
    });

    // Calculate similarity scores and sort
    return comparables
      .map(comp => ({
        ...comp,
        similarityScore: this.calculateSimilarityScore(targetProperty, comp)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Calculate similarity score between properties
   */
  calculateSimilarityScore(target, comparable) {
    let score = 0;

    // Location match (high weight)
    if (target.addressCity === comparable.addressCity) score += 30;
    if (target.addressZip === comparable.addressZip) score += 20;

    // Property type match
    if (target.propertyType === comparable.propertyType) score += 15;

    // Bedroom match
    if (target.bedrooms === comparable.bedrooms) score += 15;
    else if (Math.abs(target.bedrooms - comparable.bedrooms) <= 1) score += 8;

    // Bathroom similarity
    if (target.bathrooms === comparable.bathrooms) score += 10;
    else if (Math.abs(target.bathrooms - comparable.bathrooms) <= 0.5) score += 5;

    // Square footage similarity
    if (target.squareFeet && comparable.squareFeet) {
      const sqftDiff = Math.abs(target.squareFeet - comparable.squareFeet);
      const sqftPercent = sqftDiff / target.squareFeet;
      if (sqftPercent <= 0.1) score += 10; // Within 10%
      else if (sqftPercent <= 0.2) score += 5; // Within 20%
    }

    return score;
  }

  /**
   * Get market data and trends for the property area
   */
  async getMarketData(property) {
    try {
      // Get all active properties in the same market
      const marketProperties = await this.prisma.property.findMany({
        where: {
          addressCity: property.addressCity,
          addressState: property.addressState,
          status: 'ACTIVE',
          rentAmount: { not: null }
        },
        select: {
          id: true,
          rentAmount: true,
          bedrooms: true,
          bathrooms: true,
          squareFeet: true,
          propertyType: true,
          createdAt: true
        }
      });

      if (marketProperties.length === 0) {
        return {
          averageRent: property.rentAmount || 0,
          medianRent: property.rentAmount || 0,
          marketSize: 0,
          trends: { direction: 'stable', confidence: 'low' }
        };
      }

      // Calculate market statistics
      const rents = marketProperties.map(p => p.rentAmount).sort((a, b) => a - b);
      const averageRent = rents.reduce((sum, rent) => sum + rent, 0) / rents.length;
      const medianRent = rents[Math.floor(rents.length / 2)];

      // Calculate rent per square foot
      const propertiesWithSqft = marketProperties.filter(p => p.squareFeet > 0);
      const avgRentPerSqft = propertiesWithSqft.length > 0
        ? propertiesWithSqft.reduce((sum, p) => sum + (p.rentAmount / p.squareFeet), 0) / propertiesWithSqft.length
        : 0;

      // Simple trend analysis (properties listed recently vs older)
      const recentCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      const recentProperties = marketProperties.filter(p => new Date(p.createdAt) > recentCutoff);
      const olderProperties = marketProperties.filter(p => new Date(p.createdAt) <= recentCutoff);

      let trends = { direction: 'stable', confidence: 'medium' };
      if (recentProperties.length > 0 && olderProperties.length > 0) {
        const recentAvg = recentProperties.reduce((sum, p) => sum + p.rentAmount, 0) / recentProperties.length;
        const olderAvg = olderProperties.reduce((sum, p) => sum + p.rentAmount, 0) / olderProperties.length;
        
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        if (changePercent > 5) trends = { direction: 'increasing', confidence: 'medium', change: changePercent };
        else if (changePercent < -5) trends = { direction: 'decreasing', confidence: 'medium', change: changePercent };
      }

      return {
        averageRent: Math.round(averageRent),
        medianRent: Math.round(medianRent),
        rentPerSqft: Math.round(avgRentPerSqft * 100) / 100,
        marketSize: marketProperties.length,
        trends,
        byPropertyType: this.calculateTypeStats(marketProperties),
        byBedrooms: this.calculateBedroomStats(marketProperties)
      };

    } catch (error) {
      console.error('Error getting market data:', error);
      return {
        averageRent: property.rentAmount || 0,
        medianRent: property.rentAmount || 0,
        marketSize: 0,
        trends: { direction: 'stable', confidence: 'low' }
      };
    }
  }

  /**
   * Calculate statistics by property type
   */
  calculateTypeStats(properties) {
    const byType = {};
    properties.forEach(p => {
      if (!byType[p.propertyType]) {
        byType[p.propertyType] = { count: 0, totalRent: 0, rents: [] };
      }
      byType[p.propertyType].count++;
      byType[p.propertyType].totalRent += p.rentAmount;
      byType[p.propertyType].rents.push(p.rentAmount);
    });

    Object.keys(byType).forEach(type => {
      const data = byType[type];
      data.averageRent = Math.round(data.totalRent / data.count);
      data.medianRent = Math.round(data.rents.sort((a, b) => a - b)[Math.floor(data.rents.length / 2)]);
      delete data.totalRent;
      delete data.rents;
    });

    return byType;
  }

  /**
   * Calculate statistics by bedroom count
   */
  calculateBedroomStats(properties) {
    const byBedrooms = {};
    properties.forEach(p => {
      const key = p.bedrooms || '0';
      if (!byBedrooms[key]) {
        byBedrooms[key] = { count: 0, totalRent: 0, rents: [] };
      }
      byBedrooms[key].count++;
      byBedrooms[key].totalRent += p.rentAmount;
      byBedrooms[key].rents.push(p.rentAmount);
    });

    Object.keys(byBedrooms).forEach(bedrooms => {
      const data = byBedrooms[bedrooms];
      data.averageRent = Math.round(data.totalRent / data.count);
      data.medianRent = Math.round(data.rents.sort((a, b) => a - b)[Math.floor(data.rents.length / 2)]);
      delete data.totalRent;
      delete data.rents;
    });

    return byBedrooms;
  }

  /**
   * Generate AI-powered rent analysis
   */
  async generateRentAnalysis(property, comparables, marketData, options = {}) {
    try {
      const comparableData = comparables.slice(0, 5).map(comp => ({
        bedrooms: comp.bedrooms,
        bathrooms: comp.bathrooms,
        squareFeet: comp.squareFeet,
        rentAmount: comp.rentAmount,
        propertyType: comp.propertyType,
        similarityScore: comp.similarityScore
      }));

      const systemPrompt = `You are an expert real estate analyst specializing in rental property pricing. Analyze the provided property and market data to suggest an optimal rent price.

Property to Analyze:
- Type: ${property.propertyType}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Square Feet: ${property.squareFeet || 'Not specified'}
- Current Rent: $${property.rentAmount || 'Not set'}
- Location: ${property.addressCity}, ${property.addressState}

Market Data:
- Average Rent in Area: $${marketData.averageRent}
- Median Rent in Area: $${marketData.medianRent}
- Market Trend: ${marketData.trends.direction}
- Properties in Analysis: ${marketData.marketSize}

Comparable Properties:
${comparableData.map((comp, i) => 
  `${i + 1}. ${comp.bedrooms}BR/${comp.bathrooms}BA, ${comp.squareFeet || '?'} sqft, $${comp.rentAmount} (${comp.propertyType})`
).join('\n')}

Provide your analysis in JSON format with:
- suggestedRent (number): Your recommended rent price
- confidence (string): "high", "medium", or "low"
- reasoning (string): 2-3 sentences explaining your recommendation
- adjustmentFactors (array): Factors that influenced your decision
- rentRange (object): {min: number, max: number} for rent range
- marketPosition (string): "below_market", "at_market", or "above_market"`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this property and suggest optimal rent. Consider the goal: ${options.goal || 'maximize_revenue'}`
          }
        ],
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      
      // Validate and sanitize the analysis
      return {
        suggestedRent: Math.round(analysis.suggestedRent || marketData.averageRent),
        confidence: analysis.confidence || 'medium',
        reasoning: analysis.reasoning || 'Analysis based on market comparables and trends.',
        adjustmentFactors: Array.isArray(analysis.adjustmentFactors) ? analysis.adjustmentFactors : [],
        rentRange: {
          min: Math.round(analysis.rentRange?.min || analysis.suggestedRent * 0.9),
          max: Math.round(analysis.rentRange?.max || analysis.suggestedRent * 1.1)
        },
        marketPosition: analysis.marketPosition || 'at_market'
      };

    } catch (error) {
      console.error('Error generating AI rent analysis:', error);
      
      // Fallback analysis if AI fails
      const suggestedRent = Math.round(marketData.averageRent || property.rentAmount);
      return {
        suggestedRent,
        confidence: 'low',
        reasoning: 'Analysis based on market average due to AI service unavailability.',
        adjustmentFactors: ['market_average'],
        rentRange: {
          min: Math.round(suggestedRent * 0.9),
          max: Math.round(suggestedRent * 1.1)
        },
        marketPosition: 'at_market'
      };
    }
  }

  /**
   * Calculate rent optimization metrics
   */
  calculateRentMetrics(property, comparables, suggestedRent) {
    const currentRent = property.rentAmount || 0;
    
    // Revenue impact
    const monthlyIncrease = suggestedRent - currentRent;
    const annualIncrease = monthlyIncrease * 12;
    
    // Market positioning
    const comparableRents = comparables.map(c => c.rentAmount).filter(Boolean);
    const avgComparable = comparableRents.length > 0 
      ? comparableRents.reduce((sum, rent) => sum + rent, 0) / comparableRents.length 
      : currentRent;

    // Competitive analysis
    const belowMarketCount = comparableRents.filter(rent => suggestedRent < rent).length;
    const aboveMarketCount = comparableRents.filter(rent => suggestedRent > rent).length;
    
    // Risk assessment
    let riskLevel = 'medium';
    const increasePercent = currentRent > 0 ? (monthlyIncrease / currentRent) * 100 : 0;
    
    if (increasePercent > 20) riskLevel = 'high';
    else if (increasePercent < 5) riskLevel = 'low';

    return {
      currentRent,
      suggestedRent,
      monthlyIncrease: Math.round(monthlyIncrease),
      annualIncrease: Math.round(annualIncrease),
      increasePercent: Math.round(increasePercent * 100) / 100,
      competitivePosition: {
        belowMarketCount,
        aboveMarketCount,
        totalComparables: comparableRents.length,
        averageComparable: Math.round(avgComparable)
      },
      riskAssessment: {
        level: riskLevel,
        factors: this.generateRiskFactors(increasePercent, comparableRents.length, suggestedRent, avgComparable)
      }
    };
  }

  /**
   * Generate risk factors for rent increase
   */
  generateRiskFactors(increasePercent, comparableCount, suggestedRent, avgComparable) {
    const factors = [];
    
    if (increasePercent > 15) factors.push('Large rent increase may reduce tenant retention');
    if (increasePercent < 0) factors.push('Rent decrease may be needed for market competitiveness');
    if (comparableCount < 3) factors.push('Limited market data increases uncertainty');
    if (suggestedRent > avgComparable * 1.1) factors.push('Above-market pricing may reduce demand');
    if (suggestedRent < avgComparable * 0.9) factors.push('Below-market pricing may indicate missed revenue');
    
    return factors;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(property, analysis, metrics) {
    const recommendations = [];
    
    // Rent adjustment recommendations
    if (metrics.increasePercent > 10) {
      recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: 'Consider Gradual Rent Increase',
        description: `The suggested ${metrics.increasePercent.toFixed(1)}% increase is significant. Consider implementing it gradually over 2-3 lease renewals.`
      });
    } else if (metrics.increasePercent > 5) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Implement Rent Increase',
        description: `Market analysis supports a ${metrics.increasePercent.toFixed(1)}% rent increase to ${analysis.suggestedRent}.`
      });
    }

    // Market position recommendations
    if (analysis.marketPosition === 'below_market') {
      recommendations.push({
        type: 'positioning',
        priority: 'high',
        title: 'Below-Market Pricing Opportunity',
        description: 'Your property is priced below market rate. Consider raising rent to capture additional revenue.'
      });
    } else if (analysis.marketPosition === 'above_market') {
      recommendations.push({
        type: 'positioning',
        priority: 'medium',
        title: 'Premium Pricing Strategy',
        description: 'Your property is priced above market. Ensure amenities and condition justify the premium.'
      });
    }

    // Risk mitigation recommendations
    if (metrics.riskAssessment.level === 'high') {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'High Risk - Tenant Communication',
        description: 'Given the significant change, communicate value improvements and market conditions to tenants.'
      });
    }

    // Property improvement recommendations
    if (analysis.confidence === 'low') {
      recommendations.push({
        type: 'data',
        priority: 'medium',
        title: 'Improve Property Data',
        description: 'Add missing property details (square footage, amenities) to get more accurate pricing analysis.'
      });
    }

    // Timing recommendations
    recommendations.push({
      type: 'timing',
      priority: 'low',
      title: 'Optimal Implementation Timing',
      description: `Best to implement rent changes during lease renewals or ${this.getOptimalSeasonality()} season.`
    });

    return recommendations;
  }

  /**
   * Get optimal seasonality for rent changes
   */
  getOptimalSeasonality() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring'; // March-May
    if (month >= 5 && month <= 7) return 'summer'; // June-August
    if (month >= 8 && month <= 10) return 'fall'; // September-November
    return 'winter'; // December-February
  }

  /**
   * Format property address for display
   */
  formatAddress(property) {
    const parts = [
      property.addressStreet,
      property.addressCity,
      property.addressState,
      property.addressZip
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Get rent optimization insights for multiple properties (portfolio analysis)
   */
  async analyzePortfolio(landlordId, options = {}) {
    try {
      // Get all properties for the landlord
      const properties = await this.prisma.property.findMany({
        where: {
          landlordId,
          status: 'ACTIVE'
        },
        include: {
          leases: {
            where: { status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            take: 1
          }
        }
      });

      if (properties.length === 0) {
        return {
          portfolio: [],
          summary: {
            totalProperties: 0,
            totalCurrentRent: 0,
            totalOptimizedRent: 0,
            totalAnnualIncrease: 0
          }
        };
      }

      // Analyze each property
      const analyses = await Promise.all(
        properties.map(async (property) => {
          try {
            const analysis = await this.analyzePropertyRent(property.id, options);
            return {
              propertyId: property.id,
              title: property.title,
              currentRent: property.rentAmount || 0,
              ...analysis
            };
          } catch (error) {
            console.error(`Error analyzing property ${property.id}:`, error);
            return {
              propertyId: property.id,
              title: property.title,
              currentRent: property.rentAmount || 0,
              error: 'Analysis failed'
            };
          }
        })
      );

      // Calculate portfolio summary
      const validAnalyses = analyses.filter(a => !a.error);
      const summary = {
        totalProperties: properties.length,
        analyzedProperties: validAnalyses.length,
        totalCurrentRent: validAnalyses.reduce((sum, a) => sum + a.currentRent, 0),
        totalOptimizedRent: validAnalyses.reduce((sum, a) => sum + a.analysis.suggestedRent, 0),
        totalAnnualIncrease: validAnalyses.reduce((sum, a) => sum + a.metrics.annualIncrease, 0),
        averageIncreasePercent: validAnalyses.length > 0 
          ? validAnalyses.reduce((sum, a) => sum + a.metrics.increasePercent, 0) / validAnalyses.length 
          : 0
      };

      return {
        portfolio: analyses,
        summary: {
          ...summary,
          totalCurrentRent: Math.round(summary.totalCurrentRent),
          totalOptimizedRent: Math.round(summary.totalOptimizedRent),
          totalAnnualIncrease: Math.round(summary.totalAnnualIncrease),
          averageIncreasePercent: Math.round(summary.averageIncreasePercent * 100) / 100
        },
        priorityProperties: this.identifyPriorityProperties(validAnalyses)
      };

    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw new Error('Failed to analyze portfolio');
    }
  }

  /**
   * Identify properties that should be prioritized for rent optimization
   */
  identifyPriorityProperties(analyses) {
    return analyses
      .filter(a => a.metrics.increasePercent > 5) // At least 5% increase potential
      .sort((a, b) => b.metrics.annualIncrease - a.metrics.annualIncrease) // Sort by annual increase potential
      .slice(0, 10) // Top 10 priority properties
      .map(a => ({
        propertyId: a.propertyId,
        title: a.title,
        currentRent: a.currentRent,
        suggestedRent: a.analysis.suggestedRent,
        annualIncrease: a.metrics.annualIncrease,
        confidence: a.analysis.confidence,
        priority: a.metrics.annualIncrease > 2000 ? 'high' : 'medium'
      }));
  }
}

module.exports = RentOptimizerService;