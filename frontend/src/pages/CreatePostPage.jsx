import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Image, Code, Type, Sparkles, X, Send, Video, Grid3X3, Film } from 'lucide-react';

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
        if (imageFile) {
          const fd = new FormData();
          fd.append('file', imageFile);
          const uploadRes = await api.upload('/api/upload/image/posts', fd);
          imageUrl = uploadRes.url;
        }
        await api.post('/api/posts', {
          content,
          type: postType,
          imageUrl,
          codeSnippet: postType === 'code' ? codeSnippet : undefined,
          codeLanguage: postType === 'code' ? codeLanguage : undefined,
        });
        navigate('/');
      } 
      else if (createMode === 'story') {
        if (!content.trim() && !imageFile) return setLoading(false);
        let imageUrl = '';
        if (imageFile) {
          const fd = new FormData();
          fd.append('file', imageFile);
          const uploadRes = await api.upload('/api/upload/image/stories', fd);
          imageUrl = uploadRes.url;
        }
        await api.post('/api/stories', {
          content: content || 'My Story',
          type: imageFile ? 'image' : 'text',
          imageUrl
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
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-back">
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Create</h2>
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitDisabled()} style={{ padding: '8px 20px' }}>
          {loading ? '...' : <><Send size={16} /> Share</>}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#ef4444', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Mode Tabs */}
      <div className="tabs" style={{ marginBottom: 12 }}>
        {[
          { key: 'post', icon: Grid3X3, label: 'Post' },
          { key: 'story', icon: Image, label: 'Story' },
          { key: 'reel', icon: Film, label: 'Reel' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab ${createMode === t.key ? 'active' : ''}`}
            onClick={() => {
              setCreateMode(t.key);
              removeFile();
              setContent('');
            }}
          >
            <t.icon size={16} style={{ marginRight: 6 }} />
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        style={{ padding: '4px 0 16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={createMode}
      >
        {/* POST MODE */}
        {createMode === 'post' && (
          <>
            <div className="sub-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'text', icon: Type, label: 'Text' },
                { key: 'image', icon: Image, label: 'Image' },
                { key: 'code', icon: Code, label: 'Code' },
              ].map(t => (
                <button
                  key={t.key}
                  className={`badge ${postType === t.key ? '' : 'inactive'}`}
                  style={{ opacity: postType === t.key ? 1 : 0.6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setPostType(t.key)}
                >
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              style={{ resize: 'none', marginBottom: 12 }}
            />

            {(postType === 'text' || postType === 'image') && (
              <button
                className="btn-secondary"
                onClick={generateCaption}
                disabled={aiLoading}
                style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <Sparkles size={16} /> {aiLoading ? 'Generating...' : 'AI Generate Caption'}
              </button>
            )}

            {postType === 'image' && (
              <div style={{ marginBottom: 16 }}>
                {imagePreview ? (
                  <div style={{ position: 'relative' }}>
                    <img src={imagePreview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 400, objectFit: 'cover' }} />
                    <button
                      className="btn-icon"
                      onClick={removeFile}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 40, border: '2px dashed var(--border-light)', borderRadius: 12, cursor: 'pointer',
                    color: 'var(--text-muted)', gap: 8
                  }}>
                    <Image size={40} />
                    <span>Tap to upload image</span>
                    <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                  </label>
                )}
              </div>
            )}

            {postType === 'code' && (
              <div style={{ marginBottom: 16 }}>
                <select
                  value={codeLanguage}
                  onChange={e => setCodeLanguage(e.target.value)}
                  style={{ marginBottom: 10, padding: 8, fontSize: 13 }}
                >
                  {['javascript', 'python', 'java', 'cpp', 'html', 'css', 'sql', 'other'].map(l => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Paste your code here..."
                  value={codeSnippet}
                  onChange={e => setCodeSnippet(e.target.value)}
                  rows={8}
                  style={{
                    fontFamily: 'Consolas, monospace',
                    fontSize: 13,
                    resize: 'vertical',
                    background: '#0d0d0d',
                    color: 'var(--accent-light)'
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* STORY MODE */}
        {createMode === 'story' && (
          <>
            <div style={{ marginBottom: 16 }}>
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 500, objectFit: 'cover' }} />
                  <button
                    className="btn-icon"
                    onClick={removeFile}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 60, border: '2px dashed var(--border-light)', borderRadius: 12, cursor: 'pointer',
                  color: 'var(--text-muted)', gap: 12, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))'
                }}>
                  <Image size={48} stroke="var(--accent-light)" />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Create Image Story</span>
                  <span style={{ fontSize: 12 }}>Or simply type text below</span>
                  <input type="file" accept="image/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                </label>
              )}
            </div>
            
            <input
              placeholder="Add some text to your story..."
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px' }}
            />
          </>
        )}

        {/* REEL MODE */}
        {createMode === 'reel' && (
          <>
            <div style={{ marginBottom: 16 }}>
              {reelVideoPreview ? (
                <div style={{ position: 'relative' }}>
                  <video src={reelVideoPreview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 500, objectFit: 'cover' }} />
                  <button
                    className="btn-icon"
                    onClick={removeFile}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 60, border: '2px dashed var(--border-light)', borderRadius: 12, cursor: 'pointer',
                  color: 'var(--text-muted)', gap: 12, background: '#0a0a0a'
                }}>
                  <Video size={48} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Upload Video for Reel</span>
                  <span style={{ fontSize: 12 }}>Max duration: 60 seconds</span>
                  <input type="file" accept="video/*" onChange={handleFileSelect} ref={fileInputRef} hidden />
                </label>
              )}
            </div>
            
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>Reel Title</label>
              <input
                placeholder="What's this reel about?"
                value={reelTitle}
                onChange={e => setReelTitle(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Hashtags (Optional)</label>
              <input
                placeholder="e.g. learning, webdev, react"
                value={reelHashtags}
                onChange={e => setReelHashtags(e.target.value)}
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
