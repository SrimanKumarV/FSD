---
title: ALUMNEX CONNECT
subtitle: Comprehensive Full-Stack Software Engineering Project Report
author: Sriman Kumar V
date: 2026-09-11
---

# TITLE PAGE

**Project Name**: ALUMNEX CONNECT  
**Subtitle**: Comprehensive Full-Stack Software Engineering Project Report  

**Student Name**: Sriman Kumar V  
**Register Number**: [Insert Register Number]  
**Department**: Computer Science and Engineering  
**Institution**: [Insert Institution Name]  
**Guide**: [Insert Guide Name]  
**Academic Year**: 2026

---

# CERTIFICATE

This is to certify that the project report entitled **ALUMNEX CONNECT** is a bonafide record of the work done by **Sriman Kumar V** in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering in Computer Science and Engineering.

**Signature of Guide** ___________________  
**Signature of HOD** ___________________  

---

# DECLARATION

I hereby declare that the project report entitled **ALUMNEX CONNECT** submitted to the institution is a record of original work done by me. This project has not been submitted in part or full to any other university or institution for the award of any degree or diploma.

**Sriman Kumar V**  
**Date**: 2026-09-11

---

# ACKNOWLEDGEMENT

I would like to express my deepest gratitude to all those who provided support and guidance during this project. I am thankful to my project guide for their continuous encouragement and insightful feedback. I also extend my thanks to the department and institution for providing the necessary resources and environment to successfully complete this endeavor.

---

# ABSTRACT

Alumnex Connect is a comprehensive, full-stack, enterprise-grade web and mobile application designed to bridge the gap between students, alumni, and institutions. Built on the MERN stack (MongoDB, Express.js, React, Node.js) and enveloped in a Capacitor mobile wrapper, the platform facilitates professional networking, mentorship, career opportunities, and real-time communication. 

The system distinguishes itself through advanced architectural implementations including AI-assisted career mentoring with provider failover (Groq to Gemini), real-time horizontal scaling capabilities via Socket.IO and Redis, automated developer statistics aggregation from platforms like GitHub and LeetCode, and a robust role-based access control (RBAC) mechanism. The application enforces strong security measures including double-submit cookie CSRF protection, rate limiting, and strictly separated environments. This report provides deep, evidence-based documentation of the architecture, implementation, resilience mechanisms, and exact source code traceability.

---

# TABLE OF CONTENTS
1. INTRODUCTION
2. SYSTEM STUDY AND REQUIREMENTS
3. SYSTEM ARCHITECTURE
4. TECHNOLOGY STACK
5. DATABASE DESIGN
6. AUTHENTICATION AND ACCESS CONTROL
7. SECURITY ARCHITECTURE
8. MODULE-WISE IMPLEMENTATION
9. AI FEATURES
10. REAL-TIME COMMUNICATION
11. EXTERNAL API INTEGRATIONS
12. PERFORMANCE AND OPTIMIZATION
13. TESTING AND QUALITY ASSURANCE
14. CI/CD AND DEPLOYMENT
15. MOBILE APPLICATION
16. FAILURE HANDLING AND RESILIENCE
17. THREAT MODEL AND SECURITY ANALYSIS
18. RESULTS AND OBSERVATIONS
19. LIMITATIONS
20. FUTURE ENHANCEMENTS
21. CONCLUSION
APPENDICES

---

# LIST OF ABBREVIATIONS
* **API**: Application Programming Interface
* **JWT**: JSON Web Token
* **RBAC**: Role-Based Access Control
* **SPA**: Single Page Application
* **CRUD**: Create, Read, Update, Delete
* **CORS**: Cross-Origin Resource Sharing
* **CSRF**: Cross-Site Request Forgery
* **CSP**: Content Security Policy
* **CDN**: Content Delivery Network
* **TTL**: Time To Live
* **CI/CD**: Continuous Integration / Continuous Deployment
* **AI**: Artificial Intelligence
* **NLP**: Natural Language Processing
* **PDF**: Portable Document Format
* **WebSocket**: Full-duplex communication protocol
* **OTP**: One-Time Password
* **2FA**: Two-Factor Authentication
* **ATS**: Applicant Tracking System

---

# CHAPTER 1 — INTRODUCTION

## 1.1 Background
Educational institutions inherently produce a massive network of alumni whose industry experience is highly valuable to current students. However, maintaining this connection post-graduation is traditionally difficult due to fragmented communication channels.

## 1.2 Problem Statement
Existing alumni networks are often passive directories. There is a lack of structured, actionable platforms where students can request mentorship, alumni can post internal job referrals, and real-time interaction can occur securely and reliably.

## 1.3 Motivation
To build an active, automated, and AI-enhanced ecosystem that incentivizes alumni engagement and provides students with data-driven career guidance, integrated directly with their developer profiles.

## 1.4 Objectives
* Implement a secure, RBAC-driven platform for multiple user roles (Admin, Student, Alumni, Mentor, Business).
* Provide real-time chat and notifications.
* Integrate AI tools to review resumes, simulate interviews, and match jobs.
* Aggregate external developer statistics (GitHub, LeetCode, etc.) into a unified profile.
* Ensure high resilience, fallback mechanisms, and security best practices.

## 1.5 Scope
The system encompasses a web SPA and a mobile application wrapper. It handles user authentication, profile management, mentorship lifecycles, job boards, AI interactions, and real-time messaging.

