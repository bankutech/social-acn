import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
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
    try {
      let avatarUrl;
      let avatarPublicId;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await api.upload(API_ROUTES.AVATAR_UPLOAD, fd);
        avatarUrl = res.url;
        avatarPublicId = res.filename;
      }

      const payload = {
        ...form,
        ...(avatarUrl ? { avatarUrl, avatarPublicId } : {}),
      };
      const updatedUserRes = await api.put(API_ROUTES.PROFILE, payload);

      updateUser(updatedUserRes);
      toast.success('Profile updated successfully!');

      // Small delay for psychological feedback
      setTimeout(() => navigate('/profile'), 300);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to save profile changes');
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
          {loading ? '...' : 'Save'}
        </button>
      </header>

      <main className="edit-form-scroll">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="edit-form-container"
        >
          {/* Avatar Section */}
          <div className="edit-avatar-section">
            <div className="avatar-interaction">
              <Avatar src={avatarPreview || user?.avatarUrl} name={user?.name} size={100} />
              <label htmlFor="avatar-upload" className="camera-overlay">
                <Camera size={18} />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button className="btn-add-inline" onClick={addSkill}>
                  Add
                </button>
              </div>

              <div className="skill-edit-tags">
                {form.skills.map((s) => (
                  <span key={s} className="edit-skill-pill">
                    {s}
                    <button
                      className="skill-del"
                      onClick={() =>
                        setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) })
                      }
                    >
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
    </div>
  );
}
