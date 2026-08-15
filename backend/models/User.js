/**
 * ============================================================================
 * User Model & Profile-Scoped Watchlist Schema
 * ============================================================================
 * Defines the user document structure, authentication metadata, and compound
 * watchlist item subdocuments ({ movieId, title, posterPath, profileId }).
 */

const mongoose = require('mongoose');

/**
 * Schema for individual movies stored in a user's My List
 */
const watchlistItemSchema = new mongoose.Schema(
    {
        movieId: {
            type: Number,
            required: [true, 'Movie ID is required']
        },
        profileId: {
            type: String,
            default: null,
            trim: true
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
        voteAverage: {
            type: Number,
            default: null
        },
        releaseDate: {
            type: String,
            default: null,
            trim: true
        },
        overview: {
            type: String,
            default: null,
            trim: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false // suppress separate _id for subdocuments
    }
);

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            unique: true,
            index: true,
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email address is required'],
            lowercase: true,
            trim: true,
            index: true
        },
        displayName: {
            type: String,
            default: '',
            trim: true
        },
        watchlist: {
            type: [watchlistItemSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Explicitly ensure no password fields can be saved in this collection
userSchema.pre('save', function (next) {
    if (this.password || this.passwordHash) {
        return next(new Error('Password fields are not permitted on MongoDB User model.'));
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
