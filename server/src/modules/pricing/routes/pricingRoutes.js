const express = require('express');
const { body } = require('express-validator');
const { authenticateUser: authenticate } = require('../../../middleware/auth');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const router = express.Router();

// Mock subscription data (replace with database in production)
const subscriptions = new Map();

const pricingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many pricing requests from this IP, please try again later.'
});

// Available pricing plans
const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    interval: 'month',
    features: [
      'Up to 5 properties',
      'Basic tenant management',
      'Online rent collection',
      'Maintenance tracking',
      'Email support'
    ],
    limits: {
      properties: 5,
      tenants: 10,
      applications: 50
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    interval: 'month',
    features: [
      'Up to 25 properties',
      'Advanced analytics',
      'AI rent optimization',
      'Document management',
      'Priority support',
      'API access'
    ],
    limits: {
      properties: 25,
      tenants: 100,
      applications: 500
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited properties',
      'Full AI suite',
      'Owner portal',
      'Accounting integration',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    limits: {
      properties: -1, // unlimited
      tenants: -1,
      applications: -1
    }
  },
  {
    id: 'custom',
    name: 'Enterprise+',
    price: null,
    interval: 'month',
    features: [
      'Custom solution',
      'Dedicated infrastructure',
      'SLA guarantee',
      '24/7 phone support',
      'Custom development',
      'Multiple brands'
    ],
    custom: true
  }
];

/**
 * @route GET /api/pricing/plans
 * @desc Get available pricing plans
 * @access Public
 */
router.get('/plans', async (req, res) => {
  try {
    if (process.env.PRICING !== 'true') {
      return res.status(501).json({
        success: false,
        error: 'Pricing feature is not enabled'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        plans: PRICING_PLANS,
        currency: 'USD',
        taxIncluded: false
      }
    });

  } catch (error) {
    console.error('Error getting pricing plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing plans'
    });
  }
});

/**
 * @route GET /api/pricing/subscription
 * @desc Get current user's subscription
 * @access Private
 */
router.get('/subscription',
  authenticate,
  pricingRateLimit,
  async (req, res) => {
    try {
      if (process.env.PRICING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Pricing feature is not enabled'
        });
      }

      const userId = req.user.id;
      let subscription = subscriptions.get(userId);

      // Create default subscription if none exists
      if (!subscription) {
        subscription = {
          id: crypto.randomUUID(),
          userId,
          planId: 'starter',
          status: 'TRIAL',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          cancelAtPeriodEnd: false,
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        };
        subscriptions.set(userId, subscription);
      }

      const plan = PRICING_PLANS.find(p => p.id === subscription.planId);

      res.status(200).json({
        success: true,
        data: {
          subscription: {
            ...subscription,
            plan: plan
          }
        }
      });

    } catch (error) {
      console.error('Error getting subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscription'
      });
    }
  }
);

/**
 * @route POST /api/pricing/subscribe
 * @desc Subscribe to a plan
 * @access Private
 */
router.post('/subscribe',
  authenticate,
  pricingRateLimit,
  [
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('paymentMethodId').optional().isString()
  ],
  async (req, res) => {
    try {
      if (process.env.PRICING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Pricing feature is not enabled'
        });
      }

      const { planId, paymentMethodId } = req.body;
      const userId = req.user.id;

      // Validate plan exists
      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan ID'
        });
      }

      if (plan.custom) {
        return res.status(400).json({
          success: false,
          error: 'Please contact sales for custom plans'
        });
      }

      // Mock subscription creation (in real implementation, use Stripe)
      const subscription = {
        id: crypto.randomUUID(),
        userId,
        planId,
        status: paymentMethodId ? 'ACTIVE' : 'INCOMPLETE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        cancelAtPeriodEnd: false,
        trialEnd: null,
        paymentMethodId: paymentMethodId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      subscriptions.set(userId, subscription);

      res.status(200).json({
        success: true,
        data: {
          subscription: {
            ...subscription,
            plan: plan
          }
        }
      });

    } catch (error) {
      console.error('Error subscribing to plan:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to subscribe to plan'
      });
    }
  }
);

/**
 * @route POST /api/pricing/checkout
 * @desc Create checkout session
 * @access Private
 */
router.post('/checkout',
  authenticate,
  pricingRateLimit,
  [
    body('planId').notEmpty().withMessage('Plan ID is required')
  ],
  async (req, res) => {
    try {
      if (process.env.PRICING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Pricing feature is not enabled'
        });
      }

      const { planId } = req.body;
      const userId = req.user.id;

      const plan = PRICING_PLANS.find(p => p.id === planId);
      if (!plan || plan.custom || !plan.price) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan for checkout'
        });
      }

      // Mock checkout session (in real implementation, use Stripe Checkout)
      const checkoutSession = {
        id: crypto.randomUUID(),
        url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/mock?session=${crypto.randomUUID()}&plan=${planId}`,
        planId,
        amount: plan.price * 100, // cents
        currency: 'usd',
        mode: 'subscription',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        createdAt: new Date()
      };

      res.status(200).json({
        success: true,
        data: {
          checkoutSession,
          redirectUrl: checkoutSession.url
        }
      });

    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session'
      });
    }
  }
);

/**
 * @route POST /api/pricing/cancel
 * @desc Cancel subscription
 * @access Private
 */
router.post('/cancel',
  authenticate,
  pricingRateLimit,
  async (req, res) => {
    try {
      if (process.env.PRICING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Pricing feature is not enabled'
        });
      }

      const userId = req.user.id;
      const subscription = subscriptions.get(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
      }

      // Mark for cancellation at period end
      subscription.cancelAtPeriodEnd = true;
      subscription.updatedAt = new Date();
      subscriptions.set(userId, subscription);

      res.status(200).json({
        success: true,
        data: {
          subscription,
          message: 'Subscription will be cancelled at the end of the current period'
        }
      });

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }
);

module.exports = router;