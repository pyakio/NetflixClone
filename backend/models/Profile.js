/**
 * ============================================================================
 * Viewing Profile Model & Persona Schema
 * ============================================================================
 * Manages distinct viewing profiles per user account (up to 5 max), including
 * avatar selections, kids mode toggles, and compound uniqueness indices.
 */

const mongoose = require('mongoose');

const ALLOWED_AVATARS = [
    'avatar-1',
    'avatar-2',
    'avatar-3',
    'avatar-4',
    'avatar-5',
    'avatar-6'
];

const profileSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            trim: true,
            index: true
        },
        name: {
            type: String,
            required: [true, 'Profile name is required'],
            trim: true,
            minlength: [2, 'Profile name must be at least 2 characters long'],
            maxlength: [30, 'Profile name cannot exceed 30 characters']
        },
        avatar: {
            type: String,
            default: 'avatar-1',
            enum: ALLOWED_AVATARS
        },
        isKidsProfile: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

profileSchema.index({ firebaseUid: 1, createdAt: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = {
    Profile,
    ALLOWED_AVATARS
};
