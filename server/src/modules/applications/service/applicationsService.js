// server/src/modules/applications/service/applicationsService.js
// UPDATED VERSION with missing features integrated

const ApplicationsRepository = require('../repo/applicationsRepo');
const { sendEmail } = require('../../../utils/email');
const { generateApplicationPdf } = require('../../../utils/pdf');
const prisma = require('../../../config/prisma'); // Add this import
// Add this import at the top
const { getLandlordNotificationTemplate, getApplicantDecisionTemplate } = require('../templates');

class ApplicationsService {
constructor(applicationsRepo, propertyRepo) {
  this.applicationsRepo = applicationsRepo || new ApplicationsRepository(prisma);
  this.propertyRepo = propertyRepo;
}

  async submitApplication(payload) {
    // Validate consent
    if (!payload.consentBackground) {
      throw new Error('Background check consent is required');
    }

    // Create application
    const application = await this.applicationsRepo.create({
      ...payload,
      signedAt: new Date()
    });

    // Send notification to landlord
    await this.emailLandlordOnSubmit(application.id);

    return { id: application.id, status: 'submitted' };
  }

  // ENHANCED: Add property ownership verification
 async listForLandlord(landlordId, propertyId, options = {}) {
  // ADD PROPERTY OWNERSHIP VERIFICATION
  if (landlordId && propertyId) {
    const property = await prisma.property.findUnique({
  where: { id: propertyId },
  select: { ownerId: true, title: true }
});

    if (!property) {
      throw new Error('Property not found');
    }

    if (property.ownerId !== landlordId) {
      throw new Error('Unauthorized: Property not owned by landlord');
    }
  }

  return await this.applicationsRepo.listByProperty(propertyId, options);
}

  // ENHANCED: Add property ownership verification  
 async setStatus(landlordId, applicationId, status, reviewNotes = null) {
  // ADD PROPERTY OWNERSHIP VERIFICATION
  if (landlordId) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const property = await prisma.property.findUnique({
  where: { id: application.propertyId },
  select: { ownerId: true }
});

if (!property || property.ownerId !== landlordId) {
      throw new Error('Unauthorized: Property not owned by landlord');
    }
  }

  const updated = await this.applicationsRepo.updateStatus(applicationId, status, reviewNotes);
  await this.emailApplicantOnDecision(applicationId, status);
  return updated;
}

  async generatePdf(applicationId) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    return await generateApplicationPdf(application);
  }

  // NEW: Add ownership verification for PDF generation
  async generatePdfForLandlord(landlordId, applicationId) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify landlord owns the property
const property = await prisma.property.findUnique({
  where: { id: application.propertyId },
  select: { ownerId: true }
});

if (!property || property.ownerId !== landlordId) {
      throw new Error('Unauthorized: Property not owned by landlord');
    }

    return await generateApplicationPdf(application);
  }

  // ENHANCED: Use professional email templates
  async emailLandlordOnSubmit(applicationId) {
  try {
    console.log('📧 Sending landlord notification for application:', applicationId);
    
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      console.log('❌ Application not found for email notification');
      return;
    }

    // Check if we have property and owner data
    if (!application.property || !application.property.owner) {
      console.log('❌ Property owner information not available for email notification');
      return;
    }

    // Generate PDF
    const pdfBuffer = await this.generatePdf(applicationId);
    
    // Get email template
    const template = getLandlordNotificationTemplate(application);
    
    // Send email with PDF attachment
    await sendEmail({
      to: application.property.owner.email,
      subject: template.subject,
      html: template.html,
      attachments: [{
        filename: `application-${application.firstName}-${application.lastName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    
 console.log('✅ Landlord notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send landlord notification:', error);
    // Don't throw - application was still created successfully
  }
}


  // ENHANCED: Use professional email templates
async emailApplicantOnDecision(applicationId, status) {
  try {
    console.log('📧 Sending decision notification for application:', applicationId, 'status:', status);
    
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      console.log('❌ Application not found for decision email');
      return;
    }

    // Get email template
    const template = getApplicantDecisionTemplate(application, status);

    // Send decision email
    await sendEmail({
      to: application.email,
      subject: template.subject,
      html: template.html
    });
    
    console.log('✅ Decision notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send decision notification:', error);
    // Don't throw - status update was still successful
  }
}
}

module.exports = ApplicationsService;