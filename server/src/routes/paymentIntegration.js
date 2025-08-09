// server/src/routes/paymentIntegration.js
const express = require('express');
const router = express.Router();
const paymentIntegrationController = require('../controllers/paymentIntegrationController');

// Stripe Integration Routes
router.post('/stripe/setup-customer/:userId', paymentIntegrationController.setupStripeCustomer);

// Plaid Integration Routes
router.post('/plaid/create-link-token/:userId', paymentIntegrationController.createPlaidLinkToken);
router.post('/plaid/exchange-token/:userId', paymentIntegrationController.exchangePlaidToken);

// Payment Processing Routes
router.post('/pay', paymentIntegrationController.processRentPayment); // MAIN PAYMENT ROUTE
router.get('/status/:userId', paymentIntegrationController.getPaymentStatus);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Payment integration routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;