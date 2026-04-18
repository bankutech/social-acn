export default function SkeletonLoader({ type = 'post', count = 3 }) {
  const items = Array.from({ length: count });

  if (type === 'post') {
    return items.map((_, i) => (
      <div key={i} className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="skeleton skeleton-circle" style={{ width: 40, height: 40 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '40%', height: 12, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: '25%', height: 10 }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 12 }} />
      </div>
    ));
  }

  if (type === 'story') {
    return (
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', overflow: 'hidden' }}>
        {items.map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="skeleton skeleton-circle" style={{ width: 64, height: 64 }} />
            <div className="skeleton" style={{ width: 48, height: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return items.map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <div className="skeleton skeleton-circle" style={{ width: 52, height: 52 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: '75%', height: 12 }} />
        </div>
        <div className="skeleton" style={{ width: 40, height: 10 }} />
      </div>
    ));
  }

  if (type === 'profile') {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="skeleton skeleton-circle" style={{ width: 96, height: 96 }} />
        <div className="skeleton" style={{ width: 140, height: 18 }} />
        <div className="skeleton" style={{ width: 200, height: 14 }} />
        <div style={{ display: 'flex', gap: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ width: 60, height: 40 }} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
