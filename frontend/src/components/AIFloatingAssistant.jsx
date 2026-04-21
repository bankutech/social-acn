import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Brain } from 'lucide-react';
import api from '../lib/api';

export default function AIFloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
      {/* Floating Toggle Button */}
      <motion.button
        className="ai-fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
             position: 'fixed',
             bottom: '90px',
             right: '24px',
             width: '56px',
             height: '56px',
             borderRadius: '50%',
             background: 'linear-gradient(135deg, #22d3ee, #0891b2)',
             color: 'white',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             boxShadow: '0 8px 24px rgba(34, 211, 238, 0.4)',
             zIndex: 999
        }}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="ai-compact-window"
          >
            <div className="ai-window-header">
              <div className="header-title">
                <Brain size={18} />
                <span>Study Companion</span>
              </div>
              <Sparkles size={16} className="pulse-icon" />
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
              {loading && <div className="mini-msg ai dots">...</div>}
            </div>

            <div className="ai-window-input">
              <input 
                placeholder="Ask your buddy..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} disabled={loading}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .ai-compact-window {
          position: fixed;
          bottom: 160px;
          right: 24px;
          width: 320px;
          height: 400px;
          background: rgba(15, 15, 18, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1001;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .ai-window-header {
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          color: #22d3ee;
        }

        .ai-window-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
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
          background: #22d3ee;
          color: black;
          border-bottom-right-radius: 2px;
        }
        .mini-msg.ai {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-bottom-left-radius: 2px;
        }

        .ai-window-input {
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          gap: 8px;
        }
        .ai-window-input input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 12px;
          color: white;
          font-size: 13px;
        }
        .ai-window-input button {
          background: #22d3ee;
          color: black;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-icon {
          animation: pulse 2s infinite;
          color: rgba(34, 211, 238, 0.5);
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
