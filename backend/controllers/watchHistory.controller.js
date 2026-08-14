// ==========================================================================
// Watch History Controller — Task 16: Continue Watching & History Endpoints
// ==========================================================================

const WatchHistory = require('../models/WatchHistory');
const { createNotification } = require('../services/notification.service');

/**
 * @desc    Get all watch history records for the authenticated user
 * @route   GET /api/watch-history
 * @access  Private (Firebase Token)
 */
const getWatchHistory = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const query = { firebaseUid: req.user.uid };
        if (profileId) {
            query.profileId = String(profileId);
        }

        const history = await WatchHistory.find(query)
            .sort({ lastWatchedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: history.length,
            history: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Record or update watch progress for a movie
 * @route   POST /api/watch-history
 * @access  Private (Firebase Token)
 */
const addToWatchHistory = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.body.profileId || null;
        const {
            movieId,
            title,
            posterPath,
            backdropPath,
            progress,
            duration
        } = req.body;

        // Validation
        const parsedMovieId = Number(movieId);
        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid numeric movieId is required.'
            });
        }

        const cleanTitle = (title || '').trim();
        if (!cleanTitle) {
            return res.status(400).json({
                success: false,
                message: 'A valid movie title is required.'
            });
        }

        let parsedDuration = Number(duration) || 7200;
        if (parsedDuration <= 0) parsedDuration = 7200;

        let parsedProgress = Number(progress) || 0;
        if (parsedProgress < 0) parsedProgress = 0;
        if (parsedProgress > parsedDuration) parsedProgress = parsedDuration;

        const filter = {
            firebaseUid: req.user.uid,
            movieId: parsedMovieId
        };
        if (profileId) {
            filter.profileId = String(profileId);
        }

        const updateData = {
            title: cleanTitle,
            profileId: profileId ? String(profileId) : null,
            posterPath: posterPath ? String(posterPath).trim() : null,
            backdropPath: backdropPath ? String(backdropPath).trim() : null,
            progress: parsedProgress,
            duration: parsedDuration,
            lastWatchedAt: new Date()
        };

        const record = await WatchHistory.findOneAndUpdate(
            filter,
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Safely trigger WATCH_STARTED notification (Task 20)
        createNotification({
            firebaseUid: req.user.uid,
            type: 'WATCH_STARTED',
            title: 'Continue Watching',
            message: `You started watching "${cleanTitle}".`,
            movieId: parsedMovieId,
            imagePath: record.posterPath
        }).catch(() => {});

        return res.status(200).json({
            success: true,
            message: `Watch progress saved for "${cleanTitle}".`,
            record: record
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update progress on an existing watch history record
 * @route   PATCH /api/watch-history/:movieId
 * @access  Private (Firebase Token)
 */
const updateProgress = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.body.profileId || null;
        const parsedMovieId = Number(req.params.movieId);
        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid numeric movieId parameter is required.'
            });
        }

        const { progress, duration } = req.body;
        const updateFields = { lastWatchedAt: new Date() };

        if (typeof duration === 'number' && duration > 0) {
            updateFields.duration = duration;
        }

        if (typeof progress === 'number' && progress >= 0) {
            updateFields.progress = progress;
        }

        const filter = {
            firebaseUid: req.user.uid,
            movieId: parsedMovieId
        };
        if (profileId) {
            filter.profileId = String(profileId);
        }

        const record = await WatchHistory.findOneAndUpdate(
            filter,
            { $set: updateFields },
            { new: true }
        );

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Watch history record not found for this movie.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Watch progress updated.',
            record: record
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a movie from watch history
 * @route   DELETE /api/watch-history/:movieId
 * @access  Private (Firebase Token)
 */
const removeFromWatchHistory = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const parsedMovieId = Number(req.params.movieId);
        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid numeric movieId parameter is required.'
            });
        }

        const filter = {
            firebaseUid: req.user.uid,
            movieId: parsedMovieId
        };
        if (profileId) {
            filter.profileId = String(profileId);
        }

        const deleted = await WatchHistory.findOneAndDelete(filter);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Watch history record not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Removed "${deleted.title}" from watch history.`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user viewing insights & activity analytics for active profile (Task 34)
 * @route   GET /api/watch-history/insights
 * @access  Private (Firebase Token)
 */
const getViewingInsights = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const period = (req.query.period || '30d').toLowerCase();

        const query = { firebaseUid: req.user.uid };
        if (profileId) {
            query.profileId = String(profileId);
        }

        const now = new Date();
        if (period === '7d') {
            query.lastWatchedAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        } else if (period === '30d') {
            query.lastWatchedAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        } else if (period !== 'all') {
            // Safe fallback if unknown period
            query.lastWatchedAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        }

        const records = await WatchHistory.find(query)
            .sort({ lastWatchedAt: -1 })
            .lean();

        let totalProgressSeconds = 0;
        let completedCount = 0;
        let inProgressCount = 0;

        const uniqueMovies = new Map();

        records.forEach((rec) => {
            const mid = String(rec.movieId);
            if (!uniqueMovies.has(mid)) {
                uniqueMovies.set(mid, rec);
            }

            const prog = rec.progress || 0;
            const dur  = rec.duration || 7200;
            totalProgressSeconds += prog;

            const isDone = (rec.status === 'completed' || (dur > 0 && prog / dur >= 0.9));
            if (isDone) {
                completedCount++;
            } else if (prog > 0) {
                inProgressCount++;
            }
        });

        const totalMinutes = Math.round(totalProgressSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const watchTimeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        // Generate factual rule-based insight
        let insightMessage = 'No viewing activity recorded for this period.';
        if (completedCount > 0) {
            insightMessage = `You completed ${completedCount} ${completedCount === 1 ? 'title' : 'titles'} in this period.`;
        } else if (inProgressCount > 0) {
            insightMessage = `You have ${inProgressCount} ${inProgressCount === 1 ? 'title' : 'titles'} currently in progress.`;
        } else if (records.length > 0) {
            insightMessage = `You watched ${records.length} ${records.length === 1 ? 'title' : 'titles'} in this period.`;
        }

        const recentList = records.slice(0, 10).map((r) => ({
            movieId: r.movieId,
            title: r.title,
            posterPath: r.posterPath,
            backdropPath: r.backdropPath,
            progress: r.progress,
            duration: r.duration,
            status: r.status,
            lastWatchedAt: r.lastWatchedAt
        }));

        return res.status(200).json({
            success: true,
            period: period,
            summary: {
                moviesWatched: uniqueMovies.size,
                completed: completedCount,
                inProgress: inProgressCount,
                trackedWatchTimeMinutes: totalMinutes,
                trackedWatchTimeFormatted: watchTimeFormatted,
                insight: insightMessage
            },
            recent: recentList,
            timeline: recentList
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWatchHistory,
    addToWatchHistory,
    updateProgress,
    removeFromWatchHistory,
    deleteFromWatchHistory: removeFromWatchHistory,
    getViewingInsights
};
