import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image, Code, Type, Sparkles, X, Send, Video, LayoutGrid as Grid } from 'lucide-react';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Top-level creation type: post, story, reel
  const [createMode, setCreateMode] = useState('post');
  
  // Post specific states
  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  
  // Reel specific states
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState('');
  const [reelHashtags, setReelHashtags] = useState('');

  // General state
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (createMode === 'post') {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPostType('image');
    } else if (createMode === 'story') {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Reset content for story if an image is selected
    } else if (createMode === 'reel') {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        alert('Please select a valid video file for reels.');
        return;
      }
      setReelVideoFile(file);
      setReelVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setImageFile(null);
    setImagePreview('');
    setReelVideoFile(null);
    setReelVideoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateCaption = async () => {
    if (!content.trim() && !codeSnippet.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/caption', { content: content || codeSnippet, type: createMode });
      setContent(res.caption);
    } catch {}
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (createMode === 'post') {
        if (!content.trim() && !imageFile && !codeSnippet.trim()) return setLoading(false);
        let imageUrl = '';
        let cloudinaryPublicId = '';
        if (imageFile) {
          const fd = new FormData();
          fd.append('file', imageFile);
          const uploadRes = await api.upload('/api/upload/image/posts', fd);
          imageUrl = uploadRes.url;
          cloudinaryPublicId = uploadRes.filename; // filename is the public_id
        }
        await api.post('/api/posts', {
          content,
          type: postType,
          imageUrl,
          cloudinaryPublicId,
          codeSnippet: postType === 'code' ? codeSnippet : undefined,
          codeLanguage: postType === 'code' ? codeLanguage : undefined,
        });
        navigate('/');
      } 
      else if (createMode === 'story') {
        if (!content.trim() && !imageFile) return setLoading(false);
        let imageUrl = '';
        let cloudinaryPublicId = '';
        if (imageFile) {
          const fd = new FormData();
          fd.append('file', imageFile);
          const uploadRes = await api.upload('/api/upload/image/stories', fd);
          imageUrl = uploadRes.url;
          cloudinaryPublicId = uploadRes.filename;
        }
        await api.post('/api/stories', {
          content: content || 'My Story',
          type: imageFile ? 'image' : 'text',
          imageUrl,
          cloudinaryPublicId
        });
        navigate('/');
      }
      else if (createMode === 'reel') {
        if (!reelTitle.trim() || !reelVideoFile) return setLoading(false);
        const fd = new FormData();
        fd.append('file', reelVideoFile);
        const uploadRes = await api.upload('/api/upload/video/reels', fd);
        
        await api.post('/api/reels', {
          title: reelTitle,
          videoUrl: uploadRes.url,
          cloudinaryPublicId: uploadRes.filename,
          hashtags: reelHashtags,
        });
        navigate('/reels');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (createMode === 'post') return !content.trim() && !imageFile && !codeSnippet.trim();
    if (createMode === 'story') return !content.trim() && !imageFile;
    if (createMode === 'reel') return !reelTitle.trim() || !reelVideoFile;
    return true;
  };

  return (
    <div className={`creative-suite-layout mode-${createMode}`}>
      {/* Dynamic Background Elements */}
      <div className="creative-bg-glow" />
      <div className="creative-bg-particles" />

      <div className="creative-content-wrapper">
        <header className="creative-header">
          <button className="back-blur-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          
          <div className="creative-header-center">
            <span className="creative-label">Creative Studio</span>
            <h2 className="creative-mode-title">
              {createMode.toUpperCase()}
            </h2>
          </div>

          <button 
            className="btn-share-exclusive" 
            onClick={handleSubmit} 
            disabled={isSubmitDisabled()}
          >
            {loading ? <div className="loader-dots"><span></span><span></span><span></span></div> : "Share"}
          </button>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="creative-error-banner"
          >
            <X size={14} /> <span>{error}</span>
          </motion.div>
        )}

        <main className="creative-main">
          {/* Main Mode Toggle: Creative Toolbar */}
          <div className="creative-toolbar">
            {[
              { key: 'post', icon: Grid, label: 'Post', gradient: 'from-cyan' },
              { key: 'story', icon: Image, label: 'Story', gradient: 'from-pink' },
              { key: 'reel', icon: Video, label: 'Reel', gradient: 'from-amber' },
            ].map(t => (
              <button
                key={t.key}
                className={`toolbar-item ${createMode === t.key ? 'active' : ''}`}
                onClick={() => {
                  setCreateMode(t.key);
                  removeFile();
                  setContent('');
                }}
              >
                <div className="toolbar-icon-box">
                  <t.icon size={20} />
                </div>
                <span>{t.label}</span>
                {createMode === t.key && <motion.div layoutId="active-bar" className="active-indicator" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={createMode}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-editor-container"
            >
              {/* POST MODE */}
              {createMode === 'post' && (
                <div className="post-editor-flow">
                  <div className="type-selector-pills">
                    {[
                      { key: 'text', icon: Type, label: 'Text' },
                      { key: 'image', icon: Image, label: 'Image' },
                      { key: 'code', icon: Code, label: 'Code' },
                    ].map(t => (
                      <button
                        key={t.key}
                        className={`type-pill ${postType === t.key ? 'active' : ''}`}
                        onClick={() => setPostType(t.key)}
                      >
                        <t.icon size={14} /> <span>{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="editor-input-area">
                    <textarea
                      placeholder={postType === 'code' ? "What's this code for?..." : "Share a thought, a lesson, or an achievement..."}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={postType === 'code' ? 2 : 5}
                      className="premium-textarea"
                    />

                    {postType !== 'code' && (
                      <button
                        className={`magic-ai-btn ${aiLoading ? 'loading' : ''}`}
                        onClick={generateCaption}
                        disabled={aiLoading}
                      >
                        <Sparkles size={16} />
                        <span>{aiLoading ? 'Magic in progress...' : 'Polish with AI'}</span>
                      </button>
                    )}

                    {postType === 'image' && (
                      <div className="image-drop-zone">
                        {imagePreview ? (
                          <div className="preview-frame">
                            <img src={imagePreview} alt="" />
                            <button className="remove-preview-btn" onClick={removeFile}>
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <label className="upload-placeholder">
                            <div className="upload-icon-ring"><Image size={32} /></div>
                            <h3>Append Visuals</h3>
                            <p>PNG, JPG, or GIF up to 10MB</p>
                            <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                          </label>
                        )}
                      </div>
                    )}

                    {postType === 'code' && (
                      <div className="code-editor-block">
                        <div className="code-header">
                          <div className="code-dots"><span /><span /><span /></div>
                          <select
                            value={codeLanguage}
                            onChange={e => setCodeLanguage(e.target.value)}
                            className="code-lang-select"
                          >
                            {['javascript', 'python', 'java', 'cpp', 'html', 'css', 'sql', 'other'].map(l => (
                              <option key={l} value={l}>{l.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          placeholder="// Paste your code snippet here..."
                          value={codeSnippet}
                          onChange={e => setCodeSnippet(e.target.value)}
                          rows={10}
                          className="terminal-input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STORY MODE */}
              {createMode === 'story' && (
                <div className="story-editor-flow">
                  <div className="story-preview-wrapper">
                    <div className="story-canvas">
                      {imagePreview ? (
                        <div className="story-image-fill">
                          <img src={imagePreview} alt="" />
                          <button className="remove-preview-btn top-right" onClick={removeFile}>
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <label className="story-upload-label">
                          <div className="story-icon-glow"><Image size={40} /></div>
                          <span>Pick a moment</span>
                          <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                        </label>
                      )}
                      
                      <div className="story-text-overlay">
                        <textarea
                          placeholder="Type something..."
                          value={content}
                          onChange={e => setContent(e.target.value)}
                          className="story-textarea"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REEL MODE */}
              {createMode === 'reel' && (
                <div className="reel-editor-flow">
                  <div className="reel-video-container">
                    {reelVideoPreview ? (
                      <div className="reel-preview-frame">
                        <video src={reelVideoPreview} controls />
                        <button className="remove-preview-btn" onClick={removeFile}>
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <label className="reel-upload-center">
                        <div className="reel-icon-pulsate"><Video size={48} /></div>
                        <h3>Cinematic Reel</h3>
                        <p>MP4 or MOV up to 60 seconds</p>
                        <input type="file" accept="video/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                      </label>
                    )}
                  </div>

                  <div className="reel-meta-fields">
                    <div className="glass-field">
                      <label>Caption</label>
                      <input
                        placeholder="Name your masterpiece..."
                        value={reelTitle}
                        onChange={e => setReelTitle(e.target.value)}
                      />
                    </div>
                    <div className="glass-field">
                      <label>Discovery Hashtags</label>
                      <input
                        placeholder="e.g. #productivity #study #code"
                        value={reelHashtags}
                        onChange={e => setReelHashtags(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        /* --- LAYOUT & THEMES --- */
        .creative-suite-layout {
          min-height: 100vh;
          background: #000;
          color: white;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 40px;
          transition: background 1s ease;
        }
        
        .mode-post { background: radial-gradient(circle at top right, #083344, #000); }
        .mode-story { background: radial-gradient(circle at top right, #450a0a, #000); }
        .mode-reel { background: radial-gradient(circle at top right, #1e1b4b, #000); }

        .creative-bg-glow {
          position: fixed;
          top: -10%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          filter: blur(120px);
          opacity: 0.3;
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
          transition: background 1s ease;
        }
        .mode-post .creative-bg-glow { background: #22d3ee; }
        .mode-story .creative-bg-glow { background: #ec4899; }
        .mode-reel .creative-bg-glow { background: #7c3aed; }

        .creative-content-wrapper {
          position: relative;
          z-index: 10;
          max-width: 600px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* --- HEADER --- */
        .creative-header {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .back-blur-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creative-header-center { text-align: center; }
        .creative-label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
        .creative-mode-title { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }

        .btn-share-exclusive {
          padding: 10px 24px;
          background: white;
          color: black;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn-share-exclusive:disabled { opacity: 0.4; pointer-events: none; }
        .btn-share-exclusive:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.2); }

        /* --- TOOLBAR --- */
        .creative-toolbar {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px;
          border-radius: 24px;
          margin: 20px 0 32px;
          position: relative;
        }

        .toolbar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 0;
          opacity: 0.4;
          transition: all 0.3s;
          position: relative;
          z-index: 2;
        }
        .toolbar-item.active { opacity: 1; }
        .toolbar-item span { font-size: 11px; font-weight: 700; }

        .toolbar-icon-box {
          width: 40px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .active-indicator {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          z-index: -1;
        }

        /* --- GLASS EDITOR --- */
        .glass-editor-container {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 32px;
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        /* POST FLOW */
        .type-selector-pills { display: flex; gap: 8px; margin-bottom: 24px; }
        .type-pill {
          padding: 6px 16px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255,255,255,0.5);
          transition: all 0.2s;
        }
        .type-pill.active { background: white; color: black; }

        .premium-textarea {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 18px;
          line-height: 1.6;
          resize: none;
          outline: none;
          padding: 0;
          margin-bottom: 24px;
        }
        .premium-textarea::placeholder { color: rgba(255,255,255,0.2); }

        .magic-ai-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 32px;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
          transition: all 0.3s;
        }
        .magic-ai-btn.loading { opacity: 0.7; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

        .image-drop-zone { width: 100%; }
        .preview-frame { position: relative; border-radius: 20px; overflow: hidden; }
        .preview-frame img { width: 100%; display: block; max-height: 400px; object-fit: cover; }
        
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 24px;
          transition: all 0.3s;
          cursor: pointer;
        }
        .upload-placeholder:hover { border-color: #22d3ee; background: rgba(34, 211, 238, 0.05); }
        .upload-icon-ring { width: 64px; height: 64px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #22d3ee; }
        .upload-placeholder h3 { font-size: 16px; margin: 0 0 4px; }
        .upload-placeholder p { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; }

        .remove-preview-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* CODE EDITOR */
        .code-editor-block {
          background: #0d0d0d;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .code-header { background: #1a1a1a; padding: 12px; display: flex; justify-content: space-between; align-items: center; }
        .code-dots { display: flex; gap: 6px; }
        .code-dots span { width: 10px; height: 10px; border-radius: 50%; }
        .code-dots span:nth-child(1) { background: #ff5f56; }
        .code-dots span:nth-child(2) { background: #ffbd2e; }
        .code-dots span:nth-child(3) { background: #27c93f; }
        .code-lang-select { background: transparent; border: none; color: #aaa; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .terminal-input {
          width: 100%;
          background: transparent;
          border: none;
          color: #22d3ee;
          font-family: 'Fira Code', 'Consolas', monospace;
          padding: 20px;
          font-size: 14px;
          outline: none;
          resize: none;
        }

        /* STORY FLOW */
        .story-canvas {
          aspect-ratio: 9/16;
          max-height: 60vh;
          width: 100%;
          background: #111;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          margin: 0 auto;
        }
        .story-upload-label { 
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
        }
        .story-icon-glow { color: #ec4899; filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.5)); }
        .story-image-fill { width: 100%; height: 100%; }
        .story-image-fill img { width: 100%; height: 100%; object-fit: cover; }
        .story-text-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%);
        }
        .story-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          color: white; font-size: 24px; font-weight: 800; text-align: center;
          text-shadow: 0 4px 10px rgba(0,0,0,0.5); resize: none;
        }

        /* REEL FLOW */
        .reel-video-container { aspect-ratio: 9/16; max-height: 50vh; background: #000; border-radius: 24px; overflow: hidden; margin-bottom: 24px; position: relative; }
        .reel-preview-frame { width: 100%; height: 100%; }
        .reel-preview-frame video { width: 100%; height: 100%; object-fit: cover; }
        .reel-upload-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
        .reel-icon-pulsate { color: #7c3aed; animation: pulsate 2s infinite; }
        @keyframes pulsate { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        
        .reel-meta-fields { display: flex; flex-direction: column; gap: 16px; }
        .glass-field {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 12px 16px;
        }
        .glass-field label { display: block; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 4px; }
        .glass-field input { width: 100%; background: transparent; border: none; color: white; font-size: 15px; outline: none; }

        .loader-dots { display: flex; gap: 4px; }
        .loader-dots span { width: 6px; height: 6px; background: black; border-radius: 50%; animation: bounce 0.6s infinite alternate; }
        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { to { transform: translateY(-4px); } }

        .creative-error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 12px 16px;
          border-radius: 14px;
          color: #fca5a5;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
