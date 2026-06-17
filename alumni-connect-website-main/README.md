# Alumnex-Connect 🎓

![Alumnex Connect Banner](https://img.shields.io/badge/Platform-Alumnex_Connect-blue?style=for-the-badge) ![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge) ![React](https://img.shields.io/badge/Frontend-React-61dafb?style=for-the-badge) ![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge) 

Alumnex-Connect is a premium, full-stack student-alumni networking platform designed to bridge the gap between academic learning and professional careers. Built with a modern glassmorphism UI, it offers real-time communication, mentorship tracking, job hunting, and competitive programming aggregation.

---

## 🚀 Key Features

*   **Real-time Communication:** Built-in live chat using `Socket.io`, complete with "Enter-to-send", emoji pickers, and file/image attachments.
*   **Networking & Mentorship:** Robust follower/following system. Students can request mentorships from alumni, track focus areas, and manage their mentorship pipeline.
*   **Job Portal:** Dedicated job board where alumni can post openings and students can find internships and full-time roles.
*   **Contest Aggregator:** Real-time integration pulling active coding contests from LeetCode, Codeforces, CodeChef, and GeeksForGeeks, displayed in an interactive calendar view.
*   **Forum & Discussions:** A categorized discussion board with rich-text comments and dark-mode support.
*   **Advanced Profile Management:** Users can customize their bios, skills, and seamlessly upload profile pictures natively via **Cloudinary**.
*   **Admin Dashboard:** A centralized control panel for content moderation, user suspension, role management, and system-wide setting configurations.
*   **Premium UI/UX:** Responsive, fully-featured dark mode, dynamic glassmorphism aesthetics, and smooth micro-animations using `framer-motion`.

---

## 💻 Tech Stack

### Frontend (Client)
*   **Framework:** React.js
*   **Routing:** React Router v6
*   **State Management & Data Fetching:** React Query (`@tanstack/react-query`)
*   **Styling:** Tailwind CSS (Custom customized tokens and glassmorphism utilities)
*   **Animations:** Framer Motion
*   **Icons:** Lucide React
*   **Real-time Client:** Socket.io-client

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB & Mongoose ORM
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs
*   **Real-time Server:** Socket.io
*   **File Uploads:** Multer & Multer-Storage-Cloudinary
*   **Security & Optimization:** Helmet, Compression, Express Rate Limit, Morgan

---

## 🔗 External APIs & Integrations

1.  **Cloudinary:** Integrated for secure, cloud-based image hosting (Profile pictures and attachments).
2.  **Brevo API:** Integrated for automated email delivery, account verification, and system notifications.
3.  **Judge0 API / Contest APIs:** Used to aggregate global coding contest schedules.
4.  **Google & GitHub OAuth:** Providing seamless, third-party single sign-on (SSO) authentication.

---

## 🛠️ Local Development Setup

Follow these steps to run the application locally.

### 1. Prerequisites
*   Node.js (v16 or higher)
*   MongoDB (Local instance or MongoDB Atlas URI)
*   Git

### 2. Clone the Repository
```bash
git clone https://github.com/SrimanKumarV/FSD.git
cd FSD/Micro-project/alumni-connect-website-main
```

### 3. Install Dependencies
This project uses `concurrently` to run both the frontend and backend simultaneously.
```bash
# Install root dependencies
npm install

# Install backend and frontend dependencies
npm run install-all
```

### 4. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Email Configuration (Brevo)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
BREVO_API_KEY=your_brevo_api_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OAuth Configurations
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 5. Run the Application
You can start both the Node.js server and the React frontend with a single command from the root folder:
```bash
npm run dev
```

The application will be available at:
*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:5000`

---

## 🏗️ Project Architecture & File Structure

```text
alumni-connect-website-main/
├── backend/
│   ├── config/          # Cloudinary and DB configurations
│   ├── controllers/     # API request handlers
│   ├── middleware/      # JWT validation, error handling
│   ├── models/          # MongoDB schemas (User, Message, Post, etc.)
│   ├── routes/          # Express API routes
│   ├── socket/          # Socket.io connection handlers
│   └── server.js        # Main Express application entry point
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components (Layout, Cards, Modals)
│   │   ├── contexts/    # React Context (AuthContext for global state)
│   │   ├── pages/       # Main views (Chat, Profile, Network, Admin, etc.)
│   │   ├── utils/       # API interceptors and helper functions
│   │   ├── App.js       # Main React router configuration
│   │   └── index.css    # Global Tailwind styles & CSS variables
│
└── package.json         # Root configuration for concurrently
```

---

## 🎨 UI/UX Philosophy
The frontend emphasizes a **Premium Aesthetic** through the rigorous use of CSS variables tailored for both light and dark mode profiles. Heavy emphasis is placed on contrast ratios, micro-interactions, and visual feedback, ensuring the platform feels fast, fluid, and professional.

---
*Built with ❤️ for Alumni and Students.*
