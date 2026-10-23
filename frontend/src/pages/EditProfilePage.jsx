import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { compressImage } from '../lib/imageCompressor';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Camera, Sparkles, User, FileText, Zap } from 'lucide-react';

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
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');

  // Synchronize with database on mount to guarantee fresh, authoritative profile state
  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const fresh = await api.get('/api/auth/profile');
        if (mounted && fresh) {
          setForm({
            name: fresh.name || '',
            bio: fresh.bio || '',
            skills: Array.isArray(fresh.skills) ? fresh.skills : []
          });
          if (fresh.avatarUrl) {
            setAvatarPreview(fresh.avatarUrl);
          }
          updateUser(fresh);
        }
      } catch (err) {
        if (mounted && user) {
          setForm({
            name: user.name || '',
            bio: user.bio || '',
            skills: Array.isArray(user.skills) ? user.skills : []
          });
        }
      }
    };
    fetchLatest();
    return () => {
      mounted = false;
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, []);

  // Sync from context when user state resolves from storage
  useEffect(() => {
    if (user && !form.name) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        skills: Array.isArray(user.skills) ? user.skills : []
      });
      if (!avatarPreview && user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 12) {
      setForm({ ...form, skills: [...form.skills, s] });
      setSkillInput('');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (.jpg, .png, .webp, .gif)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }

    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) {
      setError('Full name cannot be blank');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let avatarUrl;
      let avatarPublicId;

      if (avatarFile) {
        const compressed = await compressImage(avatarFile, { maxWidth: 600, maxHeight: 600, quality: 0.85 });
        const fd = new FormData();
        fd.append('file', compressed);
        const res = await api.upload('/api/auth/avatar', fd);
        avatarUrl = res.url;
        avatarPublicId = res.filename;
      }
      
      const payload = { 
        name: form.name.trim(),
        bio: form.bio.trim(),
        skills: form.skills,
        ...(avatarUrl ? { avatarUrl, avatarPublicId } : {}) 
      };

      const updatedUserRes = await api.put('/api/auth/profile', payload);
      
      // Merge with stored user and ensure token persistence
      const currentUserData = JSON.parse(localStorage.getItem('acn_user') || '{}');
      const synchronizedData = {
        ...currentUserData,
        ...updatedUserRes,
        token: updatedUserRes.token || currentUserData.token || user?.token
      };
      
      updateUser(synchronizedData);
      setSuccess(true);
      
      const targetUserId = synchronizedData._id || synchronizedData.id || user?._id || user?.id;
      setTimeout(() => {
        navigate(targetUserId ? `/profile/${targetUserId}` : '/profile');
      }, 400);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err?.message || 'Failed to save profile changes. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="premium-edit-layout">
      {/* Top Header */}
      <header className="premium-edit-header">
        <button className="back-circle" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h2>Edit profile</h2>
        <button 
          className="btn-save-premium" 
          onClick={handleSave} 
          disabled={loading}
          type="button"
        >
          {loading ? "Saving..." : success ? "Saved!" : "Save"}
        </button>
      </header>

      <main className="edit-form-scroll">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-form-container"
        >
          {error && <div className="premium-error">{error}</div>}
          {success && (
            <div className="premium-success">
              <Check size={16} /> Changes saved successfully!
            </div>
          )}

          {/* Avatar Section */}
          <div className="edit-avatar-section">
            <div className="avatar-interaction">
              <Avatar src={avatarPreview || user?.avatarUrl} name={form.name || user?.name} size={96} />
              <label htmlFor="avatar-upload" className="camera-overlay" title="Upload new photo">
                <Camera size={18} color="#ffffff" />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/jpeg,image/png,image/webp,image/gif" 
                onChange={handleAvatarChange} 
                hidden 
              />
            </div>
            <div className="avatar-meta">
              <h3>Profile photo</h3>
              <p>Change your avatar photo across ACN+</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="form-sections">
            {/* Name Section */}
            <div className="edit-field-group">
              <label className="field-label" htmlFor="edit-name">
                <User size={14} /> <span>Full Name</span>
              </label>
              <input 
                id="edit-name"
                className="premium-edit-input"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="Your full name"
                required
              />
            </div>

            {/* Bio Section */}
            <div className="edit-field-group">
              <label className="field-label" htmlFor="edit-bio">
                <FileText size={14} /> <span>Bio</span>
              </label>
              <textarea 
                id="edit-bio"
                className="premium-edit-area"
                value={form.bio} 
                onChange={e => setForm({ ...form, bio: e.target.value })} 
                placeholder="Tell others about your interests, courses, or projects..."
                rows={4}
                maxLength={200}
              />
              <div className="character-hint">{form.bio.length}/200</div>
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
                <button type="button" className="btn-add-inline" onClick={addSkill}>Add</button>
              </div>

              <div className="skill-edit-tags">
                {form.skills.map(s => (
                  <span key={s} className="edit-skill-pill">
                    {s}
                    <button 
                      type="button"
                      className="skill-del" 
                      onClick={() => setForm({ ...form, skills: form.skills.filter(sk => sk !== s) })}
                      aria-label={`Remove skill ${s}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <p className="skills-instruction">Add up to 12 skills to your profile</p>
            </div>

            {/* Prominent Save Button at Bottom */}
            <button 
              type="submit" 
              className="btn-save-bottom-primary" 
              disabled={loading}
            >
              {loading ? "Saving..." : success ? "Saved Successfully!" : "Save Changes"}
            </button>
          </form>

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
          padding-bottom: 60px;
        }

        .premium-edit-header {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(20px);
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .premium-edit-header h2 { font-size: 16px; font-weight: 700; color: #ffffff; }

        .back-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          background: transparent;
          border: none;
        }
        .back-circle:hover { background: rgba(255,255,255,0.08); color: white; }

        .btn-save-premium {
          padding: 8px 18px;
          background: #0095f6;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: background 0.15s ease;
        }
        .btn-save-premium:hover:not(:disabled) {
          background: #1877f2;
        }
        .btn-save-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          background: rgba(255,255,255,0.03);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 28px;
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
          background: #0095f6;
          border: 2px solid #000000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        .avatar-meta h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: #ffffff; }
        .avatar-meta p { font-size: 13px; color: rgba(255,255,255,0.5); }

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .edit-field-group {
          margin-bottom: 22px;
        }

        .premium-edit-input, .premium-edit-area {
          width: 100%;
          background: #121212;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: white;
          padding: 12px 14px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .premium-edit-input:focus, .premium-edit-area:focus {
          border-color: #0095f6;
          box-shadow: 0 0 0 2px rgba(0, 149, 246, 0.3);
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
          padding: 0 18px;
          background: #262626;
          border: 1px solid rgba(255,255,255,0.12);
          color: #ffffff;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-add-inline:hover {
          background: #363636;
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
          background: rgba(0, 149, 246, 0.12);
          color: #38bdf8;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(0, 149, 246, 0.25);
        }
        .skill-del { 
          color: #fca5a5; 
          display: flex; 
          align-items: center; 
          background: transparent; 
          border: none; 
          cursor: pointer; 
        }

        .skills-instruction {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          margin-top: 10px;
        }

        .btn-save-bottom-primary {
          width: 100%;
          padding: 13px;
          margin-top: 16px;
          background: #0095f6;
          color: #ffffff;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-save-bottom-primary:hover:not(:disabled) {
          background: #1877f2;
        }
        .btn-save-bottom-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .premium-error {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .premium-success {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(34, 197, 94, 0.3);
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .edit-footer-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
