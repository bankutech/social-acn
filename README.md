# ACN+ - Premium Social Learning Platform

![ACN+ Platform](https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop)

ACN+ is a high-fidelity, interactive social learning platform designed for modern academic collaboration. Built with a focus on rich aesthetics and real-time interaction, it combines the best features of social media with powerful educational tools.

## 🚀 Features

- **Dynamic Feed**: High-performance scrolling with "Glassmorphism" design and interactive post cards.
*   **Reels (60s Learning)**: Full-screen vertical video experience with auto-play, likes, comments, and sound toggles.
*   **Unified Story System**: Share ephemeral updates with the 24-hour auto-delete interactive story viewer.
*   **Encrypted Partner Chat**: Private, end-to-end feel messaging with typing indicators and disappearing message options.
*   **AI Integration**: Integrated AI assistant to help summarize posts and answer academic queries.
*   **Web Push Notifications**: Stay engaged with real-time browser notifications for messages and interactions.
*   **Responsive Design**: A first-class mobile experience optimized for modern smartphones.

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Framer Motion (Animations), Lucide React (Icons).
- **Backend**: Node.js, Express.js, Socket.io (Real-time).
- **Database**: MongoDB Atlas.
- **Push Notifications**: Web-Push (VAPID).
- **Styling**: Vanilla CSS with a focus on Premium aesthetics.

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bankutech/social-acn.git
   cd social-acn
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with:
   # MONGO_URI=your_mongodb_uri
   # JWT_SECRET=your_secret
   # VAPID_PUBLIC_KEY=your_key
   # VAPID_PRIVATE_KEY=your_key
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create a .env file with:
   # VITE_API_URL=http://localhost:5000
   npm run dev
   ```

## 🎨 Design Philosophy

ACN+ follows a **Premium Dark Aesthetic**, utilizing:
- **Vibrant Gradients**: Tailwind-inspired HSL colors.
- **Glassmorphism**: Subtle blurs and translucent layers.
- **Micro-animations**: Smooth transitions powered by Framer Motion.

## 🛡 License

This project is open-source and available under the MIT License.

---
Built with ❤️ by the ACN+ Team.
