import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Lock, Globe, Loader, X } from 'lucide-react';
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
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="New study group"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <h2>New study group</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            maxLength={60}
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about? (optional)"
            rows={3}
          />

          <button type="button" onClick={() => setIsPrivate((p) => !p)} className="privacy-toggle">
            {isPrivate ? <Lock size={17} /> : <Globe size={17} />}
            <span>
              <strong>{isPrivate ? 'Private' : 'Public'}</strong>
              <small>
                {isPrivate ? 'Only invited members can join' : 'Anyone can find and join'}
              </small>
            </span>
          </button>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
            {loading ? <Loader size={17} className="spin" /> : 'Create group'}
          </button>
        </form>
      </div>
    </div>
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
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleJoin = async (e, groupId) => {
    e.stopPropagation();
    try {
      await api.post(`/api/groups/${groupId}/join`);
      loadGroups();
    } catch (err) {
      alert(err.message || 'Could not join group');
    }
  };

  const isMember = (group) => group.members?.some((m) => (m._id || m) === (user?._id || user?.id));

  return (
    <div className="page-container">
      <div className="page-header page-header--row">
        <h1>Groups</h1>
        <button className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} strokeWidth={2.2} /> New
        </button>
      </div>

      {loading ? (
        <div className="loading-row">
          <Loader size={20} className="spin" /> Loading groups…
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-block">
          <p className="empty-lede">No groups yet.</p>
          <p className="empty-hint">
            Create one for your class, your club, or one assignment that deserves its own space.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            Start the first group
          </button>
        </div>
      ) : (
        <ul className="group-list">
          {groups.map((group) => {
            const member = isMember(group);
            return (
              <li
                key={group._id}
                className="group-row"
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                <div className="group-row-main">
                  <span className="group-row-name">
                    {group.name}
                    {group.isPrivate && <Lock size={11} aria-label="Private group" />}
                  </span>
                  {group.description && <p className="group-row-desc">{group.description}</p>}
                  <span className="group-row-meta">
                    {group.members?.length || 0}{' '}
                    {(group.members?.length || 0) === 1 ? 'member' : 'members'}
                  </span>
                </div>
                {!member && (
                  <button className="btn-ghost btn-sm" onClick={(e) => handleJoin(e, group._id)}>
                    Join
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(group) => {
            setShowCreate(false);
            navigate(`/groups/${group._id}`);
          }}
        />
      )}
    </div>
  );
}
