import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, PlusSquare, MessageCircle, User, Zap } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Feed' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/create', icon: PlusSquare, label: 'Post' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'You' },
];

export default function BottomNav() {
  const location = useLocation();
  
  // Hide on certain pages
  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  // Hide on chat detail pages
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/)) return null;

  return (
    <nav className="glass-nav-container">
      <div className="glass-nav-dock">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          
          return (
            <NavLink key={path} to={path} className="nav-dock-item">
              <div className="item-content">
                <motion.div
                  className={`nav-icon-wrapper ${isActive ? 'active' : ''}`}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow" 
                      className="nav-active-glow"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
                <span className={`nav-dock-label ${isActive ? 'active' : ''}`}>{label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>

      <style>{`
        .glass-nav-container {
          position: fixed;
          bottom: 24px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          padding: 0 20px;
          pointer-events: none;
          z-index: 1000;
        }

        .glass-nav-dock {
          pointer-events: auto;
          background: rgba(15, 15, 18, 0.7);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          display: flex;
          align-items: center;
          padding: 8px 12px;
          gap: 4px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          max-width: 440px;
          width: 100%;
          justify-content: space-around;
        }

        .nav-dock-item {
          text-decoration: none;
          flex: 1;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .item-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 0;
        }

        .nav-icon-wrapper {
          position: relative;
          color: rgba(255, 255, 255, 0.4);
          width: 44px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s;
        }

        .nav-icon-wrapper.active {
          color: #a78bfa;
        }

        .nav-active-glow {
          position: absolute;
          width: 32px;
          height: 12px;
          background: #7c3aed;
          bottom: -14px;
          filter: blur(14px);
          opacity: 0.6;
          z-index: -1;
        }

        .nav-dock-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s;
        }

        .nav-dock-label.active {
          color: white;
          opacity: 1;
        }

        /* MOBILE OPTIMIZATION */
        @media (max-width: 480px) {
          .glass-nav-container {
            bottom: 12px;
            padding: 0 12px;
          }
          .glass-nav-dock {
            padding: 6px 8px;
            border-radius: 24px;
            gap: 2px;
          }
          .nav-dock-label {
            display: none;
          }
          .nav-icon-wrapper {
            height: 44px;
          }
        }
      `}</style>
    </nav>
  );
}
