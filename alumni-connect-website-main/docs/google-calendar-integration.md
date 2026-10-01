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

---

## 2. Root Cause Analysis: 403 access_denied

### The Issue Observed:
```
Access blocked: alumnex-backend-2.onrender.com has not completed the Google verification process
The app is currently being tested, and can only be accessed by developer-approved testers.
Error 403: access_denied
Client ID: 253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com
Redirect URI: https://alumnex-backend-2.onrender.com/api/google-calendar/callback
```

### Exact Root Cause:
1. **Audience / Publishing Status**: The Google Cloud OAuth consent screen is configured as **User Type: External** with **Publishing Status: Testing**.
2. **Missing Test User**: In "Testing" status, Google strictly restricts authorization to developer-approved email addresses configured under **OAuth consent screen > Audience > Test users**. Any account (even `alumnexconnect@gmail.com` or developer accounts) not explicitly added to this list is blocked by Google with `Error 403: access_denied`.
3. **App Branding**: Because the app name and branding are not yet verified/configured on the OAuth consent screen, Google defaults to displaying the OAuth callback hostname (`alumnex-backend-2.onrender.com`) instead of `Alumnex Connect`.

---

## 3. Google Cloud Console Configuration Guide

Follow these exact steps in Google Cloud Console for project `253683997850`:

### Step 1: Immediate Fix for Developer Testing
1. Navigate to [Google Cloud Console Credentials / Consent](https://console.cloud.google.com/apis/credentials/consent?project=253683997850).
2. Under **Audience** / **Test users**, click **+ Add Users**.
3. Add:
   - `alumnexconnect@gmail.com`
   - Any other developer, QA, or pilot Google accounts used for testing.
4. Click **Save**.
5. *Immediate Result*: `alumnexconnect@gmail.com` and all added test users can now authorize Google Calendar without receiving the 403 `access_denied` error.

### Step 2: Configure Application Branding (Prevent backend URL from displaying)
1. Go to **APIs & Services** > **OAuth consent screen** (or **Google Auth Platform** > **Branding**).
2. Set:
   - **App Name**: `Alumnex Connect` (Do NOT leave empty or as backend hostname).
   - **User Support Email**: `alumnexconnect@gmail.com`
   - **App Logo**: Upload official 120x120px Alumnex Connect logo.
   - **Application Home Page**: `https://alumnex-connect.onrender.com`
   - **Application Privacy Policy**: `https://alumnex-connect.onrender.com/privacy`
   - **Application Terms of Service**: `https://alumnex-connect.onrender.com/terms`
   - **Authorized Domains**: Add `onrender.com`.
   - **Developer Contact Email**: `alumnexconnect@gmail.com`
3. Click **Save and Continue**.

### Step 3: Configure Minimum Least-Privilege Scopes
In **Data Access** / **Scopes**, declare:
- `https://www.googleapis.com/auth/calendar.events` (Sensitive — read/write events, add Google Meet links)
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly` (Sensitive — list user's calendars for sync selection)
- `https://www.googleapis.com/auth/userinfo.email` (Non-sensitive — identify user account)
- `https://www.googleapis.com/auth/userinfo.profile` (Non-sensitive)
- `openid` (Non-sensitive)

*Remove any unused broad scopes like `https://www.googleapis.com/auth/calendar`.*

### Step 4: Transition to Production (All Users Integration)
1. In **OAuth consent screen**, locate **Publishing status**.
2. Click **Publish App** to switch from **Testing** to **In Production**.
3. *Effect*:
   - Any standard Google account can now connect their calendar without needing to be pre-registered as a test user.
   - Google displays an initial "Google hasn't verified this app" notice during user consent. Users can click **Advanced > Go to Alumnex Connect (unsafe)** to connect while verification is in progress.
   - Up to 100 unverified users can connect before Google requires full OAuth verification.

### Step 5: Verification Submission Readiness
To remove the "unverified app" screen entirely for all production users:
1. Click **Prepare for verification** / **Submit for verification**.
2. Provide the Scope Justification:
   > *"Alumnex Connect requests Calendar event access (calendar.events and calendar.calendarlist.readonly) so registered students and alumni can view their academic and career schedule alongside Alumnex mentorship sessions, campus events, and workshops. It allows exporting confirmed 1:1 mentorship appointments with Google Meet links to the user's chosen calendar."*
3. Provide a demonstration video (YouTube unlisted link) showing the user clicking "Connect Google Calendar", granting permissions, returning to Alumnex, seeing their events, and exporting a mentorship session.
4. Ensure the privacy policy at `https://alumnex-connect.onrender.com/privacy` includes the Limited Use Disclosure (already implemented in Section 6).

### Step 6: Verify Exact Redirect URIs
Under **Credentials** > OAuth 2.0 Client ID `253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com`:
- **Authorized Redirect URIs**:
  - `https://alumnex-backend-2.onrender.com/api/google-calendar/callback` (Production Backend)
  - `http://localhost:5000/api/google-calendar/callback` (Local Development)
- **Authorized JavaScript Origins**:
  - `https://alumnex-connect.onrender.com` (Production Frontend)
  - `http://localhost:3000` (Local Frontend)

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
