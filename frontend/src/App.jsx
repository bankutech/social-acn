import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import AIFloatingAssistant from './components/AIFloatingAssistant';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import PartnerChatPage from './pages/PartnerChatPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ReelsPage from './pages/ReelsPage';
import AdminPage from './pages/AdminPage';
import AIPage from './pages/AIPage';
import BookmarksPage from './pages/BookmarksPage';
import GroupsListPage from './pages/GroupsListPage';
import GroupDetailPage from './pages/GroupDetailPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Sphere...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <div className="app-container">
      {user && <DesktopSidebar />}
      <main className={user ? 'main-content has-nav' : 'main-content'}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
          <Route path="/explore" element={<PrivateRoute><ExplorePage /></PrivateRoute>} />
          <Route path="/reels" element={<PrivateRoute><ReelsPage /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><ChatListPage /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/partner-chat/:partnerId" element={<PrivateRoute><PartnerChatPage /></PrivateRoute>} />
          <Route path="/profile" element={user ? <Navigate to={`/profile/${user._id || user.id}`} /> : <Navigate to="/login" />} />
          <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
          <Route path="/create-post" element={<Navigate to="/create" replace />} />
          <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
          <Route path="/bookmarks" element={<PrivateRoute><BookmarksPage /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><GroupsListPage /></PrivateRoute>} />
          <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/ai" element={<PrivateRoute><AIPage /></PrivateRoute>} />
        </Routes>
      </main>
      {user && <BottomNav />}
      {user && <AIFloatingAssistant />}
    </div>
  );
}
