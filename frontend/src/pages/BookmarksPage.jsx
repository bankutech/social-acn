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
      <div style={{ maxWidth: 630, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <Bookmark size={20} color="#ffffff" fill="#ffffff" />
          <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700 }}>Saved</h1>
          {!loading && <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="loader-spinner" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20
            }}>
              <Bookmark size={34} color="rgba(255,255,255,0.7)" />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Save posts for later</h3>
            <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6, maxWidth: 320 }}>
              When you save photos and posts, they will appear here. Only you can see what you've saved.
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
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
