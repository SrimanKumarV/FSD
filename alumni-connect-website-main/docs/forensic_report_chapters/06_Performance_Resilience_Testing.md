# CHAPTER 12 — PERFORMANCE AND OPTIMIZATION

## 12.1 Client-Side Optimizations
* **Lazy Loading & Suspense**: React components inside \`App.js\` are heavily lazy-loaded (e.g., \`const Home = lazy(() => import('./pages/Home'))\`). This drastically reduces the initial JavaScript bundle size, splitting the code into manageable chunks.
* **React Query Caching**: Configured with a 2-hour \`staleTime\` in the main \`QueryClient\`. This memoizes server data and prevents redundant API calls when the user navigates between tabs.
* **Debouncing Search Inputs**: Implemented on the \`Users\` and \`Jobs\` pages using custom \`useDebounce\` hooks to prevent overwhelming the API on every keystroke.

## 12.2 Server-Side Optimizations
* **Concurrent Scraping**: Developer statistics from 6 different platforms (GitHub, LeetCode, HackerRank, Codeforces, CodeChef, Duolingo) are fetched simultaneously using \`Promise.allSettled()\` inside \`backend/utils/devStatsFetcher.js\`, drastically reducing latency compared to sequential fetching.
* **GZIP Compression**: \`compression()\` middleware in \`server.js\` compresses all JSON payloads.
* **Database Indexes**: Compound and text indexes are defined in Mongoose models to speed up queries (e.g., \`UserSchema.index({ name: 'text', skills: 'text' })\`).

---

# CHAPTER 13 — CI/CD AND DEPLOYMENT

## 13.1 GitHub Actions Workflows
The \`.github/workflows/\` directory dictates the deployment automation:
1. **\`test.yml\`**: Executes the Jest test suite on pushes to main branches. If tests fail, deployment is blocked.
2. **\`build-apk.yml\`**: Automatically builds the Capacitor Android APK via Node and Gradle, and attaches it as a GitHub Release artifact upon tagging.
3. **\`production-monitor.yml\`**: Automates periodic health checks or ping monitoring to ensure the system is up.

## 13.2 Deployment Architecture
* **Keep-Alive Strategy**: To combat Render's free-tier cold starts, \`server.js\` implements a self-ping \`setInterval\` every 14 minutes utilizing \`process.env.RENDER_EXTERNAL_URL\`.

---

# CHAPTER 14 — MOBILE APPLICATION FORENSICS

The project includes an Android application built using **Capacitor** (\`mobile-wrapper/\` directory).
* **Architecture**: It is a web-wrapper architecture. It bundles the React web build (\`frontend/build\`) into a native Android WebView via Capacitor's \`sync\` mechanism.
* **Authentication Fallbacks**: Because Android WebViews actively block cross-origin \`HttpOnly\` cookies (disabling standard CSRF protection), the system relies on \`localStorage\` to hold the JWT. 
* **Header Injection**: The API client (\`frontend/src/utils/api.js\`) detects the Capacitor environment via \`Capacitor.isNativePlatform()\` and injects the \`Authorization: Bearer\` and \`X-Mobile-App: capacitor\` headers to bypass strict cookie enforcement safely.

---

# CHAPTER 15 — FAILURE HANDLING AND RESILIENCE

This system demonstrates immense engineering maturity through extensive fallback paths identified during the forensic audit.

| Subsystem | Primary Path | Failure Detection | Secondary/Fallback Path | Status |
|-----------|--------------|-------------------|-------------------------|--------|
| **API Client** | \`REACT_APP_API_URL\` | Axios interceptor catches 500/timeout | Shifts \`baseURL\` to \`REACT_APP_BACKUP_API_URL\` | VERIFIED |
| **AI Orchestrator** | Groq API | \`catch(error)\` | Gemini API | VERIFIED |
| **AI Mock Mode** | LLM API | \`!process.env.GROQ_API_KEY\` | Returns hardcoded JSON/text | VERIFIED |
| **Auth Expiry** | Valid JWT Token | \`401 Unauthorized\` | Silently calls \`/refresh\`, replays original requests | VERIFIED |
| **GitHub Stats** | GraphQL API | \`graphqlRes.value.data.errors\` | Drops back to GitHub v3 REST API | VERIFIED |
| **Socket Connection** | Primary Socket Server | Client detects disconnection / \`backend-failover\` event | Connects to backup Socket server URL | VERIFIED |
