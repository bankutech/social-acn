import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Search, Heart, ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { getSocket } from '../lib/socket';

export default function ChatListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [partnerChats, setPartnerChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    loadChats();
    fetchOnlineUsers();

    const socket = getSocket();
    const handleStatus = ({ userId, online }) => {
      setOnlineUsers(prev => {
        if (online) return [...new Set([...prev, userId])];
        return prev.filter(id => id !== userId);
      });
    };

    const handleNewMsg = () => {
      loadChats(false);
    };

    socket.on('user_status', handleStatus);
    socket.on('new_message', handleNewMsg);
    socket.on('partner_new_message', handleNewMsg);

    // Fast polling every 5s for cross-container and cross-network reliability
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchOnlineUsers();
        loadChats(false);
      }
    }, 5000);

    const onVisibility = () => {
      if (!document.hidden) {
        fetchOnlineUsers();
        loadChats(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      socket.off('user_status', handleStatus);
      socket.off('new_message', handleNewMsg);
      socket.off('partner_new_message', handleNewMsg);
    };
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const data = await api.get('/api/online-users');
      if (Array.isArray(data)) setOnlineUsers(data);
    } catch {}
  };

  const loadChats = async (showSkeleton = true) => {
    if (showSkeleton && chats.length === 0) setLoading(true);
    try {
      const [chatsData, usersData, pChats] = await Promise.all([
        api.get('/api/chat').catch(() => []),
        api.get('/api/chat/users').catch(() => []),
        api.get('/api/partner-chat').catch(() => [])
      ]);
      setChats(Array.isArray(chatsData) ? chatsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPartnerChats(Array.isArray(pChats) ? pChats : []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
    setLoading(false);
  };

  const getPartner = (chat) => {
    return chat.participants?.find(p => p._id !== user?._id);
  };

  const getPartnerFromPC = (pc) => {
    if (pc.user_one_id?._id === user?._id) return pc.user_two_id;
    return pc.user_one_id;
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const filteredChats = chats.filter(c => {
    const partner = getPartner(c);
    return partner?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) &&
    !chats.some(c => c.participants?.some(p => p._id === u._id))
  );

  return (
    <div className="chat-layout-container">
      {/* Left Panel: Conversation List */}
      <aside className="chat-sidebar-panel">
        <div className="chat-sidebar-header">
          <h1 className="chat-sidebar-title">{user?.name}</h1>
        </div>

        {/* Search */}
        <div className="chat-search-wrapper">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="chat-search-input"
              placeholder="Search conversations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable Conversations List */}
        <div className="chat-items-scroll">
          {/* Partner Chats Section */}
          {partnerChats.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={14} fill="var(--accent)" stroke="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>Partner Chats</span>
              </div>
              {partnerChats.map(pc => {
                const partner = getPartnerFromPC(pc);
                return (
                  <motion.div
                    key={pc._id}
                    className="chat-list-item partner-chat-item"
                    onClick={() => navigate(`/partner-chat/${partner?._id}`)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ position: 'relative' }}>
                      <Avatar src={partner?.avatarUrl} name={partner?.name} size={50} online={onlineUsers.includes(partner?._id)} />
                    </div>
                    <div className="chat-list-info">
                      <div className="chat-list-name">{partner?.name} <Heart size={12} fill="#ec4899" stroke="#ec4899" /></div>
                      <div className="chat-list-preview">
                        {pc.lastMessage?.content || 'Start chatting...'}
                      </div>
                    </div>
                    <div className="chat-list-time">
                      <span className="badge" style={{ fontSize: 10, background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>🔒 Private</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Regular Chats */}
          {loading ? (
            <SkeletonLoader type="chat" count={5} />
          ) : (
            <>
              {filteredChats.map(chat => {
                const partner = getPartner(chat);
                return (
                  <motion.div
                    key={chat._id}
                    className="chat-list-item"
                    onClick={() => navigate(`/chat/${partner?._id}`)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Avatar src={partner?.avatarUrl} name={partner?.name} size={50} online={onlineUsers.includes(partner?._id)} />
                    <div className="chat-list-info">
                      <div className="chat-list-name">{partner?.name}</div>
                      <div className="chat-list-preview">{chat.lastMessage || 'Start chatting...'}</div>
                    </div>
                    <div className="chat-list-time">{timeAgo(chat.lastMessageTime)}</div>
                  </motion.div>
                );
              })}

              {/* New chat suggestions */}
              {filteredUsers.length > 0 && (
                <div>
                  <div style={{ padding: '12px 16px 8px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Suggested Users
                  </div>
                  {filteredUsers.map(u => (
                    <motion.div
                      key={u._id}
                      className="chat-list-item"
                      onClick={() => navigate(`/chat/${u._id}`)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar src={u.avatarUrl} name={u.name} size={50} online={onlineUsers.includes(u._id)} />
                      <div className="chat-list-info">
                        <div className="chat-list-name">{u.name}</div>
                        <div className="chat-list-preview">{u.email}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Right Panel: Instagram Desktop Empty State */}
      <section className="chat-desktop-empty-panel">
        <div className="empty-chat-circle">
          <Send size={44} style={{ transform: 'rotate(10deg)' }} />
        </div>
        <h2 className="empty-chat-title">Your Messages</h2>
        <p className="empty-chat-sub">
          Send private photos and direct messages to a friend or study partner.
        </p>
        <button 
          className="empty-chat-btn"
          onClick={() => {
            const input = document.querySelector('.chat-search-input');
            if (input) input.focus();
          }}
        >
          Send message
        </button>
      </section>

      <style>{`
        .chat-layout-container {
          width: 100%;
          min-height: 100vh;
          background: #000000;
          display: flex;
        }

        /* Mobile View (< 768px) */
        @media (max-width: 767px) {
          .chat-sidebar-panel {
            width: 100%;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding-bottom: 60px;
          }

          .chat-desktop-empty-panel {
            display: none !important;
          }
        }

        /* Desktop View (>= 768px) */
        @media (min-width: 768px) {
          .chat-layout-container {
            max-width: 1050px;
            height: calc(100vh - 40px);
            min-height: calc(100vh - 40px);
            margin: 20px auto;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            overflow: hidden;
          }

          .chat-sidebar-panel {
            width: 360px;
            height: 100%;
            border-right: 1px solid rgba(255, 255, 255, 0.12);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            background: #000000;
          }

          .chat-desktop-empty-panel {
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            text-align: center;
            background: #000000;
          }
        }

        .chat-sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chat-sidebar-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }

        .chat-search-wrapper {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .chat-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 14px 10px 38px;
          color: #ffffff;
          font-size: 14px;
        }

        .chat-items-scroll {
          flex: 1;
          overflow-y: auto;
        }

        .chat-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-list-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .partner-chat-item {
          background: rgba(124, 58, 237, 0.06);
          border-left: 3px solid var(--accent);
        }

        .chat-list-info {
          flex: 1;
          min-width: 0;
        }

        .chat-list-name {
          font-weight: 600;
          font-size: 14.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ffffff;
        }

        .chat-list-preview {
          font-size: 13px;
          color: #a8a8a8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-list-time {
          font-size: 12px;
          color: #71717a;
          flex-shrink: 0;
        }

        .empty-chat-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #ffffff;
        }

        .empty-chat-title {
          font-size: 20px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .empty-chat-sub {
          font-size: 14px;
          color: #a8a8a8;
          max-width: 280px;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .empty-chat-btn {
          background: #0095f6;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .empty-chat-btn:hover {
          background: #1877f2;
        }
      `}</style>
    </div>
  );
}
