import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ArrowLeft, Flame, MessageCircle, Grid3X3, Film } from 'lucide-react';
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

  useDocumentTitle(profile?.name || 'Profile');

  const isOwnProfile = !userId || userId === user?._id;

  const loadProfile = async () => {
    try {
      const profileData = isOwnProfile
        ? await api.get('/api/auth/profile')
        : await api.get(`/api/auth/profile/${userId}`);
      setProfile(profileData);

      const currentUserId = user?._id || user?.id;
      setIsFollowing(profileData.followers?.some((f) => (f._id || f) === currentUserId));

      try {
        const targetId = userId || currentUserId;
        const [userPosts, userReels] = await Promise.all([
          api.get(`/api/posts/user/${targetId}`),
          api.get(`/api/reels/user/${targetId}`),
        ]);
        setPosts(userPosts);
        setReels(userReels);
      } catch (e) {
        console.error(e);
      }
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
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="pp-root">
        <SkeletonLoader type="profile" />
      </div>
    );
  }

  return (
    <div className="pp-root">
      <header className="pp-header">
        <div className="pp-header-inner">
          {!isOwnProfile && (
            <button className="pp-header-btn" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="pp-header-name">{profile?.name}</span>
          {isOwnProfile && (
            <button
              className="pp-header-btn"
              onClick={() => navigate('/profile/edit')}
              aria-label="Edit profile"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="pp-main">
        {/* Identity block */}
        <section className="pp-identity">
          <div className="pp-identity-top">
            <Avatar src={profile?.avatarUrl} name={profile?.name} size={76} />
            <div className="pp-stats">
              <div className="pp-stat">
                <strong>{posts.length}</strong>
                <span>posts</span>
              </div>
              <div className="pp-stat">
                <strong>{profile?.followers?.length || 0}</strong>
                <span>followers</span>
              </div>
              <div className="pp-stat">
                <strong>{profile?.following?.length || 0}</strong>
                <span>following</span>
              </div>
            </div>
          </div>

          <div className="pp-name-row">
            <h1 className="pp-name">{profile?.name}</h1>
            {profile?.studyStreak > 0 && (
              <span className="pp-streak">
                <Flame size={12} /> {profile.studyStreak}-day streak
              </span>
            )}
          </div>

          {profile?.bio ? (
            <p className="pp-bio">{profile.bio}</p>
          ) : (
            <p className="pp-bio pp-bio-empty">{BRAND.memberTitle} · no bio yet</p>
          )}

          {profile?.skills?.length > 0 && (
            <div className="pp-subjects">
              {profile.skills.map((s) => (
                <span key={s} className="pp-subject">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="pp-actions">
            {isOwnProfile ? (
              <button className="btn-outline" onClick={() => navigate('/profile/edit')}>
                Edit profile
              </button>
            ) : (
              <>
                <button
                  className={isFollowing ? 'btn-outline' : 'btn-primary'}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/chat/${userId}`)}
                  aria-label="Message"
                >
                  <MessageCircle size={16} />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Content */}
        <div className="pp-tabs">
          <button
            className={`pp-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <Grid3X3 size={15} /> Posts
          </button>
          <button
            className={`pp-tab ${activeTab === 'reels' ? 'active' : ''}`}
            onClick={() => setActiveTab('reels')}
          >
            <Film size={15} /> Reels
          </button>
        </div>

        <div className="pp-content">
          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="pp-post-list"
              >
                {posts.length === 0 ? (
                  <EmptyState
                    icon={Grid3X3}
                    title="No posts yet"
                    description={
                      isOwnProfile
                        ? 'Share a question or some notes — it shows up on your profile.'
                        : 'When they post, it shows up here.'
                    }
                    actionLabel={isOwnProfile ? 'Write something' : undefined}
                    onAction={isOwnProfile ? () => navigate('/create') : undefined}
                  />
                ) : (
                  posts.map((post) => (
                    <PostCard key={post._id} post={post} onUpdate={loadProfile} />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'reels' && (
              <motion.div
                key="reels"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {reels.length === 0 ? (
                  <EmptyState
                    icon={Film}
                    title="No reels yet"
                    description="Short videos posted by this account will appear here."
                  />
                ) : (
                  <div className="pp-reel-grid">
                    {reels.map((reel) => (
                      <button
                        key={reel._id}
                        className="pp-reel-thumb"
                        onClick={() => navigate('/reels')}
                        aria-label="Open reel"
                      >
                        <video src={api.getFileUrl(reel.videoUrl)} preload="metadata" />
                        <span className="pp-reel-icon">
                          <Film size={18} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .pp-root {
          min-height: 100vh;
          padding-bottom: calc(var(--bottom-nav-height) + 24px);
        }
        .pp-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }
        .pp-header-inner {
          max-width: 640px;
          margin: 0 auto;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }
        .pp-header-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .pp-header-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }
        .pp-header-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .pp-main {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px 16px 0;
        }
        .pp-identity { padding-bottom: 22px; }
        .pp-identity-top {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-bottom: 16px;
        }
        .pp-stats {
          display: flex;
          gap: 28px;
        }
        .pp-stat { display: flex; flex-direction: column; }
        .pp-stat strong { font-size: 17px; font-weight: 600; }
        .pp-stat span { font-size: 12.5px; color: var(--text-muted); }
        .pp-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }
        .pp-name {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .pp-streak {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          color: var(--warning);
        }
        .pp-bio {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre-line;
          margin-bottom: 12px;
          max-width: 480px;
        }
        .pp-bio-empty { color: var(--text-muted); font-style: italic; }
        .pp-subjects {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .pp-subject {
          font-size: 12px;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 3px 9px;
          border-radius: var(--radius-sm);
        }
        .pp-actions {
          display: flex;
          gap: 8px;
          padding-top: 4px;
        }
        .pp-tabs {
          display: flex;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        .pp-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 12px 0;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-muted);
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.12s;
        }
        .pp-tab:hover { color: var(--text-secondary); }
        .pp-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent);
        }
        .pp-post-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pp-reel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .pp-reel-thumb {
          aspect-ratio: 9 / 16;
          background: var(--bg-tertiary);
          position: relative;
          overflow: hidden;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .pp-reel-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pp-reel-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
          background: rgba(10, 8, 5, 0.25);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .pp-reel-thumb:hover .pp-reel-icon { opacity: 1; }
        @media (min-width: 480px) {
          .pp-reel-grid { gap: 6px; }
        }
      `}</style>
    </div>
  );
}
