import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Image,
  Code,
  Type,
  X,
  Video,
  LayoutGrid as Grid,
  HelpCircle,
  BookOpen,
  StickyNote,
  Link2,
  Lightbulb,
} from 'lucide-react';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createMode, setCreateMode] = useState('post');
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState('');
  const [reelHashtags, setReelHashtags] = useState('');
  const [learningType, setLearningType] = useState('general');
  const [tags, setTags] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (createMode === 'post') {
      const newFiles = [...imageFiles, ...files].slice(0, 5); // Max 5 images
      setImageFiles(newFiles);
      setImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
      setPostType('image');
    } else if (createMode === 'reel') {
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file.');
        return;
      }
      setReelVideoFile(file);
      setReelVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = (index) => {
    if (typeof index === 'number') {
      const newFiles = imageFiles.filter((_, i) => i !== index);
      setImageFiles(newFiles);
      setImagePreviews(newFiles.map(file => URL.createObjectURL(file)));
      if (newFiles.length === 0 && fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setImageFiles([]);
      setImagePreviews([]);
      setReelVideoFile(null);
      setReelVideoPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (createMode === 'post') {
        if (!content.trim() && imageFiles.length === 0 && !codeSnippet.trim()) return setLoading(false);
        let imageUrl = '',
          cloudinaryPublicId = '';
        let images = [];
        
        if (imageFiles.length > 0) {
          const fd = new FormData();
          imageFiles.forEach(file => fd.append('files', file));
          const r = await api.upload('/api/upload/images/posts', fd);
          
          if (Array.isArray(r)) {
             images = r.map(file => file.url);
             if (images.length > 0) {
               imageUrl = images[0]; // for backwards compatibility
               cloudinaryPublicId = r[0].filename;
             }
          }
        }
        await api.post('/api/posts', {
          content,
          type: postType,
          imageUrl,
          images,
          cloudinaryPublicId,
          codeSnippet: postType === 'code' ? codeSnippet : undefined,
          codeLanguage: postType === 'code' ? codeLanguage : undefined,
          learningType,
          tags: tags
            .split(/[\s,]+/)
            .map((t) => t.trim())
            .filter(Boolean),
          sourceUrl: sourceUrl.trim() || undefined,
        });
        navigate('/');
      } else if (createMode === 'reel') {
        if (!reelTitle.trim() || !reelVideoFile) return setLoading(false);
        const fd = new FormData();
        fd.append('file', reelVideoFile);
        const r = await api.upload('/api/upload/video/reels', fd);
        await api.post('/api/reels', {
          title: reelTitle,
          videoUrl: r.url,
          cloudinaryPublicId: r.filename,
          hashtags: reelHashtags,
        });
        navigate('/reels');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (createMode === 'post') return !content.trim() && imageFiles.length === 0 && !codeSnippet.trim();
    if (createMode === 'reel') return !reelTitle.trim() || !reelVideoFile;
    return true;
  };

  const modes = [
    { key: 'post', icon: Grid, label: 'Post' },
    { key: 'reel', icon: Video, label: 'Reel' },
  ];

  return (
    <div className="page-root">
      <div className="page-inner">
        {/* Header */}
        <header className="page-header">
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={18} strokeWidth={2} />
          </button>

          <div className="header-center">
            <motion.span
              key={createMode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="header-eyebrow"
            >
              {createMode === 'post' ? 'New post' : 'New reel'}
            </motion.span>
          </div>

          <button className="share-btn" onClick={handleSubmit} disabled={isSubmitDisabled()}>
            {loading ? (
              <span className="dots">
                <span />
                <span />
                <span />
              </span>
            ) : (
              'Share'
            )}
          </button>
        </header>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="error-bar"
            >
              <X size={13} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode tabs */}
        <div className="mode-tabs" role="tablist">
          {modes.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={createMode === m.key}
              className={`mode-tab ${createMode === m.key ? 'active' : ''}`}
              onClick={() => {
                setCreateMode(m.key);
                removeFile();
                setContent('');
              }}
            >
              <m.icon size={15} strokeWidth={2} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <AnimatePresence mode="wait">
          <motion.div
            key={createMode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* ── POST ── */}
            {createMode === 'post' && (
              <div className="editor-card">
                {/* Sub-type pills */}
                <div className="sub-tabs">
                  {[
                    { key: 'text', icon: Type, label: 'Text' },
                    { key: 'image', icon: Image, label: 'Image' },
                    { key: 'code', icon: Code, label: 'Code' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`sub-tab ${postType === t.key ? 'active' : ''}`}
                      onClick={() => setPostType(t.key)}
                    >
                      <t.icon size={13} strokeWidth={2} />
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="main-textarea"
                  placeholder={
                    postType === 'code'
                      ? "What's this code about?"
                      : learningType === 'question'
                        ? 'What do you want to know? Be specific…'
                        : 'Share a thought, a lesson, or an achievement…'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={postType === 'code' ? 2 : 5}
                />

                {/* Learning context */}
                <div className="learn-row">
                  <span className="learn-label">Post type</span>
                  <div className="learn-types">
                    {[
                      { key: 'general', icon: Lightbulb, label: 'General' },
                      { key: 'question', icon: HelpCircle, label: 'Question' },
                      { key: 'explanation', icon: BookOpen, label: 'Explanation' },
                      { key: 'resource', icon: Link2, label: 'Resource' },
                      { key: 'note', icon: StickyNote, label: 'Note' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`learn-type ${learningType === t.key ? 'active' : ''}`}
                        onClick={() => setLearningType(t.key)}
                      >
                        <t.icon size={13} strokeWidth={2} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="learn-meta">
                  <input
                    className="learn-input"
                    type="text"
                    placeholder="Add tags — e.g. math, calculus, exam-prep"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  {learningType === 'resource' && (
                    <input
                      className="learn-input"
                      type="url"
                      placeholder="Source link (https://…)"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                    />
                  )}
                </div>

                {postType === 'image' && (
                  <div className="upload-area">
                    {imagePreviews.length > 0 ? (
                      <div className="previews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="preview-wrap">
                            <img src={preview} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                            <button className="remove-btn" onClick={() => removeFile(idx)}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < 5 && (
                          <label className="upload-label small-upload" style={{ height: 120, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: 8, cursor: 'pointer' }}>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileSelect}
                              hidden
                            />
                            <Image size={22} strokeWidth={1.5} color="var(--text-muted)" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          ref={fileInputRef}
                          hidden
                        />
                        <div className="upload-icon">
                          <Image size={22} strokeWidth={1.5} />
                        </div>
                        <strong>Add images</strong>
                        <span>Select up to 5 images (PNG, JPG, WEBP)</span>
                      </label>
                    )}
                  </div>
                )}

                {postType === 'code' && (
                  <div className="code-block">
                    <div className="code-titlebar">
                      <span className="traffic">
                        <i />
                        <i />
                        <i />
                      </span>
                      <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="lang-select"
                      >
                        {['javascript', 'python', 'java', 'cpp', 'html', 'css', 'sql', 'other'].map(
                          (l) => (
                            <option key={l} value={l}>
                              {l.toUpperCase()}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <textarea
                      className="code-area"
                      placeholder="// Paste your code here…"
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      rows={10}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── REEL ── */}
            {createMode === 'reel' && (
              <div className="reel-wrap">
                {reelVideoPreview ? (
                  <div className="reel-preview">
                    <video src={reelVideoPreview} controls />
                    <button className="remove-btn" onClick={removeFile}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="reel-upload">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      hidden
                    />
                    <div className="upload-icon reel-icon">
                      <Video size={26} strokeWidth={1.5} />
                    </div>
                    <strong>Upload a video</strong>
                    <span>MP4 or MOV · up to 60 s</span>
                  </label>
                )}

                <div className="meta-fields">
                  <div className="field">
                    <label htmlFor="reel-caption">Caption</label>
                    <input
                      id="reel-caption"
                      type="text"
                      placeholder="Describe your reel…"
                      value={reelTitle}
                      onChange={(e) => setReelTitle(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="reel-tags">Hashtags</label>
                    <input
                      id="reel-tags"
                      type="text"
                      placeholder="#design  #code  #productivity"
                      value={reelHashtags}
                      onChange={(e) => setReelHashtags(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        /* ── ROOT ── */
        .page-root {
          min-height: 100vh;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding-bottom: calc(var(--bottom-nav-height) + 24px);
        }

        .page-inner {
          max-width: 560px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* ── HEADER ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 0 20px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        .header-center { flex: 1; text-align: center; }
        .header-eyebrow {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .share-btn {
          padding: 8px 18px;
          background: var(--accent);
          color: #1d1915;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          font-weight: 600;
          border: none;
          transition: background 0.12s;
          flex-shrink: 0;
          min-width: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .share-btn:hover:not(:disabled) { background: var(--accent-light); }
        .share-btn:disabled { opacity: 0.35; cursor: default; }

        /* loading dots */
        .dots { display: flex; gap: 3px; align-items: center; }
        .dots span { width: 4px; height: 4px; border-radius: 50%; background: #1d1915; animation: dot-bounce 0.7s infinite alternate; }
        .dots span:nth-child(2) { animation-delay: 0.15s; }
        .dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dot-bounce { to { transform: translateY(-3px); } }

        /* ── ERROR ── */
        .error-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(200, 86, 74, 0.1);
          border: 1px solid rgba(200, 86, 74, 0.35);
          border-radius: var(--radius-md);
          color: #e5978e;
          font-size: 13px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        /* ── MODE TABS ── */
        .mode-tabs {
          display: flex;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
          gap: 2px;
          margin-bottom: 20px;
        }

        .mode-tab {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 0;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-muted);
          border: none;
          background: transparent;
          border-radius: var(--radius-sm);
          transition: color 0.15s, background 0.15s;
        }
        .mode-tab.active {
          color: #1d1915;
          background: var(--accent);
          font-weight: 600;
        }

        /* ── EDITOR ── */
        .editor-card {
          padding: 4px 0 0;
        }

        .sub-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
        }

        .sub-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 13px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .sub-tab:hover { color: var(--text-primary); border-color: var(--border-light); }
        .sub-tab.active { background: var(--bg-tertiary); color: var(--text-primary); border-color: var(--border-light); }

        .main-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font);
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-primary);
          margin-bottom: 14px;
          display: block;
        }
        .main-textarea::placeholder { color: var(--text-muted); }

        /* ── UPLOAD ── */
        .upload-area { width: 100%; }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          border: 1px dashed var(--border-light);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: center;
          transition: border-color 0.15s;
        }
        .upload-label:hover { border-color: var(--text-muted); }
        .upload-label strong { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .upload-label span { font-size: 12px; color: var(--text-muted); }

        .upload-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .preview-wrap {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .preview-wrap img { width: 100%; display: block; max-height: 380px; object-fit: cover; }

        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-md);
          background: rgba(10, 8, 5, 0.8);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          cursor: pointer;
        }

        /* ── CODE ── */
        .code-block {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #14110d;
        }

        .code-titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-color);
        }

        .traffic { display: flex; gap: 5px; }
        .traffic i { width: 8px; height: 8px; border-radius: 50%; display: block; background: var(--border-light); }
        .traffic i:nth-child(1) { background: var(--danger); opacity: 0.7; }
        .traffic i:nth-child(2) { background: var(--warning); opacity: 0.7; }
        .traffic i:nth-child(3) { background: var(--success); opacity: 0.7; }

        .lang-select {
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          width: auto;
          padding: 0;
        }

        .code-area {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.7;
          color: #d8c9a8;
          padding: 14px 16px;
          display: block;
        }
        .code-area::placeholder { color: rgba(216, 201, 168, 0.3); }

        /* ── REEL ── */
        .reel-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 56px 20px;
          border: 1px dashed var(--border-light);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: center;
          margin-bottom: 18px;
          transition: border-color 0.15s;
        }
        .reel-upload:hover { border-color: var(--text-muted); }
        .reel-upload strong { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        .reel-upload span { font-size: 12px; color: var(--text-muted); }

        .reel-icon { color: var(--text-muted); }

        .reel-preview {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 18px;
          background: #000;
          border: 1px solid var(--border-color);
        }
        .reel-preview video { width: 100%; display: block; max-height: 50vh; object-fit: contain; }

        /* ── META FIELDS ── */
        .meta-fields { display: flex; flex-direction: column; gap: 12px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .field input {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 13px;
          font-size: 14px;
          color: var(--text-primary);
        }
        .field input:focus { border-color: var(--accent); }

        /* ── LEARNING CONTEXT ── */
        .learn-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .learn-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .learn-types { display: flex; flex-wrap: wrap; gap: 6px; }
        .learn-type {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: transparent; color: var(--text-secondary);
          font-size: 12.5px; font-weight: 500;
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .learn-type:hover { color: var(--text-primary); border-color: var(--border-light); }
        .learn-type.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #1d1915;
        }
        .learn-meta { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
        .learn-input {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 13px;
          font-size: 13.5px;
          color: var(--text-primary);
        }
        .learn-input:focus { border-color: var(--accent); }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          .page-inner { padding: 0 14px; }
          .main-textarea { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
