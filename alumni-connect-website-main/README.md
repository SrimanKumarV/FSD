# Alumnex Connect Platform 🚀

Alumnex Connect is a premium, full-stack platform designed to bridge the gap between students and alumni. Built with the MERN stack (MongoDB, Express, React, Node.js), it features a modern glassmorphism UI and a robust suite of tools for mentorship, global contest tracking, job boards, real-time messaging, and community forums.

## 🌟 Key Features

### 🎨 Premium Glassmorphism UI
- Fully responsive, modern UI/UX design with dynamic gradients and glassmorphism elements.
- Integrated Dark/Light mode, customizable via the Settings dashboard.

### 🤝 Mentorship & Networking
- **Bi-Directional Mentorship System**: Students can request mentorship from Alumni, and Alumni can guide Students.
- **Smart Connections**: Automatically integrates followers/following logic upon accepted mentorship requests.
- **Mentor Discovery**: Optimized search to find mentors based on industry, skills, and availability.

### 🏆 Global Coding Contests Aggregator
- Real-time fetching of upcoming and ongoing coding contests from **Codeforces**, **LeetCode**, **CodeChef**, and **GeeksForGeeks**.
- Features an intelligent **in-memory caching system** to ensure 0ms latency and prevent rate-limit bottlenecks.
- Dedicated Calendar view for tracking competitive programming events.

### 💼 Jobs & Opportunities Board
- Integrated internal job postings combined with external remote opportunities (via Remotive API).
- High-performance caching and concurrent API fetching to ensure maximum reliability.

### 💬 Real-Time Messaging & Notifications
- Persistent, real-time chat powered by **Socket.IO**.
- Dedicated global Notifications center for tracking likes, comments, and connection requests.

### 📝 Community Forum
- Fully functional discussion forum.
- Post creation, commenting, liking, and post/comment deletion features with robust author verification.
- Personalized "My Feed" to discover content from followed connections.

## 🛠️ Tech Stack

- **Frontend**: React.js, Context API, Tailwind CSS / Custom Vanilla CSS (Glassmorphism), Socket.IO-Client
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT Auth, Node-Cache
- **External Integrations**: Remotive API (Jobs), Codeforces/LeetCode/CodeChef APIs (Contests), Cloudinary (Media storage)

## 🚀 System Architecture & Optimizations

To handle high concurrency and ensure reliability, the backend is optimized with:
1. **Concurrent API Fetching**: External requests (e.g., Contests) use `Promise.allSettled()` to fetch simultaneously.
2. **Resilience & Timeouts**: All external API calls are wrapped in `AbortController` timeouts to prevent server hangs.
3. **In-Memory Caching**: Implemented `node-cache` to cache external data for 30 minutes, preventing bottleneck timeouts.
4. **Database Indexing**: Critical MongoDB schemas (`User`, `Message`, `Job`, `Contest`) are equipped with compound indexes to prevent full-collection scans and ensure lightning-fast queries.

## 💻 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Atlas or local)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SrimanKumarV/FSD.git
   cd FSD/Micro-project/alumni-connect-website-main
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the `backend` directory with the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. **Run the Application**
   Open two terminals:
   
   *Terminal 1 (Backend):*
   ```bash
   cd backend
   npm run dev
   ```
   
   *Terminal 2 (Frontend):*
   ```bash
   cd frontend
   npm start
   ```

## 🔐 Security & Account Management
- **Secure Authentication**: JWT-based auth with robust route protection.
- **Account Settings**: Dedicated settings portal allowing users to securely delete their accounts and manage platform preferences.

---
*Built for the future of professional networking and continuous learning.*
