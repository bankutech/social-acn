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
      <div className="story-bar">
        {/* Add Story */}
        <button className="story-item" onClick={() => navigate('/create')}>
          <div className="story-ring add-ring">
            <Avatar src={user?.avatarUrl} name={user?.name} size={56} />
            <div className="story-add-icon"><Plus size={14} /></div>
          </div>
          <span className="story-name">Your story</span>
        </button>

        {/* Stories */}
        {storyGroups.map(g => (
          <button key={g.author._id} className="story-item" onClick={() => viewStory(g.stories[0])}>
            <div className="story-ring has-story">
              <Avatar src={g.author.avatarUrl} name={g.author.name} size={56} />
            </div>
            <span className="story-name">{g.author.name?.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* View Story */}
      {viewingStory && (
        <StoryViewer 
          story={viewingStory} 
          onClose={() => setViewingStory(null)} 
          currentUserId={user?._id || user?.id} 
        />
      )}

      <style>{`
        .story-bar {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          overflow-x: auto;
          border-bottom: 1px solid var(--border-color);
          scrollbar-width: none;
        }
        .story-bar::-webkit-scrollbar { display: none; }
        .story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          background: none;
        }
        .story-ring {
          padding: 3px;
          border-radius: 50%;
          position: relative;
        }
        .story-ring.has-story {
          background: var(--gradient-warm);
        }
        .story-ring.add-ring {
          border: 2px dashed var(--border-light);
          border-radius: 50%;
        }
        .story-add-icon {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 20px;
          height: 20px;
          background: var(--accent);
          border-radius: 50%;
          border: 2px solid var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .story-name {
          font-size: 11px;
          color: var(--text-secondary);
          max-width: 64px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
          .story-progress-fill {
          height: 100%;
          background: white;
          border-radius: 2px;
          animation: storyTimer 5s linear forwards;
        }
        @keyframes storyTimer {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
}
