/**
 * ============================================================================
 * StreamFlix — HTML5 Cinema Video Player & Progress Controller
 * ============================================================================
 * Controls custom media playback, scrubber seeking, buffering indicators,
 * 10-second throttled progress persistence, volume control, and fullscreen.
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
    const btnBack              = id('btn-watch-back');
    const navAuthContainer     = id('nav-auth-container');
    const toastContainer       = id('toast-container');

    // Error & Views
    const watchErrorView       = id('watch-error-view');
    const watchErrorTitle      = id('watch-error-title');
    const watchErrorDesc       = id('watch-error-desc');
    const watchPlayerView      = id('watch-player-view');

    // Player Elements
    const playerWrapper        = id('video-player-wrapper');
    const video                = id('netflix-video-player');
    const centerPlayBtn        = id('center-play-btn');
    const centerPlayIcon       = id('center-play-icon');
    const playerBuffering      = id('player-buffering');
    const playerErrorOverlay   = id('player-error-overlay');
    const btnPlayerRetry       = id('btn-player-retry');
    const customControls       = id('custom-player-controls');

    // Control Elements
    const btnPlayPause         = id('btn-play-pause');
    const iconPlayPause        = id('icon-play-pause');
    const btnSeekBackward      = id('btn-seek-backward');
    const btnSeekForward       = id('btn-seek-forward');
    const btnMute              = id('btn-mute');
    const iconMute             = id('icon-mute');
    const volumeSlider         = id('volume-slider');
    const currentTimeText      = id('current-time-text');
    const durationTimeText     = id('duration-time-text');
    const btnFullscreen        = id('btn-fullscreen');
    const iconFullscreen       = id('icon-fullscreen');
    const playerWatermark      = id('player-movie-watermark');

    // Timeline Elements
    const timelineContainer    = id('timeline-container');
    const timelineBuffered     = id('timeline-buffered');
    const timelinePlayed       = id('timeline-played');
    const timelineThumb        = id('timeline-thumb');

    // Metadata Elements
    const movieTitleEl         = id('watch-movie-title');
    const movieYearEl          = id('watch-movie-year');
    const movieRatingEl        = id('watch-movie-rating');
    const movieRuntimeEl       = id('watch-movie-runtime');
    const genresRowEl          = id('watch-genres-row');
    const synopsisTextEl       = id('watch-synopsis-text');
    const castWrapperEl        = id('watch-cast-wrapper');
    const castNamesEl          = id('watch-cast-names');
    const btnWatchlist         = id('btn-watch-watchlist');
    const watchlistIcon        = id('watchlist-action-icon');
    const watchlistText        = id('watchlist-action-text');
    const btnWatchTrailer      = id('btn-watch-trailer');
    const recommendationsGrid  = id('watch-recommendations-grid');

    // Trailer Modal Elements
    const trailerModal         = id('trailer-modal');
    const trailerOverlay       = id('trailer-overlay');
    const trailerCloseBtn      = id('trailer-modal-close');
    const trailerVideoWrapper  = id('trailer-video-wrapper');

    // State Variables
    let currentMovieId         = null;
    let movieData              = null;
    let currentUser            = null;
    let inWatchlist            = false;
    let controlsHideTimeout    = null;
    let isSeeking              = false;
    let progressSyncInterval   = null;
    let lastSavedProgressSec   = 0;
    let trailerKey             = null;

    const AVATAR_MAP = {
        'avatar-1': '🔴', 'avatar-2': '🔵', 'avatar-3': '🟢',
        'avatar-4': '🟡', 'avatar-5': '🟣', 'avatar-6': '🤖'
    };

    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
    }

    function getActiveProfile() {
        try {
            const raw = sessionStorage.getItem('netflix_active_profile');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }


    // ==========================================
    // 2. TOAST NOTIFICATIONS
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
    // 3. INITIALIZE MOVIE IDENTIFIER & DETAILS
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    currentMovieId = parseInt(rawId, 10);

    if (!rawId || isNaN(currentMovieId) || currentMovieId <= 0) {
        showErrorState('Invalid Movie', 'A valid movie ID was not provided in the URL.');
        return;
    }

    function showErrorState(title, message) {
        if (watchPlayerView) watchPlayerView.style.display = 'none';
        if (watchErrorView) {
            watchErrorView.style.display = 'block';
            if (watchErrorTitle) watchErrorTitle.textContent = title;
            if (watchErrorDesc) watchErrorDesc.textContent = message;
        }
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }


    // ==========================================
    // 4. FETCH MOVIE METADATA (TMDB)
    // ==========================================
    async function fetchMovieDetails() {
        try {
            const apiKey = (typeof TMDB_API_KEY !== 'undefined') ? TMDB_API_KEY : '';
            const baseUrl = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';

            let res = null;
            if (apiKey && apiKey !== 'YOUR_TMDB_API_KEY') {
                res = await fetch(`${baseUrl}/movie/${currentMovieId}?api_key=${apiKey}&append_to_response=credits,videos,similar`);
            }

            if (res && res.ok) {
                movieData = await res.json();
            } else {
                // Fallback mock movie metadata for local testing
                movieData = {
                    id: currentMovieId,
                    title: 'Streaming Feature Film',
                    release_date: '2026-01-01',
                    runtime: 118,
                    vote_average: 8.4,
                    overview: 'Enjoy authorized high-definition streaming playback with adaptive HTML5 controls, real-time watch history tracking, and resume support.',
                    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }],
                    credits: { cast: [{ name: 'Elena Vance' }, { name: 'Marcus Sterling' }] },
                    videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'dQw4w9WgXcQ' }] },
                    similar: { results: [] }
                };
            }

            renderMetadata(movieData);
            setupVideoSource(movieData);
            loadRecommendations(movieData);

        } catch (err) {
            console.warn('Could not fetch TMDB metadata, loading fallback player:', err.message);
            movieData = {
                id: currentMovieId,
                title: 'Featured Movie',
                release_date: '2026',
                runtime: 115,
                vote_average: 8.0,
                overview: 'Experience high-definition video streaming on the StreamFlix platform.',
                voteAverage: 8.5,
                voteCount: 1200,
                releaseDate: '2024-01-01',
                genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }]
            };
            renderMetadata(movieData);
            setupVideoSource(movieData);
        }
    }


    // ==========================================
    // 5. RENDER METADATA & ACTIONS
    // ==========================================
    function renderMetadata(movie) {
        document.title = `${movie.title} — Watch on StreamFlix`;

        if (movieTitleEl) movieTitleEl.textContent = movie.title;
        if (playerWatermark) playerWatermark.textContent = movie.title;

        // Year
        if (movieYearEl) {
            const year = movie.release_date ? movie.release_date.split('-')[0] : '2026';
            movieYearEl.textContent = year;
        }

        // Rating
        if (movieRatingEl) {
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '8.0';
            movieRatingEl.textContent = `★ ${rating}`;
        }

        // Runtime
        if (movieRuntimeEl) {
            if (movie.runtime) {
                const hours = Math.floor(movie.runtime / 60);
                const mins = movie.runtime % 60;
                movieRuntimeEl.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            } else {
                movieRuntimeEl.textContent = '1h 55m';
            }
        }

        // Genres
        if (genresRowEl) {
            genresRowEl.textContent = '';
            if (movie.genres && movie.genres.length > 0) {
                movie.genres.forEach((g) => {
                    const tag = document.createElement('span');
                    tag.className = 'watch-genre-tag';
                    tag.textContent = g.name;
                    genresRowEl.appendChild(tag);
                });
            }
        }

        // Synopsis
        if (synopsisTextEl) {
            synopsisTextEl.textContent = movie.overview || 'No synopsis available for this title.';
        }

        // Cast
        if (castWrapperEl && castNamesEl && movie.credits && movie.credits.cast) {
            const topCast = movie.credits.cast.slice(0, 4).map((c) => c.name).join(', ');
            if (topCast) {
                castNamesEl.textContent = topCast;
                castWrapperEl.style.display = 'block';
            }
        }

        // Trailer Button
        if (movie.videos && movie.videos.results) {
            const trailer = movie.videos.results.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
            if (trailer && trailer.key) {
                trailerKey = trailer.key;
            }
        }
    }


    // ==========================================
    // 6. VIDEO SOURCE & PLAYER SETUP
    // ==========================================
    function setupVideoSource(movie) {
        if (!video) return;

        // Resolve legal, authorized video stream
        const source = (typeof resolveVideoSource === 'function')
            ? resolveVideoSource(movie.id)
            : { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' };

        video.src = source.url;

        // Poster backdrop if available
        if (movie.backdrop_path) {
            video.poster = `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
        }

        video.load();
    }


    // ==========================================
    // 7. HTML5 PLAYER CONTROLS & TIMELINE
    // ==========================================
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const s = Math.floor(seconds);
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        const hours = Math.floor(mins / 60);

        if (hours > 0) {
            const remainingMins = mins % 60;
            return `${String(hours).padStart(2, '0')}:${String(remainingMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updatePlayPauseUI(isPlaying) {
        if (iconPlayPause) iconPlayPause.textContent = isPlaying ? '⏸' : '▶';
        if (btnPlayPause) btnPlayPause.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
        if (centerPlayIcon) centerPlayIcon.textContent = isPlaying ? '⏸' : '▶';
        if (centerPlayBtn) {
            centerPlayBtn.classList.toggle('is-hidden', isPlaying);
        }
    }

    function togglePlayPause() {
        if (!video) return;
        if (video.paused || video.ended) {
            video.play().catch((err) => {
                console.warn('Playback prevented by browser policy:', err.message);
            });
        } else {
            video.pause();
        }
    }

    if (btnPlayPause) btnPlayPause.addEventListener('click', togglePlayPause);
    if (centerPlayBtn) centerPlayBtn.addEventListener('click', togglePlayPause);

    if (btnSeekBackward) {
        btnSeekBackward.addEventListener('click', () => {
            if (video) video.currentTime = Math.max(0, video.currentTime - 10);
        });
    }

    if (btnSeekForward) {
        btnSeekForward.addEventListener('click', () => {
            if (video) video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        });
    }

    // Video Events
    video.addEventListener('play', () => {
        updatePlayPauseUI(true);
        startProgressSync();
    });

    video.addEventListener('pause', () => {
        updatePlayPauseUI(false);
        saveWatchProgress('in-progress');
    });

    video.addEventListener('ended', () => {
        updatePlayPauseUI(false);
        if (centerPlayIcon) centerPlayIcon.textContent = '↺';
        if (centerPlayBtn) centerPlayBtn.classList.remove('is-hidden');
        saveWatchProgress('completed');
    });

    video.addEventListener('waiting', () => {
        if (playerBuffering) playerBuffering.style.display = 'flex';
    });

    video.addEventListener('canplay', () => {
        if (playerBuffering) playerBuffering.style.display = 'none';
        if (playerErrorOverlay) playerErrorOverlay.style.display = 'none';
    });

    video.addEventListener('error', () => {
        if (playerBuffering) playerBuffering.style.display = 'none';
        if (playerErrorOverlay) playerErrorOverlay.style.display = 'flex';
    });

    if (btnPlayerRetry) {
        btnPlayerRetry.addEventListener('click', () => {
            if (playerErrorOverlay) playerErrorOverlay.style.display = 'none';
            if (video) {
                video.load();
                video.play().catch(() => {});
            }
        });
    }

    // Timeline Progress Update
    video.addEventListener('timeupdate', () => {
        if (isSeeking || !video.duration) return;

        const current = video.currentTime;
        const duration = video.duration;
        const percent = (current / duration) * 100;

        if (timelinePlayed) timelinePlayed.style.width = `${percent}%`;
        if (timelineThumb) timelineThumb.style.left = `${percent}%`;
        if (currentTimeText) currentTimeText.textContent = formatTime(current);
        if (timelineContainer) timelineContainer.setAttribute('aria-valuenow', Math.round(percent));

        // Update buffered range
        if (video.buffered.length > 0 && timelineBuffered) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const bufferedPercent = (bufferedEnd / duration) * 100;
            timelineBuffered.style.width = `${bufferedPercent}%`;
        }
    });

    video.addEventListener('loadedmetadata', () => {
        if (durationTimeText) durationTimeText.textContent = formatTime(video.duration);
        resumeSavedProgress();
    });

    // Seek via timeline container click / drag
    function seekFromEvent(e) {
        if (!video || !video.duration || !timelineContainer) return;
        const rect = timelineContainer.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const ratio = clickX / rect.width;
        const newTime = ratio * video.duration;

        video.currentTime = newTime;
        if (timelinePlayed) timelinePlayed.style.width = `${ratio * 100}%`;
        if (timelineThumb) timelineThumb.style.left = `${ratio * 100}%`;
    }

    if (timelineContainer) {
        timelineContainer.addEventListener('click', seekFromEvent);

        timelineContainer.addEventListener('keydown', (e) => {
            if (!video || !video.duration) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 5);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + 5);
            }
        });
    }

    // Volume & Mute Controls
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            if (!video) return;
            video.volume = parseFloat(volumeSlider.value);
            video.muted = video.volume === 0;
            updateVolumeUI();
        });
    }

    function updateVolumeUI() {
        if (!video || !iconMute) return;
        if (video.muted || video.volume === 0) {
            iconMute.textContent = '🔇';
            if (btnMute) btnMute.setAttribute('aria-label', 'Unmute audio');
        } else if (video.volume < 0.5) {
            iconMute.textContent = '🔉';
            if (btnMute) btnMute.setAttribute('aria-label', 'Mute audio');
        } else {
            iconMute.textContent = '🔊';
            if (btnMute) btnMute.setAttribute('aria-label', 'Mute audio');
        }
    }

    if (btnMute) {
        btnMute.addEventListener('click', () => {
            if (!video) return;
            video.muted = !video.muted;
            if (volumeSlider) {
                volumeSlider.value = video.muted ? 0 : (video.volume || 1);
            }
            updateVolumeUI();
        });
    }

    // Fullscreen Toggle
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    function toggleFullscreen() {
        if (!playerWrapper) return;
        if (!document.fullscreenElement) {
            playerWrapper.requestFullscreen().catch((err) => {
                console.warn('Fullscreen request failed:', err.message);
            });
            if (iconFullscreen) iconFullscreen.textContent = '⛶';
        } else {
            document.exitFullscreen().catch(() => {});
            if (iconFullscreen) iconFullscreen.textContent = '⛶';
        }
    }

    // Auto-hide controls during playback
    function resetControlsTimer() {
        if (customControls) customControls.classList.remove('is-hidden');
        if (centerPlayBtn && !video.paused) centerPlayBtn.classList.add('is-hidden');

        clearTimeout(controlsHideTimeout);
        if (!video.paused) {
            controlsHideTimeout = setTimeout(() => {
                if (customControls && !video.paused) {
                    customControls.classList.add('is-hidden');
                }
            }, 3000);
        }
    }

    if (playerWrapper) {
        playerWrapper.addEventListener('mousemove', resetControlsTimer);
        playerWrapper.addEventListener('click', resetControlsTimer);
    }


    // ==========================================
    // 8. KEYBOARD SHORTCUTS
    // ==========================================
    document.addEventListener('keydown', (e) => {
        // Prevent shortcuts if user is typing in form inputs
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') return;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (video) video.currentTime = Math.max(0, video.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (video) video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                if (btnMute) btnMute.click();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
                break;
        }
    });


    // ==========================================
    // 9. WATCH HISTORY & RESUME PLAYBACK
    // ==========================================
    async function resumeSavedProgress() {
        if (!currentUser || !video || isNaN(currentMovieId)) return;

        try {
            const token = await AuthService.getIdToken();
            const activeProfile = getActiveProfile();
            const headers = { 'Authorization': `Bearer ${token}` };
            if (activeProfile && activeProfile.id) headers['x-profile-id'] = activeProfile.id;

            const res = await fetch(`${getBackendUrl()}/watch-history`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.history && Array.isArray(data.history)) {
                    const savedEntry = data.history.find((h) => h.movieId === currentMovieId);
                    if (savedEntry && savedEntry.progress > 5 && savedEntry.progress < (video.duration - 15)) {
                        video.currentTime = savedEntry.progress;
                        lastSavedProgressSec = savedEntry.progress;
                        showToast(`Resumed from ${formatTime(savedEntry.progress)}`);
                    }
                }
            }
        } catch (err) {
            console.warn('Could not check saved watch history:', err.message);
        }
    }

    async function saveWatchProgress(statusOverride = null) {
        if (!currentUser || !video || isNaN(currentMovieId)) return;

        const currentSec = Math.floor(video.currentTime || 0);
        const durationSec = Math.floor(video.duration || 7200);

        if (currentSec <= 0) return;

        // Determine completion state (90%+ watched)
        const isComplete = (currentSec / durationSec) >= 0.9 || statusOverride === 'completed';
        const finalStatus = isComplete ? 'completed' : 'in-progress';

        try {
            const token = await AuthService.getIdToken();
            const activeProfile = getActiveProfile();
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            if (activeProfile && activeProfile.id) headers['x-profile-id'] = activeProfile.id;

            await fetch(`${getBackendUrl()}/watch-history`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    movieId: currentMovieId,
                    title: movieData ? movieData.title : 'Movie',
                    posterPath: movieData ? movieData.poster_path : null,
                    backdropPath: movieData ? movieData.backdrop_path : null,
                    progress: currentSec,
                    duration: durationSec,
                    status: finalStatus
                })
            });

            lastSavedProgressSec = currentSec;
        } catch (err) {
            console.warn('Watch progress sync note:', err.message);
        }
    }

    function startProgressSync() {
        clearInterval(progressSyncInterval);
        // Throttled sync every 12 seconds while playing
        progressSyncInterval = setInterval(() => {
            if (video && !video.paused && !video.ended) {
                saveWatchProgress('in-progress');
            }
        }, 12000);
    }

    window.addEventListener('beforeunload', () => {
        if (video && video.currentTime > 5) {
            saveWatchProgress('in-progress');
        }
    });


    // ==========================================
    // 10. MY LIST INTEGRATION
    // ==========================================
    async function checkWatchlistState() {
        if (!currentUser || !btnWatchlist) return;

        try {
            const token = await AuthService.getIdToken();
            const activeProfile = getActiveProfile();
            const headers = { 'Authorization': `Bearer ${token}` };
            if (activeProfile && activeProfile.id) headers['x-profile-id'] = activeProfile.id;

            const res = await fetch(`${getBackendUrl()}/watchlist/${currentMovieId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                inWatchlist = Boolean(data.inWatchlist);
                updateWatchlistUI(inWatchlist);
            }
        } catch (e) {
            inWatchlist = false;
            updateWatchlistUI(false);
        }
    }

    function updateWatchlistUI(saved) {
        if (!watchlistIcon || !watchlistText) return;
        if (saved) {
            watchlistIcon.textContent = '✓';
            watchlistText.textContent = 'In My List';
            if (btnWatchlist) btnWatchlist.classList.add('in-list');
        } else {
            watchlistIcon.textContent = '+';
            watchlistText.textContent = 'Add to My List';
            if (btnWatchlist) btnWatchlist.classList.remove('in-list');
        }
    }

    if (btnWatchlist) {
        btnWatchlist.addEventListener('click', async () => {
            if (!currentUser) {
                showToast('Please sign in to add movies to your list.');
                return;
            }

            try {
                const token = await AuthService.getIdToken();
                const activeProfile = getActiveProfile();
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                if (activeProfile && activeProfile.id) headers['x-profile-id'] = activeProfile.id;

                if (inWatchlist) {
                    await fetch(`${getBackendUrl()}/watchlist/${currentMovieId}`, {
                        method: 'DELETE',
                        headers
                    });
                    inWatchlist = false;
                    updateWatchlistUI(false);
                    showToast('Removed from My List');
                } else {
                    await fetch(`${getBackendUrl()}/watchlist`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            movieId: currentMovieId,
                            title: movieData ? movieData.title : 'Movie',
                            posterPath: movieData ? movieData.poster_path : null,
                            voteAverage: movieData ? movieData.vote_average : 0,
                            releaseDate: movieData ? movieData.release_date : ''
                        })
                    });
                    inWatchlist = true;
                    updateWatchlistUI(true);
                    showToast('Added to My List');
                }
            } catch (err) {
                showToast('Unable to update My List right now.');
            }
        });
    }


    // ==========================================
    // 11. TRAILER MODAL INTEGRATION
    // ==========================================
    if (btnWatchTrailer) {
        btnWatchTrailer.addEventListener('click', () => {
            if (trailerKey) {
                if (video && !video.paused) video.pause();
                openTrailerModal(trailerKey);
            } else {
                showToast('Official trailer unavailable for this title.');
            }
        });
    }

    function openTrailerModal(key) {
        if (!trailerModal || !trailerVideoWrapper) return;
        trailerVideoWrapper.innerHTML = `
            <iframe 
                src="https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1" 
                title="Trailer Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        trailerModal.classList.add('is-open');
        trailerModal.setAttribute('aria-hidden', 'false');
    }

    function closeTrailerModal() {
        if (!trailerModal || !trailerVideoWrapper) return;
        trailerModal.classList.remove('is-open');
        trailerModal.setAttribute('aria-hidden', 'true');
        trailerVideoWrapper.innerHTML = '';
    }

    if (trailerCloseBtn) trailerCloseBtn.addEventListener('click', closeTrailerModal);
    if (trailerOverlay) trailerOverlay.addEventListener('click', closeTrailerModal);


    // ==========================================
    // 12. MORE LIKE THIS RECOMMENDATIONS
    // ==========================================
    function loadRecommendations(movie) {
        if (!recommendationsGrid) return;
        recommendationsGrid.textContent = '';

        const similarMovies = (movie.similar && movie.similar.results && movie.similar.results.length > 0)
            ? movie.similar.results.slice(0, 6)
            : [];

        if (similarMovies.length === 0) {
            recommendationsGrid.innerHTML = '<div class="panel-empty">No additional recommendations found.</div>';
            return;
        }

        similarMovies.forEach((sim) => {
            const card = document.createElement('a');
            card.className = 'rec-movie-card';
            card.href = `watch.html?id=${sim.id}`;

            const posterImg = document.createElement('img');
            posterImg.className = 'rec-movie-poster';
            posterImg.src = sim.poster_path
                ? `https://image.tmdb.org/t/p/w342${sim.poster_path}`
                : 'images/movie1.jpg';
            posterImg.alt = sim.title;
            posterImg.loading = 'lazy';

            const titleP = document.createElement('p');
            titleP.className = 'rec-movie-title';
            titleP.textContent = sim.title;

            card.appendChild(posterImg);
            card.appendChild(titleP);
            recommendationsGrid.appendChild(card);
        });
    }


    // ==========================================
    // 13. NAVBAR PROFILE SWITCHER
    // ==========================================
    function setupNavbar(user) {
        if (!navAuthContainer) return;
        navAuthContainer.textContent = '';

        if (user) {
            const switcherWrapper = document.createElement('div');
            switcherWrapper.className = 'nav-profile-switcher';

            let activeProfile = getActiveProfile();
            if (!activeProfile) {
                activeProfile = { name: user.displayName || user.email.split('@')[0] || 'Profile', avatar: 'avatar-1' };
            }

            const profileBtn = document.createElement('button');
            profileBtn.type = 'button';
            profileBtn.className = 'btn-nav-profile-switch';
            profileBtn.innerHTML = `
                <span class="nav-profile-avatar">${AVATAR_MAP[activeProfile.avatar] || '👤'}</span>
                <span class="nav-profile-label">${activeProfile.name}</span>
            `;

            profileBtn.addEventListener('click', () => {
                window.location.href = 'profiles.html';
            });

            switcherWrapper.appendChild(profileBtn);
            navAuthContainer.appendChild(switcherWrapper);
        }
    }


    // ==========================================
    // 14. AUTH STATE SUBSCRIPTION & BOOT
    // ==========================================
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange((user) => {
            currentUser = user;
            setupNavbar(user);
            if (user) {
                checkWatchlistState();
                resumeSavedProgress();
            }
        });
    }

    fetchMovieDetails();

});
