import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRound, Heart, Users, Bookmark, Sparkles, X, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'sphere_checklist_dismissed';

export default function WelcomeChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  // Hidden until onboarding completes, or when dismissed/all done
  if (!user || dismissed) return null;
  if (user.onboardingCompleted === false) return null;

  const tasks = [
    {
      key: 'profile',
      label: 'Complete your profile',
      icon: UserRound,
      path: `/profile/${user._id || user.id}`,
      done: Boolean(user.bio),
    },
    {
      key: 'interests',
      label: 'Pick your interests',
      icon: Heart,
      path: '/onboarding',
      done: (user.interests?.length || 0) > 0,
    },
    { key: 'group', label: 'Join a study group', icon: Users, path: '/groups', done: false },
    { key: 'save', label: 'Save a post for later', icon: Bookmark, path: '/', done: false },
    { key: 'ai', label: 'Ask the AI Partner a question', icon: Sparkles, path: '/ai', done: false },
  ];

  const doneCount = tasks.filter((t) => t.done).length;
  if (doneCount === tasks.length) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <motion.div
      className="wc-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="wc-header">
        <div>
          <h3>Set up Sphere</h3>
          <p>
            {doneCount} of {tasks.length} done — the rest are optional, but they make the feed
            better.
          </p>
        </div>
        <button className="wc-dismiss" onClick={dismiss} aria-label="Dismiss checklist">
          <X size={16} />
        </button>
      </div>

      <div className="wc-progress">
        <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
      </div>

      <div className="wc-tasks">
        {tasks.map((task) => (
          <button
            key={task.key}
            className={`wc-task ${task.done ? 'done' : ''}`}
            onClick={() => navigate(task.path)}
          >
            <span className="wc-check">{task.done && <Check size={12} />}</span>
            <task.icon size={15} />
            <span className="wc-label">{task.label}</span>
            <ChevronRight size={14} className="wc-arrow" />
          </button>
        ))}
      </div>

      <style>{`
        .wc-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          margin-bottom: 20px;
        }
        .wc-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .wc-header h3 {
          font-family: var(--font-display);
          font-size: 15.5px;
          font-weight: 500;
          margin-bottom: 3px;
        }
        .wc-header p { color: var(--text-muted); font-size: 12.5px; }
        .wc-dismiss { color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 4px; }
        .wc-dismiss:hover { color: var(--text-secondary); }
        .wc-progress {
          height: 3px; background: var(--bg-tertiary);
          margin: 12px 0; overflow: hidden;
        }
        .wc-progress span {
          display: block; height: 100%;
          background: var(--accent);
          transition: width 0.4s var(--ease-standard);
        }
        .wc-tasks { display: flex; flex-direction: column; }
        .wc-task {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 6px;
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary); font-size: 13.5px;
          text-align: left; transition: color 0.12s;
        }
        .wc-task:hover { color: var(--text-primary); }
        .wc-task.done { color: var(--text-muted); text-decoration: line-through; }
        .wc-check {
          width: 15px; height: 15px; border-radius: 50%;
          border: 1.5px solid var(--border-light);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          color: transparent;
        }
        .wc-task.done .wc-check { background: var(--accent); border-color: var(--accent); color: #1d1915; }
        .wc-label { flex: 1; }
        .wc-arrow { color: var(--text-muted); }
      `}</style>
    </motion.div>
  );
}
