const express = require('express');
const UploadsController = require('../controller/uploadsController');
const { authenticateUser: authenticateToken, authorizeRoles: requireRole } = require('../../../middleware/auth');

const router = express.Router();
const uploadsController = new UploadsController();

// Create signed upload URL (authenticated users only)
router.post('/uploads/signed-url',
  authenticateToken,
  requireRole('TENANT', 'LANDLORD'),
  uploadsController.createSignedUrl.bind(uploadsController)
);

module.exports = router;