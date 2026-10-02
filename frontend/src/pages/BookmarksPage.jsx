import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, FolderPlus, Folder, X, Check, Trash2, Pencil } from 'lucide-react';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';

export default function BookmarksPage() {
  const [data, setData] = useState({ all: [], folders: [], folderNames: [] });
  const [activeFolder, setActiveFolder] = useState('all'); // 'all' | folder name
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuFolder, setMenuFolder] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await api.get('/api/bookmarks');
      // Backwards compat: old API returned a plain array
      setData(Array.isArray(res) ? { all: res, folders: [], folderNames: [] } : res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await api.post('/api/bookmarks/folders', { name });
      setData((prev) => ({
        ...prev,
        folders: res.folders,
        folderNames: res.folders.map((f) => f.name),
      }));
      setActiveFolder(name);
    } catch (e) {
      console.error(e);
    }
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const renameFolder = async (oldName) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) {
      setRenaming(null);
      return;
    }
    try {
      const res = await api.put('/api/bookmarks/folders', { name: oldName, newName });
      setData((prev) => ({
        ...prev,
        folders: res.folders,
        folderNames: res.folders.map((f) => f.name),
      }));
      if (activeFolder === oldName) setActiveFolder(newName);
    } catch (e) {
      console.error(e);
    }
    setRenaming(null);
  };

  const deleteFolder = async (name) => {
    try {
      const res = await api.delete('/api/bookmarks/folders', { data: { name } });
      setData((prev) => ({
        ...prev,
        folders: res.folders,
        folderNames: res.folders.map((f) => f.name),
      }));
      if (activeFolder === name) setActiveFolder('all');
    } catch (e) {
      console.error(e);
    }
    setMenuFolder(null);
  };

  const visiblePosts =
    activeFolder === 'all'
      ? data.all
      : data.folders.find((f) => f.name === activeFolder)?.posts || [];

  return (
    <div className="bm-root">
      <style>{bmStyles}</style>

      {/* Header */}
      <header className="bm-header">
        <div className="bm-header-inner">
          <h1>Saved</h1>
          {!loading && (
            <span className="bm-count">
              {data.all.length} post{data.all.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Folder tabs */}
      <div className="bm-tabs">
        <FolderTab
          label="All"
          active={activeFolder === 'all'}
          count={data.all.length}
          onClick={() => setActiveFolder('all')}
        />
        {data.folders.map((f) => (
          <div key={f.name} style={{ position: 'relative', flexShrink: 0 }}>
            <FolderTab
              label={f.name}
              icon={Folder}
              active={activeFolder === f.name}
              count={f.posts?.length || 0}
              onClick={() => setActiveFolder(f.name)}
              onLongPress={() => setMenuFolder(f.name)}
            />
            {menuFolder === f.name && (
              <FolderMenu
                onRename={() => {
                  setRenaming(f.name);
                  setRenameValue(f.name);
                  setMenuFolder(null);
                }}
                onDelete={() => deleteFolder(f.name)}
                onClose={() => setMenuFolder(null)}
              />
            )}
          </div>
        ))}
        <button className="bm-new-folder" onClick={() => setShowNewFolder(true)}>
          <FolderPlus size={13} /> New folder
        </button>
      </div>

      {/* New folder input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bm-editor"
          >
            <div className="bm-editor-row">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                placeholder="Folder name — e.g. Exam prep"
              />
              <button
                className="bm-editor-confirm"
                onClick={createFolder}
                aria-label="Create folder"
              >
                <Check size={15} />
              </button>
              <button
                className="bm-editor-cancel"
                onClick={() => setShowNewFolder(false)}
                aria-label="Cancel"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename inline editor */}
      {renaming && (
        <div className="bm-editor bm-editor-open">
          <div className="bm-editor-row">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && renameFolder(renaming)}
            />
            <button
              className="bm-editor-confirm"
              onClick={() => renameFolder(renaming)}
              aria-label="Save name"
            >
              <Check size={15} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="loader-spinner" />
        </div>
      ) : visiblePosts.length === 0 ? (
        <EmptyState
          icon={activeFolder === 'all' ? Bookmark : Folder}
          title={activeFolder === 'all' ? 'Nothing saved yet' : `Nothing in “${activeFolder}”`}
          description={
            activeFolder === 'all'
              ? 'Use the bookmark icon on any post to keep it here.'
              : 'Save a post into this folder and it will show up here.'
          }
        />
      ) : (
        <div className="bm-list">
          {visiblePosts.map((post) => (
            <PostCard key={post._id} post={post} onUpdate={loadBookmarks} />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderTab({ label, icon: Icon, active, count, onClick, onLongPress }) {
  let pressTimer;
  return (
    <button
      className={`bm-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault();
          onLongPress();
        }
      }}
      onTouchStart={() => {
        pressTimer = setTimeout(onLongPress, 600);
      }}
      onTouchEnd={() => clearTimeout(pressTimer)}
      title={onLongPress ? 'Long-press or right-click for options' : undefined}
    >
      {Icon && <Icon size={13} />}
      {label}
      <span className="bm-tab-count">{count}</span>
    </button>
  );
}

function FolderMenu({ onRename, onDelete, onClose }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bm-menu"
      >
        <button onClick={onRename} className="bm-menu-item">
          <Pencil size={14} /> Rename
        </button>
        <button onClick={onDelete} className="bm-menu-item bm-menu-danger">
          <Trash2 size={14} /> Delete folder
        </button>
      </motion.div>
    </>
  );
}

const bmStyles = `
  .bm-root {
    min-height: 100vh;
    padding-bottom: calc(var(--bottom-nav-height) + 24px);
  }
  .bm-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
  }
  .bm-header-inner {
    max-width: 640px;
    margin: 0 auto;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
  }
  .bm-header h1 {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 500;
  }
  .bm-count { font-size: 12.5px; color: var(--text-muted); }
  .bm-tabs {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .bm-tabs::-webkit-scrollbar { display: none; }
  .bm-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--text-secondary);
    font-size: 12.5px;
    font-weight: 500;
    white-space: nowrap;
    transition: border-color 0.12s, color 0.12s;
  }
  .bm-tab:hover { border-color: var(--border-light); color: var(--text-primary); }
  .bm-tab.active {
    background: var(--bg-tertiary);
    border-color: var(--border-light);
    color: var(--text-primary);
  }
  .bm-tab-count { font-size: 11px; color: var(--text-muted); }
  .bm-tab.active .bm-tab-count { color: var(--accent-light); }
  .bm-new-folder {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 6px 12px;
    border: 1px dashed var(--border-light);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--text-secondary);
    font-size: 12.5px;
    font-weight: 500;
  }
  .bm-new-folder:hover { color: var(--text-primary); border-color: var(--text-muted); }
  .bm-editor {
    max-width: 640px;
    margin: 0 auto;
    padding: 10px 16px;
    overflow: hidden;
  }
  .bm-editor-open { padding-top: 4px; }
  .bm-editor-row { display: flex; gap: 8px; }
  .bm-editor-row input { flex: 1; font-size: 13.5px; }
  .bm-editor-confirm {
    width: 38px;
    border-radius: var(--radius-md);
    background: var(--accent);
    color: #1d1915;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .bm-editor-confirm:hover { background: var(--accent-light); }
  .bm-editor-cancel {
    width: 38px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .bm-editor-cancel:hover { color: var(--text-primary); }
  .bm-list {
    max-width: 640px;
    margin: 0 auto;
    padding: 12px 16px 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bm-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 201;
    background: var(--bg-elevated);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    min-width: 160px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .bm-menu-item {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 10px 13px;
    color: var(--text-primary);
    font-size: 13px;
    text-align: left;
  }
  .bm-menu-item:hover { background: var(--bg-hover); }
  .bm-menu-danger { color: var(--danger); }
`;

export { bmStyles };
