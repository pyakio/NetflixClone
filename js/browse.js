// ==========================================================================
// Browse & Advanced Discovery Controller — Task 19 Enhanced
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // Helper: Element by ID
    function id(elementId) {
        return document.getElementById(elementId);
    }

    // ==========================================
    // 1. CONSTANTS & GENRE DEFINITIONS
    // ==========================================
    const TMDB_GENRE_MAP = {
        28: 'Action',
        12: 'Adventure',
        16: 'Animation',
        35: 'Comedy',
        80: 'Crime',
        99: 'Documentary',
        18: 'Drama',
        10751: 'Family',
        14: 'Fantasy',
        36: 'History',
        27: 'Horror',
        10402: 'Music',
        9648: 'Mystery',
        10749: 'Romance',
        878: 'Science Fiction',
        53: 'Thriller',
        10752: 'War',
        37: 'Western'
    };

    const SORT_LABELS = {
        'popularity.desc': 'Most Popular',
        'vote_average.desc': 'Top Rated',
        'primary_release_date.desc': 'Newest Release',
        'primary_release_date.asc': 'Oldest Release',
        'vote_count.desc': 'Most Voted'
    };

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const filterForm         = id('filter-form');
    const filterPanel        = id('filter-panel');
    const filterToggleBtn    = id('filter-toggle-btn');
    const browseSearchInput   = id('browse-search-input');
    const browseSearchClear   = id('browse-search-clear');
    const genreSelect         = id('genre-filter');
    const yearSelect          = id('year-filter');
    const ratingSelect        = id('rating-filter');
    const sortSelect          = id('sort-filter');
    const resetBtn            = id('filter-reset-btn');
    const genrePillsContainer = id('genre-directory-pills');
    const browsePageTitle     = id('browse-page-title');
    const browsePageSubtitle  = id('browse-page-subtitle');

    const activeFiltersCont   = id('active-filters-container');
    const activeFiltersRow    = id('active-filters-row');

    const browseStatus        = id('browse-status');
    const moviesGrid          = id('browse-movies-grid');
    const loadMoreContainer   = id('load-more-container');
    const loadMoreBtn         = id('load-more-btn');
    const toastContainer      = id('toast-container');
    const navAuthContainer    = id('nav-auth-container');
    const menuToggle          = id('menu-toggle');
    const navbar              = document.querySelector('.navbar');

    // Modal DOM Elements (Task 19 Enhanced)
    const movieModal          = id('movie-modal');
    const modalCloseBtn       = id('movie-modal-close');
    const modalOverlay        = id('modal-overlay');
    const modalHero           = id('modal-hero');
    const modalBody           = id('modal-body');
    const modalState          = id('modal-state');
    const modalBackdropImg    = id('modal-backdrop-img');
    const modalPosterImg      = id('modal-poster-img');
    const modalTitle          = id('movie-modal-title');
    const modalRating         = id('modal-rating');
    const modalDate           = id('modal-date');
    const modalRuntime        = id('modal-runtime');
    const modalGenres         = id('modal-genres');
    const modalOverview       = id('modal-overview');
    const modalTrailerBtn     = id('modal-trailer-btn');
    const modalWatchBtn       = id('modal-watch-btn');
    const modalWatchlistBtn   = id('modal-watchlist-btn');
    const modalCastSection    = id('modal-cast-section');
    const modalCastGrid       = id('modal-cast-grid');
    const modalSimilarSection  = id('modal-similar-section');
    const modalSimilarGrid    = id('modal-similar-grid');

    // Dedicated Trailer Modal (Task 19)
    const trailerModal        = id('trailer-modal');
    const trailerOverlay      = id('trailer-overlay');
    const trailerCloseBtn     = id('trailer-modal-close');
    const trailerVideoWrapper  = id('trailer-video-wrapper');

    // ==========================================
    // 3. STATE MANAGEMENT
    // ==========================================
    const filterState = {
        query: '',
        genre: '',
        invalidGenre: false,
        year: '',
        rating: '',
        sort: 'popularity.desc',
        page: 1,
        totalPages: 1
    };

    const renderedMovieIds = new Set();
    let currentModalMovieData = null;
    let currentTrailerKey = null;
    let currentUserSession = null;
    let activeWatchlist = [];
    let isFetching = false;
    let activeCardTrigger = null;
    let currentRequestId = 0;
    let searchDebounceTimer = null;
    let currentAbortController = null;


    // ==========================================
    // 4. MOCK DATASET FOR OFFLINE / FALLBACK
    // ==========================================
    const MOCK_DISCOVERY_MOVIES = [
        { id: 101, title: 'The Dark Knight', poster_path: 'images/movie1.jpg', vote_average: 9.0, vote_count: 32000, release_date: '2008-07-18', runtime: 152, genre_ids: [28, 80, 18], overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.' },
        { id: 102, title: 'Inception', poster_path: 'images/movie2.jpg', vote_average: 8.8, vote_count: 35000, release_date: '2010-07-16', runtime: 148, genre_ids: [28, 878, 12], overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.' },
        { id: 103, title: 'Interstellar', poster_path: 'images/movie3.jpg', vote_average: 8.7, vote_count: 33000, release_date: '2014-11-07', runtime: 169, genre_ids: [12, 18, 878], overview: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft to find a new habitable planet.' },
        { id: 104, title: 'Oppenheimer', poster_path: 'images/movie4.jpg', vote_average: 8.9, vote_count: 22000, release_date: '2023-07-21', runtime: 180, genre_ids: [18, 36], overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
        { id: 105, title: 'Avatar', poster_path: 'images/movie5.jpg', vote_average: 7.6, vote_count: 28000, release_date: '2009-12-18', runtime: 162, genre_ids: [28, 12, 14, 878], overview: 'A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.' },
        { id: 106, title: 'The Batman', poster_path: 'images/movie6.jpg', vote_average: 7.7, vote_count: 19000, release_date: '2022-03-04', runtime: 176, genre_ids: [80, 9648, 28], overview: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city\'s hidden corruption.' },
        { id: 107, title: 'Dune: Part Two', poster_path: 'images/movie1.jpg', vote_average: 8.6, vote_count: 18000, release_date: '2024-03-01', runtime: 166, genre_ids: [878, 12], overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.' },
        { id: 108, title: 'The Matrix', poster_path: 'images/movie2.jpg', vote_average: 8.7, vote_count: 25000, release_date: '1999-03-31', runtime: 136, genre_ids: [28, 878], overview: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth.' },
        { id: 201, title: 'Stranger Things', poster_path: 'images/movie7.jpg', vote_average: 8.7, vote_count: 29000, release_date: '2016-07-15', runtime: 50, genre_ids: [878, 27, 18], overview: 'When a young boy disappears, his friends and family uncover a mysterious supernatural world.' },
        { id: 202, title: 'Wednesday', poster_path: 'images/movie8.jpg', vote_average: 8.1, vote_count: 17000, release_date: '2022-11-23', runtime: 45, genre_ids: [35, 9648, 14], overview: 'Smart, sarcastic and a little dead inside, Wednesday Addams investigates a murder spree while making new friends at Nevermore Academy.' },
        { id: 203, title: 'Money Heist', poster_path: 'images/movie9.jpg', vote_average: 8.2, vote_count: 21000, release_date: '2017-05-02', runtime: 70, genre_ids: [28, 80, 18], overview: 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history.' },
        { id: 204, title: 'Squid Game', poster_path: 'images/movie10.jpg', vote_average: 8.0, vote_count: 23000, release_date: '2021-09-17', runtime: 55, genre_ids: [18, 53, 28], overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games with deadly high stakes.' },
        { id: 205, title: 'Dark', poster_path: 'images/movie11.jpg', vote_average: 8.7, vote_count: 16000, release_date: '2017-12-01', runtime: 60, genre_ids: [80, 9648, 878], overview: 'A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes secrets.' },
        { id: 206, title: 'Breaking Bad', poster_path: 'images/movie12.jpg', vote_average: 9.5, vote_count: 38000, release_date: '2008-01-20', runtime: 49, genre_ids: [18, 80, 53], overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.' },
        { id: 301, title: 'John Wick', poster_path: 'images/movie13.jpg', vote_average: 7.4, vote_count: 18000, release_date: '2014-10-24', runtime: 101, genre_ids: [28, 53, 80], overview: 'An ex-hit-man comes out of retirement to track down the gangsters that took everything from him.' },
        { id: 302, title: 'Mission Impossible', poster_path: 'images/movie14.jpg', vote_average: 7.8, vote_count: 15000, release_date: '1996-05-22', runtime: 110, genre_ids: [28, 12, 53], overview: 'An American agent, under false suspicion of disloyalty, must discover and expose the real spy without the help of his organization.' },
        { id: 303, title: 'Mad Max: Fury Road', poster_path: 'images/movie15.jpg', vote_average: 8.1, vote_count: 22000, release_date: '2015-05-15', runtime: 120, genre_ids: [28, 12, 878], overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of Max.' },
        { id: 304, title: 'Gladiator', poster_path: 'images/movie16.jpg', vote_average: 8.5, vote_count: 24000, release_date: '2000-05-05', runtime: 155, genre_ids: [28, 18, 12], overview: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.' },
        { id: 305, title: 'Top Gun: Maverick', poster_path: 'images/movie17.jpg', vote_average: 8.3, vote_count: 19000, release_date: '2022-05-27', runtime: 130, genre_ids: [28, 18], overview: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, leading TOP GUN graduates on a dangerous mission.' },
        { id: 306, title: 'Extraction', poster_path: 'images/movie18.jpg', vote_average: 6.8, vote_count: 14000, release_date: '2020-04-24', runtime: 116, genre_ids: [28, 53], overview: 'Tyler Rake, a fearless black-market mercenary, embarks on the most deadly extraction of his career.' }
    ];


    // ==========================================
    // 5. INITIALIZE FILTER OPTIONS & GENRE PILLS
    // ==========================================
    function initFilterOptions() {
        if (genreSelect) {
            genreSelect.innerHTML = '<option value="">All Genres</option>';
            Object.entries(TMDB_GENRE_MAP).forEach(([gid, name]) => {
                const opt = document.createElement('option');
                opt.value = gid;
                opt.textContent = name;
                genreSelect.appendChild(opt);
            });
        }

        if (genrePillsContainer) {
            genrePillsContainer.innerHTML = '';
            
            // All Genres Pill
            const allBtn = document.createElement('button');
            allBtn.type = 'button';
            allBtn.className = 'genre-pill' + (!filterState.genre ? ' active' : '');
            allBtn.textContent = 'All Genres';
            allBtn.setAttribute('role', 'tab');
            allBtn.setAttribute('aria-selected', !filterState.genre ? 'true' : 'false');
            allBtn.addEventListener('click', () => selectGenre(''));
            genrePillsContainer.appendChild(allBtn);

            // Individual Genre Pills
            Object.entries(TMDB_GENRE_MAP).forEach(([gid, name]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'genre-pill' + (String(filterState.genre) === String(gid) ? ' active' : '');
                btn.textContent = name;
                btn.setAttribute('role', 'tab');
                btn.setAttribute('data-genre-id', gid);
                btn.setAttribute('aria-selected', String(filterState.genre) === String(gid) ? 'true' : 'false');
                btn.addEventListener('click', () => selectGenre(gid));
                genrePillsContainer.appendChild(btn);
            });
        }

        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let yr = currentYear; yr >= 1970; yr--) {
                const opt = document.createElement('option');
                opt.value = String(yr);
                opt.textContent = String(yr);
                yearSelect.appendChild(opt);
            }
        }
    }

    function selectGenre(genreId) {
        filterState.genre = genreId;
        filterState.invalidGenre = false;
        filterState.page = 1;
        if (genreSelect) genreSelect.value = genreId;
        syncUrlState(true);
        updateGenreUI();
        renderActiveFilters();
        fetchBrowseMovies(1, false);
    }

    function updateGenreUI() {
        if (genrePillsContainer) {
            const pills = genrePillsContainer.querySelectorAll('.genre-pill');
            pills.forEach((p) => {
                const gid = p.getAttribute('data-genre-id') || '';
                const isActive = (String(gid) === String(filterState.genre || ''));
                p.classList.toggle('active', isActive);
                p.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }

        if (browsePageTitle) {
            if (filterState.genre && TMDB_GENRE_MAP[filterState.genre]) {
                browsePageTitle.textContent = `${TMDB_GENRE_MAP[filterState.genre]} Movies`;
            } else {
                browsePageTitle.textContent = 'Browse Movies';
            }
        }
    }


    // ==========================================
    // 6. URL STATE SYNCHRONIZATION
    // ==========================================
    function parseUrlParams() {
        const params = new URLSearchParams(window.location.search);

        filterState.query  = (params.get('q') || '').trim();
        const rawGenre     = params.get('genre') || '';

        if (rawGenre) {
            if (TMDB_GENRE_MAP[rawGenre]) {
                filterState.genre = rawGenre;
                filterState.invalidGenre = false;
            } else {
                filterState.genre = rawGenre;
                filterState.invalidGenre = true;
            }
        } else {
            filterState.genre = '';
            filterState.invalidGenre = false;
        }

        filterState.year   = params.get('year') || '';
        filterState.rating = params.get('rating') || '';
        filterState.sort   = params.get('sort') || 'popularity.desc';
        filterState.page   = parseInt(params.get('page'), 10) || 1;

        if (browseSearchInput) {
            browseSearchInput.value = filterState.query;
            if (browseSearchClear) browseSearchClear.style.display = filterState.query ? 'block' : 'none';
        }
        if (genreSelect)  genreSelect.value  = filterState.invalidGenre ? '' : filterState.genre;
        if (yearSelect)   yearSelect.value   = filterState.year;
        if (ratingSelect) ratingSelect.value = filterState.rating;
        if (sortSelect)   sortSelect.value   = filterState.sort;

        updateGenreUI();
    }

    function syncUrlState(pushHistory = true) {
        const params = new URLSearchParams();

        if (filterState.query)  params.set('q', filterState.query);
        if (filterState.genre)  params.set('genre', filterState.genre);
        if (filterState.year)   params.set('year', filterState.year);
        if (filterState.rating) params.set('rating', filterState.rating);
        if (filterState.sort && filterState.sort !== 'popularity.desc') {
            params.set('sort', filterState.sort);
        }
        if (filterState.page > 1) {
            params.set('page', String(filterState.page));
        }

        const queryStr = params.toString();
        const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;

        if (pushHistory) {
            window.history.pushState({ ...filterState }, '', newUrl);
        } else {
            window.history.replaceState({ ...filterState }, '', newUrl);
        }
    }


    // ==========================================
    // 7. ACTIVE FILTER CHIPS
    // ==========================================
    function renderActiveFilters() {
        if (!activeFiltersCont || !activeFiltersRow) return;

        activeFiltersRow.textContent = '';
        const chips = [];

        if (filterState.query) {
            chips.push({ type: 'query', label: `Search: "${filterState.query}"` });
        }
        if (filterState.genre && TMDB_GENRE_MAP[filterState.genre]) {
            chips.push({ type: 'genre', label: `Genre: ${TMDB_GENRE_MAP[filterState.genre]}` });
        }
        if (filterState.year) {
            chips.push({ type: 'year', label: `Year: ${filterState.year}` });
        }
        if (filterState.rating) {
            chips.push({ type: 'rating', label: `Rating: ${filterState.rating}+` });
        }
        if (filterState.sort && filterState.sort !== 'popularity.desc') {
            chips.push({ type: 'sort', label: `Sort: ${SORT_LABELS[filterState.sort] || filterState.sort}` });
        }

        if (chips.length === 0) {
            activeFiltersCont.style.display = 'none';
            return;
        }

        activeFiltersCont.style.display = 'flex';

        chips.forEach((chip) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-chip';
            btn.setAttribute('aria-label', `Remove filter ${chip.label}`);
            btn.innerHTML = `<span class="chip-text">${chip.label}</span><span class="chip-remove" aria-hidden="true">✕</span>`;

            btn.addEventListener('click', () => {
                if (chip.type === 'query')  { 
                    filterState.query = ''; 
                    if (browseSearchInput) browseSearchInput.value = '';
                    if (browseSearchClear) browseSearchClear.style.display = 'none';
                }
                if (chip.type === 'genre')  { filterState.genre = '';  if (genreSelect) genreSelect.value = ''; }
                if (chip.type === 'year')   { filterState.year = '';   if (yearSelect) yearSelect.value = ''; }
                if (chip.type === 'rating') { filterState.rating = ''; if (ratingSelect) ratingSelect.value = ''; }
                if (chip.type === 'sort')   { filterState.sort = 'popularity.desc'; if (sortSelect) sortSelect.value = 'popularity.desc'; }

                filterState.page = 1;
                syncUrlState(true);
                renderActiveFilters();
                fetchBrowseMovies(1, false);
            });

            activeFiltersRow.appendChild(btn);
        });
    }


    // ==========================================
    // 8. TMDB URL BUILDERS & FORMATTERS
    // ==========================================
    function buildApiUrl(page = 1) {
        const baseUrl = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
        const apiKey  = (typeof TMDB_API_KEY  !== 'undefined') ? TMDB_API_KEY  : '';

        if (filterState.query) {
            const params = new URLSearchParams({
                api_key: apiKey,
                query: filterState.query,
                page: String(page),
                include_adult: 'false'
            });
            if (filterState.year) params.set('primary_release_year', filterState.year);
            return `${baseUrl}/search/movie?${params.toString()}`;
        }

        const params = new URLSearchParams({
            api_key: apiKey,
            sort_by: filterState.sort || 'popularity.desc',
            page: String(page),
            include_adult: 'false'
        });

        if (filterState.genre)  params.set('with_genres', filterState.genre);
        if (filterState.year)   params.set('primary_release_year', filterState.year);
        if (filterState.rating) params.set('vote_average.gte', filterState.rating);

        return `${baseUrl}/discover/movie?${params.toString()}`;
    }

    function isApiKeyConfigured() {
        return (
            typeof TMDB_API_KEY !== 'undefined' &&
            TMDB_API_KEY &&
            TMDB_API_KEY !== 'YOUR_TMDB_API_KEY'
        );
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
        const official = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true && v.key);
        if (official) return official.key;
        const anyTrailer = videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key);
        if (anyTrailer) return anyTrailer.key;
        const anyVideo = videos.find((v) => v.site === 'YouTube' && v.key);
        return anyVideo ? anyVideo.key : null;
    }


    // ==========================================
    // 9. MOVIE CARD CREATION
    // ==========================================
    function createBrowseMovieCard(movie) {
        const titleText = (movie.title || movie.name || 'Untitled').trim();
        const movieId   = movie.id || movie.movieId || '';
        const vote      = movie.vote_average || movie.voteAverage;

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

        if (typeof vote === 'number' && vote > 0) {
            const metaRow = document.createElement('div');
            metaRow.className = 'card-meta-row';

            const matchSpan = document.createElement('span');
            matchSpan.className = 'card-match-badge';
            const matchScore = Math.min(99, Math.max(75, Math.round(vote * 10) + 5));
            matchSpan.textContent = `${matchScore}% Match`;

            const ratingSpan = document.createElement('span');
            ratingSpan.className = 'card-rating-badge';
            ratingSpan.textContent = `★ ${vote.toFixed(1)}`;

            metaRow.appendChild(matchSpan);
            metaRow.appendChild(ratingSpan);
            movieInfoDiv.appendChild(metaRow);
        }

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


    async function fetchBrowseMovies(page = 1, append = false) {
        if (filterState.invalidGenre) {
            isFetching = false;
            browseStatus.style.display = 'block';
            browseStatus.innerHTML = `
                <div class="browse-empty-state">
                    <div class="empty-icon" aria-hidden="true">🎬</div>
                    <h2 class="empty-title">Genre Not Found</h2>
                    <p class="empty-text">The requested movie genre was not found in our directory. Explore our available movie genres below.</p>
                    <button type="button" class="btn btn-auth-submit" id="invalid-genre-btn">Browse All Genres</button>
                </div>
            `;
            const btn = id('invalid-genre-btn');
            if (btn) btn.addEventListener('click', () => selectGenre(''));
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        if (isFetching) return;
        isFetching = true;

        if (currentAbortController) {
            currentAbortController.abort();
        }
        currentAbortController = new AbortController();

        if (!append) {
            renderedMovieIds.clear();
            moviesGrid.textContent = '';
            browseStatus.textContent = '';
            browseStatus.style.display = 'block';
            browseStatus.innerHTML = '<div class="section-loading">Loading movies...</div>';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        } else {
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.querySelector('.load-more-text').textContent = 'Loading more...';
            }
        }

        try {
            let movies = [];
            let totalPages = 1;

            if (isApiKeyConfigured()) {
                const endpoint = buildApiUrl(page);
                const res = await fetch(endpoint, { signal: currentAbortController.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                movies = (data && Array.isArray(data.results)) ? data.results : [];
                totalPages = (data && typeof data.total_pages === 'number') ? data.total_pages : 1;
            } else {
                await new Promise((r) => setTimeout(r, 200));
                let filtered = [...MOCK_DISCOVERY_MOVIES];

                if (filterState.query) {
                    const qLower = filterState.query.toLowerCase();
                    filtered = filtered.filter((m) => m.title.toLowerCase().includes(qLower));
                }

                if (filterState.genre) {
                    const gid = Number(filterState.genre);
                    filtered = filtered.filter((m) => m.genre_ids && m.genre_ids.includes(gid));
                }

                if (filterState.year) {
                    filtered = filtered.filter((m) => m.release_date && m.release_date.startsWith(filterState.year));
                }

                if (filterState.rating) {
                    const minVote = Number(filterState.rating);
                    filtered = filtered.filter((m) => m.vote_average >= minVote);
                }

                if (filterState.sort === 'vote_average.desc') {
                    filtered.sort((a, b) => b.vote_average - a.vote_average);
                } else if (filterState.sort === 'primary_release_date.desc') {
                    filtered.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
                } else if (filterState.sort === 'primary_release_date.asc') {
                    filtered.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
                }

                movies = filtered;
                totalPages = 1;
            }

            filterState.page = page;
            filterState.totalPages = totalPages;

            if (!append) browseStatus.style.display = 'none';

            if (movies.length === 0 && !append) {
                browseStatus.style.display = 'block';
                const queryText = filterState.query ? ` matching "${filterState.query}"` : '';
                browseStatus.innerHTML = `
                    <div class="browse-empty-state">
                        <div class="empty-icon" aria-hidden="true">🎬</div>
                        <h2 class="empty-title">No movies found</h2>
                        <p class="empty-text">No titles matched your active filter criteria${queryText}. Try adjusting your search query or selections.</p>
                        <button type="button" class="btn btn-auth-submit" id="empty-reset-btn">Reset All Filters</button>
                    </div>
                `;
                const emptyReset = id('empty-reset-btn');
                if (emptyReset) emptyReset.addEventListener('click', () => resetFilters());
                if (loadMoreContainer) loadMoreContainer.style.display = 'none';
                return;
            }

            movies.forEach((movie) => {
                const mid = Number(movie.id || movie.movieId);
                if (mid && !renderedMovieIds.has(mid)) {
                    renderedMovieIds.add(mid);
                    const card = createBrowseMovieCard(movie);
                    moviesGrid.appendChild(card);
                }
            });

            if (loadMoreContainer) {
                loadMoreContainer.style.display = (filterState.page < filterState.totalPages) ? 'flex' : 'none';
            }

        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Browse discovery error:', error.message);
            if (!append) {
                browseStatus.style.display = 'block';
                browseStatus.innerHTML = `
                    <div class="browse-error-state">
                        <p class="error-text">Unable to load movies. Please check your connection.</p>
                        <button type="button" class="btn-profile-logout" id="browse-retry-btn">Retry</button>
                    </div>
                `;
                const retryBtn = id('browse-retry-btn');
                if (retryBtn) retryBtn.addEventListener('click', () => fetchBrowseMovies(filterState.page, false));
            } else {
                showToast('Unable to load more movies.');
            }
        } finally {
            isFetching = false;
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.querySelector('.load-more-text').textContent = 'Load More Movies';
            }
        }
    }


    // ==========================================
    // 11. FILTER & SEARCH FORM EVENTS
    // ==========================================
    if (browseSearchInput) {
        browseSearchInput.addEventListener('input', () => {
            const val = browseSearchInput.value.trim();
            if (browseSearchClear) browseSearchClear.style.display = val ? 'block' : 'none';

            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                filterState.query = val;
                filterState.page = 1;
                syncUrlState(true);
                renderActiveFilters();
                fetchBrowseMovies(1, false);
            }, 300);
        });
    }

    if (browseSearchClear) {
        browseSearchClear.addEventListener('click', () => {
            if (browseSearchInput) browseSearchInput.value = '';
            browseSearchClear.style.display = 'none';
            filterState.query = '';
            filterState.page = 1;
            syncUrlState(true);
            renderActiveFilters();
            fetchBrowseMovies(1, false);
        });
    }
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            filterState.genre  = genreSelect ? genreSelect.value : '';
            filterState.year   = yearSelect ? yearSelect.value : '';
            filterState.rating = ratingSelect ? ratingSelect.value : '';
            filterState.sort   = sortSelect ? sortSelect.value : 'popularity.desc';
            filterState.page   = 1;

            syncUrlState(true);
            renderActiveFilters();
            fetchBrowseMovies(1, false);

            if (window.innerWidth <= 768 && filterPanel && filterPanel.classList.contains('is-open')) {
                filterPanel.classList.remove('is-open');
                if (filterToggleBtn) filterToggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function resetFilters() {
        filterState.genre  = '';
        filterState.year   = '';
        filterState.rating = '';
        filterState.sort   = 'popularity.desc';
        filterState.page   = 1;

        if (genreSelect)  genreSelect.value  = '';
        if (yearSelect)   yearSelect.value   = '';
        if (ratingSelect) ratingSelect.value = '';
        if (sortSelect)   sortSelect.value   = 'popularity.desc';

        syncUrlState(true);
        renderActiveFilters();
        fetchBrowseMovies(1, false);
    }

    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => fetchBrowseMovies(filterState.page + 1, true));

    if (filterToggleBtn && filterPanel) {
        filterToggleBtn.addEventListener('click', () => {
            const isOpen = filterPanel.classList.toggle('is-open');
            filterToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    window.addEventListener('popstate', () => {
        parseUrlParams();
        renderActiveFilters();
        fetchBrowseMovies(filterState.page || 1, false);
    });


    // ==========================================
    // 12. MOVIE DETAILS MODAL & TMDB INTEGRATION
    // ==========================================
    async function fetchMovieDetails(movieId) {
        if (isApiKeyConfigured()) {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const res  = await fetch(`${base}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }

        const match = MOCK_DISCOVERY_MOVIES.find((m) => m.id == movieId);
        if (match) return match;
        throw new Error('Movie not found');
    }

    async function fetchMovieVideos(movieId) {
        if (!isApiKeyConfigured()) return [];
        try {
            const base = (typeof TMDB_BASE_URL !== 'undefined') ? TMDB_BASE_URL : 'https://api.themoviedb.org/3';
            const res  = await fetch(`${base}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
            if (!res.ok) return [];
            const data = await res.json();
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
            const res  = await fetch(`${base}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
            if (!res.ok) return { cast: [], crew: [] };
            const data = await res.json();
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
            const res  = await fetch(`${base}/movie/${movieId}/similar?api_key=${TMDB_API_KEY}`);
            if (!res.ok) return [];
            const data = await res.json();
            return (data && Array.isArray(data.results)) ? data.results : [];
        } catch (e) {
            return [];
        }
    }

    async function openMovieDetails(movieId, fallbackObj = null) {
        if (!movieModal) return;

        const reqId = ++currentRequestId;
        movieModal.classList.add('is-open');
        movieModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (modalBackdropImg) modalBackdropImg.removeAttribute('src');
        if (modalPosterImg)   modalPosterImg.removeAttribute('src');

        if (modalHero)  modalHero.style.display  = 'none';
        if (modalBody)  modalBody.style.display  = 'none';
        if (modalState) {
            modalState.style.display = 'block';
            modalState.innerHTML     = '<div class="section-loading">Loading movie details...</div>';
        }

        try {
            const [detailsResult, videosResult, creditsResult, similarResult] = await Promise.allSettled([
                fetchMovieDetails(movieId),
                fetchMovieVideos(movieId),
                fetchMovieCredits(movieId),
                fetchSimilarMovies(movieId)
            ]);

            let details = detailsResult.status === 'fulfilled' ? detailsResult.value : fallbackObj;
            if (!details) throw new Error('Unable to load details.');

            if (reqId !== currentRequestId) return;
            currentModalMovieData = details;

            const videos   = videosResult.status === 'fulfilled' ? videosResult.value : [];
            const credits  = creditsResult.status === 'fulfilled' ? creditsResult.value : { cast: [], crew: [] };
            const cast     = credits.cast || [];
            const crew     = credits.crew || [];
            const similar  = similarResult.status === 'fulfilled' ? similarResult.value : [];

            currentTrailerKey = extractYouTubeTrailer(videos);

            populateModalData(details, cast, similar, crew);
            updateWatchlistButton(details.id || details.movieId);

            if (modalTrailerBtn) {
                if (currentTrailerKey) {
                    modalTrailerBtn.disabled = false;
                    modalTrailerBtn.style.display = 'inline-flex';
                } else {
                    modalTrailerBtn.disabled = true;
                    modalTrailerBtn.style.display = 'inline-flex';
                }
            }

            if (modalState) modalState.style.display = 'none';
            if (modalHero)  modalHero.style.display  = 'block';
            if (modalBody)  modalBody.style.display  = 'flex';

            if (modalCloseBtn) modalCloseBtn.focus();

        } catch (err) {
            if (reqId !== currentRequestId) return;
            currentModalMovieData = null;
            currentTrailerKey = null;
            if (modalHero)  modalHero.style.display  = 'none';
            if (modalBody)  modalBody.style.display  = 'none';
            if (modalState) {
                modalState.style.display = 'block';
                modalState.innerHTML     = '<div class="section-error">Unable to load details. Please try again.</div>';
            }
        }
    }

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
            const dateStr = data.release_date || data.first_air_date || data.releaseDate || '';
            modalDate.textContent = formatReleaseDate(dateStr);
        }

        if (modalRuntime) {
            modalRuntime.textContent = formatRuntime(data.runtime);
        }

        if (modalWatchBtn) {
            modalWatchBtn.innerHTML = '<span class="action-icon" aria-hidden="true">▶</span> <span>Watch Now</span>';
            modalWatchBtn.onclick = () => {
                window.location.href = `watch.html?id=${mid}`;
            };
        }

        if (modalGenres) {
            modalGenres.textContent = '';
            const genreItems = [];

            if (Array.isArray(data.genres) && data.genres.length > 0) {
                data.genres.forEach((g) => genreItems.push(g.name));
            } else if (Array.isArray(data.genre_ids) && data.genre_ids.length > 0) {
                data.genre_ids.forEach((gid) => {
                    if (TMDB_GENRE_MAP[gid]) genreItems.push(TMDB_GENRE_MAP[gid]);
                });
            }

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
                    const genreSpan = document.createElement('span');
                    genreSpan.textContent = name;
                    modalGenres.appendChild(genreSpan);
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

        if (modalSimilarSection && modalSimilarGrid) {
            modalSimilarGrid.textContent = '';
            const topSimilar = (Array.isArray(similarList) ? similarList : []).slice(0, 6);
            if (topSimilar.length > 0) {
                topSimilar.forEach((simMovie) => {
                    const card = createBrowseMovieCard(simMovie);
                    modalSimilarGrid.appendChild(card);
                });
                modalSimilarSection.style.display = 'block';
            } else {
                modalSimilarSection.style.display = 'none';
            }
        }
    }

    function closeMovieDetails() {
        if (!movieModal) return;
        movieModal.classList.remove('is-open');
        movieModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentModalMovieData = null;
        currentTrailerKey = null;
        if (activeCardTrigger) {
            activeCardTrigger.focus();
            activeCardTrigger = null;
        }
    }

    // Trailer Modal Controls
    function openTrailerModal(youtubeKey, movieTitle) {
        if (!trailerModal || !trailerVideoWrapper || !youtubeKey) {
            showToast('Trailer unavailable.');
            return;
        }

        trailerVideoWrapper.textContent = '';

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
        if (trailerVideoWrapper) trailerVideoWrapper.textContent = '';
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

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeMovieDetails);
    if (modalOverlay)  modalOverlay.addEventListener('click', closeMovieDetails);

    document.addEventListener('keydown', (e) => {
        if (trailerModal && trailerModal.classList.contains('is-open')) {
            if (e.key === 'Escape') {
                closeTrailerModal();
                return;
            }
        }
        if (!movieModal || !movieModal.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeMovieDetails();
    });


    // ==========================================
    // 13. WATCHLIST & WATCH HISTORY INTEGRATION
    // ==========================================
    function getBackendUrl() {
        return (typeof BACKEND_API_BASE_URL !== 'undefined')
            ? BACKEND_API_BASE_URL
            : 'http://localhost:5001/api';
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
    }

    async function loadWatchlist() {
        if (currentUserSession && typeof AuthService !== 'undefined') {
            try {
                const token = await AuthService.getIdToken();
                if (token) {
                    const profileId = getActiveProfileId();
                    const headers = { 'Authorization': `Bearer ${token}` };
                    if (profileId) headers['x-profile-id'] = String(profileId);

                    const res = await fetch(`${getBackendUrl()}/watchlist`, {
                        headers: headers
                    });
                    if (res.ok) {
                        const data = await res.json();
                        activeWatchlist = data.watchlist || [];
                        return;
                    }
                }
            } catch (err) {
                console.warn('Watchlist fetch error:', err.message);
            }
        }
        activeWatchlist = JSON.parse(localStorage.getItem('netflix_clone_watchlist') || '[]');
    }

    if (modalWatchBtn) {
        modalWatchBtn.addEventListener('click', () => {
            if (!currentModalMovieData) return;
            const movieId = Number(currentModalMovieData.id || currentModalMovieData.movieId) || 1;
            window.location.href = `watch.html?id=${movieId}`;
        });
    }

    if (modalWatchlistBtn) {
        modalWatchlistBtn.addEventListener('click', async () => {
            if (!currentModalMovieData) return;
            const movieId = Number(currentModalMovieData.id || currentModalMovieData.movieId);
            const title   = (currentModalMovieData.title || currentModalMovieData.name || 'Untitled').trim();
            const inList  = isMovieInWatchlist(movieId);

            try {
                const profileId = getActiveProfileId();
                if (inList) {
                    updateWatchlistButton(movieId, 'Removing...');
                    if (currentUserSession) {
                        const token = await AuthService.getIdToken();
                        const headers = { 'Authorization': `Bearer ${token}` };
                        if (profileId) headers['x-profile-id'] = String(profileId);

                        await fetch(`${getBackendUrl()}/watchlist/${movieId}`, {
                            method: 'DELETE',
                            headers: headers
                        });
                    }
                    activeWatchlist = activeWatchlist.filter((m) => Number(m.id || m.movieId) !== movieId);
                    showToast(`"${title}" removed from My List.`);
                } else {
                    updateWatchlistButton(movieId, 'Adding...');
                    const movieObj = {
                        movieId: movieId,
                        title: title,
                        posterPath: currentModalMovieData.poster_path || currentModalMovieData.posterPath || null,
                        backdropPath: currentModalMovieData.backdrop_path || currentModalMovieData.backdropPath || null,
                        voteAverage: currentModalMovieData.vote_average || currentModalMovieData.voteAverage || null,
                        releaseDate: currentModalMovieData.release_date || currentModalMovieData.releaseDate || null,
                        overview: currentModalMovieData.overview || null
                    };
                    if (currentUserSession) {
                        const token = await AuthService.getIdToken();
                        const headers = {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        };
                        if (profileId) headers['x-profile-id'] = String(profileId);

                        await fetch(`${getBackendUrl()}/watchlist`, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify(movieObj)
                        });
                    }
                    activeWatchlist.push(movieObj);
                    showToast(`"${title}" added to My List.`);
                }
            } catch (err) {
                showToast('Unable to update list.');
            } finally {
                updateWatchlistButton(movieId);
            }
        });
    }


    // ==========================================
    // 14. AUTH & NAVBAR INTEGRATION
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

            bellBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('is-open');
                bellBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

                if (isOpen && typeof AuthService !== 'undefined') {
                    const listEl = dropdown.querySelector('#dropdown-notification-list');
                    if (listEl) {
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

    if (typeof AuthService !== 'undefined') {
        AuthService.onAuthStateChange(async (user) => {
            currentUserSession = user;
            updateNavbarAuth(user);
            await loadWatchlist();
        });
    }

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            const isNavOpen = navbar.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', isNavOpen ? 'true' : 'false');
            menuToggle.textContent = isNavOpen ? '✕' : '☰';
        });
    }


    // ==========================================
    // 15. TOAST UTILITY
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
    // 16. INITIALIZATION
    // ==========================================
    window.addEventListener('scroll', () => {
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        }
    }, { passive: true });

    window.addEventListener('popstate', () => {
        parseUrlParams();
        renderActiveFilters();
        fetchBrowseMovies(filterState.page || 1, false);
    });

    initFilterOptions();
    parseUrlParams();
    renderActiveFilters();
    fetchBrowseMovies(filterState.page || 1, false);

});
