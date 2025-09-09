const express = require('express');
const router = express.Router();

// NOTE:
// This file should ONLY define routes and export the router.
// Feature flags are handled where the router is mounted (in server.js).

// Placeholder route (only available when APPLICATIONS_E2E=true and server mounts it)
router.get('/applications/health', (_req, res) => {
  res.json({ ok: true, module: 'applications' });
});

module.exports = router;