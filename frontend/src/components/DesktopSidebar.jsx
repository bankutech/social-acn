import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  Send, 
  Heart, 
  PlusSquare, 
  Sparkles, 
  Bookmark, 
  Settings, 
  LogOut, 
  Menu, 
  ShieldAlert, 
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationPanel from './NotificationPanel';
import api from '../lib/api';
import { getSocket } from '../lib/socket';

export default function DesktopSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menus on path change
  useEffect(() => {
    setShowMoreMenu(false);
  }, [location.pathname]);

  // Click outside to close more menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync notifications
  useEffect(() => {
    if (!user) return;
    loadUnreadNotifications();

    const socket = getSocket();
    const notifEvent = `notification_${user._id || user.id}`;
    const handleNotif = () => setUnreadNotifs(prev => prev + 1);
    socket.on(notifEvent, handleNotif);

    return () => socket.off(notifEvent, handleNotif);
  }, [user]);

  const loadUnreadNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setUnreadNotifs((data || []).filter(n => !n.read).length);
    } catch {}
  };

  const currentUserId = user?._id || user?.id;

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (active) => <Home size={24} strokeWidth={active ? 2.5 : 1.75} fill={active ? '#ffffff' : 'none'} />,
      isActive: location.pathname === '/'
    },
    {
      to: '/search',
      label: 'Search',
      icon: (active) => <Search size={24} strokeWidth={active ? 2.75 : 1.75} />,
      isActive: location.pathname === '/search'
    },
    {
      to: '/explore',
      label: 'Explore',
      icon: (active) => <Compass size={24} strokeWidth={active ? 2.5 : 1.75} fill={active ? '#ffffff' : 'none'} />,
      isActive: location.pathname === '/explore'
    },
    {
      to: '/reels',
      label: 'Reels',
      icon: (active) => <Film size={24} strokeWidth={active ? 2.5 : 1.75} fill={active ? 'rgba(255, 255, 255, 0.2)' : 'none'} />,
      isActive: location.pathname === '/reels'
    },
    {
      to: '/chat',
      label: 'Messages',
      icon: (active) => <Send size={23} strokeWidth={active ? 2.5 : 1.75} fill={active ? '#ffffff' : 'none'} style={{ transform: 'rotate(10deg)' }} />,
      isActive: location.pathname.startsWith('/chat') || location.pathname.startsWith('/partner-chat')
    },
    {
      action: () => setShowNotifications(true),
      label: 'Notifications',
      badge: unreadNotifs > 0,
      icon: (active) => (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={24} strokeWidth={showNotifications ? 2.5 : 1.75} fill={showNotifications ? '#ed4956' : 'none'} color={showNotifications ? '#ed4956' : '#ffffff'} />
          {unreadNotifs > 0 && <span className="sidebar-badge-dot" />}
        </div>
      ),
      isActive: showNotifications
    },
    {
      to: '/create',
      label: 'Create',
      icon: (active) => <PlusSquare size={24} strokeWidth={active ? 2.5 : 1.75} />,
      isActive: location.pathname === '/create'
    },
    {
      to: '/ai',
      label: 'AI Tutor',
      icon: (active) => <Sparkles size={24} strokeWidth={active ? 2.5 : 1.75} color={active ? '#38bdf8' : '#ffffff'} />,
      isActive: location.pathname === '/ai'
    },
    {
      to: `/profile/${currentUserId}`,
      label: 'Profile',
      icon: (active) => (
        <div className={`sidebar-avatar-ring ${active ? 'active' : ''}`}>
          <Avatar src={user?.avatarUrl} name={user?.name} size={24} />
        </div>
      ),
      isActive: location.pathname.startsWith('/profile')
    }
  ];

  return (
    <>
      <aside className="ig-desktop-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper" onClick={() => navigate('/')}>
          {/* Expanded Logo (>= 1200px) */}
          <span className="sidebar-brand-text">Sphere</span>
          {/* Collapsed Logo (768px - 1199px) */}
          <div className="sidebar-brand-icon">
            <Sparkles size={26} color="#0095f6" />
          </div>
        </div>

        {/* Primary Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            const isItemActive = item.isActive;
            const content = (
              <>
                <div className="nav-icon-container">
                  {item.icon(isItemActive)}
                </div>
                <span className={`nav-label ${isItemActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </>
            );

            if (item.action) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={`sidebar-nav-item ${isItemActive ? 'active' : ''}`}
                  title={item.label}
                >
                  {content}
                </button>
              );
            }

            return (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${(isActive || isItemActive) ? 'active' : ''}`}
                title={item.label}
              >
                {content}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom More / Options Container */}
        <div className="sidebar-bottom" ref={menuRef}>
          {/* More Popover Dropdown */}
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="sidebar-more-menu"
              >
                <button
                  className="more-menu-item"
                  onClick={() => { setShowMoreMenu(false); navigate('/bookmarks'); }}
                >
                  <Bookmark size={18} />
                  <span>Saved</span>
                </button>
                <button
                  className="more-menu-item"
                  onClick={() => { setShowMoreMenu(false); navigate('/profile/edit'); }}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                {user?.isAdmin && (
                  <button
                    className="more-menu-item"
                    onClick={() => { setShowMoreMenu(false); navigate('/admin'); }}
                  >
                    <ShieldAlert size={18} />
                    <span>Admin Panel</span>
                  </button>
                )}
                <div className="more-menu-divider" />
                <button
                  className="more-menu-item danger"
                  onClick={() => { setShowMoreMenu(false); logout(); }}
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className={`sidebar-nav-item more-toggle ${showMoreMenu ? 'active' : ''}`}
            onClick={() => setShowMoreMenu(prev => !prev)}
            title="More"
          >
            <div className="nav-icon-container">
              <Menu size={24} strokeWidth={showMoreMenu ? 2.5 : 1.75} />
            </div>
            <span className={`nav-label ${showMoreMenu ? 'font-bold' : ''}`}>More</span>
          </button>
        </div>
      </aside>

      {/* Slide-over Notifications Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          setUnreadNotifs(0);
        }}
      />

      <style>{`
        /* ============================================================
           INSTAGRAM DESKTOP SIDEBAR STYLING
           ============================================================ */
        .ig-desktop-sidebar {
          display: none;
        }

        @media (min-width: 768px) {
          .ig-desktop-sidebar {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 1000;
            background: #000000;
            border-right: 1px solid rgba(255, 255, 255, 0.12);
            transition: width 0.2s cubic-bezier(0.2, 0, 0, 1);
            user-select: none;
          }

          /* Tablet & Small Laptop: 768px - 1199px (Collapsed Icon Rail) */
          @media (max-width: 1199px) {
            .ig-desktop-sidebar {
              width: 72px;
              padding: 24px 8px 20px 8px;
              align-items: center;
            }

            .sidebar-brand-text {
              display: none;
            }

            .sidebar-brand-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              transition: background 0.15s ease;
            }
            .sidebar-brand-icon:hover {
              background: rgba(255, 255, 255, 0.08);
            }

            .nav-label {
              display: none;
            }

            .sidebar-nav-item {
              width: 48px;
              height: 48px;
              justify-content: center;
              padding: 0;
              margin: 4px 0;
            }

            .sidebar-more-menu {
              left: 64px;
              bottom: 12px;
            }
          }

          /* Desktop & Widescreen: >= 1200px (Full Instagram Sidebar) */
          @media (min-width: 1200px) {
            .ig-desktop-sidebar {
              width: 244px;
              padding: 24px 12px 20px 12px;
              align-items: stretch;
            }

            .sidebar-brand-text {
              display: block;
              font-family: var(--font-cursive);
              font-size: 30px;
              letter-spacing: 0.5px;
              color: #ffffff;
              padding: 8px 12px;
              line-height: 1;
            }

            .sidebar-brand-icon {
              display: none;
            }

            .nav-label {
              display: block;
              font-size: 14.5px;
              color: #f5f5f5;
              letter-spacing: 0.1px;
              transition: font-weight 0.1s ease;
            }

            .sidebar-nav-item {
              width: 100%;
              height: 48px;
              padding: 0 12px;
              margin: 4px 0;
              gap: 16px;
            }

            .sidebar-more-menu {
              left: 12px;
              bottom: 60px;
              width: 240px;
            }
          }

          .sidebar-brand-wrapper {
            cursor: pointer;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
          }

          .sidebar-nav {
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          .sidebar-nav-item {
            display: flex;
            align-items: center;
            border-radius: 10px;
            background: transparent;
            border: none;
            color: #ffffff;
            cursor: pointer;
            text-decoration: none;
            transition: background 0.15s ease, transform 0.1s ease;
            position: relative;
          }

          .sidebar-nav-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }

          .sidebar-nav-item:active {
            transform: scale(0.97);
          }

          .sidebar-nav-item.active .nav-label {
            font-weight: 700;
          }

          .nav-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            color: #ffffff;
          }

          .sidebar-badge-dot {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ed4956;
            border: 1.5px solid #000000;
          }

          .sidebar-avatar-ring {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid transparent;
            transition: border-color 0.15s ease;
          }

          .sidebar-avatar-ring.active {
            border-color: #ffffff;
          }

          .font-bold {
            font-weight: 700 !important;
          }

          .sidebar-bottom {
            position: relative;
            margin-top: auto;
          }

          .sidebar-more-menu {
            position: absolute;
            background: #262626;
            border-radius: 16px;
            padding: 8px;
            min-width: 220px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .more-menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: #f5f5f5;
            font-size: 14px;
            cursor: pointer;
            text-align: left;
            transition: background 0.15s ease;
          }

          .more-menu-item:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .more-menu-item.danger {
            color: #ed4956;
          }

          .more-menu-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.12);
            margin: 4px 0;
          }
        }
      `}</style>
    </>
  );
}
