import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles, Zap, Shield } from 'lucide-react';

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
    <div className="modern-auth-split">
      {/* LEFT SIDE: Brand & Value Prop */}
      <div className="auth-presentation auth-presentation-login">
        <div className="presentation-content">
          <motion.div 
            className="brand-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            A+
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back to<br /><span className="text-highlight">The Future</span>.
          </motion.h1>

          <motion.p 
            className="presentation-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Log in to pick up exactly where you left off. Your tailored feed, study materials, and direct messages are waiting for you.
          </motion.p>

          <motion.div 
            className="feature-list"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="feature-item">
              <div className="feature-icon"><Zap size={20} /></div>
              <span>Lightning fast learning</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Shield size={20} /></div>
              <span>Secure encrypted platform</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Sparkles size={20} /></div>
              <span>AI powered recommendations</span>
            </div>
          </motion.div>
        </div>
        
        {/* Dynamic mesh background elements */}
        <div className="mesh-gradient mesh-3"></div>
        <div className="mesh-gradient mesh-4"></div>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="auth-form-wrapper">
        <motion.div 
          className="auth-form-container"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Enter your credentials to continue</p>
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

            <div className="input-group-modern">
              <label>Work/School Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group-modern">
              <label>Secure Password</label>
              <div className="rel-input">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="modern-pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-premium-submit" disabled={loading}>
              {loading ? <span className="loader-spinner" style={{ width: 22, height: 22, borderWidth: 2 }} /> : <><LogIn size={20} /> Sign In</>}
            </button>
          </form>

          <div className="divider-row">
            <span>OR</span>
          </div>

          <button className="btn-demo-mode" onClick={handleDemo} disabled={loading}>
            Try Demo Account (Test Mode)
          </button>

          <p className="auth-footer-link">
            Don't have an account? <Link to="/signup">Register Now</Link>
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

        @media (min-width: 900px) {
          .auth-presentation {
            display: flex;
          }
        }
        
        .mesh-gradient {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          z-index: 0;
        }
        .mesh-3 {
          width: 500px;
          height: 500px;
          background: #ec4899;
          top: -100px;
          right: -100px;
          animation: floatSlow 12s ease-in-out infinite alternate;
        }
        .mesh-4 {
          width: 600px;
          height: 600px;
          background: #7c3aed;
          bottom: -200px;
          left: -100px;
          animation: floatSlow 15s ease-in-out infinite alternate-reverse;
        }
        
        @keyframes floatSlow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, -30px) scale(1.1); }
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
          background: linear-gradient(135deg, #ec4899, #a78bfa);
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
          color: #ec4899;
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
          max-width: 400px; /* Slightly slimmer for login */
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
        
        .input-group-modern input {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 16px;
          border-radius: 14px;
          font-size: 15px;
          color: white;
          transition: all 0.2s;
        }
        
        .input-group-modern input:focus {
          background: rgba(255,255,255,0.05);
          border-color: #ec4899;
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.2);
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

        .divider-row {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }
        .divider-row::before, .divider-row::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .divider-row span {
          padding: 0 16px;
          opacity: 0.5;
        }

        .btn-demo-mode {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-demo-mode:hover {
          background: rgba(255,255,255,0.08);
        }

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
