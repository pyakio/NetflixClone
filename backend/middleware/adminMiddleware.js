/**
 * ============================================================================
 * Administrator Role-Based Access Control Middleware (requireAdmin)
 * ============================================================================
 * Enforces admin-only access on restricted analytics and content curation endpoints
 * by validating user email / UID against configurable environment allowlists.
 */

/**
 * Default admin allowlist. Can be overridden via ADMIN_EMAILS or ADMIN_UIDS in .env
 */
const DEFAULT_ADMIN_EMAILS = [
    'admin@netflix.com',
    'admin@netflixclone.com',
    'admin@example.com',
    'abhaysingh@gmail.com'
];

/**
 * Middleware to verify that the authenticated user possesses administrator privileges.
 * Must be mounted AFTER requireAuth middleware.
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const envAdminEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
        : [];
    const envAdminUids = process.env.ADMIN_UIDS
        ? process.env.ADMIN_UIDS.split(',').map((u) => u.trim())
        : [];

    const allowedEmails = new Set([...DEFAULT_ADMIN_EMAILS, ...envAdminEmails]);
    const allowedUids = new Set(envAdminUids);

    const userEmail = (req.user.email || '').toLowerCase().trim();
    const userUid = req.user.uid;

    // In test environment with test token or matching allowlist
    const isAdmin = allowedEmails.has(userEmail) ||
                    allowedUids.has(userUid) ||
                    Boolean(req.user.admin === true) ||
                    Boolean(req.user.isAdmin === true);

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Administrator privileges required.'
        });
    }

    req.isAdmin = true;
    next();
};

module.exports = {
    requireAdmin,
    DEFAULT_ADMIN_EMAILS
};
