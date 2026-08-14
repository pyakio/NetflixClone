// ==========================================================================
// Admin Controller — Task 23: Admin API Endpoints Handlers
// ==========================================================================

const {
    getPlatformStats,
    getPopularMovies,
    getRecentActivity,
    getUsersList
} = require('../services/adminAnalytics.service');

function parseDateRange(range) {
    if (!range) return null;
    const now = new Date();
    switch (range.toLowerCase()) {
        case '7d':
        case '7days':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
        case '30days':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
        case '90days':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
            return null;
    }
}

/**
 * @desc    Get aggregate platform metrics
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
const getStats = async (req, res, next) => {
    try {
        const startDate = parseDateRange(req.query.range);
        const stats = await getPlatformStats(startDate);

        return res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get top watched movies ranking
 * @route   GET /api/admin/popular-movies
 * @access  Private (Admin Only)
 */
const getPopular = async (req, res, next) => {
    try {
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
        const startDate = parseDateRange(req.query.range);
        const movies = await getPopularMovies(limit, startDate);

        return res.status(200).json({
            success: true,
            count: movies.length,
            movies
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get recent platform activity events
 * @route   GET /api/admin/activity
 * @access  Private (Admin Only)
 */
const getActivity = async (req, res, next) => {
    try {
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const activity = await getRecentActivity(limit);

        return res.status(200).json({
            success: true,
            count: activity.length,
            activity
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get paginated user accounts list
 * @route   GET /api/admin/users
 * @access  Private (Admin Only)
 */
const getUsers = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const result = await getUsersList(search, page, limit);

        return res.status(200).json({
            success: true,
            users: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const ContentConfig = require('../models/ContentConfig');
const AdminAuditLog = require('../models/AdminAuditLog');

// In-memory fallback if MongoDB is not connected
let memoryContentConfig = {
    featuredMovie: {
        movieId: 102,
        title: 'Inception',
        overview: 'A thief who steals corporate secrets through dream-sharing technology.',
        posterPath: 'images/movie2.jpg',
        backdropPath: 'images/movie2.jpg',
        updatedBy: 'system',
        updatedAt: new Date()
    },
    sections: [
        { id: 'continue-watching', title: 'Continue Watching', type: 'personalized', visible: true, order: 1 },
        { id: 'for-you', title: 'Top Picks For You', type: 'personalized', visible: true, order: 2 },
        { id: 'trending', title: 'Trending Now', type: 'tmdb-trending', visible: true, order: 3 },
        { id: 'popular', title: 'Popular on Netflix', type: 'tmdb-popular', visible: true, order: 4 },
        { id: 'action', title: 'Action Movies', type: 'genre', visible: true, order: 5 },
        { id: 'categories', title: 'Browse by Category', type: 'categories', visible: true, order: 6 },
        { id: 'my-list', title: 'My List', type: 'library', visible: true, order: 7 }
    ],
    collections: []
};

const memoryAuditLogs = [];

async function logAdminAction(req, action, resource, details) {
    const entry = {
        adminEmail: req.user.email || 'admin',
        adminUid: req.user.uid,
        action,
        resource,
        details,
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date()
    };
    try {
        if (AdminAuditLog.db && AdminAuditLog.db.readyState === 1) {
            await AdminAuditLog.create(entry);
        } else {
            memoryAuditLogs.unshift(entry);
            if (memoryAuditLogs.length > 200) memoryAuditLogs.pop();
        }
    } catch (e) {
        memoryAuditLogs.unshift(entry);
    }
}

/**
 * @desc    Get current content configuration (Public & Admin)
 * @route   GET /api/admin/content / GET /api/content/config
 */
const getContentConfig = async (req, res, next) => {
    try {
        let config = null;
        if (ContentConfig.db && ContentConfig.db.readyState === 1) {
            config = await ContentConfig.findOne().lean();
            if (!config) {
                config = await ContentConfig.create(memoryContentConfig);
            }
        } else {
            config = memoryContentConfig;
        }

        return res.status(200).json({
            success: true,
            config
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update featured movie hero configuration
 * @route   PATCH /api/admin/content/featured
 * @access  Private (Admin Only)
 */
const updateFeaturedMovie = async (req, res, next) => {
    try {
        const { movieId, title, overview, posterPath, backdropPath } = req.body;
        const parsedId = Number(movieId);

        if (!parsedId || isNaN(parsedId) || parsedId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid positive numeric movieId is required.'
            });
        }

        const cleanTitle = (title || 'Featured Movie').trim().slice(0, 100);
        const featuredData = {
            movieId: parsedId,
            title: cleanTitle,
            overview: (overview || '').trim().slice(0, 500),
            posterPath: posterPath ? String(posterPath).trim() : '',
            backdropPath: backdropPath ? String(backdropPath).trim() : '',
            updatedBy: req.user.email || req.user.uid,
            updatedAt: new Date()
        };

        if (ContentConfig.db && ContentConfig.db.readyState === 1) {
            await ContentConfig.findOneAndUpdate(
                {},
                { $set: { featuredMovie: featuredData, updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        } else {
            memoryContentConfig.featuredMovie = featuredData;
            memoryContentConfig.updatedAt = new Date();
        }

        await logAdminAction(req, 'UPDATE_FEATURED_MOVIE', `movie:${parsedId}`, { title: cleanTitle });

        return res.status(200).json({
            success: true,
            message: `Featured movie updated to "${cleanTitle}".`,
            featuredMovie: featuredData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update homepage sections ordering and visibility
 * @route   PATCH /api/admin/content/sections
 * @access  Private (Admin Only)
 */
const updateSectionsConfig = async (req, res, next) => {
    try {
        const { sections } = req.body;
        if (!Array.isArray(sections)) {
            return res.status(400).json({
                success: false,
                message: 'Sections array is required.'
            });
        }

        const sanitizedSections = sections.map((s, idx) => ({
            id: String(s.id || `section-${idx}`).trim().slice(0, 50),
            title: String(s.title || 'Section').trim().slice(0, 80),
            type: String(s.type || 'category').trim().slice(0, 30),
            visible: Boolean(s.visible !== false),
            order: Number(s.order) || (idx + 1)
        }));

        if (ContentConfig.db && ContentConfig.db.readyState === 1) {
            await ContentConfig.findOneAndUpdate(
                {},
                { $set: { sections: sanitizedSections, updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        } else {
            memoryContentConfig.sections = sanitizedSections;
            memoryContentConfig.updatedAt = new Date();
        }

        await logAdminAction(req, 'UPDATE_SECTIONS', 'homepage:sections', { count: sanitizedSections.length });

        return res.status(200).json({
            success: true,
            message: 'Homepage section configuration saved.',
            sections: sanitizedSections
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a curated collection
 * @route   POST /api/admin/content/collections
 * @access  Private (Admin Only)
 */
const createCuratedCollection = async (req, res, next) => {
    try {
        const { title, description, movieIds } = req.body;
        const cleanTitle = (title || '').trim().slice(0, 100);

        if (!cleanTitle) {
            return res.status(400).json({
                success: false,
                message: 'A valid collection title is required.'
            });
        }

        const validMovieIds = Array.isArray(movieIds)
            ? Array.from(new Set(movieIds.map((id) => Number(id)).filter((id) => id > 0)))
            : [];

        const collectionId = `col-${Date.now()}`;
        const newCollection = {
            id: collectionId,
            title: cleanTitle,
            description: (description || '').trim().slice(0, 300),
            movieIds: validMovieIds,
            visible: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (ContentConfig.db && ContentConfig.db.readyState === 1) {
            await ContentConfig.findOneAndUpdate(
                {},
                { $push: { collections: newCollection }, $set: { updatedAt: new Date() } },
                { upsert: true, new: true }
            );
        } else {
            memoryContentConfig.collections.push(newCollection);
            memoryContentConfig.updatedAt = new Date();
        }

        await logAdminAction(req, 'CREATE_COLLECTION', `collection:${collectionId}`, { title: cleanTitle, movies: validMovieIds.length });

        return res.status(201).json({
            success: true,
            message: `Collection "${cleanTitle}" created successfully.`,
            collection: newCollection
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a curated collection
 * @route   DELETE /api/admin/content/collections/:id
 * @access  Private (Admin Only)
 */
const deleteCuratedCollection = async (req, res, next) => {
    try {
        const colId = String(req.params.id || '').trim();
        if (!colId) {
            return res.status(400).json({
                success: false,
                message: 'Collection ID is required.'
            });
        }

        if (ContentConfig.db && ContentConfig.db.readyState === 1) {
            await ContentConfig.findOneAndUpdate(
                {},
                { $pull: { collections: { id: colId } }, $set: { updatedAt: new Date() } }
            );
        } else {
            memoryContentConfig.collections = memoryContentConfig.collections.filter((c) => c.id !== colId);
            memoryContentConfig.updatedAt = new Date();
        }

        await logAdminAction(req, 'DELETE_COLLECTION', `collection:${colId}`, {});

        return res.status(200).json({
            success: true,
            message: 'Collection deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get admin audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin Only)
 */
const getAuditLogs = async (req, res, next) => {
    try {
        let logs = [];
        if (AdminAuditLog.db && AdminAuditLog.db.readyState === 1) {
            logs = await AdminAuditLog.find()
                .sort({ timestamp: -1 })
                .limit(50)
                .lean();
        } else {
            logs = memoryAuditLogs.slice(0, 50);
        }

        return res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getPopular,
    getActivity,
    getUsers,
    getContentConfig,
    updateFeaturedMovie,
    updateSectionsConfig,
    createCuratedCollection,
    deleteCuratedCollection,
    getAuditLogs
};
