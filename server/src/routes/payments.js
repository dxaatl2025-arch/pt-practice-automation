const express = require('express');
const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Payments endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
