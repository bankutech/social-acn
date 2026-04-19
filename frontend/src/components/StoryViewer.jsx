import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import api from '../lib/api';
import { Heart, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StoryViewer({ story, onClose, currentUserId }) {
  const [liked, setLiked] = useState(
    story?.likes?.some(l => (l._id || l?.toString?.() || l) === currentUserId) || false
  );
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const handleLike = async () => {
    try {
      setLiked(!liked);
      await api.post(`/api/stories/${story._id}/like`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post('/api/chat', {
        receiverId: story.author._id,
        content: `[Replying to story] ${replyText}`,
        type: 'text'
      });
      toast.success('Reply sent');
      onClose();
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const isOwnStory = story.author?._id === currentUserId || story.author === currentUserId;

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 5000);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPaused, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.95)', position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="story-viewer" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', minHeight: '60vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="story-progress" style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
          <div className="story-progress-fill" style={{ height: '100%', background: 'white', borderRadius: '2px', width: '100%', animation: isPaused ? 'none' : 'storyTimer 5s linear forwards' }} />
        </div>
        <div className="story-viewer-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 16px' }}>
          <Avatar src={story.author?.avatarUrl} name={story.author?.name} size={36} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{story.author?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(story.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="story-viewer-content" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', textAlign: 'center', padding: '20px' }}>
          {story.type === 'image' && story.imageUrl ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={api.getFileUrl(story.imageUrl)} alt="" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 12, marginBottom: 12 }} />
              {story.content && <p style={{ fontSize: 16 }}>{story.content}</p>}
            </div>
          ) : (
            <p>{story.content}</p>
          )}
        </div>

        {!isOwnStory && (
          <div className="story-interactions" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginTop: 'auto' }}>
            <form onSubmit={handleReply} style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: '8px 16px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Reply to story..." 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '14px' }} 
              />
              <button type="submit" disabled={!replyText.trim()} style={{ background: 'none', border: 'none', color: replyText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                <Send size={18} />
              </button>
            </form>
            <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s', transform: liked ? 'scale(1.1)' : 'scale(1)' }}>
              <Heart size={28} color={liked ? '#ec4899' : 'white'} fill={liked ? '#ec4899' : 'none'} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
