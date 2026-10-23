import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ArrowLeft, 
  Flame, 
  MessageCircle, 
  Heart, 
  Grid3X3, 
  Film, 
  Plus, 
  UserPlus, 
  Bookmark, 
  List,
  Sparkles,
  Share2,
  X
} from 'lucide-react';
import { BRAND } from '../config/brand';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === user?._id || userId === user?.id;
  const [profile, setProfile] = useState(isOwnProfile && user ? user : null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'feed'
  const [selectedPost, setSelectedPost] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(!user);

  const loadProfile = async () => {
    try {
      const profileData = isOwnProfile
        ? await api.get('/api/auth/profile')
        : await api.get(`/api/auth/profile/${userId}`);
      setProfile(profileData);
      
      const currentUserId = user?._id || user?.id;
      setIsFollowing(profileData.followers?.some(f => (f._id || f) === currentUserId));

      // Load user's posts and reels
      try {
        const targetId = userId || currentUserId;
        const [userPosts, userReels] = await Promise.all([
           api.get(`/api/posts/user/${targetId}`),
           api.get(`/api/reels/user/${targetId}`)
        ]);
        setPosts(userPosts || []);
        setReels(userReels || []);

        if (isOwnProfile) {
          try {
            const saved = await api.get('/api/posts/bookmarks');
            setSavedPosts(saved || []);
          } catch {}
        }
      } catch (e) { console.error(e); }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleFollow = async () => {
    try {
      const res = await api.post(`/api/auth/follow/${userId}`);
      setIsFollowing(res.following);
      loadProfile();
    } catch (e) { console.error(e); }
  };


  if (loading) {
    return (
      <div className="premium-profile-layout">
        <SkeletonLoader type="profile" />
      </div>
    );
  }

  return (
    <div className="premium-profile-layout">
      {/* Dynamic Background Mesh */}
      <div className="profile-banner-mesh"></div>

      {/* Mobile-only Header */}
      <header className="profile-mobile-header">
        {!isOwnProfile && (
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="header-username">{profile?.name}</h1>
        <div className="header-actions">
          {isOwnProfile && (
            <button className="settings-btn" onClick={() => navigate('/profile/edit')}>
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="profile-scroll-area">
        {/* Profile Hero Header Card */}
        <div className="profile-hero-card">
          {/* Avatar Column */}
          <div className="hero-avatar-col">
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="portrait-wrapper"
            >
              <div className="profile-avatar-container">
                <Avatar src={profile?.avatarUrl} name={profile?.name} size={150} />
              </div>
              {profile?.studyStreak > 0 && (
                <div className="streak-badge">
                  <Flame size={14} fill="#f97316" />
                  <span>{profile.studyStreak} Vibe</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* User Meta Column */}
          <div className="hero-meta-col">
            {/* Row 1: Username & Action Buttons */}
            <div className="hero-user-row">
              <h2 className="profile-heading-username">{profile?.name}</h2>

              {isOwnProfile ? (
                <div className="hero-btns-group">
                  <button className="pill-btn-dark" onClick={() => navigate('/profile/edit')}>
                    Edit profile
                  </button>
                  <button 
                    className="pill-btn-dark"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Profile link copied to clipboard!');
                      }
                    }}
                  >
                    Share profile
                  </button>
                  <button className="pill-btn-icon-dark" onClick={() => navigate('/profile/edit')}>
                    <Settings size={18} />
                  </button>
                </div>
              ) : (
                <div className="hero-btns-group">
                  <button 
                    className={isFollowing ? "pill-btn-dark" : "pill-btn-primary"} 
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="pill-btn-dark" onClick={() => navigate(`/chat/${userId}`)}>
                    <MessageCircle size={18} />
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Stats Row (Posts, Followers, Following) */}
            <div className="hero-stats-row">
              <div className="stat-unit">
                <span className="stat-val">{posts.length}</span>
                <span className="stat-lbl">posts</span>
              </div>
              <div className="stat-unit">
                <span className="stat-val">{profile?.followers?.length || 0}</span>
                <span className="stat-lbl">followers</span>
              </div>
              <div className="stat-unit">
                <span className="stat-val">{profile?.following?.length || 0}</span>
                <span className="stat-lbl">following</span>
              </div>
            </div>

            {/* Row 3: Bio & Skills */}
            <div className="hero-bio-block">
              <div className="display-name">{profile?.name}</div>
              {profile?.bio && (
                <div className="bio-text">{profile.bio}</div>
              )}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="skill-cloud">
                  {profile.skills.map(s => (
                    <span key={s} className="skill-pill">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section & Tabs */}
        <div className="profile-content-container">
          <div className="section-tab-header">
            <div className="tab-buttons-group">
              <button 
                className={`tab-btn ${activeTab === 'posts' ? 'active-tab' : ''}`} 
                onClick={() => setActiveTab('posts')}
              >
                <Grid3X3 size={16} />
                <span>POSTS</span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'reels' ? 'active-tab' : ''}`} 
                onClick={() => setActiveTab('reels')}
              >
                <Film size={16} />
                <span>REELS</span>
              </button>
              {isOwnProfile && (
                <button 
                  className={`tab-btn ${activeTab === 'saved' ? 'active-tab' : ''}`} 
                  onClick={() => setActiveTab('saved')}
                >
                  <Bookmark size={16} />
                  <span>SAVED</span>
                </button>
              )}
            </div>

            {/* View Mode Toggle (Grid vs Feed) for posts */}
            {activeTab === 'posts' && posts.length > 0 && (
              <div className="view-mode-toggle">
                <button 
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <Grid3X3 size={18} />
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'feed' ? 'active' : ''}`}
                  onClick={() => setViewMode('feed')}
                  title="Feed view"
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="empty-portfolio">
                <div className="empty-icon-circle">
                  <Grid3X3 size={32} />
                </div>
                <h3>No Posts Yet</h3>
                <p>When {isOwnProfile ? 'you share photos and ideas' : `${profile?.name} shares posts`}, they will appear here.</p>
                {isOwnProfile && (
                  <button className="create-first-btn" onClick={() => navigate('/create')}>
                    Share your first post
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="profile-posts-grid">
                {posts.map((post) => (
                  <div 
                    key={post._id} 
                    className="grid-post-tile"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.imageUrl ? (
                      <img 
                        src={api.getFileUrl(post.imageUrl)} 
                        alt="Post thumbnail" 
                        className="tile-media"
                        loading="lazy"
                      />
                    ) : (
                      <div className="tile-text-placeholder">
                        <p>{post.content || 'Code Snippet'}</p>
                      </div>
                    )}

                    {/* Hover Stats Overlay */}
                    <div className="tile-hover-overlay">
                      <div className="tile-stat">
                        <Heart size={18} fill="#ffffff" color="#ffffff" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="tile-stat">
                        <MessageCircle size={18} fill="#ffffff" color="#ffffff" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="posts-stack">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onUpdate={loadProfile} />
                ))}
              </div>
            )
          )}

          {/* Reels Tab Content */}
          {activeTab === 'reels' && (
            reels.length === 0 ? (
              <div className="empty-portfolio">
                <div className="empty-icon-circle">
                  <Film size={32} />
                </div>
                <h3>No Reels Captured Yet</h3>
                <p>Short videos and interactive reels will be archived here.</p>
                {isOwnProfile && (
                  <button className="create-first-btn" onClick={() => navigate('/create')}>
                    Create a Reel
                  </button>
                )}
              </div>
            ) : (
              <div className="reels-grid-profile">
                {reels.map((reel) => (
                  <div 
                    key={reel._id}
                    className="profile-reel-thumbnail"
                    onClick={() => navigate('/reels')}
                  >
                    <video 
                      src={api.getFileUrl(reel.videoUrl)} 
                      className="reel-video-preview" 
                      preload="metadata"
                    />
                    <div className="reel-thumbnail-icon">
                      <Film size={24} color="white" />
                    </div>
                    <div className="reel-meta-badge">
                      <Heart size={14} fill="white" color="white" />
                      <span>{reel.likes?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Saved Bookmarks Tab Content */}
          {activeTab === 'saved' && (
            savedPosts.length === 0 ? (
              <div className="empty-portfolio">
                <div className="empty-icon-circle">
                  <Bookmark size={32} />
                </div>
                <h3>Save Posts</h3>
                <p>Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.</p>
              </div>
            ) : (
              <div className="profile-posts-grid">
                {savedPosts.map((post) => (
                  <div 
                    key={post._id} 
                    className="grid-post-tile"
                    onClick={() => setSelectedPost(post)}
                  >
                    {post.imageUrl ? (
                      <img 
                        src={api.getFileUrl(post.imageUrl)} 
                        alt="Saved post" 
                        className="tile-media"
                        loading="lazy"
                      />
                    ) : (
                      <div className="tile-text-placeholder">
                        <p>{post.content}</p>
                      </div>
                    )}
                    <div className="tile-hover-overlay">
                      <div className="tile-stat">
                        <Heart size={18} fill="#ffffff" color="#ffffff" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="tile-stat">
                        <MessageCircle size={18} fill="#ffffff" color="#ffffff" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* Selected Post Modal (When clicking grid tile) */}
      <AnimatePresence>
        {selectedPost && (
          <div className="post-modal-backdrop" onClick={() => setSelectedPost(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="post-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="post-modal-close" onClick={() => setSelectedPost(null)}>
                <X size={22} />
              </button>
              <div className="post-modal-inner">
                <PostCard post={selectedPost} onUpdate={() => { loadProfile(); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .premium-profile-layout {
          background: #000000;
          min-height: 100vh;
          position: relative;
          color: white;
          padding-bottom: 60px;
        }

        .profile-banner-mesh {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 240px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%);
          filter: blur(60px);
          z-index: 0;
          pointer-events: none;
        }

        /* Mobile Header */
        .profile-mobile-header {
          position: sticky;
          top: 0;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(20px);
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
          z-index: 100;
        }

        .header-username {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .back-btn, .settings-btn {
          background: none;
          border: none;
          color: #ffffff;
          padding: 6px;
          cursor: pointer;
        }

        /* Profile Scroll Area */
        .profile-scroll-area {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 935px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Hero Card Layout */
        .profile-hero-card {
          padding: 24px 0 32px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
        }

        /* Mobile Adjustments (< 768px) */
        @media (max-width: 767px) {
          .profile-scroll-area {
            padding: 0 16px;
          }

          .profile-hero-card {
            flex-direction: column;
            gap: 16px;
            padding: 16px 0 24px 0;
          }

          .hero-avatar-col {
            display: flex;
            align-items: center;
            justify-content: flex-start;
          }

          .profile-avatar-container :global(.avatar) {
            width: 86px !important;
            height: 86px !important;
          }

          .hero-user-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .hero-btns-group {
            width: 100%;
          }

          .hero-btns-group .pill-btn-dark,
          .hero-btns-group .pill-btn-primary {
            flex: 1;
          }
        }

        /* Desktop Adjustments (>= 768px) */
        @media (min-width: 768px) {
          .profile-mobile-header {
            display: none !important;
          }

          .profile-hero-card {
            flex-direction: row;
            align-items: flex-start;
            gap: 80px;
            padding: 36px 0 44px 0;
          }

          .hero-avatar-col {
            flex-shrink: 0;
            display: flex;
            justify-content: center;
            padding-left: 36px;
          }

          .hero-meta-col {
            flex: 1;
            min-width: 0;
          }
        }

        .portrait-wrapper {
          position: relative;
          display: inline-block;
        }

        .streak-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: #000000;
          border: 1px solid #f97316;
          border-radius: 12px;
          padding: 2px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
        }

        .hero-user-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .profile-heading-username {
          font-size: 20px;
          font-weight: 500;
          color: #ffffff;
        }

        .hero-btns-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pill-btn-dark {
          padding: 7px 16px;
          background: #363636;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s ease;
        }
        .pill-btn-dark:hover {
          background: #262626;
        }

        .pill-btn-icon-dark {
          padding: 7px 10px;
          background: #363636;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pill-btn-icon-dark:hover {
          background: #262626;
        }

        .pill-btn-primary {
          padding: 7px 20px;
          background: #0095f6;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pill-btn-primary:hover {
          background: #1877f2;
        }

        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: 40px;
          margin-bottom: 20px;
        }

        .stat-unit {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
        }

        .stat-val {
          font-weight: 700;
          color: #ffffff;
        }

        .stat-lbl {
          color: #f5f5f5;
        }

        .hero-bio-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .display-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .bio-text {
          font-size: 14px;
          color: #f5f5f5;
          line-height: 1.5;
          white-space: pre-line;
        }

        .skill-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .skill-pill {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          color: #a8a8a8;
        }

        /* Tabs Section */
        .section-tab-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
        }

        .tab-buttons-group {
          display: flex;
          justify-content: center;
          gap: 48px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #71717a;
          padding: 16px 0;
          background: none;
          border: none;
          border-top: 1.5px solid transparent;
          margin-top: -1px;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .tab-btn.active-tab {
          color: #ffffff;
          border-top-color: #ffffff;
        }

        .view-mode-toggle {
          position: absolute;
          right: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-mode-btn {
          background: none;
          border: none;
          color: #71717a;
          padding: 6px;
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.15s ease;
        }
        .view-mode-btn.active {
          color: #ffffff;
        }

        /* ------------------------------------------
           3-COLUMN INSTAGRAM SQUARE POST GRID
           ------------------------------------------ */
        .profile-posts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }

        @media (min-width: 768px) {
          .profile-posts-grid {
            gap: 24px;
          }
        }

        .grid-post-tile {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #121214;
          overflow: hidden;
          cursor: pointer;
          border-radius: 4px;
        }

        .tile-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }

        .tile-text-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
          color: #a8a8a8;
          font-size: 13px;
          text-align: center;
          overflow: hidden;
        }

        .tile-hover-overlay {
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

        .grid-post-tile:hover .tile-hover-overlay {
          opacity: 1;
        }

        .grid-post-tile:hover .tile-media {
          transform: scale(1.02);
        }

        .tile-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Reels Grid */
        .reels-grid-profile {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (min-width: 768px) {
          .reels-grid-profile {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }

        .profile-reel-thumbnail {
          aspect-ratio: 9 / 16;
          border-radius: 8px;
          overflow: hidden;
          background: #121214;
          position: relative;
          cursor: pointer;
        }

        .reel-video-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reel-thumbnail-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          color: white;
        }

        .reel-meta-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }

        .posts-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .empty-portfolio {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }

        .create-first-btn {
          margin-top: 8px;
          background: #0095f6;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          border: none;
          cursor: pointer;
        }

        /* Modal Dialog for Post Preview */
        .post-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .post-modal-content {
          position: relative;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          background: #000000;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .post-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
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
      `}</style>
    </div>
  );
}
