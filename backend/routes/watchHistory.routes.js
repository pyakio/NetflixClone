// ==========================================================================
// Watch History Routes — Task 16: Protected Watch History Endpoints
// ==========================================================================

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { validateWatchHistoryInput } = require('../middleware/validationMiddleware');
const {
    getWatchHistory,
    addToWatchHistory,
    updateProgress,
    deleteFromWatchHistory,
    getViewingInsights
} = require('../controllers/watchHistory.controller');

// All watch history routes require verified Firebase ID Token
router.use(requireAuth);

router.get('/insights', getViewingInsights);

router.route('/')
    .get(getWatchHistory)
    .post(addToWatchHistory);

router.route('/:movieId')
    .patch(validateWatchHistoryInput, updateProgress)
    .delete(deleteFromWatchHistory);

module.exports = router;
