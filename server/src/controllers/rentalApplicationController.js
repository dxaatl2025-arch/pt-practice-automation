// server/src/controllers/rentalApplicationController.js
const prisma = require('../config/prisma');

class RentalApplicationController {
  // NEW METHOD: List applications with role-based access control
  static async listApplications(req, res) {
    try {
      const { 
        applicantId, 
        landlordId, 
        propertyId, 
        status, 
        page = 1, 
        limit = 20,
        search 
      } = req.query;

      // Get user information from request (from auth middleware)
      const userId = req.user?.id;
      const userRole = req.user?.role;

      console.log('🔍 listApplications called:', { 
        userId, 
        userRole, 
        query: req.query 
      });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Build Prisma where conditions based on user role and query parameters
      let whereConditions = {};

      if (userRole === 'TENANT') {
  console.log('🔍 Debug - userId:', userId, 'userRole:', userRole, 'applicantId:', applicantId);
  console.log('🔍 Debug - req.user.firebaseUid:', req.user?.firebaseUid);

  // TENANT: Can only see their own applications
  // The applicantId parameter should match their Firebase UID
  if (applicantId && applicantId !== req.user.firebaseUid) {
    console.log('❌ Access denied - applicantId mismatch:', {
      requestedApplicantId: applicantId,
      userFirebaseUid: req.user.firebaseUid,
      userDatabaseId: userId
    });
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own applications.'
    });
  }
  
  // Filter by the tenant's Firebase UID (applicantId field in applications table)
  whereConditions.applicantId = req.user.firebaseUid;
  console.log('✅ Tenant access granted, filtering by Firebase UID:', req.user.firebaseUid);

      } else if (userRole === 'LANDLORD') {
        // LANDLORD: Can see applications for their properties only
        if (landlordId && parseInt(landlordId) !== parseInt(userId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view applications for your properties.'
          });
        }

        // Filter by landlord's properties using nested where condition
        whereConditions.property = {
          landlordId: userId  // Using landlordId from schema
        };
        
