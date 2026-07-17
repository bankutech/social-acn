# ACN+ Frontend

This directory contains the React-based frontend application for ACN+. It is built for extreme performance, aesthetic superiority, and a seamless developer experience using Vite.

## 🛠 Tech Stack
- **Framework:** React 19
- **Bundler:** Vite
- **Styling:** Vanilla CSS (Glassmorphism & Custom properties)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Auth:** `@react-oauth/google`
- **Routing:** React Router DOM (v6)

## 📂 Folder Structure
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

## 🚀 Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in this directory based on the following template:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 📦 Production Build

To build the app for production (e.g., deploying to Vercel or Netlify):
```bash
npm run build
```
This will output static files into the `dist/` directory. You can preview the production build locally using `npm run preview`.
