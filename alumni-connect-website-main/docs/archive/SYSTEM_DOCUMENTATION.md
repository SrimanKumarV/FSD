# Alumni Connect Website — Complete System Documentation
## Flowcharts, UML Diagrams & Architecture Descriptions

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### Technology Stack
```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                       │
│  React 18 · React Router v6 · React Query · Framer Motion       │
│  Socket.io-client · Recharts · CalendarHeatmap · Lucide Icons   │
└──────────────────────┬───────────────────────────────────────────┘
                       │  HTTP (Axios) + WebSocket (Socket.io)
┌──────────────────────▼───────────────────────────────────────────┐
│                     BACKEND (Node.js / Express.js)               │
│  Express · Socket.io · JWT Auth · Mongoose · Multer · Nodemailer│
│  Cloudinary (images) · OpenAI API · Cheerio (scraping)          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                    DATABASE (MongoDB Atlas)                       │
│  23 Collections: User, Job, Event, Message, DevProfile,          │
│  Mentorship, ForumPost, Contest, Notification, JobApplication... │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. USER AUTHENTICATION FLOW

### 2.1 Flowchart — Registration & Login

```
[User Visits /register or /login]
         │
         ▼
[Fill Form: name, email, password, role]
         │
    ─────┼─────────────────────────────────
    │                                     │
[REGISTER]                           [LOGIN]
    │                                     │
    ▼                                     ▼
[POST /api/auth/register]       [POST /api/auth/login]
    │                                     │
    ▼                                     ▼
[Hash password (bcrypt)]        [Compare password (bcrypt)]
    │                                     │
    ▼                                     ▼
[Create User document]          [Check if verified]
    │                                     │
    ▼                                     ├─ NO ──► [Return 401 "Not Verified"]
[Send OTP email]                          │
    │                                     ▼
    ▼                              [Sign JWT Token]
[User enters OTP]                         │
    │                                     ▼
    ▼                           [Return { token, user }]
[POST /api/auth/verify-otp]               │
    │                                     ▼
    ├─ VALID ──► [Mark verified]   [Store in localStorage]
    │                                     │
    └─ INVALID ─► [Resend OTP]           ▼
                                  [Set AuthContext]
                                         │
                                         ▼
                                  [Redirect to /dashboard]
```

### 2.2 UML Sequence Diagram — JWT Auth Flow

```
User          Frontend         Backend          MongoDB
 │                │                │                │
 │──Fill form────►│                │                │
 │                │──POST /auth────►│                │
 │                │                │──findOne()─────►│
 │                │                │◄──User doc──────│
 │                │                │──bcrypt.compare()│
 │                │                │──sign JWT()     │
 │                │◄──{token,user}──│                │
 │                │──localStorage───│                │
 │◄──Dashboard────│                │                │
```

### 2.3 UML Class Diagram — User Model

```
┌────────────────────────────────────────┐
│                  User                  │
├────────────────────────────────────────┤
│ _id: ObjectId                          │
│ name: String                           │
│ email: String (unique)                 │
│ password: String (hashed)              │
│ role: Enum[student, alumni, admin]     │
│ photo: String (Cloudinary URL)         │
│ isVerified: Boolean                    │
│ otp: String                            │
│ otpExpires: Date                       │
│ skills: [String]                       │
│ interests: [String]                    │
│ bio: String                            │
│ company: String                        │
│ graduationYear: Number                 │
│ phoneNumber: String                    │
│ phoneVerified: Boolean                 │
│ smsNotifications: Boolean              │
│ connections: [ObjectId → User]         │
│ followers: [ObjectId → User]           │
│ following: [ObjectId → User]           │
│ createdAt: Date                        │
├────────────────────────────────────────┤
│ + comparePassword()                    │
│ + generateOTP()                        │
└────────────────────────────────────────┘
```

---

## 3. CAREER BOARD MODULE (JOBS / INTERNSHIPS / REFERRALS)

### 3.1 Flowchart — Job Posting (Alumni Flow)

```
[Alumni logs in]
       │
       ▼
[Navigates to /jobs]
       │
       ▼
[Clicks "Post Opportunity"]
       │
       ▼
[PostJobModal opens]
       │
       ▼
