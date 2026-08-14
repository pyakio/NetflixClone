// ==========================================================================
// Account Routes — Task 22: Account Settings & Security Endpoints
// ==========================================================================

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { deleteAccountData } = require('../controllers/account.controller');

// All account endpoints require verified Firebase Token
router.use(requireAuth);

router.delete('/', deleteAccountData);

module.exports = router;
