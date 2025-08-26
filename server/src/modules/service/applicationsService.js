// server/src/modules/applications/service/applicationsService.js
const { ApplicationCreateSchema, ApplicationStatusSchema } = require('../schemas');
const emailService = require('../../../utils/email');
const pdfService = require('../../../utils/pdf');

class ApplicationsService {
  constructor(applicationsRepo, propertyRepo) {
    this.applicationsRepo = applicationsRepo;
    this.propertyRepo = propertyRepo;
  }

  async submitApplication(payload) {
    // Validate input
    const validated = ApplicationCreateSchema.parse(payload);
    
    // Verify consent
    if (!validated.consentBackground) {
      throw new Error('Background check consent is required');
    }

    // Verify property exists
    const property = await this.propertyRepo.findById(validated.propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    // Create application
    const application = await this.applicationsRepo.create({
      ...validated,
      signedAt: new Date()
    });

    // Send notification to landlord
    await this.emailLandlordOnSubmit(application.id);

    return { id: application.id, status: 'submitted' };
  }

  async listForLandlord(landlordId, propertyId, options = {}) {
    // Verify landlord owns the property
    const property = await this.propertyRepo.findById(propertyId);
    if (!property || property.landlordId !== landlordId) {
      throw new Error('Property not found or access denied');
    }

    const applications = await this.applicationsRepo.listByProperty(propertyId, options);
    const total = await this.applicationsRepo.countByProperty(propertyId, options.status);

    return { applications, total };
  }

  async setStatus(landlordId, applicationId, status, reviewNotes = null) {
    // Get application with property info
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify landlord owns the property
    if (application.property.landlord.id !== landlordId) {
      throw new Error('Access denied');
    }

    // Validate status
    ApplicationStatusSchema.parse({ status });

    // Update status
    const updated = await this.applicationsRepo.updateStatus(applicationId, status, reviewNotes);

    // Send decision email to applicant
    await this.emailApplicantOnDecision(applicationId, status);

    return updated;
  }

  async generatePdf(applicationId) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    return await pdfService.generateApplicationPdf(application);
  }

  async emailLandlordOnSubmit(applicationId) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) return;

    const pdfBuffer = await this.generatePdf(applicationId);
    const landlord = application.property.landlord;

    await emailService.sendEmail({
      to: landlord.email,
      subject: `New Application: ${application.property.title}`,
      html: `
        <h2>New Rental Application Received</h2>
        <p>Dear ${landlord.firstName},</p>
        <p>You have received a new rental application for <strong>${application.property.title}</strong>.</p>
        
        <h3>Applicant Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li>
          <li><strong>Email:</strong> ${application.email}</li>
          <li><strong>Phone:</strong> ${application.phone}</li>
          <li><strong>Monthly Income:</strong> $${application.monthlyIncome.toLocaleString()}</li>
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
  }

  async emailApplicantOnDecision(applicationId, status) {
    const application = await this.applicationsRepo.getWithPropertyAndLandlord(applicationId);
    if (!application) return;

    const isApproved = status === 'APPROVED';
    const subject = `Application ${isApproved ? 'Approved' : 'Decision'}: ${application.property.title}`;
    
    const html = isApproved ? `
      <h2>🎉 Application Approved!</h2>
      <p>Dear ${application.firstName},</p>
      <p>Congratulations! Your rental application for <strong>${application.property.title}</strong> has been approved.</p>
      <p>The landlord will contact you shortly to proceed with the lease agreement.</p>
      <p>Thank you for choosing PropertyPulse!</p>
    ` : `
      <h2>Application Decision</h2>
      <p>Dear ${application.firstName},</p>
      <p>Thank you for your interest in <strong>${application.property.title}</strong>.</p>
      <p>After careful consideration, we have decided to move forward with another applicant.</p>
      <p>We encourage you to continue your search and wish you the best in finding your new home.</p>
    `;

    await emailService.sendEmail({
      to: application.email,
      subject,
      html
    });
  }
}

module.exports = ApplicationsService;