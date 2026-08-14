# Netflix Clone — 5-10 Minute Interactive Demo Script

---

## 1. Demo Preparation
1. Ensure the backend server is running: `npm start` (in `backend/` or root).
2. Open `index.html` in your browser.
3. Open Developer Tools (Network & Console tabs) to demonstrate zero runtime errors and fast network responses.

---

## 2. Step-by-Step Demonstration Flow

### Step 1: Public Movie Catalog & Hero Experience (1 min)
* **Action**: Show the dynamic homepage hero banner, cinematic gradients, and horizontal movie carousels.
* **Narration**: *"The homepage features dynamic headline content powered by TMDB feeds with responsive carousels and smooth hover zoom animations."*

### Step 2: Content Intelligence & Trailers (1 min)
* **Action**: Click any movie card to open the Movie Details Modal. Show the director, top 8 cast credits, synopsis, and click **▶ Watch Trailer**.
* **Narration**: *"Opening a title displays rich content metadata. The trailer modal streams live YouTube trailers and automatically destroys video decoders upon closure to conserve memory."*

### Step 3: Real-Time Debounced Search & Genre Directory (1.5 min)
* **Action**: Type `Inception` or `Batman` in the search bar on `browse.html`. Switch category pills (e.g. Action, Sci-Fi).
* **Narration**: *"Search uses a 300ms debounce with request cancellation via AbortController to prevent outdated network responses from overwriting the UI."*

### Step 4: Authentication & Multi-Profile Switching (1.5 min)
* **Action**: Sign In using Email/Password. Navigate to `profiles.html`, switch between profiles, and show custom avatars.
* **Narration**: *"Authentication uses Firebase ID tokens verified on the Node.js backend. Each viewing profile maintains isolated watchlist and watch history state."*

### Step 5: My List 2.0 & Video Streaming Progress (2 min)
* **Action**: Add movies to My List. Open `watch.html` to start watching. Fast-forward past 90% to trigger completion. Return to the homepage to show Continue Watching updates.
* **Narration**: *"The streaming player syncs playback progress every 10 seconds. When reaching 90% progress, the title automatically marks as completed."*

### Step 6: Viewing Insights & Admin Business Intelligence (2 min)
* **Action**: Open `activity.html` to review profile viewing stats. Switch to an admin account and open `admin.html`. Show real-time KPI metrics, the curated collection builder, and append-only audit logs.
* **Narration**: *"The admin dashboard provides platform business intelligence—computing completion rates and unique view counts in MongoDB memory without exposing private user history."*
