import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Brain } from 'lucide-react';
import api from '../lib/api';

export default function AIFloatingAssistant() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Close when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Hide on create, chat, reels, and AI pages where floating bubbles obstruct UI
  const hideRoutes = ['/create', '/create-post', '/ai', '/reels', '/login', '/signup'];
  if (
    hideRoutes.includes(location.pathname) || 
    location.pathname.startsWith('/chat') || 
    location.pathname.startsWith('/partner-chat')
  ) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/ask', { question: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Oops! I hit a snag. Try again?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Mobile Only) */}
      <motion.button
        className="ai-fab"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Study Assistant"
      >
        {isOpen ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>

      {/* Compact Chat Window (Mobile Only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="ai-compact-window"
          >
            <div className="ai-window-header">
              <div className="header-title">
                <Brain size={18} />
                <span>Study Companion</span>
              </div>
              <div className="header-actions">
                <button 
                  className="close-ai-btn" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="ai-window-messages">
              {messages.length === 0 && (
                <div className="ai-empty-state">
                  <p>How can I help you with your studies today?</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`mini-msg ${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && <div className="mini-msg ai dots">Thinking...</div>}
            </div>

            <div className="ai-window-input">
              <input 
                placeholder="Ask your buddy..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} disabled={loading} aria-label="Send message">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* ----------------------------------------------------
           DESKTOP: HIDE FLOATING ASSISTANT COMPLETELY
           (Sidebar already contains the full 'AI Tutor' nav)
           ---------------------------------------------------- */
        @media (min-width: 768px) {
          .ai-fab,
          .ai-compact-window {
            display: none !important;
          }
        }

        /* ----------------------------------------------------
           MOBILE: BOTTOM-RIGHT CORNER ABOVE BOTTOM BAR
           ---------------------------------------------------- */
        .ai-fab {
          position: fixed;
          bottom: 74px;
          right: 16px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0095f6, #2563eb);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 149, 246, 0.4);
          z-index: 999;
          cursor: pointer;
        }

        .ai-compact-window {
          position: fixed;
          bottom: 136px;
          right: 16px;
          width: 320px;
          max-width: calc(100vw - 32px);
          height: 380px;
          background: rgba(15, 15, 18, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1001;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
        }

        .ai-window-header {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 13.5px;
          color: #38bdf8;
        }

        .close-ai-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s ease;
        }
        .close-ai-btn:hover {
          color: #ffffff;
        }

        .ai-window-messages {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ai-empty-state {
          color: #a8a8a8;
          font-size: 13px;
          line-height: 1.5;
          text-align: center;
          padding: 24px 8px;
        }

        .mini-msg {
          max-width: 85%;
          padding: 8px 12px;
          font-size: 13px;
          line-height: 1.4;
          border-radius: 12px;
        }
        .mini-msg.user {
          align-self: flex-end;
          background: #0095f6;
          color: white;
          border-bottom-right-radius: 2px;
        }
        .mini-msg.ai {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-bottom-left-radius: 2px;
        }

        .ai-window-input {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          gap: 8px;
        }
        .ai-window-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px 12px;
          color: white;
          font-size: 13px;
          outline: none;
        }
        .ai-window-input button {
          background: #0095f6;
          color: white;
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
