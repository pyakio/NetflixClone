/**
 * ============================================================================
 * Account Lifecycle REST API Routes
 * ============================================================================
 * Defines endpoints for user account management and data cascade deletion.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { deleteAccountData } = require('../controllers/account.controller');

// All account endpoints require verified Firebase Token
router.use(requireAuth);

router.delete('/', deleteAccountData);

module.exports = router;
