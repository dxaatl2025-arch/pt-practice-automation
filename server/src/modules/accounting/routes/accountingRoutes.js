const express = require('express');
const { body, query } = require('express-validator');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const AccountingService = require('../service/accountingService');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const accountingService = new AccountingService();

// Rate limiting for accounting endpoints
const accountingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many accounting requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route GET /api/accounting/chart-of-accounts
 * @desc Get chart of accounts
 * @access Private (Landlord, Admin)
 */
router.get('/chart-of-accounts',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  accountingRateLimit,
  async (req, res) => {
    try {
      if (process.env.ACCOUNTING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Accounting feature is not enabled'
        });
      }

      const accounts = await accountingService.getChartOfAccounts(req.user.id);

      res.status(200).json({
        success: true,
        data: { accounts }
      });
    } catch (error) {
      console.error('Error getting chart of accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chart of accounts'
      });
    }
  }
);

/**
 * @route POST /api/accounting/chart-of-accounts
 * @desc Create new account
 * @access Private (Landlord, Admin)
 */
router.post('/chart-of-accounts',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  accountingRateLimit,
  [
    body('accountCode').notEmpty().withMessage('Account code is required'),
    body('accountName').notEmpty().withMessage('Account name is required'),
    body('accountType').isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).withMessage('Invalid account type'),
    body('description').optional().isString()
  ],
  async (req, res) => {
    try {
      if (process.env.ACCOUNTING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Accounting feature is not enabled'
        });
      }

      const account = await accountingService.createAccount(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: { account }
      });
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create account'
      });
    }
  }
);

/**
 * @route GET /api/accounting/journal-entries
 * @desc Get journal entries
 * @access Private (Landlord, Admin)
 */
router.get('/journal-entries',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  accountingRateLimit,
  async (req, res) => {
    try {
      if (process.env.ACCOUNTING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Accounting feature is not enabled'
        });
      }

      const result = await accountingService.getJournalEntries(req.user.id, req.query);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting journal entries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve journal entries'
      });
    }
  }
);

/**
 * @route POST /api/accounting/journal-entries
 * @desc Create journal entry
 * @access Private (Landlord, Admin)
 */
router.post('/journal-entries',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  accountingRateLimit,
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('entryDate').isISO8601().withMessage('Valid entry date is required'),
    body('lines').isArray({ min: 2 }).withMessage('At least 2 journal entry lines required'),
    body('lines.*.accountId').notEmpty().withMessage('Account ID is required for each line'),
    body('lines.*.description').optional().isString(),
    body('lines.*.debitAmount').optional().isFloat({ min: 0 }),
    body('lines.*.creditAmount').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      if (process.env.ACCOUNTING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Accounting feature is not enabled'
        });
      }

      // Validate that each line has either debit or credit amount
      const invalidLines = req.body.lines.filter(line => 
        (!line.debitAmount && !line.creditAmount) || 
        (line.debitAmount && line.creditAmount)
      );

      if (invalidLines.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Each line must have either debit OR credit amount, not both or neither'
        });
      }

      const journalEntry = await accountingService.createJournalEntry(req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: { journalEntry }
      });
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create journal entry'
      });
    }
  }
);

/**
 * @route GET /api/accounting/trial-balance
 * @desc Get trial balance
 * @access Private (Landlord, Admin)
 */
router.get('/trial-balance',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  accountingRateLimit,
  [
    query('date').isISO8601().withMessage('Valid date is required')
  ],
  async (req, res) => {
    try {
      if (process.env.ACCOUNTING !== 'true') {
        return res.status(501).json({
          success: false,
          error: 'Accounting feature is not enabled'
        });
      }

      const trialBalance = await accountingService.getTrialBalance(req.user.id, req.query.date);

      res.status(200).json({
        success: true,
        data: { trialBalance }
      });
    } catch (error) {
      console.error('Error generating trial balance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate trial balance'
      });
    }
  }
);

module.exports = router;