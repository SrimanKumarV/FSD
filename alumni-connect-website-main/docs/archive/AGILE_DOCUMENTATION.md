# Alumni Connect Website — Complete Agile Documentation
## Product Backlog · Sprint Plans · User Stories · UML · Flowcharts

---

## PART 1: AGILE PROJECT CHARTER

### Product Vision Statement
> *"To build a unified, real-time digital platform that bridges the gap between alumni and current students — empowering career growth, knowledge sharing, and professional networking — through a seamlessly integrated suite of tools."*

### Product Goals (OKRs)

| Objective | Key Results |
|---|---|
| Enable Career Growth | 500+ jobs/internships posted, 80% student satisfaction |
| Build Strong Community | 1000+ active users, 300+ forum discussions |
| Track Developer Progress | DevPulse linked by 60% of users, Leaderboard active |
| Streamline Mentorship | 200+ mentor-mentee pairs formed, 4.5/5 avg rating |
| Real-time Collaboration | <200ms message delivery, 99% uptime |

### Project Stakeholders

| Role | Stakeholder | Interest |
|---|---|---|
| Product Owner | College Admin / Faculty | Platform adoption & student success |
| Scrum Master | Lead Developer | Sprint velocity & team alignment |
| Dev Team | Frontend + Backend Engineers | Feature delivery |
| Primary Users | Students (Current) | Jobs, Mentorship, DevPulse |
| Secondary Users | Alumni | Post jobs, mentor, refer |
| Tertiary Users | Admin | Moderate, analytics, manage |

---

## PART 2: PRODUCT BACKLOG (Prioritized)

### Epic Breakdown

```
EPIC 1: User Identity & Security
EPIC 2: Networking & Connections
EPIC 3: Career Board (Jobs, Internships, Referrals)
EPIC 4: Real-Time Communication (Chat)
EPIC 5: Event Management
EPIC 6: Discussion Forum
EPIC 7: Mentorship Program
EPIC 8: DevPulse (Coding Platform Integration)
EPIC 9: Leaderboard & Gamification
EPIC 10: Notification System
EPIC 11: Admin & Moderation
EPIC 12: Contests & Challenges
EPIC 13: Project Showcase
EPIC 14: AI Resume Analyzer
```

### Full Product Backlog (MoSCoW Prioritized)

```
ID    | Title                                | Epic | Priority | Story Pts | Sprint
────────────────────────────────────────────────────────────────────────────────────
US-01 | User Registration with OTP email     | 1    | MUST     | 5         | 1
US-02 | User Login with JWT                  | 1    | MUST     | 3         | 1
US-03 | Role selection (student/alumni)       | 1    | MUST     | 2         | 1
US-04 | Profile setup (bio, photo, skills)   | 1    | MUST     | 5         | 1
US-05 | Password reset via email             | 1    | MUST     | 3         | 1
US-06 | Phone OTP verification               | 1    | SHOULD   | 3         | 2
US-07 | Search & discover users              | 2    | MUST     | 5         | 2
US-08 | Follow / Unfollow users              | 2    | MUST     | 3         | 2
US-09 | View user profiles                   | 2    | MUST     | 3         | 2
US-10 | Connection suggestions               | 2    | SHOULD   | 5         | 3
US-11 | Post a job/internship                | 3    | MUST     | 5         | 2
US-12 | Apply to a job with cover letter     | 3    | MUST     | 5         | 2
US-13 | Post a referral opportunity          | 3    | MUST     | 3         | 2
US-14 | Request referral via DM              | 3    | MUST     | 3         | 3
US-15 | Filter jobs by type/location         | 3    | SHOULD   | 3         | 3
US-16 | Real-time job feed via Socket.io     | 3    | MUST     | 5         | 2
US-17 | Send direct messages                 | 4    | MUST     | 8         | 3
US-18 | Group chat creation                  | 4    | SHOULD   | 8         | 4
US-19 | File/image sharing in chat           | 4    | COULD    | 5         | 4
US-20 | Message reactions (emojis)           | 4    | COULD    | 3         | 5
US-21 | Message read receipts                | 4    | SHOULD   | 3         | 4
US-22 | Create events (online/offline)       | 5    | MUST     | 5         | 3
US-23 | RSVP to events                       | 5    | MUST     | 3         | 3
US-24 | Event reminders via notification     | 5    | SHOULD   | 3         | 4
US-25 | Event capacity management            | 5    | SHOULD   | 3         | 4
US-26 | Create forum posts                   | 6    | MUST     | 3         | 3
US-27 | Comment/reply on posts               | 6    | MUST     | 5         | 3
US-28 | Like and bookmark posts              | 6    | SHOULD   | 3         | 4
US-29 | Nested replies (2 levels)            | 6    | COULD    | 5         | 5
US-30 | Browse mentors                       | 7    | MUST     | 5         | 3
US-31 | Send mentorship request              | 7    | MUST     | 5         | 3
US-32 | Accept/reject mentorship request     | 7    | MUST     | 3         | 3
US-33 | Log mentorship sessions              | 7    | SHOULD   | 5         | 4
US-34 | Rate/review mentor                   | 7    | SHOULD   | 3         | 4
US-35 | Mentor reward leaderboard            | 7    | COULD    | 5         | 5
US-36 | Link GitHub account                  | 8    | MUST     | 5         | 3
US-37 | Link LeetCode account                | 8    | MUST     | 5         | 3
US-38 | Link HackerRank account              | 8    | SHOULD   | 3         | 4
US-39 | Link GFG account                     | 8    | SHOULD   | 3         | 4
US-40 | Link CodeChef account                | 8    | SHOULD   | 3         | 4
US-41 | Link Codeforces account              | 8    | SHOULD   | 3         | 4
US-42 | View DevPulse stats dashboard        | 8    | MUST     | 8         | 4
US-43 | Display real badges from platforms   | 8    | SHOULD   | 8         | 5
US-44 | Activity heatmap calendar            | 8    | SHOULD   | 5         | 4
US-45 | Alumnex Score calculation            | 9    | MUST     | 5         | 4
US-46 | Global leaderboard                   | 9    | MUST     | 5         | 4
US-47 | Filter leaderboard by country        | 9    | COULD    | 3         | 5
US-48 | Real-time online status              | 10   | MUST     | 5         | 3
US-49 | In-app notifications                 | 10   | MUST     | 5         | 3
US-50 | Email notifications                  | 10   | SHOULD   | 3         | 4
US-51 | SMS notifications (Twilio)           | 10   | COULD    | 5         | 5
US-52 | Admin user management                | 11   | MUST     | 8         | 4
US-53 | Content moderation tools             | 11   | MUST     | 5         | 4
US-54 | Analytics dashboard                  | 11   | SHOULD   | 8         | 5
US-55 | Contest creation & registration      | 12   | SHOULD   | 8         | 5
US-56 | Project showcase posting             | 13   | SHOULD   | 5         | 5
US-57 | AI resume analysis                   | 14   | COULD    | 8         | 5
US-58 | Public DevPulse view (other users)   | 8    | MUST     | 3         | 4
US-59 | Edit/unlink verified platforms       | 8    | MUST     | 3         | 5
US-60 | Real-time badge/score refresh        | 8    | SHOULD   | 5         | 5
```

