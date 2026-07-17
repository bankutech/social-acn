import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCircle2, X } from 'lucide-react';
import api from '../lib/api';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function NotificationPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.emit('join', user._id || user.id);
    
    socket.on(`notification_${user._id || user.id}`, (data) => {
        // Optimistically load notifications again
        loadNotifications();
    });

    return () => socket.disconnect();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifications(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const getNotificationText = (n) => {
    switch (n.type) {
      case 'like': return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'follow': return 'started following you.';
      case 'message': return 'sent you a message.';
      default: return 'interacted with you.';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 1100
            }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: '80vh', background: '#0a0a0c',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              zIndex: 1101, display: 'flex', flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700 }}>Notifications</h2>
              <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Mark all read
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Bell size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} onClick={(e) => handleMarkAsRead(n._id, e)} style={{
                    display: 'flex', gap: 12, padding: '16px 20px',
                    background: n.read ? 'transparent' : 'rgba(167, 139, 250, 0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}>
                    <Avatar src={n.sender?.avatarUrl} name={n.sender?.name} size={44} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', color: 'white', fontSize: 14, lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 600 }}>{n.sender?.name}</span> {getNotificationText(n)}
                      </p>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', marginTop: 6 }} />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
