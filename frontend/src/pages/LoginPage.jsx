import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles, Zap, Shield } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { BRAND } from '../config/brand';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
            <img src={BRAND.logo} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
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

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              shape="pill"
              theme="filled_black"
              size="large"
              text="continue_with"
              width="100%"
            />
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
          width: 100%;
          height: 100vh;
          background: var(--bg-primary);
          overflow: hidden;
          font-family: var(--font);
        }
        
        /* LEFT SIDE - BRANDING */
        .auth-presentation {
          display: none;
          flex: 1;
          position: relative;
          background: linear-gradient(135deg, #0C49A2 0%, #1e3a8a 100%);
          align-items: center;
          justify-content: center;
          padding: 4vh 60px;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .auth-presentation {
            display: flex;
          }
        }
        
        .mesh-gradient {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.5;
          z-index: 0;
        }
        .mesh-3 {
          width: 500px;
          height: 500px;
          background: #2563eb;
          top: -100px;
          right: -100px;
          animation: floatSlow 12s ease-in-out infinite alternate;
        }
        .mesh-4 {
          width: 600px;
          height: 600px;
          background: #3b82f6;
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
          max-width: 480px;
        }
        
        .brand-logo {
          width: 72px;
          height: 72px;
          background: white;
          color: var(--accent);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 4vh;
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
        }
        
        .presentation-content h1 {
          font-family: var(--font-display);
          font-size: min(56px, 6vh);
          line-height: 1.1;
          font-weight: 800;
          color: white;
          margin-bottom: 3vh;
        }
        .text-highlight {
          color: #60a5fa;
        }
        
        .presentation-sub {
          font-size: 18px;
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin-bottom: 4vh;
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
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          font-weight: 500;
        }
        
        .feature-icon {
          background: white;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--accent);
        }

        /* RIGHT SIDE - FORM CONTAINER */
        .auth-form-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4vh 40px;
          background: var(--bg-primary);
          position: relative;
          height: 100vh;
          overflow: hidden;
        }
        
        .auth-form-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          z-index: 10;
          max-height: 95vh;
        }

        .auth-header {
          margin-bottom: 4vh;
          text-align: center;
        }
        
        .auth-header h2 {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        
        .auth-subtitle {
          color: var(--text-muted);
          font-size: 16px;
        }

        /* PREMIUM FORM ELEMENTS */
        .premium-form {
          display: flex;
          flex-direction: column;
          gap: 2.5vh;
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
          background: var(--bg-secondary);
          border: 2px solid transparent;
          padding: 2vh 16px;
          border-radius: 16px;
          font-size: 15px;
          color: var(--text-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .input-group-modern input:focus {
          background: var(--bg-primary);
          border-color: var(--accent);
          box-shadow: 0 4px 12px var(--accent-glow);
          outline: none;
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
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .modern-pass-toggle:hover { color: var(--accent); }

        .premium-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 14px;
          font-weight: 500;
        }
        
        .btn-premium-submit {
          background: var(--accent);
          color: white;
          padding: 2vh 16px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 1.5vh;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium-submit:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px var(--accent-glow); 
        }
        .btn-premium-submit:active { transform: scale(0.98); }

        .divider-row {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 3vh 0;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }
        .divider-row::before, .divider-row::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }
        .divider-row span {
          padding: 0 16px;
          opacity: 0.5;
        }

        .btn-demo-mode {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 1.5vh;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-demo-mode:hover {
          background: var(--border-color);
        }

        .auth-footer-link {
          margin-top: 3vh;
          text-align: center;
          color: var(--text-muted);
          font-size: 15px;
        }
        .auth-footer-link a {
          color: var(--accent);
          font-weight: 600;
          margin-left: 4px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .auth-footer-link a:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
