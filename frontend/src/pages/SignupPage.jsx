import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { BRAND } from '../config/brand';

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', skills: [] });
  const [showPass, setShowPass] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('Successfully logged in with Google');
    } catch (err) {
      toast.error(err.message || 'Google sign-up failed');
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    toast.error('Google sign-up didn’t go through. Try again.');
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 10) {
      setForm({ ...form, skills: [...form.skills, s] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
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
    setLoading(true);
    try {
      let avatarUrl = '';
      if (avatarFile) {
        avatarUrl = `https://i.pravatar.cc/150?u=${form.email}`;
      }
      await signup({
        ...form,
        avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${form.email}`,
      });
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="sp-split">
      <aside className="sp-aside">
        <span className="sp-aside-mark">{BRAND.name}</span>
        <div className="sp-aside-body">
          <h1 className="sp-aside-title">
            Your notes deserve
            <br />
            better than your
            <br />
            camera roll.
          </h1>
          <p className="sp-aside-copy">
            Make an account, follow your classmates, and keep everything useful in one place —
            questions, explanations, and the resources people actually recommend.
          </p>
          <ul className="sp-points">
            <li>Ask a question, get an answer before the exam</li>
            <li>Save posts into folders like “Exam prep”</li>
            <li>60-second reels for topics that need a walkthrough</li>
          </ul>
        </div>
      </aside>

      <main className="sp-main">
        <form onSubmit={handleSubmit} className="sp-form">
          <div className="sp-form-head">
            <span className="sp-mark-mobile">{BRAND.name}</span>
            <h2>Create your account</h2>
            <p>Takes about a minute.</p>
          </div>

          <div className="sp-avatar-row">
            <label htmlFor="avatar-input" className="sp-avatar-picker">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <span>Add photo</span>
              )}
            </label>
            <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatar} hidden />
            <p className="sp-avatar-hint">Optional — you can do this later.</p>
          </div>

          <label className="sp-field">
            <span>Full name</span>
            <input
              type="text"
              placeholder="Ada Lovelace"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
          </label>

          <label className="sp-field">
            <span>School email</span>
            <input
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </label>

          <label className="sp-field">
            <span>Password</span>
            <span className="sp-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="sp-pass-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          <label className="sp-field">
            <span>
              Short bio <em>optional</em>
            </span>
            <textarea
              placeholder="What do you study?"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={2}
              maxLength={160}
            />
          </label>

          <div className="sp-field">
            <span className="sp-field-label">
              Subjects <em>optional</em>
            </span>
            <div className="sp-skill-row">
              <input
                type="text"
                placeholder="e.g. Calculus, Spanish, Thermodynamics"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button type="button" className="sp-skill-add" onClick={addSkill}>
                Add
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="sp-skill-tags">
                {form.skills.map((s) => (
                  <span key={s} className="sp-skill-tag">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="sp-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <div className="sp-divider">
            <span>or</span>
          </div>

          <div className="sp-google">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="rectangular"
              theme="filled_black"
              size="large"
              text="signup_with"
              width="100%"
            />
          </div>

          <p className="sp-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>

      <style>{`
        .sp-split {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .sp-aside {
          display: none;
          flex: 1.1;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          border-right: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .sp-aside-mark {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .sp-aside-body { max-width: 460px; }
        .sp-aside-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 3.4vw, 42px);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin-bottom: 18px;
        }
        .sp-aside-copy {
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-secondary);
          margin-bottom: 28px;
          max-width: 420px;
        }
        .sp-points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sp-points li {
          font-size: 14px;
          color: var(--text-secondary);
          padding-left: 18px;
          position: relative;
        }
        .sp-points li::before {
          content: '—';
          position: absolute;
          left: 0;
          color: var(--accent);
        }
        .sp-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .sp-form { width: 100%; max-width: 380px; display: flex; flex-direction: column; }
        .sp-mark-mobile {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 600;
          margin-bottom: 32px;
        }
        .sp-form-head { margin-bottom: 22px; }
        .sp-form-head h2 {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .sp-form-head p { color: var(--text-muted); font-size: 14px; }
        .sp-error {
          background: rgba(200, 86, 74, 0.1);
          border: 1px solid rgba(200, 86, 74, 0.35);
          color: #e5978e;
          padding: 11px 13px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          margin-bottom: 16px;
        }
        .sp-avatar-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }
        .sp-avatar-picker {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 1px dashed var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          font-size: 11px;
          color: var(--text-muted);
          text-align: center;
          flex-shrink: 0;
        }
        .sp-avatar-picker:hover { border-color: var(--text-muted); color: var(--text-secondary); }
        .sp-avatar-picker img { width: 100%; height: 100%; object-fit: cover; }
        .sp-avatar-hint { margin: 0; font-size: 12.5px; color: var(--text-muted); }
        .sp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .sp-field > span:first-child, .sp-field-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .sp-field em {
          font-style: normal;
          font-weight: 400;
          color: var(--text-muted);
          font-size: 12px;
        }
        .sp-pass-wrap { position: relative; display: block; }
        .sp-pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .sp-pass-toggle:hover { color: var(--text-primary); }
        .sp-skill-row { display: flex; gap: 8px; }
        .sp-skill-add {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0 16px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          font-weight: 500;
        }
        .sp-skill-add:hover { border-color: var(--border-light); }
        .sp-skill-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .sp-skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 4px 6px 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
        }
        .sp-skill-tag button {
          display: flex;
          color: var(--text-muted);
          padding: 2px;
        }
        .sp-skill-tag button:hover { color: var(--danger); }
        .sp-submit {
          background: var(--accent);
          color: #1d1915;
          font-weight: 600;
          font-size: 14.5px;
          padding: 12px;
          border-radius: var(--radius-md);
          margin-top: 6px;
          transition: background 0.12s;
        }
        .sp-submit:hover:not(:disabled) { background: var(--accent-light); }
        .sp-submit:disabled { opacity: 0.5; cursor: default; }
        .sp-divider {
          display: flex;
          align-items: center;
          margin: 18px 0;
          color: var(--text-muted);
          font-size: 12px;
        }
        .sp-divider::before, .sp-divider::after {
          content: '';
          flex: 1;
          border-top: 1px solid var(--border-color);
        }
        .sp-divider span { padding: 0 12px; }
        .sp-google { display: flex; justify-content: center; }
        .sp-footer {
          margin-top: 26px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
        .sp-footer a {
          color: var(--text-primary);
          font-weight: 500;
          text-decoration: underline;
          text-decoration-color: var(--border-light);
          text-underline-offset: 3px;
        }
        .sp-footer a:hover { text-decoration-color: var(--accent); }
        @media (min-width: 920px) {
          .sp-aside { display: flex; }
          .sp-mark-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
