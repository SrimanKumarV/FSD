# Alumnex Connect — Google Calendar Integration Architecture & Setup Guide

## 1. Overview & Architecture Summary

Alumnex Connect integrates seamlessly with Google Calendar using Google's OAuth 2.0 Authorization Code flow with offline access (`access_type=offline`). The integration allows students, alumni, and mentors to synchronize their personal/work schedules with Alumnex events, mentorship appointments, and AI-powered activity intelligence goals without compromising account authentication.

### Key Architectural Tenets:
1. **Separation of Authentication & Authorization**: The existing Google Sign-In (`/api/auth/google` and `/api/auth/mobile/google`) authenticates the user into Alumnex Connect. Google Calendar access is an **incremental, optional authorization** initiated strictly from `Settings -> Integrations -> Google Calendar` or the Calendar page.
2. **Authoritative Sync**: Google Calendar remains the authoritative source for Google events. MongoDB stores a cached, synchronized representation with delta tokens (`nextSyncToken`) and idempotency constraints.
3. **Least-Privilege Scopes**: Requests only `calendar.events` and `calendar.calendarlist.readonly`.
4. **Zero Frontend Secrets**: Google Client Secret, Refresh Tokens, and Encryption Keys are strictly kept on the backend. Sensitive tokens in MongoDB are encrypted at rest using AES-256-GCM.
5. **Real-time Push & Low-Resource Polling**: Uses Google Calendar Push Notifications (Webhooks) with a 12-hour cron fallback for watch channel renewal and maintenance sync.

```
+-----------------------------------------------------------------------------------------+
|                                ALUMNEX CONNECT ECOSYSTEM                                |
|                                                                                         |
|  +--------------------+   OAuth Code    +-----------------------+    Incremental OAuth  |
|  | React Frontend /   | <-------------> | Express API Backend   | <------------------>  |
|  | Capacitor Mobile   |                 | (/api/google-calendar)|                       |
|  +---------+----------+                 +-----------+-----------+                       |
|            |                                        |                                   |
|            | REST / Socket.IO                       | AES-256-GCM                       |
|            v                                        v                                   |
|  +--------------------+                 +-----------------------+                       |
|  | Activity Hub /     |                 | MongoDB               |                       |
|  | Today's Schedule   |                 | GoogleCalendarConn    |                       |
|  | Next Best Action   |                 | GoogleCalendarEvent   |                       |
|  +--------------------+                 +-----------------------+                       |
+-----------------------------------------------------+-----------------------------------+
                                                      |
                                     Sync / Webhooks  | Google Calendar API v3
                                                      v
                                        +---------------------------+
                                        | Google Cloud API Services |
                                        +---------------------------+
```

---

## 2. Google Cloud Console Configuration

Follow these exact steps to configure your Google Cloud project:

### Step 1: Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your existing organization/project or click **New Project** and name it `alumnex-connect-prod` (or `alumnex-connect-dev`).

### Step 2: Enable the Google Calendar API
1. In the navigation menu, go to **APIs & Services** > **Library**.
2. Search for **Google Calendar API**.
3. Select it and click **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless your organization is strictly Google Workspace Internal).
3. Fill in the App Information:
   - **App Name**: `Alumnex Connect`
   - **User Support Email**: Select an authorized administrator email.
   - **App Logo**: Upload the official Alumnex Connect logo (120x120px).
   - **Application Home Page**: `https://alumnex-connect.onrender.com`
   - **Application Privacy Policy link**: `https://alumnex-connect.onrender.com/privacy`
   - **Application Terms of Service link**: `https://alumnex-connect.onrender.com/terms`
   - **Authorized Domains**: Add `onrender.com` (and your custom domain if configured).
   - **Developer Contact Information**: Your system team's email.
4. Click **Save and Continue**.

### Step 4: Configure OAuth Scopes
Add the following least-privilege scopes under **Scopes for Google APIs**:
- `https://www.googleapis.com/auth/calendar.events`
  - *Purpose*: Read and write events on the user's primary/selected calendars (e.g., creating mentorship appointments, booking Google Meet rooms, syncing user schedule).
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
  - *Purpose*: Retrieve the list of calendars owned by or shared with the user so they can select which calendars to sync inside Alumnex.
- `https://www.googleapis.com/auth/userinfo.email`
  - *Purpose*: Identify the connected Google account email.

> **Scope Justification Note**: We do NOT request `https://www.googleapis.com/auth/calendar` (full control). This ensures Alumnex cannot delete users' secondary calendars, modify calendar access controls (ACLs), or alter global calendar metadata.

### Step 5: Test Users (While in Testing Mode)
If your OAuth consent screen publishing status is **Testing**:
1. Click **Test Users** > **Add Users**.
2. Enter the Google accounts of engineers, testers, and pilot users.
3. Users outside this list will receive a `403: access_denied` error until the app is submitted and approved by Google.

### Step 6: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Application Type: **Web application**.
4. Name: `Alumnex Connect Web & Mobile Client`.
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (Local Frontend)
   - `http://localhost:5000` (Local Backend)
   - `https://alumnex-connect.onrender.com` (Production URL)
