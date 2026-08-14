// ==========================================================================
// Admin Routes — Task 23: Protected Admin & Analytics Endpoints
// ==========================================================================

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const {
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
} = require('../controllers/admin.controller');

// All admin routes strictly require both valid authentication and server-verified admin authorization
router.use(requireAuth);
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/popular-movies', getPopular);
router.get('/activity', getActivity);
router.get('/users', getUsers);

// Content Management Routes (Task 35)
router.get('/content', getContentConfig);
router.patch('/content/featured', updateFeaturedMovie);
router.patch('/content/sections', updateSectionsConfig);
router.post('/content/collections', createCuratedCollection);
router.delete('/content/collections/:id', deleteCuratedCollection);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
