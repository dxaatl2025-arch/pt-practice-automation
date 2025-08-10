// server/src/services/aiScoringService.js
const RentalApplication = require('../models/RentalApplication');

class AIScoringService {
  constructor() {
    this.enabled = process.env.ENABLE_AI_SCORING === 'true';
    this.mockMode = process.env.NODE_ENV === 'development';
  }

  async scoreApplication(applicationId) {
    try {
      if (!this.enabled) {
        console.log('AI scoring is disabled');
        return null;
      }

      const application = await RentalApplication.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      let score, breakdown;

      if (this.mockMode) {
        // Mock scoring for development
        const mockResult = this.generateMockScore(application);
        score = mockResult.score;
        breakdown = mockResult.breakdown;
      } else {
        // Real AI scoring (integrate with your AI service)
        const realResult = await this.performRealAIScoring(application);
        score = realResult.score;
        breakdown = realResult.breakdown;
      }

      // Update application with AI score
      const updatedApplication = await RentalApplication.updateAIScore(
        applicationId, 
        score, 
        breakdown
      );

      console.log(`AI scoring completed for application ${application.application_number}: ${score}/100`);

      return {
        applicationId,
        applicationNumber: application.application_number,
        score,
        breakdown,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('AI scoring error:', error);
      throw error;
    }
  }

  generateMockScore(application) {
    // Mock scoring algorithm based on various factors
    let score = 50; // Base score
    const breakdown = {
      income_score: 0,
      employment_score: 0,
      housing_history_score: 0,
      reference_score: 0,
      background_score: 0,
      overall_factors: []
    };

    // Income scoring (30% weight)
    const monthlyIncome = parseFloat(application.monthly_gross_income) || 0;
    if (monthlyIncome >= 5000) {
      breakdown.income_score = 30;
      breakdown.overall_factors.push('Excellent income level');
    } else if (monthlyIncome >= 3500) {
      breakdown.income_score = 25;
      breakdown.overall_factors.push('Good income level');
    } else if (monthlyIncome >= 2500) {
      breakdown.income_score = 20;
      breakdown.overall_factors.push('Moderate income level');
    } else if (monthlyIncome >= 1500) {
      breakdown.income_score = 15;
      breakdown.overall_factors.push('Below average income level');
    } else {
      breakdown.income_score = 10;
      breakdown.overall_factors.push('Low income level');
    }

    // Employment stability (25% weight)
    const employmentLength = application.employment_length || '';
    if (employmentLength.includes('year')) {
      const years = parseInt(employmentLength.match(/(\d+)\s*year/)?.[1] || '0');
      if (years >= 3) {
        breakdown.employment_score = 25;
        breakdown.overall_factors.push('Excellent employment stability');
      } else if (years >= 2) {
        breakdown.employment_score = 20;
        breakdown.overall_factors.push('Good employment stability');
      } else if (years >= 1) {
        breakdown.employment_score = 15;
        breakdown.overall_factors.push('Moderate employment stability');
      } else {
        breakdown.employment_score = 10;
        breakdown.overall_factors.push('Limited employment history');
      }
    } else {
      breakdown.employment_score = 10;
      breakdown.overall_factors.push('Short employment duration');
    }

    // Housing history (20% weight)
    let housingScore = 15; // Base housing score
    if (application.late_rent_history) {
      housingScore -= 5;
      breakdown.overall_factors.push('Previous late rent payments');
    }
    if (application.previous_landlord_name) {
      housingScore += 5;
      breakdown.overall_factors.push('Previous landlord reference available');
    }
    breakdown.housing_history_score = Math.max(0, Math.min(20, housingScore));

    // Reference quality (10% weight)
    if (application.reference_name && application.reference_contact) {
      breakdown.reference_score = 10;
      breakdown.overall_factors.push('Complete reference information provided');
    } else {
      breakdown.reference_score = 5;
      breakdown.overall_factors.push('Incomplete reference information');
    }

    // Background factors (15% weight)
    let backgroundScore = 15; // Base background score
    if (application.ever_evicted) {
      backgroundScore -= 10;
      breakdown.overall_factors.push('Previous eviction history');
    }
    if (application.criminal_conviction) {
      backgroundScore -= 5;
      breakdown.overall_factors.push('Criminal conviction disclosed');
    }
    if (application.background_check_consent) {
      breakdown.overall_factors.push('Background check consent provided');
    } else {
      backgroundScore -= 15;
      breakdown.overall_factors.push('Background check consent required');
    }
    breakdown.background_score = Math.max(0, backgroundScore);

    // Calculate total score
    score = breakdown.income_score + 
            breakdown.employment_score + 
            breakdown.housing_history_score + 
            breakdown.reference_score + 
            breakdown.background_score;

    // Add some randomness for mock data
    const randomAdjustment = (Math.random() - 0.5) * 10;
    score = Math.max(0, Math.min(100, Math.round(score + randomAdjustment)));

    // Add risk assessment
    if (score >= 80) {
      breakdown.risk_level = 'Low Risk';
      breakdown.recommendation = 'Highly recommended for approval';
    } else if (score >= 65) {
      breakdown.risk_level = 'Medium-Low Risk';
      breakdown.recommendation = 'Recommended for approval with standard terms';
    } else if (score >= 50) {
      breakdown.risk_level = 'Medium Risk';
      breakdown.recommendation = 'Consider approval with additional security deposit';
    } else if (score >= 35) {
      breakdown.risk_level = 'Medium-High Risk';
      breakdown.recommendation = 'Requires careful review and additional verification';
    } else {
      breakdown.risk_level = 'High Risk';
      breakdown.recommendation = 'Not recommended for approval';
    }

    return { score, breakdown };
  }

  async performRealAIScoring(application) {
    // This is where you would integrate with actual AI services
    // For now, fall back to mock scoring
    return this.generateMockScore(application);
  }

  // Batch scoring for multiple applications
  async scoreMultipleApplications(applicationIds) {
    const results = [];
    
    for (const id of applicationIds) {
      try {
        const result = await this.scoreApplication(id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to score application ${id}:`, error);
        results.push({
          applicationId: id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  // Get scoring statistics
  async getScoringStats() {
    try {
      const stats = await RentalApplication.getApplicationStats();
      
      return {
        total_scored: parseInt(stats.total_applications) || 0,
        average_score: parseFloat(stats.avg_ai_score) || 0,
        scoring_enabled: this.enabled,
        mock_mode: this.mockMode
      };
    } catch (error) {
      console.error('Error getting scoring stats:', error);
      return null;
    }
  }
}

module.exports = new AIScoringService();