6. **Authorized redirect URIs**:
   - `http://localhost:5000/api/google-calendar/callback` (Local Development)
   - `https://alumnex-connect.onrender.com/api/google-calendar/callback` (Production Environment)
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

---

## 3. Environment Variables Configuration

Set these environment variables in your backend environment (`backend/.env` locally or Render Environment Settings in production):

| Variable | Description | Example (Local) | Example (Production) |
| :--- | :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | `xxxx.apps.googleusercontent.com` | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-xxxxxxxx` | `GOCSPX-xxxxxxxx` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Full OAuth callback URL | `http://localhost:5000/api/google-calendar/callback` | `https://alumnex-connect.onrender.com/api/google-calendar/callback` |
| `GOOGLE_CALENDAR_WEBHOOK_URL` | Public HTTPS Webhook URL | *(Leave blank or use ngrok)* | `https://alumnex-connect.onrender.com/api/google-calendar/webhook` |
| `GOOGLE_CALENDAR_ENCRYPTION_KEY` | 32-byte (64 hex characters) key | `64_hex_chars...` | `64_hex_chars...` |
| `FRONTEND_URL` | Frontend client origin | `http://localhost:3000` | `https://alumnex-connect.onrender.com` |

### Generating a Secure 32-Byte Encryption Key:
You can generate a cryptographic 32-byte hex key using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*(If `GOOGLE_CALENDAR_ENCRYPTION_KEY` is omitted, the system falls back to a SHA-256 derived key from `JWT_SECRET`).*

---

## 4. Google Calendar Push Notifications (Webhooks)

Google Calendar allows push notifications via the `calendar.events.watch` API.

### Webhook Verification & Requirements
1. Google requires push webhook endpoints to use **HTTPS with a valid SSL certificate**.
2. In production (`https://alumnex-connect.onrender.com/api/google-calendar/webhook`), Google POSTs notification pings containing:
   - `X-Goog-Channel-ID`: The unique UUID channel identifier.
   - `X-Goog-Resource-ID`: The identifier for the watched resource.
   - `X-Goog-Resource-State`: `sync` (initial confirmation) or `exists` (change notification).
3. **Channel Renewal Lifecycle**:
   - Push channels expire after approximately 7 days.
   - Alumnex includes an automatic maintenance job (`backend/jobs/calendarWatchRenewalCron.js`) running every 12 hours.
   - Channels expiring within 24 hours are cleanly stopped (`channels.stop`) and recreated with a new channel ID and token.

---

## 5. Security & Privacy Architecture

- **Token Encryption**: Access tokens and refresh tokens are encrypted using `AES-256-GCM` with random 16-byte initialization vectors (`IV`) and authentication tags (`authTag`).
- **Mongoose Sanitization**: `accessToken` and `refreshToken` have `{ select: false }` in Mongoose. Even direct queries will not expose tokens unless explicitly requested with `.select('+accessToken +refreshToken')`.
- **API Leak Prevention**: The model contains `toSafeJSON()`, which strips raw tokens and channels before sending connection data to the frontend.
- **CSRF State Tokens**: OAuth flow requires a HMAC-SHA256 signed `state` query parameter carrying `{ userId, randomBytes, timestamp, isMobile }`. Callbacks verify the signature and ensure state expiration within 10 minutes.
- **Rate-Limiting & Deduplication**: Redis locks (`lock:calendar:sync:${userId}`, 30s TTL) prevent redundant concurrent sync calls from overwhelming Google API quotas.
- **Zero Privacy Leakage**: Event descriptions, titles, and attendees are strictly scoped to the authenticated user (`{ userId: req.user._id }`). Other users, mentors, or administrators cannot query or view another user's personal calendar events.

---

## 6. Mobile & Capacitor Considerations

- **No In-App WebViews**: Google restricts OAuth 2.0 authorization within standard WebViews for security reasons (`disallowed_useragent`).
- **System Browser Launch**: The frontend uses `@capacitor/browser` or `window.open` with `_system` to open Google OAuth in Chrome / Android default browser.
- **Deep Link Callback**: When Google redirects to `/api/google-calendar/callback`, the backend detects `isMobile` from the state parameter and serves a lightweight HTML page that executes:
  ```html
  <script>
    window.location.href = "com.alumnex.connect://oauth/google-calendar?status=success";
  </script>
  ```
- **Deep Link Handler**: `frontend/src/App.js` includes `MobileDeepLinkHandler` via `@capacitor/app` `appUrlOpen` to intercept the custom scheme and transition to `/calendar?status=success`.

---

## 7. Disconnection & Account Revocation

When a user disconnects their Google Calendar (`POST /api/google-calendar/disconnect`):
1. Active Google Push watch channels are cleanly stopped via Google's `channels.stop` API.
2. The refresh token is revoked with `oauth2Client.revokeToken()`.
3. Cached Google calendar events for that user in MongoDB are permanently deleted.
4. The `GoogleCalendarConnection` record is removed.
5. All React Query calendar queries are invalidated.
