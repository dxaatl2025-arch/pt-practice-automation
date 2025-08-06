const express = require('express');
const router = express.Router();

// @route   GET /api/tenants
// @desc    Get all tenants
// @access  Private
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Tenants endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
