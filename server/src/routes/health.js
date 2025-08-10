// server/src/routes/health.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRESQL_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Main health check
router.get('/', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({
      success: true,
      message: 'PropertyPulse Rental Applications API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        email: 'configured',
        pdf_generation: 'available',
        ai_scoring: process.env.ENABLE_AI_SCORING === 'true' ? 'enabled' : 'disabled'
      },
      database_time: dbResult.rows[0].now
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM rental_applications');
    res.json({
      success: true,
      message: 'Database connection healthy',
      total_applications: parseInt(result.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Email service health check
router.get('/email', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const isHealthy = await emailService.testConnection();
    
    res.json({
      success: isHealthy,
      message: isHealthy ? 'Email service healthy' : 'Email service unavailable',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Email service check failed',
      error: error.message
    });
  }
});

// AI scoring service health check
router.get('/ai-scoring', async (req, res) => {
  try {
    const aiScoringService = require('../services/aiScoringService');
    const stats = await aiScoringService.getScoringStats();
    
    res.json({
      success: true,
      message: 'AI scoring service status',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI scoring service check failed',
      error: error.message
    });
  }
});

module.exports = router;