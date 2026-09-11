# CHAPTER 8 — MODULE-WISE IMPLEMENTATION (ROUTES FORENSIC AUDIT)

The backend comprises 21 dedicated Express route modules.

### Route Module: `admin.js`
- **Source File**: `backend/routes/admin.js`
- **Endpoints Documented**:
  - `GET /dashboard`
  - `GET /users`
  - `PUT /users/:id/approval`
  - `PUT /users/:id/mentor-verify`
  - `PUT /users/:id/role`
  - `PUT /users/:id/suspend`
  - `GET /moderation`
  - `PUT /moderate/:type/:id`
  - `GET /analytics`
  - `POST /notifications`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `ai.js`
- **Source File**: `backend/routes/ai.js`
- **Endpoints Documented**:
  - `POST /chat`
  - `POST /analyze-resume`
  - `POST /draft-request`
  - `POST /match-job`
  - `POST /mock-interview`
  - `POST /evaluate-interview`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `auth.js`
- **Source File**: `backend/routes/auth.js`
- **Endpoints Documented**:
  - `POST /google`
  - `POST /github`
  - `POST /oauth-complete`
  - `POST /register`
  - `POST /login`
  - `GET /me`
  - `POST /refresh`
  - `POST /change-password`
  - `POST /forgot-password`
  - `POST /reset-password`
  - `POST /logout`
  - `POST /verify-email`
  - `POST /resend-verification`
  - `POST /send-2fa`
  - `POST /verify-2fa`
  - `GET /mobile/github`
  - `GET /mobile/github/callback`
  - `GET /mobile/google`
  - `GET /mobile/google/callback`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.
- **Security Control**: Enforces `authorize()` RBAC middleware.

### Route Module: `business.js`
- **Source File**: `backend/routes/business.js`
- **Endpoints Documented**:
  - `GET /`
  - `POST /`
  - `GET /:id`
  - `PUT /:id`
  - `DELETE /:id`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.
- **Security Control**: Enforces `authorize()` RBAC middleware.

### Route Module: `contests.js`
- **Source File**: `backend/routes/contests.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /external`
  - `GET /:id`
  - `POST /`
  - `PUT /:id`
  - `DELETE /:id`
  - `POST /:id/register`
  - `DELETE /:id/register`
  - `POST /:id/submit`
  - `GET /:id/leaderboard`
  - `PUT /:id/start`
  - `PUT /:id/end`
  - `GET /filter/upcoming`
  - `GET /filter/ongoing`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `devActivity.js`
- **Source File**: `backend/routes/devActivity.js`
- **Endpoints Documented**:
  - `GET /public/:userId`
  - `GET /:email`
  - `POST /usernames`
  - `POST /generate-code`
  - `POST /verify-platform`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `events.js`
- **Source File**: `backend/routes/events.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /registered`
  - `GET /organized`
  - `GET /upcoming`
  - `GET /virtual`
  - `GET /:id`
  - `POST /`
  - `PUT /:id`
  - `DELETE /:id`
  - `POST /:id/register`
  - `DELETE /:id/register`
  - `PUT /:id/publish`
  - `PUT /:id/cancel`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `feedback.js`
- **Source File**: `backend/routes/feedback.js`
- **Endpoints Documented**:
  - `POST /`
  - `GET /mine`
  - `GET /`
  - `PATCH /:id/status`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `forum.js`
- **Source File**: `backend/routes/forum.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /feed`
  - `GET /:id`
  - `POST /`
  - `POST /:id/save`
  - `POST /:id/report`
  - `PUT /:id`
  - `DELETE /:id`
  - `POST /:id/like`
  - `POST /:id/comments`
  - `PUT /:id/comments/:commentId`
  - `DELETE /:id/comments/:commentId`
  - `POST /:id/comments/:commentId/like`
  - `PUT /:id/comments/:commentId/solution`
  - `PUT /:id/status`
  - `GET /featured`
  - `GET /category/:category`
  - `GET /search`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `helpdesk.js`
- **Source File**: `backend/routes/helpdesk.js`
- **Endpoints Documented**:
  - `POST /`
  - `GET /`
  - `PATCH /:id`
  - `DELETE /:id`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `institutions.js`
