import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Film, PlusSquare, MessageCircle, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/reels', icon: Film, label: 'Reels' },
  { path: '/create', icon: PlusSquare, label: 'Create' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  
  // Hide on certain pages
  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  // Hide on chat detail pages
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/)) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
          <NavLink key={path} to={path} className="bottom-nav-item">
            <motion.div
              className={`bottom-nav-icon ${isActive ? 'active' : ''}`}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {path === '/create' ? (
                <div className="create-btn-wrap">
                  <Icon size={22} />
                </div>
              ) : (
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              )}
              {isActive && <div className="nav-active-dot" />}
            </motion.div>
            <span className={`bottom-nav-label ${isActive ? 'active' : ''}`}>{label}</span>
          </NavLink>
        );
      })}

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--bottom-nav-height);
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          z-index: 200;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          flex: 1;
          padding: 8px 0;
        }
        .bottom-nav-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .bottom-nav-icon.active {
          color: var(--accent-light);
        }
        .nav-active-dot {
          position: absolute;
          bottom: -6px;
          width: 4px;
          height: 4px;
          background: var(--accent);
          border-radius: 50%;
        }
        .bottom-nav-label {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .bottom-nav-label.active {
          color: var(--accent-light);
          font-weight: 600;
        }
        .create-btn-wrap {
          background: var(--gradient-primary);
          border-radius: 10px;
          padding: 8px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </nav>
  );
}
