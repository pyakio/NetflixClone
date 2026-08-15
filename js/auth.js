// ==========================================================================
// Authentication Service — Task 12: Authentication & User Accounts
// ==========================================================================

const AuthService = (() => {

    /**
     * Map Firebase error codes to friendly, human-readable error messages.
     * @param {Object|string} error 
     * @returns {string}
     */
    function getFriendlyErrorMessage(error) {
        if (!error) return 'An unexpected error occurred. Please try again.';

        const code = (typeof error === 'string') ? error : (error.code || '');

        switch (code) {
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
            case 'auth/invalid-login-credentials':
                return 'Invalid email or password.';
            case 'auth/weak-password':
                return 'Password must contain at least 6 characters.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is not enabled in your Firebase project.';
            case 'auth/unconfigured':
                return 'Firebase Authentication is not configured. Please add your credentials in js/firebase-config.js.';
            default:
                return error.message || 'An error occurred during authentication. Please try again.';
        }
    }

    /**
     * Basic client-side email format validation.
     * @param {string} email 
     * @returns {boolean}
     */
    function isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.trim());
    }

    /**
     * Basic client-side password validation (min 6 characters).
     * @param {string} password 
     * @returns {boolean}
     */
    function isValidPassword(password) {
        return typeof password === 'string' && password.length >= 6;
    }

    /**
     * Get the active Firebase auth instance if available.
     */
    function getAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth && isFirebaseConfigured()) {
            return firebase.auth();
        }
        return null;
    }

    /**
     * Subscribe to authentication state changes.
     * @param {Function} callback - Called with (user)
     * @returns {Function|null} unsubscribe function or null
     */
    function onAuthStateChange(callback) {
        const auth = getAuth();
        if (auth) {
            return auth.onAuthStateChanged(callback);
        }
        // Fallback when Firebase is not configured: trigger callback with null
        callback(null);
        return null;
    }

    /**
     * Register a new user with Name, Email, and Password.
     * @param {string} name 
     * @param {string} email 
     * @param {string} password 
     * @param {string} confirmPassword 
     * @returns {Promise<Object>}
     */
    async function register(name, email, password, confirmPassword) {
        // Client-side validations
        const cleanName = (name || '').trim();
        const cleanEmail = (email || '').trim();

        if (!cleanName) {
            throw new Error('Please enter your name.');
        }

        if (!isValidEmail(cleanEmail)) {
            throw new Error('Please enter a valid email address.');
        }

        if (!isValidPassword(password)) {
            throw new Error('Password must be at least 6 characters long.');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        const auth = getAuth();
        if (!auth) {
            throw { code: 'auth/unconfigured' };
        }

        // Firebase registration
        const userCredential = await auth.createUserWithEmailAndPassword(cleanEmail, password);
        const user = userCredential.user;

        // Set user's display name
        if (cleanName && user.updateProfile) {
            try {
                await user.updateProfile({ displayName: cleanName });
            } catch (profileError) {
                console.warn('Could not update display name:', profileError.message);
            }
        }

        return {
            uid: user.uid,
            email: user.email,
            displayName: cleanName || user.displayName || 'User'
        };
    }

    /**
     * Sign in an existing user with Email and Password.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async function login(email, password) {
        const cleanEmail = (email || '').trim();

        if (!isValidEmail(cleanEmail)) {
            throw new Error('Please enter a valid email address.');
        }

        if (!password) {
            throw new Error('Please enter your password.');
        }

        const auth = getAuth();
        if (!auth) {
            throw { code: 'auth/unconfigured' };
        }

        const userCredential = await auth.signInWithEmailAndPassword(cleanEmail, password);
        const user = userCredential.user;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
        };
    }

    /**
     * Sign out the currently authenticated user.
     * @returns {Promise<void>}
     */
    async function logout() {
        const auth = getAuth();
        if (auth) {
            await auth.signOut();
        }
    }

    /**
     * Get the currently signed-in user object safely.
     * @returns {Object|null}
     */
    function getCurrentUser() {
        const auth = getAuth();
        if (auth && auth.currentUser) {
            const user = auth.currentUser;
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User')
            };
        }
        return null;
    }

    /**
     * Get the Firebase ID token for the currently signed-in user.
     * Useful for sending Authorization: Bearer <token> headers to the backend API.
     * @param {boolean} forceRefresh
     * @returns {Promise<string|null>}
     */
    async function getIdToken(forceRefresh = false) {
        const auth = getAuth();
        if (auth && auth.currentUser) {
            return await auth.currentUser.getIdToken(forceRefresh);
        }
        return null;
    }

    /**
     * Update the authenticated user's display name across Firebase Auth and MongoDB
     * @param {string} newDisplayName
     * @returns {Promise<Object>}
     */
    async function updateProfileDisplayName(newDisplayName) {
        const cleanName = (newDisplayName || '').trim();

        if (cleanName.length < 2 || cleanName.length > 50) {
            throw new Error('Name must be between 2 and 50 characters long.');
        }

        const auth = getAuth();
        if (!auth || !auth.currentUser) {
            throw new Error('You must be signed in to update your profile.');
        }

        // 1. Update Firebase Auth Profile
        try {
            await auth.currentUser.updateProfile({ displayName: cleanName });
        } catch (firebaseErr) {
            console.error('Firebase profile update error:', firebaseErr.message);
            throw new Error('Unable to update profile credentials. Please try again.');
        }

        // 2. Update MongoDB Profile via Backend API (if available)
        try {
            const token = await auth.currentUser.getIdToken();
            const baseUrl = (typeof BACKEND_API_BASE_URL !== 'undefined')
                ? BACKEND_API_BASE_URL
                : 'http://localhost:5001/api';

            const response = await fetch(`${baseUrl}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ displayName: cleanName })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.warn('MongoDB profile sync warning:', errData.message);
            }
        } catch (apiErr) {
            console.warn('Backend profile update note (running in local/offline mode):', apiErr.message);
        }

        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: cleanName
        };
    }

    /**
     * Send email verification to the authenticated user via Firebase Auth
     * @returns {Promise<void>}
     */
    async function sendVerificationEmail() {
        const auth = getAuth();
        if (!auth || !auth.currentUser) {
            throw new Error('You must be signed in to request email verification.');
        }
        await auth.currentUser.sendEmailVerification();
    }

    /**
     * Re-authenticate the currently signed-in user with their current password
     * @param {string} currentPassword
     * @returns {Promise<Object>}
     */
    async function reauthenticate(currentPassword) {
        const auth = getAuth();
        if (!auth || !auth.currentUser || !auth.currentUser.email) {
            throw new Error('You must be signed in to perform this action.');
        }

        if (!currentPassword) {
            throw new Error('Please enter your current password.');
        }

        const credential = firebase.auth.EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
        );

        return await auth.currentUser.reauthenticateWithCredential(credential);
    }

    /**
     * Change user password via Firebase Auth client SDK
     * @param {string} currentPassword
     * @param {string} newPassword
     * @param {string} confirmPassword
     * @returns {Promise<void>}
     */
    async function changePassword(currentPassword, newPassword, confirmPassword) {
        if (!currentPassword) {
            throw new Error('Please enter your current password.');
        }

        if (!isValidPassword(newPassword)) {
            throw new Error('New password must be at least 6 characters long.');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('New passwords do not match.');
        }

        if (currentPassword === newPassword) {
            throw new Error('New password must be different from your current password.');
        }

        // Re-authenticate user first
        await reauthenticate(currentPassword);

        const auth = getAuth();
        await auth.currentUser.updatePassword(newPassword);
    }

    /**
     * Delete the authenticated user account and clean up associated MongoDB records
     * @param {string} currentPassword
     * @returns {Promise<void>}
     */
    async function deleteAccount(currentPassword) {
        if (!currentPassword) {
            throw new Error('Please enter your current password to confirm account deletion.');
        }

        // Re-authenticate user first
        await reauthenticate(currentPassword);

        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();

        // 1. Delete MongoDB data
        try {
            const baseUrl = (typeof BACKEND_API_BASE_URL !== 'undefined')
                ? BACKEND_API_BASE_URL
                : 'http://localhost:5001/api';

            const res = await fetch(`${baseUrl}/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn(`MongoDB account cleanup returned status ${res.status}`);
            }
        } catch (apiErr) {
            console.warn('MongoDB account cleanup note:', apiErr.message);
        }

        // 2. Clear local active profile
        sessionStorage.removeItem('netflix_active_profile');

        // 3. Delete Firebase Auth User
        await auth.currentUser.delete();
    }

    return {
        register,
        login,
        logout,
        onAuthStateChange,
        getCurrentUser,
        getIdToken,
        updateProfileDisplayName,
        sendVerificationEmail,
        reauthenticate,
        changePassword,
        deleteAccount,
        isValidEmail,
        isValidPassword,
        getFriendlyErrorMessage
    };
})();
