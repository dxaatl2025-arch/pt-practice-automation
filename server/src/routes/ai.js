// server/src/routes/ai.js
const express = require('express');
const router = express.Router();
const { generateLease } = require('../controllers/aiController');

// POST /api/ai/generate-lease
router.post('/generate-lease', generateLease);

// Health check for AI service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI service is running',
    service: 'OpenAI GPT-4 Lease Generator',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;