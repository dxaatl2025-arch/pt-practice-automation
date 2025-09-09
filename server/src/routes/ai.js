// server/src/routes/ai.js
const express = require('express');
const router = express.Router();
const { generateLease } = require('../controllers/aiController');

// Import AI modules
const { routes: leasingAgentRoutes } = require('../modules/ai/leasingAgent');
const { routes: rentOptimizerRoutes } = require('../modules/ai/rentOptimizer');
const { routes: turnoverPredictorRoutes } = require('../modules/ai/turnoverPredictor');
const { routes: forecastingRoutes } = require('../modules/ai/forecasting');
const { routes: documentChatRoutes } = require('../modules/ai/documentChat');

// Mount AI module routes
router.use('/leasing', leasingAgentRoutes);
router.use('/rent', rentOptimizerRoutes);
router.use('/turnover', turnoverPredictorRoutes);
router.use('/forecast', forecastingRoutes);
router.use('/', documentChatRoutes); // Mount at root level for /ai/documents and /ai/chat

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