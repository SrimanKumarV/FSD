# Alumnex Activity Hub — Documentation

## Feature Overview

The **Alumnex Activity Hub** is an integrated learning, coding, and career activity reminder system that helps students maintain consistent habits. It integrates directly into the existing Alumnex Connect platform, reusing the existing authentication, notification system, database, email infrastructure, and design language.

**Tagline:** *Build your skills. Maintain your streaks. Stay career-ready.*

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│                                                  │
│  /activity ──► ActivityHub.js                    │
│  Layout.js ──► Sidebar: "Activity Hub"           │
│  App.js    ──► Protected route                   │
│  Layout.js ──► Notification click → /activity    │
└──────────────────┬──────────────────────────────┘
                   │ Axios API calls
┌──────────────────▼──────────────────────────────┐
│              Backend (Express)                    │
│                                                  │
│  routes/activity.js                              │
│    └─ All API endpoints                          │
│                                                  │
│  services/activityService.js                     │
│    └─ Reuses utils/devStatsFetcher.js            │
│    └─ Normalizes platform data                   │
│    └─ Streak computation                         │
│    └─ Dashboard aggregation                      │
│                                                  │
│  jobs/activityReminderCron.js                    │
│    └─ Daily reminders (every 2 hours)            │
│    └─ Streak-at-risk warnings                    │
│    └─ Weekly summaries (Sunday 10 AM)            │
│    └─ Anti-spam deduplication via Redis           │
│    └─ Quiet hours enforcement                    │
│    └─ Timezone-aware scheduling                  │
│                                                  │
│  utils/activityEmailTemplates.js                 │
│    └─ 5 email templates                          │
│                                                  │
│  models/                                         │
│    └─ ActivityGoal.js                            │
│    └─ ActivityRecord.js                          │
│    └─ ReminderPreference.js                      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  Existing Infrastructure (reused, not modified)  │
│                                                  │
│  MongoDB (existing connection)                   │
│  Redis (existing cache.js)                       │
│  sendEmail.js (Brevo + SMTP fallback)            │
│  Notification model (existing)                   │
│  DevProfile model (existing usernames & stats)   │
│  devStatsFetcher.js (7 platform fetchers)        │
│  auth middleware (existing protect/admin)         │
│  node-cron (existing scheduling infra)           │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### `activitygoals` (new collection)

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Owner |
| `title` | String (max 100) | Goal name |
| `category` | Enum | coding, learning, career, project, custom |
| `platform` | Enum | leetcode, github, duolingo, etc. or custom |
| `frequency` | Enum | daily, weekdays, custom |
| `customDays` | [Number] | 0-6 for Sun-Sat |
| `target` | String | e.g., "30 minutes" |
| `reminderTime` | String | HH:mm format |
| `emailEnabled` | Boolean | Per-goal email toggle |
| `inAppEnabled` | Boolean | Per-goal in-app toggle |
| `enabled` | Boolean | Active/inactive |
| `currentStreak` | Number | Current consecutive days |
| `longestStreak` | Number | All-time best streak |
| `lastCompletedAt` | Date | Last completion timestamp |
| `totalCompletions` | Number | Lifetime count |

**Indexes:** `(userId, title)` unique, `(userId, platform)`, `(enabled, frequency)`

### `activityrecords` (new collection)

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Owner |
| `goalId` | ObjectId | Related goal |
| `platform` | Enum | Platform name |
| `date` | String | YYYY-MM-DD in user's timezone |
| `completed` | Boolean | Completion status |
| `completionType` | Enum | manual, auto-detected, api-verified |
| `notes` | String | Optional notes |

**Indexes:** `(userId, goalId, date)` unique, `(userId, date)`

### `reminderpreferences` (new collection)

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId | Owner (unique) |
| `emailEnabled` | Boolean | Master email switch |
| `inAppEnabled` | Boolean | Master in-app switch |
| `dailyReminder` | Boolean | Enable daily reminders |
| `streakAlert` | Boolean | Streak-at-risk alerts |
| `milestoneAlert` | Boolean | Milestone celebrations |
| `weeklySummary` | Boolean | Sunday summary |
| `reminderTime` | String | HH:mm format |
| `quietHoursEnabled` | Boolean | Quiet hours toggle |
| `quietHoursStart` | String | HH:mm |
| `quietHoursEnd` | String | HH:mm |
| `timezone` | String | IANA timezone (default: Asia/Kolkata) |
| `reminderDays` | [Number] | Which days to send reminders |

---

