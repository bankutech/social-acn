import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Users, X } from 'lucide-react';

export default function ExplorePage() {
  useDocumentTitle('Explore');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const timer = setTimeout(() => searchUsers(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const loadSuggestions = async () => {
    try {
      const data = await api.get('/api/auth/explore');
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  const searchUsers = async () => {
    try {
      const data = await api.get(`/api/auth/search?q=${encodeURIComponent(search)}`);
      setSearchResults(data);
    } catch {}
  };

  const handleFollow = async (userId) => {
    try {
      const res = await api.post(`/api/auth/follow/${userId}`);
      setFollowingMap((prev) => ({ ...prev, [userId]: res.following }));
    } catch {}
  };

  const displayUsers = search.trim() ? searchResults : users;

  return (
    <div className="xp-root">
      <header className="xp-header">
        <div className="xp-header-inner">
          <h1>Find people</h1>
          <div className="xp-search">
            <Search size={16} />
            <input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="xp-main">
        {!search.trim() && (
          <p className="xp-section-label">
            {loading ? '' : displayUsers.length > 0 ? 'People you might know' : ''}
          </p>
        )}
        {search.trim() && searchResults.length > 0 && (
          <p className="xp-section-label">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </p>
        )}

        {loading ? (
          <div className="xp-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="xp-row" style={{ pointerEvents: 'none' }}>
                <Skeleton width="44px" height="44px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="150px" height="14px" />
                  <div style={{ marginTop: 6 }}>
                    <Skeleton width="220px" height="11px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search.trim() ? `No one matches “${search}”` : 'No suggestions right now'}
            description={
              search.trim()
                ? 'Check the spelling, or try a shorter name.'
                : "When classmates join Sphere, they'll show up here."
            }
          />
        ) : (
          <div className="xp-list">
            <AnimatePresence initial={false}>
              {displayUsers.map((u) => {
                const currentUserId = user?._id || user?.id;
                const isFollowed =
                  followingMap[u._id] ?? u.followers?.some((f) => (f._id || f) === currentUserId);

                return (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="xp-row"
                  >
                    <button className="xp-row-person" onClick={() => navigate(`/profile/${u._id}`)}>
                      <Avatar src={u.avatarUrl} name={u.name} size={44} />
                      <span className="xp-row-meta">
                        <span className="xp-row-name">{u.name}</span>
                        <span className="xp-row-sub">
                          {u.bio
                            ? u.bio
                            : u.skills?.length > 0
                              ? u.skills.slice(0, 3).join(' · ')
                              : `${u.followers?.length || 0} followers`}
                        </span>
                      </span>
                    </button>
                    <button
                      className={isFollowed ? 'xp-follow-btn is-following' : 'xp-follow-btn'}
                      onClick={() => handleFollow(u._id)}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck size={14} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Follow
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style>{`
        .xp-root {
          min-height: 100vh;
          padding-bottom: calc(var(--bottom-nav-height) + 24px);
        }
        .xp-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }
        .xp-header-inner {
          max-width: 640px;
          margin: 0 auto;
          padding: 14px 16px;
        }
        .xp-header h1 {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 500;
          margin-bottom: 12px;
        }
        .xp-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0 12px;
          color: var(--text-muted);
        }
        .xp-search:focus-within { border-color: var(--accent); }
        .xp-search input {
          background: transparent;
          border: none;
          padding: 10px 0;
          font-size: 14px;
        }
        .xp-search button {
          display: flex;
          color: var(--text-muted);
          padding: 4px;
        }
        .xp-search button:hover { color: var(--text-primary); }
        .xp-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 8px 16px;
        }
        .xp-section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 14px 0 6px;
        }
        .xp-list { display: flex; flex-direction: column; }
        .xp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .xp-row-person {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          text-align: left;
        }
        .xp-row-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .xp-row-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .xp-row-sub {
          font-size: 12.5px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 340px;
        }
        .xp-follow-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 600;
          background: var(--accent);
          color: #1d1915;
          flex-shrink: 0;
          transition: background 0.12s;
        }
        .xp-follow-btn:hover { background: var(--accent-light); }
        .xp-follow-btn.is-following {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 500;
        }
        .xp-follow-btn.is-following:hover { border-color: var(--border-light); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
