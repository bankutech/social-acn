import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, FileText, Loader } from 'lucide-react';
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
    api.get(`/api/search?q=${encodeURIComponent(debouncedQ)}&type=${tab}`)
      .then(data => setResults(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQ, tab]);

  const hasResults = results.users.length > 0 || results.posts.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Search size={18} color="rgba(255,255,255,0.5)" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people and posts..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: 15
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults({ users: [], posts: [] }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={16} color="rgba(255,255,255,0.5)" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {['all', 'users', 'posts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: tab === t ? 'white' : 'rgba(255,255,255,0.07)',
                color: tab === t ? '#000' : 'rgba(255,255,255,0.6)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize', transition: 'all 0.2s'
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 0' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader size={24} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && debouncedQ.length >= 2 && !hasResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
            <Search size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p style={{ margin: 0 }}>No results for "{debouncedQ}"</p>
          </motion.div>
        )}

        {/* Users Section */}
        {results.users.length > 0 && (tab === 'all' || tab === 'users') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px' }}>
              <Users size={15} color="#a78bfa" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>People</span>
            </div>
            <AnimatePresence>
              {results.users.map((u, i) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/profile/${u._id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s'
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{u.name}</div>
                    {u.bio && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                    <div style={{ color: '#a78bfa', fontSize: 11, marginTop: 2 }}>{u.followers?.length || 0} followers</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Posts Section */}
        {results.posts.length > 0 && (tab === 'all' || tab === 'posts') && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px' }}>
              <FileText size={15} color="#22d3ee" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Posts</span>
            </div>
            <AnimatePresence>
              {results.posts.map((post, i) => (
                <motion.div key={post._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
