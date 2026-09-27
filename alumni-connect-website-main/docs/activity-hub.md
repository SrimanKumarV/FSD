# Alumnex Activity Hub & Activity Intelligence 2.0 — Documentation

## Feature Overview

The **Alumnex Activity Hub** is an integrated learning, coding, and career momentum intelligence system that helps students and alumni build disciplined, compounding daily habits. It integrates natively into the existing Alumnex Connect platform, utilizing the existing authentication, notification engine, database, email infrastructure, and design language.

**Tagline:** *Build your skills. Maintain your streaks. Stay career-ready.*

---

## What's New in Activity Intelligence 2.0 & Mobile-First Personalization

1. **Intentionally Designed Mobile Architecture**:
   - **Mobile Briefing Layout (`md:hidden`)**: A focused personal briefing prioritizing:
     1. Localized time-of-day greeting & contextual today message.
     2. Next Best Action callout pill (e.g. `Complete LeetCode goal →`).
     3. Hero Streak card with streak protection status and all-time record.
     4. Today's Progress with verified goal cards and one-tap completion.
     5. Weekly Consistency dots starting on Sunday (`S M T W T F S`).
     6. Categorized Momentum ranking with zero-noise formatting.
     7. Dynamic Momentum Insights based on actual developer platform data.
     8. Recent verified activity timeline snippet.
   - **Desktop Control Center (`hidden md:block`)**: Comprehensive 2-column workspace featuring full weekly analytics charts, category breakdowns, priority goal manager, and recent audit logs.

2. **Mobile Navigation Rail (4-Tab Bar + Slide-Up "More" Drawer)**:
   - Primary mobile tabs: `[ Overview ] [ Today ] [ Streaks ] [ More ▾ ]`.
   - Prevents awkward 8-tab horizontal overflow on 320px–430px viewports.
   - Tapping **More ▾** opens an animated bottom sheet drawer providing direct access to `Analytics`, `Goals`, `Platforms`, `Timeline`, and `Settings`.

3. **Safe-Area Layout & Zero Overflow Guarantee**:
   - Container padding (`pb-32 lg:pb-12`) guarantees that the global `MobileBottomNav` (~84px) never covers buttons, cards, or footer controls.
   - 100% viewport compliance across `320px`, `360px`, `375px`, `390px`, `412px`, and `430px`.
   - Modals (`GoalBuilderModal`, `TimezoneSelectorModal`) render as native-feeling slide-up bottom sheets with step dots (`● ● ○ ○`) on mobile screens.

4. **Apple / Linear-Style Subscreen Settings Navigation**:
   - Mobile users see a clean 6-item section list (`Timezone`, `Reminders`, `Quiet Hours`, `Weekly Summary`, `Automation`, `Privacy & Data`).
   - Tapping any section drills down into a dedicated focused screen with a `← All Settings` back header.
   - Desktop retains a productive 2-column sidebar layout.

5. **Intelligent Device Timezone Detection & Boundary Synchronization**:
   - Automatically detects device timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
   - Displays a gentle 1-click update prompt if the browser timezone differs from saved settings.
   - Enforces Quiet Hours to pause all push and email notifications while users sleep.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                                                             │
