import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import StoryBar from '../components/StoryBar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const [postsData, storiesData] = await Promise.all([
        api.get('/api/posts/feed'),
        api.get('/api/stories')
      ]);
      setPosts(postsData);
      setStories(storiesData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ACN+</h1>
        <div className="page-header-actions">
          <button className="btn-icon" onClick={() => navigate('/explore')}>
            <Search size={22} />
          </button>
          <button className="btn-icon" onClick={() => navigate('/ai')}>
            <Sparkles size={22} />
          </button>
        </div>
      </div>

      {/* Stories */}
      {loading ? (
        <SkeletonLoader type="story" count={6} />
      ) : (
        <StoryBar stories={stories} onRefresh={loadFeed} />
      )}

      {/* Feed */}
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <SkeletonLoader type="post" count={3} />
        ) : posts.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles size={64} />
            <h3>Your feed is empty</h3>
            <p>Follow other students to see their posts, or create your first post!</p>
            <button className="btn-primary" onClick={() => navigate('/explore')} style={{ marginTop: 8 }}>
              Discover People
            </button>
          </motion.div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PostCard post={post} onUpdate={loadFeed} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
