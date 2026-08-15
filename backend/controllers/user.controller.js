/**
 * ============================================================================
 * User Account & Profile Metadata Controller
 * ============================================================================
 * Handles user profile retrieval, account initialization on first login,
 * and display name synchronization.
 */

const User = require('../models/User');
const { createNotification } = require('../services/notification.service');

/**
 * @desc    Get current user profile & account metadata
 * @route   GET /api/users/me
 * @access  Private (Requires Firebase Auth Bearer Token)
 */
const getCurrentUser = async (req, res, next) => {
    try {
        const { uid, email, displayName } = req.user;

        // Check if user already exists in MongoDB
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                email: email || `${uid}@placeholder.firebase`,
                displayName: displayName || '',
                watchlist: []
            });
            console.log(`👤 Created new MongoDB user record for Firebase UID: ${uid}`);
        } else if (displayName && user.displayName !== displayName) {
            // Keep display name in sync if updated in Firebase
            user.displayName = displayName;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            user: {
                firebaseUid: user.firebaseUid,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                watchlistCount: Array.isArray(user.watchlist) ? user.watchlist.length : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update current user display name
 * @route   PATCH /api/users/me
 * @access  Private (Requires Firebase Auth Bearer Token)
 */
const updateCurrentUser = async (req, res, next) => {
    try {
        const { displayName } = req.body;

        // Validation
        if (typeof displayName !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Display name must be a string.'
            });
        }

        const cleanName = displayName.trim();

        if (cleanName.length < 2 || cleanName.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Display name must be between 2 and 50 characters long.'
            });
        }

        let user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user) {
            user = await User.create({
                firebaseUid: req.user.uid,
                email: req.user.email || `${req.user.uid}@placeholder.firebase`,
                displayName: cleanName,
                watchlist: []
            });
        } else {
            user.displayName = cleanName;
            await user.save();
        }

        // Dispatch PROFILE_UPDATED notification asynchronously
        createNotification({
            firebaseUid: req.user.uid,
            type: 'PROFILE_UPDATED',
            title: 'Profile Updated',
            message: 'Your profile information was successfully updated.'
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                firebaseUid: user.firebaseUid,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                watchlistCount: Array.isArray(user.watchlist) ? user.watchlist.length : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCurrentUser,
    updateCurrentUser
};
