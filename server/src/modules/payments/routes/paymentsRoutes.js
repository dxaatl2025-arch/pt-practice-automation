const express = require('express');
const PaymentsController = require('../controller/paymentsController');
const { authenticateUser, authorizeRoles } = require('../../../middleware/auth');

const router = express.Router();
const paymentsController = new PaymentsController();

// Create payment intent (tenant only)
router.post('/payments/intent', 
  authenticateUser,
  authorizeRoles('TENANT'),
  paymentsController.createPaymentIntent
);

// Create manual payment (landlord only)
router.post('/payments/manual',
  authenticateUser,
  authorizeRoles('LANDLORD'),
  paymentsController.createManualPayment
);

// Get payment details (tenant for their payments, landlord for their properties)
router.get('/payments/:id',
  authenticateUser,
  authorizeRoles('TENANT', 'LANDLORD'),
  paymentsController.getPayment
);

module.exports = router;