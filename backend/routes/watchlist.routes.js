/**
 * ============================================================================
 * Watchlist ("My List") REST API Routes
 * ============================================================================
 * Defines endpoints for adding, fetching, and removing titles from personal watchlists.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { validateWatchlistInput } = require('../middleware/validationMiddleware');
const {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistMovie
} = require('../controllers/watchlist.controller');

// All watchlist routes require verified Firebase ID Token
router.use(requireAuth);

router.route('/')
    .get(getWatchlist)
    .post(validateWatchlistInput, addToWatchlist);

router.route('/:movieId')
    .get(getWatchlistMovie)
    .delete(removeFromWatchlist);

module.exports = router;
