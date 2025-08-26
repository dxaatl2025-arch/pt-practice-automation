// server/src/services/stripeService.js
const stripe = require('../config/stripe');
const prisma = require('../config/prisma');

class StripeService {
  // Create Stripe Customer
  async createCustomer(user) {
    try {
      // For development, return mock customer
      if (process.env.NODE_ENV === 'development') {
        const mockCustomer = this.getMockCustomer();
        
       await prisma.paymentIntegration.upsert({
  where: { userId: user.id },
  update: {
    provider: 'STRIPE',
    accountId: mockCustomer.id,
    isActive: true
  },
  create: {
    userId: user.id,
    provider: 'STRIPE',
    accountId: mockCustomer.id,
    isActive: true
  }
});

        return mockCustomer;
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
       metadata: {
  userId: user.id.toString(),
  role: user.role,
  propertyPulseUser: 'true'
}
      });

      await prisma.paymentIntegration.upsert({
  where: { userId: user.id },
  update: {
    provider: 'STRIPE',
    accountId: customer.id,
    isActive: true
  },
  create: {
    userId: user.id,
    provider: 'STRIPE',
    accountId: customer.id,
    isActive: true
  }
});
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer account');
    }
  }

  // Process rent payment
  async processRentPayment(paymentData) {
    try {
      // For development, return mock payment
      if (process.env.NODE_ENV === 'development') {
        return this.getMockPaymentIntent();
      }

      const { amount, customerId, paymentMethodId, landlordAccountId, description } = paymentData;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        description: description || 'PropertyPulse Rent Payment',
        application_fee_amount: Math.round(amount * 100 * 0.029), // 2.9% platform fee
        transfer_data: {
          destination: landlordAccountId,
        },
        metadata: {
          type: 'rent_payment',
          platform: 'PropertyPulse'
        }
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed');
    }
  }

  // Mock functions for development
  getMockCustomer() {
    return {
      id: 'cus_test_' + Date.now(),
      email: 'test@propertypulse.com',
      name: 'Test User',
      created: Math.floor(Date.now() / 1000)
    };
  }

  getMockPaymentIntent() {
    return {
      id: 'pi_test_' + Date.now(),
      amount: 250000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000)
    };
  }
}

module.exports = new StripeService();