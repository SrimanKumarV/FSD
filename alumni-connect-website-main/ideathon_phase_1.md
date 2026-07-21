# Ideathon Phase 1: Alumnex Connect

## 1. Problem Statement
Many educational institutions struggle to maintain an active and engaging relationship with their alumni. Students often lack the guidance and mentorship needed to transition smoothly from academia to the professional world. Existing networking platforms (like LinkedIn) are too broad and lack the personalized, trust-based environment specific to a college community. Consequently, students miss out on valuable referral opportunities, career advice, and industry insights, while alumni find it difficult to give back to their alma mater or recruit talent directly from their college.

## 2. Project Idea
**Alumnex Connect** is a centralized, comprehensive student-alumni networking platform designed exclusively for educational institutions. The platform aims to bridge the gap between current students and successful alumni by facilitating mentorship, career guidance, job opportunities, and professional networking in a closed, verified environment. It goes beyond a simple directory, offering an interactive ecosystem that mimics a modern, startup-grade professional network.

## 3. Proposed Solution
Our solution provides a dedicated portal where:
- **Students** can find mentors, ask for referrals, seek career guidance through AI, and track global alumni distribution.
- **Alumni** can post job openings, offer mentorship slots, highlight their startups, and provide referrals.
- **Colleges/Admins** can manage users, oversee platform activity, and track the overall success of their alumni network.

Key integrated solutions include an AI Career Mentor for real-time advice, an AI Resume Analyzer for ATS evaluation, an interactive Alumni World Map, and a structured Mentorship Slot Booking system.

## 4. Prototype Concept
The prototype will feature a modern, responsive web application with a glass-morphism aesthetic. 
Key modules to be showcased in the prototype:
- **Onboarding & Role Selection:** Dedicated onboarding flows for Students, Alumni, and Colleges.
- **Mentorship Hub:** A marketplace-style interface where students can book 1:1 sessions based on alumni availability.
- **Job & Referral Portal:** An integrated job board where alumni can list positions and students can request referrals with a single click.
- **Community Forum:** A real-time feed for updates, Q&A, and knowledge sharing.
- **AI Integration:** Floating AI assistant and resume analyzer functionalities working dynamically.
- **Interactive Map:** Visual representation of alumni worldwide.

## 5. Technology Stack & Tools

### Frontend
- **Framework:** React.js (v18)
- **Routing:** React Router DOM
- **Styling & UI:** Tailwind CSS (Modern, Responsive, Utility-first), Framer Motion (Animations)
- **Icons & Data Visualization:** Lucide React, Recharts, React Simple Maps (with D3-scale & Topojson for interactive mapping)
- **State Management & Data Fetching:** React Context API, React Query
- **Real-Time Video/Audio:** `simple-peer` (WebRTC P2P networking)
- **Form Handling & Utilities:** `react-hook-form`, `axios`, `react-hot-toast` (Notifications)

### Backend
- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Real-Time Communication:** Socket.io (for text messaging, notifications, online tracking, WebRTC signaling)
- **Caching & Optimization:** `node-cache`
- **File Parsing:** `multer` (for handling multi-part form data and image uploads)

### Database
- **Database Engine:** MongoDB (NoSQL)
- **ODM:** Mongoose (Schema validation and atomic updates)

### Authentication & Security
- **Authentication Strategy:** JSON Web Tokens (JWT) for session management.
- **Social Login:** Google OAuth (`@react-oauth/google`), GitHub OAuth.
- **Password Security:** bcrypt (for hashing passwords).
- **Omni-Channel Two-Factor Authentication (2FA):** Intelligent, dynamic OTP delivery system:
  - **Manual/Standard Login:** If a phone number is provided during registration/login, the user is presented with a choice to receive their 6-digit secure OTP via **SMS** or **Email**.
  - **Social Logins (OAuth):** If authenticated via Google or GitHub, the system seamlessly defaults to an **Email OTP** for robust secondary verification, ensuring high security without demanding a phone number upfront.
- **CORS & Rate Limiting:** Applied to protect API routes.

### APIs & External Integrations
- **AI Integration:** Google Gemini API (used for AI Career Mentor, Resume Analyzer, and conversational AI).
- **Competitive Programming API Aggregator:** Global APIs from Codeforces, LeetCode, CodeChef (for Events & Contests data).
- **Developer Tracking (DevPulse):** GitHub API, LeetCode API, HackerRank API, GeeksforGeeks API.
- **Messaging & Communication API:** Twilio API / Fast2SMS (for reliable, instant SMS OTP delivery and transactional security alerts).

### Cloud, Media & Hosting (Tools)
- **Backend Hosting & Failover:** Render (Primary and secondary fallback instances for high availability)
- **Frontend Hosting:** Render
- **Image & Media Storage:** Cloudinary
- **Version Control:** Git & GitHub
- **Package Manager:** npm
- **API Testing:** Postman

## 6. Future Updates & Roadmap

To further scale and establish Alumnex Connect as a complete professional ecosystem, the following updates are planned for future phases:

1. **Cross-Platform Mobile Application:** 
   - Develop a companion mobile app using **React Native** to provide on-the-go push notifications for job postings, chat messages, and mentorship requests.
2. **Advanced Analytics Dashboard for Colleges:** 
   - An interactive admin interface featuring comprehensive analytics on alumni placement rates, global geographic distribution, and overall platform engagement metrics.
3. **Integrated Payment & Donation Gateway:** 
   - Integration with Stripe/Razorpay to facilitate direct alumni donations to college funds, crowdfunding for student startups, and ticketing for premium masterclasses.
4. **Live Webinar & Broadcasting Module:** 
   - Expand the real-time video features to allow alumni to host large-scale webinars, technical workshops, and AMA (Ask Me Anything) sessions for hundreds of students simultaneously.
5. **Strict Automated Verification System:** 
   - Implement automated `.edu` email domain enforcement and OCR-based college ID verification to ensure absolute authenticity of all users on the platform.
6. **AI-Powered Candidate Matching:** 
   - Introduce an intelligent matching algorithm that automatically recommends the best student candidates for job postings based on their resume analysis and DevPulse coding metrics.
