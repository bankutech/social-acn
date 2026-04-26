import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, Send, Smile, Camera, X, Palette, Clock, ShieldCheck, MoreVertical, Reply, Edit2, Trash2 } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [, forceUpdate] = useState(0);

  // Reply & Edit State
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

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
        setMessages(prev => {
          if (msg._id && prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });

    socket.on('partner_message_edited', (msg) => {
        setMessages(prev => prev.map(m => m._id === msg._id ? msg : m));
    });

    socket.on('partner_message_deleted', (data) => {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted', image_url: '' } : m));
    });

    socket.on('partner_user_typing', ({ userId, isTyping }) => {
      if (userId === partnerId) setTyping(isTyping);
    });

    socket.on('partner_theme_change', (data) => {
      const tname = data.theme_name || data.theme?.theme_name;
      if (tname && THEMES[tname]) setTheme(tname);
    });

    return () => {
      if (chat?._id) socket.emit('leave_partner_chat', chat._id);
      socket.off('partner_new_message');
      socket.off('partner_message_edited');
      socket.off('partner_message_deleted');
      socket.off('partner_user_typing');
      socket.off('partner_theme_change');
    };
  }, [chat?._id, user?._id]);

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
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error("Failed to load partner chat:", err);
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

  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, typing]);

  const handleSend = async () => {
    if ((!input.trim() && !imageFile) || !chat?._id || sending) return;
    
    if (inputRef.current) inputRef.current.focus();

    setSending(true);
    const content = input;
    const isEditing = !!editingMsg;
    const currentReplyTo = replyingTo;

    if (!isEditing) setInput('');
    setReplyingTo(null);
    setEditingMsg(null);

    try {
      if (isEditing) {
        const updated = await api.put(`/api/partner-chat/message/${editingMsg._id}`, { content });
        setMessages(prev => prev.map(m => m._id === editingMsg._id ? updated : m));
        getSocket().emit('partner_message_edited', { chatId: chat._id, message: updated });
        setInput('');
      } else {
        let image_url = '';
        let cloudinary_public_id = '';
        if (imageFile) {
          const fd = new FormData();
          fd.append('image', imageFile);
          const up = await api.upload(`/api/partner-chat/${chat._id}/upload`, fd);
          image_url = up.image_url;
          cloudinary_public_id = up.cloudinary_public_id;
        }

        const msg = await api.post(`/api/partner-chat/${chat._id}/message`, {
          content,
          message_type: image_url ? 'image' : 'text',
          image_url,
          cloudinary_public_id,
          replyToId: currentReplyTo?._id
        });

        setMessages(prev => [...prev, msg]);
        setImageFile(null);
        setImagePreview('');
        setShowImageModal(false);

        getSocket().emit('partner_message', { chatId: chat._id, message: msg });
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
      setInput(content);
    }
    setSending(false);
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setInput(msg.content);
    setReplyingTo(null);
    setSelectedMsgId(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Delete this private message?')) return;
    try {
        await api.delete(`/api/partner-chat/message/${msgId}`);
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted', image_url: '' } : m));
        getSocket().emit('partner_message_deleted', { chatId: chat._id, messageId: msgId });
        setSelectedMsgId(null);
    } catch (e) {
        console.error(e);
    }
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
    <div className="pc-page" style={{ background: t.bg }}>
      <header className="pc-header">
        <button className="pc-icon-btn" onClick={() => navigate('/chat')}>
          <ArrowLeft size={18} />
        </button>

        <div className="pc-header-info" onClick={() => navigate(`/profile/${partnerId}`)}>
          <Avatar src={partner?.avatarUrl} name={partner?.name} size={38} />
          <div className="pc-header-text">
            <div className="pc-header-name">
              {partner?.name || 'Partner'}
              <span className="pc-private-badge"><ShieldCheck size={10} /> Private</span>
            </div>
            <div className="pc-header-sub" style={{ color: typing ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
              {typing ? 'typing...' : 'Partner chat'}
            </div>
          </div>
        </div>

        <button className="pc-icon-btn" style={{ color: t.accent }} onClick={() => setShowThemePicker(true)}>
          <Palette size={18} />
        </button>

        <div style={{ position: 'relative' }}>
          <button className="pc-icon-btn" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="pc-menu-dropdown">
              <button onClick={async () => {
                if (window.confirm('Delete this partner chat?')) {
                  await api.delete(`/api/partner-chat/${chat._id}`);
                  navigate('/chat');
                }
              }} className="pc-menu-item" style={{ color: '#ef4444' }}>
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="pc-notice">
        <ShieldCheck size={12} />
        Messages auto-delete after 24 hours · only you and {partner?.name?.split(' ')[0] || 'partner'} can see this
      </div>

      <div className="pc-messages">
        {loading && <div className="pc-loader"><div className="pc-spinner" style={{ borderTopColor: t.accent }} /></div>}
        
        {messages.length === 0 && !loading && (
          <div className="pc-empty">
            <div className="pc-empty-icon">🔒</div>
            <h3>Your private sphere</h3>
            <p>Messages are end-to-end encrypted and auto-delete after 24 hours.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = String(msg.sender_id?._id || msg.sender_id) === String(user?._id);
          const isSelected = selectedMsgId === msg._id;
          
          return (
            <PartnerBubble 
                key={msg._id || i}
                msg={msg}
                isMine={isMine}
                isSelected={isSelected}
                theme={t}
                onSelect={() => setSelectedMsgId(isSelected ? null : msg._id)}
                onReply={() => { setReplyingTo(msg); setEditingMsg(null); if (inputRef.current) inputRef.current.focus(); }}
                onEdit={() => handleEdit(msg)}
                onDelete={() => handleDeleteMsg(msg._id)}
                formatTime={formatTime}
                getTimeRemaining={getTimeRemaining}
            />
          );
        })}
        
        {typing && (
          <div className="pc-bubble-row theirs">
            <div className="pc-bubble pc-theirs pc-typing" style={{ background: t.msgBg }}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pc-footer">
        <AnimatePresence>
            {(replyingTo || editingMsg) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pc-context-preview">
                    <div className="pc-context-icon" style={{ color: t.accent }}>
                        {replyingTo ? <Reply size={14} /> : <Edit2 size={14} />}
                    </div>
                    <div className="pc-context-content">
                        <span className="pc-context-label" style={{ color: t.accent }}>
                            {replyingTo ? `Replying to ${replyingTo.sender_id?.name || 'Partner'}` : 'Editing message'}
                        </span>
                        <p className="pc-context-text">{replyingTo?.content || editingMsg?.content}</p>
                    </div>
                    <button className="pc-context-close" onClick={() => { setReplyingTo(null); setEditingMsg(null); if (!editingMsg) setInput(''); }}>
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="pc-input-bar">
          <div className="pc-input-actions">
            <button className="pc-icon-btn-simple" onClick={() => setShowEmoji(v => !v)}><Smile size={20} /></button>
            <label className="pc-icon-btn-simple">
              <Camera size={20} />
              <input type="file" accept="image/*" hidden onChange={handleImageSelect} />
            </label>
          </div>

          <textarea
            ref={inputRef}
            className="pc-input-v2"
            style={{ background: t.inputBg }}
            placeholder="Type a message…"
            value={input}
            rows={1}
            onChange={e => { 
                setInput(e.target.value); 
                handleTyping();
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />

          <button className="pc-send-btn" style={{ background: t.accent }} onClick={handleSend} disabled={(!input.trim() && !imageFile) || sending}>
            <Send size={18} />
          </button>
        </div>

        <AnimatePresence>
            {showEmoji && (
                <motion.div className="pc-emoji-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    {EMOJIS.map(e => <button key={e} onClick={() => { setInput(p => p+e); setShowEmoji(false); }} className="pc-emoji-item">{e}</button>)}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Modals & Picker */}
      <AnimatePresence>
        {showImageModal && imagePreview && (
          <motion.div className="pc-modal-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={clearImage}>
            <motion.div className="pc-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
              <img src={imagePreview} alt="Preview" className="pc-modal-img" />
              <div className="pc-modal-footer">
                  <input placeholder="Add a caption…" value={input} onChange={e => setInput(e.target.value)} className="pc-modal-input" />
                  <button className="pc-modal-send" style={{ background: t.accent }} onClick={handleSend}>{sending ? '...' : 'Send'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showThemePicker && (
          <motion.div className="pc-modal-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowThemePicker(false)}>
            <motion.div className="pc-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
                <h3 className="pc-modal-title">Choose Theme</h3>
                <div className="pc-theme-grid">
                  {Object.entries(THEMES).map(([key, th]) => (
                    <button key={key} className={`pc-theme-opt ${theme === key ? 'active' : ''}`} style={{ background: th.bg }} onClick={() => handleThemeChange(key)}>
                      <div className="pc-theme-swatch" style={{ background: th.accent }} />
                      <span>{th.name}</span>
                    </button>
                  ))}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pc-page { height: 100dvh; display: flex; flex-direction: column; color: white; font-family: 'Inter', sans-serif; overflow: hidden; }
        .pc-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pc-icon-btn { background: none; border: none; color: rgba(255,255,255,0.7); padding: 8px; cursor: pointer; }
        .pc-header-info { flex: 1; display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .pc-header-name { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .pc-private-badge { background: rgba(124,58,237,0.3); color: #c4b5fd; font-size: 10px; padding: 2px 8px; border-radius: 12px; display: flex; align-items: center; gap: 4px; }
        .pc-header-sub { font-size: 11px; margin-top: 2px; }
        .pc-notice { background: rgba(124,58,237,0.1); padding: 8px 16px; font-size: 11px; color: #c4b5fd; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        .pc-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        
        .pc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
          opacity: 0.6;
        }
        .pc-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .pc-empty h3 { font-size: 18px; margin-bottom: 8px; }
        .pc-empty p { font-size: 13px; max-width: 240px; line-height: 1.4; }
        .pc-bubble-row { display: flex; flex-direction: column; width: 100%; position: relative; }
        .pc-bubble-row.mine { align-items: flex-end; }
        .pc-bubble-row.theirs { align-items: flex-start; }
        .pc-bubble { max-width: 80%; padding: 10px 14px; border-radius: 18px; font-size: 14px; line-height: 1.5; position: relative; cursor: pointer; }
        .pc-mine { border-bottom-right-radius: 4px; }
        .pc-theirs { border-bottom-left-radius: 4px; }
        .pc-bubble.deleted { opacity: 0.5; font-style: italic; }
        .pc-bubble-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 10px; opacity: 0.5; justify-content: flex-end; }
        .pc-timer { display: flex; align-items: center; gap: 4px; color: #fbbf24; }
        
        .pc-footer { padding: 12px 16px 30px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); }
        .pc-input-bar { display: flex; align-items: flex-end; gap: 10px; }
        .pc-input-actions { display: flex; gap: 4px; padding-bottom: 6px; }
        .pc-icon-btn-simple { background: none; border: none; color: rgba(255,255,255,0.5); padding: 8px; cursor: pointer; }
        .pc-input-v2 { flex: 1; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 10px 16px; color: white; font-size: 14px; outline: none; resize: none; max-height: 120px; line-height: 1.4; }
        .pc-send-btn { width: 42px; height: 42px; border-radius: 50%; border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .pc-context-preview { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; }
        .pc-context-content { flex: 1; min-width: 0; }
        .pc-context-label { font-size: 11px; font-weight: 700; display: block; margin-bottom: 2px; }
        .pc-context-text { font-size: 12px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .pc-reply-bubble { background: rgba(0,0,0,0.2); border-left: 3px solid rgba(255,255,255,0.3); padding: 6px 10px; border-radius: 8px; margin-bottom: 6px; font-size: 12px; opacity: 0.8; }
        .pc-msg-actions { display: flex; gap: 8px; margin-top: 4px; background: #222; padding: 4px 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .pc-action-btn { background: none; border: none; color: white; padding: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; }
        
        .pc-modal-wrap { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .pc-modal { background: #1a1a1a; border-radius: 24px; padding: 20px; width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,0.1); }
        .pc-modal-img { width: 100%; border-radius: 16px; margin-bottom: 16px; max-height: 300px; object-fit: cover; }
        .pc-modal-input { width: 100%; background: #222; border: none; padding: 12px; border-radius: 12px; color: white; margin-bottom: 16px; }
        .pc-modal-send { width: 100%; padding: 12px; border-radius: 12px; border: none; color: white; font-weight: 700; }
        .pc-theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        .pc-theme-opt { padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
        .pc-theme-swatch { width: 30px; height: 30px; border-radius: 50%; }
        
        .pc-typing span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); display: block; animation: bounce 1.2s infinite; }
        .pc-typing span:nth-child(2) { animation-delay: 0.2s; }
        .pc-typing span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

function PartnerBubble({ msg, isMine, isSelected, theme, onSelect, onReply, onEdit, onDelete, formatTime, getTimeRemaining }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 60], [0, 1]);
  const scale = useTransform(x, [0, 60], [0.8, 1]);

  return (
    <div className={`pc-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 80 }}
        onDragEnd={(e, info) => info.offset.x > 50 && onReply()}
        style={{ background: isMine ? theme.accent : theme.msgBg, x }}
        className={`pc-bubble ${isMine ? 'pc-mine' : 'pc-theirs'} ${msg.isDeleted ? 'deleted' : ''}`}
        onClick={onSelect}
      >
        <motion.div style={{ position: 'absolute', left: -40, top: '50%', y: '-50%', opacity, scale }}>
            <Reply size={18} color={theme.accent} />
        </motion.div>

        {msg.replyTo && !msg.isDeleted && (
            <div className="pc-reply-bubble">
                <span style={{ fontWeight: 700, fontSize: 10, display: 'block', marginBottom: 2 }}>
                    {msg.replyTo.sender_id?.name || 'Partner'}
                </span>
                <span style={{ opacity: 0.7 }}>{msg.replyTo.content}</span>
            </div>
        )}

        {msg.message_type === 'image' && msg.image_url && !msg.isDeleted && (
          <img src={api.getFileUrl(msg.image_url)} className="pc-msg-img" alt="" onClick={() => window.open(api.getFileUrl(msg.image_url), '_blank')} />
        )}
        
        <p className="pc-bubble-text">{msg.content}</p>
        
        <div className="pc-bubble-meta">
          {msg.isEdited && <span>edited</span>}
          <span>{formatTime(msg.created_at)}</span>
          {msg.expires_at && <span className="pc-timer"><Clock size={10} />{getTimeRemaining(msg.expires_at)}</span>}
        </div>
      </motion.div>

      <AnimatePresence>
        {isSelected && !msg.isDeleted && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="pc-msg-actions">
            <button className="pc-action-btn" onClick={onReply}><Reply size={14} /> Reply</button>
            {isMine && <button className="pc-action-btn" onClick={onEdit}><Edit2 size={14} /> Edit</button>}
            {isMine && <button className="pc-action-btn" style={{ color: '#ef4444' }} onClick={onDelete}><Trash2 size={14} /> Delete</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}