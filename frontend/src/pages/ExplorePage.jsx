import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Film, 
  UserPlus, 
  UserCheck, 
  Users, 
  X, 
  Flame, 
  Sparkles,
  Compass,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'for_you', label: 'For you', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'reels', label: 'Reels', icon: Film },
  { id: 'creators', label: 'Creators', icon: Users },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('for_you');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [searching, setSearching] = useState(false);

  // Content state
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  // Modal preview state
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalComment, setModalComment] = useState('');
  const [modalComments, setModalComments] = useState([]);
  const [modalLiked, setModalLiked] = useState(false);
  const [modalLikesCount, setModalLikesCount] = useState(0);

  // Load initial explore content
  useEffect(() => {
    loadExploreContent();
  }, []);

  const loadExploreContent = async () => {
    setLoading(true);
    try {
      const [postsRes, reelsRes, creatorsRes] = await Promise.allSettled([
        api.get('/api/posts/explore?limit=30'),
        api.get('/api/reels'),
        api.get('/api/auth/explore')
      ]);

      if (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value)) {
        setPosts(postsRes.value);
      }
      if (reelsRes.status === 'fulfilled' && Array.isArray(reelsRes.value)) {
        setReels(reelsRes.value);
      }
      if (creatorsRes.status === 'fulfilled' && Array.isArray(creatorsRes.value)) {
        setCreators(creatorsRes.value);
      }
    } catch (e) {
      console.error('Failed to load explore content:', e);
    }
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setSearchResults({ users: [], posts: [] });
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(search.trim())}&type=all`);
        setSearchResults({
          users: Array.isArray(data?.users) ? data.users : [],
          posts: Array.isArray(data?.posts) ? data.posts : []
        });
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Follow/unfollow toggle
  const handleFollow = async (targetId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/api/auth/follow/${targetId}`);
      setFollowingMap(prev => ({ ...prev, [targetId]: res.following }));
    } catch (e) {
      console.error(e);
    }
  };

  // Open item modal
  const handleOpenItem = (item) => {
    if (item.isReel) {
      navigate('/reels');
      return;
    }
    setSelectedItem(item);
    const isLiked = item.likes?.some(l => (l._id || l) === (user?._id || user?.id));
    setModalLiked(isLiked);
    setModalLikesCount(item.likes?.length || 0);
    setModalComments(item.comments || []);
    setModalComment('');
  };

  const handleModalLike = async () => {
    if (!selectedItem?._id) return;
    const prevLiked = modalLiked;
    const prevCount = modalLikesCount;
    setModalLiked(!prevLiked);
    setModalLikesCount(c => c + (prevLiked ? -1 : 1));

    try {
      const res = await api.post(`/api/posts/${selectedItem._id}/like`);
      setModalLiked(res.liked);
      setModalLikesCount(res.likesCount);
      // Sync back to posts array
      setPosts(prev => prev.map(p => p._id === selectedItem._id ? { ...p, likes: res.liked ? [...(p.likes || []), user._id] : (p.likes || []).filter(l => (l._id || l) !== user._id) } : p));
    } catch {
      setModalLiked(prevLiked);
      setModalLikesCount(prevCount);
    }
  };

  const handleAddModalComment = async (e) => {
    e.preventDefault();
    if (!modalComment.trim() || !selectedItem?._id) return;
    try {
      const res = await api.post(`/api/posts/${selectedItem._id}/comment`, { content: modalComment.trim() });
      setModalComments(prev => [...prev, res]);
      setModalComment('');
      // Sync back to posts array
      setPosts(prev => prev.map(p => p._id === selectedItem._id ? { ...p, comments: [...(p.comments || []), res] } : p));
    } catch (err) {
      console.error(err);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Filter content based on category
  const getDisplayGrid = () => {
    if (activeCategory === 'reels') {
      return reels.map(r => ({ ...r, isReel: true }));
    }
    if (activeCategory === 'trending') {
      const sorted = [...posts].sort((a, b) => ((b.likes?.length || 0) + (b.comments?.length || 0)) - ((a.likes?.length || 0) + (a.comments?.length || 0)));
      return sorted;
    }
    // 'for_you' interleaves posts and reels
    const combined = [];
    let pIdx = 0, rIdx = 0;
    while (pIdx < posts.length || rIdx < reels.length) {
      if (pIdx < posts.length) combined.push(posts[pIdx++]);
      if (pIdx < posts.length) combined.push(posts[pIdx++]);
      if (rIdx < reels.length) combined.push({ ...reels[rIdx++], isReel: true });
    }
    return combined.length > 0 ? combined : posts;
  };

  const isSearchActive = Boolean(search.trim().length >= 2);
  const displayItems = getDisplayGrid();

  return (
    <div className="ig-explore-page">
      {/* ── Search Bar & Filter Header ── */}
      <header className="ig-explore-header">
        <div className="ig-explore-search-wrap">
          <Search size={18} className="ig-search-icon" />
          <input
            className="ig-search-input"
            placeholder="Search creators, photos, reels..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="ig-search-clear" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Pills Bar (only when not actively searching) */}
        {!isSearchActive && (
          <div className="ig-category-bar">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`ig-category-pill ${isActive ? 'active' : ''}`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Main Content Area ── */}
      <main className="ig-explore-content">
        {/* Active Search Results View */}
        {isSearchActive ? (
          <div className="ig-search-results-area">
            {searching ? (
              <div className="ig-explore-loading">
                <div className="loader-spinner" />
              </div>
            ) : searchResults.users.length === 0 && searchResults.posts.length === 0 ? (
              <div className="ig-empty-explore">
                <Compass size={48} strokeWidth={1.5} color="rgba(255,255,255,0.3)" />
                <h3>No results found</h3>
                <p>Try searching for a different username, topic, or keyword.</p>
              </div>
            ) : (
              <>
                {/* Users Found */}
                {searchResults.users.length > 0 && (
                  <div className="ig-search-section">
                    <h3 className="ig-section-title">Creators</h3>
                    <div className="ig-creators-list">
                      {searchResults.users.map(u => {
                        const isFollowed = followingMap[u._id] ?? u.followers?.some(f => (f._id || f) === (user?._id || user?.id));
                        return (
                          <div
                            key={u._id}
                            className="ig-creator-row"
                            onClick={() => navigate(`/profile/${u._id}`)}
                          >
                            <Avatar src={u.avatarUrl} name={u.name} size={44} />
                            <div className="ig-creator-info">
                              <span className="ig-creator-name">{u.name}</span>
                              <span className="ig-creator-sub">{u.followers?.length || 0} followers</span>
                            </div>
                            <button
                              className={`ig-follow-pill ${isFollowed ? 'following' : ''}`}
                              onClick={(e) => handleFollow(u._id, e)}
                            >
                              {isFollowed ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Posts Found */}
                {searchResults.posts.length > 0 && (
                  <div className="ig-search-section">
                    <h3 className="ig-section-title">Posts</h3>
                    <div className="ig-grid-container">
                      {searchResults.posts.map(p => (
                        <div
                          key={p._id}
                          className="ig-grid-item"
                          onClick={() => handleOpenItem(p)}
                        >
                          {p.imageUrl ? (
                            <img src={api.getFileUrl(p.imageUrl)} alt="" className="ig-grid-media" />
                          ) : (
                            <div className="ig-grid-text-card">
                              <p>{p.content?.slice(0, 80)}...</p>
                            </div>
                          )}
                          <div className="ig-grid-overlay">
                            <span className="ig-overlay-stat"><Heart size={18} fill="white" /> {p.likes?.length || 0}</span>
                            <span className="ig-overlay-stat"><MessageCircle size={18} fill="white" /> {p.comments?.length || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : activeCategory === 'creators' ? (
          /* ── Creators Discovery View ── */
          <div className="ig-creators-grid">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="ig-creator-card skeleton" style={{ height: 160 }} />
              ))
            ) : creators.length === 0 ? (
              <div className="ig-empty-explore">
                <Users size={48} strokeWidth={1.5} color="rgba(255,255,255,0.3)" />
                <h3>No creators recommended right now</h3>
                <p>Check back shortly as new creators join Sphere!</p>
              </div>
            ) : (
              creators.map(c => {
                const isFollowed = followingMap[c._id] ?? c.followers?.some(f => (f._id || f) === (user?._id || user?.id));
                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ig-creator-card"
                    onClick={() => navigate(`/profile/${c._id}`)}
                  >
                    <div className="ig-creator-avatar-ring">
                      <Avatar src={c.avatarUrl} name={c.name} size={64} />
                    </div>
                    <h4 className="ig-creator-card-name">{c.name}</h4>
                    <p className="ig-creator-card-bio">
                      {c.bio ? c.bio.slice(0, 50) + (c.bio.length > 50 ? '...' : '') : 'Sphere Student'}
                    </p>
                    <span className="ig-creator-card-stats">{c.followers?.length || 0} followers</span>
                    <button
                      className={`ig-creator-card-btn ${isFollowed ? 'following' : ''}`}
                      onClick={(e) => handleFollow(c._id, e)}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          /* ── 3-Column Instagram Explore Media Grid ── */
          <div className="ig-grid-container">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                <div key={i} className="ig-grid-item skeleton" />
              ))
            ) : displayItems.length === 0 ? (
              <div className="ig-empty-explore" style={{ gridColumn: '1 / -1' }}>
                <Compass size={48} strokeWidth={1.5} color="rgba(255,255,255,0.3)" />
                <h3>Explore is quiet</h3>
                <p>Be the first to share a post or reel with the community!</p>
              </div>
            ) : (
              displayItems.map((item, idx) => {
                const isReel = item.isReel;
                const likes = item.likes?.length || 0;
                const comments = item.comments?.length || 0;
                const mediaUrl = isReel ? item.videoUrl : item.imageUrl;

                return (
                  <motion.div
                    key={item._id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="ig-grid-item"
                    onClick={() => handleOpenItem(item)}
                  >
                    {isReel ? (
                      <div className="ig-grid-reel-wrapper">
                        <video src={api.getFileUrl(mediaUrl)} className="ig-grid-media" muted preload="metadata" />
                        <div className="ig-grid-badge">
                          <Film size={14} color="#ffffff" />
                        </div>
                      </div>
                    ) : item.imageUrl ? (
                      <img
                        src={api.getFileUrl(mediaUrl)}
                        alt=""
                        loading="lazy"
                        className="ig-grid-media"
                      />
                    ) : (
                      <div className="ig-grid-text-card">
                        <p>{item.content ? item.content.slice(0, 90) + '...' : 'Code Snippet'}</p>
                      </div>
                    )}

                    {/* Instagram Hover Overlay */}
                    <div className="ig-grid-overlay">
                      <span className="ig-overlay-stat">
                        <Heart size={18} fill="white" color="white" /> {likes}
                      </span>
                      <span className="ig-overlay-stat">
                        <MessageCircle size={18} fill="white" color="white" /> {comments}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ── Instagram Post Detail Preview Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="ig-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="ig-modal-dialog"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="ig-modal-close" onClick={() => setSelectedItem(null)}>
                <X size={20} />
              </button>

              {/* Left Side: Media */}
              <div className="ig-modal-media-col">
                {selectedItem.imageUrl ? (
                  <img
                    src={api.getFileUrl(selectedItem.imageUrl)}
                    alt=""
                    className="ig-modal-media-img"
                  />
                ) : selectedItem.type === 'code' && selectedItem.codeSnippet ? (
                  <pre className="ig-modal-code-pre">
                    <code>{selectedItem.codeSnippet}</code>
                  </pre>
                ) : (
                  <div className="ig-modal-text-hero">
                    <p>{selectedItem.content}</p>
                  </div>
                )}
              </div>

              {/* Right Side: Meta & Comments */}
              <div className="ig-modal-info-col">
                {/* Author Header */}
                <div className="ig-modal-author-bar">
                  <div
                    className="ig-modal-author-meta"
                    onClick={() => {
                      setSelectedItem(null);
                      navigate(`/profile/${selectedItem.author?._id || selectedItem.author}`);
                    }}
                  >
                    <Avatar
                      src={selectedItem.author?.avatarUrl}
                      name={selectedItem.author?.name}
                      size={36}
                    />
                    <span className="ig-modal-author-name">
                      {selectedItem.author?.name || 'Sphere Member'}
                    </span>
                  </div>
                  <button
                    className="ig-modal-view-btn"
                    onClick={() => {
                      setSelectedItem(null);
                      navigate(`/profile/${selectedItem.author?._id || selectedItem.author}`);
                    }}
                  >
                    View profile
                  </button>
                </div>

                {/* Caption & Comments Scroll */}
                <div className="ig-modal-scroll-area">
                  {selectedItem.content && (
                    <div className="ig-modal-comment-row caption">
                      <Avatar
                        src={selectedItem.author?.avatarUrl}
                        name={selectedItem.author?.name}
                        size={28}
                      />
                      <div className="ig-modal-comment-body">
                        <span className="ig-modal-comment-author">
                          {selectedItem.author?.name || 'Sphere Member'}
                        </span>
                        <p className="ig-modal-comment-text">{selectedItem.content}</p>
                      </div>
                    </div>
                  )}

                  {modalComments.map((c, i) => (
                    <div key={c._id || i} className="ig-modal-comment-row">
                      <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={28} />
                      <div className="ig-modal-comment-body">
                        <span className="ig-modal-comment-author">{c.author?.name || 'Member'}</span>
                        <p className="ig-modal-comment-text">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {modalComments.length === 0 && !selectedItem.content && (
                    <p className="ig-modal-no-comments">No comments yet.</p>
                  )}
                </div>

                {/* Actions & Like Count */}
                <div className="ig-modal-action-bar">
                  <div className="ig-modal-action-icons">
                    <button
                      className="ig-action-icon"
                      onClick={handleModalLike}
                      aria-label="Like"
                    >
                      <Heart
                        size={24}
                        fill={modalLiked ? '#ed4956' : 'none'}
                        color={modalLiked ? '#ed4956' : '#ffffff'}
                        strokeWidth={modalLiked ? 0 : 1.8}
                      />
                    </button>
                  </div>
                  <span className="ig-modal-likes-count">
                    {modalLikesCount.toLocaleString()} {modalLikesCount === 1 ? 'like' : 'likes'}
                  </span>
                </div>

                {/* Inline Comment Input */}
                <form className="ig-modal-comment-form" onSubmit={handleAddModalComment}>
                  <input
                    placeholder="Add a comment…"
                    value={modalComment}
                    onChange={e => setModalComment(e.target.value)}
                    className="ig-modal-comment-input"
                  />
                  <button
                    type="submit"
                    disabled={!modalComment.trim()}
                    className="ig-modal-post-btn"
                  >
                    Post
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CSS Styles ── */}
      <style>{`
        .ig-explore-page {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
          padding-bottom: 90px;
        }

        .ig-explore-header {
          position: sticky;
          top: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 14px 16px;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ig-explore-search-wrap {
          position: relative;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .ig-search-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.45);
          pointer-events: none;
        }

        .ig-search-input {
          width: 100%;
          background: #1c1c1f;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 38px 10px 42px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ig-search-input:focus {
          border-color: #0095f6;
          background: #141416;
        }

        .ig-search-clear {
          position: absolute;
          right: 12px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .ig-category-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ig-category-bar::-webkit-scrollbar {
          display: none;
        }

        .ig-category-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #1c1c1f;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .ig-category-pill:hover {
          color: #ffffff;
          background: #27272a;
        }
        .ig-category-pill.active {
          background: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .ig-explore-content {
          max-width: 935px;
          margin: 0 auto;
          padding: 16px 8px;
        }

        @media (min-width: 768px) {
          .ig-explore-content {
            padding: 24px 20px;
          }
        }

        /* ── 3-Column Square Media Grid ── */
        .ig-grid-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        @media (min-width: 768px) {
          .ig-grid-container {
            gap: 16px;
          }
        }

        .ig-grid-item {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #121214;
          overflow: hidden;
          cursor: pointer;
        }
        @media (min-width: 768px) {
          .ig-grid-item {
            border-radius: 4px;
          }
        }

        .ig-grid-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ig-grid-reel-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .ig-grid-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          border-radius: 6px;
          padding: 4px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .ig-grid-text-card {
          width: 100%;
          height: 100%;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.8);
          background: linear-gradient(135deg, #1c1c1f 0%, #121214 100%);
        }

        /* Hover Overlay */
        .ig-grid-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .ig-grid-item:hover .ig-grid-overlay {
          opacity: 1;
        }

        .ig-overlay-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 15px;
          color: #ffffff;
        }

        /* ── Creators Grid View ── */
        .ig-creators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .ig-creator-card {
          background: #121214;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .ig-creator-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .ig-creator-avatar-ring {
          padding: 2px;
          border-radius: 50%;
          background: linear-gradient(45deg, #f09433, #dc2743, #bc1888);
          margin-bottom: 12px;
        }

        .ig-creator-card-name {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .ig-creator-card-bio {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 8px;
          line-height: 1.4;
          height: 34px;
          overflow: hidden;
        }

        .ig-creator-card-stats {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
          margin-bottom: 14px;
        }

        .ig-creator-card-btn {
          width: 100%;
          padding: 7px 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: #0095f6;
          color: #ffffff;
          transition: background 0.15s ease;
        }
        .ig-creator-card-btn.following {
          background: #27272a;
          color: #ffffff;
        }

        /* ── Search Results List ── */
        .ig-search-section {
          margin-bottom: 32px;
        }
        .ig-section-title {
          font-size: 14px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ig-creators-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ig-creator-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          background: #121214;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
        }
        .ig-creator-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ig-creator-name {
          font-size: 14px;
          font-weight: 700;
        }
        .ig-creator-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }
        .ig-follow-pill {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          background: #0095f6;
          color: white;
          border: none;
          cursor: pointer;
        }
        .ig-follow-pill.following {
          background: #27272a;
        }

        .ig-empty-explore {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .ig-empty-explore h3 {
          font-size: 18px;
          font-weight: 700;
        }
        .ig-empty-explore p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          max-width: 320px;
        }

        /* ── Instagram Post Detail Preview Modal ── */
        .ig-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .ig-modal-dialog {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          width: 100%;
          max-width: 950px;
          height: 85vh;
          max-height: 720px;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        @media (max-width: 767px) {
          .ig-modal-dialog {
            flex-direction: column;
            height: 90vh;
          }
        }

        .ig-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .ig-modal-media-col {
          flex: 1.3;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .ig-modal-media-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .ig-modal-code-pre {
          padding: 24px;
          color: #a78bfa;
          font-size: 13px;
          line-height: 1.5;
          max-height: 80%;
          overflow: auto;
          background: #111114;
          border-radius: 8px;
          width: 85%;
        }

        .ig-modal-text-hero {
          padding: 32px;
          color: #ffffff;
          font-size: 18px;
          line-height: 1.6;
          text-align: center;
        }

        .ig-modal-info-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          background: #000000;
        }

        @media (max-width: 767px) {
          .ig-modal-info-col {
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
        }

        .ig-modal-author-bar {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .ig-modal-author-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .ig-modal-author-name {
          font-weight: 700;
          font-size: 14px;
        }

        .ig-modal-view-btn {
          font-size: 12px;
          color: #0095f6;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
        }

        .ig-modal-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ig-modal-comment-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .ig-modal-comment-body {
          font-size: 13.5px;
          line-height: 1.4;
        }

        .ig-modal-comment-author {
          font-weight: 700;
          margin-right: 6px;
        }

        .ig-modal-comment-text {
          color: rgba(255, 255, 255, 0.9);
          display: inline;
        }

        .ig-modal-no-comments {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          text-align: center;
          margin: 30px 0;
        }

        .ig-modal-action-bar {
          padding: 12px 16px 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ig-modal-action-icons {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ig-modal-likes-count {
          font-size: 13px;
          font-weight: 700;
        }

        .ig-modal-comment-form {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          gap: 8px;
        }

        .ig-modal-comment-input {
          flex: 1;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .ig-modal-post-btn {
          color: #0095f6;
          font-weight: 700;
          font-size: 13.5px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .ig-modal-post-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
