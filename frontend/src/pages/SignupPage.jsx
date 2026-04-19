import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, X, Briefcase, BookOpen, Sparkles } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { BRAND } from '../config/brand';

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', skills: [] });
  const [showPass, setShowPass] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.message || 'Google Auth failed');
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google Sign In was unsuccessful. Try again.');
  };

  // Form handling functions
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 10) {
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
        // Just mock placeholder logic for demo
        avatarUrl = `https://i.pravatar.cc/150?u=${form.email}`;
      }
      await signup({ ...form, avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${form.email}` });
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="modern-auth-split">
      {/* LEFT SIDE: Brand & Value Prop */}
      <div className="auth-presentation auth-presentation-signup">
        <div className="presentation-content">
          <motion.div 
            className="brand-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img src={BRAND.logo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Expand your <span className="text-highlight">Mind</span>.
            <br />Grow your <span className="text-highlight">Network</span>.
          </motion.h1>

          <motion.p 
            className="presentation-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Join thousands of ambitious students. Share your knowledge, discover new skills, and connect with brilliant minds today.
          </motion.p>

          <motion.div 
            className="feature-list"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="feature-item">
              <div className="feature-icon"><BookOpen size={20} /></div>
              <span>Access exclusive study materials</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Briefcase size={20} /></div>
              <span>Build an impressive portfolio</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Sparkles size={20} /></div>
              <span>Discover curated learning reels</span>
            </div>
          </motion.div>
        </div>
        {/* Dynamic mesh background elements */}
        <div className="mesh-gradient mesh-1"></div>
        <div className="mesh-gradient mesh-2"></div>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="auth-form-wrapper">
        <motion.div 
          className="auth-form-container"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join {BRAND.name} to unlock your potential</p>
          </div>

          <form onSubmit={handleSubmit} className="premium-form">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="premium-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="avatar-upload-row">
              <label htmlFor="avatar-input" className="premium-avatar-picker">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  <div className="premium-avatar-placeholder">📷</div>
                )}
              </label>
              <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatar} hidden />
              <div className="avatar-text">
                <strong>Profile Picture</strong>
                <span>Show everyone who you are</span>
              </div>
            </div>

            <div className="input-group-modern">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="E.g. Elon Musk"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group-modern">
              <label>Work/School Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group-modern">
              <label>Secure Password</label>
              <div className="rel-input">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button type="button" className="modern-pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group-modern">
              <label>Short Bio</label>
              <textarea
                placeholder="I'm a sophomore studying computer science..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={2}
                maxLength={160}
              />
            </div>

            <div className="input-group-modern">
              <label>Your Top Skills</label>
              <div className="skill-input-flex">
                <input
                  type="text"
                  placeholder="E.g. Python, Math, Design"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                />
                <button type="button" className="btn-add-skill" onClick={addSkill}>Add</button>
              </div>
              
              <div className="premium-skill-tags">
                <AnimatePresence>
                  {form.skills.map(s => (
                    <motion.span 
                      key={s} 
                      className="premium-skill-tag"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      {s} <button type="button" onClick={() => removeSkill(s)}><X size={12} /></button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <button type="submit" className="btn-premium-submit" disabled={loading}>
              {loading ? <span className="loader-spinner" style={{ width: 22, height: 22, borderWidth: 2 }} /> : <><UserPlus size={20} /> Register Now</>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
             <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}></div>
             <span style={{ padding: '0 16px', opacity: 0.5 }}>OR</span>
             <div style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="pill"
              theme="filled_black"
              size="large"
              text="signup_with"
              width="100%"
            />
          </div>

          <p className="auth-footer-link">
            Already a member? <Link to="/login">Sign In Instead</Link>
          </p>
        </motion.div>
      </div>

      <style>{`
        /* SPLIT LAYOUT */
        .modern-auth-split {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
          overflow: hidden;
        }
        
        /* LEFT SIDE - BRANDING */
        .auth-presentation {
          display: none;
          flex: 1;
          position: relative;
          background: #0a0a0c;
          align-items: center;
          justify-content: center;
          padding: 60px;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        
        .auth-presentation-signup {
          display: none;
        }

        @media (min-width: 900px) {
          .auth-presentation {
            display: flex;
          }
        }
        
        .mesh-gradient {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
          z-index: 0;
        }
        .mesh-1 {
          width: 600px;
          height: 600px;
          background: #7c3aed;
          top: -200px;
          left: -200px;
          animation: floatSlow 15s ease-in-out infinite alternate;
        }
        .mesh-2 {
          width: 500px;
          height: 500px;
          background: #06b6d4;
          bottom: -200px;
          right: -100px;
          animation: floatSlow 12s ease-in-out infinite alternate-reverse;
        }
        
        @keyframes floatSlow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 30px) scale(1.1); }
        }

        .presentation-content {
          position: relative;
          z-index: 10;
          max-width: 500px;
        }
        
        .brand-logo {
          width: 64px;
          height: 64px;
          background: white;
          color: black;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 32px;
          box-shadow: 0 12px 32px rgba(255,255,255,0.1);
        }
        
        .presentation-content h1 {
          font-size: 52px;
          line-height: 1.1;
          font-weight: 800;
          color: white;
          margin-bottom: 24px;
        }
        .text-highlight {
          color: transparent;
          background: linear-gradient(135deg, #a78bfa, #22d3ee);
          -webkit-background-clip: text;
        }
        
        .presentation-sub {
          font-size: 18px;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(255,255,255,0.03);
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          color: white;
          font-weight: 500;
        }
        
        .feature-icon {
          background: rgba(255,255,255,0.1);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #22d3ee;
        }

        /* RIGHT SIDE - FORM CONTAINER */
        .auth-form-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: var(--bg-primary);
          position: relative;
        }
        
        .auth-form-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .auth-header {
          margin-bottom: 32px;
        }
        
        .auth-header h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .auth-subtitle {
          color: var(--text-muted);
          font-size: 15px;
        }

        /* PREMIUM FORM ELEMENTS */
        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .input-group-modern {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group-modern label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .input-group-modern input, 
        .input-group-modern textarea {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          color: white;
          transition: all 0.2s;
        }
        
        .input-group-modern input:focus, 
        .input-group-modern textarea:focus {
          background: rgba(255,255,255,0.05);
          border-color: var(--accent-light);
          box-shadow: 0 0 0 4px var(--accent-glow);
        }
        
        .rel-input {
          position: relative;
        }
        .modern-pass-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .modern-pass-toggle:hover { color: white; }

        .premium-error {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 14px;
          font-weight: 500;
        }

        /* AVATAR ROW */
        .avatar-upload-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 16px;
          border: 1px dashed rgba(255,255,255,0.1);
        }
        .premium-avatar-picker {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-elevated);
          transition: transform 0.2s;
        }
        .premium-avatar-picker:hover { transform: scale(1.05); }
        .premium-avatar-picker img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-text { display: flex; flex-direction: column; }
        .avatar-text strong { font-size: 14px; font-weight: 600; }
        .avatar-text span { font-size: 12px; color: var(--text-muted); }

        /* SKILLS */
        .skill-input-flex {
          display: flex;
          gap: 8px;
        }
        .btn-add-skill {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0 20px;
          border-radius: 14px;
          font-weight: 600;
          color: white;
          transition: background 0.2s;
        }
        .btn-add-skill:hover { background: rgba(255,255,255,0.1); }
        
        .premium-skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }
        .premium-skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-bg);
          border: 1px solid var(--accent-glow);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-light);
        }
        
        .btn-premium-submit {
          background: white;
          color: black;
          padding: 16px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 12px;
          transition: transform 0.1s, opacity 0.2s;
        }
        .btn-premium-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.15); }
        .btn-premium-submit:active { transform: scale(0.98); }

        .auth-footer-link {
          margin-top: 32px;
          text-align: center;
          color: var(--text-muted);
          font-size: 15px;
        }
        .auth-footer-link a {
          color: white;
          font-weight: 600;
          margin-left: 4px;
          text-decoration: underline;
          text-decoration-color: rgba(255,255,255,0.2);
          text-underline-offset: 4px;
        }
        .auth-footer-link a:hover { text-decoration-color: white; }
      `}</style>
    </div>
  );
}