        // Additional filtering by propertyId if specified
        if (propertyId) {
          whereConditions.propertyId = propertyId;  // Keep as string (cuid)
        }

      } else if (userRole === 'ADMIN') {
        // ADMIN: Can see all applications with filters
        if (landlordId) {
          whereConditions.property = {
            landlordId: landlordId  // Using landlordId from schema
          };
        }
        if (propertyId) {
          whereConditions.propertyId = propertyId;  // Keep as string (cuid)
        }
        if (applicantId) {
          whereConditions.applicantId = applicantId;
        }

      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Invalid user role.'
        });
      }

      // Add status filter if provided
      if (status) {
        whereConditions.status = status.toLowerCase(); // Ensure consistent case
      }

      // Add search functionality for name and email
      if (search) {
        whereConditions.OR = [
          {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      console.log('🔍 Prisma where conditions:', JSON.stringify(whereConditions, null, 2));

      // Execute Prisma queries
      const [applications, total] = await Promise.all([
        // Get applications with related data
        prisma.application.findMany({
          where: whereConditions,
          skip,
          take,
          orderBy: {
            submittedAt: 'desc'
          },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                addressStreet: true,
                addressCity: true,
                addressState: true,
                addressZip: true,
                rentAmount: true,
                bedrooms: true,
                bathrooms: true,
                landlord: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }),
        
        // Get total count for pagination
        prisma.application.count({
          where: whereConditions
        })
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / take);

      // Format the response data
      const formattedApplications = applications.map(app => ({
        id: app.id,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        monthlyIncome: app.monthlyIncome,
        occupants: app.occupants,
        desiredMoveIn: app.desiredMoveIn,
        // Include property info for tenant view
        property: app.property ? {
          id: app.property.id,
          title: app.property.title,
          addressStreet: app.property.addressStreet,
          addressCity: app.property.addressCity,
          addressState: app.property.addressState,
          addressZip: app.property.addressZip,
          rentAmount: app.property.rentAmount,
          bedrooms: app.property.bedrooms,
          bathrooms: app.property.bathrooms,
          // Include landlord info only for tenant view or admin
          ...(userRole === 'TENANT' || userRole === 'ADMIN' ? {
            landlord: app.property.landlord
          } : {})
        } : null
      }));

      console.log(`✅ Found ${applications.length} applications (total: ${total})`);

      res.json({
        success: true,
        data: formattedApplications,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasMore: parseInt(page) < totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPreviousPage: parseInt(page) > 1
        },
        meta: {
          userRole,
          filterApplied: Object.keys(whereConditions).length > 0,
          resultCount: applications.length
        }
      });

    } catch (error) {
      console.error('❌ Error in listApplications:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'No applications found'
        });
      }
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Invalid filter parameters'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve applications',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

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
      const application = await prisma.application.create({
        data: applicationData
      });

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
          applicationNumber: application.id,
          id: application.id,
          status: application.status
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
        application = await prisma.application.findFirst({
          where: { applicationNumber: id }
        });
      } else {
        // Search by ID
        application = await prisma.application.findUnique({
          where: { id: id }  // Keep as string (cuid)
        });
      }

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      res.json({
        success: true,
        data: application
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

      // Fixed: Use proper pagination with Prisma
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where: {
            ...(landlordId && { property: { landlordId: landlordId } }),  // Using landlordId from schema
            ...(status && { status })
          },
          include: {
            property: true
          },
          skip,
          take,
          orderBy: { submittedAt: 'desc' }
        }),

        prisma.application.count({
          where: {
            ...(landlordId && { property: { landlordId: landlordId } }),
            ...(status && { status })
          }
        })
      ]);

      res.json({
        success: true,
        data: applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / take),
          totalItems: total,
          itemsPerPage: take
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

      const application = await prisma.application.update({
        where: { id: id },  // Keep as string (cuid)
        data: {
          status,
          reviewedAt: new Date(),
          reviewNotes: reason
        }
      });

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
          status: application.status,
          updatedAt: application.updatedAt
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

      const applications = await prisma.application.findMany({
        where: {
          ...(searchParams.email && { email: { contains: searchParams.email, mode: 'insensitive' } }),
          ...(searchParams.status && { status: searchParams.status }),
          ...(searchParams.propertyId && { propertyId: searchParams.propertyId }),  // Keep as string
          ...(searchParams.dateFrom && { 
            submittedAt: { gte: new Date(searchParams.dateFrom) }
          }),
          ...(searchParams.dateTo && { 
            submittedAt: { lte: new Date(searchParams.dateTo) }
          })
        },
        include: {
          property: true
        },
        take: parseInt(searchParams.limit) || 50,
        skip: parseInt(searchParams.offset) || 0,
        orderBy: { submittedAt: 'desc' }
      });

      res.json({
        success: true,
        data: applications
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
      
      const stats = await prisma.application.aggregate({
        _count: { id: true },
        where: landlordId ? { property: { landlordId: landlordId } } : undefined
      });

      res.json({
        success: true,
        data: {
          totalApplications: stats._count.id
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
      
      const application = await prisma.application.findUnique({
        where: { id: id }  // Keep as string (cuid)
      });
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const pdfService = require('../services/pdfService');
      const pdfBuffer = await pdfService.generateApplicationPDF(application);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="application-${application.id}.pdf"`);
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
      'firstName', 'lastName', 'dateOfBirth', 'email', 'phone', 'currentAddress',
      'yearsAtAddress', 'reasonForMoving', 'employerName', 'jobTitle',
      'employerAddress', 'employerPhone', 'employmentLength', 'monthlyIncome',
      'refName', 'refRelationship', 'refContact',
      'desiredMoveIn', 'consentBackground'
    ];

    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    // Email validation
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Phone validation
    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      errors.push('Invalid phone format');
    }

    // Date validation - Fixed logic
    if (data.dateOfBirth && isNaN(new Date(data.dateOfBirth))) {
      errors.push('Invalid date of birth format');
    }

    if (data.desiredMoveIn && isNaN(new Date(data.desiredMoveIn))) {
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
    if (data.monthlyIncome && (isNaN(data.monthlyIncome) || data.monthlyIncome <= 0)) {
      errors.push('Monthly income must be a positive number');
    }

    // Number of occupants validation
    if (data.occupants && (isNaN(data.occupants) || data.occupants < 1)) {
      errors.push('Number of occupants must be at least 1');
    }

    // Background check consent validation
    if (!data.consentBackground) {
      errors.push('Background check consent is required');
    }

    return errors;
  }
}

module.exports = RentalApplicationController;