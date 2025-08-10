// server/src/controllers/rentalApplicationController.js
const RentalApplication = require('../models/RentalApplication');

class RentalApplicationController {
  // Submit a new rental application
  static async submitApplication(req, res) {
    try {
      // Extract IP address and user agent for tracking
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Validate required fields
      const validationErrors = RentalApplicationController.validateApplicationData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors found',
          errors: validationErrors
        });
      }

      // Prepare application data
      const applicationData = {
        ...req.body,
        ipAddress,
        userAgent
      };

      // Create application
      const application = await RentalApplication.create(applicationData);

      // Try to generate PDF and send emails (don't fail if these fail)
      try {
        // Generate PDF
        const pdfService = require('../services/pdfService');
        const pdfBuffer = await pdfService.generateApplicationPDF(application);

        // Send email to landlord with PDF attachment
        if (application.landlord_id) {
          try {
            const emailService = require('../services/emailService');
            await emailService.sendApplicationToLandlord(application, pdfBuffer);
          } catch (emailError) {
            console.error('Failed to send email to landlord:', emailError);
          }
        }

        // Send confirmation email to applicant
        try {
          const emailService = require('../services/emailService');
          await emailService.sendApplicationConfirmation(application);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      } catch (serviceError) {
        console.error('PDF/Email service error:', serviceError);
        // Continue anyway - application was saved
      }

      // Trigger AI scoring in background (don't wait for result)
      if (process.env.ENABLE_AI_SCORING === 'true') {
        try {
          const aiScoringService = require('../services/aiScoringService');
          aiScoringService.scoreApplication(application.id).catch(err => {
            console.error('AI scoring failed:', err);
          });
        } catch (aiError) {
          console.error('AI scoring service error:', aiError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationNumber: application.application_number,
          id: application.id,
          status: application.application_status
        }
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get application by ID or application number
  static async getApplication(req, res) {
    try {
      const { id } = req.params;
      
      let application;
      if (id.startsWith('APP')) {
        // Search by application number
        application = await RentalApplication.findByApplicationNumber(id);
      } else {
        // Search by ID
        application = await RentalApplication.findById(id);
      }

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: RentalApplication.formatApplicationForPDF(application)
      });

    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get applications for a landlord
  static async getLandlordApplications(req, res) {
    try {
      const { landlordId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const applications = await RentalApplication.findByLandlord(
        landlordId, 
        status || null
      );

      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedApplications = applications.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedApplications.map(app => RentalApplication.formatApplicationForPDF(app)),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(applications.length / limit),
          totalItems: applications.length,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching landlord applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch applications',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update application status
  static async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const actorId = req.user?.id; // Assuming auth middleware sets req.user

      const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      const application = await RentalApplication.updateStatus(
        id, 
        status, 
        'landlord', 
        actorId
      );

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Send status update email to applicant
      try {
        const emailService = require('../services/emailService');
        await emailService.sendStatusUpdateToApplicant(application, status, reason);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      res.json({
        success: true,
        message: 'Application status updated successfully',
        data: {
          id: application.id,
          applicationNumber: application.application_number,
          status: application.application_status,
          updatedAt: application.updated_at
        }
      });

    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update application status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Search applications with filters
  static async searchApplications(req, res) {
    try {
      const searchParams = {
        email: req.query.email,
        name: req.query.name,
        status: req.query.status,
        landlordId: req.query.landlordId,
        propertyId: req.query.propertyId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        limit: req.query.limit,
        offset: req.query.offset
      };

      const applications = await RentalApplication.searchApplications(searchParams);

      res.json({
        success: true,
        data: applications.map(app => RentalApplication.formatApplicationForPDF(app))
      });

    } catch (error) {
      console.error('Error searching applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search applications',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get application statistics
  static async getApplicationStats(req, res) {
    try {
      const { landlordId } = req.query;
      
      const stats = await RentalApplication.getApplicationStats(landlordId || null);

      res.json({
        success: true,
        data: {
          ...stats,
          avg_ai_score: stats.avg_ai_score ? parseFloat(stats.avg_ai_score).toFixed(2) : null
        }
      });

    } catch (error) {
      console.error('Error fetching application stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch application statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Download application as PDF
  static async downloadApplicationPDF(req, res) {
    try {
      const { id } = req.params;
      
      const application = await RentalApplication.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const pdfService = require('../services/pdfService');
      const pdfBuffer = await pdfService.generateApplicationPDF(application);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="application-${application.application_number}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Validation helper method
  static validateApplicationData(data) {
    const errors = [];

    // Required fields validation
    const requiredFields = [
      'fullName', 'dateOfBirth', 'email', 'phone', 'currentAddress',
      'currentAddressDuration', 'reasonForMoving', 'employerName', 'jobTitle',
      'employerAddress', 'employerPhone', 'employmentLength', 'monthlyGrossIncome',
      'referenceName', 'referenceRelationship', 'referenceContact',
      'desiredMoveInDate', 'backgroundCheckConsent'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    // Email validation
    if (data.email && !RentalApplication.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (data.phone && !RentalApplication.validatePhone(data.phone)) {
      errors.push('Invalid phone format');
    }

    // Date validation
    if (data.dateOfBirth && !RentalApplication.validateDate(data.dateOfBirth)) {
      errors.push('Invalid date of birth format');
    }

    if (data.desiredMoveInDate && !RentalApplication.validateDate(data.desiredMoveInDate)) {
      errors.push('Invalid desired move-in date format');
    }

    // Age validation (must be 18+)
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.push('Applicant must be 18 years or older');
      }
    }

    // Income validation
    if (data.monthlyGrossIncome && (isNaN(data.monthlyGrossIncome) || data.monthlyGrossIncome <= 0)) {
      errors.push('Monthly gross income must be a positive number');
    }

    // Number of occupants validation
    if (data.numberOfOccupants && (isNaN(data.numberOfOccupants) || data.numberOfOccupants < 1)) {
      errors.push('Number of occupants must be at least 1');
    }

    // Background check consent validation
    if (!data.backgroundCheckConsent) {
      errors.push('Background check consent is required');
    }

    return errors;
  }
}

module.exports = RentalApplicationController;