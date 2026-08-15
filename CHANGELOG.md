# Changelog — Netflix Clone

All notable changes and architectural milestones for this project are documented in this file following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [1.0.0] - 2026-08-15
### Milestone Release: Production Ready & Netflix Visual Redesign
- **Frontend Overhaul**: Re-architected design system in `css/style.css` with Netflix Red (`#e50914`), glassmorphism, Google Fonts `Inter`, custom dark scrollbars, 3D card scale-up hovers (`1.14x`), and skeleton shimmer loading animations.
- **Content Discovery**: Dynamic genre cards grid with 9 bespoke vibrant gradients, debounced full-text search, and multi-criteria filters on `browse.html`.
- **Viewing Persona System**: Complete "Who's Watching?" multi-profile architecture with custom Netflix avatar character tiles (`😊`, `😎`, `🍿`, `🐱`, `👑`, `🤖`), active profile badge, and Kids filter mode.
- **Playback & Watch History**: Fullscreen HTML5 streaming player with 10-second throttled progress persistence, completion detection heuristics, and Continue Watching synchronization.
- **My List 2.0 Content Library**: In-library search, status filters (`[ Not Started ]`, `[ In Progress ]`, `[ Completed ]`), and multi-sort.
- **Platform Analytics & CMS**: Business intelligence dashboard providing real-time platform KPIs, completion rates, headline hero curation, and immutable audit logging.
- **Verification & QA**: 100% test pass rate across static assets, backend controllers, security middlewares, and concurrent load tests.
- **Documentation**: Comprehensive project documentation, tech stack breakdown, architecture diagrams, API reference, and deployment runbooks.

---

## [0.8.0] - 2026-08-14
### Streaming Experience & Personalization
- **Search & Filter Engine**: Debounced catalog search with real-time suggestions and deep-linkable genre pills.
- **Personalized Recommendations**: Profile-scoped recommendation service utilizing weighted genre affinities, recency decay heuristics, and diversity blending.
- **Streaming Engine**: Custom HTML5 media player controls with timeline scrubber, volume slider, and fullscreen API.

---

## [0.5.0] - 2026-08-13
### Backend REST API & Compound Profile Scoping
- **REST Architecture**: Express.js REST API with Helmet security headers, rate limiting, and centralized error handling.
- **Database & Persistence**: MongoDB Atlas integration via Mongoose schemas with compound indices (`{ firebaseUid: 1, movieId: 1, profileId: 1 }`).
- **Security & Authorization**: Server-side JWT cryptographic verification with Firebase Admin SDK and role-based access control (RBAC).

---

## [0.1.0] - 2026-08-12
### Initial Prototype & UI Foundation
- **Core UI**: Netflix cinematic layout with responsive navbar, hero banner, movie carousels, and movie details modal.
- **Catalog Data**: TMDB API v3 integration with trailer playback modals and offline fallback dataset.
- **Authentication**: Client-side Firebase Authentication (Email/Password).
