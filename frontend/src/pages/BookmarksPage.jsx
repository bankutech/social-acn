import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Loader } from 'lucide-react';
import PostCard from '../components/PostCard';
import api from '../lib/api';

export default function BookmarksPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    try {
      const data = await api.get('/api/bookmarks');
      setPosts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadBookmarks(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <Bookmark size={20} color="#a78bfa" fill="#a78bfa" />
        <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700 }}>Saved Posts</h1>
        {!loading && <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{posts.length} saved</span>}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader size={24} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'rgba(167,139,250,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20
          }}>
            <Bookmark size={36} color="#a78bfa" />
          </div>
          <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>No saved posts yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
            Tap the bookmark icon on any post to save it here for later.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <PostCard post={post} onUpdate={loadBookmarks} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
