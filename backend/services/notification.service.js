/**
 * ============================================================================
 * User Notification Service
 * ============================================================================
 * Handles non-blocking notification generation, paginated retrieval, unread count
 * calculations, and batch read-state mutations.
 */

const { Notification } = require('../models/Notification');

/**
 * Safely create a notification without throwing or breaking calling operations
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
async function createNotification({ firebaseUid, type, title, message, movieId = null, imagePath = null }) {
    if (!firebaseUid || !type || !title || !message) {
        return null;
    }

    try {
        const notification = new Notification({
            firebaseUid,
            type,
            title,
            message,
            movieId: movieId ? Number(movieId) : null,
            imagePath: imagePath || null,
            read: false
        });

        await notification.save();
        return notification;
    } catch (err) {
        console.error('Notification creation safe warning:', err.message);
        return null; // Do not bubble up error to caller
    }
}

/**
 * Retrieve paginated notifications for an authenticated user
 */
async function getUserNotifications(firebaseUid, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (validPage - 1) * validLimit;

    const query = { firebaseUid };
    if (unreadOnly === true || unreadOnly === 'true') {
        query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(validLimit)
            .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ firebaseUid, read: false })
    ]);

    return {
        notifications,
        pagination: {
            page: validPage,
            limit: validLimit,
            total,
            totalPages: Math.ceil(total / validLimit) || 1
        },
        unreadCount
    };
}

/**
 * Retrieve total unread notifications count for a user
 */
async function getUnreadCount(firebaseUid) {
    return await Notification.countDocuments({ firebaseUid, read: false });
}

/**
 * Mark a single notification as read (verifying user ownership)
 */
async function markAsRead(firebaseUid, notificationId) {
    const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, firebaseUid },
        { read: true },
        { new: true }
    ).lean();

    return updated;
}

/**
 * Mark all notifications for a user as read
 */
async function markAllAsRead(firebaseUid) {
    const result = await Notification.updateMany(
        { firebaseUid, read: false },
        { $set: { read: true } }
    );

    return { modifiedCount: result.modifiedCount || 0 };
}

/**
 * Delete a specific notification (verifying user ownership)
 */
async function deleteNotification(firebaseUid, notificationId) {
    const deleted = await Notification.findOneAndDelete({
        _id: notificationId,
        firebaseUid
    }).lean();

    return deleted;
}

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