---

## PART 3: SPRINT PLANS

### Sprint 0 — Project Setup (Week 0–1)
**Goal:** Foundation, tooling, architecture setup

```
SPRINT 0 TASKS
─────────────────────────────────────────────────────
☑ Initialize React frontend with Create React App
☑ Initialize Express backend with folder structure
☑ Set up MongoDB Atlas cloud database
☑ Configure Cloudinary for media storage
☑ Set up JWT auth middleware scaffold
☑ Set up Socket.io server + client
☑ Configure React Router v6 routing structure
☑ Create AuthContext, SocketContext providers
☑ Set up Tailwind CSS / global CSS design tokens
☑ Create reusable UI components: Button, Modal, Avatar
☑ Set up Git repository and branching strategy
☑ Configure CORS, environment variables
☑ Deploy skeleton to staging environment
─────────────────────────────────────────────────────
Velocity: N/A (setup sprint)   Duration: 1 week
```

---

### Sprint 1 — User Identity Core (Weeks 1–2)
**Goal:** Users can register, verify, and log in

**Sprint Backlog:** US-01, US-02, US-03, US-04, US-05
**Story Points:** 18

```
SPRINT 1 DEFINITION OF DONE
─────────────────────────────────────────────────────────────────
✓ User can register with name, email, password, role
✓ OTP email is sent automatically after registration
✓ User enters OTP → account gets verified
✓ User can log in → receives JWT token
✓ JWT is stored in localStorage and sent in headers
✓ Protected routes redirect unauthenticated users to /login
✓ User profile can be updated (bio, photo, skills, interests)
✓ Password can be reset via email link
✓ All forms have client-side AND server-side validation
✓ Error messages are human-readable (no raw HTTP status codes)
─────────────────────────────────────────────────────────────────
```

#### Sprint 1 — User Story Details

**US-01: User Registration**
```
AS A new user (student or alumni)
I WANT TO create an account with my email
SO THAT I can access the Alumni Connect platform

ACCEPTANCE CRITERIA:
  Given I am on /register
  When I fill name, email, password, role and submit
  Then I receive an OTP email within 30 seconds
  And my account is created with isVerified: false
  And I am redirected to the OTP verification page

  Given I enter the correct OTP
  When I click Verify
  Then my account becomes isVerified: true
  And I am redirected to the dashboard

  Given I enter an incorrect OTP
  When I click Verify
  Then I see an error: "Invalid OTP. Please try again."

STORY POINTS: 5    PRIORITY: MUST
```

