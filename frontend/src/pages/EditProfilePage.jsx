import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X, Camera, Sparkles, User, FileText, Zap } from 'lucide-react';

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
    if (s && !form.skills.includes(s) && form.skills.length < 12) {
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
      let avatarPublicId;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await api.upload('/api/auth/avatar', fd);
        avatarUrl = res.url;
        avatarPublicId = res.filename;
      }
      
      const payload = { 
        ...form, 
        ...(avatarUrl ? { avatarUrl, avatarPublicId } : {}) 
      };
      const updatedUserRes = await api.put('/api/auth/profile', payload);
      
      // CRITICAL FIX: Ensure the state is deep merged and token is preserved
      const currentUserData = JSON.parse(localStorage.getItem('acn_user') || '{}');
      const synchronizedData = {
        ...currentUserData,
        ...updatedUserRes,
        token: currentUserData.token || user?.token // Never lose the token
      };
      
      updateUser(synchronizedData);
      
      // Small delay for psychological feedback
      setTimeout(() => navigate('/profile'), 300);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to save profile changes');
    }
    setLoading(false);
  };

  return (
    <div className="premium-edit-layout">
      {/* Top Header */}
      <header className="premium-edit-header">
        <button className="back-circle" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h2>Edit Portfolio</h2>
        <button className="btn-save-premium" onClick={handleSave} disabled={loading}>
          {loading ? "..." : "Save"}
        </button>
      </header>

      <main className="edit-form-scroll">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-form-container"
        >
          {error && <div className="premium-error">{error}</div>}

          {/* Avatar Section */}
          <div className="edit-avatar-section">
            <div className="avatar-interaction">
              <Avatar src={avatarPreview || user?.avatarUrl} name={user?.name} size={100} />
              <label htmlFor="avatar-upload" className="camera-overlay">
                <Camera size={18} />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </div>
            <div className="avatar-meta">
              <h3>Profile Identity</h3>
              <p>Change how you appear across ACN+</p>
            </div>
          </div>

          <div className="form-sections">
            {/* Name Section */}
            <div className="edit-field-group">
              <div className="field-label">
                <User size={14} /> <span>Full Name</span>
              </div>
              <input 
                className="premium-edit-input"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Ex: John Doe"
              />
            </div>

            {/* Bio Section */}
            <div className="edit-field-group">
              <div className="field-label">
                <FileText size={14} /> <span>Professional Bio</span>
              </div>
              <textarea 
                className="premium-edit-area"
                value={form.bio} 
                onChange={e => setForm({ ...form, bio: e.target.value })} 
                placeholder="Tell us about your academic journey..."
                rows={4}
              />
              <div className="character-hint">{form.bio.length}/160</div>
            </div>

            {/* Skills Section */}
            <div className="edit-field-group">
              <div className="field-label">
                <Zap size={14} /> <span>Skillset & Expertise</span>
              </div>
              <div className="skill-creation-row">
                <input 
                  className="premium-edit-input"
                  placeholder="Add a skill (React, Python, etc.)"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                />
                <button className="btn-add-inline" onClick={addSkill}>Add</button>
              </div>

              <div className="skill-edit-tags">
                {form.skills.map(s => (
                  <span key={s} className="edit-skill-pill">
                    {s}
                    <button className="skill-del" onClick={() => setForm({ ...form, skills: form.skills.filter(sk => sk !== s) })}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <p className="skills-instruction">Add up to 12 skills to your portfolio</p>
            </div>
          </div>

          <div className="edit-footer-hint">
            <Sparkles size={14} />
            <span>Profile changes are immediately synchronized across your devices.</span>
          </div>
        </motion.div>
      </main>

      <style>{`
        .premium-edit-layout {
          background: #000000;
          min-height: 100vh;
          color: white;
          padding-bottom: 40px;
        }

        .premium-edit-header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(20px);
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .premium-edit-header h2 { font-size: 17px; font-weight: 700; }

        .back-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
          transition: background 0.2s;
        }
        .back-circle:hover { background: rgba(255,255,255,0.05); color: white; }

        .btn-save-premium {
          padding: 8px 20px;
          background: white;
          color: black;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
        }

        .edit-form-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px 16px;
        }

        .edit-avatar-section {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255,255,255,0.02);
          padding: 20px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.04);
          margin-bottom: 32px;
        }

        .avatar-interaction {
          position: relative;
        }
        .camera-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          background: #7c3aed;
          border: 3px solid #111;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .avatar-meta h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .avatar-meta p { font-size: 13px; color: rgba(255,255,255,0.5); }

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .edit-field-group {
          margin-bottom: 24px;
        }

        .premium-edit-input, .premium-edit-area {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: white;
          padding: 14px;
          font-size: 15px;
          transition: all 0.2s;
        }
        .premium-edit-input:focus, .premium-edit-area:focus {
          background: rgba(255,255,255,0.05);
          border-color: #7c3aed;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
        }

        .character-hint {
          text-align: right;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
        }

        .skill-creation-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .btn-add-inline {
          padding: 0 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
        }

        .skill-edit-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .edit-skill-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(124, 58, 237, 0.1);
          color: #a78bfa;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .skill-del { color: #fca5a5; display: flex; align-items: center; }

        .skills-instruction {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 12px;
        }

        .premium-error {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          margin-bottom: 24px;
          font-size: 14px;
        }

        .edit-footer-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 40px;
          color: rgba(255,255,255,0.25);
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
