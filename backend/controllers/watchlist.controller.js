/**
 * ============================================================================
 * Watchlist ("My List") API Controller
 * ============================================================================
 * Manages profile-scoped watchlist queries, item additions, status updates,
 * and deletions with duplicate prevention.
 */

const User = require('../models/User');
const { createNotification } = require('../services/notification.service');

/**
 * Helper to ensure a User document exists for the authenticated Firebase UID
 */
const getOrCreateUserDoc = async (authUser) => {
    let user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) {
        user = await User.create({
            firebaseUid: authUser.uid,
            email: authUser.email || `${authUser.uid}@placeholder.firebase`,
            displayName: authUser.displayName || '',
            watchlist: []
        });
    }
    return user;
};

/**
 * @desc    Get all movies in the authenticated user's My List
 * @route   GET /api/watchlist
 * @access  Private (Firebase Token)
 */
const getWatchlist = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const user = await getOrCreateUserDoc(req.user);

        let list = user.watchlist;
        if (profileId) {
            list = list.filter((item) => String(item.profileId) === String(profileId));
        }

        return res.status(200).json({
            success: true,
            count: list.length,
            watchlist: list
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a movie to the authenticated user's My List
 * @route   POST /api/watchlist
 * @access  Private (Firebase Token)
 */
const addToWatchlist = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.body.profileId || null;
        const {
            movieId,
            title,
            posterPath,
            backdropPath,
            voteAverage,
            releaseDate,
            overview
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

        const user = await getOrCreateUserDoc(req.user);

        // Check for duplicate in user's watchlist for this profile
        const existingIndex = user.watchlist.findIndex(
            (item) => item.movieId === parsedMovieId && (!profileId || String(item.profileId) === String(profileId))
        );

        if (existingIndex !== -1) {
            return res.status(200).json({
                success: true,
                message: 'Movie is already in your My List.',
                movie: user.watchlist[existingIndex]
            });
        }

        // Create sanitized movie item
        const movieItem = {
            movieId: parsedMovieId,
            profileId: profileId ? String(profileId) : null,
            title: cleanTitle,
            posterPath: posterPath ? String(posterPath).trim() : null,
            backdropPath: backdropPath ? String(backdropPath).trim() : null,
            voteAverage: typeof voteAverage === 'number' ? voteAverage : null,
            releaseDate: releaseDate ? String(releaseDate).trim() : null,
            overview: overview ? String(overview).trim() : null,
            addedAt: new Date()
        };

        user.watchlist.push(movieItem);
        await user.save();

        // Dispatch WATCHLIST_ADDED notification asynchronously
        createNotification({
            firebaseUid: req.user.uid,
            type: 'WATCHLIST_ADDED',
            title: 'Added to My List',
            message: `"${cleanTitle}" was added to your My List.`,
            movieId: parsedMovieId,
            imagePath: movieItem.posterPath
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: `"${cleanTitle}" added to My List.`,
            movie: movieItem
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a movie from the authenticated user's My List
 * @route   DELETE /api/watchlist/:movieId
 * @access  Private (Firebase Token)
 */
const removeFromWatchlist = async (req, res, next) => {
    try {
        const profileId = req.headers['x-profile-id'] || req.query.profileId || null;
        const parsedMovieId = Number(req.params.movieId);

        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid numeric movieId parameter is required.'
            });
        }

        const pullFilter = { movieId: parsedMovieId };
        if (profileId) {
            pullFilter.profileId = String(profileId);
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            { $pull: { watchlist: pullFilter } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        let currentProfileWatchlist = user.watchlist;
        if (profileId) {
            currentProfileWatchlist = currentProfileWatchlist.filter((item) => String(item.profileId) === String(profileId));
        }

        return res.status(200).json({
            success: true,
            message: 'Movie removed from My List.',
            count: currentProfileWatchlist.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single movie from the authenticated user's My List
 * @route   GET /api/watchlist/:movieId
 * @access  Private (Firebase Token)
 */
const getWatchlistMovie = async (req, res, next) => {
    try {
        const parsedMovieId = Number(req.params.movieId);

        if (!parsedMovieId || isNaN(parsedMovieId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid numeric movieId parameter is required.'
            });
        }

        const user = await getOrCreateUserDoc(req.user);

        const movie = user.watchlist.find(
            (item) => item.movieId === parsedMovieId
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                isSaved: false,
                message: 'Movie not found in My List.'
            });
        }

        return res.status(200).json({
            success: true,
            isSaved: true,
            movie: movie
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistMovie
};
