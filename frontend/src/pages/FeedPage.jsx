import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import NotificationPanel from '../components/NotificationPanel';
import { PostSkeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Sparkles, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../config/brand';
import { getSocket } from '../lib/socket';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    loadFeed();
    loadStories();
    loadSuggestions();
    loadUnreadNotifications();

    if (!user) return;
    const socket = getSocket();
    const notifEvent = `notification_${user._id || user.id}`;
    const handleNotif = () => setUnreadNotifs(prev => prev + 1);
    socket.on(notifEvent, handleNotif);

    return () => socket.off(notifEvent, handleNotif);
  }, [user]);

  const loadUnreadNotifications = async () => {
    try {
      const data = await api.get('/api/notifications');
      setUnreadNotifs(data.filter(n => !n.read).length);
    } catch {}
  };

  const loadStories = async () => {
    try {
      const data = await api.get('/api/stories');
      setStories(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await api.get('/api/auth/explore');
      setSuggestions((data || []).slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowSuggestion = async (suggestedUserId) => {
    try {
      const res = await api.post(`/api/auth/follow/${suggestedUserId}`);
      setFollowingMap(prev => ({ ...prev, [suggestedUserId]: res.following }));
    } catch (e) {
      console.error(e);
    }
  };

  const loadFeed = async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const postsData = await api.get(`/api/posts/feed?page=${pageToLoad}&limit=10`);
      
      if (append) {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p._id));
          const newPosts = (postsData || []).filter(p => !ids.has(p._id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(postsData || []);
      }

      if (postsData.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(nextPage, true);
    }
  };

  return (
    <div className="ig-feed-layout">
      {/* Instagram Mobile Top Navigation Header */}
      <header className="ig-header">
        <div className="ig-header-inner">
          <div
            className="ig-brand-container"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="ig-brand-text">Sphere</span>
          </div>

          <div className="ig-header-actions">
            {/* Notifications Heart */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="ig-icon-btn"
              onClick={() => setShowNotifications(true)}
              aria-label="Notifications"
            >
              <Heart size={24} color="#ffffff" strokeWidth={1.8} />
              {unreadNotifs > 0 && <span className="ig-notif-dot" />}
            </motion.button>

            {/* Direct Messages */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="ig-icon-btn"
              onClick={() => navigate('/chat')}
              aria-label="Direct Messages"
            >
              <Send size={23} color="#ffffff" strokeWidth={1.8} style={{ transform: 'rotate(10deg)' }} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Feed Content Wrapper */}
      <div className="ig-feed-wrapper">
        {/* Left Column: Feed Stream */}
        <main className="ig-feed-container">
          {/* Instagram Stories Tray */}
          <div className="ig-stories-wrapper">
            <StoryBar stories={stories} onRefresh={loadStories} />
          </div>

          {/* Posts Stream */}
          <div className="ig-posts-stack">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div key="loading" className="ig-skeleton-stack">
                  {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
              ) : posts.length === 0 ? (
                <motion.div
                  key="empty"
                  className="ig-empty-state"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="ig-empty-icon-ring">
                    <Sparkles size={36} color="#0095f6" />
                  </div>
                  <h3>Welcome to Sphere</h3>
                  <p>When you follow people or share photos, stories, and reels, you will see them here.</p>
                  <button className="ig-explore-btn" onClick={() => navigate('/explore')}>
                    Find people to follow
                  </button>
                </motion.div>
              ) : (
                posts.map((post) => (
                  <article key={post._id} className="ig-post-article">
                    <PostCard post={post} onUpdate={loadFeed} />
                  </article>
                ))
              )}
            </AnimatePresence>

            {/* Infinite Scroll Trigger */}
            {hasMore && posts.length > 0 && (
              <div 
                style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}
                ref={(el) => {
                  if (el && !loadingMore && !loading) {
                    const observer = new IntersectionObserver((entries) => {
                      if (entries[0].isIntersecting) {
                        observer.disconnect();
                        handleLoadMore();
                      }
                    }, { threshold: 0.5 });
                    observer.observe(el);
                  }
                }}
              >
                {loadingMore && <PostSkeleton />}
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Desktop Suggested Users Sidebar (visible on >= 1024px) */}
        <aside className="ig-desktop-right-sidebar">
          {/* Current User Card */}
          <div className="ig-user-card" onClick={() => navigate(`/profile/${user?._id || user?.id}`)}>
            <Avatar src={user?.avatarUrl} name={user?.name} size={46} />
            <div className="ig-user-info">
              <span className="ig-username">{user?.name}</span>
              <span className="ig-user-subtitle">{user?.bio || 'Sphere Member'}</span>
            </div>
            <button
              className="ig-switch-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/profile/edit');
              }}
            >
              Edit
            </button>
          </div>

          {/* Suggestions Header */}
          <div className="ig-suggestions-header">
            <span className="ig-suggestions-title">Suggested for you</span>
            <button className="ig-see-all-btn" onClick={() => navigate('/explore')}>
              See All
            </button>
          </div>

          {/* Suggestions List */}
          <div className="ig-suggestions-list">
            {suggestions.length === 0 ? (
              <p className="ig-no-suggestions">No suggestions right now</p>
            ) : (
              suggestions.map((sug) => {
                const isFollowed = followingMap[sug._id] ?? sug.followers?.some(f => (f._id || f) === (user?._id || user?.id));
                return (
                  <div key={sug._id} className="ig-suggestion-item">
                    <div className="ig-suggestion-user" onClick={() => navigate(`/profile/${sug._id}`)}>
                      <Avatar src={sug.avatarUrl} name={sug.name} size={36} />
                      <div className="ig-suggestion-info">
                        <span className="ig-suggestion-name">{sug.name}</span>
                        <span className="ig-suggestion-sub">Suggested for you</span>
                      </div>
                    </div>
                    <button 
                      className={`ig-follow-link ${isFollowed ? 'following' : ''}`}
                      onClick={() => handleFollowSuggestion(sug._id)}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Instagram Desktop Footer */}
          <footer className="ig-desktop-footer">
            <nav className="ig-footer-links">
              <a href="#about" onClick={(e) => e.preventDefault()}>About</a> · 
              <a href="#help" onClick={(e) => e.preventDefault()}>Help</a> · 
              <a href="#press" onClick={(e) => e.preventDefault()}>Press</a> · 
              <a href="#api" onClick={(e) => e.preventDefault()}>API</a> · 
              <a href="#jobs" onClick={(e) => e.preventDefault()}>Jobs</a> · 
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a> · 
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a> · 
              <a href="#locations" onClick={(e) => e.preventDefault()}>Locations</a>
            </nav>
            <span className="ig-copyright">© 2026 SPHERE FROM META-STYLE</span>
          </footer>
        </aside>
      </div>

      {/* Notifications Slide-over Sheet */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          setUnreadNotifs(0);
        }} 
      />

      <style>{`
        .ig-feed-layout {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Mobile View: Default (< 768px) */
        @media (max-width: 767px) {
          .ig-feed-layout {
            padding-top: 54px;
            padding-bottom: 60px;
          }

          .ig-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 54px;
            background: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ig-header-inner {
            width: 100%;
            max-width: 480px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
          }

          .ig-desktop-right-sidebar {
            display: none !important;
          }

          .ig-feed-container {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
          }
        }

        /* Desktop View (>= 768px) */
        @media (min-width: 768px) {
          .ig-header {
            display: none !important;
          }

          .ig-feed-layout {
            padding-top: 32px;
            padding-bottom: 40px;
          }

          .ig-feed-wrapper {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 48px;
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .ig-feed-container {
            width: 100%;
            max-width: 630px;
            flex: 1;
            min-width: 0;
          }

          /* Right Sidebar: Hidden below 1024px */
          @media (max-width: 1023px) {
            .ig-desktop-right-sidebar {
              display: none !important;
            }
          }

          /* Right Sidebar: Active on >= 1024px */
          @media (min-width: 1024px) {
            .ig-desktop-right-sidebar {
              width: 320px;
              flex-shrink: 0;
              position: sticky;
              top: 32px;
              display: flex;
              flex-direction: column;
              padding-top: 8px;
            }
          }
        }

        .ig-brand-container {
          cursor: pointer;
          user-select: none;
        }

        .ig-brand-text {
          font-family: var(--font-cursive);
          font-size: 32px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: #ffffff;
          line-height: 1;
        }

        .ig-header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ig-icon-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          -webkit-tap-highlight-color: transparent;
        }

        .ig-notif-dot {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ed4956;
          border: 1.5px solid #000000;
        }

        .ig-stories-wrapper {
          background: #000000;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 12px;
        }

        .ig-posts-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ig-post-article {
          background: #000000;
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          overflow: hidden;
        }

        @media (max-width: 767px) {
          .ig-post-article {
            border-left: none;
            border-right: none;
            border-radius: 0;
            border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
          }
        }

        .ig-empty-state {
          text-align: center;
          padding: 60px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ig-empty-icon-ring {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          border: 2px solid rgba(0, 149, 246, 0.3);
          background: rgba(0, 149, 246, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ig-empty-state h3 {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .ig-empty-state p {
          font-size: 14px;
          color: #a8a8a8;
          line-height: 1.5;
          margin-bottom: 24px;
          max-width: 300px;
        }

        .ig-explore-btn {
          background: #0095f6;
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .ig-explore-btn:hover {
          background: #1877f2;
        }

        .ig-skeleton-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px 0;
        }

        /* ------------------------------------------
           DESKTOP RIGHT SIDEBAR COMPONENTS
           ------------------------------------------ */
        .ig-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          cursor: pointer;
        }

        .ig-user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .ig-username {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ig-user-subtitle {
          font-size: 12px;
          color: #a8a8a8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ig-switch-btn {
          background: none;
          border: none;
          color: #0095f6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }
        .ig-switch-btn:hover {
          color: #ffffff;
        }

        .ig-suggestions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .ig-suggestions-title {
          font-size: 14px;
          font-weight: 600;
          color: #a8a8a8;
        }

        .ig-see-all-btn {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .ig-see-all-btn:hover {
          color: #a8a8a8;
        }

        .ig-suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .ig-suggestion-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ig-suggestion-user {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }

        .ig-suggestion-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .ig-suggestion-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ig-suggestion-sub {
          font-size: 12px;
          color: #71717a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ig-follow-link {
          background: none;
          border: none;
          color: #0095f6;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: color 0.15s ease;
        }
        .ig-follow-link:hover {
          color: #ffffff;
        }
        .ig-follow-link.following {
          color: #71717a;
        }

        .ig-no-suggestions {
          font-size: 12px;
          color: #71717a;
          padding: 8px 0;
        }

        .ig-desktop-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ig-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 11px;
          color: #71717a;
          line-height: 1.6;
        }

        .ig-footer-links a {
          color: #71717a;
          text-decoration: none;
        }
        .ig-footer-links a:hover {
          text-decoration: underline;
        }

        .ig-copyright {
          font-size: 11px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
