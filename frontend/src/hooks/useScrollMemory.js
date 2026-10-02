import { useEffect } from 'react';

export function useScrollMemory(key = 'feed-scroll-pos') {
  useEffect(() => {
    // Restore scroll position on mount
    const savedPos = sessionStorage.getItem(key);
    if (savedPos) {
      window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'instant' });
    }

    // Debounced scroll listener
    let timeout;
    const handleScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.setItem(key, window.scrollY);
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Final save before unmount
      sessionStorage.setItem(key, window.scrollY);
    };
  }, [key]);
}
