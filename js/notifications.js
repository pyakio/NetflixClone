// ==========================================================================
// Notifications & Activity Center Controller — Task 20
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    function id(elementId) {
        return document.getElementById(elementId);
    }

    // ==========================================
    // 1. DOM ELEMENTS
    // ==========================================
    const navAuthContainer     = id('nav-auth-container');
    const menuToggle           = id('menu-toggle');
    const navbar               = document.querySelector('.navbar');
    const toastContainer       = id('toast-container');

    // Activity Center DOM Elements (if on notifications.html)
    const activityLoading      = id('activity-loading');
    const activityList         = id('activity-list');
    const activityEmpty        = id('activity-empty');
    const activityError        = id('activity-error');
    const btnActivityRetry     = id('btn-activity-retry');
    const btnPageMarkAllRead   = id('btn-page-mark-all-read');
    const tabAll               = id('tab-all');
    const tabUnread            = id('tab-unread');
    const countAllSpan         = id('count-all');
    const countUnreadSpan      = id('count-unread');

    // Modal elements
    const movieModal           = id('movie-modal');
    const modalCloseBtn        = id('movie-modal-close');
    const modalOverlay         = id('modal-overlay');
    const modalTitle           = id('movie-modal-title');
    const modalRating          = id('modal-rating');
    const modalDate            = id('modal-date');
    const modalRuntime         = id('modal-runtime');
    const modalGenres          = id('modal-genres');
    const modalOverview        = id('modal-overview');
    const modalPosterImg       = id('modal-poster-img');
    const modalBackdropImg     = id('modal-backdrop-img');
    const modalTrailerBtn      = id('modal-trailer-btn');
    const modalWatchBtn        = id('modal-watch-btn');
    const modalWatchlistBtn    = id('modal-watchlist-btn');
    const modalState           = id('modal-state');
    const modalHero            = id('modal-hero');
    const modalBody            = id('modal-body');

    // Dedicated Trailer Modal
    const trailerModal         = id('trailer-modal');
    const trailerOverlay       = id('trailer-overlay');
    const trailerCloseBtn      = id('trailer-modal-close');
    const trailerVideoWrapper  = id('trailer-video-wrapper');

    // State
    let currentUserSession     = null;
    let activeTab              = 'all'; // 'all' or 'unread'
    let currentModalMovieData  = null;
    let currentTrailerKey      = null;
    let currentRequestId       = 0;

    // ==========================================
    // 2. BACKEND API HELPERS
    // ==========================================
    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
    }

    async function apiFetchNotifications(page = 1, limit = 20, unreadOnly = false) {
        if (typeof AuthService === 'undefined' || !currentUserSession) return null;

        const token = await AuthService.getIdToken();
        if (!token) return null;

        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            unreadOnly: String(unreadOnly)
        });

        const res = await fetch(`${getBackendUrl()}/notifications?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }

    async function apiFetchUnreadCount() {
        if (typeof AuthService === 'undefined' || !currentUserSession) return 0;

        try {
            const token = await AuthService.getIdToken();
            if (!token) return 0;

            const res = await fetch(`${getBackendUrl()}/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) return 0;
            const data = await res.json();
            return data.count || 0;
        } catch (e) {
            return 0;
        }
    }

    async function apiMarkAsRead(notificationId) {
        if (typeof AuthService === 'undefined' || !currentUserSession) return;
        const token = await AuthService.getIdToken();
        if (!token) return;

        await fetch(`${getBackendUrl()}/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    }

    async function apiMarkAllAsRead() {
        if (typeof AuthService === 'undefined' || !currentUserSession) return;
        const token = await AuthService.getIdToken();
        if (!token) return;

        const res = await fetch(`${getBackendUrl()}/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }

    async function apiDeleteNotification(notificationId) {
        if (typeof AuthService === 'undefined' || !currentUserSession) return;
        const token = await AuthService.getIdToken();
        if (!token) return;

        const res = await fetch(`${getBackendUrl()}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }


    // ==========================================
    // 3. RELATIVE TIMESTAMP FORMATTER
    // ==========================================
    function formatRelativeTime(dateInput) {
        if (!dateInput) return '';
        const now = new Date();
        const date = new Date(dateInput);
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'WATCHLIST_ADDED':
                return '📋';
            case 'WATCHLIST_REMOVED':
                return '🗑️';
            case 'WATCH_STARTED':
                return '▶️';
            case 'PROFILE_UPDATED':
                return '👤';
            case 'RECOMMENDATION_AVAILABLE':
                return '✨';
            case 'TRAILER_AVAILABLE':
                return '🎬';
            default:
                return '🔔';
        }
    }


    // ==========================================
    // 4. NAVBAR BELL & DROPDOWN COMPONENT
    // ==========================================
    function setupNavbar(user) {
        if (!navAuthContainer) return;
        navAuthContainer.textContent = '';

        if (user) {
            // Notification Wrapper
            const notifWrapper = document.createElement('div');
            notifWrapper.className = 'nav-notification-wrapper';
            notifWrapper.id = 'nav-notification-wrapper';

            // Bell Button
            const bellBtn = document.createElement('button');
            bellBtn.type = 'button';
            bellBtn.className = 'btn-nav-bell';
            bellBtn.id = 'nav-bell-btn';
            bellBtn.setAttribute('aria-label', 'Notifications');
            bellBtn.setAttribute('aria-expanded', 'false');
            bellBtn.setAttribute('aria-haspopup', 'true');
            bellBtn.innerHTML = `🔔 <span class="nav-unread-badge" id="nav-unread-badge" style="display: none;">0</span>`;

            // Dropdown Menu
            const dropdown = document.createElement('div');
            dropdown.className = 'notification-dropdown';
            dropdown.id = 'notification-dropdown';
            dropdown.setAttribute('aria-hidden', 'true');
            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <h4>Notifications</h4>
                    <button type="button" class="btn-mark-all-read" id="btn-dropdown-mark-read">Mark all as read</button>
                </div>
                <div class="dropdown-list" id="dropdown-notification-list">
                    <div class="dropdown-loading">Loading...</div>
                </div>
                <div class="dropdown-footer">
                    <a href="notifications.html" class="btn-view-all-notifications">View All Activity</a>
                </div>
            `;

            notifWrapper.appendChild(bellBtn);
            notifWrapper.appendChild(dropdown);

            // Profile Switcher Component (Task 21)
            const switcherWrapper = document.createElement('div');
            switcherWrapper.className = 'nav-profile-switcher';
            switcherWrapper.id = 'nav-profile-switcher';

            const activeProfile = (() => {
                try {
                    const stored = sessionStorage.getItem('netflix_active_profile');
                    if (stored) return JSON.parse(stored);
                } catch (e) {}
                return { name: user.displayName || user.email.split('@')[0] || 'Profile', avatar: 'avatar-1' };
            })();

            const AVATAR_MAP = {
                'avatar-1': '🔴', 'avatar-2': '🔵', 'avatar-3': '🟢',
                'avatar-4': '🟡', 'avatar-5': '🟣', 'avatar-6': '🤖'
            };

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
                    <a href="profile.html" class="profile-dropdown-link">⚙ Account</a>
                    <button type="button" class="btn-dropdown-logout" id="nav-dropdown-logout-btn">Sign Out</button>
                </div>
            `;

            switcherWrapper.appendChild(profileBtn);
            switcherWrapper.appendChild(profileDropdown);

            navAuthContainer.appendChild(notifWrapper);
            navAuthContainer.appendChild(switcherWrapper);

            // Wire Profile Switcher Toggle
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

                                    pItem.addEventListener('click', async () => {
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
                                        if (activityList) loadActivityPage();
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

            // Sign out from profile dropdown
            const dropdownLogout = profileDropdown.querySelector('#nav-dropdown-logout-btn');
            if (dropdownLogout) {
                dropdownLogout.addEventListener('click', async () => {
                    sessionStorage.removeItem('netflix_active_profile');
                    if (typeof AuthService !== 'undefined') {
                        await AuthService.logout();
                        showToast('You have been signed out.');
                    }
                });
            }

            document.addEventListener('click', (e) => {
                if (!switcherWrapper.contains(e.target)) {
                    profileDropdown.classList.remove('is-open');
                    profileBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Wire Bell Interaction
            bellBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('is-open');
                bellBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

                if (isOpen) {
                    await loadDropdownContent();
                }
            });

            // Mark all read from dropdown
            const markReadBtn = dropdown.querySelector('#btn-dropdown-mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        await apiMarkAllAsRead();
                        showToast('All notifications marked as read.');
                        updateBadgeCount(0);
                        await loadDropdownContent();
                        if (activityList) loadActivityPage();
                    } catch (err) {
                        showToast('Unable to mark notifications as read.');
                    }
                });
            }

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!notifWrapper.contains(e.target)) {
                    dropdown.classList.remove('is-open');
                    bellBtn.setAttribute('aria-expanded', 'false');
                    dropdown.setAttribute('aria-hidden', 'true');
                }
            });

            // Initial unread count fetch
            refreshUnreadBadge();

        } else {
            const signinLink = document.createElement('a');
            signinLink.href = 'login.html';
            signinLink.className = 'btn-nav-signin';
            signinLink.id = 'nav-signin-btn';
            signinLink.textContent = 'Sign In';
            navAuthContainer.appendChild(signinLink);
        }
    }

    async function refreshUnreadBadge() {
        const count = await apiFetchUnreadCount();
        updateBadgeCount(count);
    }

    function updateBadgeCount(count) {
        const badge = id('nav-unread-badge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    async function loadDropdownContent() {
        const listEl = id('dropdown-notification-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="dropdown-loading">Loading notifications...</div>';

        try {
            const data = await apiFetchNotifications(1, 5, false);
            if (!data || !data.notifications || data.notifications.length === 0) {
                listEl.innerHTML = `
                    <div class="dropdown-empty">
                        <p>No notifications yet.</p>
                    </div>
                `;
                return;
            }

            listEl.textContent = '';
            data.notifications.forEach((item) => {
                const itemEl = document.createElement('div');
                itemEl.className = `dropdown-item ${item.read ? 'is-read' : 'is-unread'}`;

                const iconSpan = document.createElement('span');
                iconSpan.className = 'dropdown-item-icon';
                iconSpan.textContent = getNotificationIcon(item.type);

                const infoDiv = document.createElement('div');
                infoDiv.className = 'dropdown-item-info';

                const titleP = document.createElement('p');
                titleP.className = 'dropdown-item-title';
                titleP.textContent = item.title;

                const msgP = document.createElement('p');
                msgP.className = 'dropdown-item-msg';
                msgP.textContent = item.message;

                const timeP = document.createElement('span');
                timeP.className = 'dropdown-item-time';
                timeP.textContent = formatRelativeTime(item.createdAt);

                infoDiv.appendChild(titleP);
                infoDiv.appendChild(msgP);
                infoDiv.appendChild(timeP);

                itemEl.appendChild(iconSpan);
                itemEl.appendChild(infoDiv);

                itemEl.addEventListener('click', async () => {
                    if (!item.read) {
                        await apiMarkAsRead(item._id);
                        itemEl.classList.remove('is-unread');
                        itemEl.classList.add('is-read');
                        refreshUnreadBadge();
                    }
                    if (item.movieId) {
                        openMovieDetails(item.movieId);
                    }
                });

                listEl.appendChild(itemEl);
            });
        } catch (e) {
            listEl.innerHTML = '<div class="dropdown-empty"><p>Unable to load activity.</p></div>';
        }
    }


    // ==========================================
    // 5. ACTIVITY CENTER PAGE CONTROLLER
    // ==========================================
    async function loadActivityPage() {
        if (!activityList) return; // Not on notifications.html

        if (activityLoading) activityLoading.style.display = 'block';
        if (activityList) activityList.style.display = 'none';
        if (activityEmpty) activityEmpty.style.display = 'none';
        if (activityError) activityError.style.display = 'none';

        try {
            const isUnread = activeTab === 'unread';
            const data = await apiFetchNotifications(1, 50, isUnread);

            if (activityLoading) activityLoading.style.display = 'none';

            if (!data || !data.notifications || data.notifications.length === 0) {
                if (activityEmpty) activityEmpty.style.display = 'block';
                if (countAllSpan && !isUnread) countAllSpan.textContent = '0';
                if (countUnreadSpan) countUnreadSpan.textContent = '0';
                return;
            }

            if (countAllSpan && !isUnread) countAllSpan.textContent = String(data.pagination.total);
            if (countUnreadSpan) countUnreadSpan.textContent = String(data.unreadCount);

            activityList.textContent = '';
            activityList.style.display = 'flex';

            data.notifications.forEach((item) => {
                const card = createActivityCard(item);
                activityList.appendChild(card);
            });

        } catch (err) {
            console.error('Activity load error:', err.message);
            if (activityLoading) activityLoading.style.display = 'none';
            if (activityError) activityError.style.display = 'block';
        }
    }

    function createActivityCard(item) {
        const card = document.createElement('article');
        card.className = `activity-card ${item.read ? 'is-read' : 'is-unread'}`;
        card.setAttribute('data-id', item._id);

        // Icon container
        const iconDiv = document.createElement('div');
        iconDiv.className = 'activity-card-icon';
        iconDiv.textContent = getNotificationIcon(item.type);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'activity-card-content';

        const titleRow = document.createElement('div');
        titleRow.className = 'activity-card-header';

        const titleH3 = document.createElement('h3');
        titleH3.className = 'activity-card-title';
        titleH3.textContent = item.title;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'activity-card-time';
        timeSpan.textContent = formatRelativeTime(item.createdAt);

        titleRow.appendChild(titleH3);
        titleRow.appendChild(timeSpan);

        const msgP = document.createElement('p');
        msgP.className = 'activity-card-msg';
        msgP.textContent = item.message;

        contentDiv.appendChild(titleRow);
        contentDiv.appendChild(msgP);

        // Thumbnail if available
        if (item.imagePath) {
            const thumbImg = document.createElement('img');
            thumbImg.className = 'activity-card-thumb';
            thumbImg.src = item.imagePath.startsWith('http') || item.imagePath.startsWith('images/')
                ? item.imagePath
                : `https://image.tmdb.org/t/p/w185${item.imagePath}`;
            thumbImg.alt = 'Poster';
            thumbImg.loading = 'lazy';
            contentDiv.appendChild(thumbImg);
        }

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'activity-card-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-card-delete-notif';
        deleteBtn.setAttribute('aria-label', `Delete notification "${item.title}"`);
        deleteBtn.textContent = '✕';

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await apiDeleteNotification(item._id);
                card.remove();
                showToast('Notification deleted.');
                refreshUnreadBadge();
                if (activityList && activityList.children.length === 0) {
                    loadActivityPage();
                }
            } catch (err) {
                showToast('Unable to delete notification.');
            }
        });

        actionsDiv.appendChild(deleteBtn);

        card.appendChild(iconDiv);
        card.appendChild(contentDiv);
        card.appendChild(actionsDiv);

        // Card click: mark as read & open movie details if movieId exists
        card.addEventListener('click', async () => {
            if (!item.read) {
                await apiMarkAsRead(item._id);
                item.read = true;
                card.classList.remove('is-unread');
                card.classList.add('is-read');
                refreshUnreadBadge();
            }
            if (item.movieId) {
                openMovieDetails(item.movieId);
            }
        });

        return card;
    }


    // ==========================================
    // 6. ACTIVITY CENTER TAB & ACTION LISTENERS
    // ==========================================
    if (tabAll) {
        tabAll.addEventListener('click', () => {
            activeTab = 'all';
            tabAll.classList.add('active');
            tabAll.setAttribute('aria-selected', 'true');
            if (tabUnread) {
                tabUnread.classList.remove('active');
                tabUnread.setAttribute('aria-selected', 'false');
            }
            loadActivityPage();
        });
    }

    if (tabUnread) {
        tabUnread.addEventListener('click', () => {
            activeTab = 'unread';
            tabUnread.classList.add('active');
            tabUnread.setAttribute('aria-selected', 'true');
            if (tabAll) {
                tabAll.classList.remove('active');
                tabAll.setAttribute('aria-selected', 'false');
            }
            loadActivityPage();
        });
    }

    if (btnPageMarkAllRead) {
        btnPageMarkAllRead.addEventListener('click', async () => {
            try {
                await apiMarkAllAsRead();
                showToast('All notifications marked as read.');
                refreshUnreadBadge();
                await loadActivityPage();
            } catch (e) {
                showToast('Unable to mark notifications as read.');
            }
        });
    }

    if (btnActivityRetry) {
        btnActivityRetry.addEventListener('click', loadActivityPage);
    }


    // ==========================================
    // 7. MOVIE DETAILS MODAL (Shared)
    // ==========================================
    async function openMovieDetails(movieId) {
        if (!movieModal) return;

        const reqId = ++currentRequestId;
        movieModal.classList.add('is-open');
        movieModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (modalState) {
            modalState.style.display = 'block';
            modalState.innerHTML = '<div class="section-loading">Loading movie details...</div>';
        }
        if (modalHero) modalHero.style.display = 'none';
        if (modalBody) modalBody.style.display = 'none';

        try {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const apiKey = (typeof TMDB_API_KEY !== 'undefined') ? TMDB_API_KEY : '';
            const res = await fetch(`${base}/movie/${movieId}?api_key=${apiKey}`);
            if (!res.ok) throw new Error('Details not found');
            const data = await res.json();

            if (reqId !== currentRequestId) return;
            currentModalMovieData = data;

            if (modalTitle) modalTitle.textContent = data.title || 'Movie';
            if (modalRating) modalRating.textContent = `★ ${(data.vote_average || 0).toFixed(1)}`;
            if (modalDate) modalDate.textContent = (data.release_date || '').substring(0, 4);
            if (modalRuntime) modalRuntime.textContent = `${data.runtime || 0} min`;
            if (modalOverview) modalOverview.textContent = data.overview || '';

            if (modalPosterImg && data.poster_path) {
                modalPosterImg.src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
            }
            if (modalBackdropImg && data.backdrop_path) {
                modalBackdropImg.src = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
            }

            if (modalState) modalState.style.display = 'none';
            if (modalHero) modalHero.style.display = 'block';
            if (modalBody) modalBody.style.display = 'flex';

        } catch (e) {
            if (modalState) modalState.innerHTML = '<div class="section-error">Unable to load details.</div>';
        }
    }

    function closeMovieDetails() {
        if (!movieModal) return;
        movieModal.classList.remove('is-open');
        movieModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeMovieDetails);
    if (modalOverlay) modalOverlay.addEventListener('click', closeMovieDetails);

    document.addEventListener('keydown', (e) => {
        if (movieModal && movieModal.classList.contains('is-open') && e.key === 'Escape') {
            closeMovieDetails();
        }
    });


    // ==========================================
    // 8. TOAST NOTIFICATION UTILITY
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
    // 9. AUTH STATE SUBSCRIPTION
    // ==========================================
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange(async (user) => {
            currentUserSession = user;
            setupNavbar(user);

            if (activityList) {
                if (user) {
                    await loadActivityPage();
                } else {
                    if (activityLoading) activityLoading.style.display = 'none';
                    if (activityEmpty) {
                        activityEmpty.style.display = 'block';
                        activityEmpty.querySelector('.empty-text').textContent = 'Please sign in to view your account notifications.';
                    }
                }
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
