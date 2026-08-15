/**
 * ============================================================================
 * Personalized Recommendation API Controller
 * ============================================================================
 * Invokes the recommendation service to compute profile-scoped genre affinities,
 * "Because You Watched" anchors, and personalized content collections.
 */

const { generateUserRecommendations } = require('../services/recommendation.service');

/**
 * @desc    Get personalized movie recommendations for the authenticated user
 * @route   GET /api/recommendations
 * @access  Private (Firebase Token)
 */
const getRecommendations = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const result = await generateUserRecommendations(firebaseUid, profileId);

        return res.status(200).json({
            success: true,
            personalized: result.personalized,
            heroRecommendation: result.heroRecommendation,
            recommendations: result.recommendations,
            topGenres: result.topGenres || []
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRecommendations
};
