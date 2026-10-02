import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, User, Bell, Search, Users } from 'lucide-react';
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
    api
      .get('/api/notifications')
      .then((data) => {
        setUnreadCount(data.filter((n) => !n.read).length);
      })
      .catch(() => {});

    // Socket listener for new notifications
    const socket = getSocket();

    const handleNotif = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on(`notification_${user._id || user.id}`, handleNotif);

    return () => {
      socket.off(`notification_${user._id || user.id}`, handleNotif);
    };
  }, [user]);

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/groups', icon: Users, label: 'Groups' },
    {
      action: () => setShowNotifications(true),
      icon: Bell,
      label: 'Alerts',
      badge: unreadCount > 0,
    },
    { path: '/profile', icon: User, label: 'You' },
  ];

  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/))
    return null;

  return (
    <nav className="bnav-root" aria-label="Main navigation">
      <div className="bnav-bar">
        {navItems.map(({ path, action, icon: Icon, label, isCreate, badge }) => {
          const isActive = path
            ? path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
            : false;

          const content = (
            <>
              {isCreate ? (
                <span className="bnav-create">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
              ) : (
                <span className="bnav-icon-wrap">
                  <Icon size={19} strokeWidth={isActive ? 2.1 : 1.7} />
                </span>
              )}
              {badge && <span className="bnav-badge" />}
              <span className="bnav-label">{label}</span>
            </>
          );

          return path ? (
            <NavLink key={path} to={path} className={`bnav-item ${isActive ? 'active' : ''}`} aria-label={label}>
              {content}
            </NavLink>
          ) : (
            <button key={label} onClick={action} className="bnav-item" type="button" aria-label={label}>
              {content}
            </button>
          );
        })}
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          setUnreadCount(0); // Optimistic clear
        }}
      />
    </nav>
  );
}
