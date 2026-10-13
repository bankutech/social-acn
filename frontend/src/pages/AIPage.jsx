import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, FileText, Brain, Send, Trophy, CheckCircle, XCircle } from 'lucide-react';

export default function AIPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ask');

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-header-back">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h1 style={{ fontSize: 18 }}>
            <Sparkles size={20} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            AI Study Assistant
          </h1>
        </div>
      </div>

      <div className="tabs">
        {[
          { key: 'ask', icon: BookOpen, label: 'Ask' },
          { key: 'summarize', icon: FileText, label: 'Summarize' },
          { key: 'quiz', icon: Brain, label: 'Quiz' },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={15} style={{ marginRight: 4 }} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        <AnimatePresence mode="wait">
          {tab === 'ask' && <AskTab key="ask" />}
          {tab === 'summarize' && <SummarizeTab key="summarize" />}
          {tab === 'quiz' && <QuizTab key="quiz" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AskTab() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    const q = question;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await api.post('/api/ai/ask', { question: q });
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I could not process that. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
      <div className="ai-chat-area">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Sparkles size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Ask me anything about your studies!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className={`ai-msg-bubble ${m.role}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai">
            <div className="ai-msg-bubble ai" style={{ display: 'flex', gap: 4 }}>
              <span className="ai-dot" style={{ animationDelay: '0s' }}>●</span>
              <span className="ai-dot" style={{ animationDelay: '0.2s' }}>●</span>
              <span className="ai-dot" style={{ animationDelay: '0.4s' }}>●</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          placeholder="Ask a question..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleAsk} disabled={loading || !question.trim()} style={{ padding: '10px 16px' }}>
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .ai-chat-area {
          max-height: 50vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-msg { display: flex; }
        .ai-msg.user { justify-content: flex-end; }
        .ai-msg.ai { justify-content: flex-start; }
        .ai-msg-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .ai-msg-bubble.user {
          background: var(--accent);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .ai-msg-bubble.ai {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }
        .ai-dot {
          animation: pulse 1s ease infinite;
          color: var(--text-muted);
          font-size: 10px;
        }
      `}</style>
    </motion.div>
  );
}

function SummarizeTab() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!notes.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/api/ai/summarize', { notes });
      setSummary(res.summary);
    } catch {
      setSummary('Failed to summarize. Please try again.');
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
      <textarea
        placeholder="Paste your study notes here..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={6}
        style={{ resize: 'vertical', marginBottom: 12 }}
      />
      <button className="btn-primary" onClick={handleSummarize} disabled={loading || !notes.trim()} style={{ width: '100%', marginBottom: 16 }}>
        {loading ? 'Summarizing...' : <><FileText size={16} /> Summarize Notes</>}
      </button>
      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--accent-light)' }}>📋 Summary</h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{summary}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function QuizTab() {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/api/ai/mcq', { topic, count: 5 });
      setQuiz(res.mcqs);
    } catch {
      setQuiz('Failed to generate quiz. Please try again.');
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Enter topic (e.g. React hooks)"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={handleGenerate} disabled={loading || !topic.trim()} style={{ padding: '10px 16px' }}>
          {loading ? '...' : <><Brain size={16} /> Generate</>}
        </button>
      </div>
      {quiz && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={16} /> Quiz: {topic}
          </h3>
          <pre style={{
            fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font)', background: 'var(--bg-primary)', padding: 14, borderRadius: 12
          }}>
            {quiz}
          </pre>
        </motion.div>
      )}
    </motion.div>
  );
}
