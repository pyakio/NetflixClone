// ==========================================================================
// Netflix Clone JavaScript — Task 19: Trailer & Movie Watch Experience
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // UTILITY: id() Helper
    // ==========================================
    function id(elementId) {
        return document.getElementById(elementId);
    }


    // ==========================================
    // 1. DOM ELEMENTS
    // ==========================================
    const navbar          = document.querySelector('.navbar');
    const menuToggle      = id('menu-toggle');
    const searchBtn       = id('search-btn');
    const searchContainer = id('search-container');
    const searchInput     = id('search-input');
    const searchCloseBtn  = id('search-close-btn');

    const heroPlayBtn     = document.querySelector('.hero .btn-play');
    const heroInfoBtn     = document.querySelector('.hero .btn-info');
    const toastContainer  = id('toast-container');

    const continueWatchingSection = id('continue-watching-section');
    const continueWatchingRow     = id('continue-watching-row');

    // Personalized Sections (Task 18)
    const becauseYouWatchedSection = id('because-you-watched-section');
    const becauseYouWatchedTitle   = id('because-you-watched-title');
    const becauseYouWatchedRow     = id('because-you-watched-row');

    const myListPicksSection       = id('my-list-picks-section');
    const myListPicksRow           = id('my-list-picks-row');

    const forYouSection            = id('for-you-section');
    const forYouRow                = id('for-you-row');

    const trendingRow     = id('trending-row');
    const popularRow      = id('popular-row');
    const actionRow       = id('action-row');

    // Modal DOM Elements (Task 19 Enhanced)
    const movieModal         = id('movie-modal');
    const modalCloseBtn      = id('movie-modal-close');
    const modalOverlay       = id('modal-overlay');
    const modalHero          = id('modal-hero');
    const modalBody          = id('modal-body');
    const modalState         = id('modal-state');
    const modalBackdropImg   = id('modal-backdrop-img');
    const modalPosterImg     = id('modal-poster-img');
    const modalTitle         = id('movie-modal-title');
    const modalRating        = id('modal-rating');
    const modalDate          = id('modal-date');
    const modalRuntime       = id('modal-runtime');
    const modalGenres        = id('modal-genres');
    const modalOverview      = id('modal-overview');
    const modalTrailerBtn    = id('modal-trailer-btn');
    const modalWatchBtn      = id('modal-watch-btn');
    const modalWatchlistBtn  = id('modal-watchlist-btn');
    const modalCastSection   = id('modal-cast-section');
    const modalCastGrid      = id('modal-cast-grid');
    const modalSimilarSection = id('modal-similar-section');
    const modalSimilarGrid   = id('modal-similar-grid');
    const modalContent       = document.querySelector('.movie-modal-content');

    // Dedicated Trailer Modal (Task 19)
    const trailerModal       = id('trailer-modal');
    const trailerOverlay     = id('trailer-overlay');
    const trailerCloseBtn    = id('trailer-modal-close');
    const trailerVideoWrapper = id('trailer-video-wrapper');

    // My List & Auth DOM Elements
    const watchlistContainer = id('watchlist-container');
    const navMyListLink      = id('nav-my-list');
    const navAuthContainer   = id('nav-auth-container');

    // State tracking
    let activeCardTrigger    = null;
    let currentRequestId     = 0;
    let currentModalMovieData = null;
    let currentTrailerKey    = null;
    let currentUserSession   = null;   // Active Firebase user session
    let activeWatchlist      = [];     // In-memory active watchlist
    let activeWatchHistory   = [];     // In-memory active watch history
    let isWatchlistMutating  = false;
    let isHistoryMutating    = false;
    let currentHeroMovie     = null;

    // ==========================================
    // 2. MOCK BACKUP DATASET (Graceful Fallback)
    // ==========================================
    const MOCK_DATASET = {
        trending: [
            { id: 101, title: 'The Dark Knight',  poster_path: 'images/movie1.jpg',  backdrop_path: null, vote_average: 9.0, vote_count: 32000, release_date: '2008-07-18', runtime: 152, genres: [{ name: 'Action' }, { name: 'Crime' }], overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.' },
            { id: 102, title: 'Inception',        poster_path: 'images/movie2.jpg',  backdrop_path: null, vote_average: 8.8, vote_count: 35000, release_date: '2010-07-16', runtime: 148, genres: [{ name: 'Sci-Fi' }, { name: 'Action' }], overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.' },
            { id: 103, title: 'Interstellar',     poster_path: 'images/movie3.jpg',  backdrop_path: null, vote_average: 8.7, vote_count: 33000, release_date: '2014-11-07', runtime: 169, genres: [{ name: 'Adventure' }, { name: 'Drama' }], overview: 'When Earth becomes uninhabitable, a farmer and ex-NASA pilot is tasked to pilot a spacecraft to find a new planet.' },
            { id: 104, title: 'Oppenheimer',      poster_path: 'images/movie4.jpg',  backdrop_path: null, vote_average: 8.9, vote_count: 22000, release_date: '2023-07-21', runtime: 180, genres: [{ name: 'Biography' }, { name: 'Drama' }], overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
            { id: 105, title: 'Avatar',           poster_path: 'images/movie5.jpg',  backdrop_path: null, vote_average: 7.6, vote_count: 28000, release_date: '2009-12-18', runtime: 162, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], overview: 'A paraplegic Marine dispatched to the moon Pandora becomes torn between following orders and protecting his new home.' },
            { id: 106, title: 'The Batman',       poster_path: 'images/movie6.jpg',  backdrop_path: null, vote_average: 7.7, vote_count: 19000, release_date: '2022-03-04', runtime: 176, genres: [{ name: 'Crime' }, { name: 'Mystery' }], overview: 'When a sadistic serial killer begins murdering key figures in Gotham, Batman investigates the city\'s hidden corruption.' },
            { id: 107, title: 'Dune: Part Two',   poster_path: 'images/movie1.jpg',  backdrop_path: null, vote_average: 8.6, vote_count: 18000, release_date: '2024-03-01', runtime: 166, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.' },
            { id: 108, title: 'The Matrix',       poster_path: 'images/movie2.jpg',  backdrop_path: null, vote_average: 8.7, vote_count: 25000, release_date: '1999-03-31', runtime: 136, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], overview: 'When a stranger leads hacker Neo to a forbidding underworld, he discovers the shocking truth about his reality.' }
        ],
        popular: [
            { id: 201, title: 'Stranger Things',  poster_path: 'images/movie7.jpg',  backdrop_path: null, vote_average: 8.7, vote_count: 29000, release_date: '2016-07-15', runtime: 50,  genres: [{ name: 'Sci-Fi' }, { name: 'Horror' }], overview: 'When a young boy disappears, his friends uncover a mysterious supernatural world and one terrifying girl.' },
            { id: 202, title: 'Wednesday',        poster_path: 'images/movie8.jpg',  backdrop_path: null, vote_average: 8.1, vote_count: 17000, release_date: '2022-11-23', runtime: 45,  genres: [{ name: 'Comedy' }, { name: 'Mystery' }], overview: 'Wednesday Addams investigates a murder spree while making new friends and foes at Nevermore Academy.' },
            { id: 203, title: 'Money Heist',      poster_path: 'images/movie9.jpg',  backdrop_path: null, vote_average: 8.2, vote_count: 21000, release_date: '2017-05-02', runtime: 70,  genres: [{ name: 'Action' }, { name: 'Crime' }], overview: 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history.' },
            { id: 204, title: 'Squid Game',       poster_path: 'images/movie10.jpg', backdrop_path: null, vote_average: 8.0, vote_count: 23000, release_date: '2021-09-17', runtime: 55,  genres: [{ name: 'Drama' }, { name: 'Thriller' }], overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games with deadly high stakes.' },
            { id: 205, title: 'Dark',             poster_path: 'images/movie11.jpg', backdrop_path: null, vote_average: 8.7, vote_count: 16000, release_date: '2017-12-01', runtime: 60,  genres: [{ name: 'Crime' }, { name: 'Mystery' }], overview: 'A family saga with a supernatural twist, where the disappearance of children exposes relationships.' },
            { id: 206, title: 'Breaking Bad',     poster_path: 'images/movie12.jpg', backdrop_path: null, vote_average: 9.5, vote_count: 38000, release_date: '2008-01-20', runtime: 49,  genres: [{ name: 'Crime' }, { name: 'Drama' }], overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine.' },
            { id: 207, title: 'Black Mirror',     poster_path: 'images/movie7.jpg',  backdrop_path: null, vote_average: 8.8, vote_count: 20000, release_date: '2011-12-04', runtime: 60,  genres: [{ name: 'Drama' }, { name: 'Sci-Fi' }], overview: 'An anthology series exploring a twisted multiverse where humanity\'s greatest innovations collide with dark instincts.' },
            { id: 208, title: 'The Crown',        poster_path: 'images/movie8.jpg',  backdrop_path: null, vote_average: 8.6, vote_count: 15000, release_date: '2016-11-04', runtime: 58,  genres: [{ name: 'Drama' }, { name: 'History' }], overview: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign.' }
        ],
        action: [
            { id: 301, title: 'John Wick',           poster_path: 'images/movie13.jpg', backdrop_path: null, vote_average: 7.4, vote_count: 18000, release_date: '2014-10-24', runtime: 101, genres: [{ name: 'Action' }, { name: 'Thriller' }], overview: 'An ex-hit-man comes out of retirement to track down the gangsters that took everything from him.' },
            { id: 302, title: 'Mission Impossible',  poster_path: 'images/movie14.jpg', backdrop_path: null, vote_average: 7.8, vote_count: 15000, release_date: '1996-05-22', runtime: 110, genres: [{ name: 'Action' }, { name: 'Adventure' }], overview: 'An American agent must discover and expose the real spy without the help of his organization.' },
            { id: 303, title: 'Mad Max: Fury Road',  poster_path: 'images/movie15.jpg', backdrop_path: null, vote_average: 8.1, vote_count: 22000, release_date: '2015-05-15', runtime: 120, genres: [{ name: 'Action' }, { name: 'Adventure' }], overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler with the aid of Max.' },
            { id: 304, title: 'Gladiator',           poster_path: 'images/movie16.jpg', backdrop_path: null, vote_average: 8.5, vote_count: 24000, release_date: '2000-05-05', runtime: 155, genres: [{ name: 'Action' }, { name: 'Drama' }], overview: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.' },
            { id: 305, title: 'Top Gun: Maverick',   poster_path: 'images/movie17.jpg', backdrop_path: null, vote_average: 8.3, vote_count: 19000, release_date: '2022-05-27', runtime: 130, genres: [{ name: 'Action' }, { name: 'Drama' }], overview: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.' },
            { id: 306, title: 'Extraction',          poster_path: 'images/movie18.jpg', backdrop_path: null, vote_average: 6.8, vote_count: 14000, release_date: '2020-04-24', runtime: 116, genres: [{ name: 'Action' }, { name: 'Thriller' }], overview: 'A black-market mercenary embarks on the most deadly extraction of his career.' },
            { id: 307, title: 'Die Hard',            poster_path: 'images/movie13.jpg', backdrop_path: null, vote_average: 8.2, vote_count: 17000, release_date: '1988-07-20', runtime: 132, genres: [{ name: 'Action' }, { name: 'Thriller' }], overview: 'An NYPD officer tries to save his wife and several others taken hostage by terrorists.' },
            { id: 308, title: 'Casino Royale',       poster_path: 'images/movie14.jpg', backdrop_path: null, vote_average: 8.0, vote_count: 16000, release_date: '2006-11-17', runtime: 144, genres: [{ name: 'Action' }, { name: 'Adventure' }], overview: 'After earning 00 status, Secret Agent James Bond sets out on his first mission as 007.' }
        ]
    };


    // ==========================================
    // 3. BACKEND API UTILITIES & PROFILE STATE
    // ==========================================
    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5000/api';
    }

    function getActiveProfile() {
        try {
            const stored = sessionStorage.getItem('netflix_active_profile');
            if (stored) return JSON.parse(stored);
        } catch (e) {}
        return null;
    }

    function getActiveProfileId() {
        const profile = getActiveProfile();
        return profile ? (profile.id || profile._id) : null;
    }


    // ==========================================
    // 4. RECOMMENDATION SERVICE (Task 18 & 21)
    // ==========================================
    async function apiFetchRecommendations() {
        if (typeof AuthService === 'undefined' || !currentUserSession) return null;

        try {
            const token = await AuthService.getIdToken();
            if (!token) return null;

            const profileId = getActiveProfileId();
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            if (profileId) headers['x-profile-id'] = String(profileId);

            const response = await fetch(`${getBackendUrl()}/recommendations`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) return null;

            return await response.json();
        } catch (err) {
            console.warn('Recommendations fetch notice:', err.message);
            return null;
        }
    }

    async function renderPersonalizedSections() {
        if (!becauseYouWatchedSection || !myListPicksSection || !forYouSection) return;

        const heroTitleEl = id('hero-title');
        const heroDescEl  = document.querySelector('.hero-description');
        let heroBadgeEl   = document.querySelector('.hero-rec-badge');

        if (!currentUserSession) {
            becauseYouWatchedSection.style.display = 'none';
            myListPicksSection.style.display = 'none';
            forYouSection.style.display = 'none';
            if (heroBadgeEl) heroBadgeEl.remove();
            currentHeroMovie = null;
            return;
        }

        const data = await apiFetchRecommendations();

        if (!data || !data.personalized || !data.recommendations) {
            becauseYouWatchedSection.style.display = 'none';
            myListPicksSection.style.display = 'none';
            forYouSection.style.display = 'none';
            if (heroBadgeEl) heroBadgeEl.remove();
            currentHeroMovie = null;
            return;
        }

        // Personalized Hero (Task 28)
        if (data.heroRecommendation && heroTitleEl) {
            currentHeroMovie = data.heroRecommendation;
            heroTitleEl.textContent = data.heroRecommendation.title;
            if (heroDescEl && data.heroRecommendation.overview) {
                heroDescEl.textContent = data.heroRecommendation.overview;
            }
            if (!heroBadgeEl) {
                heroBadgeEl = document.createElement('span');
                heroBadgeEl.className = 'hero-rec-badge';
                heroBadgeEl.textContent = 'Recommended for you';
                heroTitleEl.parentNode.insertBefore(heroBadgeEl, heroTitleEl);
            }
        }

        const { becauseYouWatched, myListPicks, forYou } = data.recommendations;

        if (becauseYouWatched && Array.isArray(becauseYouWatched.movies) && becauseYouWatched.movies.length > 0) {
            becauseYouWatchedTitle.textContent = `Because You Watched "${becauseYouWatched.referenceTitle}"`;
            becauseYouWatchedRow.textContent = '';
            becauseYouWatched.movies.forEach((m) => becauseYouWatchedRow.appendChild(createMovieCard(m)));
            becauseYouWatchedSection.style.display = 'block';
        } else {
            becauseYouWatchedSection.style.display = 'none';
        }

        if (Array.isArray(myListPicks) && myListPicks.length > 0) {
            myListPicksRow.textContent = '';
            myListPicks.forEach((m) => myListPicksRow.appendChild(createMovieCard(m)));
            myListPicksSection.style.display = 'block';
        } else {
            myListPicksSection.style.display = 'none';
        }

        if (Array.isArray(forYou) && forYou.length > 0) {
            forYouRow.textContent = '';
            forYou.forEach((m) => forYouRow.appendChild(createMovieCard(m)));
            forYouSection.style.display = 'block';
        } else {
            forYouSection.style.display = 'none';
        }
    }


    // ==========================================
    // 5. WATCH HISTORY SERVICE (Task 16)
    // ==========================================

    async function apiFetchWatchHistory() {
        if (typeof AuthService === 'undefined' || !currentUserSession) return [];

        try {
            const token = await AuthService.getIdToken();
            if (!token) return [];

            const response = await fetch(`${getBackendUrl()}/watch-history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];

            const result = await response.json();
            return (result && Array.isArray(result.history)) ? result.history : [];
        } catch (err) {
            console.warn('Watch history fetch notice:', err.message);
            return [];
        }
    }

    async function apiAddToWatchHistory(movie, progress = 1800, duration = 7200) {
        if (typeof AuthService === 'undefined' || !currentUserSession) return null;

        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const payload = {
            movieId: Number(movie.id || movie.movieId),
            title: (movie.title || movie.name || 'Untitled').trim(),
            posterPath: movie.poster_path || movie.posterPath || null,
            backdropPath: movie.backdrop_path || movie.backdropPath || null,
            progress: progress,
            duration: duration
        };

        const response = await fetch(`${getBackendUrl()}/watch-history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result.record;
    }

    async function apiRemoveFromWatchHistory(movieId) {
        if (typeof AuthService === 'undefined' || !currentUserSession) return null;

        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const response = await fetch(`${getBackendUrl()}/watch-history/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    function createContinueWatchingCard(historyItem) {
        const titleText = (historyItem.title || 'Untitled').trim();
        const movieId   = historyItem.movieId || historyItem.id;
        const progress  = Number(historyItem.progress) || 0;
        const duration  = Number(historyItem.duration) || 7200;
        const percentage = Math.min(100, Math.max(0, Math.round((progress / duration) * 100)));

        const article = document.createElement('article');
        article.className = 'movie-card continue-watching-card';
        article.setAttribute('data-movie-id', movieId);
        article.setAttribute('data-title', titleText);
        article.setAttribute('tabindex', '0');
        article.setAttribute('role', 'button');
        article.setAttribute('aria-label', `Resume ${titleText} at ${percentage} percent`);

        const img = document.createElement('img');
        img.setAttribute('loading', 'lazy');
        img.alt = `${titleText} poster`;
        const posterSrc = getPosterUrl(historyItem.posterPath || historyItem.poster_path);
        if (posterSrc) img.src = posterSrc;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'card-progress-container';
        progressContainer.setAttribute('aria-hidden', 'true');

        const progressBar = document.createElement('div');
        progressBar.className = 'card-progress-bar';
        progressBar.style.width = `${percentage}%`;
        progressContainer.appendChild(progressBar);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-card-remove-history';
        removeBtn.textContent = '✕';
        removeBtn.setAttribute('aria-label', `Remove ${titleText} from Continue Watching`);
        removeBtn.title = 'Remove from Continue Watching';

        removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (isHistoryMutating) return;
            isHistoryMutating = true;

            try {
                await apiRemoveFromWatchHistory(movieId);
                showToast(`Removed "${titleText}" from Continue Watching.`);
                await renderContinueWatching();
                await renderPersonalizedSections();
            } catch (err) {
                console.error('History remove error:', err.message);
                showToast('Unable to remove from Continue Watching.');
            } finally {
                isHistoryMutating = false;
            }
        });

        const movieInfoDiv = document.createElement('div');
        movieInfoDiv.className = 'movie-info';

        const h3 = document.createElement('h3');
        h3.textContent = titleText;

        const badge = document.createElement('span');
        badge.className = 'card-progress-badge';
        badge.textContent = `${percentage}% watched`;

        movieInfoDiv.appendChild(h3);
        movieInfoDiv.appendChild(badge);

        article.appendChild(img);
        article.appendChild(progressContainer);
        article.appendChild(removeBtn);
        article.appendChild(movieInfoDiv);

        article.addEventListener('click', () => {
            activeCardTrigger = article;
            openMovieDetails(movieId, historyItem);
        });

        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activeCardTrigger = article;
                openMovieDetails(movieId, historyItem);
            }
        });

        return article;
    }

    async function renderContinueWatching() {
        if (!continueWatchingSection || !continueWatchingRow) return;

        if (!currentUserSession) {
            continueWatchingSection.style.display = 'none';
            continueWatchingRow.textContent = '';
            return;
        }

        const history = await apiFetchWatchHistory();
        activeWatchHistory = history;

        if (!history || history.length === 0) {
            continueWatchingSection.style.display = 'none';
            continueWatchingRow.textContent = '';
            return;
        }

        continueWatchingRow.textContent = '';
        continueWatchingSection.style.display = 'block';

        history.forEach((item) => {
            const card = createContinueWatchingCard(item);
            continueWatchingRow.appendChild(card);
        });
    }


    // ==========================================
    // 6. WATCHLIST SERVICE (Task 14)
    // ==========================================

    function getLocalStorageKey() {
        if (currentUserSession && currentUserSession.uid) {
            return `netflix_clone_watchlist_${currentUserSession.uid}`;
        }
        return 'netflix_clone_watchlist';
    }

    function getLocalWatchlist() {
        const key = getLocalStorageKey();
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Watchlist: corrupt localStorage data.', err.message);
            localStorage.removeItem(key);
            return [];
        }
    }

    function saveLocalWatchlist(watchlist) {
        const key = getLocalStorageKey();
        try {
            localStorage.setItem(key, JSON.stringify(watchlist));
        } catch (err) {
            console.error('Watchlist: unable to save to localStorage.', err.message);
        }
    }

    async function apiFetchWatchlist() {
        if (typeof AuthService === 'undefined') return null;

        const token = await AuthService.getIdToken();
        if (!token) return null;

        const profileId = getActiveProfileId();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        if (profileId) headers['x-profile-id'] = String(profileId);

        const response = await fetch(`${getBackendUrl()}/watchlist`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return (result && Array.isArray(result.watchlist)) ? result.watchlist : [];
    }

    async function apiAddToWatchlist(movie) {
        if (typeof AuthService === 'undefined') return null;

        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const profileId = getActiveProfileId();
        const payload = {
            movieId: Number(movie.id || movie.movieId),
            title: (movie.title || movie.name || 'Untitled').trim(),
            posterPath: movie.poster_path || movie.posterPath || null,
            backdropPath: movie.backdrop_path || movie.backdropPath || null,
            voteAverage: movie.vote_average || movie.voteAverage || null,
            releaseDate: movie.release_date || movie.first_air_date || movie.releaseDate || null,
            overview: movie.overview || null
        };

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        if (profileId) headers['x-profile-id'] = String(profileId);

        const response = await fetch(`${getBackendUrl()}/watchlist`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result.movie;
    }

    async function apiRemoveFromWatchlist(movieId) {
        if (typeof AuthService === 'undefined') return null;

        const token = await AuthService.getIdToken();
        if (!token) throw new Error('Authentication required.');

        const profileId = getActiveProfileId();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        if (profileId) headers['x-profile-id'] = String(profileId);

        const response = await fetch(`${getBackendUrl()}/watchlist/${movieId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    async function syncGuestWatchlistToBackend() {
        try {
            const guestItems = JSON.parse(localStorage.getItem('netflix_clone_watchlist') || '[]');
            if (Array.isArray(guestItems) && guestItems.length > 0) {
                for (const item of guestItems) {
                    await apiAddToWatchlist(item).catch(() => {});
                }
                localStorage.removeItem('netflix_clone_watchlist');
            }
        } catch (syncErr) {
            console.warn('Guest watchlist sync notice:', syncErr.message);
        }
    }

    async function loadWatchlist() {
        if (currentUserSession) {
            try {
                const backendList = await apiFetchWatchlist();
                if (Array.isArray(backendList)) {
                    activeWatchlist = backendList.map((m) => ({
                        id: m.movieId || m.id,
                        movieId: m.movieId || m.id,
                        title: m.title,
                        poster_path: m.posterPath || m.poster_path,
                        backdrop_path: m.backdropPath || m.backdrop_path,
                        vote_average: m.voteAverage || m.vote_average,
                        release_date: m.releaseDate || m.release_date,
                        overview: m.overview,
                        genres: m.genres || []
                    }));
                    saveLocalWatchlist(activeWatchlist);
                    return activeWatchlist;
                }
            } catch (err) {
                console.warn('Backend watchlist unreachable — using local cache:', err.message);
                activeWatchlist = getLocalWatchlist();
                return activeWatchlist;
            }
        }

        activeWatchlist = getLocalWatchlist();
        return activeWatchlist;
    }

    function isMovieInWatchlist(movieId) {
        return activeWatchlist.some((m) => String(m.id || m.movieId) === String(movieId));
    }

    function updateWatchlistButton(movieId, customLabel = null) {
        if (!modalWatchlistBtn) return;

        const inList = isMovieInWatchlist(movieId);
        const iconEl = modalWatchlistBtn.querySelector('.watchlist-btn-icon');
        const textEl = modalWatchlistBtn.querySelector('.watchlist-btn-text');

        if (customLabel) {
            if (iconEl) iconEl.textContent = '⏳';
            if (textEl) textEl.textContent = ` ${customLabel}`;
            modalWatchlistBtn.disabled = true;
            return;
        }

        modalWatchlistBtn.disabled = false;
        if (iconEl) iconEl.textContent = inList ? '✓' : '+';
        if (textEl) textEl.textContent = ' My List';

        modalWatchlistBtn.classList.toggle('in-list', inList);
        modalWatchlistBtn.setAttribute('aria-pressed', inList ? 'true' : 'false');
        modalWatchlistBtn.setAttribute(
            'aria-label',
            inList ? 'Remove from My List' : 'Add to My List'
        );
        modalWatchlistBtn.dataset.movieId = String(movieId);
    }

    const libraryState = {
        searchQuery: '',
        statusFilter: 'all',
        sortBy: 'recent'
    };

    const libraryCountBadge  = id('library-count-badge');
    const libraryControls    = id('library-controls');
    const librarySearchInput = id('library-search-input');
    const libraryFilterTabs  = id('library-filter-tabs');
    const librarySortSelect  = id('library-sort-select');

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', (e) => {
            libraryState.searchQuery = e.target.value.trim();
            renderWatchlist();
        });
    }

    if (libraryFilterTabs) {
        const tabs = libraryFilterTabs.querySelectorAll('.lib-tab');
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                libraryState.statusFilter = tab.getAttribute('data-status') || 'all';
                renderWatchlist();
            });
        });
    }

    if (librarySortSelect) {
        librarySortSelect.addEventListener('change', (e) => {
            libraryState.sortBy = e.target.value;
            renderWatchlist();
        });
    }

    function renderWatchlist() {
        if (!watchlistContainer) return;

        const totalCount = activeWatchlist.length;
        if (libraryCountBadge) {
            libraryCountBadge.textContent = `${totalCount} ${totalCount === 1 ? 'title' : 'titles'}`;
        }

        if (libraryControls) {
            libraryControls.style.display = totalCount > 0 ? 'flex' : 'none';
        }

        watchlistContainer.textContent = '';

        if (totalCount === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'watchlist-empty';
            emptyDiv.innerHTML = `
                <p class="watchlist-empty-icon" aria-hidden="true">📋</p>
                <p class="watchlist-empty-title">Your list is empty.</p>
                <p class="watchlist-empty-hint">Find movies and shows you want to watch later and click "+ My List".</p>
                <a href="browse.html" class="btn btn-auth-submit" style="margin-top: 16px; display: inline-block;">Browse Movies</a>
            `;
            watchlistContainer.appendChild(emptyDiv);
            return;
        }

        // Apply Local Filter & Search
        let filtered = [...activeWatchlist];

        // Search query filter
        if (libraryState.searchQuery) {
            const q = libraryState.searchQuery.toLowerCase();
            filtered = filtered.filter((m) => (m.title || m.name || '').toLowerCase().includes(q));
        }

        // Status filter
        if (libraryState.statusFilter !== 'all') {
            filtered = filtered.filter((movie) => {
                const mid = movie.id || movie.movieId;
                const h = activeWatchHistory.find((item) => String(item.movieId || item.id) === String(mid));
                
                const isCompleted = h && (h.status === 'completed' || (h.duration > 0 && h.progress / h.duration >= 0.9));
                const isInProgress = h && h.progress > 0 && !isCompleted;
                const isNotStarted = !h || !h.progress || h.progress === 0;

                if (libraryState.statusFilter === 'completed') return isCompleted;
                if (libraryState.statusFilter === 'in-progress') return isInProgress;
                if (libraryState.statusFilter === 'not-started') return isNotStarted;
                return true;
            });
        }

        // Sorting
        if (libraryState.sortBy === 'oldest') {
            filtered.reverse();
        } else if (libraryState.sortBy === 'title_asc') {
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (libraryState.sortBy === 'title_desc') {
            filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        } else if (libraryState.sortBy === 'rating') {
            filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        } else if (libraryState.sortBy === 'year') {
            filtered.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
        }

        if (filtered.length === 0) {
            const emptyFilterDiv = document.createElement('div');
            emptyFilterDiv.className = 'watchlist-empty';
            emptyFilterDiv.innerHTML = `
                <p class="watchlist-empty-icon" aria-hidden="true">🔍</p>
                <p class="watchlist-empty-title">No movies match your filters in My List.</p>
                <button type="button" class="btn-clear-recent" id="btn-reset-library-filters" style="margin-top: 12px; font-size: 14px;">Reset Filters</button>
            `;
            const resetBtn = emptyFilterDiv.querySelector('#btn-reset-library-filters');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    libraryState.searchQuery = '';
                    libraryState.statusFilter = 'all';
                    if (librarySearchInput) librarySearchInput.value = '';
                    if (libraryFilterTabs) {
                        const tabs = libraryFilterTabs.querySelectorAll('.lib-tab');
                        tabs.forEach((t) => {
                            const isAll = t.getAttribute('data-status') === 'all';
                            t.classList.toggle('active', isAll);
                            t.setAttribute('aria-selected', isAll ? 'true' : 'false');
                        });
                    }
                    renderWatchlist();
                });
            }
            watchlistContainer.appendChild(emptyFilterDiv);
            return;
        }

        const gridEl = document.createElement('div');
        gridEl.className = 'library-cards-grid';
        gridEl.setAttribute('aria-label', 'Personal content library');

        filtered.forEach((movie) => {
            const mid = movie.id || movie.movieId;
            const h = activeWatchHistory.find((item) => String(item.movieId || item.id) === String(mid));
            const isCompleted = h && (h.status === 'completed' || (h.duration > 0 && h.progress / h.duration >= 0.9));
            const isInProgress = h && h.progress > 0 && !isCompleted;
            const percent = (isInProgress && h.duration > 0) ? Math.round((h.progress / h.duration) * 100) : 0;

            const card = createMovieCard(movie);

            // Add remove from library button
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-library-remove';
            removeBtn.setAttribute('aria-label', `Remove ${movie.title} from My List`);
            removeBtn.innerHTML = '✕';
            removeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await apiRemoveFromWatchlist(mid);
                    renderWatchlist();
                    showToast(`Removed "${movie.title}" from My List`);
                } catch (err) {
                    showToast(`Unable to remove "${movie.title}"`);
                }
            });
            card.appendChild(removeBtn);

            // Progress bar or Completed badge overlay
            if (isCompleted) {
                const badge = document.createElement('div');
                badge.className = 'library-completed-badge';
                badge.textContent = '✓ Completed';
                card.appendChild(badge);
            } else if (isInProgress) {
                const progWrap = document.createElement('div');
                progWrap.className = 'library-progress-bar-wrap';
                progWrap.innerHTML = `
                    <div class="library-progress-bar" style="width: ${percent}%;"></div>
                    <span class="library-progress-label">${percent}%</span>
                `;
                card.appendChild(progWrap);
            }

            gridEl.appendChild(card);
        });

        watchlistContainer.appendChild(gridEl);
    }


    // ==========================================
    // 7. API CONFIGURATION & FORMATTING HELPERS
    // ==========================================
    function isApiKeyConfigured() {
        return (
            typeof TMDB_API_KEY !== 'undefined' &&
            TMDB_API_KEY &&
            TMDB_API_KEY !== 'YOUR_TMDB_API_KEY'
        );
    }

    async function fetchFromAPI(endpointUrl) {
        const response = await fetch(endpointUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }

    function getPosterUrl(posterPath) {
        if (!posterPath) return '';
        if (posterPath.startsWith('http') || posterPath.startsWith('images/')) return posterPath;
        const base = (typeof TMDB_IMAGE_BASE_URL !== 'undefined') ? TMDB_IMAGE_BASE_URL : 'https://image.tmdb.org/t/p/w500';
        return base + posterPath;
    }

    function getBackdropUrl(backdropPath) {
        if (!backdropPath) return '';
        if (backdropPath.startsWith('http') || backdropPath.startsWith('images/')) return backdropPath;
        const base = (typeof TMDB_IMAGE_BASE_URL !== 'undefined') ? TMDB_IMAGE_BASE_URL : 'https://image.tmdb.org/t/p/w1280';
        return base + backdropPath;
    }

    function formatRuntime(minutes) {
        if (!minutes || isNaN(minutes) || minutes <= 0) return 'Runtime unavailable';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs === 0) return `${mins}m`;
        if (mins === 0) return `${hrs}h`;
        return `${hrs}h ${mins}m`;
    }

    function formatReleaseDate(dateString) {
        if (!dateString) return 'Date unavailable';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    }

    function extractYouTubeTrailer(videos) {
        if (!Array.isArray(videos) || videos.length === 0) return null;

        // Prefer official YouTube trailer
        const officialTrailer = videos.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true && v.key
        );
        if (officialTrailer) return officialTrailer.key;

        // Next prefer any YouTube trailer
        const anyTrailer = videos.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key
        );
        if (anyTrailer) return anyTrailer.key;

        // Fallback to any YouTube teaser or clip
        const anyVideo = videos.find((v) => v.site === 'YouTube' && v.key);
        return anyVideo ? anyVideo.key : null;
    }


    // ==========================================
    // 8. SHARED MOVIE CARD CREATION
    // ==========================================
    function createMovieCard(movie) {
        const titleText = (movie.title || movie.name || 'Untitled').trim();
        const movieId   = movie.id || movie.movieId || '';

        const article = document.createElement('article');
        article.className = 'movie-card';
        article.setAttribute('data-movie-id', movieId);
        article.setAttribute('data-title', titleText);
        article.setAttribute('tabindex', '0');
        article.setAttribute('role', 'button');
        article.setAttribute('aria-label', `View details for ${titleText}`);

        const img = document.createElement('img');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.setAttribute('width', '200');
        img.setAttribute('height', '300');
        img.alt = `${titleText} poster`;
        const posterSrc = getPosterUrl(movie.poster_path || movie.posterPath);
        if (posterSrc) img.src = posterSrc;

        const movieInfoDiv = document.createElement('div');
        movieInfoDiv.className = 'movie-info';

        const h3 = document.createElement('h3');
        h3.textContent = titleText;

        movieInfoDiv.appendChild(h3);
        article.appendChild(img);
        article.appendChild(movieInfoDiv);

        article.addEventListener('click', () => {
            activeCardTrigger = article;
            openMovieDetails(movieId, movie);
        });

        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activeCardTrigger = article;
                openMovieDetails(movieId, movie);
            }
        });

        return article;
    }


    // ==========================================
    // 9. MOVIE SECTION RENDERING
    // ==========================================
    async function renderMovieSection(containerElement, apiEndpoint, fallbackCategory) {
        if (!containerElement) return;

        containerElement.innerHTML = '';
        const loadingEl = document.createElement('div');
        loadingEl.className = 'section-loading';
        loadingEl.textContent = 'Loading movies...';
        containerElement.appendChild(loadingEl);

        try {
            let movies = [];

            if (isApiKeyConfigured()) {
                const data = await fetchFromAPI(apiEndpoint);
                movies = (data && Array.isArray(data.results)) ? data.results : [];
            } else {
                await new Promise((resolve) => setTimeout(resolve, 200));
                movies = MOCK_DATASET[fallbackCategory] || [];
            }

            containerElement.innerHTML = '';

            if (movies.length === 0) {
                const emptyEl = document.createElement('div');
                emptyEl.className = 'section-empty';
                emptyEl.textContent = 'No movies found.';
                containerElement.appendChild(emptyEl);
                return;
            }

            movies.forEach((movie) => {
                const card = createMovieCard(movie);
                containerElement.appendChild(card);
            });

        } catch (error) {
            console.error(`Failed to load ${fallbackCategory} movies:`, error.message);
            containerElement.innerHTML = '';
            const errorEl = document.createElement('div');
            errorEl.className = 'section-error';
            errorEl.textContent = 'Unable to load movies. Please check your connection and API key.';
            containerElement.appendChild(errorEl);
        }
    }


    // ==========================================
    // 10. MOVIE DETAILS & TMDB INTEGRATION (Task 19)
    // ==========================================
    async function fetchMovieDetails(movieId) {
        if (isApiKeyConfigured()) {
            const base   = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const apiKey = TMDB_API_KEY;
            return await fetchFromAPI(`${base}/movie/${movieId}?api_key=${apiKey}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 200));

        const watchlistMatch = activeWatchlist.find((m) => String(m.id || m.movieId) === String(movieId));
        if (watchlistMatch) return watchlistMatch;

        const historyMatch = activeWatchHistory.find((m) => String(m.movieId || m.id) === String(movieId));
        if (historyMatch) return historyMatch;

        for (const category in MOCK_DATASET) {
            const found = MOCK_DATASET[category].find((m) => m.id == movieId);
            if (found) return found;
        }

        throw new Error('Movie details not found.');
    }

    async function fetchMovieVideos(movieId) {
        if (!isApiKeyConfigured()) return [];
        try {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const data = await fetchFromAPI(`${base}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
            return (data && Array.isArray(data.results)) ? data.results : [];
        } catch (e) {
            return [];
        }
    }

    const LANGUAGE_NAMES = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        ja: 'Japanese',
        ko: 'Korean',
        hi: 'Hindi',
        zh: 'Chinese',
        pt: 'Portuguese',
        ru: 'Russian'
    };

    async function fetchMovieCredits(movieId) {
        if (!isApiKeyConfigured()) return { cast: [], crew: [] };
        try {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const data = await fetchFromAPI(`${base}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
            return {
                cast: (data && Array.isArray(data.cast)) ? data.cast : [],
                crew: (data && Array.isArray(data.crew)) ? data.crew : []
            };
        } catch (e) {
            return { cast: [], crew: [] };
        }
    }

    async function fetchSimilarMovies(movieId) {
        if (!isApiKeyConfigured()) return [];
        try {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const data = await fetchFromAPI(`${base}/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`);
            return (data && Array.isArray(data.results)) ? data.results : [];
        } catch (e) {
            return [];
        }
    }


    // ==========================================
    // 11. MOVIE DETAILS MODAL — OPEN
    // ==========================================
    async function openMovieDetails(movieId, fallbackMovieObj = null) {
        if (!movieModal) return;

        const requestId = ++currentRequestId;

        movieModal.classList.add('is-open');
        movieModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (modalBackdropImg) modalBackdropImg.removeAttribute('src');
        if (modalPosterImg)   modalPosterImg.removeAttribute('src');

        if (modalHero)  modalHero.style.display  = 'none';
        if (modalBody)  modalBody.style.display  = 'none';
        if (modalState) {
            modalState.style.display = 'block';
            modalState.textContent   = '';
            const loadingEl = document.createElement('div');
            loadingEl.className   = 'section-loading';
            loadingEl.textContent = 'Loading movie details...';
            modalState.appendChild(loadingEl);
        }

        try {
            // Parallel retrieval of Details, Videos, Cast, and Similar
            const [detailsResult, videosResult, creditsResult, similarResult] = await Promise.allSettled([
                fetchMovieDetails(movieId),
                fetchMovieVideos(movieId),
                fetchMovieCredits(movieId),
                fetchSimilarMovies(movieId)
            ]);

            let details = detailsResult.status === 'fulfilled' ? detailsResult.value : fallbackMovieObj;
            if (!details) throw new Error('Unable to load movie details.');

            if (requestId !== currentRequestId) return;

            currentModalMovieData = details;

            const videos   = videosResult.status === 'fulfilled' ? videosResult.value : [];
            const credits  = creditsResult.status === 'fulfilled' ? creditsResult.value : { cast: [], crew: [] };
            const cast     = credits.cast || [];
            const crew     = credits.crew || [];
            const similar  = similarResult.status === 'fulfilled' ? similarResult.value : [];

            currentTrailerKey = extractYouTubeTrailer(videos);

            populateModalData(details, cast, similar, crew);
            updateWatchlistButton(details.id || details.movieId);

            // Configure Watch Trailer Button
            if (modalTrailerBtn) {
                if (currentTrailerKey) {
                    modalTrailerBtn.disabled = false;
                    modalTrailerBtn.style.display = 'inline-flex';
                    modalTrailerBtn.title = 'Watch official YouTube trailer';
                } else {
                    modalTrailerBtn.disabled = true;
                    modalTrailerBtn.style.display = 'inline-flex';
                    modalTrailerBtn.title = 'Trailer unavailable for this movie';
                }
            }

            if (modalState) modalState.style.display = 'none';
            if (modalHero)  modalHero.style.display  = 'block';
            if (modalBody)  modalBody.style.display  = 'flex';

            if (modalCloseBtn) modalCloseBtn.focus();

        } catch (error) {
            if (requestId !== currentRequestId) return;

            currentModalMovieData = null;
            currentTrailerKey = null;

            console.error('Error loading movie details:', error.message);

            if (modalHero)  modalHero.style.display  = 'none';
            if (modalBody)  modalBody.style.display  = 'none';
            if (modalState) {
                modalState.style.display = 'block';
                modalState.textContent   = '';
                const errorEl = document.createElement('div');
                errorEl.className   = 'section-error';
                errorEl.textContent = 'Unable to load movie details. Please try again later.';
                modalState.appendChild(errorEl);
            }
        }
    }


    // ==========================================
    // 12. MOVIE DETAILS MODAL — POPULATE
    // ==========================================
    function populateModalData(data, castList = [], similarList = [], crewList = []) {
        const titleText = (data.title || data.name || 'Untitled').trim();
        const mid       = data.id || data.movieId;

        if (modalTitle) modalTitle.textContent = titleText;

        if (modalRating) {
            const vote = data.vote_average || data.voteAverage;
            const count = data.vote_count || data.voteCount;
            if (typeof vote === 'number' && vote > 0) {
                modalRating.textContent = count ? `★ ${vote.toFixed(1)} (${count.toLocaleString()} votes)` : `★ ${vote.toFixed(1)}`;
            } else {
                modalRating.textContent = 'Rating unavailable';
            }
        }

        if (modalDate) {
            const rawDate = data.release_date || data.first_air_date || data.releaseDate || '';
            modalDate.textContent = formatReleaseDate(rawDate);
        }

        if (modalRuntime) {
            modalRuntime.textContent = formatRuntime(data.runtime);
        }

        // Configure Watch Button based on profile watch history
        if (modalWatchBtn) {
            const historyMatch = activeWatchHistory.find((h) => String(h.movieId || h.id) === String(mid));
            if (historyMatch && historyMatch.progress > 0) {
                if (historyMatch.status === 'completed' || (historyMatch.duration > 0 && historyMatch.progress / historyMatch.duration >= 0.9)) {
                    modalWatchBtn.innerHTML = '<span class="action-icon" aria-hidden="true">🔄</span> <span>Watch Again</span>';
                } else {
                    const percent = historyMatch.duration > 0 ? Math.round((historyMatch.progress / historyMatch.duration) * 100) : 0;
                    modalWatchBtn.innerHTML = `<span class="action-icon" aria-hidden="true">▶</span> <span>Continue Watching (${percent}%)</span>`;
                }
            } else {
                modalWatchBtn.innerHTML = '<span class="action-icon" aria-hidden="true">▶</span> <span>Watch Now</span>';
            }

            modalWatchBtn.onclick = () => {
                window.location.href = `watch.html?id=${mid}`;
            };
        }

        if (modalGenres) {
            modalGenres.textContent = '';
            const genreItems = [];

            if (Array.isArray(data.genres) && data.genres.length > 0) {
                data.genres.forEach((g) => genreItems.push(g.name));
            } else if (Array.isArray(data.genre_ids) && typeof TMDB_GENRE_MAP !== 'undefined') {
                data.genre_ids.forEach((gid) => {
                    if (TMDB_GENRE_MAP[gid]) genreItems.push(TMDB_GENRE_MAP[gid]);
                });
            }

            // Language & Director additions
            if (data.original_language && LANGUAGE_NAMES[data.original_language]) {
                genreItems.push(LANGUAGE_NAMES[data.original_language]);
            }

            if (Array.isArray(crewList)) {
                const director = crewList.find((c) => c.job === 'Director');
                if (director && director.name) {
                    genreItems.push(`Dir. ${director.name}`);
                }
            }

            if (genreItems.length > 0) {
                genreItems.forEach((name, index) => {
                    if (index > 0) {
                        const bullet = document.createElement('span');
                        bullet.textContent = ' • ';
                        bullet.setAttribute('aria-hidden', 'true');
                        modalGenres.appendChild(bullet);
                    }
                    const span = document.createElement('span');
                    span.textContent = name;
                    modalGenres.appendChild(span);
                });
            } else {
                modalGenres.textContent = 'Genre unavailable';
            }
        }

        // Overview with Read More / Read Less expansion
        if (modalOverview) {
            const fullText = (data.overview || 'No description available for this title.').trim();
            modalOverview.textContent = '';

            if (fullText.length > 220) {
                const shortText = fullText.slice(0, 220) + '... ';
                const textSpan  = document.createElement('span');
                textSpan.textContent = shortText;
                modalOverview.appendChild(textSpan);

                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'btn-read-more';
                toggleBtn.textContent = 'Read More';
                let isExpanded = false;

                toggleBtn.addEventListener('click', () => {
                    isExpanded = !isExpanded;
                    textSpan.textContent = isExpanded ? fullText + ' ' : shortText;
                    toggleBtn.textContent = isExpanded ? 'Read Less' : 'Read More';
                });

                modalOverview.appendChild(toggleBtn);
            } else {
                modalOverview.textContent = fullText;
            }
        }

        if (modalPosterImg) {
            const posterSrc = getPosterUrl(data.poster_path || data.posterPath);
            if (posterSrc) {
                modalPosterImg.src = posterSrc;
                modalPosterImg.alt = `${titleText} poster`;
            } else {
                modalPosterImg.removeAttribute('src');
                modalPosterImg.alt = '';
            }
        }

        if (modalBackdropImg) {
            const backdropSrc = getBackdropUrl(data.backdrop_path || data.backdropPath);
            if (backdropSrc) {
                modalBackdropImg.src = backdropSrc;
                modalBackdropImg.alt = `${titleText} backdrop`;
            } else {
                modalBackdropImg.removeAttribute('src');
                modalBackdropImg.alt = '';
            }
        }

        // Render Cast Section (Task 19 & 31)
        if (modalCastSection && modalCastGrid) {
            modalCastGrid.textContent = '';
            const topCast = (Array.isArray(castList) ? castList : []).slice(0, 8);

            if (topCast.length > 0) {
                topCast.forEach((actor) => {
                    const castCard = document.createElement('div');
                    castCard.className = 'cast-card';

                    if (actor.profile_path) {
                        const img = document.createElement('img');
                        img.className = 'cast-photo';
                        img.src = `https://image.tmdb.org/t/p/w185${actor.profile_path}`;
                        img.alt = actor.name || 'Cast';
                        img.loading = 'lazy';
                        castCard.appendChild(img);
                    } else {
                        const fallback = document.createElement('div');
                        fallback.className = 'cast-photo-fallback';
                        fallback.textContent = '👤';
                        castCard.appendChild(fallback);
                    }

                    const nameEl = document.createElement('span');
                    nameEl.className = 'cast-name';
                    nameEl.textContent = actor.name || 'Actor';

                    const charEl = document.createElement('span');
                    charEl.className = 'cast-character';
                    charEl.textContent = actor.character ? `as ${actor.character}` : '';

                    castCard.appendChild(nameEl);
                    if (actor.character) castCard.appendChild(charEl);
                    modalCastGrid.appendChild(castCard);
                });
                modalCastSection.style.display = 'block';
            } else {
                modalCastSection.style.display = 'none';
            }
        }

        // Render Similar Movies ("More Like This" - Task 19 & 31)
        if (modalSimilarSection && modalSimilarGrid) {
            modalSimilarGrid.textContent = '';
            const topSimilar = (Array.isArray(similarList) ? similarList : []).slice(0, 6);

            if (topSimilar.length > 0) {
                topSimilar.forEach((simMovie) => {
                    const card = createMovieCard(simMovie);
                    modalSimilarGrid.appendChild(card);
                });
                modalSimilarSection.style.display = 'block';
            } else {
                modalSimilarSection.style.display = 'none';
            }
        }
    }


    // ==========================================
    // 13. MOVIE DETAILS MODAL — CLOSE
    // ==========================================
    function closeMovieDetails() {
        if (!movieModal) return;

        movieModal.classList.remove('is-open');
        movieModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        if (modalBackdropImg) modalBackdropImg.removeAttribute('src');
        if (modalPosterImg)   modalPosterImg.removeAttribute('src');

        currentModalMovieData = null;
        currentTrailerKey = null;

        if (activeCardTrigger) {
            activeCardTrigger.focus();
            activeCardTrigger = null;
        }
    }


    // ==========================================
    // 14. TRAILER MODAL CONTROLS (Task 19)
    // ==========================================
    function openTrailerModal(youtubeKey, movieTitle) {
        if (!trailerModal || !trailerVideoWrapper || !youtubeKey) {
            showToast('Trailer unavailable.');
            return;
        }

        trailerVideoWrapper.textContent = '';

        // Embed via YouTube No-Cookie with secure parameters
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0&modestbranding=1`;
        iframe.title = `Official trailer for ${movieTitle || 'Movie'}`;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        trailerVideoWrapper.appendChild(iframe);

        trailerModal.classList.add('is-open');
        trailerModal.setAttribute('aria-hidden', 'false');

        if (trailerCloseBtn) trailerCloseBtn.focus();
    }

    function closeTrailerModal() {
        if (!trailerModal) return;

        // Crucial: Removing iframe completely terminates video and audio playback
        if (trailerVideoWrapper) {
            trailerVideoWrapper.textContent = '';
        }

        trailerModal.classList.remove('is-open');
        trailerModal.setAttribute('aria-hidden', 'true');

        if (modalTrailerBtn && modalTrailerBtn.offsetParent !== null) {
            modalTrailerBtn.focus();
        }
    }

    if (trailerCloseBtn) trailerCloseBtn.addEventListener('click', closeTrailerModal);
    if (trailerOverlay)  trailerOverlay.addEventListener('click', closeTrailerModal);

    if (modalTrailerBtn) {
        modalTrailerBtn.addEventListener('click', () => {
            if (currentTrailerKey && currentModalMovieData) {
                openTrailerModal(currentTrailerKey, currentModalMovieData.title);
            } else {
                showToast('Trailer unavailable for this title.');
            }
        });
    }


    // ==========================================
    // 15. MODAL EVENT LISTENERS
    // ==========================================
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeMovieDetails);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeMovieDetails);
    }

    document.addEventListener('keydown', (e) => {
        if (trailerModal && trailerModal.classList.contains('is-open')) {
            if (e.key === 'Escape') {
                closeTrailerModal();
                return;
            }
        }

        if (!movieModal || !movieModal.classList.contains('is-open')) return;

        if (e.key === 'Escape') {
            closeMovieDetails();
            return;
        }

        if (e.key === 'Tab' && modalContent) {
            const focusableSelectors = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ].join(', ');

            const focusableElements = Array.from(
                modalContent.querySelectorAll(focusableSelectors)
            ).filter((el) => el.offsetParent !== null);

            if (focusableElements.length === 0) return;

            const firstFocusable = focusableElements[0];
            const lastFocusable  = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });

    // Start Watching / Play Button in Details Modal
    if (modalWatchBtn) {
        modalWatchBtn.addEventListener('click', () => {
            if (!currentModalMovieData) return;
            const movieId = currentModalMovieData.id || 1;
            window.location.href = `watch.html?id=${movieId}`;
        });
    }


    // ==========================================
    // 16. WATCHLIST TOGGLE HANDLER (Task 14 & 18)
    // ==========================================
    if (modalWatchlistBtn) {
        modalWatchlistBtn.addEventListener('click', async () => {
            if (!currentModalMovieData || isWatchlistMutating) return;

            const movieId   = Number(currentModalMovieData.id || currentModalMovieData.movieId);
            const titleText = (currentModalMovieData.title || currentModalMovieData.name || 'Untitled').trim();
            const inList    = isMovieInWatchlist(movieId);

            isWatchlistMutating = true;

            try {
                if (inList) {
                    updateWatchlistButton(movieId, 'Removing...');

                    if (currentUserSession) {
                        await apiRemoveFromWatchlist(movieId);
                    }

                    activeWatchlist = activeWatchlist.filter((m) => Number(m.id || m.movieId) !== movieId);
                    saveLocalWatchlist(activeWatchlist);

                    showToast(`"${titleText}" removed from My List.`);
                } else {
                    updateWatchlistButton(movieId, 'Adding...');

                    const movieToAdd = {
                        id: movieId,
                        movieId: movieId,
                        title: titleText,
                        poster_path: currentModalMovieData.poster_path || currentModalMovieData.posterPath || null,
                        backdrop_path: currentModalMovieData.backdrop_path || currentModalMovieData.backdropPath || null,
                        vote_average: currentModalMovieData.vote_average || currentModalMovieData.voteAverage || null,
                        release_date: currentModalMovieData.release_date || currentModalMovieData.first_air_date || currentModalMovieData.releaseDate || null,
                        overview: currentModalMovieData.overview || null,
                        genres: currentModalMovieData.genres || []
                    };

                    if (currentUserSession) {
                        await apiAddToWatchlist(movieToAdd);
                    }

                    activeWatchlist.push(movieToAdd);
                    saveLocalWatchlist(activeWatchlist);

                    showToast(`"${titleText}" added to My List.`);

                    if (!currentUserSession) {
                        setTimeout(() => {
                            showToast('Tip: Sign in to keep your personal list synced across sessions.');
                        }, 3200);
                    }
                }

                await renderPersonalizedSections();
            } catch (err) {
                console.error('Watchlist mutation error:', err.message);
                showToast('Unable to update your list. Please try again.');
            } finally {
                isWatchlistMutating = false;
                updateWatchlistButton(movieId);
                renderWatchlist();
            }
        });
    }


    // ==========================================
    // 17. NAVBAR AUTH INTEGRATION
    // ==========================================
    function updateNavbarAuth(user) {
        if (!navAuthContainer) return;

        navAuthContainer.textContent = '';

        if (user) {
            // Notification Bell Wrapper (Task 20)
            const notifWrapper = document.createElement('div');
            notifWrapper.className = 'nav-notification-wrapper';
            notifWrapper.id = 'nav-notification-wrapper';

            const bellBtn = document.createElement('button');
            bellBtn.type = 'button';
            bellBtn.className = 'btn-nav-bell';
            bellBtn.id = 'nav-bell-btn';
            bellBtn.setAttribute('aria-label', 'Notifications');
            bellBtn.setAttribute('aria-expanded', 'false');
            bellBtn.innerHTML = `🔔 <span class="nav-unread-badge" id="nav-unread-badge" style="display: none;">0</span>`;

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

            const activeProfile = getActiveProfile() || {
                name: user.displayName || user.email.split('@')[0] || 'Profile',
                avatar: 'avatar-1'
            };

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
                    <a href="settings.html" class="profile-dropdown-link">⚙ Account Settings</a>
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
                                    const isCurrent = (p.id || p._id) === getActiveProfileId();
                                    pItem.className = `profile-dropdown-item ${isCurrent ? 'is-active-profile' : ''}`;
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
                                        await loadWatchlist();
                                        await renderContinueWatching();
                                        await renderPersonalizedSections();
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

            // Wire Bell & Dropdown Interaction
            bellBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('is-open');
                bellBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

                if (isOpen) {
                    const listEl = dropdown.querySelector('#dropdown-notification-list');
                    if (listEl && typeof AuthService !== 'undefined') {
                        listEl.innerHTML = '<div class="dropdown-loading">Loading notifications...</div>';
                        try {
                            const token = await AuthService.getIdToken();
                            const res = await fetch(`${getBackendUrl()}/notifications?page=1&limit=5`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.notifications && data.notifications.length > 0) {
                                listEl.textContent = '';
                                data.notifications.forEach((n) => {
                                    const itemEl = document.createElement('div');
                                    itemEl.className = `dropdown-item ${n.read ? 'is-read' : 'is-unread'}`;
                                    itemEl.innerHTML = `
                                        <span class="dropdown-item-icon">${n.type === 'WATCHLIST_ADDED' ? '📋' : n.type === 'WATCH_STARTED' ? '▶️' : '🔔'}</span>
                                        <div class="dropdown-item-info">
                                            <p class="dropdown-item-title">${n.title}</p>
                                            <p class="dropdown-item-msg">${n.message}</p>
                                        </div>
                                    `;
                                    itemEl.addEventListener('click', () => {
                                        if (n.movieId) openMovieDetails(n.movieId);
                                    });
                                    listEl.appendChild(itemEl);
                                });
                            } else {
                                listEl.innerHTML = '<div class="dropdown-empty"><p>No notifications yet.</p></div>';
                            }
                        } catch (err) {
                            listEl.innerHTML = '<div class="dropdown-empty"><p>No notifications available.</p></div>';
                        }
                    }
                }
            });

            // Mark all read in dropdown
            const markReadBtn = dropdown.querySelector('#btn-dropdown-mark-read');
            if (markReadBtn) {
                markReadBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (typeof AuthService !== 'undefined') {
                        const token = await AuthService.getIdToken();
                        await fetch(`${getBackendUrl()}/notifications/read-all`, {
                            method: 'PATCH',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).catch(() => {});
                        const badgeEl = notifWrapper.querySelector('#nav-unread-badge');
                        if (badgeEl) badgeEl.style.display = 'none';
                        showToast('All notifications marked as read.');
                        dropdown.classList.remove('is-open');
                    }
                });
            }

            // Fetch unread count for badge
            if (typeof AuthService !== 'undefined') {
                AuthService.getIdToken().then((token) => {
                    if (!token) return;
                    fetch(`${getBackendUrl()}/notifications/unread-count`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then((r) => r.json())
                    .then((d) => {
                        const badgeEl = notifWrapper.querySelector('#nav-unread-badge');
                        if (badgeEl && d.count > 0) {
                            badgeEl.textContent = d.count > 99 ? '99+' : String(d.count);
                            badgeEl.style.display = 'inline-flex';
                        }
                    })
                    .catch(() => {});
                });
            }

            document.addEventListener('click', (e) => {
                if (!notifWrapper.contains(e.target)) {
                    dropdown.classList.remove('is-open');
                    bellBtn.setAttribute('aria-expanded', 'false');
                }
            });
        } else {
            const signinLink = document.createElement('a');
            signinLink.href = 'login.html';
            signinLink.className = 'btn-nav-signin';
            signinLink.id = 'nav-signin-btn';
            signinLink.textContent = 'Sign In';

            navAuthContainer.appendChild(signinLink);
        }
    }

    // Subscribe to Firebase Auth state
    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange(async (user) => {
            currentUserSession = user;
            updateNavbarAuth(user);

            if (user) {
                await syncGuestWatchlistToBackend();
            }

            await loadWatchlist();
            renderWatchlist();
            await renderContinueWatching();
            await renderPersonalizedSections();
        });
    }


    // ==========================================
    // 18. MOBILE NAVIGATION
    // ==========================================
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            const isNavOpen = navbar.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', isNavOpen ? 'true' : 'false');
            menuToggle.textContent = isNavOpen ? '✕' : '☰';
            menuToggle.setAttribute('aria-label', isNavOpen ? 'Close navigation menu' : 'Open navigation menu');
        });
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navbar && navbar.classList.contains('nav-open')) {
            navbar.classList.remove('nav-open');
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = '☰';
                menuToggle.setAttribute('aria-label', 'Open navigation menu');
            }
        }
    });


    // ==========================================
    // 19. NAVBAR LINK ACTIVE STATE
    // ==========================================
    const allNavLinks = document.querySelectorAll('.main-nav .nav-link');

    allNavLinks.forEach((link) => {
        link.addEventListener('click', () => {
            allNavLinks.forEach((l) => l.classList.remove('active'));
            link.classList.add('active');

            if (navbar && navbar.classList.contains('nav-open')) {
                navbar.classList.remove('nav-open');
                if (menuToggle) {
                    menuToggle.setAttribute('aria-expanded', 'false');
                    menuToggle.textContent = '☰';
                    menuToggle.setAttribute('aria-label', 'Open navigation menu');
                }
            }
        });
    });


    // ==========================================
    // 20. SEARCH INTERACTION
    // ==========================================
    function openSearch() {
        if (searchContainer && searchInput) {
            searchContainer.classList.add('active');
            searchInput.focus();
        }
    }

    const searchSuggestions = id('search-suggestions');
    let searchDebounceTimer = null;
    let searchAbortController = null;
    let selectedSuggestionIndex = -1;

    function getRecentSearchesKey() {
        const profileId = getActiveProfileId() || 'default';
        const uid = currentUserSession ? currentUserSession.uid : 'anon';
        return `netflix_recent_searches_${uid}_${profileId}`;
    }

    function getRecentSearches() {
        try {
            const raw = localStorage.getItem(getRecentSearchesKey());
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveRecentSearch(query) {
        if (!query || !query.trim()) return;
        const clean = query.trim();
        let list = getRecentSearches().filter((q) => q.toLowerCase() !== clean.toLowerCase());
        list.unshift(clean);
        if (list.length > 8) list = list.slice(0, 8);
        try {
            localStorage.setItem(getRecentSearchesKey(), JSON.stringify(list));
        } catch (e) {}
    }

    function clearRecentSearches() {
        try {
            localStorage.removeItem(getRecentSearchesKey());
            hideSuggestions();
        } catch (e) {}
    }

    function hideSuggestions() {
        if (searchSuggestions) {
            searchSuggestions.style.display = 'none';
            searchSuggestions.innerHTML = '';
            selectedSuggestionIndex = -1;
        }
    }

    function renderRecentSearches() {
        if (!searchSuggestions) return;
        const recent = getRecentSearches();
        if (recent.length === 0) {
            hideSuggestions();
            return;
        }

        searchSuggestions.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'suggestions-header';
        header.innerHTML = `
            <span>Recent Searches</span>
            <button type="button" class="btn-clear-recent" id="btn-clear-recent-searches">Clear All</button>
        `;
        searchSuggestions.appendChild(header);

        recent.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'suggestion-item suggestion-history-item';
            row.setAttribute('role', 'option');
            row.innerHTML = `<span class="history-icon">🕒</span> <span class="suggestion-text">${item}</span>`;
            row.addEventListener('click', () => {
                if (searchInput) searchInput.value = item;
                saveRecentSearch(item);
                window.location.href = `browse.html?q=${encodeURIComponent(item)}`;
            });
            searchSuggestions.appendChild(row);
        });

        const clearBtn = searchSuggestions.querySelector('#btn-clear-recent-searches');
        if (clearBtn) clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearRecentSearches();
        });

        searchSuggestions.style.display = 'block';
    }

    async function fetchSearchSuggestions(query) {
        if (!searchSuggestions) return;

        if (searchAbortController) {
            searchAbortController.abort();
        }
        searchAbortController = new AbortController();

        try {
            const apiKey = (typeof TMDB_API_KEY !== 'undefined') ? TMDB_API_KEY : '';
            const baseUrl = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            let results = [];

            if (apiKey && apiKey !== 'YOUR_TMDB_API_KEY') {
                const res = await fetch(`${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1&include_adult=false`, {
                    signal: searchAbortController.signal
                });
                if (res.ok) {
                    const data = await res.json();
                    results = (data && Array.isArray(data.results)) ? data.results.slice(0, 6) : [];
                }
            } else {
                const qLower = query.toLowerCase();
                results = MOCK_DATASET.trending.concat(MOCK_DATASET.popular)
                    .filter((m) => m.title.toLowerCase().includes(qLower))
                    .slice(0, 6);
            }

            if (results.length === 0) {
                searchSuggestions.innerHTML = `
                    <div class="suggestion-empty">No quick results for "${query}". Press Enter to browse.</div>
                `;
                searchSuggestions.style.display = 'block';
                return;
            }

            searchSuggestions.innerHTML = '';
            selectedSuggestionIndex = -1;

            results.forEach((movie, idx) => {
                const title = movie.title || movie.name || 'Movie';
                const year = movie.release_date ? movie.release_date.split('-')[0] : '';
                const poster = movie.poster_path 
                    ? (movie.poster_path.startsWith('http') || movie.poster_path.startsWith('images/') ? movie.poster_path : `https://image.tmdb.org/t/p/w92${movie.poster_path}`)
                    : 'images/movie1.jpg';

                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.setAttribute('role', 'option');
                item.setAttribute('data-index', idx);
                item.innerHTML = `
                    <img class="suggestion-thumb" src="${poster}" alt="${title}" loading="lazy">
                    <div class="suggestion-meta">
                        <span class="suggestion-title">${title}</span>
                        <span class="suggestion-year">${year} ${movie.vote_average ? `• ★ ${movie.vote_average.toFixed(1)}` : ''}</span>
                    </div>
                `;

                item.addEventListener('click', () => {
                    saveRecentSearch(title);
                    openMovieDetails(movie.id || movie.movieId, movie);
                    hideSuggestions();
                });

                searchSuggestions.appendChild(item);
            });

            // View all results footer
            const viewAll = document.createElement('div');
            viewAll.className = 'suggestion-view-all';
            viewAll.textContent = `View all results for "${query}" →`;
            viewAll.addEventListener('click', () => {
                saveRecentSearch(query);
                window.location.href = `browse.html?q=${encodeURIComponent(query)}`;
            });
            searchSuggestions.appendChild(viewAll);

            searchSuggestions.style.display = 'block';

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('Suggestion notice:', err.message);
            }
        }
    }

    function closeSearch() {
        if (searchContainer && searchInput) {
            searchContainer.classList.remove('active');
            searchInput.value = '';
            hideSuggestions();
            filterMovies('');
        }
    }

    function filterMovies(query) {
        const cleanQuery = query.toLowerCase().trim();
        const allCards   = document.querySelectorAll('.movie-card');

        allCards.forEach((card) => {
            const cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
            card.style.display = (cleanQuery === '' || cardTitle.includes(cleanQuery)) ? '' : 'none';
        });
    }

    if (searchBtn) searchBtn.addEventListener('click', () => {
        openSearch();
        if (searchInput && !searchInput.value.trim()) {
            renderRecentSearches();
        }
    });

    if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value.trim()) {
                renderRecentSearches();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            filterMovies(val);

            clearTimeout(searchDebounceTimer);
            if (!val) {
                renderRecentSearches();
                return;
            }

            searchDebounceTimer = setTimeout(() => {
                fetchSearchSuggestions(val);
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            const items = searchSuggestions ? searchSuggestions.querySelectorAll('.suggestion-item') : [];

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length > 0) {
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                    items.forEach((it, idx) => it.classList.toggle('active', idx === selectedSuggestionIndex));
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length > 0) {
                    selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                    items.forEach((it, idx) => it.classList.toggle('active', idx === selectedSuggestionIndex));
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
                    items[selectedSuggestionIndex].click();
                } else {
                    const q = searchInput.value.trim();
                    if (q) {
                        saveRecentSearch(q);
                        window.location.href = `browse.html?q=${encodeURIComponent(q)}`;
                    }
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (searchContainer && !searchContainer.contains(e.target)) {
            hideSuggestions();
        }
    });


    // ==========================================
    // 21. HERO BUTTON INTERACTIONS
    // ==========================================
    if (heroPlayBtn) {
        heroPlayBtn.addEventListener('click', () => {
            const movieId = currentHeroMovie ? (currentHeroMovie.id || 201) : 201;
            window.location.href = `watch.html?id=${movieId}`;
        });
    }

    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', () => {
            const movieId = currentHeroMovie ? (currentHeroMovie.id || 201) : 201;
            openMovieDetails(movieId, currentHeroMovie);
        });
    }


    // ==========================================
    // 22. TOAST NOTIFICATION UTILITY
    // ==========================================
    function showToast(message) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className   = 'toast-message';
        toast.textContent = message;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);
    }


    // ==========================================
    // 23. APPLICATION INITIALIZATION
    // ==========================================
    async function initApplication() {
        const baseUrl  = (typeof TMDB_BASE_URL  !== 'undefined') ? TMDB_BASE_URL  : 'https://api.themoviedb.org/3';
        const apiKey   = (typeof TMDB_API_KEY   !== 'undefined') ? TMDB_API_KEY   : '';
        const actionId = (typeof TMDB_GENRES    !== 'undefined' && TMDB_GENRES.ACTION) ? TMDB_GENRES.ACTION : 28;

        const trendingEndpoint = `${baseUrl}/trending/movie/week?api_key=${apiKey}`;
        const popularEndpoint  = `${baseUrl}/movie/popular?api_key=${apiKey}`;
        const actionEndpoint   = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${actionId}`;

        await Promise.all([
            renderMovieSection(trendingRow, trendingEndpoint, 'trending'),
            renderMovieSection(popularRow,  popularEndpoint,  'popular'),
            renderMovieSection(actionRow,   actionEndpoint,   'action')
        ]);

        await loadWatchlist();
        renderWatchlist();
        await renderContinueWatching();
        await renderPersonalizedSections();
    }

    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        }
    }, { passive: true });

    initApplication();

});
