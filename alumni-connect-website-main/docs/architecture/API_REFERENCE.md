# Alumnex Connect — Core API Reference

All requests accept and return `application/json`.
Endpoints marked **[AUTH]** require an HTTP-Only session cookie or `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. System & Health

### `GET /api/health`
- **Auth**: Public
- **Description**: Returns live cluster status, current timestamp, process uptime, and environment. Used by client for dynamic discovery and failover.
- **Response** `200 OK`:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-27T18:00:00.000Z",
    "uptime": 12450.2,
    "environment": "production"
  }
  ```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Auth**: Public
- **Body**: `{ "name", "email", "password", "role" ("student"|"alumni"|"college"), "college", "department" }`
- **Response** `201 Created`: User document, session cookie, and `{ "token", "user" }`.

### `POST /api/auth/login`
- **Auth**: Public
- **Body**: `{ "email", "password" }`
- **Response** `200 OK`: `{ "token", "user" }` + sets HTTP-Only cookie.

### `POST /api/auth/logout`
- **Auth**: Public / Auth
- **Response** `200 OK`: Clears session cookie and invalidates client token.

### `GET /api/auth/me`
- **Auth**: Required
- **Response** `200 OK`: Current authenticated user profile with populated roles and permissions.

---

## 3. Users & Dashboard (`/api/users`)

### `GET /api/users/dashboard`
- **Auth**: Required
- **Description**: Aggregate personalized dashboard payload containing quick stats, network activity feed, upcoming events, and user's Activity Hub daily plan.
- **Response** `200 OK`:
  ```json
  {
    "stats": [
      { "name": "Active Mentors", "value": 12, "iconName": "Users" },
      { "name": "Curated Jobs", "value": 34, "iconName": "Briefcase" }
    ],
    "recentActivities": [],
    "upcomingEvents": [],
    "activity": {
      "overallStreak": { "current": 5, "longest": 14, "atRisk": false },
      "todaysPlan": { "goals": [] },
      "categoryStreaks": { "coding": 5, "learning": 3 }
    }
  }
  ```

---

## 4. Mentorship (`/api/mentorship`)

### `GET /api/mentorship/mentors`
- **Auth**: Required
- **Query**: `?department=CS&skills=React&page=1&limit=20`
- **Response** `200 OK`: Paginated list of approved alumni mentors with rating, industry, and availability.

### `POST /api/mentorship/request`
- **Auth**: Student
- **Body**: `{ "mentorId", "topic", "message", "preferredTimes" }`
- **Response** `201 Created`: Created mentorship request with status `pending`.

### `POST /api/mentorship/auto-assign`
- **Auth**: Student
- **Description**: Evaluates alumni pool using multi-factor weighted scoring (college match +50, department +25, domain skills +10) and automatically assigns optimal available mentor.

---

## 5. Jobs & Opportunities (`/api/jobs`)

### `GET /api/jobs`
- **Auth**: Required
- **Query**: `?title=Engineer&location=Remote&type=Full-time&page=1&limit=20`
- **Response** `200 OK`: Paginated list of vetted job opportunities.

### `POST /api/jobs`
- **Auth**: Alumni / College / Admin
- **Body**: `{ "title", "company", "location", "type", "description", "requirements", "applyUrl" }`
- **Response** `201 Created`: Newly published job posting.

---

## 6. Activity Hub (`/api/activity`)

### `GET /api/activity/dashboard`
- **Auth**: Required
- **Query**: `?timezone=Asia/Kolkata`
- **Response** `200 OK`: Comprehensive behavioral snapshot (today's goals, active streaks, weekly breakdown, personal records, and top insights).

### `POST /api/activity/goals`
- **Auth**: Required
- **Body**: `{ "title", "category", "platform", "frequency", "targetValue", "trackingMode" }`
- **Response** `201 Created`: Active tracking goal.

### `POST /api/activity/log`
- **Auth**: Required
- **Body**: `{ "goalId", "platform", "category", "title", "date", "notes", "completionType" }`
- **Response** `200 OK`: Verified activity ledger record with recalculated streak response.

### `POST /api/activity/sync/:platform`
- **Auth**: Required
- **Param**: `platform` (`github` | `leetcode` | `codeforces`)
- **Response** `200 OK`: `{ "synced": true, "newActivitiesCount": 3, "streakUpdated": true }`.

---

## 7. DevPulse Developer Platform (`/api/devpulse`)

### `GET /api/devpulse/profile/:username`
- **Auth**: Required
- **Response** `200 OK`: Aggregated developer intelligence metrics (GitHub commits, LeetCode rating and solved breakdown, contest history, and total active days).

### `POST /api/devpulse/refresh`
- **Auth**: Required
- **Description**: Triggers fresh background poll of user's external connected coding platforms.

---

## 8. Real-Time Messages (`/api/messages`)

### `GET /api/messages/conversations`
- **Auth**: Required
- **Response** `200 OK`: Active chat conversations with last message snippet, unread counter, and participant status.

### `GET /api/messages/:recipientId`
- **Auth**: Required
- **Query**: `?page=1&limit=50`
- **Response** `200 OK`: Paginated chat history with delivery timestamp and read status.

---

## 9. Notifications (`/api/notifications`)

### `GET /api/notifications`
- **Auth**: Required
- **Query**: `?unreadOnly=false&limit=30`
- **Response** `200 OK`: User notification list with category, link URL, and timestamp.

### `PUT /api/notifications/:id/read`
- **Auth**: Required
- **Response** `200 OK`: Marks specific notification as read.

### `PUT /api/notifications/read-all`
- **Auth**: Required
- **Response** `200 OK`: Clears unread counter for current user.

---

## 10. AI Resume Analyzer (`/api/resume`)

### `POST /api/resume/analyze`
- **Auth**: Required
- **Body**: `multipart/form-data` with PDF/DOCX resume file or raw text + target job description.
- **Response** `200 OK`:
  ```json
  {
    "matchScore": 88,
    "strengths": ["Strong React and Node.js proficiency", "Demonstrated REST API design"],
    "improvements": ["Highlight Docker and CI/CD deployment experience"],
    "keywordSuggestions": ["Kubernetes", "Redis Caching", "Microservices"]
  }
  ```

---

## 11. Admin & Governance (`/api/admin`)

### `GET /api/admin/stats`
- **Auth**: Admin Role Only
- **Response** `200 OK`: Global system health, total user count partitioned by role, active mentorship pairs, and flagged reports.

### `PUT /api/admin/users/:id/approve`
- **Auth**: Admin Role Only
- **Response** `200 OK`: Approves alumni or college credential for full platform participation.
