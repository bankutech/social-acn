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

  // Group stories by author
  const grouped = {};
  stories.forEach(s => {
    const aid = s.author?._id;
    if (aid && !grouped[aid]) grouped[aid] = { author: s.author, stories: [] };
    if (aid) grouped[aid].stories.push(s);
  });
  const storyGroups = Object.values(grouped);

  const viewStory = async (story) => {
    setViewingStory(story);
    try { await api.post(`/api/stories/${story._id}/view`); } catch {}
  };

  return (
    <>
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        overflowX: 'auto',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {/* Add Story */}
        <button
          onClick={() => navigate('/create')}
          style={itemBtnStyle}
        >
          {/* Dashed ring */}
          <div style={{
            padding: 3,
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,255,255,0.35)',
            position: 'relative'
          }}>
            <Avatar src={user?.avatarUrl} name={user?.name} size={56} />
            {/* Plus badge */}
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 20, height: 20, borderRadius: '50%',
              background: '#0095f6',
              border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={12} color="white" strokeWidth={3} />
            </div>
          </div>
          <span style={nameLabelStyle}>Your story</span>
        </button>

        {/* Story groups */}
        {storyGroups.map(g => (
          <button
            key={g.author._id}
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
                <Avatar src={g.author.avatarUrl} name={g.author.name} size={56} />
              </div>
            </div>
            <span style={nameLabelStyle}>{g.author.name?.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Hide webkit scrollbar */}
      <style>{`.story-bar-scroll::-webkit-scrollbar{display:none}`}</style>

      {viewingStory && (
        <StoryViewer
          story={viewingStory}
          onClose={() => { setViewingStory(null); if (onRefresh) onRefresh(); }}
          currentUserId={user?._id || user?.id}
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