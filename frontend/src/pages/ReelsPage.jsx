import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, Play, Pause, Trash2 } from 'lucide-react';

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [current, setCurrent] = useState(0);
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
      <div className="page-container">
        <div className="page-header"><h1>Reels</h1></div>
        <div className="empty-state">
          <Play size={64} />
          <h3>No Reels Yet</h3>
          <p>Follow creators to see their 60-second learning reels</p>
        </div>
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
        {reels.map((reel, i) => (
          <ReelCard key={reel._id} reel={reel} isActive={i === current} onDelete={loadReels} currentUser={user} />
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
          z-index: 10;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
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

function ReelCard({ reel, isActive, onDelete, currentUser }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/api/reels/${reel._id}/like`);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {}
  };

  const isOwner = currentUser?._id === (reel.author?._id || reel.author);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this reel? This cannot be undone.')) return;
    try {
      await api.delete(`/api/reels/${reel._id}`);
      if (onDelete) onDelete();
    } catch (err) {
      alert(err.message || 'Failed to delete reel');
    }
  };

  return (
    <div className="reel-card" onClick={togglePlay}>
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          src={api.getFileUrl(reel.videoUrl)}
          className="reel-video"
          loop
          playsInline
          muted
        />
      ) : (
        <div className="reel-placeholder">
          <div className="reel-placeholder-content">
            <Music size={48} style={{ opacity: 0.3 }} />
            <h3>{reel.title}</h3>
          </div>
        </div>
      )}

      {/* Overlay */}
      {!playing && (
        <div className="reel-play-overlay">
          <Play size={60} fill="white" />
        </div>
      )}

      {/* Bottom info */}
      <div className="reel-info">
        <div className="reel-author">
          <Avatar src={reel.author?.avatarUrl} name={reel.author?.name} size={36} />
          <span style={{ fontWeight: 600 }}>{reel.author?.name}</span>
        </div>
        <p className="reel-title">{reel.title}</p>
        {reel.hashtags?.length > 0 && (
          <p className="reel-hashtags">{reel.hashtags.map(h => `#${h}`).join(' ')}</p>
        )}
      </div>

      {/* Side actions */}
      <div className="reel-actions">
        <motion.button onClick={(e) => { e.stopPropagation(); handleLike(); }} whileTap={{ scale: 0.8 }}>
          <Heart size={28} fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : 'white'} />
          <span>{likesCount}</span>
        </motion.button>
        <button onClick={(e) => e.stopPropagation()}>
          <MessageCircle size={28} />
          <span>{reel.comments?.length || 0}</span>
        </button>
        <button onClick={(e) => e.stopPropagation()}>
          <Share2 size={28} />
        </button>
        {isOwner && (
          <button onClick={handleDelete} style={{ color: '#ef4444' }}>
            <Trash2 size={28} />
          </button>
        )}
      </div>

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
        }
        .reel-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .reel-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1a0a2e 0%, #0a0a0a 50%, #0a1628 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reel-placeholder-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: white;
        }
        .reel-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
        }
        .reel-info {
          position: absolute;
          bottom: calc(var(--bottom-nav-height) + 16px);
          left: 0;
          right: 60px;
          padding: 16px;
        }
        .reel-author {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .reel-title {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
        }
        .reel-hashtags {
          font-size: 13px;
          color: var(--accent-light);
        }
        .reel-actions {
          position: absolute;
          bottom: calc(var(--bottom-nav-height) + 24px);
          right: 12px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .reel-actions button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: white;
          background: none;
          border: none;
        }
        .reel-actions span {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
