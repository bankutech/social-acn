import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, X } from 'lucide-react';
import api from '../lib/api';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', skills: [] });
  const [showPass, setShowPass] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) });
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let avatarUrl = '';
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        // Upload after signup won't work - use placeholder first
        avatarUrl = `https://i.pravatar.cc/150?u=${form.email}`;
      }
      await signup({ ...form, avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${form.email}` });
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: 440 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">A+</div>
          <h1>Join ACN+</h1>
          <p>Create your learning profile</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="signup-avatar-pick">
            <label htmlFor="avatar-input" className="avatar-picker">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">📷</div>
              )}
            </label>
            <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatar} hidden />
            <span>Profile Picture</span>
          </div>

          <div className="input-group">
            <label>Full Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-password">
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Bio</label>
            <textarea
              id="signup-bio"
              placeholder="Tell us about yourself..."
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="input-group">
            <label>Skills</label>
            <div className="skill-input-row">
              <input
                type="text"
                placeholder="e.g. React, Python..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <button type="button" className="btn-secondary" onClick={addSkill} style={{ flexShrink: 0 }}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div className="skill-tags">
                {form.skills.map(s => (
                  <span key={s} className="skill-tag">
                    {s} <button type="button" onClick={() => removeSkill(s)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="loader-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </motion.div>

      <style>{`
        .signup-avatar-pick {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .signup-avatar-pick span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .avatar-picker {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px dashed var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .avatar-picker:hover { border-color: var(--accent); }
        .avatar-picker img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          font-size: 28px;
        }
        .skill-input-row {
          display: flex;
          gap: 8px;
        }
        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: var(--accent-bg);
          color: var(--accent-light);
          font-size: 12px;
          font-weight: 500;
        }
        .skill-tag button {
          color: var(--accent-light);
          display: flex;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
