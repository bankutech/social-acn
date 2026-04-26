import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import PartnerChatPage from './pages/PartnerChatPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ReelsPage from './pages/ReelsPage';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Sphere...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  return (
    <div className="app-container">
      <main className={user ? 'main-content has-nav' : 'main-content'}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="/reels" element={<PrivateRoute><ReelsPage /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/partner-chat/:partnerId" element={<PrivateRoute><PartnerChatPage /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/create-post" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        </Routes>
      </main>
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
