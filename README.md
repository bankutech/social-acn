<div align="center">
  <img src="https://via.placeholder.com/150/0a0a0c/a78bfa?text=ACN+" alt="ACN+ Logo" width="120" />
  
  # ACN+ (Premium Social Learning Platform)
  
  **A high-fidelity, interactive social network designed for modern academic collaboration.**

  [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-architecture--folder-structure">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-environment-variables">Environment Variables</a>
  </p>
</div>

---

ACN+ combines the best features of social media with powerful educational tools. Built with a focus on rich aesthetics, real-time interaction, and seamless performance, it serves as a modern hub for students to connect, share knowledge, and grow their networks.

## 🚀 Features

- **🔒 Secure Authentication:** Custom JWT auth flow alongside seamless **Google OAuth** integration.
- **📱 Dynamic Feed:** High-performance infinite scrolling with a personalized feed showcasing posts from people you follow.
- **🎬 Reels (60s Learning):** Full-screen vertical video experience with auto-play, likes, comments, and sound toggles.
- **💬 Real-Time Chat:** Instant, low-latency chat powered by Socket.io, featuring typing indicators and instant delivery.
- **☁️ Cloud Storage:** Direct integration with Cloudinary for fast and reliable image/video uploads.
- **✨ Glassmorphism UI:** Stunning dark mode aesthetics powered by Framer Motion micro-animations and rich mesh gradients.
- **🤖 AI Integration:** Integrated AI assistant to help summarize posts and answer academic queries.
- **📱 Fully Responsive:** A first-class mobile experience optimized for modern smartphones and PWA-ready.

---

## 🛠 Tech Stack

### Frontend (Client)
Built for extreme performance and aesthetic superiority using Vite.
- **Framework:** React.js 19
- **Bundler:** Vite
- **Styling:** Vanilla CSS (Premium Dark Aesthetic, Glassmorphism)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Authentication:** `@react-oauth/google`
- **Routing:** React Router DOM (v6)

### Backend (Server)
A robust REST API providing secure authentication and real-time WebSocket communication.
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas (via Mongoose ODM)
- **Real-Time:** Socket.io
- **File Storage:** Cloudinary + `multer-storage-cloudinary`
- **Security:** bcrypt, jsonwebtoken, CORS

---

## 📂 Architecture & Folder Structure

This repository is structured as a full-stack monorepo containing both the React frontend and the Node.js backend.

### Frontend Directory (`/frontend`)
```text
src/
├── assets/         # Static assets (images, fonts, global CSS)
├── components/     # Reusable UI components (Avatar, Skeletons, Modals)
├── config/         # App-wide configurations (Branding constants)
├── context/        # React Context providers (AuthContext, ThemeContext)
├── lib/            # Utility libraries and API interceptors (axios config)
├── pages/          # Full page components corresponding to routes
├── App.jsx         # Root router configuration
└── main.jsx        # React DOM entry point
```

### Backend Directory (`/backend`)
```text
backend/
├── config/         # Database and Cloudinary connection setup
├── controllers/    # Core business logic for endpoints
├── middleware/     # Custom Express middleware (Auth, Error handling)
├── models/         # Mongoose DB Schemas
├── routes/         # Express router definitions
└── server.js       # Main application entry point & Socket.io setup
```

---

## 📦 Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary Account (for image uploads)
- Google Cloud Console Project (for OAuth Client ID)

### 1. Clone the repository
```bash
git clone https://github.com/bankutech/social-acn.git
cd social-acn
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the server in development mode (with auto-reloading).
```bash
cd backend
npm install
npm run dev
```
The API will run on `http://localhost:5000` by default.

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite dev server.
```bash
cd frontend
npm install
npm run dev
```
To build the frontend for production, run `npm run build`.

---

## 🔑 Environment Variables

To run this project, you will need to create `.env` files in both the `frontend` and `backend` directories. We have provided `.env.example` files in both directories to make this easy.

### Backend (`backend/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0...

# Authentication (JWT)
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d

# Google Authentication (OAuth)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cloudinary (Image/Video Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Assistant (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Frontend (`frontend/.env`)
```env
# API Connection
VITE_API_URL=http://localhost:5000

# Google Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 📡 Backend API Overview

The REST API exposes several core routes:
- `/api/auth` - User registration, login, profile management, and following system.
- `/api/posts` - CRUD operations for feed posts, including likes and comments.
- `/api/reels` - Video content management.
- `/api/chat` - Real-time direct messaging history.
- `/api/upload` - Secure file uploads bridged to Cloudinary.

---

## 🧪 Testing

There is currently no automated test suite (Jest/Cypress/Mocha) configured for this repository. All testing must be performed manually. 

---

## 🎨 Design Philosophy

ACN+ follows a **Premium Dark Aesthetic** to ensure the app feels like a top-tier modern product. The UI relies on:
- **Vibrant Mesh Gradients**: Deep purples (`#7c3aed`), glowing cyans (`#06b6d4`), and soft off-whites.
- **Glassmorphism**: Translucent layers (`backdrop-filter: blur`) to create depth and hierarchy without muddying the screen.
- **Micro-animations**: Every button click, page transition, and state change is smoothed out using `Framer Motion` to provide satisfying physical feedback to the user.

---

## 🛡 License & Copyright

This project is open-source and available under the MIT License.

<div align="center">
  <i>Built with ❤️ for modern students.</i>
</div>
