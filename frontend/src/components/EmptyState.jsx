import { motion } from 'framer-motion';

/**
 * Shared empty state. Usage:
 *   <EmptyState icon={Bookmark} title="Nothing here" description="Save posts to see them." actionLabel="Explore" onAction={fn} />
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div className="es-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {Icon && <Icon size={28} className="es-icon" />}
      <h3 className="es-title">{title}</h3>
      {description && <p className="es-desc">{description}</p>}
      {actionLabel && onAction && (
        <button className="btn-secondary es-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <style>{`
        .es-root {
          text-align: center;
          padding: 64px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px dashed var(--border-light);
          border-radius: var(--radius-lg);
        }
        .es-icon { color: var(--text-muted); margin-bottom: 14px; }
        .es-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 500;
          margin: 0 0 6px;
        }
        .es-desc {
          color: var(--text-secondary);
          margin: 0 0 20px;
          line-height: 1.6;
          font-size: 14px;
          max-width: 320px;
        }
      `}</style>
    </motion.div>
  );
}
