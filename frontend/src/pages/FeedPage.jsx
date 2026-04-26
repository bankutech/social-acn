import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/Skeleton';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../config/brand';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const postsData = await api.get(`/api/posts/feed?page=${pageToLoad}&limit=10`);
      
      if (append) {
        setPosts(prev => [...prev, ...postsData]);
      } else {
        setPosts(postsData);
      }

      
      // If we got fewer posts than the limit, we're likely at the end
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
    <div className="premium-feed-layout">
      {/* Premium Sticky Header */}
      <header className="premium-nav-header">
        <div className="nav-header-left">
          <motion.div 
            className="mini-brand"
            whileHover={{ scale: 1.05 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src={BRAND.logo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
          </motion.div>
          <h1 className="nav-title">Sphere</h1>
        </div>
        
        <div className="nav-header-actions">
          <button className="nav-action-btn" onClick={() => navigate('/explore')} title="Search">
            <Search size={20} />
          </button>
        </div>
      </header>

      <main className="feed-content-area">

        {/* Global Post Feed */}
        <div className="post-feed-container">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="feed-skeleton-stack">
                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                className="premium-empty-feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="empty-icon-wrapper">
                  <Search size={48} />
                </div>
                <h3>Your World awaits</h3>
                <p>Start following friends to see their updates and moments here.</p>
                <button className="btn-premium-accent" onClick={() => navigate('/explore')}>
                  Discover people
                </button>
              </motion.div>
            ) : (
              posts.map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="feed-post-item"
                >
                  <PostCard post={post} onUpdate={loadFeed} />
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Infinite Scroll Trigger */}
          {hasMore && posts.length > 0 && (
            <div 
              style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}
              ref={(el) => {
                if (el && !loadingMore && !loading) {
                  const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
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

      <style>{`
        .premium-feed-layout {
          background: #000000;
          min-height: 100vh;
          padding-top: 72px; /* Header space */
          padding-bottom: 90px; /* Nav space */
        }

        /* STICKY HEADER */
        .premium-nav-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 1000;
        }

        .nav-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mini-brand {
          width: 32px;
          height: 32px;
          background: white;
          color: black;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        }

        .nav-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: white;
        }
        .plus-accent {
          color: #a78bfa;
        }

        .nav-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-action-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.2s;
        }
        .nav-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .ai-spark-icon {
          color: #22d3ee;
        }

        /* CONTENT AREA */
        .feed-content-area {
          max-width: 600px;
          margin: 0 auto;
        }

        .stories-section {
          padding: 8px 0 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 20px;
        }
        
        .stories-skeleton-row {
          display: flex;
          gap: 16px;
          padding: 0 16px;
          overflow: hidden;
        }
        .skeleton-circle-story {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .post-feed-container {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feed-post-item {
          background: rgba(15, 15, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .feed-post-item:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        /* EMPTY STATE */
        .premium-empty-feed {
          text-align: center;
          padding: 80px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .empty-icon-wrapper {
          width: 100px;
          height: 100px;
          background: rgba(167, 139, 250, 0.05);
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          margin-bottom: 24px;
        }
        .premium-empty-feed h3 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .premium-empty-feed p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .btn-premium-accent {
          background: white;
          color: black;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          transition: transform 0.2s;
        }
        .btn-premium-accent:hover { transform: scale(1.05); }

        }

        /* SKELETONS */
        .feed-skeleton-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .skeleton-card-premium {
          height: 400px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
