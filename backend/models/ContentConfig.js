// ==========================================================================
// Content Config Model — Task 35: Admin Content Management
// ==========================================================================

const mongoose = require('mongoose');

const SectionConfigSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'tmdb-category' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { _id: false });

const CuratedCollectionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    movieIds: [{ type: Number }],
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ContentConfigSchema = new mongoose.Schema({
    featuredMovie: {
        movieId: { type: Number, default: 102 },
        title: { type: String, default: 'Inception' },
        overview: { type: String, default: '' },
        posterPath: { type: String, default: '' },
        backdropPath: { type: String, default: '' },
        updatedBy: { type: String, default: 'system' },
        updatedAt: { type: Date, default: Date.now }
    },
    sections: {
        type: [SectionConfigSchema],
        default: [
            { id: 'continue-watching', title: 'Continue Watching', type: 'personalized', visible: true, order: 1 },
            { id: 'for-you', title: 'Top Picks For You', type: 'personalized', visible: true, order: 2 },
            { id: 'trending', title: 'Trending Now', type: 'tmdb-trending', visible: true, order: 3 },
            { id: 'popular', title: 'Popular on Netflix', type: 'tmdb-popular', visible: true, order: 4 },
            { id: 'action', title: 'Action Movies', type: 'genre', visible: true, order: 5 },
            { id: 'categories', title: 'Browse by Category', type: 'categories', visible: true, order: 6 },
            { id: 'my-list', title: 'My List', type: 'library', visible: true, order: 7 }
        ]
    },
    collections: [CuratedCollectionSchema],
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('ContentConfig', ContentConfigSchema);
