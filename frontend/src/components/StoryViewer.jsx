import React, { useState, useEffect, useRef, useCallback } from 'react';
import Avatar from './Avatar';
import api from '../lib/api';
import { Heart, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STORY_DURATION = 5000;

export default function StoryViewer({ story, onClose, currentUserId }) {
  const [liked, setLiked] = useState(
    story?.likes?.some(l => (l._id || l?.toString?.() || l) === currentUserId) || false
  );
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused]   = useState(false);
  const [progress, setProgress]   = useState(0);

  const startTimeRef    = useRef(null);
  const rafRef          = useRef(null);
  const elapsedRef      = useRef(0);  // ms elapsed before last pause

  // Author can be an object or a plain string ID
  const authorId   = story.author?._id || story.author;
  const authorName = story.author?.name || 'User';
  const authorAvatar = story.author?.avatarUrl;
  const isOwnStory = authorId === currentUserId;

  // ── Progress bar via requestAnimationFrame ──
  const tick = useCallback(() => {
    const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
    const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
    setProgress(pct);
    if (pct < 100) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      onClose();
    }
  }, [onClose]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopTimer = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    // Save how much time has elapsed so we resume correctly
    elapsedRef.current += Date.now() - (startTimeRef.current || Date.now());
  }, []);

  useEffect(() => {
    startTimer();
    return () => cancelAnimationFrame(rafRef.current);
  }, [startTimer]);

  useEffect(() => {
    if (isPaused) {
      stopTimer();
    } else {
      startTimer();
    }
  }, [isPaused, startTimer, stopTimer]);

  // ── Like ──
  const handleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    try {
      await api.post(`/api/stories/${story._id}/like`);
    } catch {
      setLiked(prev); // revert on failure
    }
  };

  // ── Reply ──
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post('/api/chat', {
        receiverId: authorId,
        content: `[Replying to story] ${replyText}`,
        type: 'text'
      });
      toast.success('Reply sent');
      onClose();
    } catch {
      toast.error('Failed to send reply');
    }
  };

  // ── Tap left/right to navigate (pause while pressing) ──
  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp   = () => setIsPaused(false);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        style={{
          width: '100%', maxWidth: 420,
          height: '100dvh',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
          background: '#111'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Progress bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          zIndex: 10, padding: '10px 12px 0'
        }}>
          <div style={{
            height: 2, background: 'rgba(255,255,255,0.25)',
            borderRadius: 2, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'white',
              borderRadius: 2,
              transition: 'none'   /* RAF drives this, no CSS transition needed */
            }} />
          </div>
        </div>

        {/* ── Header ── */}
        <div style={{
          position: 'absolute', top: 20, left: 0, right: 0,
          zIndex: 10, padding: '0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar src={authorAvatar} name={authorName} size={36} />
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                {authorName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
                {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.4)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} color="white" />
          </button>
        </div>

        {/* ── Story content ── */}
        <div style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 0 100px'
        }}>
          {story.type === 'image' && story.imageUrl ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '0 16px' }}>
              <img
                src={api.getFileUrl(story.imageUrl)}
                alt=""
                style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 12 }}
              />
              {story.content && (
                <p style={{ color: 'white', fontSize: 16, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                  {story.content}
                </p>
              )}
            </div>
          ) : (
            <div style={{
              width: '100%', padding: '0 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <p style={{
                color: 'white', fontSize: 22, fontWeight: 600,
                textAlign: 'center', lineHeight: 1.5, margin: 0
              }}>
                {story.content}
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom: reply + like (other people's stories only) ── */}
        {!isOwnStory && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))',
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)'
          }}>
            <form
              onSubmit={handleReply}
              onPointerDown={e => e.stopPropagation()}
              style={{
                flex: 1, display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 24, padding: '8px 14px', gap: 8
              }}
            >
              <input
                type="text"
                placeholder={`Reply to ${authorName}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  color: 'white', fontSize: 14,
                  '::placeholder': { color: 'rgba(255,255,255,0.4)' }
                }}
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                <Send
                  size={18}
                  color={replyText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.3)'}
                />
              </button>
            </form>

            {/* Like button */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={handleLike}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 4,
                transform: liked ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s'
              }}
            >
              <Heart
                size={28}
                color={liked ? '#ec4899' : 'white'}
                fill={liked ? '#ec4899' : 'none'}
                strokeWidth={1.8}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}