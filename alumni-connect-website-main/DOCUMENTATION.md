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
  - *Tech*: Google Gemini API integrated via new backend route `/api/ai/chat`.
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
  - *Tech*: React, Framer Motion, Tailwind CSS.
  - *Function*: Upgraded the mentorship hub to allow students to select specific dates and time slots (Morning/Afternoon/Evening) for 1:1 career guidance sessions with verified alumni, complete with an interactive booking modal.

*(This document is a living record and will be continuously updated as new features are integrated).*
