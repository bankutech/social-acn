import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader } from 'lucide-react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import api from '../lib/api';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQ || debouncedQ.trim().length < 2) {
      setResults({ users: [], posts: [] });
      return;
    }
    setLoading(true);
    api
      .get(`/api/search?q=${encodeURIComponent(debouncedQ)}&type=${tab}`)
      .then((data) => setResults({ users: data.users || [], posts: data.posts || [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQ, tab]);

  const hasResults = results.users.length > 0 || results.posts.length > 0;
  const showUsers = results.users.length > 0 && (tab === 'all' || tab === 'users');
  const showPosts = results.posts.length > 0 && (tab === 'all' || tab === 'posts');

  return (
    <div className="page-container" style={{ paddingBottom: 90 }}>
      <div className="search-header">
        <div className="search-box">
          <Search size={17} className="search-box-icon" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people and posts"
            aria-label="Search"
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => {
                setQuery('');
                setResults({ users: [], posts: [] });
              }}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="search-tabs" role="tablist">
          {['all', 'users', 'posts'].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`search-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        {loading && (
          <div className="loading-row">
            <Loader size={18} className="spin" /> Searching…
          </div>
        )}

        {!loading && debouncedQ.trim().length >= 2 && !hasResults && (
          <div className="empty-block">
            <p className="empty-lede">Nothing for “{debouncedQ}”.</p>
            <p className="empty-hint">
              Check the spelling, or try a shorter fragment of the name or topic.
            </p>
          </div>
        )}

        {!loading && debouncedQ.trim().length < 2 && (
          <div className="empty-block">
            <p className="empty-lede">Search ACN+.</p>
            <p className="empty-hint">
              Find classmates by name, or posts by topic — “thermodynamics”, “spanish”, “linear
              algebra”.
            </p>
          </div>
        )}

        {showUsers && (
          <section className="search-section">
            <h2 className="search-section-label">People</h2>
            <ul className="search-user-list">
              {results.users.map((u) => (
                <li
                  key={u._id}
                  className="search-user-row"
                  onClick={() => navigate(`/profile/${u._id}`)}
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={42} />
                  <div className="search-user-info">
                    <span className="search-user-name">{u.name}</span>
                    {u.bio && <span className="search-user-bio">{u.bio}</span>}
                    <span className="search-user-meta">{u.followers?.length || 0} followers</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showPosts && (
          <section className="search-section">
            <h2 className="search-section-label">Posts</h2>
            {results.posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