- **Source File**: `backend/routes/institutions.js`
- **Endpoints Documented**:
  - `GET /search`
  - `POST /extract-profile`
  - `GET /departments`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `jobs.js`
- **Source File**: `backend/routes/jobs.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /external`
  - `POST /parse-resume`
  - `POST /`
  - `PUT /:id`
  - `DELETE /:id`
  - `POST /:id/apply`
  - `GET /applications/me`
  - `GET /:id/applications`
  - `PUT /applications/:appId/status`
  - `POST /:id/save`
  - `GET /saved`
  - `GET /my-posts`
  - `PUT /:id/status`
  - `GET /:id/stats`
  - `GET /:id`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `leaderboard.js`
- **Source File**: `backend/routes/leaderboard.js`
- **Endpoints Documented**:
  - `GET /`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `mentorship.js`
- **Source File**: `backend/routes/mentorship.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /mentors`
  - `GET /leaderboard`
  - `GET /:id`
  - `POST /`
  - `POST /auto-assign`
  - `PUT /:id/status`
  - `POST /:id/feedback`
  - `GET /rewards/leaderboard`
  - `POST /:id/milestones`
  - `PUT /:id/milestones/:milestoneId`
  - `POST /:id/notes`
  - `PUT /availability`
  - `PUT /:id/cancel`
  - `POST /sessions`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `messages.js`
- **Source File**: `backend/routes/messages.js`
- **Endpoints Documented**:
  - `GET /global`
  - `GET /conversation/:userId`
  - `POST /start-chat`
  - `POST /group`
  - `POST /`
  - `GET /conversations`
  - `PUT /:id/read`
  - `PUT /conversation/:userId/read`
  - `PUT /:id`
  - `DELETE /:id`
  - `POST /:id/reactions`
  - `POST /:id/forward`
  - `GET /search`
  - `GET /unread-count`
  - `DELETE /conversation/:userId`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `notifications.js`
- **Source File**: `backend/routes/notifications.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /unread-count`
  - `PUT /:id/read`
  - `PUT /read-all`
  - `PUT /read-by-type`
  - `DELETE /:id`
  - `DELETE /delete-read`
  - `GET /preferences`
  - `PUT /preferences`
  - `GET /stats`
  - `PUT /:id/action`
  - `GET /actionable`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `projects.js`
- **Source File**: `backend/routes/projects.js`
- **Endpoints Documented**:
  - `GET /`
  - `GET /followers`
  - `GET /user/:userId`
  - `GET /:id`
  - `POST /`
  - `PUT /:id`
  - `DELETE /:id`
  - `PUT /:id/like`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.
- **Security Control**: Enforces `authorize()` RBAC middleware.

### Route Module: `tasks.js`
- **Source File**: `backend/routes/tasks.js`
- **Endpoints Documented**:
  - `GET /my-tasks`
  - `POST /:id/complete`
  - `GET /`
  - `POST /`
  - `PUT /:id`
  - `DELETE /:id`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `tech-hub.js`
- **Source File**: `backend/routes/tech-hub.js`
- **Endpoints Documented**:
  - `POST /questions`
  - `GET /questions`
  - `GET /questions/:id`
  - `POST /questions/:id/replies`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `upload.js`
- **Source File**: `backend/routes/upload.js`
- **Endpoints Documented**:
  - `POST /`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

### Route Module: `users.js`
- **Source File**: `backend/routes/users.js`
- **Endpoints Documented**:
  - `GET /dashboard`
  - `GET /search`
  - `GET /:id`
  - `PUT /profile`
  - `PUT /profile/:role`
  - `POST /photo`
  - `POST /profile/phone/send-otp`
  - `POST /profile/phone/verify-otp`
  - `POST /:id/connect`
  - `DELETE /:id/connect`
  - `GET /:id/connections`
  - `POST /:id/follow`
  - `POST /:id/accept-follow`
  - `POST /:id/decline-follow`
  - `POST /:id/unfollow`
  - `POST /:id/report`
  - `GET /online`
  - `PUT /status`
  - `POST /delete-request`
  - `DELETE /me`
- **Security Control**: Enforces `protect` authentication middleware on specific endpoints.

