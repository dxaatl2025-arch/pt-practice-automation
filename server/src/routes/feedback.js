const express = require('express');
const { body, query, validationResult } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Create feedback
router.post('/', [
  body('toUserId').isLength({ min: 1 }).withMessage('To user ID required'),
  body('thumbsUp').isBoolean().withMessage('Thumbs up must be boolean'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment too long'),
  body('leaseId').optional().isLength({ min: 1 }).withMessage('Invalid lease ID'),
  handleValidationErrors
], feedbackController.createFeedback);

// Get feedback
router.get('/', [
  query('userId').optional().isLength({ min: 1 }).withMessage('Invalid user ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
], feedbackController.getFeedback);

module.exports = router;