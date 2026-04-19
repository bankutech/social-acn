import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { ArrowLeft, Send, Smile, Image as ImageIcon, Video as VideoIcon, X, MoreVertical } from 'lucide-react';

export default function ChatPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [partner, setPartner] = useState(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    loadChat();
    const socket = getSocket();

    socket.on('new_message', (data) => {
      if (data.message && String(data.message.sender?._id || data.message.sender) !== String(user?._id)) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    });

    socket.on('user_typing', ({ userId: uid, isTyping }) => {
      if (uid === userId) setTyping(isTyping);
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [userId]);

  const loadChat = async () => {
    try {
      setError('');
      const data = await api.get(`/api/chat/${userId}`);
      setChat(data);
      setMessages(data.messages || []);
      const p = data.participants?.find(p => p._id !== user?._id);
      setPartner(p);
    } catch (e) {
      setError(e?.message || 'Failed to load chat');
    }
    setLoading(false);
    setTimeout(scrollToBottom, 100);
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
      const timeout = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, typing]);

  const handleSend = async () => {
    if (!input.trim() && !mediaFile) return;
    const content = input;
    setInput('');
    try {
      let mediaUrl = '';
      let message_type = 'text';
      if (mediaFile) {
        const fd = new FormData();
        fd.append('file', mediaFile);
        if (mediaType === 'video') {
          const up = await api.upload('/api/upload/video/chat', fd);
          mediaUrl = up.url;
          message_type = 'video';
        } else {
          const up = await api.upload('/api/upload/image/chat', fd);
          mediaUrl = up.url;
          message_type = 'image';
        }
      }
      const msg = await api.post('/api/chat/send', { content, receiverId: userId, message_type, mediaUrl });
      setMessages(prev => [...prev, msg]);
      getSocket().emit('private_message', { receiverId: userId, content, message_type, mediaUrl, chatId: chat?._id });
      setMediaFile(null);
      setMediaPreview('');
      setMediaType('');
      scrollToBottom();
    } catch (e) {
      setError(e?.message || 'Failed to send message');
      setInput(content);
    }
  };

  const onPickMedia = (file) => {
    if (!file) return;
    const isVideo = file.type?.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket.emit('typing', { receiverId: userId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { receiverId: userId, isTyping: false });
    }, 2000);
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="chat-page" role="main" aria-label="Chat conversation">

        {/* Header */}
        <header className="chat-header">
          <button
            className="chat-icon-btn"
            onClick={() => navigate('/chat')}
            aria-label="Back to chats"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            className="chat-header-info"
            onClick={() => navigate(`/profile/${userId}`)}
            aria-label={`View ${partner?.name}'s profile`}
          >
            <Avatar src={partner?.avatarUrl} name={partner?.name} size={38} />
            <div className="chat-header-text">
              <span className="chat-header-name">{partner?.name || 'Chat'}</span>
              {typing && (
                <span className="chat-typing-label" aria-live="polite">typing...</span>
              )}
            </div>
          </button>

          <button className="chat-icon-btn" aria-label="More options">
            <MoreVertical size={18} />
          </button>
        </header>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Messages">
          {loading && (
            <div className="chat-loader" role="status" aria-label="Loading messages">
              <div className="chat-spinner" />
            </div>
          )}

          {!loading && error && (
            <div className="chat-error" role="alert">{error}</div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="chat-empty">
              <p>Say hello to {partner?.name || 'your contact'} 👋</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMine = String(msg.sender?._id || msg.sender) === String(user?._id);
            return (
              <div key={i} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                <div className={`chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                  {msg.message_type === 'image' && msg.mediaUrl && (
                    <button
                      className="chat-media-btn"
                      onClick={() => window.open(api.getFileUrl(msg.mediaUrl), '_blank')}
                      aria-label="Open image in new tab"
                    >
                      <img
                        src={api.getFileUrl(msg.mediaUrl)}
                        alt="Shared image"
                        className="chat-media-img"
                      />
                    </button>
                  )}
                  {msg.message_type === 'video' && msg.mediaUrl && (
                    <video
                      src={api.getFileUrl(msg.mediaUrl)}
                      className="chat-media-img"
                      controls
                      aria-label="Shared video"
                    />
                  )}
                  {msg.content && <p className="chat-bubble-text">{msg.content}</p>}
                  <time className="chat-bubble-time" dateTime={msg.timestamp || msg.createdAt}>
                    {formatTime(msg.timestamp || msg.createdAt)}
                  </time>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="chat-bubble-row theirs" aria-label="Partner is typing">
              <div className="chat-bubble bubble-theirs chat-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Media preview */}
        {mediaPreview && (
          <div className="chat-media-preview" role="region" aria-label="Media preview">
            <div className="chat-media-preview-inner">
              {mediaType === 'video'
                ? <video src={mediaPreview} controls aria-label="Video to send" />
                : <img src={mediaPreview} alt="Image to send" />
              }
              <button
                className="chat-media-remove"
                onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaType(''); }}
                aria-label="Remove media"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chat-input-bar" role="form" aria-label="Message input">
          <div className="chat-input-actions">
            <button className="chat-icon-btn" aria-label="Pick emoji">
              <Smile size={18} />
            </button>
            <label className="chat-icon-btn" aria-label="Attach image">
              <ImageIcon size={18} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e => onPickMedia(e.target.files?.[0])}
              />
            </label>
            <label className="chat-icon-btn" aria-label="Attach video">
              <VideoIcon size={18} />
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={e => onPickMedia(e.target.files?.[0])}
              />
            </label>
          </div>

          <input
            className="chat-input"
            placeholder="Type a message…"
            value={input}
            onChange={e => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            aria-label="Message"
            autoComplete="off"
          />

          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() && !mediaFile}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .chat-page {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          overflow: hidden;
        }

        /* ── Header ── */
        .chat-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .chat-header-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0;
          min-width: 0;
        }
        .chat-header-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .chat-header-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-typing-label {
          font-size: 11px;
          color: var(--success);
          line-height: 1;
        }

        /* ── Icon button ── */
        .chat-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }
        .chat-icon-btn:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        /* ── Messages ── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overscroll-behavior: contain;
        }
        .chat-loader {
          display: flex;
          justify-content: center;
          padding: 40px 0;
        }
        .chat-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .chat-error {
          background: var(--error-bg, #fee);
          color: var(--error, #c00);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          text-align: center;
          margin: 0 auto;
          max-width: 400px;
        }
        .chat-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: var(--text-tertiary);
        }

        /* ── Bubbles ── */
        .chat-bubble-row {
          display: flex;
        }
        .chat-bubble-row.mine { justify-content: flex-end; }
        .chat-bubble-row.theirs { justify-content: flex-start; }
        .chat-bubble {
          max-width: 72%;
          padding: 9px 13px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.45;
          position: relative;
        }
        .bubble-mine {
          background: var(--accent);
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .bubble-theirs {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .chat-bubble-text { margin: 0; }
        .chat-bubble-time {
          display: block;
          font-size: 10px;
          opacity: 0.55;
          margin-top: 4px;
          text-align: right;
        }

        /* Typing dots */
        .chat-typing-dots {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 14px;
        }
        .chat-typing-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-tertiary);
          display: block;
          animation: bounce 1.2s ease-in-out infinite;
        }
        .chat-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        /* ── Media ── */
        .chat-media-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: block;
        }
        .chat-media-img {
          display: block;
          width: 100%;
          max-width: 240px;
          border-radius: 12px;
          margin-bottom: 5px;
          object-fit: cover;
        }

        /* ── Media preview ── */
        .chat-media-preview {
          padding: 10px 14px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          flex-shrink: 0;
        }
        .chat-media-preview-inner {
          position: relative;
          display: inline-block;
        }
        .chat-media-preview-inner img,
        .chat-media-preview-inner video {
          max-width: 220px;
          max-height: 180px;
          border-radius: 12px;
          object-fit: cover;
          display: block;
        }
        .chat-media-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* ── Input bar ── */
        .chat-input-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-primary);
          border-top: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .chat-input-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .chat-input {
          flex: 1;
          height: 40px;
          border-radius: 20px;
          padding: 0 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .chat-input::placeholder { color: var(--text-tertiary); }
        .chat-input:focus { border-color: var(--accent); }
        .chat-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.1s;
        }
        .chat-send-btn:hover:not(:disabled) { opacity: 0.9; }
        .chat-send-btn:active:not(:disabled) { transform: scale(0.94); }
        .chat-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>
    </>
  );
}