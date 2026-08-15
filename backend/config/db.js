/**
 * ============================================================================
 * Database Configuration & Mongoose Connection Manager
 * ============================================================================
 * Handles MongoDB Atlas connection initialization, error handling, and connection
 * pool state introspection for application health monitoring.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database via Mongoose
 */
const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI || mongoURI === 'your_mongodb_connection_string') {
        console.warn('⚠️  MongoDB: MONGO_URI is not configured in environment variables.');
        return null;
    }

    try {
        const conn = await mongoose.connect(mongoURI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        // Do not exit process immediately in development so health checks can still run
        return null;
    }
};

/**
 * Get current database connection status string for health checks
 * @returns {'connected' | 'connecting' | 'disconnecting' | 'disconnected' | 'unconfigured'}
 */
const getDBStatus = () => {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI || mongoURI === 'your_mongodb_connection_string') {
        return 'unconfigured';
    }

    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    return states[mongoose.connection.readyState] || 'disconnected';
};

module.exports = {
    connectDB,
    getDBStatus
};
