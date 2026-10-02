import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../lib/api';
import TextWithLinks from './TextWithLinks';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send, Trash2, Link2 } from 'lucide-react';

const LEARNING_TYPES = {
  general: 'Note',
  question: 'Question',
  explanation: 'Explanation',
  resource: 'Resource',
  note: 'Note',
};

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(post.likes?.some((l) => (l._id || l) === user?._id) || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(
    post.savedBy?.some((s) => String(s?._id || s) === String(user?._id)) || false
  );
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwner = user?._id === (post.author?._id || post.author);
  const typeLabel = LEARNING_TYPES[post.learningType] || null;
  const images = post.images?.length > 0 ? post.images : post.imageUrl ? [post.imageUrl] : [];

  const handleLike = async () => {
    const prev = liked;
    const prevCount = likesCount;
    setLiked(!prev);
    setLikesCount((c) => c + (prev ? -1 : 1));
    if (!prev) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 700);
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
    if (!liked) handleLike();
    else {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 700);
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
      setComments((prev) => [...prev, res]);
      setComment('');
    } catch {}
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
      if (navigator.share)
        await navigator.share({ title: post.content, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {}
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <article className="pc-card">
      <header className="pc-header">
        <button className="pc-author" onClick={() => navigate(`/profile/${post.author?._id}`)}>
          <Avatar src={post.author?.avatarUrl} name={post.author?.name} size={36} />
          <span className="pc-author-meta">
            <span className="pc-author-name">{post.author?.name}</span>
            <span className="pc-author-sub">
              {typeLabel && <span className="pc-type">{typeLabel}</span>}
              <span>{timeAgo(post.createdAt)}</span>
            </span>
          </span>
        </button>

        <div className="pc-menu-wrap">
          <button
            className="pc-icon-btn"
            onClick={() => setShowMenu((m) => !m)}
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="pc-menu"
                onClick={() => setShowMenu(false)}
              >
                {isOwner && (
                  <button onClick={handleDelete} className="pc-menu-item pc-menu-danger">
                    <Trash2 size={15} /> Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowMenu(false);
                  }}
                  className="pc-menu-item"
                >
                  Copy link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {post.content && <TextWithLinks text={post.content} className="pc-content" />}

      {post.type === 'image' && images.length > 0 && (
        <div className="pc-image-carousel" style={{ position: 'relative' }}>
          <div 
            className="pc-image-track" 
            onScroll={(e) => {
              const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
              if (idx !== currentImageIndex) setCurrentImageIndex(idx);
            }}
          >
            {images.map((img, idx) => (
              <div key={idx} className="pc-image-slide" onDoubleClick={handleDoubleTap}>
                <img src={api.getFileUrl(img)} alt="" />
              </div>
            ))}
          </div>
          
          {images.length > 1 && (
            <div className="pc-carousel-dots">
              {images.map((_, idx) => (
                <div key={idx} className={`pc-dot ${idx === currentImageIndex ? 'active' : ''}`} />
              ))}
            </div>
          )}

          <AnimatePresence>
            {heartAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="pc-heart-pop"
              >
                <Heart size={80} fill="#c96a3b" color="#c96a3b" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {post.type === 'code' && post.codeSnippet && (
        <pre className="pc-code">{post.codeSnippet}</pre>
      )}

      {post.sourceUrl && (
        <a className="pc-source" href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
          <Link2 size={13} /> {post.sourceUrl.replace(/^https?:\/\//, '').slice(0, 60)}
        </a>
      )}

      {post.tags?.length > 0 && (
        <div className="pc-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="pc-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <footer className="pc-actions">
        <div className="pc-actions-left">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className={`pc-action ${liked ? 'is-liked' : ''}`}
            onClick={handleLike}
            aria-label="Like"
          >
            <Heart size={19} fill={liked ? 'currentColor' : 'none'} />
            {likesCount > 0 && <span>{likesCount}</span>}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="pc-action"
            onClick={() => setShowComments((s) => !s)}
            aria-label="Comments"
          >
            <MessageCircle size={19} />
            {comments.length > 0 && <span>{comments.length}</span>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="pc-action" onClick={handleShare} aria-label="Share">
            <Send size={18} />
          </motion.button>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className={`pc-action ${saved ? 'is-saved' : ''}`}
          onClick={handleSave}
          aria-label="Save"
        >
          <Bookmark size={19} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
      </footer>

      {comments.length > 0 && !showComments && (
        <button className="pc-view-comments" onClick={() => setShowComments(true)}>
          View {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </button>
      )}

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pc-comment-list">
              {comments.map((c, i) => (
                <div key={c._id || i} className="pc-comment">
                  <span className="pc-comment-name">{c.author?.name || 'User'}</span>
                  <span className="pc-comment-text">{c.content}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pc-comment-bar">
        <Avatar src={user?.avatarUrl} name={user?.name} size={26} />
        <input
          placeholder="Add a comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleComment()}
        />
        {comment.trim() && (
          <button className="pc-post-comment" onClick={handleComment}>
            Post
          </button>
        )}
      </div>

      <style>{`
        .pc-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .pc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px;
        }
        .pc-author {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          text-align: left;
        }
        .pc-author-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .pc-author-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .pc-author-sub { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
        .pc-type {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--accent-light);
        }
        .pc-menu-wrap { position: relative; }
        .pc-icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }
        .pc-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .pc-menu {
          position: absolute; top: 36px; right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          min-width: 150px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 50;
        }
        .pc-menu-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 11px 14px;
          color: var(--text-primary);
          font-size: 13.5px;
          text-align: left;
        }
        .pc-menu-item:hover { background: var(--bg-hover); }
        .pc-menu-danger { color: var(--danger); }
        .pc-content {
          padding: 0 14px 12px;
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--text-primary);
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .text-link {
          color: var(--accent-light);
          text-decoration: underline;
          text-decoration-color: transparent;
          text-underline-offset: 2px;
          transition: text-decoration-color 0.15s;
        }
        .text-link:hover { text-decoration-color: var(--accent-light); }
        .text-mention, .text-hashtag {
          color: var(--accent);
          font-weight: 500;
          cursor: pointer;
        }
        .text-mention:hover, .text-hashtag:hover { text-decoration: underline; }
        
        .pc-image-carousel { position: relative; background: var(--bg-tertiary); }
        .pc-image-track {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pc-image-track::-webkit-scrollbar { display: none; }
        .pc-image-slide {
          flex: 0 0 100%;
          min-width: 100%;
          scroll-snap-align: start;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pc-image-slide img { width: 100%; max-height: 520px; object-fit: contain; }
        
        .pc-carousel-dots {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 4px;
          pointer-events: none;
        }
        .pc-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          transition: background 0.2s, transform 0.2s;
        }
        .pc-dot.active { background: white; transform: scale(1.2); }

        .pc-heart-pop {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .pc-code {
          margin: 0 14px 12px;
          background: #14110d;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-family: var(--font-mono);
          font-size: 12.5px;
          line-height: 1.6;
          color: #d8c9a8;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        .pc-source {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 14px 12px;
          padding: 7px 11px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--accent-light);
          font-size: 12.5px;
          font-weight: 500;
          overflow-wrap: anywhere;
        }
        .pc-source:hover { border-color: var(--border-light); background: var(--bg-hover); }
        .pc-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 12px; }
        .pc-tag { font-size: 12px; color: var(--text-secondary); }
        .pc-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 10px;
          border-top: 1px solid var(--border-color);
        }
        .pc-actions-left { display: flex; align-items: center; gap: 2px; }
        .pc-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
        }
        .pc-action:hover { background: var(--bg-hover); color: var(--text-secondary); }
        .pc-action.is-liked { color: var(--accent); }
        .pc-action.is-saved { color: var(--accent); }
        .pc-view-comments {
          width: 100%;
          text-align: left;
          padding: 8px 14px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .pc-view-comments:hover { color: var(--text-secondary); }
        .pc-comment-list { padding: 2px 14px 10px; display: flex; flex-direction: column; gap: 6px; }
        .pc-comment { font-size: 13.5px; line-height: 1.5; }
        .pc-comment-name { font-weight: 600; color: var(--text-primary); margin-right: 6px; }
        .pc-comment-text { color: var(--text-secondary); }
        .pc-comment-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 12px;
          border-top: 1px solid var(--border-color);
        }
        .pc-comment-bar input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 6px 0;
          font-size: 13.5px;
        }
        .pc-post-comment {
          color: var(--accent-light);
          font-weight: 600;
          font-size: 13px;
        }
        .pc-post-comment:hover { color: var(--accent); }
      `}</style>
    </article>
  );
}
