import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send, Trash2 } from 'lucide-react';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.some(l => (l._id || l) === user?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(
    post.savedBy?.some(s => String(s?._id || s) === String(user?._id))
  );
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [heartAnim, setHeartAnim] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const isOwner = user?._id === (post.author?._id || post.author);

  const handleLike = async () => {
    try {
      const res = await api.post(`/api/posts/${post._id}/like`);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
      if (res.liked) {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 600);
      }
    } catch {}
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      setSaved(res.saved);
    } catch {}
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/api/posts/${post._id}/comment`, { content: comment });
      setComments([...comments, res]);
      setComment('');
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/api/posts/${post._id}`);
      setDeleted(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s/60)}m`;
    if (s < 86400) return `${Math.floor(s/3600)}h`;
    return `${Math.floor(s/86400)}d`;
  };

  return (
    <div className="post-card card">
      {/* Header */}
      <div className="post-header">
        <div className="post-author" onClick={() => navigate(`/profile/${post.author?._id}`)} style={{ cursor: 'pointer' }}>
          <Avatar src={post.author?.avatarUrl} name={post.author?.name} size={38} />
          <div>
            <div className="post-author-name">{post.author?.name}</div>
            <div className="post-time">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        {isOwner ? (
          <button className="btn-icon btn-delete-post" onClick={handleDelete} title="Delete post">
            <Trash2 size={16} />
          </button>
        ) : (
          <button className="btn-icon"><MoreHorizontal size={18} /></button>
        )}
      </div>

      {/* Content */}
      <div className="post-content">
        {post.content && <p className="post-text">{post.content}</p>}
        {post.type === 'image' && post.imageUrl && (
          <div className="post-image-wrap" onDoubleClick={handleLike}>
            <img src={api.getFileUrl(post.imageUrl)} alt="" className="post-image" />
            <AnimatePresence>
              {heartAnim && (
                <motion.div
                  className="double-tap-heart"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={80} fill="white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {post.type === 'code' && post.codeSnippet && (
          <pre className="post-code">{post.codeSnippet}</pre>
        )}
      </div>

      {/* Actions */}
      <div className="post-actions">
        <div className="post-actions-left">
          <motion.button
            className="post-action-btn"
            onClick={handleLike}
            whileTap={{ scale: 0.8 }}
          >
            <Heart size={22} fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'currentColor'} />
          </motion.button>
          <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={22} />
          </button>
          <button className="post-action-btn"><Send size={20} /></button>
        </div>
        <motion.button
          className="post-action-btn"
          onClick={handleSave}
          whileTap={{ scale: 0.8 }}
        >
          <Bookmark size={22} fill={saved ? 'var(--accent-light)' : 'none'} stroke={saved ? 'var(--accent-light)' : 'currentColor'} />
        </motion.button>
      </div>

      {/* Likes */}
      {likesCount > 0 && (
        <div className="post-likes">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="post-comments">
          {comments.map((c, i) => (
            <div key={i} className="post-comment">
              <span className="comment-author">{c.author?.name || 'User'}</span>
              <span className="comment-text">{c.content}</span>
            </div>
          ))}
          <div className="comment-input-row">
            <input
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button className="comment-post-btn" onClick={handleComment} disabled={!comment.trim()}>Post</button>
          </div>
        </div>
      )}

      <style>{`
        .post-card {
          margin-bottom: 12px;
        }
        .post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
        }
        .post-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .post-author-name {
          font-weight: 600;
          font-size: 14px;
        }
        .post-time {
          font-size: 11px;
          color: var(--text-muted);
        }
        .post-content {
          position: relative;
        }
        .post-text {
          padding: 0 14px 10px;
          font-size: 14px;
          line-height: 1.5;
        }
        .post-image-wrap {
          position: relative;
          overflow: hidden;
        }
        .post-image {
          width: 100%;
          max-height: 500px;
          object-fit: cover;
        }
        .double-tap-heart {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
          pointer-events: none;
        }
        .post-code {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          margin: 0 14px 10px;
          font-size: 13px;
          font-family: 'Consolas', monospace;
          color: var(--accent-light);
          overflow-x: auto;
          white-space: pre-wrap;
        }
        .post-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
        }
        .post-actions-left {
          display: flex;
          gap: 2px;
        }
        .post-action-btn {
          padding: 6px 8px;
          border-radius: 8px;
          color: var(--text-primary);
          transition: background 0.15s;
        }
        .post-action-btn:hover {
          background: var(--bg-hover);
        }
        .post-likes {
          padding: 0 14px 4px;
          font-size: 13px;
          font-weight: 600;
        }
        .post-comments {
          padding: 8px 14px 14px;
          border-top: 1px solid var(--border-color);
        }
        .post-comment {
          font-size: 13px;
          margin-bottom: 4px;
        }
        .comment-author {
          font-weight: 600;
          margin-right: 6px;
        }
        .comment-text {
          color: var(--text-secondary);
        }
        .comment-input-row {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .comment-input-row input {
          flex: 1;
          padding: 8px 12px;
          font-size: 13px;
        }
        .comment-post-btn {
          color: var(--accent-light);
          font-weight: 600;
          font-size: 13px;
          padding: 0 8px;
        }
        .comment-post-btn:disabled {
          opacity: 0.4;
        }
        .btn-delete-post {
          color: rgba(239, 68, 68, 0.6);
          transition: color 0.2s;
        }
        .btn-delete-post:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}