---

# CHAPTER 2 — SYSTEM STUDY AND REQUIREMENTS

## 2.1 Functional Requirements
* **Authentication**: Multi-provider login (Local, Google, GitHub), 2FA, OTP verification.
* **Mentorship**: Request flow, session tracking, mentor reviews.
* **AI Tools**: Resume parsing, mock interviews, AI career chat.
* **Networking**: Real-time messaging, forum posting, event management.
* **Developer Stats**: Automated fetching from GitHub, LeetCode, HackerRank, etc.

## 2.2 Non-Functional Requirements
* **Security**: Mitigation against XSS, CSRF, NoSQL injection, and brute-force attacks.
* **Resilience**: Graceful fallback if primary AI providers or Redis fails.
* **Performance**: Optimized API payloads, Redis caching for frequent queries, lazy loading in React.
* **Availability**: Application-level API client with failover capabilities to route around backend outages.

## 2.3 User Roles
* **Student**: Can apply for jobs, request mentorship, use AI tools.
* **Alumni**: Can post jobs, become mentors, review resumes.
* **Admin**: System configuration, content moderation, user management.

---

# CHAPTER 3 — SYSTEM ARCHITECTURE

## 3.1 High-Level Architecture
The system follows a modern decoupled client-server architecture. The frontend is a React SPA communicating via RESTful APIs and WebSockets to an Express.js backend. The backend persists data in MongoDB and utilizes Redis for caching and WebSocket pub/sub scaling.

## 3.2 Frontend Architecture
The frontend codebase (\`frontend/src/\`) implements a scalable architecture.
* **Framework**: React with React Router for SPA navigation.
* **State Management**: React Query for server state caching/retries; React Context (\`AuthContext\`, \`SocketContext\`) for global client state.
* **API Client**: Axios instance (\`api.js\`) with interceptors for automatic token refresh, failover routing, and CSRF header injection.
* **Components**: Divided into \`pages/\` (route level) and \`components/\` (reusable UI).

## 3.3 Backend Architecture
The backend codebase (\`backend/\`) is an Express application.
* **Entry Point**: \`server.js\` chains global middleware (Helmet, CORS, rate limits) in a precise order.
* **Routing Layer**: Express routers mapped to logical domains (\`routes/auth.js\`, \`routes/ai.js\`).
* **Service Layer**: Business logic separated from controllers (\`services/authService.js\`).
* **Data Access Layer**: Mongoose ODM with strictly defined schemas (\`models/\`).

### 3.3.1 Request Lifecycle (Middleware Sequence)
The source code (\`backend/server.js\`) strictly enforces the following middleware sequence:
Client HTTP Request $\\rightarrow$ Helmet (CSP/Frameguard) $\\rightarrow$ Compression $\\rightarrow$ Morgan (Logging) $\\rightarrow$ CORS Validation $\\rightarrow$ Express Rate Limiter $\\rightarrow$ JSON/URL Body Parser $\\rightarrow$ Cookie Parser $\\rightarrow$ CSRF Protection $\\rightarrow$ Mongo Sanitization $\\rightarrow$ HPP (Parameter Pollution) $\\rightarrow$ Application Routes $\\rightarrow$ Error Handler (Stack stripped in Prod).

## 3.4 Resilience and Failover Architecture
The application implements client-side failover routing. If the primary backend URL fails (e.g., Render sleep), the Axios interceptor (\`frontend/src/utils/api.js\`) shifts to a backup URL and automatically replays the request. 

\`\`\`mermaid
graph TD
    Client[React / Capacitor Client] --> |HTTP/WS| LB{Client-side Failover}
    LB -->|Primary| API1[Primary API]
    LB -->|Backup| API2[Backup API]
    API1 --> Route[Express Router]
    Route --> AI{AI Orchestrator}
    AI -->|Attempt 1| Groq[Groq API]
    AI -->|Fallback| Gemini[Gemini API]
\`\`\`

---

# CHAPTER 4 — TECHNOLOGY STACK

* **Frontend**: React, TailwindCSS, React Query, Socket.io-client. Selected for component reusability, efficient server state management, and rapid styling.
* **Backend**: Node.js, Express.js. Selected for high-concurrency non-blocking I/O, ideal for WebSocket chat and API aggregation.
* **Database**: MongoDB via Mongoose. Selected for flexible schema design accommodating diverse profile and developer statistics structures.
* **Caching/PubSub**: Redis. Selected for API caching and enabling horizontal scaling of Socket.IO instances.
* **Mobile**: Capacitor. Selected to wrap the web application into a native Android APK without maintaining a separate Kotlin/Swift codebase.
* **AI Providers**: Groq (Primary for speed), Gemini (Fallback).

## Implementation Evidence (Chapters 1-4)
| Engineering Claim | Repository Evidence | Status |
|-------------------|---------------------|--------|
| React SPA Framework | \`frontend/package.json\` (react, react-dom) | VERIFIED IMPLEMENTATION |
| Client-side API Failover | \`frontend/src/utils/api.js\` (triggerFailover) | VERIFIED IMPLEMENTATION |
| Backend Entry Point | \`backend/server.js\` | VERIFIED IMPLEMENTATION |
| Capacitor Mobile Wrapper | \`mobile-wrapper/capacitor.config.json\` | VERIFIED IMPLEMENTATION |
