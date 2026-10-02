import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useScrollMemory } from '../hooks/useScrollMemory';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import PullToRefresh from '../components/PullToRefresh';
import { PostSkeleton } from '../components/Skeleton';
import { BRAND } from '../config/brand';
import WelcomeChecklist from '../components/WelcomeChecklist';
import EmptyState from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { PenLine, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

export default function FeedPage() {
  useDocumentTitle('Feed');
  useScrollMemory('feed-scroll');
  const { user, loading: authLoading } = useAuth();
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
        setPosts((prev) => [...prev, ...postsData]);
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
    <div className="fp-root">
      <header className="fp-header">
        <div className="fp-header-inner">
          <button
            className="fp-wordmark"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            {BRAND.name}
          </button>
          <div className="fp-header-actions">
            <button
              className="fp-header-btn"
              onClick={() => navigate('/explore')}
              aria-label="Find people"
            >
              <Search size={18} />
            </button>
            <button
              className="fp-header-btn"
              onClick={() => navigate('/create')}
              aria-label="New post"
            >
              <PenLine size={18} />
            </button>
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={() => loadFeed(1, false)}>
        <main className="fp-main">
          <WelcomeChecklist />

        {loading ? (
          <div className="fp-stack">
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={PenLine}
            title="Nothing here yet"
            description="Posts from people you follow show up here. Find a few classmates to follow, or share something yourself."
            actionLabel="Find people"
            onAction={() => navigate('/explore')}
          />
        ) : (
          <div className="fp-stack">
            <Virtuoso
              useWindowScroll
              data={posts}
              endReached={handleLoadMore}
              itemContent={(index, post) => (
                <div style={{ paddingBottom: '16px' }}>
                  <PostCard key={post._id} post={post} onUpdate={() => loadFeed(1, false)} />
                </div>
              )}
              components={{
                Footer: () => (
                  <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                    {loadingMore && <div className="loader-spinner" />}
                  </div>
                )
              }}
            />
          </div>
        )}
        </main>
      </PullToRefresh>

      <style>{`
        .fp-root {
          min-height: 100vh;
          padding-bottom: calc(var(--bottom-nav-height) + 24px);
        }
        .fp-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }
        .fp-header-inner {
          max-width: 640px;
          margin: 0 auto;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }
        .fp-wordmark {
          font-family: var(--font-display);
          font-size: 21px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-primary);
        }
        .fp-header-actions { display: flex; align-items: center; gap: 4px; }
        .fp-header-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }
        .fp-header-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .fp-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 20px 16px 0;
        }
        .fp-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .fp-load-more {
          display: flex;
          justify-content: center;
          padding: 24px 0;
        }
      `}</style>
    </div>
  );
}
