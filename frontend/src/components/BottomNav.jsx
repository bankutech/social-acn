import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, MessageCircle, User, Bell, Search, Users } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    api.get('/api/notifications').then(data => {
      setUnreadCount(data.filter(n => !n.read).length);
    }).catch(() => {});

    // Use the shared socket singleton — no duplicate connection
    const socket = getSocket();
    const notifEvent = `notification_${user._id || user.id}`;
    
    const handleNotif = () => setUnreadCount(prev => prev + 1);
    socket.on(notifEvent, handleNotif);

    return () => socket.off(notifEvent, handleNotif);
  }, [user]);

  const navItems = [
    { path: '/',        icon: Home,          label: 'Feed'    },
    { path: '/search',  icon: Search,        label: 'Search'  },
    { path: '/create',  icon: Plus,          label: 'Create', isCreate: true },
    { action: () => setShowNotifications(true), icon: Bell, label: 'Alerts', badge: unreadCount > 0 },
    { path: '/profile', icon: User,          label: 'You'     },
  ];

  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/)) return null;

  return (
    <>
      <style>{`
        .bnav-root {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          padding: 0 0 env(safe-area-inset-bottom, 0px);
          pointer-events: none;
        }

        .bnav-bar {
          pointer-events: auto;
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border-top: 0.5px solid var(--border-color);
          display: flex;
          align-items: stretch;
          padding: 8px 4px calc(8px + env(safe-area-inset-bottom, 0px));
        }

        .bnav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          text-decoration: none;
          padding: 4px 0;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .bnav-icon-wrap {
          width: 44px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.18s ease;
          position: relative;
        }

        .bnav-icon-wrap.active {
          background: var(--accent-bg);
        }

        .bnav-create {
          width: 44px;
          height: 30px;
          border-radius: 10px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bnav-label {
          font-family: var(--font);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1;
          transition: color 0.18s ease;
        }

        .bnav-label.active {
          font-weight: 600;
          color: var(--accent);
        }

        .bnav-label.inactive {
          color: var(--text-muted);
        }

        .bnav-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--danger);
          border: 1.5px solid white;
        }
      `}</style>

      <nav className="bnav-root" aria-label="Main navigation">
        <div className="bnav-bar">
          {navItems.map(({ path, action, icon: Icon, label, isCreate, badge }) => {
            const isActive = path ? (path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)) : false;

            const content = (
              <motion.div
                whileTap={{ scale: 0.80 }}
                transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
              >
                {isCreate ? (
                  <div className="bnav-create">
                    <Icon size={17} color="#ffffff" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className={`bnav-icon-wrap ${isActive ? 'active' : ''}`}>
                    <Icon
                      size={20}
                      color={isActive ? 'var(--accent)' : 'var(--text-muted)'}
                      strokeWidth={isActive ? 2.2 : 1.6}
                    />
                  </div>
                )}

                {badge && <div className="bnav-badge" />}

                <span className={`bnav-label ${isActive ? 'active' : 'inactive'}`}>
                  {label}
                </span>

                {isActive && !isCreate && (
                  <motion.div
                    layoutId="bnav-active-dot"
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      position: 'absolute',
                      bottom: -6,
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
              </motion.div>
            );

            return path ? (
              <NavLink key={path} to={path} className="bnav-item">
                {content}
              </NavLink>
            ) : (
              <div key={label} onClick={action} className="bnav-item" style={{ cursor: 'pointer' }}>
                {content}
              </div>
            );
          })}
        </div>
      </nav>

      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => {
            setShowNotifications(false);
            setUnreadCount(0); // Optimistic clear
        }} 
      />
    </>
  );
}