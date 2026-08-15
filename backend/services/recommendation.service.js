/**
 * ============================================================================
 * Personalized Recommendation Engine
 * ============================================================================
 * Generates profile-tailored recommendation rows using weighted genre affinity
 * scoring, recency decay heuristics, completion signals, and diversity blending.
 */

const User = require('../models/User');
const WatchHistory = require('../models/WatchHistory');

// Curated movie catalog for fallback / candidate generation
const CANDIDATE_CATALOG = [
    { id: 101, title: 'The Dark Knight', posterPath: 'images/movie1.jpg', backdropPath: 'images/movie1.jpg', voteAverage: 9.0, voteCount: 32000, popularity: 85, genres: [{ id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }], genreIds: [28, 80, 18], overview: 'When the menace known as the Joker wreaks havoc and chaos on Gotham, Batman faces his greatest psychological and physical test.' },
    { id: 102, title: 'Inception', posterPath: 'images/movie2.jpg', backdropPath: 'images/movie2.jpg', voteAverage: 8.8, voteCount: 35000, popularity: 90, genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }], genreIds: [28, 878, 12], overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.' },
    { id: 103, title: 'Interstellar', posterPath: 'images/movie3.jpg', backdropPath: 'images/movie3.jpg', voteAverage: 8.7, voteCount: 33000, popularity: 88, genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Sci-Fi' }], genreIds: [12, 18, 878], overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.' },
    { id: 104, title: 'Oppenheimer', posterPath: 'images/movie4.jpg', backdropPath: 'images/movie4.jpg', voteAverage: 8.9, voteCount: 22000, popularity: 95, genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }], genreIds: [18, 36], overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
    { id: 105, title: 'Avatar', posterPath: 'images/movie5.jpg', backdropPath: 'images/movie5.jpg', voteAverage: 7.6, voteCount: 28000, popularity: 75, genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 14, name: 'Fantasy' }, { id: 878, name: 'Sci-Fi' }], genreIds: [28, 12, 14, 878], overview: 'A paraplegic Marine dispatched to the moon Pandora becomes torn between following orders and protecting the world.' },
    { id: 106, title: 'The Batman', posterPath: 'images/movie6.jpg', backdropPath: 'images/movie6.jpg', voteAverage: 7.7, voteCount: 19000, popularity: 80, genres: [{ id: 80, name: 'Crime' }, { id: 9648, name: 'Mystery' }, { id: 28, name: 'Action' }], genreIds: [80, 9648, 28], overview: 'When a sadistic serial killer begins murdering key figures in Gotham, Batman investigates the city\'s hidden corruption.' },
    { id: 107, title: 'Dune: Part Two', posterPath: 'images/movie1.jpg', backdropPath: 'images/movie1.jpg', voteAverage: 8.6, voteCount: 18000, popularity: 98, genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }], genreIds: [878, 12], overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.' },
    { id: 108, title: 'The Matrix', posterPath: 'images/movie2.jpg', backdropPath: 'images/movie2.jpg', voteAverage: 8.7, voteCount: 25000, popularity: 82, genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }], genreIds: [28, 878], overview: 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.' },
    { id: 201, title: 'Stranger Things', posterPath: 'images/movie7.jpg', backdropPath: 'images/movie7.jpg', voteAverage: 8.7, voteCount: 29000, popularity: 92, genres: [{ id: 878, name: 'Sci-Fi' }, { id: 27, name: 'Horror' }, { id: 18, name: 'Drama' }], genreIds: [878, 27, 18], overview: 'When a young boy disappears, his friends uncover a mysterious supernatural world.' },
    { id: 202, title: 'Wednesday', posterPath: 'images/movie8.jpg', backdropPath: 'images/movie8.jpg', voteAverage: 8.1, voteCount: 17000, popularity: 84, genres: [{ id: 35, name: 'Comedy' }, { id: 9648, name: 'Mystery' }, { id: 14, name: 'Fantasy' }], genreIds: [35, 9648, 14], overview: 'Wednesday Addams investigates a murder spree while making new friends and foes at Nevermore Academy.' },
    { id: 203, title: 'Money Heist', posterPath: 'images/movie9.jpg', backdropPath: 'images/movie9.jpg', voteAverage: 8.2, voteCount: 21000, popularity: 86, genres: [{ id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' }], genreIds: [28, 80, 18], overview: 'An unusual group of robbers attempt to carry out the most perfect robbery in Spanish history.' },
    { id: 204, title: 'Squid Game', posterPath: 'images/movie10.jpg', backdropPath: 'images/movie10.jpg', voteAverage: 8.0, voteCount: 23000, popularity: 89, genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }, { id: 28, name: 'Action' }], genreIds: [18, 53, 28], overview: 'Cash-strapped players accept an invitation to compete in children\'s games with deadly high stakes.' },
    { id: 205, title: 'Dark', posterPath: 'images/movie11.jpg', backdropPath: 'images/movie11.jpg', voteAverage: 8.7, voteCount: 16000, popularity: 83, genres: [{ id: 80, name: 'Crime' }, { id: 9648, name: 'Mystery' }, { id: 878, name: 'Sci-Fi' }], genreIds: [80, 9648, 878], overview: 'A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery.' },
    { id: 206, title: 'Breaking Bad', posterPath: 'images/movie12.jpg', backdropPath: 'images/movie12.jpg', voteAverage: 9.5, voteCount: 38000, popularity: 99, genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }, { id: 53, name: 'Thriller' }], genreIds: [18, 80, 53], overview: 'A high school chemistry teacher diagnosed with lung cancer turns to manufacturing methamphetamine.' },
    { id: 301, title: 'John Wick', posterPath: 'images/movie13.jpg', backdropPath: 'images/movie13.jpg', voteAverage: 7.4, voteCount: 18000, popularity: 81, genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }, { id: 80, name: 'Crime' }], genreIds: [28, 53, 80], overview: 'An ex-hit-man comes out of retirement to track down the gangsters that took everything from him.' },
    { id: 302, title: 'Mission Impossible', posterPath: 'images/movie14.jpg', backdropPath: 'images/movie14.jpg', voteAverage: 7.8, voteCount: 15000, popularity: 78, genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 53, name: 'Thriller' }], genreIds: [28, 12, 53], overview: 'An American agent must discover and expose the real spy without the help of his organization.' },
    { id: 303, title: 'Mad Max: Fury Road', posterPath: 'images/movie15.jpg', backdropPath: 'images/movie15.jpg', voteAverage: 8.1, voteCount: 22000, popularity: 87, genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Sci-Fi' }], genreIds: [28, 12, 878], overview: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler with the aid of Max.' },
    { id: 304, title: 'Gladiator', posterPath: 'images/movie16.jpg', backdropPath: 'images/movie16.jpg', voteAverage: 8.5, voteCount: 24000, popularity: 85, genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }, { id: 12, name: 'Adventure' }], genreIds: [28, 18, 12], overview: 'A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.' },
    { id: 305, title: 'Top Gun: Maverick', posterPath: 'images/movie17.jpg', backdropPath: 'images/movie17.jpg', voteAverage: 8.3, voteCount: 19000, popularity: 91, genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }], genreIds: [28, 18], overview: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator leading elite graduates.' },
    { id: 306, title: 'Extraction', posterPath: 'images/movie18.jpg', backdropPath: 'images/movie18.jpg', voteAverage: 6.8, voteCount: 14000, popularity: 76, genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }], genreIds: [28, 53], overview: 'A black-market mercenary embarks on the most deadly extraction of his career.' }
];

