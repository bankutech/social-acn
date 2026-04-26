import React from 'react';

export default function Skeleton({ width, height, borderRadius = '8px', className = '' }) {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius 
      }}
    >
      <style>{`
        .skeleton-base {
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0.03) 25%, 
            rgba(255, 255, 255, 0.08) 50%, 
            rgba(255, 255, 255, 0.03) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="post-skeleton-card">
      <div className="post-skeleton-header">
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div className="header-meta-skeleton">
          <Skeleton width="120px" height="14px" />
          <Skeleton width="60px" height="10px" />
        </div>
      </div>
      <Skeleton width="100%" height="200px" borderRadius="16px" className="content-skeleton" />
      <div className="post-skeleton-footer">
        <Skeleton width="60px" height="24px" borderRadius="20px" />
        <Skeleton width="60px" height="24px" borderRadius="20px" />
      </div>
      <style>{`
        .post-skeleton-card {
          background: rgba(15, 15, 18, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .post-skeleton-header {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .header-meta-skeleton {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .post-skeleton-footer {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
