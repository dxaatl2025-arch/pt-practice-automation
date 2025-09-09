const express = require('express');
const { body } = require('express-validator');
const { authenticateUser: authenticate } = require('../../../middleware/auth');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const router = express.Router();

// Mock data store (replace with database in production)
const affiliates = new Map();
const referrals = new Map();

const affiliateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many affiliate requests from this IP, please try again later.'
});

/**
 * @route POST /api/affiliates/signup
 * @desc Sign up as affiliate
 * @access Private
 */
router.post('/signup',
  authenticate,
  affiliateRateLimit,
  [
    body('companyName').optional().isString(),
    body('websiteUrl').optional().isURL(),
    body('marketingChannels').optional().isArray()
  ],
  async (req, res) => {
    try {
      if (process.env.AFFILIATE_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Affiliate Portal feature is not enabled'
        });
      }

      const userId = req.user.id;
      
      // Check if user is already an affiliate
      if (affiliates.has(userId)) {
        return res.status(400).json({
          success: false,
          error: 'User is already registered as an affiliate'
        });
      }

      // Generate unique affiliate code
      const affiliateCode = `PP${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const affiliate = {
        id: crypto.randomUUID(),
        userId,
        affiliateCode,
        companyName: req.body.companyName || '',
        websiteUrl: req.body.websiteUrl || '',
        marketingChannels: req.body.marketingChannels || [],
        status: 'ACTIVE',
        commissionRate: 0.15, // 15% commission
        totalEarnings: 0,
        totalReferrals: 0,
        createdAt: new Date()
      };

      affiliates.set(userId, affiliate);

      res.status(201).json({
        success: true,
        data: {
          affiliate: {
            id: affiliate.id,
            affiliateCode: affiliate.affiliateCode,
            commissionRate: affiliate.commissionRate,
            status: affiliate.status
          }
        }
      });

    } catch (error) {
      console.error('Error in affiliate signup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sign up as affiliate'
      });
    }
  }
);

/**
 * @route GET /api/affiliates/dashboard
 * @desc Get affiliate dashboard data
 * @access Private
 */
router.get('/dashboard',
  authenticate,
  affiliateRateLimit,
  async (req, res) => {
    try {
      if (process.env.AFFILIATE_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Affiliate Portal feature is not enabled'
        });
      }

      const userId = req.user.id;
      const affiliate = affiliates.get(userId);

      if (!affiliate) {
        return res.status(404).json({
          success: false,
          error: 'Affiliate account not found'
        });
      }

      // Get referrals for this affiliate
      const affiliateReferrals = Array.from(referrals.values())
        .filter(ref => ref.affiliateCode === affiliate.affiliateCode);

      const dashboard = {
        affiliate: {
          code: affiliate.affiliateCode,
          status: affiliate.status,
          commissionRate: affiliate.commissionRate,
          joinDate: affiliate.createdAt
        },
        stats: {
          totalReferrals: affiliateReferrals.length,
          totalEarnings: affiliate.totalEarnings,
          pendingEarnings: affiliateReferrals
            .filter(ref => ref.status === 'PENDING')
            .reduce((sum, ref) => sum + (ref.commissionAmount || 0), 0),
          paidEarnings: affiliateReferrals
            .filter(ref => ref.status === 'PAID')
            .reduce((sum, ref) => sum + (ref.commissionAmount || 0), 0),
          conversionRate: affiliateReferrals.length > 0 ? 
            (affiliateReferrals.filter(ref => ref.status === 'CONVERTED').length / affiliateReferrals.length) * 100 : 0
        },
        recentReferrals: affiliateReferrals
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(ref => ({
            id: ref.id,
            email: ref.email,
            status: ref.status,
            commissionAmount: ref.commissionAmount,
            createdAt: ref.createdAt
          }))
      };

      res.status(200).json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('Error getting affiliate dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }
);

/**
 * @route POST /api/affiliates/links
 * @desc Generate affiliate link
 * @access Private
 */
router.post('/links',
  authenticate,
  affiliateRateLimit,
  [
    body('campaign').optional().isString()
  ],
  async (req, res) => {
    try {
      if (process.env.AFFILIATE_PORTAL !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Affiliate Portal feature is not enabled'
        });
      }

      const userId = req.user.id;
      const affiliate = affiliates.get(userId);

      if (!affiliate) {
        return res.status(404).json({
          success: false,
          error: 'Affiliate account not found'
        });
      }

      const campaign = req.body.campaign || 'default';
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const affiliateLink = `${baseUrl}?ref=${affiliate.affiliateCode}&utm_campaign=${campaign}`;

      res.status(200).json({
        success: true,
        data: {
          link: affiliateLink,
          affiliateCode: affiliate.affiliateCode,
          campaign
        }
      });

    } catch (error) {
      console.error('Error generating affiliate link:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate affiliate link'
      });
    }
  }
);

module.exports = router;