**US-02: User Login**
```
AS A registered user
I WANT TO log in with my email and password
SO THAT I can access my account

ACCEPTANCE CRITERIA:
  Given valid credentials
  When I submit the login form
  Then I receive a JWT token
  And I am redirected to /dashboard

  Given invalid credentials
  When I submit
  Then I see: "Invalid email or password"

  Given unverified account
  When I log in
  Then I see: "Please verify your email first"

STORY POINTS: 3    PRIORITY: MUST
```

**US-04: Profile Setup**
```
AS A logged-in user
I WANT TO set up my profile with bio, photo, skills
SO THAT other users can discover and connect with me

ACCEPTANCE CRITERIA:
  Given I am on /profile/edit
  When I upload a photo
  Then it is uploaded to Cloudinary and URL saved in DB
  And my photo appears in the header navbar immediately

  When I add skills (comma-separated or tags)
  Then they are searchable by other users

  When I add graduation year and company
  Then they appear on my public profile card

STORY POINTS: 5    PRIORITY: MUST
```

---

### Sprint 2 — Networking & Career Board Core (Weeks 3–4)
**Goal:** Users can connect, and alumni can post opportunities

**Sprint Backlog:** US-06, US-07, US-08, US-09, US-11, US-12, US-13, US-16
**Story Points:** 30

```
SPRINT 2 DEFINITION OF DONE
─────────────────────────────────────────────────────────────────
✓ Users can search other users by name, skill, company
✓ Users can follow/unfollow other users
✓ Alumni can post jobs, internships, referrals
✓ Students can apply to jobs with cover letter + resume link
✓ New job appears in real-time for all connected users (Socket.io)
✓ Job cards display type badge (Job / Internship / Referral)
✓ Applications are stored with status: "pending"
✓ Posting alumni can see applicant count
─────────────────────────────────────────────────────────────────
```

#### Sprint 2 — User Story Details

**US-11: Post a Job**
```
AS AN alumni
I WANT TO post a job or internship opportunity
SO THAT students can discover and apply for it

ACCEPTANCE CRITERIA:
  Given I am logged in as alumni on /jobs
  When I click "Post Opportunity" and fill all fields
  Then the job is saved in MongoDB
  And ALL connected students see it appear in real-time
  And a toast notification: "New {type}: {title} at {company}" shows

  Given required fields are missing
  When I submit
  Then I see inline validation errors

  Given I am a student (not alumni)
  Then "Post Opportunity" button is NOT visible

STORY POINTS: 5    PRIORITY: MUST
```

**US-12: Apply to a Job**
```
AS A student
I WANT TO apply to a posted job with a cover letter
SO THAT the alumni who posted can consider my application

ACCEPTANCE CRITERIA:
  Given I click "Apply Now"
  When the ApplyJobModal opens
  Then I can enter a cover letter and resume link
  When I submit
  Then a JobApplication document is created with status: "pending"
  And the alumni poster receives a real-time notification

  Given I already applied to this job
  Then the button shows "Applied ✓" and is disabled
  And applying again returns: "You have already applied"

STORY POINTS: 5    PRIORITY: MUST
```

---

### Sprint 3 — Communication & Events (Weeks 5–6)
**Goal:** Real-time chat, events, and forum

**Sprint Backlog:** US-17, US-22, US-23, US-26, US-27, US-30, US-31, US-32, US-48, US-49
**Story Points:** 45

```
SPRINT 3 DEFINITION OF DONE
─────────────────────────────────────────────────────────────────
✓ Users can send real-time direct messages
✓ Online/offline status indicator works
✓ Events can be created with date, location, online/offline flag
✓ Students can RSVP to events
✓ Forum posts can be created with category and tags
✓ Posts support nested replies (1 level)
✓ Students can browse alumni mentors
✓ Mentorship requests can be sent and accepted/rejected
✓ In-app notifications appear in real-time
✓ Notification badge count is accurate
─────────────────────────────────────────────────────────────────
```

#### Sprint 3 — User Story Details

**US-17: Direct Messaging**
```
AS A user
I WANT TO send and receive real-time direct messages
SO THAT I can communicate privately with other users

ACCEPTANCE CRITERIA:
  Given I open a chat with another user
  When I type a message and press Enter
  Then the message appears in my chat window immediately
  And the receiver sees it in real-time without refreshing

  Given the receiver is offline
  When I send a message
  Then it is stored in MongoDB
  And the receiver sees it when they next open the chat

  Given I send an image file
  Then it is uploaded to Cloudinary
  And the image renders inline in the chat

STORY POINTS: 8    PRIORITY: MUST
```

