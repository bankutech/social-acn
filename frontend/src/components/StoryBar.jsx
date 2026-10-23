import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../lib/api';
import { Plus } from 'lucide-react';
import StoryViewer from './StoryViewer';

export default function StoryBar({ stories = [], onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewingStory, setViewingStory] = useState(null);

  const currentUserId = (user?._id || user?.id)?.toString();

  // Separate current user's stories from other people's stories
  const myStories = [];
  const otherStories = [];

  stories.forEach(s => {
    const aid = (s.author?._id || s.author)?.toString();
    if (currentUserId && aid === currentUserId) {
      myStories.push(s);
    } else {
      otherStories.push(s);
    }
  });

  // Group other users' stories by author
  const grouped = {};
  otherStories.forEach(s => {
    const aid = (s.author?._id || s.author)?.toString();
    if (aid && !grouped[aid]) {
      grouped[aid] = { author: s.author, stories: [] };
    }
    if (aid) grouped[aid].stories.push(s);
  });
  const otherGroups = Object.values(grouped);

  const viewStory = async (story) => {
    if (!story) return;
    setViewingStory(story);
    try { await api.post(`/api/stories/${story._id}/view`); } catch {}
  };

  return (
    <>
      <div 
        className="story-bar-scroll"
        style={{
          display: 'flex',
          gap: 14,
          padding: '12px 14px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Your Story */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            {myStories.length > 0 ? (
              <button
                onClick={() => viewStory(myStories[0])}
                style={{
                  padding: 2,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="View your active story"
              >
                <div style={{ padding: 2, borderRadius: '50%', background: '#000' }}>
                  <Avatar src={user?.avatarUrl} name={user?.name} size={56} />
                </div>
              </button>
            ) : (
              <button
                onClick={() => navigate('/create')}
                style={{
                  padding: 3,
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(255,255,255,0.4)',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Add to your story"
              >
                <Avatar src={user?.avatarUrl} name={user?.name} size={56} />
              </button>
            )}

            {/* Plus badge to add another story */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/create');
              }}
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#0095f6',
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2
              }}
              title="Add story"
            >
              <Plus size={12} color="white" strokeWidth={3} />
            </button>
          </div>
          <span style={nameLabelStyle}>Your story</span>
        </div>

        {/* Other users' story groups */}
        {otherGroups.map(g => (
          <button
            key={(g.author?._id || g.author)?.toString()}
            onClick={() => viewStory(g.stories[0])}
            style={itemBtnStyle}
          >
            {/* Instagram-style gradient ring */}
            <div style={{
              padding: 2,
              borderRadius: '50%',
              background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)'
            }}>
              <div style={{ padding: 2, borderRadius: '50%', background: '#000' }}>
                <Avatar src={g.author?.avatarUrl} name={g.author?.name} size={56} />
              </div>
            </div>
            <span style={nameLabelStyle}>{g.author?.name ? g.author.name.split(' ')[0] : 'User'}</span>
          </button>
        ))}
      </div>

      <style>{`
        .story-bar-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          onClose={() => { 
            setViewingStory(null); 
            if (onRefresh) onRefresh(); 
          }}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

const itemBtnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  WebkitTapHighlightColor: 'transparent'
};

const nameLabelStyle = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.75)',
  maxWidth: 64,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: 1
};
