import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import api from '../lib/api';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

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
    const socket = getSocket();

    const handleNotif = () => {
      loadNotifications();
    };

    socket.on(`notification_${user._id || user.id}`, handleNotif);

    return () => {
      socket.off(`notification_${user._id || user.id}`, handleNotif);
    };
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getNotificationText = (n) => {
    switch (n.type) {
      case 'like':
        return 'liked your post.';
      case 'comment':
        return 'commented on your post.';
      case 'follow':
        return 'started following you.';
      case 'message':
        return 'sent you a message.';
      default:
        return 'interacted with you.';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            role="button"
            aria-label="Close notifications"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 8, 5, 0.7)',
              zIndex: 1100,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '72vh',
              background: 'var(--bg-secondary)',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <div
                style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-light)' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2px 20px 12px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h2
                style={{
                  color: 'var(--text-primary)',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 500,
                }}
              >
                Notifications
              </h2>
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-light)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Mark all read
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13.5,
                  }}
                >
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div
                  style={{
                    padding: 48,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13.5,
                  }}
                >
                  <Bell size={28} style={{ opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>Nothing yet. Activity on your posts shows up here.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={(e) => handleMarkAsRead(n._id, e)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '14px 20px',
                      background: n.read ? 'transparent' : 'var(--accent-bg)',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <Avatar src={n.sender?.avatarUrl} name={n.sender?.name} size={38} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: '0 0 2px',
                          color: 'var(--text-primary)',
                          fontSize: 13.5,
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{n.sender?.name}</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {getNotificationText(n)}
                        </span>
                      </p>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.read && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
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
