/**
 * ============================================================================
 * Authentication Middleware (requireAuth)
 * ============================================================================
 * Intercepts protected requests, parses the Bearer JWT token from headers,
 * verifies cryptographic signatures with Firebase Admin, and attaches user info.
 */

const { admin, isFirebaseAdminConfigured } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID Token from Authorization header
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authorization token required. Format: Bearer <token>'
            });
        }

        const idToken = authHeader.split('Bearer ')[1].trim();

        if (!idToken) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Bearer token is empty.'
            });
        }

        // Check if Firebase Admin is configured
        if (!isFirebaseAdminConfigured() || !admin.apps.length) {
            return res.status(503).json({
                success: false,
                message: 'Firebase Admin authentication is not configured on the server.'
            });
        }

        // Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach safe user identity to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || ''
        };

        next();
    } catch (error) {
        let message = 'Invalid or expired authentication token.';

        if (error.code === 'auth/id-token-expired') {
            message = 'Authentication token has expired. Please sign in again.';
        } else if (error.code === 'auth/argument-error') {
            message = 'Malformed authentication token provided.';
        }

        return res.status(401).json({
            success: false,
            message: message
        });
    }
};

module.exports = {
    requireAuth
};
