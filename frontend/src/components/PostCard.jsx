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

  const [liked, setLiked]             = useState(post.likes?.some(l => (l._id || l) === user?._id) || false);
  const [likesCount, setLikesCount]   = useState(post.likes?.length || 0);
  const [saved, setSaved]             = useState(post.savedBy?.some(s => String(s?._id || s) === String(user?._id)) || false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment]         = useState('');
  const [comments, setComments]       = useState(post.comments || []);
  const [heartAnim, setHeartAnim]     = useState(false);
  const [showMenu, setShowMenu]       = useState(false);

  const isOwner = user?._id === (post.author?._id || post.author);

  const handleLike = async () => {
    const prev = liked;
    const prevCount = likesCount;
    setLiked(!prev);
    setLikesCount(c => c + (prev ? -1 : 1));
    if (!prev) { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 700); }
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
    else { setHeartAnim(true); setTimeout(() => setHeartAnim(false), 700); }
  };

  const handleSave = async () => {
    const prev = saved;
    setSaved(!prev);
    try {
      const res = await api.post(`/api/posts/${post._id}/save`);
      setSaved(res.saved);
    } catch { setSaved(prev); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/api/posts/${post._id}/comment`, { content: comment });
      setComments(prev => [...prev, res]);
      setComment('');
    } catch {}
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/posts/${post._id}`);
      if (onUpdate) onUpdate();
    } catch (err) { alert(err.message || 'Failed to delete'); }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.content, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); }
    } catch {}
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ background: '#000', borderBottom: '0.5px solid rgba(255,255,255,0.08)', marginBottom: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.author?._id}`)}
        >
          <Avatar src={post.author?.avatarUrl} name={post.author?.name} size={32} />
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
              {post.author?.name}
            </div>
            {post.location && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{post.location}</div>
            )}
          </div>
        </div>

        {/* More / Delete */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(m => !m)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'white' }}
          >
            <MoreHorizontal size={20} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 32, right: 0,
                  background: '#262626', borderRadius: 12,
                  overflow: 'hidden', zIndex: 50,
                  minWidth: 160,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}
                onClick={() => setShowMenu(false)}
              >
                {isOwner && (
                  <button onClick={handleDelete} style={menuItemStyle('#ef4444')}>
                    <Trash2 size={15} /> Delete
                  </button>
                )}
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMenu(false); }} style={menuItemStyle('white')}>
                  Copy link
                </button>
                <button onClick={() => setShowMenu(false)} style={menuItemStyle('rgba(255,255,255,0.5)')}>
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Image ── */}
      {post.type === 'image' && post.imageUrl && (
        <div style={{ position: 'relative', width: '100%', background: '#111' }} onDoubleClick={handleDoubleTap}>
          <img
            src={api.getFileUrl(post.imageUrl)}
            alt=""
            style={{ width: '100%', maxHeight: 600, objectFit: 'cover', display: 'block' }}
          />
          <AnimatePresence>
            {heartAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.6))'
                }}
              >
                <Heart size={90} fill="white" color="white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Code snippet */}
      {post.type === 'code' && post.codeSnippet && (
        <pre style={{
          background: '#0d1117', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '12px 14px',
          margin: '0 12px 8px',
          fontSize: 13, fontFamily: "'Consolas', monospace",
          color: '#79c0ff', overflowX: 'auto', whiteSpace: 'pre-wrap'
        }}>
          {post.codeSnippet}
        </pre>
      )}

      {/* ── Action row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Like */}
          <motion.button onClick={handleLike} whileTap={{ scale: 0.75 }} style={actionBtnStyle}>
            <Heart
              size={24}
              fill={liked ? '#ef4444' : 'none'}
              color={liked ? '#ef4444' : 'white'}
              strokeWidth={1.8}
            />
          </motion.button>

          {/* Comment */}
          <button onClick={() => setShowComments(s => !s)} style={actionBtnStyle}>
            <MessageCircle size={24} color="white" strokeWidth={1.8} />
          </button>

          {/* Share */}
          <button onClick={handleShare} style={actionBtnStyle}>
            <Send size={22} color="white" strokeWidth={1.8} />
          </button>
        </div>

        {/* Save */}
        <motion.button onClick={handleSave} whileTap={{ scale: 0.75 }} style={actionBtnStyle}>
          <Bookmark
            size={24}
            fill={saved ? 'white' : 'none'}
            color="white"
            strokeWidth={1.8}
          />
        </motion.button>
      </div>

      {/* ── Likes count ── */}
      {likesCount > 0 && (
        <div style={{ padding: '2px 14px 4px', color: 'white', fontSize: 13, fontWeight: 700 }}>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* ── Caption ── */}
      {post.content && (
        <div style={{ padding: '2px 14px 6px', fontSize: 14, lineHeight: 1.5, color: 'white' }}>
          <span style={{ fontWeight: 700, marginRight: 6 }}>{post.author?.name}</span>
          {post.content}
        </div>
      )}

      {/* ── Comments preview ── */}
      {comments.length > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px 4px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}
        >
          View all {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* ── Full comments ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 14px 0' }}>
              {comments.map((c, i) => (
                <div key={c._id || i} style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.4, color: 'white' }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{c.author?.name || 'User'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{c.content}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timestamp ── */}
      <div style={{ padding: '4px 14px 10px', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {timeAgo(post.createdAt)}
      </div>

      {/* ── Comment input ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px 12px',
        borderTop: '0.5px solid rgba(255,255,255,0.06)'
      }}>
        <Avatar src={user?.avatarUrl} name={user?.name} size={28} />
        <input
          placeholder="Add a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleComment()}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', color: 'white', fontSize: 13,
            caretColor: 'white'
          }}
        />
        {comment.trim() && (
          <button
            onClick={handleComment}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0095f6', fontWeight: 700, fontSize: 13 }}
          >
            Post
          </button>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = {
  background: 'none', border: 'none',
  cursor: 'pointer', padding: 2,
  display: 'flex', alignItems: 'center',
  WebkitTapHighlightColor: 'transparent'
};

const menuItemStyle = (color) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', padding: '13px 16px',
  background: 'none', border: 'none',
  cursor: 'pointer', color,
  fontSize: 14, fontWeight: color === 'white' ? 400 : 600,
  borderBottom: '0.5px solid rgba(255,255,255,0.06)'
});