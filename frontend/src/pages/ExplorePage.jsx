import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Search, UserPlus, UserCheck } from 'lucide-react';

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
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <h1>Explore</h1>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search people..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

      {!search.trim() && (
        <div style={{ padding: '8px 16px 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
          SUGGESTED FOR YOU
        </div>
      )}

      {loading ? (
        <SkeletonLoader type="chat" count={6} />
      ) : displayUsers.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3>{search ? 'No users found' : 'No suggestions'}</h3>
          <p>Try searching for people by name or email</p>
        </div>
      ) : (
        displayUsers.map((u, i) => {
          const isFollowed = followingMap[u._id] ?? u.followers?.some(f => (f._id || f) === user?._id);
          return (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="explore-user"
            >
              <div className="explore-user-info" onClick={() => navigate(`/profile/${u._id}`)}>
                <Avatar src={u.avatarUrl} name={u.name} size={52} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {u.bio ? u.bio.slice(0, 50) : u.skills?.slice(0, 3).join(' · ') || 'ACN+ Member'}
                  </div>
                  {u.followers && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {u.followers.length} followers
                    </div>
                  )}
                </div>
              </div>
              <button
                className={isFollowed ? 'btn-secondary' : 'btn-primary'}
                onClick={() => handleFollow(u._id)}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                {isFollowed ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
              </button>
            </motion.div>
          );
        })
      )}

      <style>{`
        .explore-user {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 12px;
          transition: background 0.15s;
        }
        .explore-user:hover {
          background: var(--bg-hover);
        }
        .explore-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
