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
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-environment-variables">Environment Variables</a> •
    <a href="#-design-philosophy">Design Philosophy</a>
  </p>
</div>

---

ACN+ combines the best features of social media with powerful educational tools. Built with a focus on rich aesthetics, real-time interaction, and seamless performance, it serves as a modern hub for students to connect, share knowledge, and grow their networks.

## 🚀 Features

- **🔒 Secure Authentication:** Custom JWT auth flow alongside seamless **Google OAuth** integration.
- **📱 Dynamic Feed:** High-performance infinite scrolling with a personalized feed showcasing posts from people you follow.
- **🎬 Reels (60s Learning):** Full-screen vertical video experience with auto-play, likes, comments, and sound toggles.
- **💬 Real-Time Chat:** Private, end-to-end feel messaging powered by Socket.io, featuring typing indicators and instant delivery.
- **☁️ Cloud Storage:** Direct integration with Cloudinary for fast and reliable image/video uploads.
- **✨ Glassmorphism UI:** Stunning dark mode aesthetics powered by Framer Motion micro-animations and rich mesh gradients.
- **🤖 AI Integration:** Integrated AI assistant to help summarize posts and answer academic queries.
- **📱 Fully Responsive:** A first-class mobile experience optimized for modern smartphones and PWA-ready.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework:** React.js 19 + Vite
- **Styling:** Vanilla CSS (Premium Dark Aesthetic, Glassmorphism)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Authentication:** `@react-oauth/google`
- **Routing:** React Router v6

### Backend (Server)
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Real-Time:** Socket.io
- **File Storage:** Cloudinary + Multer
- **Security:** bcrypt, jsonwebtoken, CORS

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
Navigate to the backend directory, install dependencies, and start the server.
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the dev server.
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

To run this project, you will need to create `.env` files in both the `frontend` and `backend` directories.

### Backend (`backend/.env`)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0...

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d

# Cloudinary (Image/Video Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)
```env
# API Connection
VITE_API_URL=http://localhost:5000

# Google Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

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