## API Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/activity/dashboard` | Private | Dashboard summary |
| `GET` | `/api/activity/integrations` | Private | Platform integrations |
| `POST` | `/api/activity/integrations/:platform/refresh` | Private | Refresh platform data |
| `GET` | `/api/activity/goals` | Private | List user's goals |
| `POST` | `/api/activity/goals` | Private | Create goal |
| `PUT` | `/api/activity/goals/:id` | Private | Update goal |
| `DELETE` | `/api/activity/goals/:id` | Private | Delete goal |
| `POST` | `/api/activity/goals/:id/complete` | Private | Mark goal complete today |
| `GET` | `/api/activity/preferences` | Private | Get reminder preferences |
| `PUT` | `/api/activity/preferences` | Private | Update preferences |
| `GET` | `/api/activity/summary` | Private | Weekly summary data |
| `DELETE` | `/api/activity/data` | Private | Delete all activity data |
| `GET` | `/api/activity/admin/analytics` | Admin | Aggregate analytics |
| `POST` | `/api/activity/admin/test-email` | Admin | Send test email |

---

## Environment Variables

```env
# Activity Hub (add to existing .env)
ACTIVITY_CHECK_ENABLED=true
ACTIVITY_REMINDER_CRON="0 */2 * * *"
ACTIVITY_WEEKLY_CRON="0 10 * * 0"
REMINDER_TIMEZONE=Asia/Kolkata
```

The email system reuses the existing `BREVO_API_KEY`, `BREVO_SMTP_KEY`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` variables. No new email provider configuration is needed.

---

## Email Configuration

The Activity Hub reuses the existing `sendEmail.js` which supports:

1. **Brevo SMTP Relay** (primary)
2. **Brevo HTTPS API** (fallback)
3. **Generic SMTP** (fallback — Gmail, college SMTP, etc.)

To use a non-Brevo SMTP provider, set:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

To disable all emails in development:
```env
# Simply don't set any email provider keys
```

---

## Platform Integrations

| Platform | Status | Method | Streak |
|---|---|---|---|
| **GitHub** | ✅ Automatic | GraphQL API + Token | ✅ Verified (contribution calendar) |
| **LeetCode** | ✅ Automatic | Public GraphQL | ⚠️ Calendar available, no official streak |
| **Duolingo** | ✅ Automatic | Semi-public API | ✅ Verified |
| **HackerRank** | ✅ Automatic | Public REST API | ❌ Manual mode |
| **CodeChef** | ⚠️ Partial | HTML scrape | ❌ Manual mode |
| **Codeforces** | ✅ Automatic | Official REST API | ❌ Manual mode |
| **GeeksforGeeks** | ⚠️ Partial | HTML scrape | ⚠️ POTD streak available |
| **Kaggle** | ❌ Manual | No public API | ❌ Manual mode |

> Platform usernames are managed through the existing DevPulse page. The Activity Hub reads from the DevProfile model.

---

## Scheduler / Cron

The system uses the existing `node-cron` library (already in use for weekly engagement digest).

Two cron jobs are registered in `server.js`:

1. **Daily Reminders** — Runs every 2 hours (configurable). Scans users with active goals, checks quiet hours and timezone, sends reminders only for pending goals. Anti-spam deduplication ensures max 1 reminder per user per day.

2. **Weekly Summary** — Runs Sunday at 10 AM. Sends activity summary emails to opted-in users.

Both jobs run in-process. For Render free tier, the existing self-ping mechanism keeps the server alive.

---

## Security Measures

1. **Authentication** — All routes use the existing `protect` middleware (JWT)
2. **Authorization** — Users can only access their own data; admin routes use `admin` middleware
3. **Input Validation** — express-validator on all POST/PUT endpoints
4. **Rate Limiting** — Existing global rate limiter applies to `/api/activity/*`
5. **CSRF Protection** — Existing CSRF middleware applies
6. **XSS Prevention** — Helmet + mongo-sanitize (existing)
7. **Anti-Spam** — Redis-based deduplication prevents duplicate notifications
8. **No Third-Party Passwords** — Only public usernames stored (in DevProfile)
9. **Goal Limit** — Max 20 goals per user
10. **Data Deletion** — `DELETE /api/activity/data` lets users remove all their data

---

## Deployment (Render)

No additional Render configuration needed. The Activity Hub:

- Runs on the existing web service
- Uses the existing MongoDB connection
- Uses the existing Redis (or mock Redis for dev)
- Cron jobs run in-process via `node-cron`

### Steps:
1. Push code to the repository
2. Render auto-deploys
3. MongoDB auto-creates new collections on first use
4. No migration script needed (Mongoose creates collections automatically)

---

## Running Locally

```bash
# Install all dependencies
npm run install-all

# Start both backend and frontend
npm run dev
```

Backend runs on `http://localhost:5000`
Frontend runs on `http://localhost:3000`

Navigate to `http://localhost:3000/activity` to see the Activity Hub.

---

## Testing

```bash
cd backend
npm test -- --testPathPattern=activity
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Activity Hub shows "Loading..." forever | Check that the backend is running and `/api/activity/dashboard` returns 200 |
| No platform data showing | Ensure usernames are set in DevPulse (`/devpulse`) first |
| Emails not sending | Check BREVO_API_KEY or EMAIL_HOST/EMAIL_PASS in `.env` |
| Reminders not firing | Check ACTIVITY_REMINDER_CRON schedule, ensure server stays running |
| Duplicate notifications | Redis cache should prevent this; check Redis connection |
