const PaymentsRepository = require('../repo/paymentsRepo');
const { stripe } = require('../../../config/stripe');
const prisma = require('../../../config/prisma');

class PaymentsService {
  constructor(paymentsRepo = null) {
    this.paymentsRepo = paymentsRepo || new PaymentsRepository();
  }

  async createPaymentIntent(leaseId, amount, userId) {
    // Verify lease belongs to user
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: { landlordId: true, title: true }
        }
      }
    });

    if (!lease) {
      throw new Error('Lease not found');
    }

    if (lease.tenantId !== userId) {
      throw new Error('Unauthorized: User is not tenant of this lease');
    }

    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    // Convert to cents for Stripe
    const amountCents = Math.round(amount * 100);

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        leaseId,
        userId,
        propertyTitle: lease.property.title
      }
    });

    // Create payment record
    const payment = await this.paymentsRepo.create({
      amount,
      leaseId,
      tenantId: userId,
      provider: 'stripe',
      providerIntentId: paymentIntent.id,
      status: 'PENDING',
      type: 'RENT',
      dueDate: new Date(),
      currency: 'usd'
    });

    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      amount: payment.amount
    };
  }

  async createManualPayment(leaseId, amount, paidAt, landlordId, description = null) {
    // Verify landlord owns the property
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          select: { landlordId: true, title: true }
        }
      }
    });

    if (!lease) {
      throw new Error('Lease not found');
    }

    if (lease.property.landlordId !== landlordId) {
      throw new Error('Unauthorized: Property not owned by landlord');
    }

    // Create manual payment record
    const payment = await this.paymentsRepo.create({
      amount,
      leaseId,
      tenantId: lease.tenantId,
      provider: 'manual',
      status: 'PAID',
      type: 'RENT',
      paidDate: paidAt ? new Date(paidAt) : new Date(),
      dueDate: new Date(),
      currency: 'usd',
      description: description || 'Manual payment recorded by landlord'
    });

    return payment;
  }

  async handleStripeWebhook(event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Find payment by provider intent ID
      const payment = await this.paymentsRepo.findByProviderIntentId(paymentIntent.id);
      
      if (payment) {
        // Update payment status
        const updatedPayment = await this.paymentsRepo.updateStatus(
          payment.id,
          'PAID',
          new Date()
        );

        console.log('✅ Payment marked as paid:', updatedPayment.id);
        return updatedPayment;
      } else {
        console.log('⚠️ Payment not found for intent:', paymentIntent.id);
      }
    }

    return null;
  }

  async getPaymentById(id, userId, userRole) {
    const payment = await this.paymentsRepo.findById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check authorization
    if (userRole === 'TENANT' && payment.tenantId !== userId) {
      throw new Error('Unauthorized');
    }

    if (userRole === 'LANDLORD') {
      const lease = await prisma.lease.findUnique({
        where: { id: payment.leaseId },
        include: {
          property: {
            select: { landlordId: true }
          }
        }
      });

      if (!lease || lease.property.landlordId !== userId) {
        throw new Error('Unauthorized');
      }
    }

    return payment;
  }
}

module.exports = PaymentsService;