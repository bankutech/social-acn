import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../lib/api';
import { Plus } from 'lucide-react';

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
    setTimeout(() => setViewingStory(null), 5000);
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
        <div className="modal-overlay" onClick={() => setViewingStory(null)} style={{ background: 'rgba(0,0,0,0.95)' }}>
          <div className="story-viewer" onClick={e => e.stopPropagation()}>
            <div className="story-progress"><div className="story-progress-fill" /></div>
            <div className="story-viewer-header">
              <Avatar src={viewingStory.author?.avatarUrl} name={viewingStory.author?.name} size={36} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{viewingStory.author?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(viewingStory.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="story-viewer-content">
              {viewingStory.type === 'image' && viewingStory.imageUrl ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={api.getFileUrl(viewingStory.imageUrl)} alt="" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 12, marginBottom: 12 }} />
                  {viewingStory.content && <p style={{ fontSize: 16 }}>{viewingStory.content}</p>}
                </div>
              ) : (
                <p>{viewingStory.content}</p>
              )}
            </div>
          </div>
        </div>
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
        .story-viewer {
          width: 100%;
          max-width: 400px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .story-progress {
          height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          margin-bottom: 12px;
          overflow: hidden;
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
        .story-viewer-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .story-viewer-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </>
  );
}
