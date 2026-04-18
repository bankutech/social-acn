import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft, Flame, MessageCircle, Heart, Grid3X3 } from 'lucide-react';

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
      setIsFollowing(profileData.followers?.some(f => (f._id || f) === user?._id));

      // Load user's posts from feed
      try {
        const feedPosts = await api.get('/api/posts/feed');
        const userPosts = feedPosts.filter(p => p.author?._id === (userId || user?._id));
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
      <div className="page-container">
        <div className="page-header"><h1>Profile</h1></div>
        <SkeletonLoader type="profile" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      {/* Header */}
      <div className="page-header">
        {!isOwnProfile && (
          <button className="btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 style={{ fontSize: 18 }}>{profile?.name || 'Profile'}</h1>
        <div className="page-header-actions">
          {isOwnProfile && (
            <button className="btn-icon" onClick={() => navigate('/profile/edit')}>
              <Settings size={22} />
            </button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Profile Info */}
        <div className="profile-info">
          <div className="profile-top-row">
            <Avatar src={profile?.avatarUrl} name={profile?.name} size={86} />
            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
              <div className="profile-stat">
                <strong>{profile?.followers?.length || 0}</strong>
                <span>Followers</span>
              </div>
              <div className="profile-stat">
                <strong>{profile?.following?.length || 0}</strong>
                <span>Following</span>
              </div>
            </div>
          </div>

          <div className="profile-details">
            <h2 className="profile-name">{profile?.name}</h2>
            {profile?.bio && <p className="profile-bio">{profile?.bio}</p>}

            {/* Study Streak */}
            {(profile?.studyStreak > 0 || isOwnProfile) && (
              <div className="profile-streak">
                <Flame size={16} fill="#f97316" stroke="#f97316" />
                <span>{profile?.studyStreak || 0} day streak</span>
              </div>
            )}

            {/* Skills */}
            {profile?.skills?.length > 0 && (
              <div className="profile-skills">
                {profile.skills.map(s => (
                  <span key={s} className="badge">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/profile/edit')}>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                  style={{ flex: 1 }}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="btn-secondary" onClick={() => navigate(`/chat/${userId}`)} style={{ flex: 1 }}>
                  <MessageCircle size={16} /> Message
                </button>
                <button className="btn-outline" onClick={() => navigate(`/partner-chat/${userId}`)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', fontSize: 13 }}>
                  <Heart size={14} /> Partner Chat
                </button>
              </>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', justifyContent: 'center' }}>
            <Grid3X3 size={18} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>POSTS</span>
          </div>
          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>No posts yet</p>
            </div>
          ) : (
            posts.map(post => <PostCard key={post._id} post={post} onUpdate={loadProfile} />)
          )}
        </div>
      </motion.div>

      <style>{`
        .profile-info {
          padding: 20px 16px;
        }
        .profile-top-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 16px;
        }
        .profile-stats {
          display: flex;
          gap: 24px;
          flex: 1;
          justify-content: center;
        }
        .profile-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .profile-stat strong {
          font-size: 18px;
          font-weight: 700;
        }
        .profile-stat span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .profile-details {
          margin-bottom: 16px;
        }
        .profile-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .profile-bio {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .profile-streak {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #f97316;
          margin-bottom: 8px;
        }
        .profile-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .profile-actions {
          display: flex;
          gap: 8px;
        }
        .profile-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
      `}</style>
    </div>
  );
}
