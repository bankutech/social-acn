import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send, Trash2, Link2 } from 'lucide-react';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked]             = useState(post.likes?.some(l => (l._id || l) === user?._id) || false);
  const [likesCount, setLikesCount]   = useState(post.likes?.length || 0);
  const [saved, setSaved]             = useState(post.savedBy?.some(s => String(s?._id || s) === String(user?._id)) || false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment]         = useState('');
  const [comments, setComments]       = useState(post.comments || []);
  const [heartAnim, setHeartAnim]     = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const isOwner = user?._id === (post.author?._id || post.author);

  const handleLike = async () => {
    const prev = liked;
    const prevCount = likesCount;
    setLiked(!prev);
    setLikesCount(c => c + (prev ? -1 : 1));
    if (!prev) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 800);
    }
    try {
      const res = await api.post(`/api/posts/${post._id}/like`);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      setLiked(prev);
      setLikesCount(prevCount);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) {
      handleLike();
    } else {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 800);
    }
  };

  const handleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      setSaved(res.saved);
    } catch {
      setSaved(prev);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/api/posts/${post._id}/comment`, { content: comment });
      setComments(prev => [...prev, res]);
      setComment('');
      setShowComments(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/posts/${post._id}/comment/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (e) {
      console.error('Failed to delete comment:', e);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/posts/${post._id}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.content || 'Check out this post', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {}
  };

  const formatTimestamp = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const isLongCaption = post.content && post.content.length > 95;

  return (
    <div className="ig-card-root">
      {/* ── Post Header ── */}
      <div className="ig-card-header">
        <div
          className="ig-user-badge"
          onClick={() => navigate(`/profile/${post.author?._id || post.author}`)}
        >
          <div className="ig-avatar-ring">
            <Avatar src={post.author?.avatarUrl} name={post.author?.name} size={34} />
          </div>
          <div className="ig-user-meta">
            <span className="ig-author-name">{post.author?.name || 'Sphere Member'}</span>
            {post.location && <span className="ig-post-location">{post.location}</span>}
          </div>
        </div>

        {/* More Actions Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(m => !m)}
            className="ig-more-btn"
            aria-label="More options"
          >
            <MoreHorizontal size={20} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={{ duration: 0.15 }}
                className="ig-menu-dropdown"
                onClick={() => setShowMenu(false)}
              >
                {isOwner && (
                  <button onClick={handleDelete} className="ig-menu-item text-danger">
                    <Trash2 size={16} /> Delete post
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowMenu(false);
                  }}
                  className="ig-menu-item"
                >
                  <Link2 size={16} /> Copy link
                </button>
                <button onClick={() => setShowMenu(false)} className="ig-menu-item text-muted">
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Media Content ── */}
      {post.type === 'image' && post.imageUrl && (
        <div className="ig-media-wrapper" onDoubleClick={handleDoubleTap}>
          <img
            src={api.getFileUrl(post.imageUrl)}
            alt=""
            loading="lazy"
            className="ig-media-image"
          />
          <AnimatePresence>
            {heartAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.25, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="ig-heart-pop"
              >
                <Heart size={96} fill="#ffffff" color="#ffffff" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Code Snippet Card */}
      {post.type === 'code' && post.codeSnippet && (
        <div className="ig-code-card">
          <pre className="ig-code-pre">
            <code>{post.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* ── Instagram Action Bar ── */}
      <div className="ig-action-bar">
        <div className="ig-action-left">
          {/* Like Button */}
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.72 }}
            className="ig-action-btn"
            aria-label="Like"
          >
            <Heart
              size={24}
              fill={liked ? '#ed4956' : 'none'}
              color={liked ? '#ed4956' : '#ffffff'}
              strokeWidth={liked ? 0 : 1.8}
            />
          </motion.button>

          {/* Comment Button */}
          <motion.button
            onClick={() => setShowComments(s => !s)}
            whileTap={{ scale: 0.72 }}
            className="ig-action-btn"
            aria-label="Comment"
          >
            <MessageCircle size={24} color="#ffffff" strokeWidth={1.8} />
          </motion.button>

          {/* Share Button */}
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.72 }}
            className="ig-action-btn"
            aria-label="Share"
          >
            <Send size={22} color="#ffffff" strokeWidth={1.8} style={{ transform: 'rotate(10deg)' }} />
          </motion.button>
        </div>

        {/* Bookmark / Save */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.72 }}
          className="ig-action-btn"
          aria-label="Save"
        >
          <Bookmark
            size={24}
            fill={saved ? '#ffffff' : 'none'}
            color="#ffffff"
            strokeWidth={saved ? 0 : 1.8}
          />
        </motion.button>
      </div>

      {/* ── Likes Counter ── */}
      <div className="ig-likes-row">
        {likesCount > 0 ? (
          <span className="ig-likes-count">
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        ) : (
          <span className="ig-likes-empty" onClick={handleLike}>
            Be the first to like this
          </span>
        )}
      </div>

      {/* ── Caption Section ── */}
      {post.content && (
        <div className="ig-caption-row">
          <span
            className="ig-caption-author"
            onClick={() => navigate(`/profile/${post.author?._id || post.author}`)}
          >
            {post.author?.name || 'Sphere Member'}
          </span>{' '}
          <span className="ig-caption-text">
            {isLongCaption && !expandedCaption
              ? `${post.content.slice(0, 92)}...`
              : post.content}
          </span>
          {isLongCaption && !expandedCaption && (
            <button
              onClick={() => setExpandedCaption(true)}
              className="ig-more-caption-btn"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* ── Comments Preview / Expand ── */}
      {comments.length > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="ig-view-comments-btn"
        >
          View all {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* ── Expanded Comments Thread ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ig-comments-thread"
          >
            {comments.map((c, i) => {
              const canDelete = user && (String(user._id || user.id) === String(c.author?._id || c.author) || isOwner);
              return (
                <div key={c._id || i} className="ig-comment-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className="ig-comment-author">{c.author?.name || 'User'}</span>
                    <span className="ig-comment-text">{c.content}</span>
                  </div>
                  {canDelete && c._id && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px 4px' }}
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Relative Timestamp ── */}
      <div className="ig-timestamp">
        {formatTimestamp(post.createdAt)}
      </div>

      {/* ── Add a Comment Input ── */}
      <div className="ig-comment-input-row">
        <Avatar src={user?.avatarUrl} name={user?.name} size={26} />
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleComment()}
          className="ig-comment-field"
        />
        {comment.trim() && (
          <button onClick={handleComment} className="ig-post-comment-btn">
            Post
          </button>
        )}
      </div>

      <style>{`
        .ig-card-root {
          background: #000000;
          color: #ffffff;
          width: 100%;
          font-family: var(--font);
        }

        .ig-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
        }

        .ig-user-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .ig-avatar-ring {
          padding: 1.5px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ig-user-meta {
          display: flex;
          flex-direction: column;
        }

        .ig-author-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.1px;
        }
        .ig-author-name:hover {
          text-decoration: underline;
        }

        .ig-post-location {
          font-size: 11px;
          color: #a8a8a8;
          line-height: 1.2;
        }

        .ig-more-btn {
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .ig-menu-dropdown {
          position: absolute;
          top: 32px;
          right: 0;
          background: #1e1e24;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          overflow: hidden;
          z-index: 100;
          min-width: 160px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        }

        .ig-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
        }
        .ig-menu-item:last-child {
          border-bottom: none;
        }
        .ig-menu-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .ig-menu-item.text-danger {
          color: #ed4956;
          font-weight: 600;
        }
        .ig-menu-item.text-muted {
          color: #a8a8a8;
        }

        .ig-media-wrapper {
          position: relative;
          width: 100%;
          background: #0a0a0c;
          user-select: none;
        }

        .ig-media-image {
          width: 100%;
          max-height: 600px;
          object-fit: cover;
          display: block;
        }

        .ig-heart-pop {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8));
          z-index: 10;
        }

        .ig-code-card {
          padding: 10px 14px;
        }

        .ig-code-pre {
          background: #141418;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px;
          font-family: 'Consolas', 'Fira Code', monospace;
          font-size: 12.5px;
          color: #38bdf8;
          overflow-x: auto;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .ig-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px 6px;
        }

        .ig-action-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ig-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          -webkit-tap-highlight-color: transparent;
        }

        .ig-likes-row {
          padding: 2px 14px 4px;
        }

        .ig-likes-count {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.1px;
        }

        .ig-likes-empty {
          font-size: 13px;
          color: #a8a8a8;
          cursor: pointer;
        }
        .ig-likes-empty:hover {
          color: #ffffff;
        }

        .ig-caption-row {
          padding: 2px 14px 4px;
          font-size: 13.5px;
          line-height: 1.45;
          color: #ffffff;
        }

        .ig-caption-author {
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          margin-right: 4px;
        }
        .ig-caption-author:hover {
          text-decoration: underline;
        }

        .ig-caption-text {
          color: #efefef;
        }

        .ig-more-caption-btn {
          background: none;
          border: none;
          color: #8e8e8e;
          font-size: 13.5px;
          cursor: pointer;
          padding: 0 4px;
        }
        .ig-more-caption-btn:hover {
          color: #ffffff;
        }

        .ig-view-comments-btn {
          background: none;
          border: none;
          color: #8e8e8e;
          font-size: 13px;
          cursor: pointer;
          padding: 2px 14px 4px;
          display: block;
          text-align: left;
        }
        .ig-view-comments-btn:hover {
          color: #a8a8a8;
        }

        .ig-comments-thread {
          padding: 4px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ig-comment-item {
          font-size: 13px;
          line-height: 1.4;
        }

        .ig-comment-author {
          font-weight: 600;
          color: #ffffff;
          margin-right: 6px;
        }

        .ig-comment-text {
          color: #e4e4e7;
        }

        .ig-timestamp {
          padding: 4px 14px 8px;
          font-size: 10px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #71717a;
        }

        .ig-comment-input-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 14px;
          border-top: 0.5px solid rgba(255, 255, 255, 0.06);
        }

        .ig-comment-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 13px;
          padding: 4px 0;
        }
        .ig-comment-field::placeholder {
          color: #71717a;
        }

        .ig-post-comment-btn {
          background: none;
          border: none;
          color: #0095f6;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 6px;
        }
        .ig-post-comment-btn:hover {
          color: #38bdf8;
        }
      `}</style>
    </div>
  );
}
