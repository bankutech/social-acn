import React from 'react';

/**
 * Single unified skeleton system.
 * - <Skeleton />            — primitive building block
 * - <SkeletonLoader />      — composed variants: post | chat | story | profile | reel
 * (Replaces both legacy Skeleton.jsx and SkeletonLoader.jsx)
 */

export function Skeleton({ width, height, borderRadius = '8px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height: height || '20px', borderRadius }}
    />
  );
}

function PostSkeleton() {
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
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .post-skeleton-header { display: flex; gap: 10px; align-items: center; }
        .header-meta-skeleton { display: flex; flex-direction: column; gap: 6px; }
        .post-skeleton-footer {
          display: flex;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}

export function SkeletonLoader({ type = 'post', count = 3 }) {
  const items = Array.from({ length: count });

  if (type === 'post') {
    return (
      <>
        {items.map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </>
    );
  }

  if (type === 'story') {
    return (
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', overflow: 'hidden' }}>
        {items.map((_, i) => (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <Skeleton width="64px" height="64px" borderRadius="50%" />
            <Skeleton width="48px" height="10px" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return items.map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <Skeleton width="52px" height="52px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>
            <Skeleton width="50%" height="14px" />
          </div>
          <Skeleton width="75%" height="12px" />
        </div>
        <Skeleton width="40px" height="10px" />
      </div>
    ));
  }

  if (type === 'profile') {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <Skeleton width="76px" height="76px" borderRadius="50%" />
          <div style={{ display: 'flex', gap: 28 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="44px" height="34px" />
            ))}
          </div>
        </div>
        <Skeleton width="180px" height="22px" />
        <Skeleton width="300px" height="13px" />
      </div>
    );
  }

  if (type === 'reel') {
    return items.map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
        <Skeleton width="120px" height="180px" borderRadius="14px" />
        <div style={{ flex: 1, paddingTop: 6 }}>
          <div style={{ marginBottom: 8 }}>
            <Skeleton width="85%" height="14px" />
          </div>
          <Skeleton width="55%" height="12px" />
        </div>
      </div>
    ));
  }

  return null;
}

export default SkeletonLoader;
export { PostSkeleton };
