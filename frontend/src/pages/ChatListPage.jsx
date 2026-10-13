import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Search, Heart, ArrowLeft } from 'lucide-react';
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
    const socket = getSocket();
    socket.on('user_status', ({ userId, online }) => {
      setOnlineUsers(prev => {
        if (online) return [...new Set([...prev, userId])];
        return prev.filter(id => id !== userId);
      });
    });
    // Get initial online users
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/online-users`)
      .then(r => r.json())
      .then(setOnlineUsers)
      .catch(() => {});
    return () => { socket.off('user_status'); };
  }, []);

  const loadChats = async () => {
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
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

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
                  <Avatar src={partner?.avatarUrl} name={partner?.name} size={52} online={onlineUsers.includes(partner?._id)} />
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
                <Avatar src={partner?.avatarUrl} name={partner?.name} size={52} online={onlineUsers.includes(partner?._id)} />
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
              <div style={{ padding: '12px 16px 8px', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Start a conversation
              </div>
              {filteredUsers.map(u => (
                <motion.div
                  key={u._id}
                  className="chat-list-item"
                  onClick={() => navigate(`/chat/${u._id}`)}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={52} online={onlineUsers.includes(u._id)} />
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

      <style>{`
        .chat-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-list-item:hover {
          background: var(--bg-hover);
        }
        .partner-chat-item {
          background: rgba(124, 58, 237, 0.05);
          border-left: 3px solid var(--accent);
        }
        .chat-list-info {
          flex: 1;
          min-width: 0;
        }
        .chat-list-name {
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chat-list-preview {
          font-size: 13px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-list-time {
          font-size: 12px;
          color: var(--text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
