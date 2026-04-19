import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ArrowLeft, Flame, MessageCircle, Heart, Grid3X3, Briefcase, GraduationCap } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
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

      // Load user's posts using dedicated endpoint
      try {
        const targetId = userId || currentUserId;
        const userPosts = await api.get(`/api/posts/user/${targetId}`);
        setPosts(userPosts);
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
          <div className="hero-top">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="portrait-wrapper"
            >
              <Avatar src={profile?.avatarUrl} name={profile?.name} size={110} />
              {profile?.studyStreak > 0 && (
                <div className="streak-badge">
                  <Flame size={14} fill="#f97316" />
                  <span>{profile.studyStreak}</span>
                </div>
              )}
            </motion.div>

            <div className="hero-stats">
              <div className="stat-box">
                <span className="stat-val">{posts.length}</span>
                <span className="stat-lbl">Posts</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">{profile?.followers?.length || 0}</span>
                <span className="stat-lbl">Followers</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">{profile?.following?.length || 0}</span>
                <span className="stat-lbl">Following</span>
              </div>
            </div>
          </div>

          <div className="hero-bio-section">
            <h2 className="display-name">{profile?.name}</h2>
            <div className="title-tag">
              <GraduationCap size={14} />
              <span>ACN+ Student Member</span>
            </div>
            {profile?.bio && <p className="bio-text">{profile.bio}</p>}
            
            <div className="skill-cloud">
              {profile?.skills?.map(s => (
                <span key={s} className="skill-pill">{s}</span>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            {isOwnProfile ? (
              <button className="btn-edit-active" onClick={() => navigate('/profile/edit')}>
                Edit Personal Portfolio
              </button>
            ) : (
              <div className="action-button-row">
                <button 
                  className={isFollowing ? "btn-unfollow" : "btn-follow-cta"} 
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Connect +'}
                </button>
                <button className="btn-message-circle" onClick={() => navigate(`/chat/${userId}`)}>
                  <MessageCircle size={18} />
                </button>
                <button className="btn-partner-heart" onClick={() => navigate(`/partner-chat/${userId}`)}>
                  <Heart size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="profile-content-grid">
          <div className="section-tab-header">
            <div className="active-tab">
              <Grid3X3 size={18} />
              <span>ACADEMIC FEED</span>
            </div>
          </div>

          <div className="posts-stack">
            {posts.length === 0 ? (
              <div className="empty-portfolio">
                <Briefcase size={40} />
                <p>Knowledge base is currently empty.</p>
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
          padding: 0 16px;
        }

        .profile-hero-card {
          background: rgba(15, 15, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 24px;
          margin-top: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
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
          align-items: center;
        }
        .stat-val {
          font-size: 20px;
          font-weight: 800;
        }
        .stat-lbl {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
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
        .btn-edit-active {
          width: 100%;
          padding: 14px;
          background: white;
          color: black;
          border-radius: 16px;
          font-weight: 700;
          font-size: 14px;
        }
        
        .action-button-row {
          display: flex;
          width: 100%;
          gap: 10px;
        }
        .btn-follow-cta {
          flex: 2;
          background: white;
          color: black;
          border-radius: 14px;
          font-weight: 700;
        }
        .btn-unfollow {
          flex: 2;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          border-radius: 14px;
          font-weight: 700;
        }
        .btn-message-circle, .btn-partner-heart {
          flex: 1;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .btn-message-circle:hover { background: rgba(255,255,255,0.1); }
        .btn-follow-cta, .btn-unfollow {
          height: 48px;
          padding: 0 20px;
        }
        .btn-partner-heart { color: #ec4899; }
        .btn-partner-heart:hover { background: rgba(236,72,153,0.1); }

        .section-tab-header {
          display: flex;
          justify-content: center;
          padding: 24px 0 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
        }
        .active-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: white;
          padding: 8px 16px;
          border-bottom: 2px solid white;
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
