const express = require('express');
const router = express.Router();

// @route   GET /api/landlords
// @desc    Get all landlords
// @access  Private
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Landlords endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
