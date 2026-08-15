/**
 * ============================================================================
 * User Account & Profile Metadata REST API Routes
 * ============================================================================
 * Defines endpoints for retrieving user details and profile metadata synchronization.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getCurrentUser,
    updateCurrentUser
} = require('../controllers/user.controller');

/**
 * @route   GET /api/users/me   - Get current profile & metadata
 * @route   PATCH /api/users/me - Update display name
 * @access  Private (Requires Firebase ID Token)
 */
router.route('/me')
    .get(requireAuth, getCurrentUser)
    .patch(requireAuth, updateCurrentUser);

module.exports = router;
