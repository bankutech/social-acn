# Full-Stack Deployment Guide

This guide will walk you through deploying your `social-acn` application using the recommended stack: **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

## Step 1: Push your code to GitHub
If you haven't already, initialize a git repository in this folder and push it to a new GitHub repository. Both Vercel and Render will read directly from your GitHub repository.

---

## Step 2: Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign in/register.
2. Create a new **Free Tier (M0) Cluster**.
3. Under **Database Access**, create a new database user (save the username and password).
4. Under **Network Access**, add the IP address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** on your cluster, choose **Connect your application**, and copy the connection string. It will look like this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/acn_plus?retryWrites=true&w=majority`
   *(Replace `<password>` with your actual password).*

---

## Step 3: Backend (Render)
1. Go to [Render](https://render.com/) and sign in with GitHub.
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect the `render.yaml` file in this repository.
4. Render will ask you to fill in the `MONGO_URI` environment variable. Paste your MongoDB connection string from Step 2.
5. Click **Apply**. Render will automatically build and deploy your backend.
6. Once deployed, copy your backend URL (e.g., `https://social-acn-backend.onrender.com`).

*Note: Since users upload images, a disk is configured in `render.yaml` for the `uploads/` folder. Render requires a paid plan (Starter, $7/mo) to mount persistent disks. If you remain on the Free plan, you must comment out the `disk:` section in `render.yaml`, but note that uploaded images will disappear when the server restarts.*

---

## Step 4: Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and sign in with GitHub.
2. Click **Add New Project** and import your GitHub repository.
3. In the **Framework Preset**, ensure **Vite** is selected.
4. Under **Root Directory**, click **Edit** and select the `frontend` folder.
5. Open **Environment Variables** and add the following:
   - **Name**: `VITE_API_URL`
   - **Value**: Paste your Render backend URL from Step 3 (e.g., `https://social-acn-backend.onrender.com`).
6. Click **Deploy**. Vercel will automatically build and deploy your frontend.

---

🎉 **You're Done!**
Visit your Vercel URL to see your live application. Since Socket.IO is hosted on Render, all your real-time features and chats will work seamlessly!
