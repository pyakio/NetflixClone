/**
 * ============================================================================
 * User Notification & Activity Feed Controller
 * ============================================================================
 * Handles paginated notification queries, unread counts, marking notifications as read,
 * and deleting notification items.
 */

const notificationService = require('../services/notification.service');

/**
 * @desc    Get paginated notifications for the authenticated user
 * @route   GET /api/notifications
 * @access  Private (Firebase Token)
 */
const getNotifications = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { page, limit, unreadOnly } = req.query;

        const result = await notificationService.getUserNotifications(firebaseUid, {
            page,
            limit,
            unreadOnly
        });

        return res.status(200).json({
            success: true,
            notifications: result.notifications,
            pagination: result.pagination,
            unreadCount: result.unreadCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get unread notifications count for the authenticated user
 * @route   GET /api/notifications/unread-count
 * @access  Private (Firebase Token)
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const count = await notificationService.getUnreadCount(firebaseUid);

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Firebase Token)
 */
const markAsRead = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const notificationId = req.params.id;

        const updated = await notificationService.markAsRead(firebaseUid, notificationId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or unauthorized.'
            });
        }

        return res.status(200).json({
            success: true,
            notification: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private (Firebase Token)
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const result = await notificationService.markAllAsRead(firebaseUid);

        return res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Firebase Token)
 */
const deleteNotification = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const notificationId = req.params.id;

        const deleted = await notificationService.deleteNotification(firebaseUid, notificationId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or unauthorized.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Notification removed.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
