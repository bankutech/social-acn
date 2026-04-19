import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Smile, Camera, X, Palette, Clock, ShieldCheck } from 'lucide-react';

const THEMES = {
  purple_dark:  { name: 'Purple dark',  bg: '#130d24', msgBg: '#1e1535', accent: '#7c3aed', inputBg: 'rgba(255,255,255,0.07)' },
  pink_gradient:{ name: 'Pink gradient',bg: '#1f0f1a', msgBg: '#3a1030', accent: '#ec4899', inputBg: 'rgba(255,255,255,0.07)' },
  blue_neon:    { name: 'Blue neon',    bg: '#090f1c', msgBg: '#0c1e3a', accent: '#0ea5e9', inputBg: 'rgba(255,255,255,0.07)' },
  black_minimal:{ name: 'Black minimal',bg: '#0a0a0a', msgBg: '#1c1c1c', accent: '#a3a3a3', inputBg: 'rgba(255,255,255,0.06)' },
};

const EMOJIS = ['❤️','😍','🔥','💕','😘','🥰','💖','😊','🤗','💜','✨','🌙','💫','🦋','🌸','💝','😈','🙈','💋','🫶'];

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [, forceUpdate] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Tick every minute so expiry timers stay live
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadChat();
  }, [partnerId]);

  useEffect(() => {
    if (!chat?._id) return;
    const socket = getSocket();
    socket.emit('join_partner_chat', chat._id);

    socket.on('partner_new_message', (msg) => {
      const sid = msg.sender_id?._id || msg.sender_id;
      if (String(sid) !== String(user?._id)) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    });
    socket.on('partner_user_typing', ({ userId, isTyping }) => {
      if (userId === partnerId) setTyping(isTyping);
    });
    socket.on('partner_theme_change', ({ theme_name }) => {
      if (theme_name && THEMES[theme_name]) setTheme(theme_name);
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
      if (chatData.theme?.theme_name && THEMES[chatData.theme.theme_name]) {
        setTheme(chatData.theme.theme_name);
      }
      const p = chatData.user_one_id?._id === user?._id
        ? chatData.user_two_id
        : chatData.user_one_id;
      setPartner(p);

      const msgs = await api.get(`/api/partner-chat/${chatData._id}/messages`);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setTimeout(scrollToBottom, 200);
  };

  const scrollToBottom = (instant = false) => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ 
      behavior: instant ? 'auto' : 'smooth', 
      block: 'end' 
    });
  };

  // Auto-scroll when messages change or typing status updates
  useEffect(() => {
    if (messages.length > 0) {
      // Small timeout to allow DOM/animations to start
      const timeout = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, typing]);

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || !chat?._id || sending) return;
    setSending(true);
    const content = input;
    setInput('');

    try {
      let image_url = '';
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const up = await api.upload(`/api/partner-chat/${chat._id}/upload`, fd);
        image_url = up.image_url;
      }

      const msg = await api.post(`/api/partner-chat/${chat._id}/message`, {
        content,
        message_type: image_url ? 'image' : 'text',
        image_url,
      });

      setMessages(prev => [...prev, msg]);
      setImageFile(null);
      setImagePreview('');
      setShowImageModal(false);

      getSocket().emit('partner_message', { chatId: chat._id, message: msg });
      scrollToBottom();
    } catch (err) {
      console.error(err);
      setInput(content); // restore on failure
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

  const handleThemeChange = async (name) => {
    setTheme(name);
    setShowThemePicker(false);
    if (!chat?._id) return;
    try {
      await api.put(`/api/partner-chat/${chat._id}/theme`, { theme_name: name });
      getSocket().emit('partner_theme_change', { chatId: chat._id, theme: { theme_name: name } });
    } catch {}
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setShowImageModal(true);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setShowImageModal(false);
  };

  const getTimeRemaining = (expiresAt) => {
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const t = THEMES[theme] || THEMES.purple_dark;

  return (
    <>
      <div
        className="pc-page"
        style={{ background: t.bg }}
        role="main"
        aria-label="Partner chat"
      >
        {/* ── Header ── */}
        <header className="pc-header">
          <button
            className="pc-icon-btn"
            onClick={() => navigate('/chat')}
            aria-label="Back to chats"
          >
            <ArrowLeft size={18} />
          </button>

          <div
            className="pc-header-info"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/profile/${partnerId}`)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/profile/${partnerId}`)}
            aria-label={`View ${partner?.name}'s profile`}
          >
            <Avatar src={partner?.avatarUrl} name={partner?.name} size={38} />
            <div className="pc-header-text">
              <div className="pc-header-name">
                {partner?.name || 'Partner'}
                <span className="pc-private-badge">
                  <ShieldCheck size={10} />
                  Private
                </span>
              </div>
              <div
                className="pc-header-sub"
                style={{ color: typing ? '#4ade80' : 'rgba(255,255,255,0.4)' }}
                aria-live="polite"
              >
                {typing ? 'typing...' : 'Partner chat'}
              </div>
            </div>
          </div>

          <button
            className="pc-icon-btn"
            style={{ color: t.accent }}
            onClick={() => setShowThemePicker(true)}
            aria-label="Change chat theme"
          >
            <Palette size={18} />
          </button>
        </header>

        {/* ── Privacy bar ── */}
        <div className="pc-notice" role="note">
          <ShieldCheck size={12} />
          Messages auto-delete after 24 hours · only you and {partner?.name?.split(' ')[0] || 'your partner'} can see this
        </div>

        {/* ── Messages ── */}
        <div
          className="pc-messages"
          role="log"
          aria-live="polite"
          aria-label="Messages"
        >
          {loading && (
            <div className="pc-loader" role="status" aria-label="Loading messages">
              <div className="pc-spinner" style={{ borderTopColor: t.accent }} />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="pc-empty" aria-label="No messages yet">
              <div className="pc-empty-icon" style={{ color: t.accent }}>
                <ShieldCheck size={36} />
              </div>
              <p className="pc-empty-title">Start your private conversation</p>
              <p className="pc-empty-sub">Messages disappear after 24 hours</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMine = String(msg.sender_id?._id || msg.sender_id) === String(user?._id);
            return (
              <motion.div
                key={msg._id || i}
                className={`pc-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className={`pc-bubble ${isMine ? 'pc-mine' : 'pc-theirs'}`}
                  style={{
                    background: isMine ? t.accent : t.msgBg,
                    color: '#fff',
                  }}
                >
                  {msg.message_type === 'image' && msg.image_url && (
                    <button
                      className="pc-img-btn"
                      onClick={() => window.open(api.getFileUrl(msg.image_url), '_blank')}
                      aria-label="Open image in new tab"
                    >
                      <img
                        src={api.getFileUrl(msg.image_url)}
                        alt="Shared image"
                        className="pc-msg-img"
                      />
                    </button>
                  )}
                  {msg.content && <p className="pc-bubble-text">{msg.content}</p>}
                  <div className="pc-bubble-meta">
                    <time dateTime={msg.created_at}>{formatTime(msg.created_at)}</time>
                    {msg.expires_at && (
                      <span className="pc-timer" aria-label="Expires in">
                        <Clock size={10} />
                        {getTimeRemaining(msg.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {typing && (
            <div className="pc-bubble-row theirs" aria-label="Partner is typing">
              <div className="pc-bubble pc-theirs pc-typing" style={{ background: t.msgBg }}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Emoji panel ── */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              className="pc-emoji-panel"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              role="region"
              aria-label="Emoji picker"
            >
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className="pc-emoji-btn"
                  onClick={() => { setInput(prev => prev + e); setShowEmoji(false); }}
                  aria-label={`Insert ${e}`}
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input ── */}
        <div className="pc-input-bar" role="form" aria-label="Message input">
          <div className="pc-input-actions">
            <button
              className="pc-icon-btn"
              style={{ color: t.accent }}
              onClick={() => setShowEmoji(v => !v)}
              aria-label="Toggle emoji picker"
              aria-expanded={showEmoji}
            >
              <Smile size={18} />
            </button>
            <label className="pc-icon-btn" style={{ color: t.accent, cursor: 'pointer' }} aria-label="Attach image">
              <Camera size={18} />
              <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
            </label>
          </div>

          <input
            className="pc-input"
            style={{ background: t.inputBg }}
            placeholder="Type a message…"
            value={input}
            onChange={e => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            aria-label="Message"
            autoComplete="off"
          />

          <button
            className="pc-send-btn"
            style={{ background: t.accent }}
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || sending}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        {/* ── Image send modal ── */}
        <AnimatePresence>
          {showImageModal && imagePreview && (
            <motion.div
              className="pc-modal-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={clearImage}
              role="dialog"
              aria-modal="true"
              aria-label="Send image"
            >
              <motion.div
                className="pc-modal"
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.93, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="pc-modal-header">
                  <span className="pc-modal-title">Send image</span>
                  <button className="pc-icon-btn-sm" onClick={clearImage} aria-label="Cancel">
                    <X size={16} />
                  </button>
                </div>
                <img src={imagePreview} alt="Preview" className="pc-modal-img" />
                <input
                  placeholder="Add a caption…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  aria-label="Caption"
                  className="pc-modal-input"
                />
                <button
                  className="pc-modal-send"
                  style={{ background: t.accent }}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? 'Sending…' : 'Send image'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Theme picker ── */}
        <AnimatePresence>
          {showThemePicker && (
            <motion.div
              className="pc-modal-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowThemePicker(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Choose theme"
            >
              <motion.div
                className="pc-modal"
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.93, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="pc-modal-header">
                  <span className="pc-modal-title">Chat theme</span>
                  <button className="pc-icon-btn-sm" onClick={() => setShowThemePicker(false)} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>
                <div className="pc-theme-grid">
                  {Object.entries(THEMES).map(([key, th]) => (
                    <button
                      key={key}
                      className={`pc-theme-opt ${theme === key ? 'active' : ''}`}
                      style={{ background: th.bg, borderColor: theme === key ? th.accent : 'rgba(255,255,255,0.1)' }}
                      onClick={() => handleThemeChange(key)}
                      aria-pressed={theme === key}
                      aria-label={`Select ${th.name} theme`}
                    >
                      <div className="pc-theme-swatch" style={{ background: th.accent }} />
                      <span className="pc-theme-name">{th.name}</span>
                      {theme === key && (
                        <div className="pc-theme-check" style={{ background: th.accent }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .pc-page {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* ── Header ── */
        .pc-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
          z-index: 10;
        }
        .pc-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .pc-icon-btn:hover { background: rgba(255,255,255,0.1); }
        .pc-header-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          min-width: 0;
        }
        .pc-header-text { display: flex; flex-direction: column; min-width: 0; }
        .pc-header-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pc-private-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-weight: 400;
          background: rgba(124,58,237,0.25);
          color: #c4b5fd;
          padding: 2px 7px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pc-header-sub {
          font-size: 11px;
          margin-top: 1px;
          transition: color 0.2s;
        }

        /* ── Privacy bar ── */
        .pc-notice {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(124,58,237,0.1);
          border-bottom: 1px solid rgba(124,58,237,0.15);
          font-size: 11px;
          color: #c4b5fd;
          flex-shrink: 0;
        }

        /* ── Messages ── */
        .pc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          overscroll-behavior: contain;
        }
        .pc-loader {
          display: flex;
          justify-content: center;
          padding: 48px 0;
        }
        .pc-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255,255,255,0.12);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          opacity: 0.65;
        }
        .pc-empty-title { font-size: 15px; color: rgba(255,255,255,0.8); }
        .pc-empty-sub   { font-size: 13px; color: rgba(255,255,255,0.4); }

        /* ── Bubbles ── */
        .pc-bubble-row { display: flex; }
        .pc-bubble-row.mine   { justify-content: flex-end; }
        .pc-bubble-row.theirs { justify-content: flex-start; }
        .pc-bubble {
          max-width: 74%;
          padding: 9px 13px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.45;
        }
        .pc-mine   { border-bottom-right-radius: 4px; }
        .pc-theirs { border-bottom-left-radius: 4px; }
        .pc-bubble-text { margin: 0; }
        .pc-bubble-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 10px;
          opacity: 0.55;
        }
        .pc-timer {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #fbbf24;
          opacity: 1;
        }

        /* Typing dots */
        .pc-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 12px 16px;
        }
        .pc-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          display: block;
          animation: bounce 1.2s ease-in-out infinite;
        }
        .pc-typing span:nth-child(2) { animation-delay: 0.2s; }
        .pc-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        /* ── Media ── */
        .pc-img-btn { background: none; border: none; padding: 0; cursor: pointer; display: block; }
        .pc-msg-img {
          display: block;
          width: 100%;
          max-width: 240px;
          border-radius: 12px;
          margin-bottom: 5px;
          object-fit: cover;
          transition: opacity 0.15s;
        }
        .pc-img-btn:hover .pc-msg-img { opacity: 0.85; }

        /* ── Emoji panel ── */
        .pc-emoji-panel {
          padding: 10px 12px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          flex-shrink: 0;
        }
        .pc-emoji-btn {
          font-size: 22px;
          padding: 5px 6px;
          border-radius: 8px;
          background: none;
          border: none;
          cursor: pointer;
          line-height: 1;
          transition: background 0.12s;
        }
        .pc-emoji-btn:hover { background: rgba(255,255,255,0.1); }

        /* ── Input bar ── */
        .pc-input-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .pc-input-actions { display: flex; align-items: center; gap: 2px; }
        .pc-input {
          flex: 1;
          height: 40px;
          border-radius: 20px;
          padding: 0 16px;
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .pc-input::placeholder { color: rgba(255,255,255,0.3); }
        .pc-input:focus { border-color: rgba(255,255,255,0.25); }
        .pc-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
        }
        .pc-send-btn:hover:not(:disabled) { opacity: 0.88; }
        .pc-send-btn:active:not(:disabled) { transform: scale(0.93); }
        .pc-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Modals ── */
        .pc-modal-wrap {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: flex-end;
          z-index: 50;
        }
        .pc-modal {
          width: 100%;
          background: var(--bg-secondary, #1a1a1a);
          border-radius: 20px 20px 0 0;
          padding: 20px 16px 32px;
        }
        .pc-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .pc-modal-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary, #fff);
        }
        .pc-icon-btn-sm {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .pc-modal-img {
          width: 100%;
          border-radius: 12px;
          max-height: 280px;
          object-fit: cover;
          display: block;
        }
        .pc-modal-input {
          width: 100%;
          margin-top: 12px;
          height: 40px;
          border-radius: 20px;
          padding: 0 16px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          font-size: 14px;
          outline: none;
        }
        .pc-modal-input::placeholder { color: rgba(255,255,255,0.35); }
        .pc-modal-send {
          width: 100%;
          margin-top: 12px;
          height: 44px;
          border-radius: 22px;
          border: none;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .pc-modal-send:disabled { opacity: 0.4; }

        /* ── Theme picker ── */
        .pc-theme-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .pc-theme-opt {
          padding: 18px 14px;
          border-radius: 14px;
          border: 2px solid transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
          transition: border-color 0.18s;
        }
        .pc-theme-swatch {
          width: 36px;
          height: 20px;
          border-radius: 10px;
        }
        .pc-theme-name {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          font-weight: 500;
        }
        .pc-theme-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}