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
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 0 env(safe-area-inset-bottom, 0px)',
      pointerEvents: 'none'
    }}>
      <div style={{
        pointerEvents: 'auto',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(10,10,12,0.96)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'stretch',
        padding: '6px 4px 8px',
        gap: 0
      }}>
        {navItems.map(({ path, icon: Icon, label, isCreate, badge }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textDecoration: 'none',
                padding: '4px 0',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative'
              }}
            >
              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{ position: 'relative' }}
              >
                {isCreate ? (
                  /* ── Create button: gradient pill ── */
                  <div style={{
                    width: 48, height: 32,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.45)'
                  }}>
                    <Icon size={20} color="white" strokeWidth={2.5} />
                  </div>
                ) : (
                  /* ── Regular icon ── */
                  <div style={{
                    width: 48, height: 32,
                    borderRadius: 12,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}>
                    <Icon
                      size={22}
                      color={isActive ? 'white' : 'rgba(255,255,255,0.38)'}
                      strokeWidth={isActive ? 2.2 : 1.7}
                      fill={isActive && path === '/' ? 'white' : 'none'}
                    />
                  </div>
                )}

                {/* Notification badge */}
                {badge && (
                  <div style={{
                    position: 'absolute', top: 2, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444',
                    border: '1.5px solid rgba(10,10,12,0.96)'
                  }} />
                )}
              </motion.div>

              {/* Label */}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.3px',
                transition: 'color 0.2s',
                lineHeight: 1
              }}>
                {label}
              </span>

              {/* Active dot */}
              {isActive && !isCreate && (
                <motion.div
                  layoutId="nav-dot"
                  style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    bottom: -2
                  }}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}