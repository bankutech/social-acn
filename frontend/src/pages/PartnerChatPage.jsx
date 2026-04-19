import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Smile, Image, X, Palette, Clock, Shield, Camera } from 'lucide-react';

const THEMES = {
  purple_dark: { name: 'Purple Dark', bg: '#1a0a2e', msgBg: '#2d1854', accent: '#a78bfa', gradient: 'linear-gradient(135deg, #1a0a2e 0%, #0f0520 100%)' },
  pink_gradient: { name: 'Pink Gradient', bg: '#2d1f3d', msgBg: '#4a1942', accent: '#f472b6', gradient: 'linear-gradient(135deg, #2d1f3d 0%, #4a1942 100%)' },
  blue_neon: { name: 'Blue Neon', bg: '#0a1628', msgBg: '#0f2952', accent: '#38bdf8', gradient: 'linear-gradient(135deg, #0a1628 0%, #0c2340 100%)' },
  black_minimal: { name: 'Black Minimal', bg: '#0a0a0a', msgBg: '#1a1a1a', accent: '#a3a3a3', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)' },
  custom: { name: 'Custom Wallpaper', bg: '#0a0a0a', msgBg: '#1a1a1a', accent: '#7c3aed', gradient: 'none' },
};

export default function PartnerChatPage() {
  const { partnerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partner, setPartner] = useState(null);
  const [theme, setTheme] = useState('purple_dark');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [typing, setTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const timerInterval = useRef(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    loadChat();
    // Update countdowns every minute
    timerInterval.current = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(timerInterval.current);
  }, [partnerId]);

  useEffect(() => {
    if (!chat?._id) return;
    const socket = getSocket();

    socket.emit('join_partner_chat', chat._id);

    socket.on('partner_new_message', (msg) => {
      // Only add messages from the OTHER person to prevent duplicates
      const senderId = msg.sender_id?._id || msg.sender_id;
      if (String(senderId) !== String(user?._id)) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });

    socket.on('partner_user_typing', ({ userId, isTyping }) => {
      if (userId === partnerId) setTyping(isTyping);
    });

    socket.on('partner_theme_change', (newTheme) => {
      setTheme(newTheme.theme_name || 'purple_dark');
    });

    return () => {
      socket.emit('leave_partner_chat', chat._id);
      socket.off('partner_new_message');
      socket.off('partner_user_typing');
      socket.off('partner_theme_change');
    };
  }, [chat?._id]);

  const loadChat = async () => {
    try {
      const chatData = await api.get(`/api/partner-chat/${partnerId}`);
      setChat(chatData);
      setTheme(chatData.theme?.theme_name || 'purple_dark');

      const p = chatData.user_one_id?._id === user?._id ? chatData.user_two_id : chatData.user_one_id;
      setPartner(p);

      const msgs = await api.get(`/api/partner-chat/${chatData._id}/messages`);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setTimeout(scrollToBottom, 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || !chat?._id) return;
    setSending(true);

    try {
      let image_url = '';
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await api.upload(`/api/partner-chat/${chat._id}/upload`, fd);
        image_url = uploadRes.image_url;
      }

      const msg = await api.post(`/api/partner-chat/${chat._id}/message`, {
        content: input,
        message_type: image_url ? 'image' : 'text',
        image_url
      });

      setMessages(prev => [...prev, msg]);
      setInput('');
      setImageFile(null);
      setImagePreview('');
      setShowImagePicker(false);

      const socket = getSocket();
      socket.emit('partner_message', { chatId: chat._id, message: msg });

      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  const handleTyping = () => {
    if (!chat?._id) return;
    const socket = getSocket();
    socket.emit('partner_typing', { chatId: chat._id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('partner_typing', { chatId: chat._id, isTyping: false });
    }, 2000);
  };

  const handleThemeChange = async (themeName) => {
    setTheme(themeName);
    setShowThemePicker(false);
    if (!chat?._id) return;
    try {
      await api.put(`/api/partner-chat/${chat._id}/theme`, { theme_name: themeName });
      const socket = getSocket();
      socket.emit('partner_theme_change', { chatId: chat._id, theme: { theme_name: themeName } });
    } catch {}
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setShowImagePicker(true);
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const timeFormat = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentTheme = THEMES[theme] || THEMES.purple_dark;

  const emojis = ['❤️', '😍', '🔥', '💕', '😘', '🥰', '💖', '😊', '🤗', '💜', '✨', '🌙', '💫', '🦋', '🌸', '💝', '😈', '🙈', '💋', '🫶'];

  return (
    <div className="partner-chat" style={{ background: currentTheme.gradient !== 'none' ? undefined : currentTheme.bg, backgroundImage: currentTheme.gradient !== 'none' ? currentTheme.gradient : undefined }}>
      {/* Header */}
      <div className="pc-header">
        <button className="btn-icon" onClick={() => navigate('/chat')}>
          <ArrowLeft size={22} />
        </button>
        <div className="pc-header-info">
          <Avatar src={partner?.avatarUrl} name={partner?.name} size={38} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              {partner?.name}
              <Shield size={14} fill={currentTheme.accent} stroke={currentTheme.accent} />
            </div>
            <div style={{ fontSize: 11, color: typing ? '#22c55e' : 'var(--text-muted)' }}>
              {typing ? 'typing...' : 'Partner Chat · Private'}
            </div>
          </div>
        </div>
        <button className="btn-icon" onClick={() => setShowThemePicker(true)} style={{ color: currentTheme.accent }}>
          <Palette size={22} />
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="pc-privacy-notice">
        <Shield size={14} />
        <span>Messages auto-delete after 24 hours. Only you and {partner?.name?.split(' ')[0]} can see this chat.</span>
      </div>

      {/* Messages */}
      <div className="pc-messages">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="loader-spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="pc-empty">
            <div className="pc-empty-icon">💜</div>
            <h3>Start your private conversation</h3>
            <p>Messages disappear after 24 hours</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = (msg.sender_id?._id || msg.sender_id) === user?._id;
            return (
              <motion.div
                key={msg._id || i}
                className={`pc-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i > messages.length - 3 ? 0.05 : 0 }}
              >
                <div className={`pc-bubble ${isMine ? 'pc-mine' : 'pc-theirs'}`} style={{
                  background: isMine ? currentTheme.accent : currentTheme.msgBg,
                  color: isMine ? 'white' : 'var(--text-primary)',
                }}>
                  {msg.message_type === 'image' && msg.image_url && (
                    <img
                      src={api.getFileUrl(msg.image_url)}
                      alt=""
                      className="pc-msg-image"
                      onClick={() => window.open(api.getFileUrl(msg.image_url), '_blank')}
                    />
                  )}
                  {msg.content && <p>{msg.content}</p>}
                  <div className="pc-bubble-meta">
                    <span>{timeFormat(msg.created_at)}</span>
                    {msg.expires_at && (
                      <span className="pc-timer">
                        <Clock size={10} /> {getTimeRemaining(msg.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePicker && imagePreview && (
          <motion.div
            className="pc-image-preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pc-image-preview-modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16 }}>Send Image</h3>
                <button className="btn-icon" onClick={() => { setShowImagePicker(false); setImageFile(null); setImagePreview(''); }}>
                  <X size={20} />
                </button>
              </div>
              <img src={imagePreview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'cover' }} />
              <input
                placeholder="Add a caption..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ marginTop: 12 }}
              />
              <button className="btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : 'Send Image'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Picker */}
      <AnimatePresence>
        {showThemePicker && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowThemePicker(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chat Theme</h2>
                <button className="btn-icon" onClick={() => setShowThemePicker(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="theme-grid">
                  {Object.entries(THEMES).filter(([k]) => k !== 'custom').map(([key, t]) => (
                    <button
                      key={key}
                      className={`theme-option ${theme === key ? 'active' : ''}`}
                      onClick={() => handleThemeChange(key)}
                      style={{ backgroundImage: t.gradient }}
                    >
                      <div className="theme-preview-bubble" style={{ background: t.accent }} />
                      <span>{t.name}</span>
                      {theme === key && <div className="theme-check">✓</div>}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Quick Panel */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            className="pc-emoji-panel"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {emojis.map(e => (
              <button key={e} className="pc-emoji-btn" onClick={() => { setInput(prev => prev + e); setShowEmoji(false); }}>
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="pc-input-bar">
        <button className="btn-icon" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile size={22} style={{ color: currentTheme.accent }} />
        </button>
        <label className="btn-icon" style={{ cursor: 'pointer' }}>
          <Camera size={22} style={{ color: currentTheme.accent }} />
          <input type="file" accept="image/*" onChange={handleImageSelect} hidden />
        </label>
        <input
          placeholder="Type a message..."
          value={input}
          onChange={e => { setInput(e.target.value); handleTyping(); }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="pc-text-input"
        />
        <button className="pc-send-btn" onClick={handleSend} disabled={(!input.trim() && !imageFile) || sending} style={{ background: currentTheme.accent }}>
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .partner-chat {
          height: 100dvh;
          max-height: 100dvh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .pc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          z-index: 10;
        }
        .pc-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .pc-privacy-notice {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(124,58,237,0.1);
          border-bottom: 1px solid rgba(124,58,237,0.15);
          font-size: 11px;
          color: var(--accent-light);
        }
        .pc-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }
        .pc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          opacity: 0.7;
        }
        .pc-empty-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
        .pc-empty h3 {
          font-size: 16px;
          color: var(--text-secondary);
        }
        .pc-empty p {
          font-size: 13px;
          color: var(--text-muted);
        }
        .pc-bubble-row {
          display: flex;
          margin-bottom: 2px;
        }
        .pc-bubble-row.mine { justify-content: flex-end; }
        .pc-bubble-row.theirs { justify-content: flex-start; }
        .pc-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.45;
        }
        .pc-mine { border-bottom-right-radius: 4px; }
        .pc-theirs { border-bottom-left-radius: 4px; }
        .pc-msg-image {
          width: 100%;
          max-width: 250px;
          border-radius: 12px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .pc-msg-image:hover { opacity: 0.85; }
        .pc-bubble-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 10px;
          opacity: 0.65;
        }
        .pc-timer {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #fbbf24;
        }
        .pc-emoji-panel {
          position: absolute;
          bottom: 64px;
          left: 12px;
          right: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          z-index: 20;
        }
        .pc-emoji-btn {
          font-size: 22px;
          padding: 6px;
          border-radius: 8px;
          background: none;
          transition: background 0.15s;
        }
        .pc-emoji-btn:hover {
          background: var(--bg-hover);
        }
        .pc-input-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .pc-text-input {
          flex: 1;
          border-radius: var(--radius-full) !important;
          padding: 10px 16px !important;
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .pc-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }
        .pc-send-btn:disabled { opacity: 0.3; }
        .pc-send-btn:active { transform: scale(0.9); }
        .pc-image-preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .pc-image-preview-modal {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          padding: 20px;
          max-width: 400px;
          width: 100%;
        }
        .theme-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .theme-option {
          padding: 20px 16px;
          border-radius: var(--radius-lg);
          border: 2px solid transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.2s;
          position: relative;
          color: white;
        }
        .theme-option.active {
          border-color: white;
        }
        .theme-option:hover {
          border-color: rgba(255,255,255,0.3);
        }
        .theme-preview-bubble {
          width: 40px;
          height: 24px;
          border-radius: 12px;
        }
        .theme-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          color: black;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