**US-31: Send Mentorship Request**
```
AS A student
I WANT TO request mentorship from an alumni
SO THAT I can receive guidance in my career

ACCEPTANCE CRITERIA:
  Given I am on an alumni's profile with "Available for mentoring"
  When I click "Request Mentorship"
  Then I can fill a message, goals, and availability
  When I submit
  Then a MentorshipRequest is created (status: pending)
  And the alumni receives a real-time notification

  Given the alumni accepts
  Then a Mentorship document is created (status: active)
  And I receive a notification: "{name} accepted your mentorship request"

  Given the alumni rejects
  Then I receive a notification: "Request declined"

STORY POINTS: 5    PRIORITY: MUST
```

---

### Sprint 4 — DevPulse & Leaderboard (Weeks 7–8)
**Goal:** Coding platform integrations fully working

**Sprint Backlog:** US-36–45, US-46, US-47, US-52, US-53, US-58
**Story Points:** 55

```
SPRINT 4 DEFINITION OF DONE
─────────────────────────────────────────────────────────────────
✓ Users can link GitHub, LeetCode, HackerRank, GFG, CodeChef, CF
✓ Bio verification flow works for each platform
✓ Stats are fetched and cached (2-hour cache)
✓ Alumnex Score calculated from all platforms
✓ Leaderboard shows all users ranked by score
✓ DevPulse page renders stats cards for each platform
✓ Activity heatmap from LeetCode calendar is rendered
✓ Admin can ban users, change roles, view reports
✓ Public DevPulse view works for other user profiles
─────────────────────────────────────────────────────────────────
```

#### Sprint 4 — User Story Details

**US-42: DevPulse Stats Dashboard**
```
AS A user
I WANT TO see all my coding stats in one place
SO THAT I can track my overall developer progress

ACCEPTANCE CRITERIA:
  Given I have linked accounts on /devpulse
  Then I see platform cards for each linked platform
  And each card shows relevant stats (repos, solved, rating etc.)
  And the Alumnex Score ring shows my total score out of 1000

  Given stats were last fetched < 2 hours ago
  Then cached data is returned without a new API call

  Given stats were last fetched > 2 hours ago
  Then all platform APIs are called in parallel
  And the refreshed stats are shown

  Given a platform API fails
  Then that platform card shows "Sync failed — will retry"
  And other platforms are NOT affected

STORY POINTS: 8    PRIORITY: MUST
```

**US-43: Real Badges from Platforms**
```
AS A user
I WANT TO see my actual earned badges from coding platforms
SO THAT my achievements are visually displayed on my profile

ACCEPTANCE CRITERIA:
  Given I have earned badges on LeetCode
  Then real medal GIF images appear in the Badges section
  And the badge name and earn date are shown on hover

  Given I have HackerRank badges with star ratings
  Then each badge shows its name, domain, and star rating
  And the star color reflects the badge level

  Given a badge image URL fails to load
  Then a fallback emoji icon is displayed
  And no broken image icon appears

STORY POINTS: 8    PRIORITY: SHOULD
```

---

### Sprint 5 — Polish, Gamification & AI (Weeks 9–10)
**Goal:** Remaining features, gamification, AI integration, final QA

**Sprint Backlog:** US-20, US-24, US-29, US-35, US-47, US-50, US-51, US-54, US-55, US-56, US-57, US-59, US-60
**Story Points:** 62

```
SPRINT 5 DEFINITION OF DONE
─────────────────────────────────────────────────────────────────
✓ Contest creation and registration is live
✓ Project showcase posting works
✓ AI resume analyzer returns feedback
✓ Admin analytics dashboard shows real-time stats
✓ SMS notifications via Twilio work
✓ Mentor reward leaderboard is functional
✓ Message reactions with emojis work
✓ All verified platform links are editable
✓ Real badge images render from all platforms
✓ Leaderboard country filter works
✓ End-to-end testing complete
✓ Performance audit passed (Lighthouse score > 85)
─────────────────────────────────────────────────────────────────
```

---

## PART 4: UML DIAGRAMS (Agile / Use-Case Focused)

### 4.1 USE CASE DIAGRAM — Full System

