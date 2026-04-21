import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';

const navItems = [
  { path: '/',        icon: Home,          label: 'Feed'    },
  { path: '/explore', icon: Compass,       label: 'Explore' },
  { path: '/create',  icon: Plus,          label: 'Post',   isCreate: true },
  { path: '/chat',    icon: MessageCircle, label: 'Chat'    },
  { path: '/profile', icon: User,          label: 'You'     },
];

export default function BottomNav() {
  const location = useLocation();

  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/)) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

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
          background: rgba(8, 8, 10, 0.92);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border-top: 0.5px solid rgba(240, 237, 232, 0.07);
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
          background: rgba(240, 237, 232, 0.09);
        }

        .bnav-create {
          width: 44px;
          height: 30px;
          border-radius: 10px;
          background: #f0ede8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bnav-label {
          font-family: 'Sora', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1;
          transition: color 0.18s ease;
        }

        .bnav-label.active {
          font-weight: 600;
          color: #f0ede8;
        }

        .bnav-label.inactive {
          color: rgba(240, 237, 232, 0.3);
        }

        .bnav-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          border: 1.5px solid #08080a;
        }
      `}</style>

      <nav className="bnav-root" aria-label="Main navigation">
        <div className="bnav-bar">
          {navItems.map(({ path, icon: Icon, label, isCreate, badge }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            return (
              <NavLink key={path} to={path} className="bnav-item">
                <motion.div
                  whileTap={{ scale: 0.80 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                >
                  {isCreate ? (
                    <div className="bnav-create">
                      <Icon size={17} color="#08080a" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className={`bnav-icon-wrap ${isActive ? 'active' : ''}`}>
                      <Icon
                        size={20}
                        color={isActive ? '#f0ede8' : 'rgba(240,237,232,0.32)'}
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
                        background: 'rgba(240,237,232,0.5)',
                        position: 'absolute',
                        bottom: -6,
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}