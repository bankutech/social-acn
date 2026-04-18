import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Users, Mail } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const data = await api.get('/api/auth/all-users');
      setUsersList(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
    setLoading(false);
  };

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={24} />
        <h1>Admin Dashboard</h1>
      </div>
      
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Total registered users: {usersList.length}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <SkeletonLoader type="chat" count={5} />
        ) : usersList.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No Users Found</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {usersList.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar src={u.avatarUrl} name={u.name} size={48} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {u.email}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div>ID: {u._id}</div>
                  <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
