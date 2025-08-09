// server/src/controllers/paymentIntegrationController.js
const stripeService = require('../services/stripeService');
const plaidService = require('../services/plaidService');
const PaymentIntegration = require('../models/PaymentIntegration');
const User = require('../models/User');
const Payment = require('../models/Payment');

class PaymentIntegrationController {
  // Setup Stripe customer
  async setupStripeCustomer(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const customer = await stripeService.createCustomer(user);

      res.json({
        success: true,
        message: 'Stripe customer created successfully',
        customer: {
          id: customer.id,
          email: customer.email
        }
      });
    } catch (error) {
      console.error('Setup Stripe customer error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create Plaid link token
  async createPlaidLinkToken(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const linkToken = await plaidService.createLinkToken(userId, user.role);

      res.json({
        success: true,
        message: 'Link token created successfully',
        linkToken: linkToken.link_token
      });
    } catch (error) {
      console.error('Create Plaid link token error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Exchange Plaid public token
  async exchangePlaidToken(req, res) {
    try {
      const { userId } = req.params;
      const { publicToken } = req.body;

      if (!publicToken) {
        return res.status(400).json({ error: 'Public token is required' });
      }

      const result = await plaidService.exchangePublicToken(publicToken, userId);

      res.json({
        success: true,
        message: 'Bank accounts linked successfully',
        accounts: result.accounts
      });
    } catch (error) {
      console.error('Exchange Plaid token error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // THE MAIN PAYMENT ROUTE
  async processRentPayment(req, res) {
    try {
      const { 
        paymentId,
        paymentMethod,
        paymentMethodId,
        amount,
        description
      } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Get payment integrations for tenant and landlord
      const tenantIntegration = await PaymentIntegration.findOne({ 
        userId: payment.tenant 
      });
      const landlordIntegration = await PaymentIntegration.findOne({ 
        userId: payment.landlord 
      });

      if (!tenantIntegration || !landlordIntegration) {
        return res.status(400).json({ 
          error: 'Payment accounts not properly configured' 
        });
      }

      // For development, use mock payment result
      const paymentResult = {
        id: 'mock_payment_' + Date.now(),
        status: 'succeeded',
        amount: amount * 100,
        paymentMethod: paymentMethod
      };

      // Calculate platform fee (2.9%)
      const platformFee = Math.round(amount * 0.029);

      // Update payment record using your existing schema structure
      await Payment.findByIdAndUpdate(paymentId, {
        status: paymentResult.status === 'succeeded' ? 'paid' : 'pending',
        paidDate: paymentResult.status === 'succeeded' ? new Date() : null,
        paymentMethod: paymentMethod === 'bank_account' ? 'ach' : 'credit_card',
        'transactionDetails.stripePaymentIntentId': paymentResult.id,
        'transactionDetails.stripeCustomerId': tenantIntegration.stripe.customerId,
        'transactionDetails.processorId': 'stripe',
        'transactionDetails.platformFeeAmount': platformFee,
        'transactionDetails.netAmount': amount - platformFee,
        'fees.processingFee': platformFee,
        notes: `Payment processed via ${paymentMethod} - ${description || 'PropertyPulse automated payment'}`
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        payment: {
          id: paymentResult.id,
          status: paymentResult.status,
          amount: amount,
          platformFee: platformFee,
          netAmount: amount - platformFee,
          method: paymentMethod,
          processedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Process rent payment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get payment status
  async getPaymentStatus(req, res) {
    try {
      const { userId } = req.params;
      const integration = await PaymentIntegration.findOne({ userId });

      if (!integration) {
        return res.json({
          success: true,
          status: 'not_setup',
          stripe: { connected: false },
          plaid: { connected: false }
        });
      }

      res.json({
        success: true,
        status: 'setup',
        stripe: {
          connected: !!integration.stripe.customerId,
          customerId: integration.stripe.customerId,
          isVerified: integration.stripe.isVerified
        },
        plaid: {
          connected: !!integration.plaid.accessToken,
          accountsCount: integration.plaid.linkedAccounts.length,
          accounts: integration.plaid.linkedAccounts
        },
        preferences: integration.preferences
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PaymentIntegrationController();