/**
 * ============================================================================
 * StreamFlix — Administrator Dashboard & Business Intelligence Controller
 * ============================================================================
 * Handles platform KPI metrics calculation, content management (headline hero
 * selector, row order, curated collections), and immutable audit log views.
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
    const accessDeniedView     = id('access-denied-view');
    const guardMessageText     = id('guard-message-text');
    const adminDashboardView   = id('admin-dashboard-view');
    const navAuthContainer     = id('nav-auth-container');
    const menuToggle           = id('menu-toggle');
    const navbar               = document.querySelector('.navbar');
    const toastContainer       = id('toast-container');

    // Metrics Elements
    const metricAccounts       = id('metric-accounts');
    const metricProfiles       = id('metric-profiles');
    const metricUniqueMovies   = id('metric-unique-movies');
    const metricCompletionRate = id('metric-completion-rate');
    const metricWatchTime      = id('metric-watch-time');
    const metricHistory        = id('metric-history');
    const metricWatchlist      = id('metric-watchlist');
    const metricNotifications  = id('metric-notifications');

    // Panels
    const popularMoviesContainer = id('popular-movies-container');
    const activityFeedContainer  = id('activity-feed-container');

    // Date Range Buttons
    const dateFilterButtons    = document.querySelectorAll('.btn-date-filter');

    // User Table Elements
    const inputUserSearch      = id('input-user-search');
    const adminUsersTbody      = id('admin-users-tbody');
    const btnPagePrev          = id('btn-page-prev');
    const btnPageNext          = id('btn-page-next');
    const paginationInfo       = id('pagination-info');

    // State
    let currentUserSession     = null;
    let selectedRange          = 'all';
    let currentPage            = 1;
    let totalPages             = 1;
    let searchDebounceTimer    = null;

    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
    }


    // ==========================================
    // 2. BACKEND ADMIN API HELPERS
    // ==========================================
    async function adminFetch(endpoint) {
        if (typeof AuthService === 'undefined' || !currentUserSession) {
            throw new Error('Authentication required');
        }

        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required');

        const res = await fetch(`${getBackendUrl()}/admin${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 403) {
            const err = new Error('Access denied. Administrator privileges required.');
            err.status = 403;
            throw err;
        }

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();
    }


    // ==========================================
    // 3. LOAD DASHBOARD DATA
    // ==========================================
    async function loadDashboard() {
        try {
            await Promise.all([
                loadStats(),
                loadPopularMovies(),
                loadRecentActivity(),
                loadUsersList()
            ]);

            accessDeniedView.style.display = 'none';
            adminDashboardView.style.display = 'block';
            setupAdminNavbar(currentUserSession);

        } catch (err) {
            console.warn('Admin access warning:', err.message);
            adminDashboardView.style.display = 'none';
            accessDeniedView.style.display = 'block';
            if (err.status === 403) {
                guardMessageText.textContent = 'Access denied. You do not have administrator permissions for this platform.';
            } else {
                guardMessageText.textContent = 'Please sign in with an authorized administrator account.';
            }
        }
    }

    async function loadStats() {
        const query = selectedRange !== 'all' ? `?range=${selectedRange}` : '';
        const data = await adminFetch(`/stats${query}`);

        if (data && data.stats) {
            if (metricAccounts) metricAccounts.textContent = String(data.stats.accounts || 0);
            if (metricProfiles) metricProfiles.textContent = String(data.stats.profiles || 0);
            if (metricUniqueMovies) metricUniqueMovies.textContent = String(data.stats.uniqueMoviesWatched || 0);
            if (metricCompletionRate) metricCompletionRate.textContent = data.stats.completionRate || '0%';
            if (metricWatchTime) metricWatchTime.textContent = data.stats.trackedWatchTimeHours || '0.0h';
            if (metricWatchlist) metricWatchlist.textContent = String(data.stats.watchlistItems || 0);
        }
    }

    async function loadPopularMovies() {
        if (!popularMoviesContainer) return;
        popularMoviesContainer.innerHTML = '<div class="panel-loading">Loading top movies...</div>';

        const query = selectedRange !== 'all' ? `?limit=5&range=${selectedRange}` : '?limit=5';
        const data = await adminFetch(`/popular-movies${query}`);

        if (!data || !data.movies || data.movies.length === 0) {
            popularMoviesContainer.innerHTML = '<div class="panel-empty">No viewing activity recorded yet.</div>';
            return;
        }

        popularMoviesContainer.textContent = '';
        const list = document.createElement('div');
        list.className = 'popular-movies-list';

        data.movies.forEach((movie) => {
            const item = document.createElement('div');
            item.className = 'popular-movie-item';

            const rankSpan = document.createElement('span');
            rankSpan.className = `movie-rank-badge rank-${movie.rank}`;
            rankSpan.textContent = `#${movie.rank}`;

            const thumbImg = document.createElement('img');
            thumbImg.className = 'popular-movie-thumb';
            thumbImg.src = movie.posterPath
                ? (movie.posterPath.startsWith('http') || movie.posterPath.startsWith('images/')
                    ? movie.posterPath
                    : `https://image.tmdb.org/t/p/w92${movie.posterPath}`)
                : 'images/movie1.jpg';
            thumbImg.alt = movie.title;
            thumbImg.loading = 'lazy';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'popular-movie-info';

            const titleP = document.createElement('p');
            titleP.className = 'popular-movie-title';
            titleP.textContent = movie.title;

            const viewsP = document.createElement('span');
            viewsP.className = 'popular-movie-views';
            viewsP.textContent = `${movie.watchCount} ${movie.watchCount === 1 ? 'profile watch' : 'profile watches'}`;

            infoDiv.appendChild(titleP);
            infoDiv.appendChild(viewsP);

            item.appendChild(rankSpan);
            item.appendChild(thumbImg);
            item.appendChild(infoDiv);

            list.appendChild(item);
        });

        popularMoviesContainer.appendChild(list);
    }

    async function loadRecentActivity() {
        if (!activityFeedContainer) return;
        activityFeedContainer.innerHTML = '<div class="panel-loading">Loading recent events...</div>';

        const data = await adminFetch('/activity?limit=8');

        if (!data || !data.activity || data.activity.length === 0) {
            activityFeedContainer.innerHTML = '<div class="panel-empty">No recent platform activity logged.</div>';
            return;
        }

        activityFeedContainer.textContent = '';
        const feedList = document.createElement('div');
        feedList.className = 'activity-feed-list';

        data.activity.forEach((act) => {
            const row = document.createElement('div');
            row.className = 'activity-feed-row';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'activity-feed-icon';
            iconSpan.textContent = getActivityIcon(act.type);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'activity-feed-content';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'activity-feed-header';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'activity-feed-title';
            titleSpan.textContent = act.title;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'activity-feed-time';
            timeSpan.textContent = formatRelativeTime(act.createdAt);

            headerDiv.appendChild(titleSpan);
            headerDiv.appendChild(timeSpan);

            const msgP = document.createElement('p');
            msgP.className = 'activity-feed-msg';
            msgP.textContent = act.message;

            contentDiv.appendChild(headerDiv);
            contentDiv.appendChild(msgP);

            row.appendChild(iconSpan);
            row.appendChild(contentDiv);

            feedList.appendChild(row);
        });

        activityFeedContainer.appendChild(feedList);
    }

    async function loadUsersList() {
        if (!adminUsersTbody) return;
        adminUsersTbody.innerHTML = '<tr><td colspan="4" class="table-loading">Loading user records...</td></tr>';

        const search = inputUserSearch ? encodeURIComponent(inputUserSearch.value.trim()) : '';
        const query = `?page=${currentPage}&limit=10&search=${search}`;
        const data = await adminFetch(`/users${query}`);

        if (!data || !data.users || data.users.length === 0) {
            adminUsersTbody.innerHTML = '<tr><td colspan="4" class="table-empty">No user accounts found.</td></tr>';
            if (btnPagePrev) btnPagePrev.disabled = true;
            if (btnPageNext) btnPageNext.disabled = true;
            if (paginationInfo) paginationInfo.textContent = 'Page 1 of 1';
            return;
        }

        totalPages = data.pagination.pages || 1;
        if (paginationInfo) paginationInfo.textContent = `Page ${data.pagination.page} of ${totalPages}`;
        if (btnPagePrev) btnPagePrev.disabled = currentPage <= 1;
        if (btnPageNext) btnPageNext.disabled = currentPage >= totalPages;

        adminUsersTbody.textContent = '';
        data.users.forEach((u) => {
            const tr = document.createElement('tr');

            const tdEmail = document.createElement('td');
            tdEmail.className = 'table-email-cell';
            tdEmail.textContent = u.email;

            const tdProfiles = document.createElement('td');
            tdProfiles.textContent = `${u.profileCount} ${u.profileCount === 1 ? 'profile' : 'profiles'}`;

            const tdWatchlist = document.createElement('td');
            tdWatchlist.textContent = `${u.watchlistCount} items`;

            const tdCreated = document.createElement('td');
            tdCreated.className = 'table-date-cell';
            try {
                tdCreated.textContent = new Date(u.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            } catch (e) {
                tdCreated.textContent = '—';
            }

            tr.appendChild(tdEmail);
            tr.appendChild(tdProfiles);
            tr.appendChild(tdWatchlist);
            tr.appendChild(tdCreated);

            adminUsersTbody.appendChild(tr);
        });
    }


    // ==========================================
    // 4. DATE RANGE FILTER HANDLERS
    // ==========================================
    dateFilterButtons.forEach((btn) => {
        btn.addEventListener('click', async () => {
            dateFilterButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRange = btn.getAttribute('data-range') || 'all';

            await Promise.all([
                loadStats(),
                loadPopularMovies()
            ]);
        });
    });


    // ==========================================
    // 5. USER SEARCH & PAGINATION
    // ==========================================
    if (inputUserSearch) {
        inputUserSearch.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                currentPage = 1;
                loadUsersList();
            }, 300);
        });
    }

    if (btnPagePrev) {
        btnPagePrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadUsersList();
            }
        });
    }

    if (btnPageNext) {
        btnPageNext.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadUsersList();
            }
        });
    }


    // ==========================================
    // 6. UTILITIES (Icons & Time)
    // ==========================================
    function getActivityIcon(type) {
        switch (type) {
            case 'WATCHLIST_ADDED':
                return '📋';
            case 'WATCH_STARTED':
                return '▶️';
            case 'PROFILE_UPDATED':
                return '👤';
            default:
                return '⚡';
        }
    }

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

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    async function loadDashboard() {
        try {
            await Promise.all([
                loadStats(),
                loadPopularMovies(),
                loadRecentActivity(),
                loadUsersList(),
                loadContentManagement(),
                loadAuditLogs()
            ]);

            accessDeniedView.style.display = 'none';
            adminDashboardView.style.display = 'block';
            setupAdminNavbar(currentUserSession);

        } catch (err) {
            console.warn('Admin access warning:', err.message);
            adminDashboardView.style.display = 'none';
            accessDeniedView.style.display = 'block';
            if (err.status === 403) {
                guardMessageText.textContent = 'Access denied. You do not have administrator permissions for this platform.';
            } else {
                guardMessageText.textContent = 'Please sign in with an authorized administrator account.';
            }
        }
    }

    // ========================================================================
    // 3.1 CONTENT MANAGEMENT SYSTEM (CMS)
    // ========================================================================
    const formFeatured = id('form-featured-movie');
    const inputFeaturedId = id('input-featured-id');
    const inputFeaturedTitle = id('input-featured-title');
    const inputFeaturedOverview = id('input-featured-overview');

    const formCollection = id('form-curated-collection');
    const inputCollectionTitle = id('input-collection-title');
    const inputCollectionDesc = id('input-collection-desc');
    const inputCollectionMovies = id('input-collection-movies');
    const collectionsContainer = id('admin-collections-container');
    const auditTbody = id('admin-audit-tbody');

    if (formFeatured) {
        formFeatured.addEventListener('submit', async (e) => {
            e.preventDefault();
            const movieId = parseInt(inputFeaturedId.value, 10);
            const title = inputFeaturedTitle.value.trim();
            const overview = inputFeaturedOverview.value.trim();

            if (!movieId || !title) {
                showToast('Valid movie ID and title required.');
                return;
            }

            try {
                const token = await AuthService.getIdToken();
                const res = await fetch(`${getBackendUrl()}/admin/content/featured`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ movieId, title, overview })
                });

                if (!res.ok) throw new Error('Failed to update featured movie.');
                showToast('Featured movie updated successfully.');
                loadAuditLogs();
            } catch (err) {
                showToast('Error updating featured movie.');
            }
        });
    }

    if (formCollection) {
        formCollection.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = inputCollectionTitle.value.trim();
            const description = inputCollectionDesc.value.trim();
            const rawMovies = inputCollectionMovies.value.trim();
            const movieIds = rawMovies
                ? rawMovies.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0)
                : [];

            if (!title) {
                showToast('Collection title required.');
                return;
            }

            try {
                const token = await AuthService.getIdToken();
                const res = await fetch(`${getBackendUrl()}/admin/content/collections`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title, description, movieIds })
                });

                if (!res.ok) throw new Error('Failed to create collection.');
                showToast('Collection created successfully.');
                inputCollectionTitle.value = '';
                inputCollectionDesc.value = '';
                inputCollectionMovies.value = '';
                loadContentManagement();
                loadAuditLogs();
            } catch (err) {
                showToast('Error creating collection.');
            }
        });
    }

    async function loadContentManagement() {
        try {
            const data = await adminFetch('/content');
            if (data && data.config) {
                if (data.config.featuredMovie) {
                    if (inputFeaturedId) inputFeaturedId.value = data.config.featuredMovie.movieId || 102;
                    if (inputFeaturedTitle) inputFeaturedTitle.value = data.config.featuredMovie.title || 'Inception';
                    if (inputFeaturedOverview) inputFeaturedOverview.value = data.config.featuredMovie.overview || '';
                }

                if (collectionsContainer) {
                    collectionsContainer.textContent = '';
                    const collections = data.config.collections || [];
                    if (collections.length === 0) {
                        collectionsContainer.innerHTML = '<div class="panel-empty">No curated collections created yet.</div>';
                    } else {
                        collections.forEach((col) => {
                            const card = document.createElement('div');
                            card.className = 'collection-item-card';
                            card.innerHTML = `
                                <div class="collection-info">
                                    <h4 class="collection-title">${escapeHtml(col.title)}</h4>
                                    <p class="collection-desc">${escapeHtml(col.description || 'No description')}</p>
                                    <span class="collection-count">${(col.movieIds || []).length} movies included</span>
                                </div>
                                <button type="button" class="btn-delete-collection" data-id="${col.id}" aria-label="Delete ${escapeHtml(col.title)}">🗑️ Delete</button>
                            `;
                            const delBtn = card.querySelector('.btn-delete-collection');
                            delBtn.addEventListener('click', async () => {
                                if (confirm(`Delete collection "${col.title}"?`)) {
                                    await deleteCollection(col.id);
                                }
                            });
                            collectionsContainer.appendChild(card);
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Content config loading error:', e);
        }
    }

    async function deleteCollection(colId) {
        try {
            const token = await AuthService.getIdToken();
            const res = await fetch(`${getBackendUrl()}/admin/content/collections/${colId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('Collection deleted.');
            loadContentManagement();
            loadAuditLogs();
        } catch (e) {
            showToast('Unable to delete collection.');
        }
    }

    async function loadAuditLogs() {
        if (!auditTbody) return;
        try {
            const data = await adminFetch('/audit-logs');
            auditTbody.textContent = '';
            const logs = (data && Array.isArray(data.logs)) ? data.logs : [];
            if (logs.length === 0) {
                auditTbody.innerHTML = '<tr><td colspan="4" class="table-empty">No audit records found.</td></tr>';
                return;
            }

            logs.forEach((log) => {
                const tr = document.createElement('tr');
                const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now';
                tr.innerHTML = `
                    <td>${escapeHtml(timeStr)}</td>
                    <td><code>${escapeHtml(log.adminEmail || 'admin')}</code></td>
                    <td><span class="activity-badge badge-admin">${escapeHtml(log.action)}</span></td>
                    <td>${escapeHtml(log.resource || '—')}</td>
                `;
                auditTbody.appendChild(tr);
            });
        } catch (e) {
            console.warn('Audit logs error:', e);
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function setupAdminNavbar(user) {
        if (!navAuthContainer) return;
        navAuthContainer.textContent = '';

        if (user) {
            const badge = document.createElement('span');
            badge.className = 'user-profile-badge';
            badge.textContent = `🛡️ ${user.email.split('@')[0]}`;

            const logoutBtn = document.createElement('button');
            logoutBtn.type = 'button';
            logoutBtn.className = 'btn-nav-logout';
            logoutBtn.textContent = 'Sign Out';
            logoutBtn.addEventListener('click', async () => {
                if (typeof AuthService !== 'undefined') {
                    await AuthService.logout();
                }
            });

            navAuthContainer.appendChild(badge);
            navAuthContainer.appendChild(logoutBtn);
        }
    }


    // ==========================================
    // 7. AUTH SUBSCRIPTION
    // ==========================================
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange((user) => {
            currentUserSession = user;
            if (user) {
                loadDashboard();
            } else {
                adminDashboardView.style.display = 'none';
                accessDeniedView.style.display = 'block';
                guardMessageText.textContent = 'Please sign in with an administrator account to view platform analytics.';
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
