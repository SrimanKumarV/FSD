# Alumnex Connect Architecture

## Overview
Alumnex Connect is a full-stack platform built on the MERN stack (MongoDB, Express, React, Node.js). The platform connects students, alumni, and colleges through features such as mentorship, a job board, forums, and a real-time chat interface.

## Tech Stack
- **Frontend**: React (v18), React Router (v6), React Query for data fetching, Tailwind CSS for styling, Context API for state management.
- **Backend**: Node.js, Express.js (Service-Oriented Architecture), Socket.IO for real-time messaging, Redis for caching.
- **Database**: MongoDB (Mongoose ORM).
- **Authentication**: JWT via HTTP-only cookies, OAuth (Google/GitHub), 2FA.
- **File Storage**: Cloudinary.

## Project Structure
The codebase is divided into frontend and backend directories:
- `backend/`: Express.js backend logic including models, routes, services, middleware, and tests.
- `frontend/`: React application containing contexts, pages, and components.

### Backend Structure
- `backend/models/`: Mongoose schemas.
- `backend/routes/`: Express route definitions.
- `backend/services/`: Business logic extracted from routes.
- `backend/middleware/`: Express middleware, primarily for RBAC (Role-Based Access Control) authentication.
- `backend/tests/`: Jest test files for middleware and services.

### Frontend Structure
- `frontend/src/contexts/`: Context API providers (AuthContext, ProfileContext, SocketContext).
- `frontend/src/pages/`: Main route components (Home, Profile, Admin, Mentorship, etc.).
- `frontend/src/components/`: Reusable React components.
- `frontend/src/utils/`: Utility functions (API interceptors, error handling).

## Core Concepts
- **Role-Based Access Control (RBAC)**: Users are classified as `student`, `alumni`, `college`, or `admin`. Middleware restricts access to certain endpoints based on the role.
- **Services Layer**: Complex logic (e.g., job querying, auto-assigning mentors) is separated from route controllers to improve maintainability.
- **Pagination & Rate Limiting**: Key endpoints have enforced pagination (e.g., max 50 items) to prevent DoS attacks.
- **Data Integrity**: Cascade deletion ensures that when a user is deleted, all related models (Mentorship, Job, ForumPost, Message) are updated or deleted accordingly.
