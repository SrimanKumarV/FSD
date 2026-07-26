# Alumnex Connect - Comprehensive Project Documentation

## 1. Project Overview
Alumnex Connect is a comprehensive student-alumni networking platform designed to facilitate mentorship, career guidance, job opportunities, and professional networking within educational institutions. It is built to mimic a modern, startup-grade platform rather than a simple college project.

## 2. Tech Stack
- **Frontend**: React (v18), React Router, Framer Motion (animations), Tailwind CSS, Lucide React (icons), Recharts, React Simple Maps, React Query.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io (real-time chat).
- **Authentication**: JWT, bcrypt, Google OAuth (`@react-oauth/google`).
- **Cloud/Media**: Render (Backend hosting), Cloudinary (Image storage).
- **Tools**: node-cache, axios, multer, react-hook-form.

## 3. Development Workflow & Architecture
- **API Architecture**: Client -> Express Routes -> Middleware (Auth/Role Validation) -> Controllers/Services -> MongoDB.
- **State Management**: `React Context` for global states (Auth, Theme, Video Calls, Notifications, Sockets). `React Query` handles async server-state data fetching, caching, and mutation.
- **Real-Time Engine**: `Socket.io` is used extensively for real-time one-to-one messaging, live notifications, online status tracking, and video calls.
- **Version Control Strategy**: Phased, feature-based commits to ensure all modules are independently trackable and reversible.

## 4. Core Features (Base Implementation)
- **Authentication**: Email/Password and Google OAuth login. Two-factor authentication (OTP verification).
- **User Roles**: Admin, Student, Alumni, College.
- **Mentorship System**: Request/accept mentorship, auto-follow logic, track mentorship connections.
- **Forum & Community**: Post updates, ask questions, delete/edit posts and comments.
- **Job & Internship Portal**: Alumni can post jobs; students can browse and apply.
- **Events & Contests**: Global API aggregator pulling real-time data from Codeforces, LeetCode, CodeChef.
- **Real-Time Chat & Video Calls**: 1-on-1 text messaging and WebRTC/Socket-based video communication.
- **DevPulse**: Developer activity tracker integrating GitHub, LeetCode, HackerRank, and GfG.

## 5. Startup-Grade Feature Upgrades (Changelog)
This section tracks advanced modules added to elevate the platform.

### Phase 1: Mentorship & Networking
* **[Added] AI Career Mentor (Floating Assistant)**
  - *Location*: Global overlay accessible on all protected routes (`FloatingAIAssistant.js`).
  - *Tech*: Groq Cloud API (Llama 3) integrated via new backend route `/api/ai/chat`.
  - *Function*: Provides real-time career advice, resume reviews, and interview preparation dynamically.
* **[Added] Interactive Alumni World Map**
  - *Location*: `/map` (`AlumniMap.js`).
  - *Tech*: `react-simple-maps`, `d3-scale`, `topojson`.
  - *Function*: Visually displays and tracks global alumni distribution across major tech hubs (San Francisco, London, Bengaluru, etc.) using interactive markers.
* **[Added] AI Resume Analyzer**
  - *Location*: `/resume` (`ResumeAnalyzer.js`).
  - *Tech*: Frontend static analysis and AI simulation.
  - *Function*: Allows students to upload their resume (PDF) and receive a comprehensive ATS evaluation, including grammar scoring, impact metrics, missing industry keywords, and actionable AI suggestions.
* **[Added] Alumni Startup & Business Network**
  - *Location*: `/businesses` (`BusinessDirectory.js`).
  - *Tech*: React, Framer Motion, Tailwind CSS.
  - *Function*: A curated, searchable directory allowing students to discover innovative companies and startups founded by alumni, filter by industry, and find hiring opportunities.
* **[Added] Job Referral Request System**
  - *Location*: `/jobs` (`Jobs.js`).
  - *Tech*: React, Lucide Icons, react-hot-toast.
  - *Function*: Added a "Request Referral" feature directly onto internal job postings, allowing students to seamlessly ask the alumni poster (or alumni working at the company) for a referral before submitting their application.
