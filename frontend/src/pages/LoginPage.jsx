import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { BRAND } from '../config/brand';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('Successfully logged in with Google');
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed');
    }
    setLoading(false);
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in didn’t go through. Try again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await login('demo@acn.plus', 'demo123');
      toast.success('Logged in as Demo User');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="lp-split">
      {/* Left panel — only on desktop. Quiet, editorial. */}
      <aside className="lp-aside">
        <span className="lp-aside-mark">{BRAND.name}</span>
        <div className="lp-aside-body">
          <h1 className="lp-aside-title">
            The feed that actually
            <br />
            helps you study.
          </h1>
          <p className="lp-aside-copy">
            Sphere is a small study network. Post a question, share your notes, and work through the
            hard parts of a course with people in the same boat.
          </p>
          <figure className="lp-quote">
            <blockquote>
              “I stopped screenshotting random PDFs. If I find something useful for the exam, it
              goes in a folder here and I can actually find it again.”
            </blockquote>
            <figcaption>Second-year engineering student</figcaption>
          </figure>
        </div>
      </aside>

      {/* Form */}
      <main className="lp-main">
        <form onSubmit={handleSubmit} className="lp-form">
          <div className="lp-form-head">
            <span className="lp-mark-mobile">{BRAND.name}</span>
            <h2>Log in</h2>
            <p>Pick up where you left off.</p>
          </div>

          <label className="lp-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="lp-field">
            <span>Password</span>
            <span className="lp-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lp-pass-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          <button type="submit" className="lp-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="lp-divider">
            <span>or</span>
          </div>

          <div className="lp-google">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="rectangular"
              theme="filled_black"
              size="large"
              text="continue_with"
              width="100%"
            />
          </div>

          <button type="button" className="lp-demo" onClick={handleDemo} disabled={loading}>
            Explore the demo account
          </button>

          <p className="lp-footer">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </main>

      <style>{`
        .lp-split {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }
        .lp-aside {
          display: none;
          flex: 1.1;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          border-right: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .lp-aside-mark {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .lp-aside-body { max-width: 460px; }
        .lp-aside-title {
          font-family: var(--font-display);
          font-size: clamp(30px, 3.4vw, 42px);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin-bottom: 18px;
        }
        .lp-aside-copy {
          font-size: 15px;
          line-height: 1.65;
          color: var(--text-secondary);
          margin-bottom: 44px;
          max-width: 420px;
        }
        .lp-quote { margin: 0; border-left: 2px solid var(--accent); padding-left: 16px; }
        .lp-quote blockquote {
          margin: 0 0 8px;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--text-primary);
        }
        .lp-quote figcaption { font-size: 12.5px; color: var(--text-muted); }
        .lp-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .lp-form { width: 100%; max-width: 360px; display: flex; flex-direction: column; }
        .lp-mark-mobile {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 600;
          margin-bottom: 36px;
        }
        .lp-form-head { margin-bottom: 26px; }
        .lp-form-head h2 {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .lp-form-head p { color: var(--text-muted); font-size: 14px; }
        .lp-error {
          background: rgba(200, 86, 74, 0.1);
          border: 1px solid rgba(200, 86, 74, 0.35);
          color: #e5978e;
          padding: 11px 13px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          margin-bottom: 16px;
        }
        .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .lp-field > span:first-child {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .lp-pass-wrap { position: relative; display: block; }
        .lp-pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .lp-pass-toggle:hover { color: var(--text-primary); }
        .lp-submit {
          background: var(--accent);
          color: #1d1915;
          font-weight: 600;
          font-size: 14.5px;
          padding: 12px;
          border-radius: var(--radius-md);
          margin-top: 4px;
          transition: background 0.12s;
        }
        .lp-submit:hover:not(:disabled) { background: var(--accent-light); }
        .lp-submit:disabled { opacity: 0.5; cursor: default; }
        .lp-divider {
          display: flex;
          align-items: center;
          margin: 18px 0;
          color: var(--text-muted);
          font-size: 12px;
        }
        .lp-divider::before, .lp-divider::after {
          content: '';
          flex: 1;
          border-top: 1px solid var(--border-color);
        }
        .lp-divider span { padding: 0 12px; }
        .lp-google { display: flex; justify-content: center; margin-bottom: 14px; }
        .lp-demo {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 11px;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 14px;
          transition: border-color 0.12s, color 0.12s;
        }
        .lp-demo:hover { border-color: var(--border-light); color: var(--text-primary); }
        .lp-footer {
          margin-top: 26px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
        .lp-footer a {
          color: var(--text-primary);
          font-weight: 500;
          text-decoration: underline;
          text-decoration-color: var(--border-light);
          text-underline-offset: 3px;
        }
        .lp-footer a:hover { text-decoration-color: var(--accent); }
        @media (min-width: 920px) {
          .lp-aside { display: flex; }
          .lp-mark-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}
