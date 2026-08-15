/**
 * ============================================================================
 * Netflix Clone — Client Configuration & API Endpoints
 * ============================================================================
 * Defines TMDB API configurations, backend base URL resolution with dynamic
 * environment detection (localhost / production origin), and creative commons
 * sample video streaming assets.
 */

// Replace 'YOUR_TMDB_API_KEY' with your official TMDB v3 API key.
// In development, the app automatically falls back to curated mock datasets when unconfigured.
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';

// Base API URL and Image CDN URL
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// TMDB Genre ID Constants
const TMDB_GENRES = {
    ACTION: 28,
    COMEDY: 35,
    DRAMA: 18,
    SCI_FI: 878
};

// Backend API Base URL Configuration (Dynamic Environment Detection)
const BACKEND_API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.NETFLIX_API_URL) {
        return window.NETFLIX_API_URL;
    }
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        const port = window.location.port;
        // Local development environments
        if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:') {
            return (window.NETFLIX_BACKEND_PORT)
                ? `http://localhost:${window.NETFLIX_BACKEND_PORT}/api`
                : 'http://localhost:5001/api';
        }
        // Production deployment: relative /api or same-origin API
        return `${window.location.origin}/api`;
    }
    return 'http://localhost:5001/api';
})();

if (typeof window !== 'undefined') {
    window.BACKEND_API_BASE_URL = BACKEND_API_BASE_URL;
}

// Open-source Creative Commons streaming video sources for demonstration playback
const AUTHORIZED_VIDEO_SOURCES = [
    {
        id: 'sample-1',
        title: 'Big Buck Bunny',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
        id: 'sample-2',
        title: 'Elephants Dream',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
        id: 'sample-3',
        title: 'Tears of Steel',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
    },
    {
        id: 'sample-4',
        title: 'Sintel',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    }
];

function resolveVideoSource(movieId) {
    const numId = parseInt(movieId, 10) || 1;
    const index = Math.abs(numId) % AUTHORIZED_VIDEO_SOURCES.length;
    return AUTHORIZED_VIDEO_SOURCES[index];
}

if (typeof window !== 'undefined') {
    window.AUTHORIZED_VIDEO_SOURCES = AUTHORIZED_VIDEO_SOURCES;
    window.resolveVideoSource = resolveVideoSource;
}

