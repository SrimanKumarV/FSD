# Alumnex-Connect: Render Deployment & MongoDB Atlas Guide

This document provides step-by-step instructions for deploying your Full-Stack MERN Alumnex-Connect portal on [Render.com](https://render.com/) and connecting it to a MongoDB Atlas cluster.

## Part 1: MongoDB Atlas Configuration

Before deploying, you need a cloud MongoDB database.
1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **New Project** and build a **Free Shared Cluster**.
3. Under **Database Access**, create a database user (username and password). Save these credentials!
4. Under **Network Access**, add the IP address `0.0.0.0/0` to allow access from anywhere (required for Render to connect).
5. Go to **Database** -> **Connect** -> **Connect your application**.
6. Copy the connection string. It will look something like this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/alumnex-connect?retryWrites=true&w=majority`
   *Replace `<username>` and `<password>` with the credentials you created.*

---

## Part 2: Backend Web Service Deployment (Render)

We will deploy the Node.js/Express backend first to generate the API URL needed for the frontend.

1. Create an account on [Render.com](https://render.com) and link your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your `alumni-connect-website-main` repository.
4. Configure the Web Service settings as follows:
   - **Name**: `alumnex-backend`
   - **Root Directory**: `backend` (Very important! Tells Render where the backend code is).
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node server.js` if you don't have a start script).

5. Scroll down to **Environment Variables** and add the following:
   - `PORT`: `5000`
   - `MONGODB_URI`: *<Paste your MongoDB Atlas connection string from Part 1>*
   - `JWT_SECRET`: *<Create a secure random string (e.g., "my_super_secret_alumnex_key")>*
   - `FRONTEND_URL`: *<Leave blank for now. We will update this after the frontend is deployed>*

6. Click **Create Web Service**. Wait for the build to finish.
7. Once deployed, copy your backend URL (e.g., `https://alumnex-backend-xyz.onrender.com`).

---

## Part 3: Frontend Static Site Deployment (Render)

Now deploy the React frontend and link it to your newly hosted backend API.

1. Go back to the Render dashboard. Click **New +** and select **Static Site**.
2. Connect your `alumni-connect-website-main` repository again.
3. Configure the Static Site settings as follows:
   - **Name**: `alumnex-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

4. Scroll down to **Environment Variables** and add:
   - `REACT_APP_API_URL`: `<Your Backend URL from Part 2>/api` (e.g., `https://alumnex-backend-xyz.onrender.com/api`)

5. **CRITICAL STEP FOR REACT ROUTER (Fixes 404 on refresh)**:
   - Go to the **Redirects/Rewrites** section.
   - Add a new rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`

6. Click **Create Static Site**. Wait for the deployment to finish.
7. Copy your new frontend URL (e.g., `https://alumnex-frontend-xyz.onrender.com`).

---

## Part 4: Finalizing Connections

1. Go back to your **Backend Web Service** on Render.
2. Navigate to **Environment** settings.
3. Update the `FRONTEND_URL` variable to your new frontend URL (e.g., `https://alumnex-frontend-xyz.onrender.com`). Do not include a trailing slash.
4. This ensures that the backend CORS configuration (`server.js`) specifically allows requests from your frontend.
5. Render will automatically redeploy the backend with the new variables.

Your Full-Stack Alumnex-Connect application is now live, fully connected, and production-ready!
