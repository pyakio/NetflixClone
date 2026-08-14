// ==========================================================================
// Account Controller — Task 22: Account Cleanup & Deletion Handlers
// ==========================================================================

const User = require('../models/User');
const { Profile } = require('../models/Profile');
const WatchHistory = require('../models/WatchHistory');
const { Notification } = require('../models/Notification');

/**
 * @desc    Delete all MongoDB records associated with the authenticated user's Firebase account
 * @route   DELETE /api/account
 * @access  Private (Firebase Token)
 */
const deleteAccountData = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;

        // Cascade deletion across all user-associated collections
        await Promise.all([
            User.deleteOne({ firebaseUid }),
            Profile.deleteMany({ firebaseUid }),
            WatchHistory.deleteMany({ firebaseUid }),
            Notification.deleteMany({ firebaseUid })
        ]);

        return res.status(200).json({
            success: true,
            message: 'All account data and viewing profiles have been permanently removed.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    deleteAccountData
};
