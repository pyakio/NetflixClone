/**
 * ============================================================================
 * User Notification REST API Routes
 * ============================================================================
 * Defines endpoints for notification retrieval, unread counts, and read states.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notification.controller');

// All notification routes are protected by Firebase Auth
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
