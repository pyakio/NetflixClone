/**
 * ============================================================================
 * Netflix Clone — Viewing Profiles Controller ("Who's Watching?")
 * ============================================================================
 * Manages user persona selection, profile creation, avatar customization,
 * kids content filtering mode, and session persistence in sessionStorage.
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * DOM Helper: Retrieves an element by its ID.
     * @param {string} elementId
     * @returns {HTMLElement|null}
     */
    function id(elementId) {
        return document.getElementById(elementId);
    }

    // ==========================================
    // 1. DOM ELEMENTS
    // ==========================================
    const profilesGrid        = id('profiles-grid');
    const profilesLoading     = id('profiles-loading');
    const btnToggleManage     = id('btn-toggle-manage');
    const profilesHeading     = id('profiles-heading');
    const toastContainer      = id('toast-container');

    // Modal DOM Elements
    const profileEditModal    = id('profile-edit-modal');
    const profileModalOverlay = id('profile-modal-overlay');
    const modalProfileTitle   = id('modal-profile-title');
    const profileForm         = id('profile-form');
    const formProfileId       = id('form-profile-id');
    const profileNameInput    = id('profile-name-input');
    const profileKidsCheckbox = id('profile-kids-checkbox');
    const btnCancelProfile    = id('btn-cancel-profile');
    const btnDeleteProfile    = id('btn-delete-profile');

    // State
    let isManageMode          = false;
    let profilesList          = [];
    let currentUserSession    = null;

    // Avatar map to expressive character representations
    const AVATAR_MAP = {
        'avatar-1': '😊',
        'avatar-2': '😎',
        'avatar-3': '🍿',
        'avatar-4': '🐱',
        'avatar-5': '👑',
        'avatar-6': '🤖'
    };

    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
    }


    // ==========================================
    // 2. BACKEND API CALLS
    // ==========================================
    async function apiFetchProfiles() {
        if (typeof AuthService === 'undefined' || !currentUserSession) return [];

        const token = await AuthService.getIdToken();
        if (!token) return [];

        const res = await fetch(`${getBackendUrl()}/profiles`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.profiles || [];
    }

    async function apiCreateProfile(name, avatar, isKidsProfile) {
        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const res = await fetch(`${getBackendUrl()}/profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, avatar, isKidsProfile })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to create profile.');
        return data.profile;
    }

    async function apiUpdateProfile(profileId, name, avatar, isKidsProfile) {
        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const res = await fetch(`${getBackendUrl()}/profiles/${profileId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, avatar, isKidsProfile })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to update profile.');
        return data.profile;
    }

    async function apiDeleteProfile(profileId) {
        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const res = await fetch(`${getBackendUrl()}/profiles/${profileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to delete profile.');
        return data;
    }


    // ==========================================
    // 3. RENDER PROFILES GRID
    // ==========================================
    async function loadAndRenderProfiles() {
        if (!profilesGrid) return;

        profilesLoading.style.display = 'block';
        profilesGrid.style.display = 'none';

        try {
            profilesList = await apiFetchProfiles();
            profilesLoading.style.display = 'none';
            profilesGrid.textContent = '';
            profilesGrid.style.display = 'flex';

            profilesList.forEach((profile) => {
                const card = createProfileCard(profile);
                profilesGrid.appendChild(card);
            });

            // Add "+ Add Profile" button if under limit (< 5)
            if (profilesList.length < 5) {
                const addCard = createAddProfileCard();
                profilesGrid.appendChild(addCard);
            }

        } catch (err) {
            console.error('Profiles load error:', err.message);
            profilesLoading.innerHTML = '<div class="section-error">Unable to load profiles. Please try again.</div>';
        }
    }

    function createProfileCard(profile) {
        // Determine if this card is the currently active profile
        let activeProfileId = null;
        try {
            const stored = sessionStorage.getItem('netflix_active_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                activeProfileId = parsed ? (parsed.id || parsed._id) : null;
            }
        } catch (e) {}

        const thisProfileId = String(profile.id || profile._id || '');
        const isActiveProfile = activeProfileId && String(activeProfileId) === thisProfileId;

        const card = document.createElement('div');
        card.className = `profile-card-item${isManageMode ? ' is-manage-mode' : ''}${isActiveProfile ? ' is-active-profile' : ''}`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${isManageMode ? 'Edit' : 'Select'} profile ${profile.name}`);
        card.setAttribute('aria-pressed', isActiveProfile ? 'true' : 'false');

        const avatarBox = document.createElement('div');
        avatarBox.className = `profile-card-avatar ${profile.avatar || 'avatar-1'}`;
        avatarBox.textContent = AVATAR_MAP[profile.avatar] || '👤';

        if (isManageMode) {
            const editOverlay = document.createElement('div');
            editOverlay.className = 'manage-edit-overlay';
            editOverlay.innerHTML = '✎';
            avatarBox.appendChild(editOverlay);
        }

        const nameLabel = document.createElement('p');
        nameLabel.className = 'profile-card-name';
        nameLabel.textContent = profile.name;

        if (profile.isKidsProfile) {
            const kidsBadge = document.createElement('span');
            kidsBadge.className = 'profile-kids-badge';
            kidsBadge.textContent = 'KIDS';
            nameLabel.appendChild(kidsBadge);
        }

        card.appendChild(avatarBox);
        card.appendChild(nameLabel);

        card.addEventListener('click', () => {
            if (isManageMode) {
                openEditProfileModal(profile);
            } else {
                selectProfile(profile);
            }
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isManageMode) openEditProfileModal(profile);
                else selectProfile(profile);
            }
        });

        return card;
    }

    function createAddProfileCard() {
        const addCard = document.createElement('div');
        addCard.className = 'profile-card-item add-profile-card';
        addCard.setAttribute('tabindex', '0');
        addCard.setAttribute('role', 'button');
        addCard.setAttribute('aria-label', 'Add Profile');

        const plusBox = document.createElement('div');
        plusBox.className = 'profile-card-avatar add-avatar-box';
        plusBox.textContent = '+';

        const addLabel = document.createElement('p');
        addLabel.className = 'profile-card-name';
        addLabel.textContent = 'Add Profile';

        addCard.appendChild(plusBox);
        addCard.appendChild(addLabel);

        addCard.addEventListener('click', openAddProfileModal);
        addCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAddProfileModal();
            }
        });

        return addCard;
    }


    // ==========================================
    // 4. PROFILE SELECTION & STORAGE
    // ==========================================
    function selectProfile(profile) {
        const profileData = {
            id: profile.id || profile._id,
            name: profile.name,
            avatar: profile.avatar || 'avatar-1',
            isKidsProfile: Boolean(profile.isKidsProfile)
        };

        sessionStorage.setItem('netflix_active_profile', JSON.stringify(profileData));
        showToast(`Switched to ${profile.name}`);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 300);
    }


    // ==========================================
    // 5. MODAL CONTROLS (Add / Edit / Delete)
    // ==========================================
    function openAddProfileModal() {
        if (!profileEditModal) return;

        modalProfileTitle.textContent = 'Add Profile';
        formProfileId.value = '';
        profileNameInput.value = '';
        profileKidsCheckbox.checked = false;
        btnDeleteProfile.style.display = 'none';

        // Set default avatar
        const defaultRadio = profileEditModal.querySelector('input[value="avatar-1"]');
        if (defaultRadio) defaultRadio.checked = true;

        profileEditModal.classList.add('is-open');
        profileEditModal.setAttribute('aria-hidden', 'false');
        profileNameInput.focus();
    }

    function openEditProfileModal(profile) {
        if (!profileEditModal) return;

        modalProfileTitle.textContent = 'Edit Profile';
        formProfileId.value = profile.id || profile._id;
        profileNameInput.value = profile.name;
        profileKidsCheckbox.checked = Boolean(profile.isKidsProfile);

        // Show delete button only if more than 1 profile exists
        btnDeleteProfile.style.display = profilesList.length > 1 ? 'inline-block' : 'none';

        // Select avatar radio
        const targetRadio = profileEditModal.querySelector(`input[value="${profile.avatar || 'avatar-1'}"]`);
        if (targetRadio) targetRadio.checked = true;

        profileEditModal.classList.add('is-open');
        profileEditModal.setAttribute('aria-hidden', 'false');
        profileNameInput.focus();
    }

    function closeProfileModal() {
        if (!profileEditModal) return;
        profileEditModal.classList.remove('is-open');
        profileEditModal.setAttribute('aria-hidden', 'true');
    }

    if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfileModal);
    if (profileModalOverlay) profileModalOverlay.addEventListener('click', closeProfileModal);

    // Form submission (Create or Update)
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const pId = formProfileId.value.trim();
            const name = profileNameInput.value.trim();
            const selectedAvatarRadio = profileEditModal.querySelector('input[name="profile-avatar"]:checked');
            const avatar = selectedAvatarRadio ? selectedAvatarRadio.value : 'avatar-1';
            const isKids = profileKidsCheckbox.checked;

            if (name.length < 2 || name.length > 30) {
                showToast('Profile name must be between 2 and 30 characters.');
                return;
            }

            try {
                if (pId) {
                    // Update
                    await apiUpdateProfile(pId, name, avatar, isKids);
                    showToast('Profile updated successfully.');
                } else {
                    // Create
                    await apiCreateProfile(name, avatar, isKids);
                    showToast(`Profile "${name}" created.`);
                }

                closeProfileModal();
                await loadAndRenderProfiles();

            } catch (err) {
                showToast(err.message || 'Error saving profile.');
            }
        });
    }

    // Delete Profile action
    if (btnDeleteProfile) {
        btnDeleteProfile.addEventListener('click', async () => {
            const pId = formProfileId.value.trim();
            if (!pId) return;

            const confirmDelete = confirm('Are you sure you want to delete this profile? Its viewing history will be removed.');
            if (!confirmDelete) return;

            try {
                await apiDeleteProfile(pId);
                showToast('Profile deleted.');

                // If deleted profile was the active profile in sessionStorage, clear it
                const active = JSON.parse(sessionStorage.getItem('netflix_active_profile') || '{}');
                if (active && active.id === pId) {
                    sessionStorage.removeItem('netflix_active_profile');
                }

                closeProfileModal();
                await loadAndRenderProfiles();

            } catch (err) {
                showToast(err.message || 'Unable to delete profile.');
            }
        });
    }


    // ==========================================
    // 6. TOGGLE MANAGE PROFILES MODE
    // ==========================================
    if (btnToggleManage) {
        btnToggleManage.addEventListener('click', () => {
            isManageMode = !isManageMode;
            btnToggleManage.textContent = isManageMode ? 'Done' : 'Manage Profiles';
            btnToggleManage.classList.toggle('active', isManageMode);
            profilesHeading.textContent = isManageMode ? 'Manage Profiles:' : "Who's watching?";
            loadAndRenderProfiles();
        });
    }


    // ==========================================
    // 7. TOAST NOTIFICATION UTILITY
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
        }, 3000);
    }


    // ==========================================
    // 8. AUTH INITIALIZATION
    // ==========================================
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange((user) => {
            currentUserSession = user;
            if (!user) {
                window.location.href = 'login.html';
            } else {
                loadAndRenderProfiles();
            }
        });
    }

});
