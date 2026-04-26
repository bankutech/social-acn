import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { getSocket } from '../lib/socket';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, Send, Smile, Image as ImageIcon, Video as VideoIcon, X, MoreVertical, Reply, Edit2, Trash2 } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  
  // Reply & Edit State
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChat();
    const socket = getSocket();

    socket.on('new_message', (data) => {
      if (data.message && String(data.message.sender?._id || data.message.sender) !== String(user?._id)) {
        setMessages(prev => {
          if (data.message._id && prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    });

    socket.on('message_edited', (data) => {
        setMessages(prev => prev.map(m => m._id === data.message._id ? data.message : m));
    });

    socket.on('message_deleted', (data) => {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted', mediaUrl: '' } : m));
    });

      socket.off('user_typing');
    };
  }, [userId, user?._id]);

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

  useEffect(() => {
    if (messages.length > 0) {
      const timeout = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, typing]);

  const handleSend = async () => {
    if (!input.trim() && !mediaFile) return;
    
    // Maintain focus to prevent keyboard from closing
    if (inputRef.current) inputRef.current.focus();

    const content = input;
    const isEditing = !!editingMsg;
    const currentReplyTo = replyingTo;

    // Clear UI state immediately for responsiveness
    if (!isEditing) setInput('');
    setReplyingTo(null);
    setEditingMsg(null);

    try {
      if (isEditing) {
        const updated = await api.put(`/api/chat/${chat._id}/message/${editingMsg._id}`, { content });
        setMessages(prev => prev.map(m => m._id === editingMsg._id ? updated : m));
        getSocket().emit('edit_message', { receiverId: userId, message: updated, chatId: chat._id });
        setInput('');
      } else {
        let mediaUrl = '';
        let message_type = 'text';
        if (mediaFile) {
          const fd = new FormData();
          fd.append('file', mediaFile);
          const up = await api.upload(mediaType === 'video' ? '/api/upload/video/chat' : '/api/upload/image/chat', fd);
          mediaUrl = up.url;
          message_type = mediaType === 'video' ? 'video' : 'image';
        }
        
        const msg = await api.post('/api/chat/send', { 
            content, 
            receiverId: userId, 
            message_type, 
            mediaUrl,
            replyToId: currentReplyTo?._id
        });
        
        setMessages(prev => [...prev, msg]);
        getSocket().emit('private_message', { receiverId: userId, message: msg, chatId: chat?._id });
        setMediaFile(null);
        setMediaPreview('');
        setMediaType('');
        scrollToBottom();
      }
    } catch (e) {
      setError(e?.message || 'Failed to send message');
      setInput(content);
    }
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setInput(msg.content);
    setReplyingTo(null);
    setSelectedMsgId(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
        await api.delete(`/api/chat/${chat._id}/message/${msgId}`);
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted', mediaUrl: '' } : m));
        getSocket().emit('delete_message', { receiverId: userId, messageId: msgId, chatId: chat._id });
        setSelectedMsgId(null);
    } catch (e) {
        setError('Failed to delete message');
    }
  };

                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="input-row-v2">
          <div className="input-actions-v2">
            <label className="action-btn-v2">
              <ImageIcon size={20} />
              <input type="file" accept="image/*" hidden onChange={e => onPickMedia(e.target.files[0])} />
            </label>
            <label className="action-btn-v2">
              <VideoIcon size={20} />
              <input type="file" accept="video/*" hidden onChange={e => onPickMedia(e.target.files[0])} />
            </label>
          </div>

          <div className="input-wrapper-v2">
            <textarea
              ref={inputRef}
              rows={1}
              className="chat-textarea-v2"
              placeholder="Type something..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleTyping();
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button 
            className="send-btn-v2" 
            onClick={handleSend}
            disabled={!input.trim() && !mediaFile}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .chat-page-v2 {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: #000;
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .chat-header-v2 {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          z-index: 100;
        }

        .back-btn-v2, .more-btn-v2 {
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          padding: 8px;
          cursor: pointer;
        }

        .partner-info-v2 {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: 8px;
          cursor: pointer;
        }

        .partner-name-v2 {
          display: block;
          font-size: 15px;
          font-weight: 700;
        }

        .status-v2 {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
        .status-v2.typing { color: #22d3ee; }

        .chat-menu-v2 {
          position: absolute;
          top: 60px;
          right: 16px;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 6px;
          min-width: 180px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .menu-item-v2 {
          width: 100%;
          padding: 12px;
          background: none;
          border: none;
          color: white;
          text-align: left;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
        }
        .menu-item-v2:hover { background: rgba(255,255,255,0.05); }
        .menu-item-v2.delete { color: #ef4444; }

        .messages-container-v2 {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bubble-row-v2 {
          display: flex;
          flex-direction: column;
          width: 100%;
          position: relative;
        }
        .bubble-row-v2.mine { align-items: flex-end; }
        .bubble-row-v2.theirs { align-items: flex-start; }

        .bubble-v2 {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.5;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .bubble-v2.mine {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble-v2.theirs {
          background: #262626;
          color: white;
          border-bottom-left-radius: 4px;
        }
        
        .bubble-v2.deleted {
            opacity: 0.5;
            font-style: italic;
        }

        .reply-context-bubble {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 6px 10px;
            margin-bottom: 6px;
            border-left: 3px solid rgba(255,255,255,0.3);
            font-size: 12px;
            opacity: 0.8;
        }

        .msg-media-v2 {
          width: 100%;
          max-width: 280px;
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .bubble-meta-v2 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          opacity: 0.5;
          margin-top: 4px;
          justify-content: flex-end;
        }

        .msg-actions-v2 {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          background: #333;
          padding: 4px 12px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .msg-action-btn-v2 {
          background: none;
          border: none;
          color: white;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }

        .chat-footer-v2 {
          padding: 12px 16px 30px;
          background: #000;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .input-context-v2 {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #1a1a1a;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 12px;
          position: relative;
        }

        .context-icon-v2 { color: #6366f1; }
        .context-content-v2 { flex: 1; min-width: 0; }
        .context-label-v2 { font-size: 11px; font-weight: 700; color: #6366f1; display: block; margin-bottom: 2px; }
        .context-text-v2 { font-size: 12px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .input-row-v2 {
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .input-actions-v2 {
          display: flex;
          gap: 4px;
          padding-bottom: 6px;
        }
        .action-btn-v2 {
          color: rgba(255,255,255,0.5);
          padding: 8px;
          cursor: pointer;
        }

        .input-wrapper-v2 {
          flex: 1;
          background: #1a1a1a;
          border-radius: 20px;
          padding: 10px 16px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .chat-textarea-v2 {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          outline: none;
          resize: none;
          max-height: 120px;
          padding: 0;
          line-height: 1.4;
        }

        .send-btn-v2 {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #6366f1;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .send-btn-v2:active { transform: scale(0.9); }
        .send-btn-v2:disabled { opacity: 0.3; }

        .media-preview-v2 {
          margin-bottom: 12px;
        }
        .media-preview-box-v2 {
          position: relative;
          display: inline-block;
          border-radius: 12px;
          overflow: hidden;
        }
        .media-preview-box-v2 img, .media-preview-box-v2 video { width: 120px; height: 120px; object-fit: cover; }
        .remove-media-v2 {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.5);
          border: none;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ msg, isMine, isSelected, onSelect, onReply, onEdit, onDelete, formatTime }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 60], [0, 1]);
  const scale = useTransform(x, [0, 60], [0.8, 1]);

  return (
    <div className={`bubble-row-v2 ${isMine ? 'mine' : 'theirs'}`}>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 80 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
            if (info.offset.x > 50) onReply();
        }}
        style={{ x }}
        className={`bubble-v2 ${isMine ? 'mine' : 'theirs'} ${msg.isDeleted ? 'deleted' : ''}`}
        onClick={onSelect}
      >
        {/* Reply Indicator on Drag */}
        <motion.div 
            style={{ position: 'absolute', left: -40, top: '50%', y: '-50%', opacity, scale }}
            className="swipe-reply-icon"
        >
            <Reply size={18} color="#6366f1" />
        </motion.div>

        {msg.replyTo && !msg.isDeleted && (
            <div className="reply-context-bubble">
                <span style={{ fontWeight: 700, fontSize: 10, display: 'block', marginBottom: 2 }}>
                    {msg.replyTo.sender?.name || 'Partner'}
                </span>
                <span style={{ opacity: 0.7 }}>{msg.replyTo.content}</span>
            </div>
        )}

        {msg.message_type === 'image' && msg.mediaUrl && !msg.isDeleted && (
          <img src={api.getFileUrl(msg.mediaUrl)} className="msg-media-v2" alt="" />
        )}
        {msg.message_type === 'video' && msg.mediaUrl && !msg.isDeleted && (
          <video src={api.getFileUrl(msg.mediaUrl)} className="msg-media-v2" controls />
        )}
        
        <p style={{ margin: 0 }}>{msg.content}</p>
        
        <div className="bubble-meta-v2">
          {msg.isEdited && <span>edited</span>}
          <span>{formatTime(msg.timestamp || msg.createdAt)}</span>
        </div>
      </motion.div>

      {/* Message Context Menu */}
      <AnimatePresence>
        {isSelected && !msg.isDeleted && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="msg-actions-v2"
          >
            <button className="msg-action-btn-v2" onClick={onReply}><Reply size={14} /> Reply</button>
            {isMine && <button className="msg-action-btn-v2" onClick={onEdit}><Edit2 size={14} /> Edit</button>}
            {isMine && <button className="msg-action-btn-v2" style={{ color: '#ef4444' }} onClick={onDelete}><Trash2 size={14} /> Delete</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}