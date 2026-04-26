import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X, Trash2, Play, Volume2, VolumeX, MoreVertical, Music } from 'lucide-react';

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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#000'
      }}>
        <div className="loader-spinner" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#000',
        color: 'white', gap: 16
      }}>
        <Play size={64} style={{ opacity: 0.3 }} />
        <h3 style={{ margin: 0 }}>No Reels Yet</h3>
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '0 32px', margin: 0 }}>
          Follow people to see their reels here
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        pointerEvents: 'none'
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: 'white', margin: 0 }}>Reels</h2>
        <span style={{
          background: 'rgba(255,255,255,0.15)', color: 'white',
          fontSize: 12, padding: '3px 10px', borderRadius: 20,
          backdropFilter: 'blur(4px)'
        }}>🎓 Learn in 60s</span>
      </div>

      {/* Scroll container */}
      <div style={{
        height: '100%',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {reels.map((reel) => (
          <ReelCard key={reel._id} reel={reel} onDelete={loadReels} currentUser={user} />
        ))}
      </div>
    </div>
  );
}

export function ReelCard({ reel, onDelete, currentUser }) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const playIconTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  const [liked, setLiked] = useState(() =>
    reel.likes?.some(l => (l._id || l) === (currentUser?._id || currentUser?.id)) || false
  );
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(reel.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [followed, setFollowed] = useState(false);

  // Auto-play when in viewport
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

  // Sync muted
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Progress bar tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
    // Flash play/pause icon briefly
    setShowPlayIcon(true);
    clearTimeout(playIconTimer.current);
    playIconTimer.current = setTimeout(() => setShowPlayIcon(false), 800);
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
    try {
      if (navigator.share) {
        await navigator.share({ title: reel.title, text: reel.title, url: window.location.href });
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
    <div
      ref={cardRef}
      onClick={togglePlay}
      style={{
        height: '100vh',
        scrollSnapAlign: 'start',
        position: 'relative',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
    >
      {/* Video */}
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={api.getFileUrl(reel.videoUrl)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loop
          playsInline
          muted={muted}
          preload="metadata"
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 50%, #0a1628 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <Play size={64} style={{ opacity: 0.3, color: 'white' }} />
          <h3 style={{ color: 'white', marginTop: 16 }}>{reel.title}</h3>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
        zIndex: 5, pointerEvents: 'none'
      }} />

      {/* Play/Pause flash icon — only flashes briefly on tap */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 6, pointerEvents: 'none'
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {playing
                ? <Play size={32} fill="white" color="white" />
                : <Play size={32} fill="white" color="white" />
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MUTE button — top right (Instagram placement) ── */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
        style={{
          position: 'absolute', top: 56, right: 12, zIndex: 20,
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {muted
          ? <VolumeX size={17} color="white" />
          : <Volume2 size={17} color="white" />
        }
      </button>

      {/* ── Bottom-left: author + caption + hashtags + audio ── */}
      <div style={{
        position: 'absolute',
        bottom: `calc(var(--bottom-nav-height, 70px) + 16px)`,
        left: 12,
        right: 68,   /* leaves space for action column */
        zIndex: 10
      }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Avatar src={reel.author?.avatarUrl} name={reel.author?.name} size={34} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
            {reel.author?.name}
          </span>
          {!isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); setFollowed(f => !f); }}
              style={{
                background: followed ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: '1.5px solid rgba(255,255,255,0.85)',
                borderRadius: 6,
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 12px',
                cursor: 'pointer',
                lineHeight: 1.4
              }}
            >
              {followed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Caption */}
        {reel.title && (
          <p style={{ color: 'white', fontSize: 13, lineHeight: 1.5, margin: '0 0 5px' }}>
            {reel.title}
          </p>
        )}

        {/* Hashtags */}
        {reel.hashtags?.length > 0 && (
          <p style={{ color: '#93c5fd', fontSize: 13, margin: '0 0 8px' }}>
            {reel.hashtags.map(h => `#${h}`).join(' ')}
          </p>
        )}

        {/* Audio row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Music size={11} color="rgba(255,255,255,0.75)" />
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
            Original audio · {reel.author?.name}
          </span>
        </div>
      </div>

      {/* ── Bottom-right: vertical action buttons ── */}
      <div style={{
        position: 'absolute',
        bottom: `calc(var(--bottom-nav-height, 70px) + 16px)`,
        right: 10,
        zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20
      }}>
        {/* Like */}
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.75 }}
          style={actionBtnStyle}
        >
          <Heart
            size={27}
            fill={liked ? '#ef4444' : 'none'}
            stroke={liked ? '#ef4444' : 'white'}
            strokeWidth={1.8}
          />
          <span style={actionLabelStyle}>{formatCount(likesCount)}</span>
        </motion.button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
          style={actionBtnStyle}
        >
          <MessageCircle size={27} color="white" strokeWidth={1.8} />
          <span style={actionLabelStyle}>{formatCount(comments.length)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} style={actionBtnStyle}>
          <Send size={25} color="white" strokeWidth={1.8} />
          <span style={actionLabelStyle}>Share</span>
        </button>

        {/* More / Delete */}
        {isOwner ? (
          <button onClick={handleDelete} style={{ ...actionBtnStyle, color: '#ef4444' }}>
            <Trash2 size={23} color="#ef4444" strokeWidth={1.8} />
          </button>
        ) : (
          <button onClick={(e) => e.stopPropagation()} style={actionBtnStyle}>
            <MoreVertical size={23} color="white" strokeWidth={1.8} />
          </button>
        )}

        {/* Spinning vinyl / audio disc — Instagram signature */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#222',
          border: '3px solid #555',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: playing ? 'spin 4s linear infinite' : 'none',
          marginTop: 2
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#888' }} />
        </div>
      </div>

      {/* ── Progress bar — absolute bottom ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2, background: 'rgba(255,255,255,0.25)', zIndex: 15
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'white',
          borderRadius: 2,
          transition: 'width 0.1s linear'
        }} />
      </div>

      {/* ── Comment panel ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              maxHeight: '72vh',
              background: '#1c1c1c',
              borderRadius: '20px 20px 0 0',
              zIndex: 50,
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 18px 12px',
              borderBottom: '0.5px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>
                Comments
              </span>
              <button
                onClick={() => setShowComments(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Comment list */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 18,
              minHeight: 100, maxHeight: '52vh'
            }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '32px 0', margin: 0 }}>
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((c, i) => (
                  <div key={c._id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={32} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'white' }}>
                        {c.author?.name || 'User'}
                      </span>
                      <p style={{ fontSize: 14, margin: '3px 0 0', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              borderTop: '0.5px solid rgba(255,255,255,0.1)'
            }}>
              <Avatar src={currentUser?.avatarUrl} name={currentUser?.name} size={30} />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleComment(e); }}
                placeholder="Add a comment..."
                autoFocus
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 22,
                  padding: '9px 16px',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || commentLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px' }}
              >
                <Send
                  size={19}
                  color={commentText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={2}
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ─── Shared styles ─── */
const actionBtnStyle = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 4,
  background: 'none', border: 'none',
  cursor: 'pointer',
  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'
};

const actionLabelStyle = {
  fontSize: 12, color: 'white', fontWeight: '500',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)'
};

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'm';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}