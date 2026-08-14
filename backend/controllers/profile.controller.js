// ==========================================================================
// Profile Controller — Task 21: Multiple Viewing Profiles Handlers
// ==========================================================================

const { Profile, ALLOWED_AVATARS } = require('../models/Profile');
const WatchHistory = require('../models/WatchHistory');
const User = require('../models/User');

const MAX_PROFILES_PER_ACCOUNT = 5;

/**
 * Helper to ensure an account has at least one default viewing profile,
 * migrating legacy unassigned data to the default profile.
 */
async function getOrCreateDefaultProfile(firebaseUid, displayName = null) {
    let profiles = await Profile.find({ firebaseUid }).sort({ createdAt: 1 });

    if (profiles.length === 0) {
        const defaultName = (displayName && displayName.trim().length >= 2)
            ? displayName.trim()
            : 'Main Profile';

        const defaultProfile = await Profile.create({
            firebaseUid,
            name: defaultName,
            avatar: 'avatar-1',
            isKidsProfile: false
        });

        const profileIdStr = String(defaultProfile._id);

        // Migrate legacy watch history entries without profileId
        await WatchHistory.updateMany(
            { firebaseUid, $or: [{ profileId: null }, { profileId: { $exists: false } }] },
            { $set: { profileId: profileIdStr } }
        ).catch(() => {});

        // Migrate legacy watchlist items without profileId in User document
        await User.updateMany(
            { firebaseUid, "watchlist.profileId": null },
            { $set: { "watchlist.$[elem].profileId": profileIdStr } },
            { arrayFilters: [{ "elem.profileId": null }] }
        ).catch(() => {});

        profiles = [defaultProfile];
    }

    return profiles;
}

/**
 * @desc    Get all viewing profiles for the authenticated Firebase account
 * @route   GET /api/profiles
 * @access  Private (Firebase Token)
 */
const getProfiles = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const displayName = req.user.displayName;

        const profiles = await getOrCreateDefaultProfile(firebaseUid, displayName);

        return res.status(200).json({
            success: true,
            count: profiles.length,
            profiles: profiles.map((p) => ({
                id: p._id,
                _id: p._id,
                name: p.name,
                avatar: p.avatar,
                isKidsProfile: p.isKidsProfile,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new viewing profile (max 5 per account)
 * @route   POST /api/profiles
 * @access  Private (Firebase Token)
 */
const createProfile = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { name, avatar, isKidsProfile } = req.body;

        // Check profile count limit
        const currentCount = await Profile.countDocuments({ firebaseUid });
        if (currentCount >= MAX_PROFILES_PER_ACCOUNT) {
            return res.status(400).json({
                success: false,
                message: `Maximum of ${MAX_PROFILES_PER_ACCOUNT} profiles per account reached.`
            });
        }

        // Validate name
        const cleanName = (name || '').trim();
        if (cleanName.length < 2 || cleanName.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Profile name must be between 2 and 30 characters long.'
            });
        }

        // Validate avatar
        const cleanAvatar = (avatar && ALLOWED_AVATARS.includes(avatar))
            ? avatar
            : 'avatar-1';

        const newProfile = await Profile.create({
            firebaseUid,
            name: cleanName,
            avatar: cleanAvatar,
            isKidsProfile: Boolean(isKidsProfile)
        });

        return res.status(201).json({
            success: true,
            message: `Profile "${cleanName}" created successfully.`,
            profile: {
                id: newProfile._id,
                _id: newProfile._id,
                name: newProfile.name,
                avatar: newProfile.avatar,
                isKidsProfile: newProfile.isKidsProfile,
                createdAt: newProfile.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a viewing profile (name and/or avatar)
 * @route   PATCH /api/profiles/:profileId
 * @access  Private (Firebase Token)
 */
const updateProfile = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { profileId } = req.params;
        const { name, avatar, isKidsProfile } = req.body;

        const profile = await Profile.findOne({ _id: profileId, firebaseUid });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found or unauthorized.'
            });
        }

        if (name !== undefined) {
            const cleanName = String(name).trim();
            if (cleanName.length < 2 || cleanName.length > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'Profile name must be between 2 and 30 characters long.'
                });
            }
            profile.name = cleanName;
        }

        if (avatar !== undefined) {
            if (ALLOWED_AVATARS.includes(avatar)) {
                profile.avatar = avatar;
            }
        }

        if (isKidsProfile !== undefined) {
            profile.isKidsProfile = Boolean(isKidsProfile);
        }

        await profile.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            profile: {
                id: profile._id,
                _id: profile._id,
                name: profile.name,
                avatar: profile.avatar,
                isKidsProfile: profile.isKidsProfile,
                updatedAt: profile.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a viewing profile (cannot delete final remaining profile)
 * @route   DELETE /api/profiles/:profileId
 * @access  Private (Firebase Token)
 */
const deleteProfile = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { profileId } = req.params;

        const totalProfiles = await Profile.countDocuments({ firebaseUid });
        if (totalProfiles <= 1) {
            return res.status(400).json({
                success: false,
                message: 'You must keep at least one profile.'
            });
        }

        const deleted = await Profile.findOneAndDelete({ _id: profileId, firebaseUid });
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found or unauthorized.'
            });
        }

        // Clean up profile's watch history
        await WatchHistory.deleteMany({ firebaseUid, profileId }).catch(() => {});

        // Clean up profile's watchlist items from User doc
        await User.updateOne(
            { firebaseUid },
            { $pull: { watchlist: { profileId: String(profileId) } } }
        ).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Profile "${deleted.name}" deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    getOrCreateDefaultProfile
};
