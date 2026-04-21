import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Sparkles, TrendingUp, Users, X } from 'lucide-react';

export default function ExplorePage() {
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
      setFollowingMap(prev => ({ ...prev, [userId]: res.following }));
    } catch {}
  };

  const displayUsers = search.trim() ? searchResults : users;

  return (
    <div className="premium-explore-layout">
      {/* Search Header */}
      <header className="explore-premium-header">
        <div className="search-pill-container">
          <Search size={18} className="search-icon-inside" />
          <input
            className="premium-search-input"
            placeholder="Search the ACN+ network..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <main className="explore-content-area">
        {!search.trim() && (
          <div className="discovery-header">
            <div className="discovery-title">
              <TrendingUp size={16} />
              <span>Recommended Students</span>
            </div>
            <p className="discovery-subtitle">Expand your network with like-minded peers</p>
          </div>
        )}

        <div className="explorer-grid">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="premium-user-card" style={{ pointerEvents: 'none' }}>
                    <div className="card-user-meta">
                      <Skeleton width="60px" height="60px" borderRadius="50%" />
                      <div className="user-text-meta">
                        <Skeleton width="140px" height="16px" style={{ marginBottom: 8 }} />
                        <Skeleton width="200px" height="12px" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayUsers.length === 0 ? (
              <motion.div
                className="no-results-premium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="no-result-icon">
                  <Users size={40} />
                </div>
                <h3>Silence in the network</h3>
                <p>We couldn't find anyone matching "{search}". Try another term.</p>
              </motion.div>
            ) : (
              displayUsers.map((u, i) => {
                const currentUserId = user?._id || user?.id;
                const isFollowed = followingMap[u._id] ?? u.followers?.some(f => (f._id || f) === currentUserId);
                
                return (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="premium-user-card"
                  >
                    <div className="card-user-meta" onClick={() => navigate(`/profile/${u._id}`)}>
                      <div className="avatar-ring">
                        <Avatar src={u.avatarUrl} name={u.name} size={60} />
                      </div>
                      <div className="user-text-meta">
                        <div className="user-row-top">
                          <h4 className="u-name">{u.name}</h4>
                        </div>
                        <p className="u-bio">
                          {u.bio ? u.bio.slice(0, 60) + (u.bio.length > 60 ? '...' : '') : 
                           u.skills?.length > 0 ? u.skills.slice(0, 2).join(' · ') : 'ACN+ Student'}
                        </p>
                        <div className="u-stats-mini">
                          <Users size={12} />
                          <span>{u.followers?.length || 0} followers</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className={isFollowed ? 'btn-following-pill' : 'btn-follow-pill'}
                      onClick={() => handleFollow(u._id)}
                    >
                      {isFollowed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      <span>{isFollowed ? 'Following' : 'Follow'}</span>
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .premium-explore-layout {
          background: #000000;
          min-height: 100vh;
          color: white;
          padding-bottom: 90px;
        }

        .explore-premium-header {
          position: sticky;
          top: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 16px;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-pill-container {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
        }

        .search-icon-inside {
          position: absolute;
          left: 16px;
          color: rgba(255, 255, 255, 0.4);
        }

        .premium-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px 16px 14px 48px;
          color: white;
          font-size: 15px;
          transition: all 0.2s;
        }
        .premium-search-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #a78bfa;
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.1);
        }

        .explore-content-area {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        .discovery-header {
          margin-bottom: 24px;
        }
        .discovery-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }
        .discovery-subtitle {
          font-size: 20px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .explorer-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .premium-user-card {
          background: rgba(15, 15, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s;
        }
        .premium-user-card:hover { border-color: rgba(255, 255, 255, 0.12); background: rgba(20, 20, 25, 0.8); }

        .card-user-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          cursor: pointer;
        }

        .avatar-ring {
          padding: 2px;
          border-radius: 50%;
          border: 2px solid transparent;
          transition: border-color 0.3s;
        }
        .premium-user-card:hover .avatar-ring { border-color: #a78bfa; }

        .user-text-meta {
          min-width: 0;
        }
        .u-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .u-bio { font-size: 13px; color: rgba(255, 255, 255, 0.5); line-height: 1.4; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .u-stats-mini { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #a78bfa; font-weight: 600; }

        .btn-follow-pill, .btn-following-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s;
        }

        .btn-follow-pill { background: white; color: black; }
        .btn-follow-pill:hover { transform: scale(1.05); }
        
        .btn-following-pill { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); }

        .no-results-premium {
          text-align: center;
          padding: 60px 20px;
        }
        .no-result-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: rgba(255,255,255,0.2);
        }

        .skeleton-explorer-row {
          height: 80px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
}
