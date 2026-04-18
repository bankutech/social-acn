import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X, Camera } from 'lucide-react';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
      setSkillInput('');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      let avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await api.upload('/api/auth/avatar', fd);
        avatarUrl = res.url;
      }
      const payload = { ...form, ...(avatarUrl ? { avatarUrl } : {}) };
      const res = await api.put('/api/auth/profile', payload);
      // Keep existing token if backend doesn't send it
      updateUser({ ...res, token: res?.token || user?.token });
      navigate('/profile');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to save profile');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-back">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Edit Profile</h2>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ padding: '8px 20px' }}>
          {loading ? '...' : <><Save size={16} /> Save</>}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px 0' }}
      >
        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <Avatar src={avatarPreview || user?.avatarUrl} name={user?.name} size={96} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 32, height: 32,
              borderRadius: '50%', background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-primary)'
            }}>
              <Camera size={14} color="white" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </label>
        </div>

        <div className="auth-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <div className="input-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} style={{ resize: 'none' }} />
          </div>
          <div className="input-group">
            <label>Skills</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Add skill..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <button className="btn-secondary" onClick={addSkill} style={{ flexShrink: 0 }}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div className="skill-tags" style={{ marginTop: 8 }}>
                {form.skills.map(s => (
                  <span key={s} className="skill-tag" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    borderRadius: 999, background: 'var(--accent-bg)', color: 'var(--accent-light)', fontSize: 12
                  }}>
                    {s}
                    <button onClick={() => setForm({ ...form, skills: form.skills.filter(sk => sk !== s) })} style={{ color: 'var(--accent-light)', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
