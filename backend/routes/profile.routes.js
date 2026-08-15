/**
 * ============================================================================
 * Viewing Profile REST API Routes
 * ============================================================================
 * Defines endpoints for persona CRUD operations, active profiles, and quota controls.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { validateProfileInput, validateObjectId } = require('../middleware/validationMiddleware');
const {
    getProfiles,
    createProfile,
    updateProfile,
    deleteProfile
} = require('../controllers/profile.controller');

// All profile endpoints require verified Firebase Token
router.use(requireAuth);

router.get('/', getProfiles);
router.post('/', validateProfileInput, createProfile);
router.patch('/:profileId', validateObjectId('profileId'), validateProfileInput, updateProfile);
router.delete('/:profileId', validateObjectId('profileId'), deleteProfile);

module.exports = router;
