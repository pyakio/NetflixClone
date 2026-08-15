# 🎬 Netflix Clone — Full-Stack Streaming Platform & Movie Discovery Engine

[![GitHub Repository](https://img.shields.io/badge/GitHub-pyakio%2FNetflixClone-E50914?logo=github&style=flat-square)](https://github.com/pyakio/NetflixClone)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&style=flat-square)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.18.2-000000?logo=express&style=flat-square)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?logo=mongodb&style=flat-square)](https://www.mongodb.com/)
[![Firebase Auth](https://img.shields.io/badge/Firebase-Auth%20v10-FFCA28?logo=firebase&style=flat-square)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![QA Pass Rate](https://img.shields.io/badge/QA%20Tests-100%25%20Passing-success.svg?style=flat-square)](RELEASE.md)

An enterprise-grade, full-stack video streaming and movie discovery web application inspired by **Netflix**. Engineered with a high-performance **Vanilla JavaScript & CSS3** frontend design system, an authenticated **Node.js / Express REST API**, **MongoDB Atlas** persistence, **Firebase Authentication**, and live **TMDB (The Movie Database)** catalog feeds.

---

## 📑 Table of Contents
1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Key Features](#3-key-features)
4. [System Architecture](#4-system-architecture)
5. [Project Directory Structure](#5-project-directory-structure)
6. [API Reference Documentation](#6-api-reference-documentation)
7. [Quick Start & Local Setup](#7-quick-start--local-setup)
8. [Configuration & Environment Variables](#8-configuration--environment-variables)
9. [Automated Verification & Testing](#9-automated-verification--testing)
10. [Deployment Guide](#10-deployment-guide)
11. [Disclaimer & Attribution](#11-disclaimer--attribution)
12. [License](#12-license)

---

## 1. Overview

This project delivers an authentic, responsive streaming interface modeled directly after Netflix's design patterns and architectural solutions:

* **Cinematic Frontend Design System**: CSS3 custom properties (design tokens), glassmorphism with backdrop filters, custom dark scrollbar, 3D card hover-scaling (`1.14x`), and skeleton shimmer loading animations.
* **Compound Multi-Profile Isolation**: Strict profile scoping (`firebaseUid` + `profileId`) ensuring watchlists, viewing history, and recommendations remain completely isolated across personas on the same account.
* **Resilient Video Streaming Engine**: Fullscreen HTML5 streaming player with 10-second throttled progress synchronization, completion detection heuristics (`progress / duration >= 0.9`), and Continue Watching shelf auto-sync.
* **Administrator Analytics & Curation CMS**: Business intelligence dashboard providing real-time platform KPIs, completion analytics, headline hero curation, and immutable audit logging.
* **Hybrid Offline/Online Fallback**: Operates with live TMDB data or seamless offline mock dataset fallback when external APIs are unconfigured.

---

## 2. Technology Stack

| Layer | Technology | Key Capabilities & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Vanilla HTML5 & JavaScript (ES6+)** | Zero-dependency DOM lifecycle, sub-15ms rendering, optimal Core Web Vitals (LCP, CLS, FID). |
| **Styling & Theme** | **Vanilla CSS3** | Custom properties (design tokens), glassmorphism, responsive breakpoints, smooth cubic-bezier transitions. |
| **Typography** | **Google Fonts (Inter)** | Weights `300` through `900` for crisp legibility across high-DPI displays. |
| **Backend API** | **Node.js & Express.js** | RESTful routing, asynchronous controller handlers, centralized error handling middleware. |
| **Database** | **MongoDB (Mongoose ODM)** | Multi-collection schemas, compound indices (`{ firebaseUid: 1, movieId: 1, profileId: 1 }`), aggregation pipelines. |
| **Authentication** | **Firebase Auth & Firebase Admin SDK** | Client-side session management with cryptographically verified server-side Bearer JWT tokens. |
| **Data & Metadata** | **TMDB API (v3)** | Real-time trending, popular, categorized genres, backdrop imagery, and YouTube trailer keys. |
| **Security & Hardening** | **Helmet / Rate Limit / CORS** | Automated HTTP security headers, request rate limiting, whitelisted origin validation. |

---

## 3. Key Features

### 🎬 Public Streaming & Content Discovery
* **Cinematic Hero Banner**: Features headline trailers, maturity rating boxes (`16+`), match scores (`98% Match`), Ultra HD 4K tags, and direct Play/Info modal buttons.
* **3D Hover Movie Cards**: Smooth expansion scale with Netflix "N" ribbon badge, star rating, match percentage, and action triggers.
* **Skeleton Shimmer Loading**: Animated placeholder cards (`@keyframes netflixShimmer`) displaying while catalog feeds load.
* **Interactive Trailer Modal**: Dedicated YouTube video trailer player with automated GPU/iframe decoder destruction upon closing.
* **Genre Directory & Filter Hub (`browse.html`)**: Real-time debounced search (300ms), 9 vibrant genre gradient cards, release year filters, minimum rating filters, and multi-criteria sorting.

### 👤 User Experience & Viewing Profiles
* **Firebase Authentication (`login.html` & `register.html`)**: Email/Password authentication with "Remember Me", quick demo autofill button, and direct routing to profile selection.
* **Who's Watching? Multi-Profile Selector (`profiles.html`)**: Up to 5 custom personas per account with Kids filter mode and Netflix gradient avatar character tiles (`😊`, `😎`, `🍿`, `🐱`, `👑`, `🤖`).
* **My List 2.0 Content Library**: In-library search, status filters (`[ Not Started ]`, `[ In Progress ]`, `[ Completed ]`), and multi-sort.
* **Personal Viewing Insights (`activity.html`)**: Visual breakdown of total watch time, completed titles, in-progress items, and an activity timeline.

### 🛡️ Administration & Platform Analytics (`admin.html`)
* **Live KPI Dashboard**: Real-time aggregation of total registered users, active profiles, catalog items, completion rate percentages, and aggregate watch hours.
* **Content Management System**: Configure live featured headline hero titles, toggle category row visibility, and curate custom themed collections.
* **Audit Trail**: Immutable logging of administrative actions with timestamp, admin email, and mutation payload details.

---

## 4. System Architecture

```mermaid
graph TD
    User([Client Browser]) -->|HTML5 / CSS3 / Vanilla JS| UI[Netflix Frontend]
    UI -->|TMDB API Calls| TMDB[TMDB Public API]
    UI -->|Auth Credentials| FirebaseAuth[Firebase Auth Client]
    UI -->|Bearer JWT + x-profile-id| ExpressServer[Node.js / Express API Server]
    ExpressServer -->|Verify JWT| FirebaseAdmin[Firebase Admin SDK]
    ExpressServer -->|Mongoose Aggregations & CRUD| MongoDB[(MongoDB Atlas)]
    ExpressServer -->|Layout & Content Config| UI
```

---

## 5. Project Directory Structure

```text
NetflixClone/
├── index.html              # Main streaming homepage with Hero and Carousels
├── browse.html             # Advanced movie exploration & genre filter hub
├── watch.html              # HTML5 cinema video player & progress sync
├── activity.html           # Personal profile viewing insights & timeline
├── admin.html              # Admin dashboard, platform KPIs & content CMS
├── login.html              # Netflix authentication login view
├── register.html           # User account creation portal
├── profiles.html           # "Who's Watching?" profile selector & manager
├── profile.html            # Profile edit & settings view
├── settings.html           # Account security, email & password preferences
├── notifications.html      # In-app activity & notification center
├── css/
│   └── style.css           # Complete Netflix CSS design system (tokens, components)
├── js/
│   ├── config.js           # Frontend API endpoints & environment configuration
│   ├── firebase-config.js  # Client-side Firebase web configuration
│   ├── auth.js             # Client authentication service & token manager
│   ├── script.js           # Homepage carousel, modal & search controller
│   ├── browse.js           # Catalog search, filter pills & pagination controller
│   ├── watch.js            # Video player, scrubber & progress persistence controller
│   ├── profiles.js         # Profile management & active profile controller
│   ├── activity.js         # Viewing activity analytics & timeline controller
│   ├── admin.js            # Admin analytics & content curation controller
│   ├── settings.js         # Account settings & password change controller
│   └── notifications.js    # In-app notifications & activity controller
├── images/
│   ├── hero.jpg            # High-resolution headline hero backdrop image
│   └── movie1.jpg - 18.jpg # Fallback movie poster artwork
└── backend/
    ├── server.js           # Express app bootstrap, security middleware & routes
    ├── package.json        # Backend dependencies & run scripts
    ├── config/             # Database connection & Firebase Admin setup
    ├── controllers/        # REST API request handlers
    ├── middleware/         # Auth verification, RBAC, Rate Limiting & Validation
    ├── models/             # Mongoose schemas (User, Profile, WatchHistory, etc.)
    ├── routes/             # Express route declarations
    └── services/           # Analytics calculation & Recommendation engines
```

---

## 6. API Reference Documentation

All backend endpoints are mounted under the `/api` prefix (Default port: `5001`).

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Server health check and uptime probe |
| `GET` | `/api/watchlist` | Yes | Retrieve profile-scoped movie watchlist |
| `POST` | `/api/watchlist` | Yes | Add a title to watchlist (Payload: `movieId`, `title`, `posterPath`) |
| `DELETE`| `/api/watchlist/:id` | Yes | Remove a title from watchlist |
| `GET` | `/api/watch-history` | Yes | Fetch profile viewing progress and history records |
| `POST` | `/api/watch-history` | Yes | Record playback progress (Payload: `movieId`, `progress`, `duration`) |
| `DELETE`| `/api/watch-history/:id`| Yes | Remove item from Continue Watching row |
| `GET` | `/api/profiles` | Yes | List all viewing profiles associated with user account |
| `POST` | `/api/profiles` | Yes | Create a new viewing profile (Max 5 per account) |
| `PUT` | `/api/profiles/:id` | Yes | Update profile name, avatar, or kids mode |
| `DELETE`| `/api/profiles/:id` | Yes | Delete a viewing profile and cascade delete records |
| `GET` | `/api/recommendations` | Yes | Fetch profile-personalized movie recommendation rows |
| `GET` | `/api/admin/analytics` | Admin | Retrieve platform aggregate KPI statistics |
| `GET` | `/api/admin/content-config`| No | Fetch headline hero and collection curation config |
| `POST` | `/api/admin/content-config`| Admin | Update curated headline hero and row visibility |

---

## 7. Quick Start & Local Setup

### Prerequisites
* **Node.js**: `v18.x` or `v20.x LTS` installed
* **MongoDB**: Local MongoDB instance or free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas)
* **Firebase Project**: Free Firebase project with Authentication (Email/Password) enabled
* **TMDB API Key**: (Optional) Free API key from [The Movie Database](https://www.themoviedb.org/)

### Step-by-Step Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/pyakio/NetflixClone.git
   cd NetflixClone
   ```

2. **Configure Backend Environment**:
   ```bash
   cp .env.example backend/.env
   ```
   Open `backend/.env` and insert your MongoDB URI and Firebase Admin credentials.

3. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

4. **Start the Backend API Server**:
   ```bash
   npm run dev
   # Server starts on http://localhost:5001
   ```

5. **Launch the Frontend Application**:
   Open `index.html` in your browser, or start a local static server:
   ```bash
   # From root directory:
   npx serve .
   # or use VS Code Live Server extension on index.html
   ```

---

## 8. Configuration & Environment Variables

### Backend (`backend/.env`)

```ini
PORT=5001
NODE_ENV=development

# MongoDB Connection URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/netflix_clone?retryWrites=true&w=majority

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security & CORS
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000
ADMIN_EMAILS=admin@netflix.com,your-email@example.com
```

### Frontend (`js/config.js` & `js/firebase-config.js`)

```javascript
// js/config.js
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // (Optional - uses rich fallback dataset if empty)

// js/firebase-config.js
const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

---

## 9. Automated Verification & Testing

Verify that all client JavaScript files, backend models, and API configurations are valid:

```bash
# Validate client-side JS syntax
node -e "
const fs = require('fs');
fs.readdirSync('js').filter(f => f.endsWith('.js')).forEach(f => {
    new Function(fs.readFileSync('js/' + f, 'utf8'));
    console.log('✓ js/' + f + ' syntax valid');
});
"

# Run backend unit checks
cd backend && npm test
```

---

## 10. Deployment Guide

### Frontend Deployment (Vercel / Netlify / GitHub Pages)
* Deploy the root folder as a static site.
* Set the environment variable `NETFLIX_API_URL` to your live backend endpoint URL (e.g. `https://netflix-api.onrender.com/api`).

### Backend Deployment (Render / Railway / Heroku)
* **Root Directory**: `backend`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Environment Variables**: Add `MONGO_URI`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `ALLOWED_ORIGINS`.

---

## 11. Disclaimer & Attribution

* **Educational Disclaimer**: This web application is an independent educational portfolio demonstration inspired by Netflix and is not affiliated with, endorsed by, or sponsored by Netflix, Inc.
* **Content Attribution**: Movie and television metadata, imagery, and video key references are provided by [The Movie Database (TMDB)](https://www.themoviedb.org/).
* **Video Demonstrations**: Sample streaming video feeds are open-source media provided under Creative Commons licensing.

---

## 12. License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms and details.
