/**
 * ============================================================================
 * Firebase Admin SDK Configuration & Initialization
 * ============================================================================
 * Initializes the Firebase Admin SDK using service account credentials for
 * server-side JWT verification and secure user record management.
 */

const admin = require('firebase-admin');

/**
 * Checks whether valid Firebase Admin service account credentials are provided.
 * @returns {boolean}
 */
const isFirebaseAdminConfigured = () => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    return Boolean(
        projectId &&
        projectId !== 'your_firebase_project_id' &&
        clientEmail &&
        clientEmail !== 'your_firebase_client_email' &&
        privateKey &&
        privateKey !== 'your_firebase_private_key'
    );
};

// Initialize Firebase Admin SDK once if configured
if (isFirebaseAdminConfigured()) {
    try {
        if (!admin.apps.length) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            console.log('✅ Firebase Admin SDK initialized.');
        }
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error.message);
    }
} else {
    console.warn('⚠️  Firebase Admin: Service account credentials not configured in .env.');
}

module.exports = {
    admin,
    isFirebaseAdminConfigured
};
