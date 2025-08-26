// server/src/modules/applications/service/applicationsService.js
// UPDATED VERSION with missing features integrated

const ApplicationsRepository = require('../repo/applicationsRepo');
const { sendEmail } = require('../../../utils/email');
const { generateApplicationPdf } = require('../../../utils/pdf');
const prisma = require('../../../config/prisma'); // Add this import

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
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      console.log('Application not found for email notification');
      return;
    }

    // Check if we have property and owner data
    if (!application.property || !application.property.owner) {
      console.log('Property owner information not available for email notification');
      return;
    }

    const pdfBuffer = await this.generatePdf(applicationId);
    const landlord = application.property.owner;

    // Additional safety check
    if (!landlord.email) {
      console.log('Landlord email not available for notification');
      return;
    }

    await sendEmail({
      to: landlord.email,
      subject: `New Application: ${application.property.address || 'Property'}`,
      html: `
        <h2>New Rental Application Received</h2>
        <p>Dear ${landlord.firstName || 'Landlord'},</p>
        <p>You have received a new rental application for <strong>${application.property.address || 'your property'}</strong>.</p>
        
        <h3>Applicant Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li>
          <li><strong>Email:</strong> ${application.email}</li>
          <li><strong>Phone:</strong> ${application.phone}</li>
          <li><strong>Monthly Income:</strong> $${application.monthlyIncome ? application.monthlyIncome.toLocaleString() : 'N/A'}</li>
          <li><strong>Occupants:</strong> ${application.occupants}</li>
        </ul>
        
        <p>Please find the complete application attached as a PDF.</p>
        <p>Log in to your PropertyPulse dashboard to review and make a decision.</p>
      `,
      attachments: [{
        filename: `application-${application.firstName}-${application.lastName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    
    console.log('📧 Email notification sent successfully');
  } catch (error) {
    console.error('📧 Email notification failed:', error.message);
    // Don't throw - email failure shouldn't stop application submission
  }
}

  // ENHANCED: Use professional email templates
  async emailApplicantOnDecision(applicationId, status) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord 
      ? await this.applicationsRepo.getWithPropertyAndLandlord(applicationId)
      : await this.applicationsRepo.get(applicationId);
    
     // Fallback to existing email (enhanced)
    const isApproved = status === 'APPROVED';

    await sendEmail({
      to: application.email,
      subject: `Application ${isApproved ? 'Approved' : 'Decision'}: ${application.property?.title || 'Property'}`,
      html: isApproved 
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>🎉 Congratulations!</h1>
              <p>Your Application Has Been Approved</p>
            </div>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${application.firstName}</strong>,</p>
              <p>We're excited to inform you that your rental application has been <strong style="color: #10b981;">APPROVED</strong>!</p>
              <div style="background: white; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>🏠 Your New Home</h3>
                <p><strong>Property:</strong> ${application.property?.title || 'N/A'}</p>
                <p><strong>Move-in Date:</strong> ${new Date(application.desiredMoveIn).toLocaleDateString()}</p>
              </div>
              <p>The landlord will contact you shortly to proceed with the lease agreement.</p>
              <p>Thank you for choosing PropertyPulse!</p>
            </div>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1>Application Decision</h1>
            </div>
            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${application.firstName}</strong>,</p>
              <p>Thank you for your interest in ${application.property?.title || 'our property'}.</p>
              <p>After careful consideration, we have decided to move forward with another applicant.</p>
              <div style="background: #eff6ff; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <h3>🔍 Continue Your Search</h3>
                <p>Don't let this discourage you! There are many great properties available on PropertyPulse.</p>
              </div>
              <p>We wish you the best in finding your perfect home.</p>
            </div>
          </div>
        `
    });
  }
}

module.exports = ApplicationsService;