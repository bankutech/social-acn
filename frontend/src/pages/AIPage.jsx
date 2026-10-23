import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Brain, 
  Send, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  RotateCcw,
  Lightbulb,
  BookOpen,
  HelpCircle
} from 'lucide-react';

const STARTER_PROMPTS = [
  'Explain Big-O time complexity simply with real code examples',
  'What is the difference between React useEffect and useLayoutEffect?',
  'Give me 5 actionable tips to prepare for a systems design interview',
  'How do neural networks learn via backpropagation?'
];

const SAMPLE_NOTES = `Relational vs Non-Relational Databases:
- SQL databases are table-based and structured with fixed schemas (PostgreSQL, MySQL). ACID compliant by default.
- NoSQL databases are document, key-value, graph or wide-column stores (MongoDB, Redis, Cassandra). Scalable horizontally.
- Use SQL when data integrity and complex joins across related entities are critical (e.g. banking, ledger transactions).
- Use NoSQL when schema flexibility, massive write throughput, or hierarchical documents are prioritized (e.g. social feeds, chat logs, IoT sensor data).`;

export default function AIPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ask');

  return (
    <div className="ai-studio-page">
      {/* ── Studio Header ── */}
      <header className="ai-studio-header">
        <div className="ai-header-left">
          <button className="ai-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div className="ai-title-wrap">
            <h1 className="ai-studio-title">
              <Sparkles size={18} className="ai-sparkle-icon" />
              <span>AI Study Studio</span>
            </h1>
            <span className="ai-status-pill">
              <span className="ai-status-dot" /> Gemini Pro Active
            </span>
          </div>
        </div>
      </header>

      {/* ── Tab Switcher ── */}
      <div className="ai-nav-tabs-wrap">
        <div className="ai-nav-tabs">
          {[
            { key: 'ask', label: 'Tutor Chat', icon: MessageSquare },
            { key: 'summarize', label: 'Smart Notes', icon: FileText },
            { key: 'quiz', label: 'Practice Quiz', icon: Brain },
          ].map(t => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                className={`ai-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Workspace Content ── */}
      <main className="ai-studio-content">
        <AnimatePresence mode="wait">
          {tab === 'ask' && <AskTab key="ask" />}
          {tab === 'summarize' && <SummarizeTab key="summarize" />}
          {tab === 'quiz' && <QuizTab key="quiz" />}
        </AnimatePresence>
      </main>

      <style>{`
        .ai-studio-page {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          padding-bottom: 90px;
          display: flex;
          flex-direction: column;
        }

        .ai-studio-header {
          position: sticky;
          top: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 100;
        }

        .ai-header-left {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ai-back-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .ai-back-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .ai-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ai-studio-title {
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.3px;
        }

        .ai-sparkle-icon {
          color: #38bdf8;
        }

        .ai-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #7dd3fc;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .ai-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }

        .ai-nav-tabs-wrap {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(10, 10, 12, 0.6);
        }

        .ai-nav-tabs {
          max-width: 760px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          gap: 10px;
        }

        .ai-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 24px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ai-tab-pill:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .ai-tab-pill.active {
          background: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .ai-studio-content {
          max-width: 760px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 16px;
          flex: 1;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 1: TUTOR CHAT
   ───────────────────────────────────────────────────────────── */
function AskTab() {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleAsk = async (promptText) => {
    const q = (promptText || question).trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/ask', { question: q });
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Unable to reach study assistant. Please check your connection and try again.' }]);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ai-chat-layout">
      {/* Starter Prompts */}
      {messages.length === 0 && (
        <div className="ai-starter-box">
          <div className="ai-starter-hero">
            <div className="ai-hero-icon-bubble">
              <Sparkles size={28} color="#0095f6" />
            </div>
            <h2>What concept would you like to master today?</h2>
            <p>Ask questions across algorithms, system architecture, maths, science, or exam revision.</p>
          </div>

          <div className="ai-chips-grid">
            {STARTER_PROMPTS.map((p, i) => (
              <button key={i} className="ai-chip-btn" onClick={() => handleAsk(p)}>
                <Lightbulb size={14} className="chip-bulb" />
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="ai-messages-stream">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={idx} className={`ai-stream-row ${isUser ? 'user' : 'ai'}`}>
              <div className="ai-bubble-avatar">
                {isUser ? (
                  <Avatar src={user?.avatarUrl} name={user?.name} size={30} />
                ) : (
                  <div className="ai-bot-avatar">
                    <Sparkles size={16} color="#0095f6" />
                  </div>
                )}
              </div>
              <div className={`ai-stream-bubble ${isUser ? 'user' : 'ai'}`}>
                <p className="ai-bubble-content">{m.content}</p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="ai-stream-row ai">
            <div className="ai-bot-avatar">
              <Sparkles size={16} color="#0095f6" />
            </div>
            <div className="ai-stream-bubble ai typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="ai-input-container">
        <input
          className="ai-chat-input"
          placeholder="Ask a question or explain a concept…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
        />
        <button
          className="ai-send-btn"
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          aria-label="Send query"
        >
          <Send size={16} />
        </button>
      </div>

      <style>{`
        .ai-chat-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: calc(100vh - 220px);
        }

        .ai-starter-box {
          padding: 24px 0 12px;
          text-align: center;
        }

        .ai-hero-icon-bubble {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: rgba(0, 149, 246, 0.12);
          border: 1px solid rgba(0, 149, 246, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .ai-starter-hero h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .ai-starter-hero p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          max-width: 440px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }

        .ai-chips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          text-align: left;
        }
        @media (min-width: 640px) {
          .ai-chips-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .ai-chip-btn {
          padding: 12px 16px;
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          transition: all 0.15s ease;
        }
        .ai-chip-btn:hover {
          background: #1e1e24;
          border-color: #0095f6;
          color: #ffffff;
        }
        .chip-bulb {
          color: #f59e0b;
          flex-shrink: 0;
        }

        .ai-messages-stream {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 16px;
        }

        .ai-stream-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .ai-stream-row.user {
          flex-direction: row-reverse;
        }

        .ai-bot-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #18181b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-stream-bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ai-stream-bubble.user {
          background: #0095f6;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .ai-stream-bubble.ai {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
          border-bottom-left-radius: 4px;
        }

        .ai-stream-bubble.typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 14px 18px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          animation: pulse 1s infinite alternate;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        .ai-input-container {
          position: sticky;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #121214;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 6px 8px 6px 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .ai-chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .ai-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: #0095f6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }
        .ai-send-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }
      `}</style>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 2: SMART NOTES SUMMARIZER
   ───────────────────────────────────────────────────────────── */
function SummarizeTab() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!notes.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/api/ai/summarize', { notes });
      setSummary(res.summary);
    } catch {
      setSummary('Failed to summarize notes. Please ensure your notes are under 4000 characters and try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ai-tool-panel">
      <div className="ai-tool-header">
        <div>
          <h3>Notes Synthesizer</h3>
          <p>Paste dense lecture notes, articles, or documentation to extract key takeaways.</p>
        </div>
        <button
          className="ai-sample-btn"
          onClick={() => setNotes(SAMPLE_NOTES)}
        >
          Try sample notes
        </button>
      </div>

      <div className="ai-notes-editor-box">
        <textarea
          className="ai-notes-textarea"
          placeholder="Paste lecture transcripts, study notes, or textbook excerpts here…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={7}
        />
        <div className="ai-editor-footer">
          <span className="ai-char-counter">{notes.length} characters</span>
          <button
            className="ai-action-btn-primary"
            onClick={handleSummarize}
            disabled={loading || !notes.trim()}
          >
            {loading ? 'Synthesizing…' : <><FileText size={15} /> Generate Summary</>}
          </button>
        </div>
      </div>

      {summary && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ai-result-card">
          <div className="ai-result-header">
            <span className="ai-result-badge">
              <Sparkles size={14} color="#38bdf8" /> Executive Summary
            </span>
            <button className="ai-copy-btn" onClick={copyToClipboard}>
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="ai-result-body">
            {summary}
          </div>
        </motion.div>
      )}

      <style>{`
        .ai-tool-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-tool-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .ai-tool-header h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .ai-tool-header p {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.4;
        }

        .ai-sample-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 14px;
          cursor: pointer;
          white-space: nowrap;
        }
        .ai-sample-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.14);
        }

        .ai-notes-editor-box {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
        }

        .ai-notes-textarea {
          width: 100%;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          min-height: 140px;
        }

        .ai-editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 12px;
          margin-top: 8px;
        }

        .ai-char-counter {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .ai-action-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0095f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .ai-action-btn-primary:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .ai-result-card {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 20px;
        }

        .ai-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .ai-result-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 12px;
          cursor: pointer;
        }

        .ai-result-body {
          font-size: 14.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          white-space: pre-wrap;
        }
      `}</style>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 3: INTERACTIVE PRACTICE QUIZ
   ───────────────────────────────────────────────────────────── */
function QuizTab() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Parse MCQs text into structured question objects
  const parseMCQText = (text) => {
    const questions = [];
    const blocks = text.split(/(?=\b\d+[\.\)])/).map(b => b.trim()).filter(Boolean);

    blocks.forEach((block, qIdx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let questionTitle = lines[0]?.replace(/^\d+[\.\)]\s*/, '') || `Question ${qIdx + 1}`;
      const options = [];
      let correctAnswer = 'D';

      lines.slice(1).forEach(line => {
        const optMatch = line.match(/^([A-D])[\.\)]\s*(.+)/i);
        if (optMatch) {
          options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2] });
        }
        const ansMatch = line.match(/Answer:\s*([A-D])/i);
        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase();
        }
      });

      if (options.length >= 2) {
        questions.push({
          id: qIdx + 1,
          question: questionTitle,
          options,
          correctAnswer
        });
      }
    });

    return questions;
  };

  const handleGenerate = async (suggestedTopic) => {
    const t = (suggestedTopic || topic).trim();
    if (!t || loading) return;
    setLoading(true);
    setUserAnswers({});
    setShowResults(false);

    try {
      const res = await api.post('/api/ai/mcq', { topic: t, count: 4 });
      const parsed = parseMCQText(res.mcqs || '');
      setParsedQuestions(parsed);
      if (suggestedTopic) setTopic(suggestedTopic);
    } catch {
      setParsedQuestions([]);
    }
    setLoading(false);
  };

  const handleSelectOption = (questionId, optionKey) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const score = parsedQuestions.reduce((acc, q) => {
    return userAnswers[q.id] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="ai-quiz-panel">
      {/* Quiz Input */}
      <div className="ai-quiz-search-row">
        <input
          className="ai-quiz-input"
          placeholder="Enter a topic to test yourself on (e.g. Distributed Systems, Calculus, Photosynthesis)…"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <button
          className="ai-action-btn-primary"
          onClick={() => handleGenerate()}
          disabled={loading || !topic.trim()}
        >
          {loading ? 'Crafting…' : <><Brain size={16} /> Generate Quiz</>}
        </button>
      </div>

      {/* Suggested Topics Chips */}
      {parsedQuestions.length === 0 && !loading && (
        <div className="ai-quiz-topic-chips">
          <span className="chips-label">Popular topics:</span>
          {['Data Structures', 'React Hooks', 'Computer Networks', 'Operating Systems'].map(t => (
            <button key={t} className="ai-topic-chip" onClick={() => handleGenerate(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Questions List */}
      {parsedQuestions.length > 0 && (
        <div className="ai-quiz-stream">
          <div className="ai-quiz-meta-bar">
            <h4>Quiz: {topic}</h4>
            <span className="ai-quiz-count-badge">
              {Object.keys(userAnswers).length} of {parsedQuestions.length} answered
            </span>
          </div>

          {parsedQuestions.map((q) => {
            const selected = userAnswers[q.id];
            const isAnswered = Boolean(selected);

            return (
              <div key={q.id} className="ai-question-card">
                <div className="ai-question-header">
                  <span className="q-badge">Q{q.id}</span>
                  <p className="q-text">{q.question}</p>
                </div>

                <div className="ai-options-grid">
                  {q.options.map((opt) => {
                    const isSelected = selected === opt.key;
                    const isCorrect = opt.key === q.correctAnswer;
                    let optClass = 'ai-opt-btn';

                    if (isAnswered) {
                      if (isSelected && isCorrect) optClass += ' correct';
                      else if (isSelected && !isCorrect) optClass += ' wrong';
                      else if (!isSelected && isCorrect) optClass += ' reveal-correct';
                    } else if (isSelected) {
                      optClass += ' selected';
                    }

                    return (
                      <button
                        key={opt.key}
                        className={optClass}
                        onClick={() => handleSelectOption(q.id, opt.key)}
                      >
                        <span className="opt-key">{opt.key}</span>
                        <span className="opt-label">{opt.text}</span>
                        {isAnswered && isSelected && isCorrect && <CheckCircle2 size={16} className="opt-icon-feedback green" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle size={16} className="opt-icon-feedback red" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Results Summary Bar */}
          {Object.keys(userAnswers).length === parsedQuestions.length && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ai-score-banner">
              <Trophy size={28} color="#f59e0b" />
              <div className="ai-score-details">
                <h3>Quiz Complete! Score: {score} / {parsedQuestions.length} ({Math.round((score / parsedQuestions.length) * 100)}%)</h3>
                <p>{score === parsedQuestions.length ? 'Outstanding! Full marks achieved.' : 'Great effort! Review the highlighted answers to cement the concepts.'}</p>
              </div>
              <button className="ai-retry-btn" onClick={() => handleGenerate()}>
                <RotateCcw size={16} /> New Quiz
              </button>
            </motion.div>
          )}
        </div>
      )}

      <style>{`
        .ai-quiz-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-quiz-search-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ai-quiz-input {
          flex: 1;
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px 18px;
          color: white;
          font-size: 14px;
          outline: none;
        }
        .ai-quiz-input:focus {
          border-color: #0095f6;
        }

        .ai-quiz-topic-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chips-label {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.45);
        }
        .ai-topic-chip {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          font-size: 12.5px;
          padding: 5px 14px;
          border-radius: 16px;
          cursor: pointer;
        }
        .ai-topic-chip:hover {
          color: white;
          background: #1e1e24;
          border-color: #0095f6;
        }

        .ai-quiz-stream {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ai-quiz-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ai-quiz-meta-bar h4 {
          font-size: 16px;
          font-weight: 700;
        }
        .ai-quiz-count-badge {
          font-size: 12px;
          color: #38bdf8;
          font-weight: 600;
        }

        .ai-question-card {
          background: #141416;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
        }

        .ai-question-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .q-badge {
          background: rgba(0, 149, 246, 0.15);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .q-text {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          color: #ffffff;
        }

        .ai-options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .ai-opt-btn {
          width: 100%;
          text-align: left;
          background: #1c1c1f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.15s ease;
        }
        .ai-opt-btn:hover:not(.correct):not(.wrong) {
          background: #27272a;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .opt-key {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          flex-shrink: 0;
        }

        .opt-label {
          flex: 1;
        }

        .ai-opt-btn.correct {
          background: rgba(34, 197, 94, 0.15);
          border-color: #22c55e;
          color: #ffffff;
        }
        .ai-opt-btn.wrong {
          background: rgba(237, 73, 86, 0.15);
          border-color: #ed4956;
          color: #ffffff;
        }
        .ai-opt-btn.reveal-correct {
          border-color: #22c55e;
        }

        .opt-icon-feedback.green { color: #22c55e; }
        .opt-icon-feedback.red { color: #ed4956; }

        .ai-score-banner {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(20, 20, 24, 0.9) 100%);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .ai-score-details {
          flex: 1;
        }
        .ai-score-details h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .ai-score-details p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .ai-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #000000;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
