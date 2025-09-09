// Mock Stripe service for testing
const mockStripeService = {
  paymentIntents: new Map(),
  webhooks: [],
  shouldFail: false,
  failureMessage: 'Mock Stripe error'
};

const mockStripe = {
  paymentIntents: {
    create: async (params) => {
      console.log(`💳 [MOCK] Creating payment intent for amount: ${params.amount}`);
      
      if (mockStripeService.shouldFail) {
        throw new Error(mockStripeService.failureMessage);
      }

      const intentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientSecret = `${intentId}_secret_${Math.random().toString(36).substr(2, 16)}`;
      
      const intent = {
        id: intentId,
        amount: params.amount,
        currency: params.currency || 'usd',
        status: 'requires_payment_method',
        client_secret: clientSecret,
        metadata: params.metadata || {},
        created: Math.floor(Date.now() / 1000)
      };

      mockStripeService.paymentIntents.set(intentId, intent);
      
      return intent;
    },

    retrieve: async (intentId) => {
      const intent = mockStripeService.paymentIntents.get(intentId);
      if (!intent) {
        throw new Error(`No such payment_intent: ${intentId}`);
      }
      return intent;
    }
  },

  webhooks: {
    constructEvent: (payload, signature, secret) => {
      console.log(`🔗 [MOCK] Constructing webhook event`);
      
      if (!signature || !secret) {
        throw new Error('Invalid signature');
      }

      // Mock webhook event structure
      const event = {
        id: `evt_mock_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock_test_succeeded',
            status: 'succeeded',
            amount: 1200,
            currency: 'usd'
          }
        },
        created: Math.floor(Date.now() / 1000)
      };

      mockStripeService.webhooks.push(event);
      return event;
    }
  }
};

// Test utilities
const __testUtils = {
  getPaymentIntents: () => Array.from(mockStripeService.paymentIntents.values()),
  getPaymentIntent: (id) => mockStripeService.paymentIntents.get(id),
  getWebhooks: () => mockStripeService.webhooks,
  clearPaymentIntents: () => { mockStripeService.paymentIntents.clear(); },
  clearWebhooks: () => { mockStripeService.webhooks = []; },
  setShouldFail: (shouldFail, message) => {
    mockStripeService.shouldFail = shouldFail;
    if (message) mockStripeService.failureMessage = message;
  },
  simulateSuccessfulPayment: (intentId) => {
    const intent = mockStripeService.paymentIntents.get(intentId);
    if (intent) {
      intent.status = 'succeeded';
      return {
        id: `evt_mock_${Date.now()}`,
        type: 'payment_intent.succeeded',
        data: { object: intent }
      };
    }
    return null;
  }
};

module.exports = { 
  stripe: mockStripe, 
  __testUtils 
};