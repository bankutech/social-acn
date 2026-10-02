import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import { Search, Heart, Lock, MessageSquareDashed } from 'lucide-react';
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
      setOnlineUsers((prev) => {
        if (online) return [...new Set([...prev, userId])];
        return prev.filter((id) => id !== userId);
      });
    });
    api
      .get('/api/online-users')
      .then(setOnlineUsers)
      .catch(() => {});
    return () => {
      socket.off('user_status');
    };
  }, []);

  const loadChats = async () => {
    try {
      const [chatsData, usersData, pChats] = await Promise.all([
        api.get('/api/chat').catch(() => []),
        api.get('/api/chat/users').catch(() => []),
        api.get('/api/partner-chat').catch(() => []),
      ]);
      setChats(Array.isArray(chatsData) ? chatsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPartnerChats(Array.isArray(pChats) ? pChats : []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
    setLoading(false);
  };

  const getPartner = (chat) => {
    return chat.participants?.find((p) => p._id !== user?._id);
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

  const q = search.toLowerCase();
  const filteredChats = chats.filter((c) => getPartner(c)?.name?.toLowerCase().includes(q));
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) &&
      !chats.some((c) => c.participants?.some((p) => p._id === u._id))
  );

  const nothingAtAll =
    !loading &&
    filteredChats.length === 0 &&
    filteredUsers.length === 0 &&
    partnerChats.length === 0;

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <h1>Messages</h1>
      </div>

      <div className="chatlist-search">
        <Search size={16} className="chatlist-search-icon" />
        <input
          placeholder="Search conversations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      {loading ? (
        <Skeleton type="chat" count={5} />
      ) : nothingAtAll ? (
        <div className="empty-block">
          <p className="empty-lede">No conversations yet.</p>
          <p className="empty-hint">
            Messages you send from someone’s profile, or their replies, will show up here.
          </p>
        </div>
      ) : (
        <>
          {partnerChats.length > 0 && (
            <section className="chatlist-section">
              <h2 className="chatlist-label">
                <Heart size={12} fill="currentColor" stroke="none" /> Partner chats
              </h2>
              {partnerChats.map((pc) => {
                const partner = getPartnerFromPC(pc);
                return (
                  <div
                    key={pc._id}
                    className="chat-row chat-row--partner"
                    onClick={() => navigate(`/partner-chat/${partner?._id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar
                      src={partner?.avatarUrl}
                      name={partner?.name}
                      size={46}
                      online={onlineUsers.includes(partner?._id)}
                    />
                    <div className="chat-row-info">
                      <span className="chat-row-name">{partner?.name}</span>
                      <span className="chat-row-preview">
                        {pc.lastMessage?.content || 'Say hello'}
                      </span>
                    </div>
                    <span className="chat-row-tag">
                      <Lock size={10} /> Private
                    </span>
                  </div>
                );
              })}
            </section>
          )}

          {filteredChats.length > 0 && (
            <section className="chatlist-section">
              {filteredChats.map((chat) => {
                const partner = getPartner(chat);
                return (
                  <div
                    key={chat._id}
                    className="chat-row"
                    onClick={() => navigate(`/chat/${partner?._id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar
                      src={partner?.avatarUrl}
                      name={partner?.name}
                      size={46}
                      online={onlineUsers.includes(partner?._id)}
                    />
                    <div className="chat-row-info">
                      <span className="chat-row-name">{partner?.name}</span>
                      <span className="chat-row-preview">
                        {chat.lastMessage || 'No messages yet'}
                      </span>
                    </div>
                    <span className="chat-row-time">{timeAgo(chat.lastMessageTime)}</span>
                  </div>
                );
              })}
            </section>
          )}

          {filteredUsers.length > 0 && (
            <section className="chatlist-section">
              <h2 className="chatlist-label">Start a conversation</h2>
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="chat-row chat-row--muted"
                  onClick={() => navigate(`/chat/${u._id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <Avatar
                    src={u.avatarUrl}
                    name={u.name}
                    size={46}
                    online={onlineUsers.includes(u._id)}
                  />
                  <div className="chat-row-info">
                    <span className="chat-row-name">{u.name}</span>
                    <span className="chat-row-preview">{u.email}</span>
                  </div>
                  <MessageSquareDashed size={16} className="chat-row-hint-icon" />
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
