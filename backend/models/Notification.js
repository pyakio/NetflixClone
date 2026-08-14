// ==========================================================================
// Notification Model — Task 20: User Activity & Notification Schema
// ==========================================================================

const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
    'WATCHLIST_ADDED',
    'WATCHLIST_REMOVED',
    'WATCH_STARTED',
    'PROFILE_UPDATED',
    'RECOMMENDATION_AVAILABLE',
    'TRAILER_AVAILABLE'
];

const notificationSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            trim: true,
            index: true
        },
        type: {
            type: String,
            required: [true, 'Notification type is required'],
            enum: NOTIFICATION_TYPES
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
            maxlength: 120
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
            maxlength: 500
        },
        movieId: {
            type: Number,
            default: null
        },
        imagePath: {
            type: String,
            default: null,
            trim: true
        },
        read: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes for user querying & unread counting
notificationSchema.index({ firebaseUid: 1, createdAt: -1 });
notificationSchema.index({ firebaseUid: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    Notification,
    NOTIFICATION_TYPES
};
