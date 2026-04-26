import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import ReelsPage from './pages/ReelsPage';
import CreatePostPage from './pages/CreatePostPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import PartnerChatPage from './pages/PartnerChatPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ExplorePage from './pages/ExplorePage';
import AdminPage from './pages/AdminPage';
import { Toaster, toast } from 'react-hot-toast';
import { getSocket } from './lib/socket';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from './lib/api';
import './App.css';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loader"><div className="loader-spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const handleNewMsg = (data) => {
      const msg = data.message || data;
      const senderId = msg.sender?._id || msg.sender;
      // Do not show toast if we are on the chat page of this user
      if (location.pathname === `/chat/${senderId}` || location.pathname === `/partner-chat/${senderId}`) return;
      if (String(senderId) !== String(user._id)) {
        toast((t) => (
          <div onClick={() => { toast.dismiss(t.id); navigate(`/chat/${senderId}`); }} style={{ cursor: 'pointer' }}>
            <strong>New message</strong>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              {msg.content || (msg.mediaUrl ? 'Sent an attachment' : 'New message')}
            </p>
          </div>
        ));
      }
    };

    const handlePartnerMsg = (msg) => {
      const senderId = msg.sender_id?._id || msg.sender_id;
      if (location.pathname === `/partner-chat/${senderId}` || location.pathname === `/chat/${senderId}`) return;
      if (String(senderId) !== String(user._id)) {
        toast((t) => (
          <div onClick={() => { toast.dismiss(t.id); navigate(`/partner-chat/${senderId}`); }} style={{ cursor: 'pointer' }}>
            <strong style={{ color: '#ec4899' }}>Partner message 🔒</strong>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              {msg.content || (msg.image_url ? 'Sent an image' : 'New message')}
            </p>
          </div>
        ));
      }
    };

    socket.on('new_message', handleNewMsg);
    socket.on('partner_new_message', handlePartnerMsg);

    return () => {
      socket.off('new_message', handleNewMsg);
      socket.off('partner_new_message', handlePartnerMsg);
    };
  }, [user, location.pathname, navigate]);

  // Push notification setup — only runs once per login session
  useEffect(() => {
    if (!user) return;
    const setupPush = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const register = await navigator.serviceWorker.register('/sw.js');
          let subscription = await register.pushManager.getSubscription();

          if (!subscription) {
            const res = await api.get('/api/push/vapidPublicKey');
            const publicVapidKey = res.publicKey;
            if (!publicVapidKey) return;

            subscription = await register.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          }
          // Send to backend
          await api.post('/api/push/subscribe', subscription);
        }
      } catch (err) {
        console.error('Push setup failed:', err);
      }
    };
    setupPush();
  }, [user?._id]);

  if (loading) {
    return <div className="app-loader"><div className="loader-spinner" /></div>;
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
        <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><ReelsPage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/partner-chat/:partnerId" element={<ProtectedRoute><PartnerChatPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <BottomNav />}
      <Toaster position="top-center" toastOptions={{ style: { background: '#2d2d2d', color: '#fff' } }} />
    </div>
  );
}

export default App;
