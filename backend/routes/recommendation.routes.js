// ==========================================================================
// Recommendation Routes — Task 18: Personalized Recommendation Routes
// ==========================================================================

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/recommendation.controller');

// Protected: requires verified Firebase token
router.get('/', requireAuth, getRecommendations);
router.get('/home', requireAuth, getRecommendations);

module.exports = router;