```
                        ┌─────────────────────────────────────────────────────┐
                        │              Alumni Connect System                   │
                        │                                                      │
  ┌──────────┐          │  ┌──────────────────────────────────────────────┐   │
  │ «actor»  │          │  │ AUTHENTICATION                                │   │
  │ Student  │────────────►│  ○ Register        ○ Login                   │   │
  └──────────┘          │  │  ○ Verify OTP      ○ Reset Password          │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
       │                │  ┌──────────────────────────────────────────────┐   │
       │                │  │ CAREER BOARD                                  │   │
       ├──────────────────►│  ○ Browse Jobs     ○ Apply to Job            │   │
       │                │  │  ○ Request Referral○ Filter Opportunities     │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
       │                │  ┌──────────────────────────────────────────────┐   │
       │                │  │ DEVPULSE                                      │   │
       ├──────────────────►│  ○ Link Platform   ○ Verify Platform         │   │
       │                │  │  ○ View Stats      ○ View Badges             │   │
       │                │  │  ○ View Leaderboard○ Edit Linked Account     │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
       │                │  ┌──────────────────────────────────────────────┐   │
       │                │  │ MENTORSHIP                                    │   │
       ├──────────────────►│  ○ Browse Mentors  ○ Send Request            │   │
       │                │  │  ○ Log Session     ○ Rate Mentor             │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
  ┌──────────┐          │  ┌──────────────────────────────────────────────┐   │
  │ «actor»  │          │  │ COMMUNICATION                                 │   │
  │  Alumni  │────────────►│  ○ Send Message    ○ Create Group            │   │
  └──────────┘          │  │  ○ Share Files     ○ React to Messages       │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
       │                │  ┌──────────────────────────────────────────────┐   │
       │                │  │ ALUMNI-SPECIFIC                               │   │
       ├──────────────────►│  ○ Post Job/Internship/Referral               │   │
       │                │  │  ○ Accept/Reject Mentorship Request           │   │
       │                │  │  ○ Create Events   ○ Manage Applications     │   │
       │                │  └──────────────────────────────────────────────┘   │
       │                │                                                      │
  ┌──────────┐          │  ┌──────────────────────────────────────────────┐   │
  │ «actor»  │          │  │ ADMIN-SPECIFIC                                │   │
  │  Admin   │────────────►│  ○ Manage Users    ○ Ban Accounts            │   │
  └──────────┘          │  │  ○ View Analytics  ○ Moderate Content       │   │
                        │  │  ○ Create Contests ○ Send Announcements      │   │
                        │  └──────────────────────────────────────────────┘   │
                        └─────────────────────────────────────────────────────┘
```

---

### 4.2 ACTIVITY DIAGRAM — Full User Journey (Student)

```
[Student Opens App]
        │
        ▼
  ─────────────────────────────────────────────
  Have an account?
  ─────────────────────────────────────────────
       NO │                        │ YES
          ▼                        ▼
   [Register Form]          [Login Form]
          │                        │
          ▼                        ▼
   [OTP Email Sent]         [JWT Issued]
          │                        │
          ▼                        │
   [Verify OTP]                    │
          │                        │
          └─────────────────────────
                      │
                      ▼
              [DASHBOARD HOME]
              ─────────────────────────────────────
              Student sees: Feed, Connections, Alerts
              ─────────────────────────────────────
                      │
        ┌─────────────┼─────────────────────────────┐
        ▼             ▼              ▼               ▼
  [Browse Jobs]  [DevPulse]   [Mentorship]   [Forum / Events]
        │             │              │               │
        ▼             ▼              ▼               ▼
  [Apply with    [Link GitHub   [Send Request  [Post or Reply
   Cover Letter]  LeetCode etc]  to Alumni]     to Thread]
        │             │              │               │
        ▼             ▼              ▼               ▼
  [Track status] [View Badges  [Track session  [Get likes and
  in Applications & Score]      calendar]       replies]
```

---

### 4.3 SEQUENCE DIAGRAM — DevPulse Platform Verification

```
Student     Settings Page    Backend API    Platform API    MongoDB
   │              │               │               │             │
   │──open page──►│               │               │             │
   │              │──GET profile──►│               │             │
   │              │               │──findOne()────────────────────►│
   │              │◄──usernames────│◄──DevProfile──────────────────│
   │              │               │               │             │
   │──type GitHub─►│               │               │             │
   │  username    │               │               │             │
   │──click Save──►│               │               │             │
   │              │──POST /usernames►│              │             │
   │              │               │──save()───────────────────────►│
   │              │◄──{usernames}──│               │             │
   │              │               │               │             │
   │──click Gen───►│               │               │             │
   │  Code        │──POST /generate►│              │             │
   │              │               │──save code────────────────────►│
   │              │◄──{code}───────│               │             │
   │              │               │               │             │
   │──paste code  │               │               │             │
   │  to GitHub   │               │               │             │
   │  bio         │               │               │             │
   │──click Verify►│              │               │             │
   │              │──POST /verify──►│              │             │
   │              │               │──fetch GitHub──►│            │
   │              │               │◄──bio HTML─────│            │
   │              │               │──check code    │            │
   │              │               │──isVerified=true           │
   │              │               │──save()───────────────────────►│
   │              │◄──{verified}───│               │             │
   │◄──✓ Verified─│               │               │             │
```

---

### 4.4 SEQUENCE DIAGRAM — Real-Time Job Application

```
Student      Jobs Page     Socket.io      Backend      MongoDB    Alumni
   │              │             │              │            │         │
   │──open /jobs──►│             │              │            │         │
   │              │──socket.on──►│              │            │         │
   │              │             │──job:new─────►│            │         │
   │              │◄──new job───│              │            │         │
   │──click Apply─►│             │              │            │         │
   │              │──show modal──│              │            │         │
   │──fill & submit►│            │              │            │         │
   │              │──POST /apply─────────────────►│           │         │
   │              │             │              │──save()────►│         │
   │              │             │              │──emit notif─►│        │
   │              │             │◄─────────────│             │         │
   │              │             │──notification:received──────────────►│
   │◄──"Applied ✓"─│            │              │            │   │◄─new applicant
```

