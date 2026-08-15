// ==========================================================================
// Settings Controller — Task 22: Account Settings & Security
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    function id(elementId) {
        return document.getElementById(elementId);
    }

    // ==========================================
    // 1. DOM ELEMENTS
    // ==========================================
    const unauthView           = id('unauth-view');
    const authView             = id('auth-view');
    const navAuthContainer     = id('nav-auth-container');
    const menuToggle           = id('menu-toggle');
    const navbar               = document.querySelector('.navbar');
    const toastContainer       = id('toast-container');

    // Account Overview Elements
    const userEmailEl          = id('settings-user-email');
    const badgeEmailStatus     = id('badge-email-status');
    const btnResendVerification = id('btn-resend-verification');
    const memberSinceEl        = id('settings-member-since');
    const summaryAvatar        = id('summary-avatar');
    const summaryName          = id('summary-name');

    // Password Form Elements
    const formChangePassword   = id('form-change-password');
    const inputCurrentPassword = id('input-current-password');
    const inputNewPassword     = id('input-new-password');
    const inputConfirmPassword = id('input-confirm-password');
    const btnSavePassword      = id('btn-save-password');

    // Session Elements
    const btnSettingsLogout    = id('btn-settings-logout');

    // Danger Zone & Modal Elements
    const btnOpenDeleteModal   = id('btn-open-delete-modal');
    const deleteAccountModal   = id('delete-account-modal');
    const deleteModalOverlay   = id('delete-modal-overlay');
    const btnCancelDelete      = id('btn-cancel-delete');
    const formDeleteAccount    = id('form-delete-account');
    const inputDeletePassword  = id('input-delete-password');
    const inputDeleteConfirm   = id('input-delete-confirm');
    const btnConfirmDelete     = id('btn-confirm-delete');

    // State
    let currentUserSession     = null;
    let isVerificationCooling  = false;

    const AVATAR_MAP = {
        'avatar-1': '🔴',
        'avatar-2': '🔵',
        'avatar-3': '🟢',
        'avatar-4': '🟡',
        'avatar-5': '🟣',
        'avatar-6': '🤖'
    };

    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
    }


    // ==========================================
    // 2. TOAST NOTIFICATION UTILITY
    // ==========================================
    function showToast(message) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3200);
    }


    // ==========================================
    // 3. NAVBAR PROFILE SWITCHER
    // ==========================================
    function setupNavbar(user) {
        if (!navAuthContainer) return;
        navAuthContainer.textContent = '';

        if (user) {
            const switcherWrapper = document.createElement('div');
            switcherWrapper.className = 'nav-profile-switcher';
            switcherWrapper.id = 'nav-profile-switcher';

            let activeProfile = null;
            try {
                const stored = sessionStorage.getItem('netflix_active_profile');
                if (stored) activeProfile = JSON.parse(stored);
            } catch (e) {}

            if (!activeProfile) {
                activeProfile = { name: user.displayName || user.email.split('@')[0] || 'Profile', avatar: 'avatar-1' };
            }

            const profileBtn = document.createElement('button');
            profileBtn.type = 'button';
            profileBtn.className = 'btn-nav-profile-switch';
            profileBtn.id = 'nav-profile-switch-btn';
            profileBtn.setAttribute('aria-label', `Active profile: ${activeProfile.name}`);
            profileBtn.setAttribute('aria-expanded', 'false');
            profileBtn.setAttribute('aria-haspopup', 'true');
            profileBtn.innerHTML = `
                <span class="nav-profile-avatar">${AVATAR_MAP[activeProfile.avatar] || '👤'}</span>
                <span class="nav-profile-label">${activeProfile.name}</span>
                <span class="nav-profile-caret">▼</span>
            `;

            const profileDropdown = document.createElement('div');
            profileDropdown.className = 'profile-dropdown-menu';
            profileDropdown.id = 'profile-dropdown-menu';
            profileDropdown.setAttribute('aria-hidden', 'true');
            profileDropdown.innerHTML = `
                <div class="profile-dropdown-profiles" id="nav-dropdown-profiles-list">
                    <div class="dropdown-loading">Loading profiles...</div>
                </div>
                <div class="profile-dropdown-divider"></div>
                <div class="profile-dropdown-links">
                    <a href="profiles.html" class="profile-dropdown-link">✎ Manage Profiles</a>
                    <a href="settings.html" class="profile-dropdown-link">⚙ Account Settings</a>
                    <button type="button" class="btn-dropdown-logout" id="nav-dropdown-logout-btn">Sign Out</button>
                </div>
            `;

            switcherWrapper.appendChild(profileBtn);
            switcherWrapper.appendChild(profileDropdown);
            navAuthContainer.appendChild(switcherWrapper);

            profileBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isOpen = profileDropdown.classList.toggle('is-open');
                profileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                profileDropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

                if (isOpen && typeof AuthService !== 'undefined') {
                    const listEl = profileDropdown.querySelector('#nav-dropdown-profiles-list');
                    if (listEl) {
                        try {
                            const token = await AuthService.getIdToken();
                            const res = await fetch(`${getBackendUrl()}/profiles`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.profiles && data.profiles.length > 0) {
                                listEl.textContent = '';
                                data.profiles.forEach((p) => {
                                    const pItem = document.createElement('div');
                                    pItem.className = 'profile-dropdown-item';
                                    pItem.innerHTML = `
                                        <span class="dropdown-item-avatar">${AVATAR_MAP[p.avatar] || '👤'}</span>
                                        <span class="dropdown-item-name">${p.name}</span>
                                        ${p.isKidsProfile ? '<span class="profile-kids-badge">KIDS</span>' : ''}
                                    `;

                                    pItem.addEventListener('click', () => {
                                        sessionStorage.setItem('netflix_active_profile', JSON.stringify({
                                            id: p.id || p._id,
                                            name: p.name,
                                            avatar: p.avatar,
                                            isKidsProfile: Boolean(p.isKidsProfile)
                                        }));
                                        profileBtn.querySelector('.nav-profile-avatar').textContent = AVATAR_MAP[p.avatar] || '👤';
                                        profileBtn.querySelector('.nav-profile-label').textContent = p.name;
                                        profileDropdown.classList.remove('is-open');
                                        showToast(`Switched to ${p.name}`);
                                        renderActiveProfileInfo();
                                    });

                                    listEl.appendChild(pItem);
                                });
                            }
                        } catch (err) {
                            listEl.innerHTML = '<div class="dropdown-empty"><p>Profiles unavailable.</p></div>';
                        }
                    }
                }
            });

            const dropdownLogout = profileDropdown.querySelector('#nav-dropdown-logout-btn');
            if (dropdownLogout) {
                dropdownLogout.addEventListener('click', handleLogout);
            }

            document.addEventListener('click', (e) => {
                if (!switcherWrapper.contains(e.target)) {
                    profileDropdown.classList.remove('is-open');
                    profileBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }


    // ==========================================
    // 4. RENDER ACCOUNT INFORMATION
    // ==========================================
    function renderAccountOverview(user) {
        if (!user) return;

        // Email
        if (userEmailEl) userEmailEl.textContent = user.email || 'Email unavailable';

        // Verification Status
        if (badgeEmailStatus) {
            if (user.emailVerified) {
                badgeEmailStatus.textContent = '✓ Verified';
                badgeEmailStatus.className = 'badge-verification is-verified';
                if (btnResendVerification) btnResendVerification.style.display = 'none';
            } else {
                badgeEmailStatus.textContent = '⚠️ Not Verified';
                badgeEmailStatus.className = 'badge-verification is-unverified';
                if (btnResendVerification) btnResendVerification.style.display = 'inline-block';
            }
        }

        // Creation Date
        if (memberSinceEl) {
            try {
                if (user.metadata && user.metadata.creationTime) {
                    const date = new Date(user.metadata.creationTime);
                    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    memberSinceEl.textContent = `Member since ${monthYear}`;
                } else {
                    memberSinceEl.textContent = 'Member';
                }
            } catch (e) {
                memberSinceEl.textContent = 'Member';
            }
        }

        renderActiveProfileInfo();
    }

    function renderActiveProfileInfo() {
        let activeProfile = null;
        try {
            const stored = sessionStorage.getItem('netflix_active_profile');
            if (stored) activeProfile = JSON.parse(stored);
        } catch (e) {}

        if (summaryAvatar && summaryName) {
            if (activeProfile) {
                summaryAvatar.textContent = AVATAR_MAP[activeProfile.avatar] || '👤';
                summaryName.textContent = activeProfile.name;
            } else if (currentUserSession) {
                summaryAvatar.textContent = '👤';
                summaryName.textContent = currentUserSession.displayName || 'Main Profile';
            }
        }
    }


    // ==========================================
    // 5. RESEND EMAIL VERIFICATION
    // ==========================================
    if (btnResendVerification) {
        btnResendVerification.addEventListener('click', async () => {
            if (isVerificationCooling) return;

            btnResendVerification.disabled = true;
            btnResendVerification.textContent = 'Sending...';

            try {
                await AuthService.sendVerificationEmail();
                showToast('Verification email sent! Please check your inbox.');

                // Rate limiting guard: disable for 30 seconds
                isVerificationCooling = true;
                let countdown = 30;
                btnResendVerification.textContent = `Resend in ${countdown}s`;

                const interval = setInterval(() => {
                    countdown--;
                    if (countdown <= 0) {
                        clearInterval(interval);
                        isVerificationCooling = false;
                        btnResendVerification.disabled = false;
                        btnResendVerification.textContent = 'Resend Verification Email';
                    } else {
                        btnResendVerification.textContent = `Resend in ${countdown}s`;
                    }
                }, 1000);

            } catch (err) {
                isVerificationCooling = false;
                btnResendVerification.disabled = false;
                btnResendVerification.textContent = 'Resend Verification Email';
                showToast(AuthService.getFriendlyErrorMessage(err));
            }
        });
    }


    // ==========================================
    // 6. CHANGE PASSWORD FORM
    // ==========================================
    if (formChangePassword) {
        formChangePassword.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPass = inputCurrentPassword.value;
            const newPass     = inputNewPassword.value;
            const confirmPass = inputConfirmPassword.value;

            if (!currentPass) {
                showToast('Please enter your current password.');
                return;
            }

            if (newPass.length < 6) {
                showToast('New password must be at least 6 characters.');
                return;
            }

            if (newPass !== confirmPass) {
                showToast('New passwords do not match.');
                return;
            }

            if (currentPass === newPass) {
                showToast('New password must be different from your current password.');
                return;
            }

            btnSavePassword.disabled = true;
            btnSavePassword.textContent = 'Updating Password...';

            try {
                await AuthService.changePassword(currentPass, newPass, confirmPass);
                showToast('Password updated successfully.');

                // Reset inputs safely
                inputCurrentPassword.value = '';
                inputNewPassword.value = '';
                inputConfirmPassword.value = '';

            } catch (err) {
                showToast(AuthService.getFriendlyErrorMessage(err));
            } finally {
                btnSavePassword.disabled = false;
                btnSavePassword.textContent = 'Update Password';
            }
        });
    }


    // ==========================================
    // 7. SIGN OUT ACTION
    // ==========================================
    async function handleLogout() {
        try {
            sessionStorage.removeItem('netflix_active_profile');
            if (typeof AuthService !== 'undefined') {
                await AuthService.logout();
                showToast('You have been signed out.');
            }
        } catch (err) {
            console.error('Logout error:', err.message);
        }
    }

    if (btnSettingsLogout) {
        btnSettingsLogout.addEventListener('click', handleLogout);
    }


    // ==========================================
    // 8. DANGER ZONE: DELETE ACCOUNT
    // ==========================================
    if (btnOpenDeleteModal) {
        btnOpenDeleteModal.addEventListener('click', () => {
            if (!deleteAccountModal) return;
            inputDeletePassword.value = '';
            inputDeleteConfirm.value = '';
            btnConfirmDelete.disabled = true;

            deleteAccountModal.classList.add('is-open');
            deleteAccountModal.setAttribute('aria-hidden', 'false');
            inputDeletePassword.focus();
        });
    }

    function closeDeleteModal() {
        if (!deleteAccountModal) return;
        deleteAccountModal.classList.remove('is-open');
        deleteAccountModal.setAttribute('aria-hidden', 'true');
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (deleteModalOverlay) deleteModalOverlay.addEventListener('click', closeDeleteModal);

    if (inputDeleteConfirm) {
        inputDeleteConfirm.addEventListener('input', () => {
            const isMatch = inputDeleteConfirm.value.trim() === 'DELETE';
            btnConfirmDelete.disabled = !isMatch;
        });
    }

    if (formDeleteAccount) {
        formDeleteAccount.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = inputDeletePassword.value;
            const confirmWord = inputDeleteConfirm.value.trim();

            if (confirmWord !== 'DELETE') {
                showToast('Please type DELETE to confirm account deletion.');
                return;
            }

            if (!password) {
                showToast('Please enter your current password to authorize deletion.');
                return;
            }

            btnConfirmDelete.disabled = true;
            btnConfirmDelete.textContent = 'Deleting Account...';

            try {
                await AuthService.deleteAccount(password);
                showToast('Your Netflix account and viewing data have been permanently deleted.');

                closeDeleteModal();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 800);

            } catch (err) {
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.textContent = 'Permanently Delete Account';
                showToast(AuthService.getFriendlyErrorMessage(err));
            }
        });
    }


    // ==========================================
    // 9. AUTH STATE SUBSCRIPTION
    // ==========================================
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange((user) => {
            currentUserSession = user;

            if (user) {
                if (unauthView) unauthView.style.display = 'none';
                if (authView) authView.style.display = 'block';
                renderAccountOverview(user);
                setupNavbar(user);
            } else {
                if (unauthView) unauthView.style.display = 'block';
                if (authView) authView.style.display = 'none';
                if (navAuthContainer) navAuthContainer.textContent = '';
            }
        });
    }

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            const isNavOpen = navbar.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', isNavOpen ? 'true' : 'false');
            menuToggle.textContent = isNavOpen ? '✕' : '☰';
        });
    }

});