[Fills: title, company, type, description,
 location, salary, applicationLink, deadline]
       │
       ▼
[POST /api/jobs]
       │
       ▼
[Backend saves Job document]
       │
       ├──► [Socket.io emits job:new to ALL connected clients]
       │
       ▼
[All connected Students see NEW JOB appear in real-time]
       │
       ▼
[Toast notification: "New job posted: {title} at {company}"]
```

### 3.2 Flowchart — Job Application (Student Flow)

```
[Student clicks "Apply Now" on a job]
              │
              ▼
     [ApplyJobModal opens]
              │
              ▼
  [Student fills Cover Letter + Resume Link]
              │
              ▼
     [POST /api/jobs/:id/apply]
              │
       ┌──────┴───────────┐
       ▼                  ▼
[Already applied?]   [Job exists?]
       │                  │
      YES                 NO
       │                  │
       ▼                  ▼
[Return 400         [Return 404
 "Already applied"]  "Not found"]
                          │
                         YES
                          │
                          ▼
             [Create JobApplication doc
              status: "pending"]
                          │
                          ▼
             [Socket.io → emit notification
              to Job Poster (Alumni)]
                          │
                          ▼
             [Alumni gets real-time notification:
              "{Student} applied for {Job}"]
```

### 3.3 Flowchart — Referral Request

```
[Student clicks "Request Referral" on referral post]
                    │
                    ▼
        [Socket.io message:send event emitted]
                    │
                    ▼
        [Auto-generates DM to Alumni:
         "Hi! I saw your referral at {Company}
          and I'm very interested..."]
                    │
                    ▼
        [Alumni receives Direct Message in Chat]
                    │
                    ▼
        [Button changes to "Requested" (disabled)]
```

### 3.4 UML Class Diagram — Job & Application Models

```
┌──────────────────────────┐      ┌──────────────────────────┐
│          Job             │      │     JobApplication        │
├──────────────────────────┤      ├──────────────────────────┤
│ _id: ObjectId            │      │ _id: ObjectId             │
│ title: String            │      │ jobId: ObjectId → Job     │
│ company: String          │      │ applicantId: ObjectId → User│
│ type: Enum               │◄─────│ coverLetter: String       │
│ description: String      │      │ resumeLink: String        │
│ location: String         │      │ status: Enum              │
│ salary: String           │      │  [pending, reviewed,      │
│ applicationLink: String  │      │   accepted, rejected]     │
│ postedBy: ObjectId→User  │      │ createdAt: Date           │
│ deadline: Date           │      └──────────────────────────┘
│ isActive: Boolean        │
│ createdAt: Date          │
└──────────────────────────┘
```

---

## 4. REAL-TIME CHAT SYSTEM

### 4.1 Flowchart — Direct Message Flow

```
[User A opens Chat with User B]
           │
           ▼
    [Frontend connects via Socket.io]
           │
           ▼
    [GET /api/messages/:userId — load history]
           │
           ▼
    [User A types message, hits Send]
           │
           ▼
    [Socket.io emits: message:send]
    { receiverId, content, messageType }
           │
           ▼
    [Backend socketHandler receives event]
           │
     ┌─────┴─────────┐
     ▼               ▼
[Save Message    [Emit message:receive
 to MongoDB]      to User B's socket]
     │               │
     ▼               ▼
[Message stored] [User B sees message
                  instantly in UI]
                      │
                      ▼
             [Unread badge updates
              in Sidebar for User B]
```

### 4.2 Flowchart — Group Chat Flow

```
[User creates Group Chat]
         │
         ▼
[POST /api/messages/group/create]
{ name, members: [userId, ...] }
         │
         ▼
[ChatGroup document created]
         │
         ▼
[All members added to Socket.io room]
         │
         ▼
[User sends message to group]
         │
         ▼
[Socket.io: group:message event]
         │
         ▼
[Broadcast to ALL members in the room]
         │
         ▼
[Each member's UI updates in real-time]
```

### 4.3 UML Sequence Diagram — Socket.io Connection

```
Client            SocketContext          socketHandler.js       MongoDB
  │                    │                       │                   │
  │──connect()────────►│                       │                   │
  │                    │──socket.connect()─────►│                   │
  │                    │                       │──authenticate JWT─►│
  │                    │                       │◄──user found───────│
  │                    │                       │──add to onlineUsersMap
  │                    │◄──connected────────────│                   │
  │◄──onlineUsersMap───│                       │                   │
  │                    │                       │                   │
  │──message:send──────►────────────────────────►│                  │
  │                    │                       │──save Message()───►│
  │                    │                       │──emit to receiver  │
```

### 4.4 UML Class Diagram — Message Model

```
┌─────────────────────────────────┐
│            Message              │
├─────────────────────────────────┤
│ _id: ObjectId                   │
│ sender: ObjectId → User         │
│ receiver: ObjectId → User       │
│ group: ObjectId → ChatGroup     │
│ content: String                 │
│ messageType: Enum               │
│  [text, image, file, voice,     │
│   system, referral_request]     │
│ fileUrl: String                 │
│ fileName: String                │
│ readBy: [ObjectId → User]       │
│ reactions: [{userId, emoji}]    │
│ replyTo: ObjectId → Message     │
│ isEdited: Boolean               │
│ isDeleted: Boolean              │
│ createdAt: Date                 │
└─────────────────────────────────┘
```

---

## 5. MENTORSHIP MODULE

### 5.1 Flowchart — Mentorship Request Flow

```
[Student browses Alumni Mentors]
            │
            ▼
    [Clicks "Request Mentorship"]
            │
            ▼
    [Fills: message, goals, availability]
            │
            ▼
    [POST /api/mentorship/request]
            │
            ▼
    [MentorshipRequest doc created
     status: "pending"]
            │
            ▼
    [Alumni gets Notification + Email]
            │
         ┌──┴──────────────┐
         ▼                 ▼
    [Alumni Accepts]  [Alumni Declines]
         │                 │
         ▼                 ▼
 [Mentorship doc      [Request status
  created: "active"]   = "rejected"]
         │
         ▼
 [Socket.io notifies
  Student: "Accepted!"]
         │
         ▼
 [Session scheduling available]
         │
         ▼
 [Sessions logged →
  MentorReward points calculated]
```

### 5.2 UML Class Diagram — Mentorship Models

```
┌─────────────────────┐     ┌──────────────────────┐
│  MentorshipRequest  │     │     Mentorship         │
├─────────────────────┤     ├──────────────────────┤
│ student: ObjectId   │     │ mentor: ObjectId→User │
│ mentor: ObjectId    │     │ mentee: ObjectId→User │
│ message: String     │     │ status: Enum          │
│ goals: [String]     │     │  [active,completed,   │
│ status: Enum        │     │   paused, terminated] │
│  [pending,          │     │ sessions: [ObjectId]  │
│   accepted,         │     │ sessionCount: Number  │
│   rejected]         │     │ totalHours: Number    │
│ createdAt: Date     │     │ nextSession: Date     │
└─────────────────────┘     │ createdAt: Date       │
                            └──────────────────────┘
                                       │
                             ┌─────────┴──────────┐
                             ▼                    ▼
               ┌──────────────────┐  ┌─────────────────────┐
               │ MentorshipSession│  │    MentorReward      │
               ├──────────────────┤  ├─────────────────────┤
               │ mentorship: OId  │  │ mentor: ObjectId     │
               │ date: Date       │  │ totalPoints: Number  │
               │ duration: Number │  │ sessionsCount: Number│
               │ notes: String    │  │ rank: Number         │
               │ status: Enum     │  │ badges: [String]     │
               └──────────────────┘  └─────────────────────┘
```

---

## 6. DEVPULSE MODULE (Coding Platform Integration)

### 6.1 Flowchart — Platform Linking & Verification

```
[User goes to Settings → DevPulse Integrations]
                    │
                    ▼
          [Enters username for platform]
                    │
                    ▼
          [Clicks "Save Usernames"]
                    │
                    ▼
          [POST /api/dev-activity/usernames]
          [Backend saves username, isVerified:false]
                    │
                    ▼
          [User clicks "Generate Code"]
                    │
                    ▼
          [POST /api/dev-activity/generate-code]
          [Backend creates: ALUMNEX_VERIFY_XXXXXXXX]
                    │
                    ▼
          [User copies code to platform bio/summary]
                    │
                    ▼
          [User clicks "Verify" next to platform]
                    │
                    ▼
          [POST /api/dev-activity/verify-platform]
          { platform, username (current UI state) }
                    │
                    ▼
          [Backend: isVerified = true, saves username]
          [Clears lastUpdated → forces stats refresh]
                    │
                    ▼
          [Next visit to DevPulse: fresh stats fetched]
                    │
                    ▼
          [User can click "Edit" anytime to unlink
           and re-link a different username]
```

### 6.2 Flowchart — Stats & Badge Fetching Pipeline

```
[GET /api/dev-activity/:email]
           │
           ▼
  [Find DevProfile in MongoDB]
           │
      ┌────┴──────────────────────┐
      ▼                           ▼
[Profile found?]           [Profile NOT found]
      │ YES                       │
      ▼                           ▼
[Cache valid?              [Return 404]
 < 2 hours old?]
      │
  ┌───┴───────┐
  │ YES       │ NO (or forced refresh)
  ▼           ▼
[Return     [Fetch ALL platforms IN PARALLEL]
 cached]     │
             ├──► fetchGitHubStats(username)
             │      └─► GitHub REST API + HTML scrape
             │          → publicRepos, followers, badges[]
             │
             ├──► fetchLeetCodeStats(username)
             │      └─► LeetCode GraphQL API
             │          → solved counts, real badge images
             │          → contest rating, calendar
             │
             ├──► fetchHackerRankStats(username)
             │      └─► HackerRank REST API
             │          → profile + badges with star ratings
             │
             ├──► fetchGFGStats(username)
             │      └─► GFG Auth API + HTML scrape
             │          → coding score, problems, streak
             │
             ├──► fetchCodechefStats(username)
             │      └─► CodeChef HTML scrape
             │          → rating, stars, division, problems
             │
             └──► fetchCodeforcesStats(username)
                    └─► Codeforces API (user.info + user.rating)
                        → rating, rank, contest count
             │
             ▼
     [Calculate Alumnex Score]
     score = (LC problems × difficulty weights)
           + (HR badges × 10)
           + (GFG score / 10)
           + (GH repos × 5)
           capped at 1000
             │
             ▼
     [Save to DevProfile.stats]
     [Save DevProfile.lastUpdated = now]
             │
             ▼
     [Return stats + usernames + badges + score]
```

### 6.3 Flowchart — DevPulse Page Rendering

```
[User navigates to /devpulse (own) or /devpulse/:userId (public)]
                            │
                            ▼
                  [React Query fetches data]
                            │
                      ┌─────┴──────────┐
                      ▼                ▼
               [Has profiles?]   [No profiles / 404]
                      │                │
                      ▼                ▼
              [Render full page]  [Empty state with
                      │            "Connect Accounts" CTA]
                      │
          ┌───────────┼────────────────────────┐
          ▼           ▼                        ▼
    [Hero Banner]  [6 Platform Cards]   [Activity Calendar]
    - Avatar       - GitHub             - LeetCode heatmap
    - Name         - LeetCode           (or mocked if no data)
    - Score Ring   - HackerRank         - Streak stats
                   - GFG
                   - CodeChef
                   - Codeforces
          │
          ▼
    [Analytics Row]
    - Skill Radar Chart
    - LeetCode Bar Chart
    - Quick Stats Pills
          │
          ▼
    [Badges & Awards Gallery]
    - Grouped by platform
    - Real badge images (with emoji fallback)
    - HackerRank: shows star ratings + domain
    - LeetCode: shows real medal GIF images
    - GitHub: achievement images from profile scrape
    - Hover → glow effect
```

### 6.4 UML Class Diagram — DevProfile Model

```
┌──────────────────────────────────────────┐
│               DevProfile                 │
├──────────────────────────────────────────┤
│ user: ObjectId → User                    │
│ email: String (unique)                   │
│ usernames: {                             │
│   github:     { username, isVerified }   │
│   leetcode:   { username, isVerified }   │
│   hackerrank: { username, isVerified }   │
│   gfg:        { username, isVerified }   │
│   codechef:   { username, isVerified }   │
│   codeforces: { username, isVerified }   │
│ }                                        │
│ stats: {                                 │
│   github:     Mixed (publicRepos,        │
│               followers, badges[])       │
│   leetcode:   Mixed (totalSolved, badges │
│               [] with imageUrl, calendar)│
│   hackerrank: Mixed (badgesCount,        │
│               badges[] with stars)       │
│   gfg:        Mixed (codingScore,        │
│               problemsSolved, badges[])  │
│   codechef:   Mixed (rating, stars,      │
│               division, badges[])        │
│   codeforces: Mixed (rating, rank,       │
│               contestCount, badges[])    │
│ }                                        │
│ alumnexScore: Number (0-1000)            │
│ lastUpdated: Date                        │
│ verificationCode: String                 │
│ verificationExpires: Date                │
└──────────────────────────────────────────┘
```

---

## 7. EVENTS MODULE

### 7.1 Flowchart — Event Creation & RSVP

```
[Alumni/Admin creates Event]
            │
            ▼
[POST /api/events]
{ title, description, date, time,
  timezone, location, isOnline,
  isFree, price, maxAttendees,
  registrationDeadline, category }
            │
            ▼
[Event document saved in MongoDB]
            │
            ▼
[Socket.io broadcasts event:new]
            │
            ▼
[All users see event in real-time]
            │
            ▼
[Student clicks "RSVP / Register"]
            │
            ▼
[POST /api/events/:id/rsvp]
            │
       ┌────┴────────────────────┐
       ▼                         ▼
[Capacity full?]          [Already RSVP'd?]
       │ NO                      │ NO
       ▼                         ▼
[Add user to              [Add userId to
 attendees[]]              event.attendees]
       │                         │
       ▼                         ▼
[Return updated           [Send confirmation
 attendees count]          notification]
```

### 7.2 UML Class Diagram — Event Model

```
┌───────────────────────────────────────┐
│               Event                   │
├───────────────────────────────────────┤
│ title: String                         │
│ description: String                   │
│ date: Date                            │
│ time: String                          │
│ timezone: String                      │
│ location: String                      │
│ isOnline: Boolean                     │
│ meetingLink: String                   │
│ isFree: Boolean                       │
│ price: Number                         │
│ category: Enum                        │
│  [workshop, webinar, hackathon,       │
│   networking, conference, other]      │
│ organizer: ObjectId → User            │
│ attendees: [ObjectId → User]          │
│ maxAttendees: Number                  │
│ registrationDeadline: Date            │
│ status: Enum [upcoming,ongoing,past]  │
│ bannerImage: String                   │
│ tags: [String]                        │
└───────────────────────────────────────┘
```

---

## 8. FORUM MODULE

### 8.1 Flowchart — Forum Post Lifecycle

```
[User creates Post]
       │
       ▼
[POST /api/forum]
{ title, content, category, tags }
       │
       ▼
[ForumPost doc saved]
       │
       ▼
[Displayed in Forum feed]
       │
       ▼
[Other users can:]
       │
  ┌────┼──────────────────┐
  ▼    ▼                  ▼
[Like] [Comment]     [Bookmark]
  │    │                  │
  ▼    ▼                  ▼
[PUT  [POST              [PUT
/like] /forum/:id/reply]  /bookmark]
  │    │
  ▼    ▼
[Real-time like count] [Nested replies supported]
                               │
                               ▼
                        [Reply on Reply
                         (2 levels deep)]
```

### 8.2 UML Class Diagram — ForumPost Model

```
┌───────────────────────────────────────┐
│             ForumPost                 │
├───────────────────────────────────────┤
│ title: String                         │
│ content: String                       │
│ author: ObjectId → User               │
│ category: Enum                        │
│  [general, career, technical,         │
│   alumni-stories, announcements]      │
│ tags: [String]                        │
│ likes: [ObjectId → User]              │
│ bookmarks: [ObjectId → User]          │
│ views: Number                         │
│ isPinned: Boolean                     │
│ isClosed: Boolean                     │
│ attachments: [String]                 │
│ replies: [{                           │
│   author: ObjectId                    │
│   content: String                     │
│   likes: [ObjectId]                   │
│   createdAt: Date                     │
│   replies: [...nested]                │
│ }]                                    │
│ createdAt: Date                       │
└───────────────────────────────────────┘
```

---

## 9. LEADERBOARD MODULE

### 9.1 Flowchart — Leaderboard Ranking

```
[GET /api/leaderboard]
        │
        ▼
[Fetch all DevProfiles
 with alumnexScore > 0]
        │
        ▼
[Sort by alumnexScore DESC]
        │
        ▼
[Join with User data
 (name, photo, company, graduationYear)]
        │
        ▼
[Add rank number]
        │
        ▼
[Support Filters:]
        │
  ┌─────┼──────────────┐
  ▼     ▼              ▼
[All] [By Country] [By Company]
  │
  ▼
[Return ranked profiles]
        │
        ▼
[Frontend renders:]
- Top 3 podium (1st/2nd/3rd with avatars)
- Infinite scroll table
- Highlight current user's row
- Click row → navigate to /devpulse/:userId
```

---

## 10. NOTIFICATION SYSTEM

### 10.1 Flowchart — Notification Lifecycle

```
[Any action triggers notification]
(job apply, mentorship request, message, etc.)
                │
                ▼
[Backend creates Notification doc]
{ recipient, sender, type, message, link }
                │
                ├──► [Save to MongoDB]
                │
                └──► [Socket.io: notification:received
                      emitted to recipient's socket]
                │
                ▼
[Recipient's UI:]
- Bell icon badge count increments
- Dropdown shows new notification
- Click → navigate to relevant page
                │
                ▼
[PUT /api/notifications/:id/read]
- Marks as read
- Badge count decrements
```

### 10.2 UML Class Diagram — Notification Model

```
┌────────────────────────────────────────┐
│             Notification               │
├────────────────────────────────────────┤
│ recipient: ObjectId → User             │
│ sender: ObjectId → User                │
│ type: Enum                             │
│  [message, connection, job_apply,      │
│   mentorship_request, mentorship_accept│
│   event_reminder, forum_reply,         │
│   badge_earned, system]                │
│ title: String                          │
│ message: String                        │
│ link: String                           │
│ isRead: Boolean (default: false)       │
│ metadata: Mixed                        │
│ createdAt: Date                        │
└────────────────────────────────────────┘
```

---

## 11. NETWORK / CONNECTIONS MODULE

### 11.1 Flowchart — Follow / Connect Flow

```
[User A views User B's profile]
              │
              ▼
    [Clicks "Connect" or "Follow"]
              │
              ▼
    [POST /api/users/:id/follow]
              │
        ┌─────┴──────────────┐
        ▼                    ▼
[Already following?]  [Not following]
        │ YES                │
        ▼                    ▼
[Unfollow:           [Add to A.following]
 Remove from lists]  [Add to B.followers]
                             │
                             ▼
                     [Create Notification
                      for User B]
                             │
                             ▼
                     [Socket.io push
                      to User B]
```

---

## 12. ADMIN MODULE

### 12.1 Flowchart — Admin Capabilities

```
[Admin logs in]
       │
       ▼
[Admin Dashboard]
       │
  ┌────┼────────────────────────────────────┐
  ▼    ▼          ▼           ▼             ▼
[User [Contests] [Reports]  [Analytics]  [System
 Mgmt]  │          │           │          Settings]
  │     │          │           │
  ▼     ▼          ▼           ▼
[View  [Create  [Review      [Total users
 all   /Edit    flagged       Active now
 users /Delete  content]      Revenue
 Ban   contests]             Signups/day]
 users
 Change
 roles]
```

---

## 13. COMPLETE UML ENTITY RELATIONSHIP DIAGRAM

```
User ──────────────────────────────────────────────────────────────
 │                                                                  │
 │1                                                                 │*
 ├──follows/followers──►[User]                                      │
 │                                                                  │
 │1                  *                                              │
 ├──────────────────►[Job] (postedBy)                               │
 │                          │                                       │
 │                          │1    *                                 │
 │                          └────►[JobApplication] (applicantId)◄──┘
 │
 │1                  *
 ├──────────────────►[Event] (organizer)
 │                      │*
 │                       └──[attendees]──►[User]
 │
 │1                  *
 ├──────────────────►[ForumPost] (author)
 │                      │
 │                      └──[replies[].author]──►[User]
 │
 │1                  1
 ├──────────────────►[DevProfile] (user)
 │                      │
 │                      └──[stats.{platform}.badges[]]
 │
 │1                  *
 ├──────────────────►[Mentorship] (mentor / mentee)
 │                      │1    *
 │                      └────►[MentorshipSession]
 │
 │1                  *
 ├──────────────────►[Message] (sender / receiver)
 │                      │
 │                  ┌───┤
 │                  ▼   ▼
 │            [Direct] [Group → ChatGroup]
 │
 │1                  *
 ├──────────────────►[Notification] (recipient / sender)
 │
 │1                  *
 └──────────────────►[Contest] (participants[])
```

---

## 14. REAL-TIME ARCHITECTURE (Socket.io)

### 14.1 Socket Event Map

```
CLIENT EMITS                    SERVER EMITS
─────────────────────────────────────────────────────────────────
message:send              ──►  message:receive      (to receiver)
group:message             ──►  group:message:receive (to room)
                               job:new               (to all)
                               job:deleted           (to all)
                               notification:received (to user)
                               user:online           (to all)
                               user:offline          (to all)
                               application:received  (to alumni)
```

### 14.2 Socket Room Strategy

```
[User Connects]
      │
      ▼
[Join personal room: socket.join(userId)]
      │
      ▼
[Join group rooms: socket.join(groupId) for each group]
      │
      ▼
[onlineUsersMap.set(userId, socketId)]
      │
      ▼
[Broadcast online status to connected users]
      │
      ▼
[On disconnect:]
[onlineUsersMap.delete(userId)]
[Broadcast offline status]
```

---

## 15. API ENDPOINT SUMMARY

```
AUTH         POST /api/auth/register, /login, /verify-otp, /forgot-password, /reset-password
USERS        GET/PUT /api/users/:id, GET /users/search, POST /users/:id/follow
JOBS         GET/POST /api/jobs, PUT/DELETE /api/jobs/:id
             POST /api/jobs/:id/apply
             GET /api/jobs/applications/me
             GET /api/jobs/:id/applications
             PUT /api/jobs/applications/:appId/status
EVENTS       GET/POST /api/events, PUT/DELETE /api/events/:id
             POST /api/events/:id/rsvp
FORUM        GET/POST /api/forum, PUT/DELETE /api/forum/:id
             POST /api/forum/:id/reply, PUT /api/forum/:id/like
MENTORSHIP   GET/POST /api/mentorship/request
             PUT /api/mentorship/request/:id/respond
             GET /api/mentorship/active
DEV ACTIVITY GET /api/dev-activity/:email (own stats, cached 2hr)
             GET /api/dev-activity/public/:userId
             POST /api/dev-activity/usernames (save/update)
             POST /api/dev-activity/generate-code
             POST /api/dev-activity/verify-platform
MESSAGES     GET /api/messages/:userId, POST /api/messages/send
             GET/POST /api/messages/group
NOTIFICATIONS GET /api/notifications, PUT /api/notifications/:id/read
LEADERBOARD  GET /api/leaderboard
CONTESTS     GET/POST /api/contests, POST /api/contests/:id/register
ADMIN        GET /api/admin/users, PUT /api/admin/users/:id/ban
             GET /api/admin/stats, GET /api/admin/reports
```

---

## 16. DEPLOYMENT FLOW

```
[Developer pushes to GitHub (master branch)]
                │
                ▼
[GitHub Actions / Manual Deploy]
                │
       ┌────────┴──────────┐
       ▼                   ▼
 [Backend Deploy]    [Frontend Deploy]
 (Node.js server)    (Static build)
       │                   │
       ▼                   ▼
 [MongoDB Atlas      [Vercel / Netlify
  Cloud DB]           CDN Hosting]
       │                   │
       └────────┬──────────┘
                ▼
     [Cloudinary: Media CDN
      for user photo uploads]
                │
                ▼
     [Live production site]
```

---

*Generated for: Alumni Connect Website (AlumnexConnect)*
*Modules: Auth · Network · Jobs/Career Board · Events · Forum · Chat · Mentorship · DevPulse · Leaderboard · Notifications · Admin · Contests · Projects*
*Stack: React.js + Node.js/Express + MongoDB + Socket.io + Cloudinary*
