// server/src/utils/email.js - MINIMAL ENHANCEMENT VERSION
// This works with your existing code structure

const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email would be sent (SendGrid not configured):', { 
      to, 
      subject, 
      hasAttachments: attachments.length > 0 
    });
    return { success: true, mode: 'development' };
  }

  const msg = {
    to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@propertypulse.com',
      name: 'PropertyPulse'
    },
    subject,
    html,
    ...(attachments.length > 0 && { attachments })
  };

  try {
    const result = await sgMail.send(msg);
    console.log('📧 Email sent successfully to:', to);
    return { success: true, mode: 'production', messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('📧 Email send failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail };