// server/src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.password',
      }
    });
  }

  async sendApplicationToLandlord(application, pdfBuffer) {
    try {
      const landlordEmail = process.env.LANDLORD_EMAIL || 'landlord@propertypulse.com';

      const mailOptions = {
        from: `"PropertyPulse" <${process.env.FROM_EMAIL || 'noreply@propertypulse.com'}>`,
        to: landlordEmail,
        subject: `New Rental Application - ${application.application_number}`,
        html: this.generateLandlordEmailTemplate(application),
        attachments: [
          {
            filename: `application-${application.application_number}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Landlord email sent:', info.messageId);
      return info;

    } catch (error) {
      console.error('Error sending landlord email:', error);
      throw error;
    }
  }

  async sendApplicationConfirmation(application) {
    try {
      const mailOptions = {
        from: `"PropertyPulse" <${process.env.FROM_EMAIL || 'noreply@propertypulse.com'}>`,
        to: application.email,
        subject: `Application Confirmation - ${application.application_number}`,
        html: this.generateConfirmationEmailTemplate(application)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent:', info.messageId);
      return info;

    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  async sendStatusUpdateToApplicant(application, newStatus, reason = null) {
    try {
      const mailOptions = {
        from: `"PropertyPulse" <${process.env.FROM_EMAIL || 'noreply@propertypulse.com'}>`,
        to: application.email,
        subject: `Application Status Update - ${application.application_number}`,
        html: this.generateStatusUpdateEmailTemplate(application, newStatus, reason)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent:', info.messageId);
      return info;

    } catch (error) {
      console.error('Error sending status update email:', error);
      throw error;
    }
  }

  generateLandlordEmailTemplate(application) {
    const formattedIncome = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(application.monthly_gross_income);

    const formattedMoveInDate = new Date(application.desired_move_in_date).toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Rental Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 20px; }
          .highlight { background: #dbeafe; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .label { font-weight: bold; color: #1e40af; }
          .value { margin-left: 10px; }
          .footer { margin-top: 20px; padding: 20px; background: #e5e7eb; border-radius: 5px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 New Rental Application Received</h1>
            <p>Application Number: <strong>${application.application_number}</strong></p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <h3>📋 Quick Summary</h3>
              <p><span class="label">Applicant:</span><span class="value">${application.full_name}</span></p>
              <p><span class="label">Email:</span><span class="value">${application.email}</span></p>
              <p><span class="label">Phone:</span><span class="value">${application.phone}</span></p>
              <p><span class="label">Monthly Income:</span><span class="value">${formattedIncome}</span></p>
              <p><span class="label">Desired Move-in:</span><span class="value">${formattedMoveInDate}</span></p>
              <p><span class="label">Occupants:</span><span class="value">${application.number_of_occupants}</span></p>
              <p><span class="label">Pets:</span><span class="value">${application.has_pets ? 'Yes' : 'No'}</span></p>
            </div>

            <div class="section">
              <h3>💼 Employment Information</h3>
              <p><span class="label">Employer:</span><span class="value">${application.employer_name}</span></p>
              <p><span class="label">Position:</span><span class="value">${application.job_title}</span></p>
              <p><span class="label">Employment Length:</span><span class="value">${application.employment_length}</span></p>
            </div>
          </div>

          <div class="footer">
            <p><strong>📎 Complete application details are attached as a PDF.</strong></p>
            <p>Log into your PropertyPulse dashboard to review and manage this application.</p>
            <p><em>This email was automatically generated by PropertyPulse.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateConfirmationEmailTemplate(application) {
    const formattedMoveInDate = new Date(application.desired_move_in_date).toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
          .highlight { background: #dcfce7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #16a34a; }
          .footer { margin-top: 20px; padding: 15px; background: #e5e7eb; border-radius: 5px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Successfully Submitted!</h1>
            <p>Thank you for choosing PropertyPulse</p>
          </div>
          
          <div class="content">
            <p>Dear ${application.full_name},</p>
            
            <p>Your rental application has been successfully submitted and received. Here are your application details:</p>

            <div class="highlight">
              <h3>📋 Application Summary</h3>
              <p><strong>Application Number:</strong> ${application.application_number}</p>
              <p><strong>Submitted:</strong> ${new Date(application.created_at || new Date()).toLocaleString()}</p>
              <p><strong>Applicant:</strong> ${application.full_name}</p>
              <p><strong>Email:</strong> ${application.email}</p>
              <p><strong>Desired Move-in Date:</strong> ${formattedMoveInDate}</p>
              <p><strong>Status:</strong> Pending Review</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>Important:</strong> Please save this email and your application number for your records.</p>
            <p><em>This is an automated confirmation from PropertyPulse.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateStatusUpdateEmailTemplate(application, newStatus, reason) {
    const statusConfig = {
      'approved': {
        color: '#16a34a',
        emoji: '🎉',
        title: 'Application Approved!',
        message: 'Congratulations! Your rental application has been approved.'
      },
      'rejected': {
        color: '#dc2626',
        emoji: '❌',
        title: 'Application Decision',
        message: 'Thank you for your interest. Unfortunately, your application was not selected.'
      },
      'under_review': {
        color: '#d97706',
        emoji: '🔍',
        title: 'Application Under Review',
        message: 'Your application is currently being reviewed. We will update you soon.'
      },
      'pending': {
        color: '#2563eb',
        emoji: '⏳',
        title: 'Application Pending',
        message: 'Your application is pending additional documentation or review.'
      }
    };

    const config = statusConfig[newStatus] || statusConfig['pending'];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${config.color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .status-box { padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${config.color}; }
          .footer { margin-top: 20px; padding: 15px; background: #e5e7eb; border-radius: 5px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.emoji} ${config.title}</h1>
            <p>Application ${application.application_number}</p>
          </div>
          
          <div class="content">
            <p>Dear ${application.full_name},</p>
            
            <p>${config.message}</p>

            <div class="status-box">
              <h3>📋 Application Details</h3>
              <p><strong>Application Number:</strong> ${application.application_number}</p>
              <p><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('_', ' ')}</p>
              <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
              ${reason ? `<p><strong>Notes:</strong> ${reason}</p>` : ''}
            </div>
          </div>

          <div class="footer">
            <p>If you have any questions, please contact us at support@propertypulse.com.</p>
            <p><em>This is an automated notification from PropertyPulse.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Test email connectivity
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();