import api from '../lib/api';

export default function Avatar({ src, name, size = 40, online, className = '' }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const imgSrc = api.getFileUrl(src);

  return (
    <div className={`avatar-wrap ${className}`} style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            background: 'var(--bg-tertiary)'
          }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: imgSrc ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.36,
          fontWeight: 600,
          color: 'white'
        }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div className={online ? 'online-dot' : 'offline-dot'} />
      )}
    </div>
  );
}