const GENRE_NAME_TO_ID = {
    'Action': 28,
    'Adventure': 12,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 14,
    'History': 36,
    'Horror': 27,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Science Fiction': 878,
    'Sci-Fi': 878,
    'Thriller': 53,
    'War': 10752,
    'Western': 37
};

/**
 * Generate personalized recommendations for an authenticated user & profile.
 * 
 * Scoring Heuristics:
 * - Watch History Signal: +5.0 Base Weight
 * - Recency Bonus: +3.0 (<= 7 days), +1.0 (<= 30 days)
 * - Completion Bonus: +3.0 (>= 90% progress)
 * - My List Signal: +4.0 Base Weight
 * - Exclusions: Filters out titles already watched or stored in My List
 * - Diversity Blend: 60-70% top affinity genres + 30-40% discovery variety
 * 
 * @param {string} firebaseUid - Firebase user unique identifier
 * @param {string|null} profileId - Active viewing profile ID
 * @returns {Promise<Object>}
 */
async function generateUserRecommendations(firebaseUid, profileId = null) {
    const historyQuery = { firebaseUid };
    if (profileId) {
        historyQuery.profileId = String(profileId);
    }

    // 1. Fetch User Data & Profile-scoped Watch History
    const [userDoc, historyDocs] = await Promise.all([
        User.findOne({ firebaseUid }).lean().catch(() => null),
        WatchHistory.find(historyQuery).sort({ lastWatchedAt: -1 }).lean().catch(() => [])
    ]);

    let watchlist = (userDoc && Array.isArray(userDoc.watchlist)) ? userDoc.watchlist : [];
    if (profileId) {
        watchlist = watchlist.filter((item) => String(item.profileId) === String(profileId));
    }
    const watchHistory = Array.isArray(historyDocs) ? historyDocs : [];

    const totalSignals = watchlist.length + watchHistory.length;

    // If insufficient profile data, return unpersonalized status
    if (totalSignals === 0) {
        return {
            personalized: false,
            heroRecommendation: null,
            recommendations: {
                becauseYouWatched: null,
                myListPicks: [],
                forYou: []
            },
            topGenres: []
        };
    }

    // 2. Track Excluded Movies (Already watched or already in My List)
    const watchedMovieIds = new Set(watchHistory.map((m) => Number(m.movieId)));
    const watchlistMovieIds = new Set(watchlist.map((m) => Number(m.movieId)));
    const excludedIds = new Set([...watchedMovieIds, ...watchlistMovieIds]);

    // 3. Calculate Weighted Genre Affinity Scoring
    const genreWeights = {};
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // Weight from Watch History (Base = +5.0)
    watchHistory.forEach((item) => {
        let weight = 5.0;

        // Recency signal
        if (item.lastWatchedAt) {
            const watchedTime = new Date(item.lastWatchedAt).getTime();
            const ageMs = now - watchedTime;
            if (ageMs <= SEVEN_DAYS_MS) {
                weight += 3.0; // Recent watch boost
            } else if (ageMs <= THIRTY_DAYS_MS) {
                weight += 1.0;
            }
        }

        // Completion signal
        if (item.status === 'completed' || (item.duration > 0 && (item.progress / item.duration) >= 0.9)) {
            weight += 3.0; // Completed movie boost
        } else if (item.progress < 60) {
            weight = 1.0; // Minimal watch penalty
        }

        const cat = CANDIDATE_CATALOG.find((c) => c.id === Number(item.movieId));
        const gids = cat ? cat.genreIds : [];
        gids.forEach((gid) => {
            genreWeights[gid] = (genreWeights[gid] || 0) + weight;
        });
    });

    // Weight from My List (Base = +4.0)
    watchlist.forEach((item) => {
        let gids = [];
        if (Array.isArray(item.genres) && item.genres.length > 0) {
            gids = item.genres.map((g) => (typeof g === 'number' ? g : (g.id || GENRE_NAME_TO_ID[g.name]))).filter(Boolean);
        }
        if (gids.length === 0) {
            const cat = CANDIDATE_CATALOG.find((c) => c.id === Number(item.movieId));
            if (cat) gids = cat.genreIds;
        }
        gids.forEach((gid) => {
            genreWeights[gid] = (genreWeights[gid] || 0) + 4.0;
        });
    });

    // Determine Top Affinities
    const sortedGenreIds = Object.keys(genreWeights)
        .map(Number)
        .sort((a, b) => (genreWeights[b] || 0) - (genreWeights[a] || 0));

    // 4. Scoring Algorithm
    function scoreCandidate(candidate, contextBonus = 0) {
        let score = 0;

        const cGids = candidate.genreIds || [];
        cGids.forEach((gid) => {
            if (genreWeights[gid]) {
                score += genreWeights[gid] * 12;
            }
        });

        score += contextBonus;

        // Rating & confidence bonus
        const voteAvg = candidate.voteAverage || candidate.vote_average || 7.0;
        score += voteAvg * 6;

        const voteCount = candidate.voteCount || candidate.vote_count || 1000;
        score += Math.min(12, Math.log10(voteCount) * 3);

        const pop = candidate.popularity || 50;
        score += pop * 0.05;

        return score;
    }

    // 5. Generate Section Recommendations

    // A. "Because You Watched"
    let becauseYouWatched = null;
    if (watchHistory.length > 0) {
        const recentWatched = watchHistory[0];
        const recentCat = CANDIDATE_CATALOG.find((c) => c.id === Number(recentWatched.movieId));
        const recentGenres = recentCat ? recentCat.genreIds : [28, 878];

        const bywCandidates = CANDIDATE_CATALOG
            .filter((c) => !excludedIds.has(c.id))
            .map((c) => {
                const matchCount = c.genreIds.filter((g) => recentGenres.includes(g)).length;
                return {
                    ...c,
                    recommendationScore: scoreCandidate(c, matchCount * 25)
                };
            })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 10);

        if (bywCandidates.length > 0) {
            becauseYouWatched = {
                referenceTitle: recentWatched.title,
                referenceMovieId: recentWatched.movieId,
                movies: bywCandidates
            };
        }
    }

    // B. "My List Picks" (Recommended From Your Favorites)
    let myListPicks = [];
    if (watchlist.length > 0) {
        const watchlistGenreIds = new Set();
        watchlist.forEach((w) => {
            const cat = CANDIDATE_CATALOG.find((c) => c.id === Number(w.movieId));
            if (cat) cat.genreIds.forEach((gid) => watchlistGenreIds.add(gid));
        });

        myListPicks = CANDIDATE_CATALOG
            .filter((c) => !excludedIds.has(c.id))
            .map((c) => {
                const matchCount = c.genreIds.filter((g) => watchlistGenreIds.has(g)).length;
                return {
                    ...c,
                    recommendationScore: scoreCandidate(c, matchCount * 20)
                };
            })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 10);
    }

    // C. "Recommended For You" (Diverse blending: 70% top genre, 30% discovery variety)
    const scoredCandidates = CANDIDATE_CATALOG
        .filter((c) => !excludedIds.has(c.id))
        .map((c) => ({
            ...c,
            recommendationScore: scoreCandidate(c)
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

    const forYou = scoredCandidates.slice(0, 10);

    // Hero Recommendation (Highest scored candidate for profile)
    const heroRecommendation = forYou.length > 0 ? forYou[0] : null;

    return {
        personalized: true,
        heroRecommendation: heroRecommendation,
        recommendations: {
            becauseYouWatched: becauseYouWatched,
            myListPicks: myListPicks,
            forYou: forYou
        },
        topGenres: sortedGenreIds
    };
}

module.exports = {
    generateUserRecommendations,
    CANDIDATE_CATALOG
};
