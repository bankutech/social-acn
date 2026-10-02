import { useEffect } from 'react';
import { BRAND } from '../config/brand';

export function useDocumentTitle(title) {
  useEffect(() => {
    const defaultTitle = BRAND.name;
    document.title = title ? `${defaultTitle} | ${title}` : defaultTitle;
  }, [title]);
}