* **[Added] Alumni Mentorship Slot Booking**
  - *Location*: `/mentorship` (`Mentorship.js`).
  - *Tech*: React, Framer Motion, Node.js (`MentorshipSession` model).
  - *Function*: Upgraded the mentorship hub to allow students to select specific dates and time slots (Morning/Afternoon/Evening) for 1:1 career guidance sessions with verified alumni, complete with a fully operational backend endpoint that stores live bookings.

### Phase 2: Advanced Ecosystem Modules (Ideathon Upgrades)
* **[Added] Smart Mentor Allocation System**
  - *Location*: `/mentor-allocation` (`Mentorship.js`, `MentorshipRequest` Model).
  - *Function*: Shifts the paradigm from "students spamming alumni" to a structured flow. Mentors specify capacity and target domains; students submit requests, and mentors accept or decline them efficiently. Fully integrated with a live backend, Socket.IO for real-time notifications (instant UI updates), and dark mode. All test mock data has been removed for production-ready state.
* **[Added] Tech Assistance Hub**
  - *Location*: `/tech-hub` (`TechHub.js`, `TechHub` Model).
  - *Function*: A structured Q&A community for technical doubts. Integrates rich text formatting, upvotes, and verification checks. Fully integrated with live backend (`/api/tech-hub/questions`) and dark mode.
* **[Added] Career & Opportunity Board**
  - *Location*: `/career-board` (`CareerBoard.js`, `JobOpportunity` Model).
  - *Function*: A premium job board with advanced filtering, bookmarking, and direct 1-click apply links targeting specific domains. Now fetches live jobs from the MongoDB backend (`/api/jobs`) and fully supports dark mode.
* **[Added] Project Collaboration Hub**
  - *Location*: `/project-collaboration` (`ProjectCollaboration.js`, `Project` Model).
  - *Function*: A dedicated board where students can upload their projects, showcase their tech stack, and explicitly signal if they need team members or alumni mentorship. Fetches live data from `/api/projects` and is fully dark-mode compliant.
* **[Added] Gamification & Rewards Ecosystem**
  - *Location*: Backend Models (`User.js`, Mentorship/TechHub routes), Frontend Profiles (`UserProfile.js`).
  - *Function*: Introduced `rewardPoints` awarded to users automatically (e.g., +50 for accepting mentees, +10 for answering tech questions). Thresholds trigger digital badges (e.g., "Top Contributor").
* **[Added] Comprehensive DevPulse & Resume Upgrades**
  - *Location*: `/devpulse` and `/resume`.
  - *Function*: Added placeholders for CodeChef and Codeforces to centralize coding identity. Added downloadable "AI-Optimized Resume Templates" directly in the Resume Analyzer.
* **[Added] Advanced Growth Analytics**
  - *Location*: `/analytics` (`AnalyticsDashboard.js`).
  - *Function*: Role-based visual data (Recharts). Mentors track "Hours Mentored" and engagement; students track "Applications" and skill growth over 6-12 month trends. Fetches real dashboard statistics from `/api/users/dashboard` and gracefully transitions into dark mode.
* **[Added] Safety & User Reporting Module**
  - *Location*: `/users/:id/report` (Backend `Report` Model), Modal in `UserProfile.js`.
  - *Function*: Allows users to report suspicious activity, spam, or harassment directly from a user's public profile, ensuring a secure, moderated ecosystem.

### Global Enhancements
* **[Enhancement] Flawless Global Dark Mode**
  - Extensively integrated dynamic `dark:` Tailwind classes across all Phase 1 and Phase 2 pages to ensure a premium, unified visual aesthetic across light and dark themes.
* **[Enhancement] Full API Connectivity**
  - Transitioned all front-end outline prototypes into fully functional systems directly mutating and retrieving data from the Express.js MongoDB backend.

*(This document is a living record and will be continuously updated as new features are integrated).*
