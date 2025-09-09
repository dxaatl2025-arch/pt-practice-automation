const express = require('express');
const { body } = require('express-validator');
const { authenticateUser: authenticate, authorizeRoles: authorize } = require('../../../middleware/auth');
const OwnersController = require('../controller/ownersController');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const ownersController = new OwnersController();

// Rate limiting for owner portal endpoints
const ownerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route GET /api/owners/:ownerId/portfolio
 * @desc Get portfolio summary for owner
 * @access Private (Owner, Admin)
 */
router.get('/:ownerId/portfolio', 
  authenticate, 
  authorize(['LANDLORD', 'ADMIN']), 
  ownerRateLimit,
  async (req, res) => {
    await ownersController.getPortfolio(req, res);
  }
);

/**
 * @route GET /api/owners/:ownerId/reports
 * @desc Get available reports for owner
 * @access Private (Owner, Admin)
 */
router.get('/:ownerId/reports',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    await ownersController.getReports(req, res);
  }
);

/**
 * @route POST /api/owners/:ownerId/reports
 * @desc Generate new report for owner
 * @access Private (Owner, Admin)
 */
router.post('/:ownerId/reports',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  [
    body('reportType')
      .optional()
      .isIn(['financial', 'occupancy', 'maintenance', 'portfolio'])
      .withMessage('Invalid report type'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('format')
      .optional()
      .isIn(['json', 'pdf', 'csv'])
      .withMessage('Invalid format')
  ],
  async (req, res) => {
    await ownersController.generateReport(req, res);
  }
);

/**
 * @route GET /api/owners/:ownerId/reports/:reportId/download
 * @desc Download report in specified format
 * @access Private (Owner, Admin)
 */
router.get('/:ownerId/reports/:reportId/download',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    await ownersController.downloadReport(req, res);
  }
);

/**
 * @route GET /api/owners/:ownerId/maintenance
 * @desc Get maintenance summary for owner
 * @access Private (Owner, Admin)
 */
router.get('/:ownerId/maintenance',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    await ownersController.getMaintenanceSummary(req, res);
  }
);

/**
 * @route GET /api/owners/:ownerId/occupancy-trends
 * @desc Get occupancy trends for owner
 * @access Private (Owner, Admin)
 */
router.get('/:ownerId/occupancy-trends',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    await ownersController.getOccupancyTrends(req, res);
  }
);

/**
 * Convenience routes for current authenticated user
 */

/**
 * @route GET /api/owners/my/portfolio
 * @desc Get portfolio summary for authenticated owner
 * @access Private (Owner, Admin)
 */
router.get('/my/portfolio',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    req.params.ownerId = req.user.id;
    await ownersController.getPortfolio(req, res);
  }
);

/**
 * @route GET /api/owners/my/reports
 * @desc Get reports for authenticated owner
 * @access Private (Owner, Admin)
 */
router.get('/my/reports',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    req.params.ownerId = req.user.id;
    await ownersController.getReports(req, res);
  }
);

/**
 * @route POST /api/owners/my/reports
 * @desc Generate report for authenticated owner
 * @access Private (Owner, Admin)
 */
router.post('/my/reports',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  [
    body('reportType')
      .optional()
      .isIn(['financial', 'occupancy', 'maintenance', 'portfolio'])
      .withMessage('Invalid report type'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    body('format')
      .optional()
      .isIn(['json', 'pdf', 'csv'])
      .withMessage('Invalid format')
  ],
  async (req, res) => {
    req.params.ownerId = req.user.id;
    await ownersController.generateReport(req, res);
  }
);

/**
 * @route GET /api/owners/my/maintenance
 * @desc Get maintenance summary for authenticated owner
 * @access Private (Owner, Admin)
 */
router.get('/my/maintenance',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    req.params.ownerId = req.user.id;
    await ownersController.getMaintenanceSummary(req, res);
  }
);

/**
 * @route GET /api/owners/my/occupancy-trends
 * @desc Get occupancy trends for authenticated owner
 * @access Private (Owner, Admin)
 */
router.get('/my/occupancy-trends',
  authenticate,
  authorize(['LANDLORD', 'ADMIN']),
  ownerRateLimit,
  async (req, res) => {
    req.params.ownerId = req.user.id;
    await ownersController.getOccupancyTrends(req, res);
  }
);

module.exports = router;