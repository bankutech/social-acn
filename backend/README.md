# ACN+ Backend API

This directory contains the Node.js API server that powers the ACN+ platform. It provides a robust REST API, secure authentication, real-time WebSocket communication, and handles complex data relationships via MongoDB.

## 🛠 Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Real-time:** Socket.io
- **Authentication:** JSON Web Tokens (JWT) & bcrypt
- **Storage:** Cloudinary (via `multer-storage-cloudinary`)

## 📂 Folder Structure
```text
backend/
├── config/         # Database and Cloudinary connection setup
├── controllers/    # Core business logic for endpoints
├── middleware/     # Custom Express middleware (Auth, Error handling)
├── models/         # Mongoose DB Schemas
├── routes/         # Express router definitions
└── server.js       # Main application entry point & Socket.io setup
```

## 🚀 Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in this directory based on the following template:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Atlas Connection String
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0...
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   
   # Cloudinary Credentials (Required for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Start the server in development mode (with auto-reloading):
   ```bash
   npm run dev
   ```

The API will run on `http://localhost:5000` by default.

## 📡 API Overview

The REST API exposes several core routes:
- `/api/auth` - User registration, login, profile management, and following system.
- `/api/posts` - CRUD operations for feed posts, including likes and comments.
- `/api/reels` - Video content management.
- `/api/chat` - Real-time direct messaging history.
- `/api/upload` - Secure file uploads bridged to Cloudinary.