│  /activity ──► ActivityHub.js                               │
│    ├── Mobile Briefing Layout (md:hidden)                   │
│    ├── Desktop 2-Column Dashboard (hidden md:block)         │
│    ├── 4-Tab Mobile Bar + Animated More Drawer              │
│    └── Reusable Components:                                 │
│        ├── ActivityMomentumCard.js                          │
│        ├── TodayGoals.js & DashboardTodayGoals.js           │
│        ├── WeeklyActivityChart.js (Sunday-first)            │
│        ├── ConsistencyScoreCard.js                          │
│        ├── ActivityHeatmap.js                               │
│        ├── StreakProtectionCard.js (Accordion)              │
│        ├── MilestoneTimeline.js                             │
│        ├── PersonalRecords.js                               │
│        ├── PlatformActivityCard.js                          │
│        ├── ActivityTimeline.js                              │
│        ├── GoalBuilderModal.js (Bottom Sheet + Stepper)     │
│        └── ActivitySettings.js (Linear Subscreen Nav)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Axios API calls
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Express)                        │
│                                                             │
│  routes/activity.js                                         │
│    └─ All API endpoints                                     │
│                                                             │
│  services/activityService.js                                │
│    └─ Reuses utils/devStatsFetcher.js                       │
│    └─ Normalizes platform activity records                  │
│    └─ Streak & milestone calculation                        │
│    └─ Consistency score engine (50/30/20 formula)           │
│    └─ Behavioral insights generator                         │
│    └─ Timezone boundary calculations                        │
│                                                             │
│  jobs/activityReminderCron.js                               │
│    └─ Daily reminders (every 2 hours)                       │
│    └─ Streak-at-risk warnings                               │
│    └─ Weekly summaries (Sunday 10 AM)                       │
│    └─ Anti-spam deduplication via Redis                     │
│    └─ Quiet hours enforcement                               │
│                                                             │
│  utils/activityEmailTemplates.js                            │
│    └─ Daily reminder template                               │
│    └─ Streak-at-risk template                               │
│    └─ Goal completed template                               │
│    └─ Streak milestone celebration template                 │
│    └─ Weekly activity summary template                      │
│    └─ Broadcast announcement template                       │
│                                                             │
│  models/                                                    │
│    └─ ActivityGoal.js                                       │
│    └─ ActivityRecord.js                                     │
│    └─ ReminderPreference.js                                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│        Existing Infrastructure (Reused & Integrated)        │
│                                                             │
│  MongoDB (Mongoose connection)                              │
│  Redis (cache.js for 3-minute dashboard caching)            │
│  sendEmail.js (Brevo + SMTP fallback)                       │
│  Notification model (system announcements & alerts)         │
│  DevProfile model (linked developer accounts)               │
│  devStatsFetcher.js (GitHub, LeetCode, Codeforces, etc.)    │
│  auth middleware (protect & admin)                          │
│  node-cron (in-process scheduler)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schemas

### `activitygoals` Collection

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Goal owner |
| `title` | String (max 100) | Goal title |
| `category` | Enum | `coding`, `learning`, `career`, `project`, `custom` |
| `platform` | Enum | `github`, `leetcode`, `codeforces`, `duolingo`, etc. or `custom` |
| `frequency` | Enum | `daily`, `weekdays`, `custom` |
| `customDays` | [Number] | Array of active days (0 = Sunday, 6 = Saturday) |
| `target` | String | Readable target description (e.g. "1 problem", "30 mins") |
| `targetValue` | Number | Numeric target value |
| `targetMetric` | String | Metric unit (e.g. `problems`, `commits`, `minutes`) |
| `priority` | Enum | `high`, `medium`, `low` |
| `trackingMode` | Enum | `automatic` or `manual` |
| `reminderTime` | String | `HH:mm` format |
| `emailEnabled` | Boolean | Per-goal email reminder toggle |
| `inAppEnabled` | Boolean | Per-goal in-app notification toggle |
| `enabled` | Boolean | Active / archived status |
| `currentStreak` | Number | Current consecutive active days |
| `longestStreak` | Number | All-time best streak |
| `lastCompletedAt` | Date | Last completion timestamp |
| `totalCompletions` | Number | Lifetime completion counter |

### `activityrecords` Collection

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Record owner |
| `goalId` | ObjectId (ref: ActivityGoal) | Associated goal (if any) |
| `platform` | Enum | Activity platform |
| `category` | Enum | Activity category |
| `title` | String | Activity title or goal title |
| `sourceTitle` | String | Verifiable external action name |
| `date` | String | `YYYY-MM-DD` in user's timezone |
| `completed` | Boolean | Completion status |
| `completionType` | Enum | `manual`, `auto-detected`, `api-verified` |
| `metricValue` | Number | Metric value logged (e.g. `20`) |
| `metricUnit` | String | Metric unit (e.g. `minutes`) |
| `verified` | Boolean | True if verified via platform API |

### `reminderpreferences` Collection

| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (unique) | Settings owner |
| `emailEnabled` | Boolean | Master email notifications switch |
| `inAppEnabled` | Boolean | Master in-app notifications switch |
| `dailyReminder` | Boolean | Daily pending goal reminders |
| `streakAlert` | Boolean | Evening streak-at-risk alerts |
| `milestoneAlert` | Boolean | Milestone celebrations (7, 14, 30, 50, 100 days) |
| `weeklySummary` | Boolean | Sunday morning weekly summary email |
| `reminderTime` | String | Default reminder time (`HH:mm`) |
| `quietHoursEnabled` | Boolean | Quiet hours toggle |
| `quietHoursStart` | String | Quiet hours start (`HH:mm`) |
| `quietHoursEnd` | String | Quiet hours end (`HH:mm`) |
| `timezone` | String | IANA timezone (e.g. `Asia/Kolkata`) |
| `reminderDays` | [Number] | Active days for notifications (0–6) |

---

## API Endpoints Reference

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/activity/dashboard` | Private | Full aggregated Activity Intelligence summary |
| `POST` | `/api/activity/sync` | Private | Idempotent scan & sync of all connected platform feeds |
| `GET` | `/api/activity/streaks` | Private | Streaks breakdown, milestones, and protection status |
| `GET` | `/api/activity/analytics` | Private | Analytics for 7D, 30D, 90D, 180D, 365D with consistency score |
| `GET` | `/api/activity/timeline` | Private | Paginated chronological activity audit trail |
| `GET` | `/api/activity/insights` | Private | Behavioral patterns and momentum insights |
| `GET` | `/api/activity/integrations` | Private | Connected platforms and last sync timestamps |
| `POST` | `/api/activity/integrations/:platform/refresh` | Private | Sync individual developer platform |
| `GET` | `/api/activity/goals` | Private | List all user habit goals |
| `POST` | `/api/activity/goals` | Private | Create a new habit goal |
| `PUT` | `/api/activity/goals/:id` | Private | Update goal schedule, targets, or tracking mode |
| `DELETE` | `/api/activity/goals/:id` | Private | Delete goal and associated records |
| `POST` | `/api/activity/goals/:id/complete` | Private | Complete goal for today (manual check-in) |
| `GET` | `/api/activity/preferences` | Private | Get user reminder, quiet hours, and timezone settings |
| `PUT` | `/api/activity/preferences` | Private | Update reminder preferences or timezone |
| `DELETE` | `/api/activity/data` | Private | GDPR-compliant complete data deletion |
| `GET` | `/api/activity/admin/analytics` | Admin | Institutional aggregate activity metrics |
| `POST` | `/api/activity/admin/test-email` | Admin | Test email delivery |

---

## Consistency Index Formula

$$\text{Consistency Index} = (\text{Active Days Ratio} \times 50) + (\text{Goal Completion Ratio} \times 30) + (\text{Streak Factor} \times 20)$$

Where:
- **Active Days (50%)**: Proportion of days with verified activity over the window.
- **Goal Completion (30%)**: Percentage of scheduled goals completed on active days.
- **Streak Continuity (20%)**: Bonus for unbroken streaks compounding momentum.

---

## Automated Background Jobs (Cron)

Two scheduled cron jobs run via `node-cron`:

1. **Daily Reminders & Streak Protection (`0 */2 * * *`)**:
   - Evaluates active users whose local time matches their `reminderTime`.
   - Checks Quiet Hours and timezone boundaries.
   - Sends pending goal reminders and streak-at-risk warnings before midnight.
   - Redis anti-spam key ensures maximum 1 reminder per user per day.

2. **Weekly Summary Digest (`0 10 * * 0`)**:
   - Executes every Sunday at 10:00 AM in the user's local timezone.
   - Computes coding days, learning days, total completed goals, and current streaks.
   - Dispatches a personalized email summary to opted-in users.

---

## FAQ & Help Centre Integration

Activity Hub documentation and guides are linked throughout:
- **FAQ Page (`/faq`)**: Dedicated "⚡ Activity Hub & Streaks" category with interactive search and 6 in-depth Q&As.
- **Help Centre (`/help-centre`)**: Featured Activity Intelligence guide cards covering platform auto-tracking, streak recovery, consistency analytics, and quiet hours.
