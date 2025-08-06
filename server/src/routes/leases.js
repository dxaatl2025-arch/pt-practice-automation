const express = require('express');
const router = express.Router();

// @route   GET /api/leases
// @desc    Get all leases
// @access  Private
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Leases endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
