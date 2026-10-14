# Alumnex Connect — Boundary / Control / Entity classification

## Boundary
Existing React pages serve as the interaction boundary: Login/Register, Profile/Network, Mentorship, Jobs/Resume Analyzer, DevPulse/Activity Hub, Chat/Notifications, Events/Calendar, Forum/Tech Hub/Projects/Contests, and Admin/Dashboard.

## Control
The repository implements control logic in Express route modules and services rather than separate classes named `*Controller`: `routes/auth.js`, `users.js`, `mentorship.js`, `jobs.js`, `ai.js`, `activity.js`, `devActivity.js`, `messages.js`, `notifications.js`, `events.js`, `googleCalendar.js`, `forum.js`, `tech-hub.js`, `projects.js`, `contests.js`, `admin.js`, and corresponding `services/*` modules.

## Entity
Mongoose entities include `User`, `MentorshipRequest`, `Mentorship`, `MentorshipSession`, `MentorReview`, `MentorReward`, `Job`, `JobApplication`, `JobOpportunity`, `DevProfile`, `ActivityGoal`, `ActivityRecord`, `Message`, `ChatGroup`, `Notification`, `NotificationDevice`, `ReminderPreference`, `Event`, `GoogleCalendarConnection`, `GoogleCalendarEvent`, `ForumPost`, `Project`, `Contest`, `Business`, `TechHub` models, `AdminIncident`, and `Report`.

These roles are a conceptual class analysis of existing React/API/model modules. Confirm specific cardinalities, validators and indexes against source before using the diagram as a migration specification.
