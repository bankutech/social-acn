import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Lock, Globe, Send, Loader, UserCheck, UserPlus } from 'lucide-react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);

  const loadGroup = async () => {
    try {
      const [g, p] = await Promise.all([
        api.get(`/api/groups/${groupId}`),
        api.get(`/api/groups/${groupId}/posts`)
      ]);
      setGroup(g);
      setPosts(p);
    } catch (e) {
      console.error(e);
      navigate('/groups');
    }
    setLoading(false);
  };

  useEffect(() => { loadGroup(); }, [groupId]);

  const isMember = group?.members?.some(m => (m._id || m) === (user?._id || user?.id));
  const isAdmin = group?.admin?._id === (user?._id || user?.id);

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      if (isMember) {
        await api.post(`/api/groups/${groupId}/leave`);
      } else {
        await api.post(`/api/groups/${groupId}/join`);
      }
      await loadGroup();
    } catch (err) { alert(err.message); }
    setJoining(false);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postText.trim() || posting) return;
    setPosting(true);
    try {
      const newPost = await api.post(`/api/groups/${groupId}/posts`, { content: postText.trim() });
      setPosts(prev => [newPost, ...prev]);
      setPostText('');
    } catch (err) { alert(err.message || 'Failed to post'); }
    setPosting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={28} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <button onClick={() => navigate('/groups')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color="white" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group?.name}</h1>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{group?.members?.length || 0} members</div>
        </div>
        {!isAdmin && (
          <motion.button whileTap={{ scale: 0.92 }} onClick={handleJoinLeave} disabled={joining}
            style={{
              padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: isMember ? 'rgba(255,255,255,0.08)' : 'white',
              color: isMember ? 'rgba(255,255,255,0.8)' : '#000',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            {joining ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
              isMember ? <><UserCheck size={14} /> Leave</> : <><UserPlus size={14} /> Join</>}
          </motion.button>
        )}
      </div>

      {/* Group Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1628 100%)',
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={28} color="white" />
          </div>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>{group?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {group?.isPrivate ? <Lock size={13} color="#a78bfa" /> : <Globe size={13} color="#22d3ee" />}
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{group?.isPrivate ? 'Private group' : 'Public group'}</span>
            </div>
          </div>
        </div>
        {group?.description && (
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 12px', fontSize: 14, lineHeight: 1.6 }}>{group.description}</p>
        )}
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          Admin: <span style={{ color: '#a78bfa', fontWeight: 600 }}>{group?.admin?.name}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['posts', 'members'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              flex: 1, padding: '14px', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === t ? 'white' : 'rgba(255,255,255,0.4)',
              fontWeight: activeTab === t ? 700 : 400, fontSize: 14, textTransform: 'capitalize',
              borderBottom: activeTab === t ? '2px solid white' : '2px solid transparent',
              transition: 'all 0.2s'
            }}>{t}</button>
        ))}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {isMember && (
            <form onSubmit={handlePost} style={{
              display: 'flex', gap: 10, padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}>
              <Avatar src={user?.avatarUrl} name={user?.name} size={36} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder={`Post in ${group?.name}...`}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 14 }}
                />
                <button type="submit" disabled={!postText.trim() || posting}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: postText.trim() ? 1 : 0.3 }}>
                  {posting ? <Loader size={16} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="#a78bfa" />}
                </button>
              </div>
            </form>
          )}
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: 'rgba(255,255,255,0.4)' }}>
              <p style={{ margin: 0 }}>No posts yet. {isMember ? 'Be the first to post!' : 'Join to start posting.'}</p>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div key={post._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <PostCard post={post} onUpdate={loadGroup} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ padding: '8px 0' }}>
          {group?.members?.map((member, i) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/profile/${member._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
              }}
            >
              <Avatar src={member.avatarUrl} name={member.name} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                {member._id === group?.admin?._id && (
                  <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>Admin</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
