/**
 * ============================================================================
 * Input Validation & Sanitization Middleware
 * ============================================================================
 * Sanitizes incoming request bodies and validates URL parameters (ObjectIds,
 * movie IDs, watchlist mutations) before routing to controllers.
 */

const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId parameter
 * @param {string} paramName - Name of request parameter (e.g. 'profileId', 'id')
 */
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const idValue = req.params[paramName];
        if (!idValue || !mongoose.Types.ObjectId.isValid(idValue)) {
            return res.status(400).json({
                success: false,
                message: `Invalid identifier provided: ${paramName}`
            });
        }
        next();
    };
};

/**
 * Validate Profile Creation / Update Body
 */
const validateProfileInput = (req, res, next) => {
    const { name, avatar, isKidsProfile } = req.body;

    if (req.method === 'POST') {
        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Profile name is required and must be between 2 and 30 characters.'
            });
        }
    } else if (req.method === 'PATCH' && name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Profile name must be between 2 and 30 characters.'
            });
        }
    }

    const ALLOWED_AVATARS = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6'];
    if (avatar !== undefined && !ALLOWED_AVATARS.includes(avatar)) {
        return res.status(400).json({
            success: false,
            message: `Invalid avatar. Must be one of: ${ALLOWED_AVATARS.join(', ')}`
        });
    }

    if (isKidsProfile !== undefined && typeof isKidsProfile !== 'boolean') {
        return res.status(400).json({
            success: false,
            message: 'isKidsProfile must be a boolean value.'
        });
    }

    next();
};

/**
 * Validate Watchlist Item Input
 */
const validateWatchlistInput = (req, res, next) => {
    const { movieId, title } = req.body;

    const parsedId = parseInt(movieId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid numeric movieId is required.'
        });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Movie title is required.'
        });
    }

    next();
};

/**
 * Validate Watch History Progress Input
 */
const validateWatchHistoryInput = (req, res, next) => {
    const { progress, duration, status } = req.body;

    if (progress !== undefined) {
        const numProgress = Number(progress);
        if (isNaN(numProgress) || numProgress < 0) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be a non-negative number.'
            });
        }
    }

    if (duration !== undefined) {
        const numDuration = Number(duration);
        if (isNaN(numDuration) || numDuration < 0) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be a non-negative number.'
            });
        }
    }

    if (status !== undefined) {
        const ALLOWED_STATUSES = ['in-progress', 'completed'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
            });
        }
    }

    next();
};

module.exports = {
    validateObjectId,
    validateProfileInput,
    validateWatchlistInput,
    validateWatchHistoryInput
};
