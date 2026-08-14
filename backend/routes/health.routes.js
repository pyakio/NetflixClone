// ==========================================================================
// Health Routes — Task 13: Public Health Check
// ==========================================================================

const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/db');
const { isFirebaseAdminConfigured } = require('../config/firebase');

/**
 * @desc    Public health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Netflix Clone Backend API is healthy and running.',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        environment: process.env.NODE_ENV || 'development',
        database: getDBStatus(),
        firebaseAdmin: isFirebaseAdminConfigured() ? 'configured' : 'unconfigured'
    });
});

/**
 * @desc    Readiness check endpoint (verifies database readiness)
 * @route   GET /api/health/ready
 * @access  Public
 */
router.get('/ready', (req, res) => {
    const dbStatus = getDBStatus();
    const isReady = dbStatus === 'connected';

    res.status(isReady ? 200 : 503).json({
        success: isReady,
        status: isReady ? 'ready' : 'not_ready',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
