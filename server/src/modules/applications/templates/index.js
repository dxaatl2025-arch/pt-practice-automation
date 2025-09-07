const getLandlordNotificationTemplate = (application) => ({
  subject: `New Application: ${application.property.address}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">New Rental Application Received</h2>
      <p>Dear ${application.property.owner?.firstName || 'Landlord'},</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e40af;">Property:</h3>
        <p><strong>${application.property.address}</strong></p>
        
        <h3 style="color: #1e40af;">Applicant Details:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li>
          <li><strong>Email:</strong> ${application.email}</li>
          <li><strong>Phone:</strong> ${application.phone}</li>
          <li><strong>Monthly Income:</strong> $${application.monthlyIncome?.toLocaleString() || 'Not provided'}</li>
          <li><strong>Occupants:</strong> ${application.occupants}</li>
          <li><strong>Move-in Date:</strong> ${new Date(application.desiredMoveIn).toLocaleDateString()}</li>
        </ul>
      </div>
      
      <p>The complete application is attached as a PDF. Please log in to your PropertyPulse dashboard to review and make a decision.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>PropertyPulse - Rental Management Made Simple</p>
      </div>
    </div>
  `
});

const getApplicantDecisionTemplate = (application, status) => {
  const isApproved = status === 'APPROVED';
  return {
    subject: `Application ${isApproved ? 'Approved' : 'Update'}: ${application.property.address}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isApproved ? '#10b981' : '#6b7280'};">
          ${isApproved ? '🎉 Application Approved!' : 'Application Update'}
        </h2>
        <p>Dear ${application.firstName},</p>
        
        ${isApproved ? `
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Congratulations!</strong> Your rental application for <strong>${application.property.address}</strong> has been approved.</p>
            <p>The landlord will contact you shortly to proceed with the lease agreement and next steps.</p>
          </div>
        ` : `
          <div style="background: #f9fafb; border: 1px solid #d1d5db; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Thank you for your interest in <strong>${application.property.address}</strong>.</p>
            <p>After careful consideration, we have decided to move forward with another applicant for this property.</p>
            <p>We encourage you to continue your search and wish you the best in finding your new home.</p>
          </div>
        `}
        
        <p>Thank you for choosing PropertyPulse!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>PropertyPulse - Rental Management Made Simple</p>
        </div>
      </div>
    `
  };
};

module.exports = {
  getLandlordNotificationTemplate,
  getApplicantDecisionTemplate
};