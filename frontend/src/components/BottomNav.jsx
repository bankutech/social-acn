import { useLocation, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, PlusSquare, Film, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth pages or active one-on-one / partner chats
  const hideOn = ['/login', '/signup'];
  if (hideOn.includes(location.pathname)) return null;
  if (location.pathname.match(/^\/chat\/.+/) || location.pathname.match(/^\/partner-chat\/.+/)) return null;

  const currentUserId = user?._id || user?.id;

  const navItems = [
    {
      path: '/',
      label: 'Home',
      renderIcon: (isActive) => (
        <Home
          size={24}
          color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
          strokeWidth={isActive ? 2.5 : 1.75}
          fill={isActive ? '#ffffff' : 'none'}
        />
      ),
      isActive: location.pathname === '/'
    },
    {
      path: '/explore',
      label: 'Search',
      renderIcon: (isActive) => (
        <Search
          size={24}
          color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
          strokeWidth={isActive ? 2.75 : 1.75}
        />
      ),
      isActive: location.pathname === '/explore' || location.pathname === '/search'
    },
    {
      path: '/create',
      label: 'Create',
      renderIcon: (isActive) => (
        <PlusSquare
          size={25}
          color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
          strokeWidth={isActive ? 2.5 : 1.75}
        />
      ),
      isActive: location.pathname === '/create'
    },
    {
      path: '/reels',
      label: 'Reels',
      renderIcon: (isActive) => (
        <Film
          size={24}
          color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
          strokeWidth={isActive ? 2.5 : 1.75}
          fill={isActive ? 'rgba(255, 255, 255, 0.2)' : 'none'}
        />
      ),
      isActive: location.pathname === '/reels'
    },
    {
      path: '/profile',
      label: 'Profile',
      renderIcon: (isActive) => {
        if (user?.avatarUrl) {
          return (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                padding: 1.5,
                border: isActive ? '2px solid #ffffff' : '1.5px solid transparent',
                transition: 'border-color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Avatar src={user.avatarUrl} name={user.name} size={24} />
            </div>
          );
        }
        return (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isActive ? '2px solid #ffffff' : '1.5px solid transparent'
            }}
          >
            <User
              size={23}
              color={isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'}
              strokeWidth={isActive ? 2.5 : 1.75}
            />
          </div>
        );
      },
      isActive: location.pathname.startsWith('/profile')
    }
  ];

  return (
    <>
      <style>{`
        .ig-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          padding: 0 0 env(safe-area-inset-bottom, 0px);
          pointer-events: none;
        }

        .ig-bottom-bar {
          pointer-events: auto;
          width: 100%;
          max-width: 480px;
          height: 52px;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-top: 0.5px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
        }

        .ig-nav-item {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }
      `}</style>

      <nav className="ig-bottom-nav" aria-label="Main Navigation">
        <div className="ig-bottom-bar">
          {navItems.map(({ path, label, renderIcon, isActive }) => (
            <NavLink
              key={path}
              to={path}
              aria-label={label}
              className="ig-nav-item"
            >
              <motion.div
                whileTap={{ scale: 0.78 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44
                }}
              >
                {renderIcon(isActive)}
              </motion.div>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