---

### 4.5 SEQUENCE DIAGRAM — Real-Time Chat

```
UserA        Chat UI      SocketContext    Backend Socket     MongoDB    UserB
  │              │               │                │               │         │
  │──open chat──►│               │                │               │         │
  │              │──GET history──────────────────►│               │         │
  │              │               │                │──find msgs────►│         │
  │              │◄──messages─────────────────────│               │         │
  │──type msg────►│               │                │               │         │
  │──press Enter─►│               │                │               │         │
  │              │──emit:message:send─────────────►│               │         │
  │              │               │                │──save()────────►│        │
  │              │               │                │──emit to UserB──────────►│
  │◄──msg in UI──│               │                │               │    │◄──message:receive
  │              │               │                │               │    │──msg in UI
  │              │               │                │               │         │
```

---

### 4.6 STATE DIAGRAM — Job Application Status

```
                     ┌──────────────┐
          submit ──► │   PENDING    │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ REVIEWED │  │ ACCEPTED │  │ REJECTED │
       └──────────┘  └──────────┘  └──────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
 ┌──────────┐  ┌──────────┐
 │ ACCEPTED │  │ REJECTED │
 └──────────┘  └──────────┘
```

---

### 4.7 STATE DIAGRAM — Mentorship Request Lifecycle

```
         [Student Submits Request]
                    │
                    ▼
            ┌───────────────┐
            │    PENDING     │ ◄── initial state
            └───────┬───────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
  ┌───────────────┐    ┌───────────────┐
  │   ACCEPTED    │    │   REJECTED    │
  └───────┬───────┘    └───────────────┘
          │
          ▼
  ┌───────────────┐
  │    ACTIVE     │ ◄── Mentorship document created
  └───────┬───────┘
          │
    ┌─────┴──────┐
    ▼            ▼
┌───────┐   ┌──────────┐
│PAUSED │   │COMPLETED │
└───┬───┘   └──────────┘
    │
    ▼
┌────────┐
│RESUMED │──► ACTIVE
└────────┘
```

---

### 4.8 STATE DIAGRAM — DevProfile Platform Account

```
[User enters username]
          │
          ▼
    ┌───────────────┐
    │   UNVERIFIED  │ ◄── default
    └───────┬───────┘
            │ click Generate Code
            ▼
    ┌───────────────┐
    │  CODE ISSUED  │ (24hr expiry)
    └───────┬───────┘
            │ paste to bio, click Verify
      ┌─────┴──────────┐
      ▼                ▼
┌──────────┐     ┌───────────────┐
│ VERIFIED │     │ CODE EXPIRED  │──► regenerate
└─────┬────┘     └───────────────┘
      │
      │ click Edit button
      ▼
┌──────────────────┐
│ EDIT MODE        │ (isVerified = false, input unlocked)
└──────────────────┘
      │
      │ change username → Save → Verify again
      ▼
┌──────────┐
│ VERIFIED │ (new username)
└──────────┘
```

---

### 4.9 COMPONENT DIAGRAM — Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.js (Router)                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Context Providers                          │   │
│  │  AuthContext (user, token)   SocketContext (socket, online) │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │   Layout.js       │  │   Sidebar.js      │  │  Navbar.js     │   │
│  │  (main wrapper)   │  │  (navigation)     │  │  (top bar)     │   │
│  └──────────────────┘  └──────────────────┘  └────────────────┘   │
│                                                                     │
│  ┌─────────┐ ┌────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard│ │  Jobs  │ │ DevPulse  │ │Mentorship│ │ Network  │  │
│  └────┬────┘ └───┬────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │          │             │              │            │        │
│  ┌────▼────────────────────────▼──────────────▼────────────▼──┐   │
│  │              Shared Components                               │   │
│  │  UserAvatar  │  Modal  │  Toast  │  StatPill  │  BadgeCard  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    utils/api.js (Axios instance)             │   │
│  │              Base URL + JWT interceptor + error handler      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.10 COMPONENT DIAGRAM — Backend Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        server.js (Entry Point)                     │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│  │  Express App  │   │  Socket.io   │   │  MongoDB Connection    │  │
│  │  (REST API)   │   │  Server      │   │  (Mongoose)           │  │
│  └──────┬───────┘   └──────┬───────┘   └───────────────────────┘  │
│         │                  │                                        │
│  ┌──────▼───────────────────▼──────────────────────────────────┐   │
│  │                 Middleware Layer                              │   │
│  │  morgan (logging) │ cors │ helmet │ express.json │ protect() │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       Routes                                  │  │
│  │  /auth  /users  /jobs  /events  /forum  /messages            │  │
│  │  /mentorship  /dev-activity  /notifications  /admin          │  │
│  │  /contests  /projects  /leaderboard  /ai                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       Models (MongoDB)                        │  │
│  │  User │ Job │ Event │ Forum │ Message │ Mentorship │ Contest  │  │
│  │  DevProfile │ Notification │ JobApplication │ MentorReward   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Utils / Services                         │  │
│  │  devStatsFetcher.js │ sendEmail.js │ cloudinary.js           │  │
│  │  socketHandler.js   │ protect.js   │ generateOTP.js          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

### 4.11 DEPLOYMENT DIAGRAM

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLOUD INFRASTRUCTURE                       │
│                                                                   │
│  ┌────────────────────────┐    ┌────────────────────────────┐   │
│  │   Vercel / Netlify     │    │   Render / Railway          │   │
│  │   (Frontend CDN)       │    │   (Backend Node.js)         │   │
│  │                        │    │                             │   │
│  │   React Build (dist/)  │    │   Express + Socket.io       │   │
│  │   Static Assets        │    │   PORT 5000                 │   │
│  │   Auto SSL (HTTPS)     │    │   Auto SSL (HTTPS)          │   │
│  └──────────┬─────────────┘    └──────────┬──────────────────┘  │
│             │                             │                       │
│             │    HTTP / WebSocket         │                       │
│             └────────────────────────────┘                       │
│                                                                   │
│  ┌────────────────────────┐    ┌────────────────────────────┐   │
│  │   MongoDB Atlas        │    │   Cloudinary CDN            │   │
│  │   (Cloud Database)     │    │   (Media Storage)           │   │
│  │                        │    │                             │   │
│  │   M0 Free / M10 Paid  │    │   User photos               │   │
│  │   Auto-backup          │    │   Chat images               │   │
│  │   Replica set          │    │   Event banners             │   │
│  └────────────────────────┘    └────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────┐    ┌────────────────────────────┐   │
│  │   GitHub               │    │   External APIs             │   │
│  │   (Version Control)    │    │                             │   │
│  │                        │    │   GitHub API (REST)         │   │
│  │   master branch        │    │   LeetCode GraphQL          │   │
│  │   Auto-deploy on push  │    │   Codeforces API            │   │
│  │                        │    │   HackerRank REST           │   │
│  │                        │    │   GFG Auth API + Scraping   │   │
│  │                        │    │   CodeChef HTML Scraping    │   │
│  └────────────────────────┘    └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## PART 5: AGILE CEREMONIES DOCUMENTATION

### 5.1 Sprint Review Template (Used After Each Sprint)

```
SPRINT [N] REVIEW
──────────────────────────────────────────
Date:          [date]
Sprint Goal:   [goal statement]
Team:          Frontend Dev, Backend Dev, Scrum Master

COMPLETED (✓):
  - US-XX: [story name]    [story points]
  - US-XX: [story name]    [story points]

INCOMPLETE (rolled to next sprint):
  - US-XX: [story name]    [reason: technical debt / scope creep]

VELOCITY:
  Planned: [X] pts   Completed: [Y] pts   Variance: [%]

DEMO HIGHLIGHTS:
  - [feature 1 demoed to stakeholders]
  - [feature 2 demoed]

STAKEHOLDER FEEDBACK:
  - [feedback item 1]
  - [feedback item 2]
──────────────────────────────────────────
```

### 5.2 Sprint Retrospective Template

```
SPRINT [N] RETROSPECTIVE
──────────────────────────────────────────
WENT WELL (Keep doing):
  ✓ Real-time socket testing before release
  ✓ Daily standups kept team aligned
  ✓ Code review for all PRs

COULD IMPROVE (Stop doing):
  ✗ Merging untested code on Fridays
  ✗ Skipping edge-case API error handling
  ✗ Under-estimating scraping complexity

ACTION ITEMS:
  1. Add integration tests for Socket.io events
     Owner: Backend Dev    Due: Sprint N+1 Day 3
  2. Create a shared Postman collection for APIs
     Owner: Both Devs      Due: Sprint N+1 Day 1
──────────────────────────────────────────
```

### 5.3 Daily Standup Format

```
Each team member answers 3 questions:

1. DONE (Yesterday):
   "I completed the LeetCode GraphQL badge fetching
    and fixed the icon URL resolution bug."

2. DOING (Today):
   "I am working on the BadgeCard component to
    display real images with onError fallback."

3. BLOCKERS:
   "Blocked: CodeChef CDN returns 403 for star SVGs.
    Need to find alternative badge image source."
```

---

## PART 6: DEFINITION OF DONE (DoD)

