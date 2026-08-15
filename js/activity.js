/**
 * ============================================================================
 * StreamFlix — Viewing Insights & Activity Controller
 * ============================================================================
 * Aggregates and renders user watch statistics, completed titles, in-progress
 * titles, total watch time, and chronological viewing timelines.
 */

document.addEventListener('DOMContentLoaded', () => {
    const id = (elId) => document.getElementById(elId);

    const unauthView          = id('unauth-view');
    const authView            = id('auth-view');
    const activityContent     = id('activity-content');
    const activityStatus      = id('activity-status');
    const activityEmptyState  = id('activity-empty-state');
    const periodTabs          = id('activity-period-tabs');
    const logoutBtn           = id('nav-header-logout-btn');

    const statMoviesWatched   = id('stat-movies-watched');
    const statCompleted       = id('stat-completed');
    const statInProgress      = id('stat-in-progress');
    const statWatchTime       = id('stat-watch-time');
    const insightText         = id('insight-text');

    const recentSection       = id('activity-recent-section');
    const recentRow           = id('activity-recent-row');
    const timelineSection     = id('activity-timeline-section');
    const timelineList        = id('activity-timeline-list');

    let currentPeriod = '30d';
    let currentAbortController = null;
    let currentUserSession = null;

    // Period Tabs Switching
    if (periodTabs) {
        const tabs = periodTabs.querySelectorAll('.period-tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const selected = tab.getAttribute('data-period') || '30d';
                if (selected === currentPeriod) return;

                tabs.forEach((t) => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                currentPeriod = selected;
                loadActivityInsights();
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (typeof AuthService !== 'undefined') {
                await AuthService.logout();
                window.location.href = 'login.html';
            }
        });
    }

    async function loadActivityInsights() {
        if (!currentUserSession) return;

        if (currentAbortController) {
            currentAbortController.abort();
        }
        currentAbortController = new AbortController();

        // Show loading skeleton / status
        if (activityStatus) {
            activityStatus.style.display = 'block';
            activityStatus.innerHTML = '<div class="section-loading">Loading viewing insights...</div>';
        }
        if (activityEmptyState) activityEmptyState.style.display = 'none';

        try {
            const token = await currentUserSession.getIdToken();
            const activeProfile = JSON.parse(sessionStorage.getItem('netflix_active_profile') || 'null');
            const profileId = activeProfile ? (activeProfile.id || activeProfile._id) : null;

            const base = (typeof BACKEND_API_BASE_URL !== 'undefined') ? BACKEND_API_BASE_URL : 'http://localhost:5001/api';
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            if (profileId) {
                headers['x-profile-id'] = String(profileId);
            }

            const res = await fetch(`${base}/watch-history/insights?period=${currentPeriod}`, {
                headers,
                signal: currentAbortController.signal
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            if (activityStatus) activityStatus.style.display = 'none';

            renderInsightsData(data);

        } catch (err) {
            if (err.name === 'AbortError') return;
            if (activityStatus) {
                activityStatus.style.display = 'block';
                activityStatus.innerHTML = `
                    <div class="section-error">
                        Unable to load your viewing activity.
                        <button type="button" class="btn-clear-recent" id="btn-retry-insights" style="margin-left: 8px;">Retry</button>
                    </div>
                `;
                const retryBtn = id('btn-retry-insights');
                if (retryBtn) retryBtn.addEventListener('click', () => loadActivityInsights());
            }
        }
    }

    function renderInsightsData(data) {
        const summary  = (data && data.summary) ? data.summary : {};
        const recent   = (data && Array.isArray(data.recent)) ? data.recent : [];
        const timeline = (data && Array.isArray(data.timeline)) ? data.timeline : [];

        const totalWatched = summary.moviesWatched || 0;

        if (totalWatched === 0 && recent.length === 0) {
            if (activityContent) activityContent.style.display = 'none';
            if (activityEmptyState) activityEmptyState.style.display = 'block';
            return;
        }

        if (activityContent) activityContent.style.display = 'block';
        if (activityEmptyState) activityEmptyState.style.display = 'none';

        // Summary Cards
        if (statMoviesWatched) statMoviesWatched.textContent = String(summary.moviesWatched || 0);
        if (statCompleted)     statCompleted.textContent     = String(summary.completed || 0);
        if (statInProgress)    statInProgress.textContent    = String(summary.inProgress || 0);
        if (statWatchTime)     statWatchTime.textContent     = summary.trackedWatchTimeFormatted || '0m';

        // Personal Rule-based Insight
        if (insightText) {
            insightText.textContent = summary.insight || 'Keep watching to unlock deeper personal insights.';
        }

        // Recently Watched Row
        if (recentRow) {
            recentRow.textContent = '';
            if (recent.length > 0) {
                recent.forEach((m) => {
                    const card = createRecentCard(m);
                    recentRow.appendChild(card);
                });
                if (recentSection) recentSection.style.display = 'block';
            } else {
                if (recentSection) recentSection.style.display = 'none';
            }
        }

        // Timeline List
        if (timelineList) {
            timelineList.textContent = '';
            if (timeline.length > 0) {
                timeline.forEach((item) => {
                    const li = document.createElement('li');
                    li.className = 'activity-timeline-item';

                    const dateStr = item.lastWatchedAt ? formatActivityDate(item.lastWatchedAt) : 'Recently';
                    const isDone = item.status === 'completed' || (item.duration > 0 && item.progress / item.duration >= 0.9);
                    const statusLabel = isDone ? 'Completed' : (item.progress > 0 ? `Watched ${Math.round((item.progress / (item.duration || 7200)) * 100)}%` : 'Started');

                    li.innerHTML = `
                        <div class="timeline-dot" aria-hidden="true"></div>
                        <div class="timeline-content">
                            <span class="timeline-date">${escapeHtml(dateStr)}</span>
                            <a href="watch.html?id=${item.movieId}" class="timeline-title">${escapeHtml(item.title || 'Movie')}</a>
                            <span class="timeline-badge ${isDone ? 'badge-completed' : 'badge-progress'}">${escapeHtml(statusLabel)}</span>
                        </div>
                    `;
                    timelineList.appendChild(li);
                });
                if (timelineSection) timelineSection.style.display = 'block';
            } else {
                if (timelineSection) timelineSection.style.display = 'none';
            }
        }
    }

    function createRecentCard(m) {
        const article = document.createElement('article');
        article.className = 'movie-card';
        article.tabIndex = 0;
        article.setAttribute('role', 'button');
        article.setAttribute('aria-label', `Watch ${m.title}`);

        const img = document.createElement('img');
        img.className = 'movie-poster';
        img.alt = `${m.title || 'Movie'} poster`;
        img.loading = 'lazy';

        const posterPath = m.posterPath || m.backdropPath;
        if (posterPath) {
            img.src = posterPath.startsWith('http') || posterPath.startsWith('images/') 
                ? posterPath 
                : `https://image.tmdb.org/t/p/w500${posterPath}`;
        } else {
            img.src = 'images/movie1.jpg';
        }

        const isDone = m.status === 'completed' || (m.duration > 0 && m.progress / m.duration >= 0.9);
        const percent = (m.duration > 0 && m.progress > 0) ? Math.round((m.progress / m.duration) * 100) : 0;

        article.appendChild(img);

        if (isDone) {
            const badge = document.createElement('div');
            badge.className = 'library-completed-badge';
            badge.textContent = '✓ Completed';
            article.appendChild(badge);
        } else if (percent > 0) {
            const progWrap = document.createElement('div');
            progWrap.className = 'library-progress-bar-wrap';
            progWrap.innerHTML = `<div class="library-progress-bar" style="width: ${percent}%;"></div>`;
            article.appendChild(progWrap);
        }

        article.addEventListener('click', () => {
            window.location.href = `watch.html?id=${m.movieId}`;
        });

        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = `watch.html?id=${m.movieId}`;
            }
        });

        return article;
    }

    function formatActivityDate(dateString) {
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            const now = new Date();
            const diffMs = now - d;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;

            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Initialize Auth Listener
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange((user) => {
            currentUserSession = user;
            if (user) {
                if (unauthView) unauthView.style.display = 'none';
                if (authView)   authView.style.display   = 'block';
                loadActivityInsights();
            } else {
                if (authView)   authView.style.display   = 'none';
                if (unauthView) unauthView.style.display = 'block';
            }
        });
    }
});
