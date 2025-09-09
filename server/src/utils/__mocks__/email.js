// Mock email service for testing
const mockEmailService = {
  sentEmails: [],
  shouldFail: false,
  failureMessage: 'Mock email service error'
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  console.log(`📧 [MOCK] Sending email to: ${to}`);
  console.log(`📧 [MOCK] Subject: ${subject}`);
  console.log(`📧 [MOCK] Has attachments: ${attachments.length > 0}`);
  
  if (mockEmailService.shouldFail) {
    throw new Error(mockEmailService.failureMessage);
  }

  // Store sent email for test verification
  mockEmailService.sentEmails.push({
    to,
    subject,
    html,
    attachments,
    sentAt: new Date()
  });

  return { 
    success: true, 
    mode: 'mock',
    messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
};

// Test utilities
const __testUtils = {
  getSentEmails: () => mockEmailService.sentEmails,
  getLastEmail: () => mockEmailService.sentEmails[mockEmailService.sentEmails.length - 1],
  clearSentEmails: () => { mockEmailService.sentEmails = []; },
  setShouldFail: (shouldFail, message) => {
    mockEmailService.shouldFail = shouldFail;
    if (message) mockEmailService.failureMessage = message;
  },
  getEmailCount: () => mockEmailService.sentEmails.length,
  findEmailBySubject: (subject) => mockEmailService.sentEmails.find(email => 
    email.subject.includes(subject)
  ),
  findEmailByRecipient: (to) => mockEmailService.sentEmails.find(email => 
    email.to === to
  )
};

module.exports = { sendEmail, __testUtils };