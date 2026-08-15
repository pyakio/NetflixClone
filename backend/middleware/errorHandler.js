/**
 * ============================================================================
 * Centralized Error & 404 Exception Handling Middleware
 * ============================================================================
 * Catches unhandled exceptions, Mongoose CastErrors, validation errors, and
 * standardizes API JSON error responses across production and development modes.
 */

/**
 * 404 Not Found Middleware for unknown routes
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `API route not found: ${req.method} ${req.originalUrl}`
    });
};

/**
 * Global Error Handler Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    // Determine status code
    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || 'Internal server error';

    // 1. Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found with invalid identifier format: ${err.path}`;
    }

    // 2. Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const validationErrors = Object.values(err.errors || {}).map((e) => e.message);
        message = validationErrors.length > 0 ? validationErrors.join('. ') : 'Validation failed.';
    }

    // 3. Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
        statusCode = 409;
        const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
        message = `A record with this ${duplicateField} already exists.`;
    }

    // Avoid logging sensitive tokens in errors
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message: (process.env.NODE_ENV === 'production' && statusCode === 500)
            ? 'An unexpected error occurred. Please try again later.'
            : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    notFoundHandler,
    globalErrorHandler
};
