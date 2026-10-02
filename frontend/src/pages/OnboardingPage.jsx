import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const LEVELS = [
  { key: 'high-school', label: 'High school' },
  { key: 'undergrad', label: 'Undergraduate' },
  { key: 'postgrad', label: 'Postgraduate' },
  { key: 'self-taught', label: 'Self-taught' },
];

const INTERESTS = [
  'Math',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Programming',
  'Design',
  'Business',
  'Economics',
  'Languages',
  'History',
  'Medicine',
  'Engineering',
  'Psychology',
  'AI & ML',
  'Web Dev',
];

const GOALS = [
  'Ace my exams',
  'Learn new skills',
  'Find study partners',
  'Share knowledge',
  'Build projects',
  'Stay consistent',
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [educationLevel, setEducationLevel] = useState('');
  const [interests, setInterests] = useState([]);
  const [goals, setGoals] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const data = await api.put('/api/auth/onboarding', { educationLevel, interests, goals });
      updateUser({
        educationLevel: data.educationLevel,
        interests: data.interests,
        goals: data.goals,
        onboardingCompleted: true,
      });
      navigate('/');
    } catch {
      // Still let them in — onboarding is not a hard gate
      updateUser({ educationLevel, interests, goals, onboardingCompleted: true });
      navigate('/');
    }
    setSaving(false);
  };

  const steps = [
    {
      icon: null,
      title: `Hi ${user?.name?.split(' ')[0] || 'there'} — what are you studying?`,
      subtitle: "We'll use this to shape what shows up in your feed.",
      content: (
        <div className="ob-option-grid">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              className={`ob-option ${educationLevel === l.key ? 'selected' : ''}`}
              onClick={() => setEducationLevel(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      ),
      skippable: false,
      canNext: true,
    },
    {
      icon: null,
      title: 'Pick a few subjects',
      subtitle: 'Optional. Posts and groups in these areas get ranked higher for you.',
      content: (
        <div className="ob-chip-wrap">
          {INTERESTS.map((i) => (
            <button
              key={i}
              className={`ob-chip ${interests.includes(i) ? 'selected' : ''}`}
              onClick={() => toggle(interests, setInterests, i)}
            >
              {i}
            </button>
          ))}
        </div>
      ),
      skippable: true,
      canNext: true,
    },
    {
      icon: null,
      title: 'What brings you here?',
      subtitle: 'Optional — helps us suggest groups and study partners.',
      content: (
        <div className="ob-chip-wrap">
          {GOALS.map((g) => (
            <button
              key={g}
              className={`ob-chip ${goals.includes(g) ? 'selected' : ''}`}
              onClick={() => toggle(goals, setGoals, g)}
            >
              {g}
            </button>
          ))}
        </div>
      ),
      skippable: true,
      canNext: true,
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="ob-page">
      <div className="ob-card">
        {/* Progress */}
        <div className="ob-progress">
          <span className="ob-progress-bar">
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </span>
          <span className="ob-progress-count">
            {step + 1} / {steps.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className="ob-title">{current.title}</h1>
            <p className="ob-subtitle">{current.subtitle}</p>
            {current.content}
          </motion.div>
        </AnimatePresence>

        <div className="ob-actions">
          {step > 0 ? (
            <button className="ob-back" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {current.skippable && !isLast && (
              <button className="ob-skip" onClick={() => setStep((s) => s + 1)}>
                Skip
              </button>
            )}
            <button
              className="ob-next"
              disabled={saving}
              onClick={() => (isLast ? handleFinish() : setStep((s) => s + 1))}
            >
              {saving ? (
                'Saving…'
              ) : isLast ? (
                'Done'
              ) : (
                <>
                  Continue <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ob-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: var(--bg-primary);
        }
        .ob-card {
          width: 100%;
          max-width: 440px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 30px 28px;
        }
        .ob-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 26px;
        }
        .ob-progress-bar {
          flex: 1;
          height: 3px;
          background: var(--bg-tertiary);
          overflow: hidden;
          display: block;
        }
        .ob-progress-bar span {
          display: block;
          height: 100%;
          background: var(--accent);
          transition: width 0.25s var(--ease-standard);
        }
        .ob-progress-count { font-size: 12px; color: var(--text-muted); }
        .ob-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 500;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .ob-subtitle { color: var(--text-secondary); font-size: 14px; line-height: 1.55; margin-bottom: 22px; }
        .ob-option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .ob-option {
          padding: 14px 12px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-md);
          transition: border-color 0.12s, background 0.12s;
        }
        .ob-option:hover { border-color: var(--border-light); }
        .ob-option.selected {
          border-color: var(--accent);
          color: var(--accent-light);
          background: var(--accent-bg);
        }
        .ob-chip-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .ob-chip {
          padding: 8px 14px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          border-radius: var(--radius-full);
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .ob-chip:hover { border-color: var(--border-light); color: var(--text-primary); }
        .ob-chip.selected {
          background: var(--accent);
          border-color: var(--accent);
          color: #1d1915;
          font-weight: 500;
        }
        .ob-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 28px;
        }
        .ob-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          background: none;
          border: none;
          font-size: 14px;
          padding: 8px 4px;
        }
        .ob-back:hover { color: var(--text-primary); }
        .ob-skip {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 14px;
          padding: 10px;
        }
        .ob-skip:hover { color: var(--text-secondary); }
        .ob-next {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent);
          color: #1d1915;
          border: none;
          font-size: 14px;
          font-weight: 600;
          padding: 11px 20px;
          border-radius: var(--radius-md);
          transition: background 0.12s;
        }
        .ob-next:hover:not(:disabled) { background: var(--accent-light); }
        .ob-next:disabled { opacity: 0.5; cursor: default; }
      `}</style>
    </div>
  );
}