```
A User Story is DONE when ALL of the following are true:
──────────────────────────────────────────────────────────
✓ Code is written and committed to Git (feature branch)
✓ Pull Request is opened and reviewed by at least 1 peer
✓ All acceptance criteria from the user story are met
✓ API endpoints tested in Postman with success/error cases
✓ Frontend renders correctly in Chrome, Firefox, Edge
✓ Mobile responsive layout verified (min 375px width)
✓ No console errors or warnings in browser DevTools
✓ Loading states and error states are handled in UI
✓ Socket.io events tested with 2+ concurrent connections
✓ Sensitive data NOT exposed in API responses
✓ All user-facing text is correctly spelled/grammatical
✓ Feature merged to master branch
✓ Deployed to staging and manually verified
──────────────────────────────────────────────────────────
```

---

## PART 7: AGILE METRICS

### 7.1 Velocity Chart (Estimated)

```
Sprint │ Planned │ Completed │ Velocity │ Notes
───────┼─────────┼───────────┼──────────┼──────────────────────────
  0    │  N/A    │   N/A     │   N/A    │ Setup sprint
  1    │   18    │    18     │   18     │ Auth flows smooth
  2    │   30    │    28     │   28     │ Socket.io took extra time
  3    │   45    │    40     │   40     │ Chat DMs complex
  4    │   55    │    50     │   50     │ Scraping bugs on GFG/CC
  5    │   62    │    55     │   55     │ AI feature scope reduced
───────┼─────────┼───────────┼──────────┼──────────────────────────
TOTAL  │  210    │   191     │   191    │ 91% completion rate
```

### 7.2 Burndown Chart Description (Sprint 4)

```
Sprint 4 Burndown (55 points, 10 days)

Day │ Ideal Remaining │ Actual Remaining
────┼─────────────────┼─────────────────
  0 │       55        │       55
  1 │       49.5      │       52    (slower start)
  2 │       44        │       47
  3 │       38.5      │       40
  4 │       33        │       34
  5 │       27.5      │       28    (on track)
  6 │       22        │       20    (ahead!)
  7 │       16.5      │       15
  8 │       11        │       10
  9 │       5.5       │        6
 10 │        0        │        5    (5 pts rolled)

Observation: Strong mid-sprint delivery, 5 pts (US-47 country filter)
             rolled to Sprint 5 due to API rate limit issue.
```

### 7.3 Risk Register

```
ID  │ Risk                              │ Prob │ Impact │ Mitigation
────┼───────────────────────────────────┼──────┼────────┼────────────────────────────
R01 │ Platform APIs blocked/rate limited │ HIGH │ HIGH   │ Cache 2hr, graceful fallback
R02 │ Socket.io performance under load  │ MED  │ HIGH   │ Redis adapter for multi-node
R03 │ Cloudinary free tier limits       │ MED  │ MED    │ Image compression before upload
R04 │ MongoDB Atlas free tier storage   │ MED  │ MED    │ Prune old notifications/msgs
R05 │ LeetCode/GFG HTML structure change│ HIGH │ MED    │ Test scrapers weekly, use APIs
R06 │ JWT token expiry UX issues        │ LOW  │ MED    │ Auto-refresh token middleware
R07 │ CORS errors in production         │ LOW  │ HIGH   │ Whitelist production domains
R08 │ User data privacy (GDPR)          │ MED  │ HIGH   │ No PII storage beyond profile
```

---

## PART 8: FEATURE INTERACTION FLOWCHART (Cross-Module)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HOW MODULES INTERACT                             │
│                                                                     │
│  AUTH ──────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │ user.role                                                    │  │
│   ├──────────────────────────────────────────────────────────┐  │  │
│   │                                                          │  │  │
│   ▼                                                          ▼  │  │
│  NETWORK ──────────────────►  CHAT  ◄──────────────────  JOBS  │  │
│  (find users)               (DMs)               (referral DM)  │  │
│      │                        │                        │       │  │
│      │ mentor discovery       │ alumni-student          │       │  │
│      ▼                        │                        │       │  │
│  MENTORSHIP ◄─────────────────┘                        │       │  │
│      │                                                 │       │  │
│      │ sessions logged                                 │       │  │
│      ▼                                                 │       │  │
│  MENTOR LEADERBOARD                                    │       │  │
│                                                        │       │  │
│  DEVPULSE ◄────────────────────────────────────────────┘       │  │
│      │                                                          │  │
│      │ alumnexScore                                             │  │
│      ▼                                                          │  │
│  LEADERBOARD ──────────────────────────────────────────────────┘  │
│                                                                     │
│  NOTIFICATIONS ◄── triggered by ALL modules                        │
│  ADMIN ──────────── moderates ALL modules                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 2.0*
*Methodology: Scrum / Agile (5 Sprints × 2 weeks)*
*Total Story Points: 210 planned / 191 delivered*
*Team: 2 Full-Stack Developers + 1 Scrum Master*
*Platform: Alumni Connect Website (AlumnexConnect)*
