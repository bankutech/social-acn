import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await login('demo@acn.plus', 'demo123');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">A+</div>
          <h1>ACN+</h1>
          <p>Social Learning Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label>Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-password">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="loader-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <button className="auth-demo-btn" onClick={handleDemo} disabled={loading}>
          Try Demo Account
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
        }
        .auth-bg-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
        }
        .orb-1 {
          width: 300px;
          height: 300px;
          background: #7c3aed;
          top: -100px;
          right: -50px;
          animation: float 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 250px;
          height: 250px;
          background: #ec4899;
          bottom: -80px;
          left: -60px;
          animation: float 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 200px;
          height: 200px;
          background: #06b6d4;
          top: 50%;
          left: 50%;
          animation: float 12s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        .auth-container {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }
        .auth-logo {
          text-align: center;
          margin-bottom: 36px;
        }
        .auth-logo-icon {
          width: 72px;
          height: 72px;
          background: var(--gradient-primary);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin: 0 auto 16px;
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.3);
        }
        .auth-logo h1 {
          font-size: 32px;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-logo p {
          color: var(--text-secondary);
          font-size: 14px;
          margin-top: 4px;
        }
        .auth-form {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .input-password {
          position: relative;
        }
        .input-password input {
          padding-right: 44px;
        }
        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          padding: 4px;
        }
        .auth-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          margin-top: 4px;
        }
        .auth-demo-btn {
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .auth-demo-btn:hover {
          border-color: var(--accent);
          color: var(--accent-light);
        }
        .auth-switch {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: var(--text-muted);
        }
        .auth-switch a {
          color: var(--accent-light);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
