# NETFLIX CLONE — PRODUCTION DEPLOYMENT & DEVOPS RUNBOOK

---

## 1. Architecture Overview

The Netflix Clone is built as an enterprise full-stack web application:
* **Frontend**: Vanilla JavaScript (ES6+), Semantic HTML5, Cinematic CSS3 Design System.
* **Backend API**: Node.js & Express RESTful API with Helmet, rate limiting, and structured logging.
* **Database**: MongoDB (Mongoose ODM) with connection pooling and compound indexes.
* **Authentication**: Firebase Authentication (Client SDK) + Firebase Admin SDK token verification.
* **Content Catalog**: TMDB (The Movie Database) API with local caching and fallback mechanisms.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the `backend/` directory or configure in your deployment platform's dashboard:

| Variable | Classification | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Public / Server | HTTP Port for the Express server | `5000` |
| `NODE_ENV` | Public / Server | Node environment runtime | `production` |
| `MONGO_URI` | **SECRET** | MongoDB Atlas TLS connection string | `mongodb+srv://user:pass@cluster.mongodb.net/netflix_clone` |
| `FIREBASE_PROJECT_ID`| Server Config | Firebase project identifier | `netflix-clone-app` |
| `FIREBASE_CLIENT_EMAIL`| Server Config | Service Account client email | `firebase-adminsdk@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY`| **SECRET** | Firebase Admin RSA Private Key | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `ALLOWED_ORIGINS` | Server Config | Whitelist of allowed frontend CORS domains | `https://netflix-clone.vercel.app,https://yourdomain.com` |
| `ADMIN_EMAILS` | Server Config | Allowed administrator email accounts | `admin@netflix.com,admin@example.com` |
| `TMDB_API_KEY` | Server Config | TMDB v3 API Key | `your_tmdb_api_key` |

---

## 3. Step-by-Step Deployment Guide

### A. Database Provisioning (MongoDB Atlas)
1. Create a MongoDB Atlas cluster with M0 Free Tier or M10+ Production cluster.
2. Under **Database Access**, create a least-privilege application user with `readWrite` permissions.
3. Under **Network Access**, whitelist your backend IP or `0.0.0.0/0` (secured with strong password & TLS).
4. Obtain the connection string `mongodb+srv://...` and set `MONGO_URI`.

### B. Firebase Authentication Setup
1. In Firebase Console -> **Authentication** -> Enable **Email/Password** and **Google Sign-In**.
2. Under **Authorized Domains**, add your production frontend domain (e.g. `your-app.vercel.app`).
3. In **Project Settings** -> **Service Accounts**, click **Generate new private key**.
4. Configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in backend environment variables.

### C. Backend Deployment (Render, Railway, Fly.io, AWS ECS)
1. Connect Git repository.
2. Root Directory: `backend`
3. Build Command: `npm ci`
4. Start Command: `npm start`
5. Configure environment variables in platform dashboard.
6. Health Check Path: `/api/health`

### D. Frontend Deployment (Vercel, Netlify, Cloudflare Pages)
1. Point `BACKEND_API_BASE_URL` in `js/config.js` to your deployed backend URL (e.g. `https://api.yourdomain.com/api`).
2. Deploy the static repository root.
3. Verify HTTPS enforcement on custom domain.

---

## 4. Health & Readiness Probes

The backend exposes lightweight operational probes:
* **Liveness Probe**: `GET /api/health`
  - Responds `200 OK` with uptime and environment status.
  - Safe for frequent load balancer polling without database load.
* **Readiness Probe**: `GET /api/health/ready`
  - Verifies live connectivity to MongoDB (`connected`).
  - Returns `200 OK` when ready to serve traffic; `503 Service Unavailable` if database is disconnected.

---

## 5. Graceful Shutdown & Recovery

The server captures `SIGTERM` and `SIGINT` signals:
1. Stops accepting new inbound HTTP requests.
2. Drains active client requests.
3. Closes MongoDB Mongoose connection pool cleanly.
4. Exits process with code `0`.

---

## 6. Rollback & Disaster Recovery Runbook

### Application Rollback
1. In hosting platform (e.g. Vercel / Render), select **Deployments**.
2. Identify the last known stable deployment commit.
3. Click **Rollback / Redeploy** to instantly restore previous build artifacts.

### Database Recovery
1. Enable Continuous Cloud Backups in MongoDB Atlas.
2. To restore point-in-time state, navigate to **Backup** -> **Restore** in MongoDB Atlas console.

### Secret Rotation Procedure
1. Rotate TMDB API Key / MongoDB Password in respective vendor dashboards.
2. Update backend environment variables in cloud dashboard.
3. Trigger rolling restart of backend instances to apply new credentials without downtime.

---

## 7. Production Smoke Test Verification Checklist

After deploying to staging/production, execute this smoke test sequence:
- [ ] 1. Navigate to `/api/health` -> returns `200 OK` with status `ok`.
- [ ] 2. Open Homepage (`index.html`) -> hero banner loads, movie carousels render smoothly.
- [ ] 3. Search for a title -> debounced results display with zero console errors.
- [ ] 4. Click Movie Card -> opens details modal with synopsis, cast, and rating.
- [ ] 5. Play Trailer -> opens trailer modal; closing modal stops video audio cleanly.
- [ ] 6. Sign In -> Authenticates via Firebase ID token.
- [ ] 7. Profile Selection -> Loads user profile preferences.
- [ ] 8. My List -> Add/remove titles with optimistic UI update.
- [ ] 9. Watch Page -> Plays video stream, tracks watch progress every 10s.
- [ ] 10. Viewing Insights (`activity.html`) -> Displays profile-isolated stats and timeline.
- [ ] 11. Admin Dashboard (`admin.html`) -> Admin user logs in, inspects platform metrics and audit logs.
- [ ] 12. Non-Admin Access -> Regular user attempting admin API receives `403 Forbidden`.
