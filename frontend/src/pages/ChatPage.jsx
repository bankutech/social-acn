import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { ArrowLeft, Send, Smile, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';

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
      // Only add messages received FROM the other person, not our own (already added after API call)
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
      console.error(e);
      setError(e?.message || 'Failed to load chat');
    }
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

      const socket = getSocket();
      socket.emit('private_message', {
        receiverId: userId,
        content,
        message_type,
        mediaUrl,
        chatId: chat?._id
      });

      setMediaFile(null);
      setMediaPreview('');
      setMediaType('');
      scrollToBottom();
    } catch (e) {
      console.error(e);
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

  const timeFormat = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <button className="btn-icon" onClick={() => navigate('/chat')}>
          <ArrowLeft size={22} />
        </button>
        <div className="chat-header-info" onClick={() => navigate(`/profile/${userId}`)}>
          <Avatar src={partner?.avatarUrl} name={partner?.name} size={36} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{partner?.name || 'Chat'}</div>
            {typing && <div style={{ fontSize: 11, color: 'var(--success)' }}>typing...</div>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
            <div className="loader-spinner" />
          </div>
        )}
        {!loading && error && (
          <div className="auth-error" style={{ margin: '0 auto', maxWidth: 420 }}>
            {error}
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = String(msg.sender?._id || msg.sender) === String(user?._id);
          return (
            <div key={i} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
              <div className={`chat-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                {msg.message_type === 'image' && msg.mediaUrl && (
                  <img
                    src={api.getFileUrl(msg.mediaUrl)}
                    alt=""
                    className="chat-media"
                    onClick={() => window.open(api.getFileUrl(msg.mediaUrl), '_blank')}
                  />
                )}
                {msg.message_type === 'video' && msg.mediaUrl && (
                  <video
                    src={api.getFileUrl(msg.mediaUrl)}
                    className="chat-media"
                    controls
                  />
                )}
                {msg.content && <p>{msg.content}</p>}
                <span className="bubble-time">{timeFormat(msg.timestamp || msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <button className="btn-icon" onClick={() => {}}><Smile size={22} /></button>

        <label className="btn-icon" style={{ cursor: 'pointer' }}>
          <ImageIcon size={22} />
          <input type="file" accept="image/*" hidden onChange={(e) => onPickMedia(e.target.files?.[0])} />
        </label>
        <label className="btn-icon" style={{ cursor: 'pointer' }}>
          <VideoIcon size={22} />
          <input type="file" accept="video/*" hidden onChange={(e) => onPickMedia(e.target.files?.[0])} />
        </label>
        <input
          placeholder="Type a message..."
          value={input}
          onChange={e => { setInput(e.target.value); handleTyping(); }}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
          <Send size={20} />
        </button>
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="chat-media-preview">
          <div className="chat-media-preview-inner">
            {mediaType === 'video' ? (
              <video src={mediaPreview} controls />
            ) : (
              <img src={mediaPreview} alt="" />
            )}
            <button className="btn-icon" onClick={() => { setMediaFile(null); setMediaPreview(''); setMediaType(''); }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .chat-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          padding-bottom: 0;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(10,10,10,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
        }
        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scroll-behavior: smooth;
        }
        .chat-bubble-row {
          display: flex;
          margin-bottom: 2px;
        }
        .chat-bubble-row.mine {
          justify-content: flex-end;
        }
        .chat-bubble-row.theirs {
          justify-content: flex-start;
        }
        .chat-bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          position: relative;
        }
        .bubble-mine {
          background: var(--accent);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble-theirs {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .bubble-time {
          display: block;
          font-size: 10px;
          opacity: 0.6;
          margin-top: 4px;
          text-align: right;
        }
        .chat-input-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }
        .chat-input-bar input {
          flex: 1;
          border-radius: var(--radius-full);
          padding: 10px 16px;
        }
        .chat-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
        }
        .chat-media {
          width: 100%;
          max-width: 260px;
          border-radius: 12px;
          margin-bottom: 6px;
          display: block;
        }
        .chat-media-preview {
          padding: 10px 12px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .chat-media-preview-inner {
          position: relative;
          max-width: 320px;
        }
        .chat-media-preview-inner img,
        .chat-media-preview-inner video {
          width: 100%;
          border-radius: 12px;
          max-height: 240px;
          object-fit: cover;
          display: block;
        }
        .chat-media-preview-inner button {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0,0,0,0.55);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
