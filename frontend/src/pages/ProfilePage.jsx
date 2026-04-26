import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ArrowLeft, Flame, MessageCircle, Heart, Grid3X3, Briefcase, GraduationCap, Film, Plus, UserPlus } from 'lucide-react';
import { BRAND } from '../config/brand';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === user?._id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const profileData = isOwnProfile
        ? await api.get('/api/auth/profile')
        : await api.get(`/api/auth/profile/${userId}`);
      setProfile(profileData);
      
      const currentUserId = user?._id || user?.id;
      setIsFollowing(profileData.followers?.some(f => (f._id || f) === currentUserId));

      // Load user's posts, reels, stories using dedicated endpoints
      try {
        const targetId = userId || currentUserId;
        const [userPosts, userReels] = await Promise.all([
           api.get(`/api/posts/user/${targetId}`),
           api.get(`/api/reels/user/${targetId}`)
        ]);
        setPosts(userPosts);
        setReels(userReels);
      } catch {}
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    try {
      const res = await api.post(`/api/auth/follow/${userId}`);
      setIsFollowing(res.following);
      loadProfile();
    } catch {}
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
      {/* Dynamic Background */}
      <div className="profile-banner-mesh"></div>

      {/* Header */}
      <header className="profile-glass-header">
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
        {/* Profile Card */}
        <div className="profile-hero-card">
          <div className="hero-top" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="portrait-wrapper"
              style={{ position: 'relative' }}
            >
              <Avatar src={profile?.avatarUrl} name={profile?.name} size={90} />
              {profile?.studyStreak > 0 && (
                <div className="streak-badge">
                  <Flame size={14} fill="#f97316" />
                  <span>{profile.studyStreak} Vibe</span>
                </div>
              )}
            </motion.div>

            <div className="hero-right" style={{ flex: 1, paddingTop: '4px' }}>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>
                {profile?.name?.split(' ')[0]}
              </div>
              <div className="hero-stats" style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '20px' }}>
                <div className="stat-box">
                  <span className="stat-val">{posts.length}</span>
                  <span className="stat-lbl">posts</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">{profile?.followers?.length || 0}</span>
                  <span className="stat-lbl">followers</span>
                </div>
                <div className="stat-box">
                  <span className="stat-val">{profile?.following?.length || 0}</span>
                  <span className="stat-lbl">following</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-bio-section" style={{ marginTop: '20px' }}>
            <h2 className="display-name" style={{ fontSize: 16, fontWeight: 600, marginBottom: '4px' }}>{profile?.name}</h2>
            {profile?.bio && <div className="bio-text" style={{ whiteSpace: 'pre-line', fontSize: 15, lineHeight: 1.4, margin: '4px 0 16px 0', color: 'rgba(255,255,255,0.9)' }}>{profile.bio}</div>}
            {!profile?.bio && (
              <div className="title-tag">
                <GraduationCap size={14} />
                <span>{BRAND.memberTitle}</span>
              </div>
            )}
            
            {profile?.skills && profile.skills.length > 0 && (
              <div className="skill-cloud">
                {profile.skills.map(s => (
                  <span key={s} className="skill-pill">{s}</span>
                ))}
              </div>
            )}
          </div>

          <div className="hero-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isOwnProfile ? (
              <>
                <button className="pill-outline-btn" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} /> Add banners
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="pill-btn-dark" onClick={() => navigate('/profile/edit')} style={{ flex: 1 }}>
                    Edit profile
                  </button>
                  <button className="pill-btn-dark" style={{ flex: 1 }}>
                    Share profile
                  </button>
                  <button className="pill-btn-icon-dark">
                    <UserPlus size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="action-button-row" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={isFollowing ? "pill-btn-dark" : "pill-btn-primary"} 
                  onClick={handleFollow}
                  style={{ flex: 2 }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="pill-btn-dark" onClick={() => navigate(`/chat/${userId}`)} style={{ flex: 1 }}>
                  <MessageCircle size={18} />
                </button>
                <button className="pill-btn-dark" onClick={() => navigate(`/partner-chat/${userId}`)} style={{ flex: 1, color: '#ec4899' }}>
                  <Heart size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="profile-content-grid">
          <div className="section-tab-header">
            <button className={`tab-btn ${activeTab === 'posts' ? 'active-tab' : ''}`} onClick={() => setActiveTab('posts')}>
              <Grid3X3 size={18} />
              <span>{BRAND.feedTitle}</span>
            </button>
            <button className={`tab-btn ${activeTab === 'reels' ? 'active-tab' : ''}`} onClick={() => setActiveTab('reels')}>
              <Film size={18} />
              <span>Reels</span>
            </button>
          </div>

          <div className="posts-stack">
            {activeTab === 'posts' && (
              posts.length === 0 ? (
              <div className="empty-portfolio">
                <Grid3X3 size={40} />
                <p>No moments shared yet.</p>
              </div>
            ) : (
              posts.map((post, i) => (
                <motion.div 
                  key={post._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PostCard post={post} onUpdate={loadProfile} />
                </motion.div>
              ))
              )
            )}

            {activeTab === 'reels' && (
              reels.length === 0 ? (
                <div className="empty-portfolio">
                  <Film size={40} />
                  <p>No reels captured yet.</p>
                </div>
              ) : (
                <div className="reels-grid-profile">
                  {reels.map((reel, i) => (
                    <motion.div 
                      key={reel._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="profile-reel-thumbnail"
                      onClick={() => navigate('/reels')}
                    >
                      <video src={api.getFileUrl(reel.videoUrl)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      <div className="reel-thumbnail-icon">
                         <Film size={24} color="white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>


      <style>{`
        .premium-profile-layout {
          background: #000000;
          min-height: 100vh;
          position: relative;
          color: white;
          padding-bottom: 90px;
        }

        .profile-banner-mesh {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 240px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
          filter: blur(60px);
          z-index: 0;
        }

        .profile-glass-header {
          position: sticky;
          top: 0;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          z-index: 100;
        }

        .header-username {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .profile-scroll-area {
          position: relative;
          z-index: 10;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
        }

        .profile-hero-card {
          background: #0f1115;
          padding: 20px 16px;
        }

        .hero-top {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .portrait-wrapper {
          position: relative;
        }
        .vibe-bubble {
          position: absolute;
          top: -30px;
          left: -10px;
          background: #2a2c33;
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          padding: 8px 12px;
          border-radius: 16px;
          z-index: 20;
          white-space: nowrap;
          text-align: center;
          line-height: 1.2;
        }
        .vibe-bubble::after {
          content: '';
          position: absolute;
          bottom: -6px;
          right: 20px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #2a2c33;
        }
        .story-ring-profile {
          padding: 4px;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .story-ring-profile:hover {
          transform: scale(1.02);
        }
        .story-ring-profile.has-story {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }
        .add-story-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 2px solid #0f1115;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .add-story-btn:hover {
          transform: scale(1.1);
        }
        .streak-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: black;
          border: 1px solid #f97316;
          border-radius: 12px;
          padding: 2px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
        }

        .hero-stats {
          flex: 1;
          display: flex;
          justify-content: space-around;
        }
        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }
        .stat-val {
          font-size: 16px;
          font-weight: 600;
        }
        .stat-lbl {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0px;
          text-transform: none;
        }

        .hero-bio-section {
          margin-bottom: 24px;
        }
        .display-name {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .title-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #a78bfa;
          margin-bottom: 12px;
        }
        .bio-text {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 16px;
        }

        .skill-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .skill-pill {
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .hero-actions {
          display: flex;
          gap: 12px;
        }
        .pill-outline-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .pill-btn-dark {
          padding: 8px 16px;
          background: #2a2c33;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pill-btn-icon-dark {
          padding: 0 12px;
          background: #2a2c33;
          color: white;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .pill-btn-primary {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .pill-btn-dark:hover, .pill-outline-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .section-tab-header {
          display: flex;
          justify-content: center;
          gap: 40px;
          padding: 24px 0 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.5);
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          text-transform: uppercase;
        }
        .tab-btn.active-tab {
          color: white;
          border-bottom: 2px solid white;
        }
        .reels-grid-profile {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .profile-reel-thumbnail {
          aspect-ratio: 9/16;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          position: relative;
          cursor: pointer;
        }
        .profile-reel-thumbnail video {
          transition: transform 0.3s;
        }
        .profile-reel-thumbnail:hover video {
          transform: scale(1.05);
        }
        .reel-thumbnail-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .profile-reel-thumbnail:hover .reel-thumbnail-icon {
          opacity: 1;
        }

        .posts-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .empty-portfolio {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
