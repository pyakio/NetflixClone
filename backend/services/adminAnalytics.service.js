/**
 * ============================================================================
 * Platform Analytics & Business Intelligence Service
 * ============================================================================
 * Computes MongoDB aggregate metrics across accounts, profiles, watch history,
 * completion rates, watch durations, and recent platform activity.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Profile } = require('../models/Profile');
const WatchHistory = require('../models/WatchHistory');
const { Notification } = require('../models/Notification');


/**
 * Get aggregate platform metrics & business intelligence
 * @param {Date|null} startDate - Optional date filter
 * @returns {Promise<Object>}
 */
async function getPlatformStats(startDate = null) {
    const userFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const historyFilter = startDate ? { lastWatchedAt: { $gte: startDate } } : {};

    let totalAccounts = 0;
    let totalProfiles = 0;
    let totalNotifications = 0;
    let totalWatchlistItems = 0;
    let watchHistoryRecords = [];

    if (mongoose.connection.readyState === 1) {
        const [
            accCount,
            profCount,
            notifCount,
            watchHist,
            watchlistAggregate
        ] = await Promise.all([
            User.countDocuments(userFilter),
            Profile.countDocuments(userFilter),
            Notification.countDocuments(userFilter),
            WatchHistory.find(historyFilter).lean(),
            User.aggregate([
                { $unwind: "$watchlist" },
                ...(startDate ? [{ $match: { "watchlist.addedAt": { $gte: startDate } } }] : []),
                { $count: "totalItems" }
            ])
        ]);

        totalAccounts = accCount;
        totalProfiles = profCount;
        totalNotifications = notifCount;
        watchHistoryRecords = watchHist || [];
        totalWatchlistItems = (watchlistAggregate && watchlistAggregate[0]) ? watchlistAggregate[0].totalItems : 0;
    }

    const uniqueMovieIds = new Set();
    let completedCount = 0;
    let inProgressCount = 0;
    let totalProgressSeconds = 0;

    watchHistoryRecords.forEach((rec) => {
        uniqueMovieIds.add(String(rec.movieId));
        const prog = rec.progress || 0;
        const dur  = rec.duration || 7200;
        totalProgressSeconds += prog;

        if (rec.status === 'completed' || (dur > 0 && prog / dur >= 0.9)) {
            completedCount++;
        } else if (prog > 0) {
            inProgressCount++;
        }
    });

    const totalWatches = watchHistoryRecords.length;
    const completionRate = totalWatches > 0
        ? Math.round((completedCount / totalWatches) * 100)
        : 0;

    const totalMinutes = Math.round(totalProgressSeconds / 60);
    const trackedHours = (totalMinutes / 60).toFixed(1);

    return {
        accounts: totalAccounts,
        profiles: totalProfiles,
        watchHistory: totalWatches,
        uniqueMoviesWatched: uniqueMovieIds.size,
        completedMovies: completedCount,
        inProgressMovies: inProgressCount,
        completionRate: `${completionRate}%`,
        trackedWatchTimeHours: `${trackedHours}h`,
        watchlistItems: totalWatchlistItems,
        notifications: totalNotifications
    };
}

/**
 * Get top most-watched movies based on watch-history records
 * @param {number} limit
 * @param {Date|null} startDate
 * @returns {Promise<Array>}
 */
async function getPopularMovies(limit = 5, startDate = null) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }

    const matchStage = startDate ? [{ $match: { lastWatchedAt: { $gte: startDate } } }] : [];

    const pipeline = [
        ...matchStage,
        {
            $group: {
                _id: "$movieId",
                movieId: { $first: "$movieId" },
                title: { $first: "$title" },
                posterPath: { $first: "$posterPath" },
                backdropPath: { $first: "$backdropPath" },
                watchCount: { $sum: 1 },
                completedCount: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ["$status", "completed"] },
                                    { $gte: [{ $divide: ["$progress", { $ifNull: ["$duration", 7200] }] }, 0.9] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                lastWatched: { $max: "$lastWatchedAt" }
            }
        },
        { $sort: { watchCount: -1, lastWatched: -1 } },
        { $limit: limit }
    ];

    const results = await WatchHistory.aggregate(pipeline);

    return results.map((r, index) => ({
        rank: index + 1,
        movieId: r.movieId,
        title: r.title,
        posterPath: r.posterPath,
        backdropPath: r.backdropPath,
        watchCount: r.watchCount,
        completedCount: r.completedCount,
        completionRate: r.watchCount > 0 ? `${Math.round((r.completedCount / r.watchCount) * 100)}%` : '0%',
        lastWatched: r.lastWatched
    }));
}

/**
 * Get recent platform activity events
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentActivity(limit = 10) {
    if (mongoose.connection.readyState !== 1) {
        return [];
    }

    const recentNotifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return recentNotifications.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt
    }));
}

/**
 * Get paginated list of accounts with viewing profile counts
 * @param {string} search - Search query for email
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
async function getUsersList(search = '', page = 1, limit = 20) {
    if (mongoose.connection.readyState !== 1) {
        return { users: [], pagination: { total: 0, page: 1, limit, pages: 1 } };
    }

    const query = {};
    if (search && search.trim().length > 0) {
        query.email = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(query)
            .select('firebaseUid email displayName createdAt watchlist')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query)
    ]);

    const uids = users.map((u) => u.firebaseUid);
    const profileCounts = await Profile.aggregate([
        { $match: { firebaseUid: { $in: uids } } },
        { $group: { _id: "$firebaseUid", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    profileCounts.forEach((p) => {
        countMap[p._id] = p.count;
    });

    const sanitizedUsers = users.map((u) => ({
        id: u._id,
        email: u.email,
        displayName: u.displayName || '',
        createdAt: u.createdAt,
        profileCount: countMap[u.firebaseUid] || 0,
        watchlistCount: Array.isArray(u.watchlist) ? u.watchlist.length : 0
    }));

    return {
        users: sanitizedUsers,
        pagination: {
            total,
            page: Math.max(1, page),
            limit,
            pages: Math.max(1, Math.ceil(total / limit))
        }
    };
}

module.exports = {
    getPlatformStats,
    getPopularMovies,
    getRecentActivity,
    getUsersList
};
