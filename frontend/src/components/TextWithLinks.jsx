import { useNavigate } from 'react-router-dom';

export default function TextWithLinks({ text, className }) {
  const navigate = useNavigate();
  if (!text) return null;

  // Match URLs, @mentions, and #hashtags
  const regex = /(https?:\/\/[^\s]+|@[a-zA-Z0-9_.]+|#[a-zA-Z0-9_]+)/g;
  const parts = text.split(regex);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        } else if (part.match(/^@/)) {
          return (
            <span
              key={i}
              className="text-mention"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/explore?q=${part.slice(1)}`);
              }}
            >
              {part}
            </span>
          );
        } else if (part.match(/^#/)) {
          return (
            <span
              key={i}
              className="text-hashtag"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${part.slice(1)}`);
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}
