import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Lock, Globe, Loader, X } from 'lucide-react';
import Avatar from '../components/Avatar';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Group name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const group = await api.post('/api/groups', { name: name.trim(), description, isPrivate });
      onCreated(group);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
    setLoading(false);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100 }} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0a0a0c', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          zIndex: 1101, padding: '24px 20px 40px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700 }}>New Study Group</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
            <X size={18} color="white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Group name *"
            maxLength={60}
            style={inputStyle}
          />
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What's this group about? (optional)"
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />

          <button type="button" onClick={() => setIsPrivate(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, cursor: 'pointer', color: 'white', textAlign: 'left'
            }}>
            {isPrivate ? <Lock size={18} color="#a78bfa" /> : <Globe size={18} color="#22d3ee" />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{isPrivate ? 'Private' : 'Public'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {isPrivate ? 'Only invited members can join' : 'Anyone can discover and join'}
              </div>
            </div>
          </button>

          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: 14 }}>{error}</p>}

          <button type="submit" disabled={loading || !name.trim()} style={submitBtnStyle(loading || !name.trim())}>
            {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Group'}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function GroupsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await api.get('/api/groups');
      setGroups(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadGroups(); }, []);

  const handleJoin = async (e, groupId) => {
    e.stopPropagation();
    try {
      await api.post(`/api/groups/${groupId}/join`);
      loadGroups();
    } catch (err) { alert(err.message || 'Could not join group'); }
  };

  const isMember = (group) =>
    group.members?.some(m => (m._id || m) === (user?._id || user?.id));

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} color="#a78bfa" />
          <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 700 }}>Study Groups</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', color: '#000', border: 'none',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            fontWeight: 700, fontSize: 14
          }}>
          <Plus size={16} /> New
        </motion.button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader size={24} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : groups.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 40px', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Users size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h3 style={{ color: 'white', margin: '0 0 8px' }}>No groups yet</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Create the first study group and invite your peers!</p>
        </motion.div>
      ) : (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {groups.map((group, i) => {
              const member = isMember(group);
              return (
                <motion.div
                  key={group._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 18, padding: '16px',
                    cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Group icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Users size={22} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{group.name}</span>
                        {group.isPrivate && <Lock size={12} color="rgba(255,255,255,0.4)" />}
                      </div>
                      {group.description && (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {group.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                          {group.members?.length || 0} members
                        </span>
                        {!member ? (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleJoin(e, group._id)}
                            style={{
                              background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)',
                              borderRadius: 10, padding: '5px 14px', cursor: 'pointer',
                              color: '#a78bfa', fontWeight: 700, fontSize: 13
                            }}>
                            Join
                          </motion.button>
                        ) : (
                          <span style={{ color: '#22d3ee', fontSize: 12, fontWeight: 600 }}>✓ Member</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal
            onClose={() => setShowCreate(false)}
            onCreated={(group) => {
              setShowCreate(false);
              navigate(`/groups/${group._id}`);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '13px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, color: 'white', fontSize: 15,
  outline: 'none', boxSizing: 'border-box'
};

const submitBtnStyle = (disabled) => ({
  padding: '14px',
  background: disabled ? 'rgba(255,255,255,0.1)' : 'white',
  color: disabled ? 'rgba(255,255,255,0.3)' : '#000',
  border: 'none', borderRadius: 14,
  fontWeight: 700, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'all 0.2s'
});
