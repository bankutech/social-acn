import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image, Code, Type, X, Video, LayoutGrid as Grid } from 'lucide-react';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createMode, setCreateMode] = useState('post');
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState('');
  const [reelHashtags, setReelHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (createMode === 'post') {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPostType('image');
    } else if (createMode === 'reel') {
      if (!file.type.startsWith('video/')) { alert('Please select a valid video file.'); return; }
      setReelVideoFile(file);
      setReelVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setImageFile(null); setImagePreview('');
    setReelVideoFile(null); setReelVideoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      if (createMode === 'post') {
        if (!content.trim() && !imageFile && !codeSnippet.trim()) return setLoading(false);
        let imageUrl = '', cloudinaryPublicId = '';
        if (imageFile) {
          const fd = new FormData(); fd.append('file', imageFile);
          const r = await api.upload('/api/upload/image/posts', fd);
          imageUrl = r.url; cloudinaryPublicId = r.filename;
        }
        await api.post('/api/posts', { content, type: postType, imageUrl, cloudinaryPublicId, codeSnippet: postType === 'code' ? codeSnippet : undefined, codeLanguage: postType === 'code' ? codeLanguage : undefined });
        navigate('/');
      } else if (createMode === 'reel') {
        if (!reelTitle.trim() || !reelVideoFile) return setLoading(false);
        const fd = new FormData(); fd.append('file', reelVideoFile);
        const r = await api.upload('/api/upload/video/reels', fd);
        await api.post('/api/reels', { title: reelTitle, videoUrl: r.url, cloudinaryPublicId: r.filename, hashtags: reelHashtags });
        navigate('/reels');
      }
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (createMode === 'post') return !content.trim() && !imageFile && !codeSnippet.trim();
    if (createMode === 'reel') return !reelTitle.trim() || !reelVideoFile;
    return true;
  };

  const modes = [
    { key: 'post', icon: Grid, label: 'Post' },
    { key: 'reel', icon: Video, label: 'Reel' },
  ];

  return (
    <div className="page-root">
      <div className="noise-overlay" />
      <div className={`ambient-blob blob-${createMode}`} />

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

          <button
            className="share-btn"
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
          >
            {loading ? (
              <span className="dots"><span /><span /><span /></span>
            ) : 'Share'}
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
          {modes.map(m => (
            <button
              key={m.key}
              role="tab"
              aria-selected={createMode === m.key}
              className={`mode-tab ${createMode === m.key ? 'active' : ''}`}
              onClick={() => { setCreateMode(m.key); removeFile(); setContent(''); }}
            >
              {createMode === m.key && (
                <motion.span layoutId="tab-pill" className="tab-pill" />
              )}
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
                  ].map(t => (
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
                  placeholder={postType === 'code' ? "What's this code about?" : "Share a thought, a lesson, or an achievement…"}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={postType === 'code' ? 2 : 5}
                />


                {postType === 'image' && (
                  <div className="upload-area">
                    {imagePreview ? (
                      <div className="preview-wrap">
                        <img src={imagePreview} alt="Preview" />
                        <button className="remove-btn" onClick={removeFile}><X size={14} /></button>
                      </div>
                    ) : (
                      <label className="upload-label">
                        <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                        <div className="upload-icon"><Image size={22} strokeWidth={1.5} /></div>
                        <strong>Add image</strong>
                        <span>PNG, JPG or GIF · up to 10 MB</span>
                      </label>
                    )}
                  </div>
                )}

                {postType === 'code' && (
                  <div className="code-block">
                    <div className="code-titlebar">
                      <span className="traffic"><i /><i /><i /></span>
                      <select
                        value={codeLanguage}
                        onChange={e => setCodeLanguage(e.target.value)}
                        className="lang-select"
                      >
                        {['javascript','python','java','cpp','html','css','sql','other'].map(l => (
                          <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      className="code-area"
                      placeholder="// Paste your code here…"
                      value={codeSnippet}
                      onChange={e => setCodeSnippet(e.target.value)}
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
                    <button className="remove-btn" onClick={removeFile}><X size={14} /></button>
                  </div>
                ) : (
                  <label className="reel-upload">
                    <input type="file" accept="video/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                    <div className="upload-icon reel-icon"><Video size={26} strokeWidth={1.5} /></div>
                    <strong>Upload a video</strong>
                    <span>MP4 or MOV · up to 60 s</span>
                  </label>
                )}

                <div className="meta-fields">
                  <div className="field">
                    <label htmlFor="reel-caption">Caption</label>
                    <input id="reel-caption" type="text" placeholder="Describe your reel…" value={reelTitle} onChange={e => setReelTitle(e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="reel-tags">Hashtags</label>
                    <input id="reel-tags" type="text" placeholder="#design  #code  #productivity" value={reelHashtags} onChange={e => setReelHashtags(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── ROOT ── */
        .page-root {
          min-height: 100vh;
          background: #08080a;
          color: #f0ede8;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 60px;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
        }

        .ambient-blob {
          position: fixed;
          top: -20vh;
          right: -10vw;
          width: 55vw;
          height: 55vw;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          opacity: 0.12;
          transition: background 1.2s ease;
          filter: blur(100px);
        }
        .blob-post  { background: #5eead4; }
        .blob-reel  { background: #818cf8; }

        .page-inner {
          position: relative;
          z-index: 10;
          max-width: 520px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ── HEADER ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 0 24px;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f0ede8;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .icon-btn:hover { background: rgba(240,237,232,0.08); border-color: rgba(240,237,232,0.2); }

        .header-center { flex: 1; text-align: center; }
        .header-eyebrow {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,232,0.5);
          letter-spacing: 0.01em;
        }

        .share-btn {
          padding: 9px 22px;
          background: #f0ede8;
          color: #08080a;
          border-radius: 99px;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          border: none;
          transition: opacity 0.15s, transform 0.15s;
          flex-shrink: 0;
          min-width: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .share-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .share-btn:disabled { opacity: 0.28; cursor: default; }

        /* loading dots */
        .dots { display: flex; gap: 3px; align-items: center; }
        .dots span { width: 5px; height: 5px; border-radius: 50%; background: #08080a; animation: dot-bounce 0.7s infinite alternate; }
        .dots span:nth-child(2) { animation-delay: 0.15s; }
        .dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dot-bounce { to { transform: translateY(-3px); } }

        /* ── ERROR ── */
        .error-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 12.5px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        /* ── MODE TABS ── */
        .mode-tabs {
          display: flex;
          background: rgba(240,237,232,0.04);
          border: 1px solid rgba(240,237,232,0.07);
          border-radius: 14px;
          padding: 5px;
          gap: 2px;
          margin-bottom: 24px;
        }

        .mode-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 0;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,232,0.38);
          border: none;
          background: transparent;
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        .mode-tab.active { color: #08080a; }

        .tab-pill {
          position: absolute;
          inset: 0;
          background: #f0ede8;
          border-radius: 10px;
          z-index: -1;
        }

        .mode-tab span, .mode-tab svg { position: relative; z-index: 1; }

        /* ── EDITOR CARD ── */
        .editor-card {
          background: rgba(240,237,232,0.03);
          border: 1px solid rgba(240,237,232,0.08);
          border-radius: 20px;
          padding: 20px;
        }

        .sub-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
        }

        .sub-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 14px;
          border: 1px solid rgba(240,237,232,0.1);
          border-radius: 99px;
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(240,237,232,0.42);
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sub-tab:hover { color: rgba(240,237,232,0.7); border-color: rgba(240,237,232,0.2); }
        .sub-tab.active { background: rgba(240,237,232,0.1); color: #f0ede8; border-color: rgba(240,237,232,0.25); }

        .main-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.7;
          color: #f0ede8;
          margin-bottom: 16px;
          display: block;
        }
        .main-textarea::placeholder { color: rgba(240,237,232,0.2); }

        /* ── AI BUTTON ── */
        .ai-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border: 1px solid rgba(129,140,248,0.3);
          border-radius: 99px;
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #a5b4fc;
          background: rgba(129,140,248,0.07);
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 20px;
        }
        .ai-btn:hover:not(:disabled) { background: rgba(129,140,248,0.14); border-color: rgba(129,140,248,0.5); }
        .ai-btn.loading { opacity: 0.6; animation: ai-pulse 1.4s ease-in-out infinite; }
        @keyframes ai-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 0.9; } }

        /* ── UPLOAD ── */
        .upload-area { width: 100%; }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 44px 20px;
          border: 1px dashed rgba(240,237,232,0.14);
          border-radius: 14px;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }
        .upload-label:hover { border-color: rgba(240,237,232,0.3); background: rgba(240,237,232,0.03); }
        .upload-label strong { font-size: 14px; font-weight: 500; color: #f0ede8; }
        .upload-label span { font-size: 12px; color: rgba(240,237,232,0.35); }

        .upload-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(240,237,232,0.1);
          background: rgba(240,237,232,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(240,237,232,0.45);
          margin-bottom: 4px;
        }

        .preview-wrap {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
        }
        .preview-wrap img { width: 100%; display: block; max-height: 380px; object-fit: cover; }

        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(8,8,10,0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(240,237,232,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f0ede8;
          cursor: pointer;
        }

        /* ── CODE ── */
        .code-block {
          border: 1px solid rgba(240,237,232,0.08);
          border-radius: 14px;
          overflow: hidden;
          background: #0d0d10;
        }

        .code-titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #141418;
          border-bottom: 1px solid rgba(240,237,232,0.07);
        }

        .traffic { display: flex; gap: 5px; }
        .traffic i { width: 9px; height: 9px; border-radius: 50%; display: block; }
        .traffic i:nth-child(1) { background: #ff5f57; }
        .traffic i:nth-child(2) { background: #febc2e; }
        .traffic i:nth-child(3) { background: #28c840; }

        .lang-select {
          background: transparent;
          border: none;
          outline: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          color: rgba(240,237,232,0.4);
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .code-area {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          line-height: 1.8;
          color: #7dd3fc;
          padding: 16px;
          display: block;
        }
        .code-area::placeholder { color: rgba(125,211,252,0.25); }

        /* ── STORY ── */
        .story-wrap { display: flex; justify-content: center; }

        .story-canvas {
          width: 100%;
          max-width: 300px;
          aspect-ratio: 9/16;
          background: #111115;
          border-radius: 24px;
          border: 1px solid rgba(240,237,232,0.08);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .story-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .story-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          cursor: pointer;
          padding: 20px;
        }
        .story-upload strong { font-size: 14px; font-weight: 500; }
        .story-upload span { font-size: 12px; color: rgba(240,237,232,0.38); }

        .story-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: linear-gradient(to top, rgba(8,8,10,0.7) 0%, transparent 100%);
        }

        .story-text {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #fff;
          text-align: center;
          text-shadow: 0 1px 6px rgba(0,0,0,0.6);
          line-height: 1.5;
        }
        .story-text::placeholder { color: rgba(255,255,255,0.4); }

        .story-remove { top: 12px; right: 12px; }

        /* ── REEL ── */
        .reel-wrap { }

        .reel-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 60px 20px;
          border: 1px dashed rgba(240,237,232,0.12);
          border-radius: 18px;
          cursor: pointer;
          text-align: center;
          margin-bottom: 20px;
          transition: all 0.15s;
        }
        .reel-upload:hover { border-color: rgba(240,237,232,0.28); background: rgba(240,237,232,0.02); }
        .reel-upload strong { font-size: 14px; font-weight: 500; }
        .reel-upload span { font-size: 12px; color: rgba(240,237,232,0.35); }

        .reel-icon { background: rgba(129,140,248,0.08); border-color: rgba(129,140,248,0.2); color: #a5b4fc; }

        .reel-preview {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 20px;
          background: #000;
        }
        .reel-preview video { width: 100%; display: block; max-height: 50vh; object-fit: contain; }

        /* ── META FIELDS ── */
        .meta-fields { display: flex; flex-direction: column; gap: 12px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(240,237,232,0.36);
        }
        .field input {
          background: rgba(240,237,232,0.04);
          border: 1px solid rgba(240,237,232,0.09);
          border-radius: 11px;
          padding: 11px 14px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #f0ede8;
          outline: none;
          transition: border-color 0.15s;
        }
        .field input:focus { border-color: rgba(240,237,232,0.25); }
        .field input::placeholder { color: rgba(240,237,232,0.22); }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          .page-inner { padding: 0 16px; }
          .story-canvas { max-width: 100%; }
          .main-textarea { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}