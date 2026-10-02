/**
 * Sphere — single source of truth for brand identity.
 * ACN+ is retained only as the internal/parent project codename.
 */
export const BRAND = {
  name: 'ACN+',
  fullName: 'ACN+',
  internalCodename: 'ACN+', // parent/internal identity only
  logo: '/logo.png',
  slogan: 'Ask questions. Share notes. Study together.',
  memberTitle: 'Student',
  feedTitle: 'Posts',
  // Signature palette (mirrors CSS custom properties in index.css)
  colors: {
    bg: '#17140f',
    ink: '#ece7dc',
    accent: '#c96a3b',
    hairline: '#2e2820',
  },
  demoCredentials: null, // demo creds are never published in public docs
};

export default BRAND;
