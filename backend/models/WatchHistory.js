// ==========================================================================
// WatchHistory Model — Task 16: MongoDB Watch History Schema
// ==========================================================================

const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            index: true,
            trim: true
        },
        profileId: {
            type: String,
            default: null,
            index: true,
            trim: true
        },
        movieId: {
            type: Number,
            required: [true, 'Movie ID is required']
        },
        title: {
            type: String,
            required: [true, 'Movie title is required'],
            trim: true
        },
        posterPath: {
            type: String,
            default: null,
            trim: true
        },
        backdropPath: {
            type: String,
            default: null,
            trim: true
        },
        progress: {
            type: Number,
            default: 0,
            min: [0, 'Progress cannot be negative']
        },
        duration: {
            type: Number,
            default: 7200,
            min: [1, 'Duration must be greater than zero']
        },
        lastWatchedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Compound index ensuring one history entry per movie per profile per user
watchHistorySchema.index({ firebaseUid: 1, profileId: 1, movieId: 1 });

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

module.exports = WatchHistory;
