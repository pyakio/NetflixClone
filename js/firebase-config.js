// ==========================================================================
// Firebase Configuration — Task 12: Authentication & User Accounts
// ==========================================================================

/**
 * Firebase Web Configuration
 * Replace the placeholder values with your actual Firebase project settings
 * from the Firebase Console (Project Settings > General > Your apps > Web app).
 */
const FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

/**
 * Checks whether valid Firebase credentials have been supplied.
 * @returns {boolean}
 */
function isFirebaseConfigured() {
    return (
        typeof FIREBASE_CONFIG !== 'undefined' &&
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID'
    );
}

// Initialize Firebase if configured and Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
    if (isFirebaseConfigured()) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
        } catch (error) {
            console.error('Firebase initialization error:', error.message);
        }
    }
}
