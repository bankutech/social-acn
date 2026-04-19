import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Trash2, Send, X } from 'lucide-react';

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const data = await api.get('/api/reels');
      setReels(data);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
        <div className="loader-spinner" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: 'white', gap: 16 }}>
        <Play size={64} style={{ opacity: 0.3 }} />
        <h3>No Reels Yet</h3>
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '0 32px' }}>Follow people to see their reels here</p>
      </div>
    );
  }

  return (
    <div className="reels-container">
      <div className="reels-header">
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>Reels</h2>
        <span className="badge">🎓 Learn in 60s</span>
      </div>

      <div className="reels-scroll">
        {reels.map((reel) => (
          <ReelCard key={reel._id} reel={reel} onDelete={loadReels} currentUser={user} />
        ))}
      </div>

      <style>{`
        .reels-container {
          height: 100vh;
          background: #000;
          overflow: hidden;
          position: relative;
        }
        .reels-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%);
          pointer-events: none;
        }
        .reels-scroll {
          height: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
        }
        .reels-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export function ReelCard({ reel, onDelete, currentUser }) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(() =>
    reel.likes?.some(l => (l._id || l) === (currentUser?._id || currentUser?.id)) || false
  );
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(reel.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // IntersectionObserver — auto-play when in view
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          videoRef.current?.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(c => c + (newLiked ? 1 : -1));
    try {
      const res = await api.post(`/api/reels/${reel._id}/like`);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      // Revert optimistic update on failure
      setLiked(!newLiked);
      setLikesCount(c => c - (newLiked ? 1 : -1));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const newComment = await api.post(`/api/reels/${reel._id}/comment`, { content: commentText });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch {}
    setCommentLoading(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareData = { title: reel.title, text: reel.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied!');
      }
    } catch {}
  };

  const isOwner = (currentUser?._id || currentUser?.id) === (reel.author?._id || reel.author);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this reel?')) return;
    try {
      await api.delete(`/api/reels/${reel._id}`);
      if (onDelete) onDelete();
    } catch (err) { alert(err.message || 'Failed to delete'); }
  };

  return (
    <div className="reel-card" ref={cardRef} onClick={togglePlay}>
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={api.getFileUrl(reel.videoUrl)}
          className="reel-video"
          loop
          playsInline
          muted={muted}
          preload="metadata"
        />
      ) : (
        <div className="reel-placeholder">
          <Play size={64} style={{ opacity: 0.3 }} />
          <h3 style={{ color: 'white', marginTop: 16 }}>{reel.title}</h3>
        </div>
      )}

      {/* Play/pause overlay flash */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            className="reel-play-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Play size={64} fill="white" color="white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div className="reel-info">
        <div className="reel-author">
          <Avatar src={reel.author?.avatarUrl} name={reel.author?.name} size={36} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{reel.author?.name}</span>
        </div>
        <p className="reel-title">{reel.title}</p>
        {reel.hashtags?.length > 0 && (
          <p className="reel-hashtags">{reel.hashtags.map(h => `#${h}`).join(' ')}</p>
        )}
      </div>

      {/* Side actions */}
      <div className="reel-actions">
        {/* Like */}
        <motion.button onClick={handleLike} whileTap={{ scale: 0.75 }}>
          <Heart size={28} fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'white'} />
          <span>{likesCount}</span>
        </motion.button>

        {/* Comment */}
        <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }}>
          <MessageCircle size={28} />
          <span>{comments.length}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare}>
          <Share2 size={28} />
        </button>

        {/* Mute/Unmute */}
        <button onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}>
          {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
        </button>

        {/* Delete (owner only) */}
        {isOwner && (
          <button onClick={handleDelete} style={{ color: '#ef4444' }}>
            <Trash2 size={24} />
          </button>
        )}
      </div>

      {/* Comment Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="comment-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="comment-panel-header">
              <span style={{ fontWeight: 700, fontSize: 16 }}>Comments</span>
              <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div className="comment-list">
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.5, padding: '40px 0' }}>No comments yet. Be the first!</p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || i} className="comment-item">
                    <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={32} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author?.name || 'User'}</span>
                      <p style={{ fontSize: 14, margin: '2px 0 0', opacity: 0.9 }}>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="comment-form" onSubmit={handleComment}>
              <Avatar src={currentUser?.avatarUrl} name={currentUser?.name} size={32} />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                autoFocus
              />
              <button type="submit" disabled={!commentText.trim() || commentLoading}>
                <Send size={18} color={commentText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.3)'} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .reel-card {
          height: 100vh;
          scroll-snap-align: start;
          position: relative;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
        }
        .reel-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .reel-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 50%, #0a1628 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .reel-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.25);
          z-index: 5;
          pointer-events: none;
        }
        .reel-info {
          position: absolute;
          bottom: calc(var(--bottom-nav-height, 70px) + 16px);
          left: 0;
          right: 70px;
          padding: 16px;
          z-index: 10;
          background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%);
        }
        .reel-author {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          color: white;
        }
        .reel-title {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: white;
        }
        .reel-hashtags {
          font-size: 13px;
          color: #93c5fd;
        }
        .reel-actions {
          position: absolute;
          bottom: calc(var(--bottom-nav-height, 70px) + 24px);
          right: 12px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          z-index: 10;
        }
        .reel-actions button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: white;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
        }
        .reel-actions span {
          font-size: 12px;
          color: white;
        }
        .comment-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 70vh;
          background: #1a1a1a;
          border-radius: 20px 20px 0 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }
        .comment-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .comment-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 120px;
          max-height: 45vh;
        }
        .comment-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: white;
        }
        .comment-form {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        }
        .comment-form input {
          flex: 1;
          background: rgba(255,255,255,0.08);
          border: none;
          border-radius: 20px;
          padding: 10px 16px;
          color: white;
          font-size: 14px;
          outline: none;
        }
        .comment-form button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
      `}</style>
    </div>
  );
}
