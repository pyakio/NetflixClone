// ==========================================================================
// Netflix Clone Backend Server — Task 13: Express & MongoDB Foundation
// ==========================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/health.routes');
const userRoutes = require('./routes/user.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const watchHistoryRoutes = require('./routes/watchHistory.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const notificationRoutes = require('./routes/notification.routes');
const profileRoutes = require('./routes/profile.routes');
const accountRoutes = require('./routes/account.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. SECURITY HEADERS & CORS
// ==========================================
app.use(helmet({
    contentSecurityPolicy: false, // Allows embedding YouTube trailer iframes & TMDB CDNs
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const parseAllowedOrigins = () => {
    if (process.env.ALLOWED_ORIGINS) {
        return process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
    }
    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'null' // supports local file:// protocol testing
    ];
};

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = parseAllowedOrigins();
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-profile-id']
};

app.use(cors(corsOptions));

// ==========================================
// 2. RATE LIMITING & BODY PARSING
// ==========================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
connectDB();

// ==========================================
// 4. API ROUTES
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Netflix Clone Backend API is running.',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

const { getContentConfig } = require('./controllers/admin.controller');

app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/content/config', getContentConfig);

// ==========================================
// 5. ERROR HANDLING MIDDLEWARE
// ==========================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ==========================================
// 6. SERVER STARTUP & GRACEFUL SHUTDOWN
// ==========================================
let serverInstance = null;

if (process.env.NODE_ENV !== 'test') {
    serverInstance = app.listen(PORT, () => {
        console.log(`🚀 Netflix Clone Backend Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
        console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
    });
}

const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('HTTP server closed.');
            mongoose.connection.close(false).then(() => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            }).catch(() => process.exit(0));
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
