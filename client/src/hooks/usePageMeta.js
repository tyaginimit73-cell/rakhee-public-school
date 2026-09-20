import { useEffect } from 'react';

const SITE_NAME = 'Rakhee Public School';
const DEFAULT_DESCRIPTION = document.querySelector('meta[name="description"]')?.content || '';

// Every page previously rendered with the exact same <title> and meta
// description from index.html — search engines see duplicate titles across
// the whole site, and browser tabs/history/bookmarks all look identical
// regardless of which page is open. See PROJECT_AUDIT.md Phase 11.
//
// A dedicated dependency (react-helmet-async) wasn't added for this: this
// is a plain SPA with no SSR, so its main benefit (streaming head tags
// during server render) doesn't apply here, and this hook covers the
// actual need — title + description — in a few lines with no new package.
// (This project's sandbox also has no network access to install one —
// see PROJECT_AUDIT.md — but the hook would be the right tool either way.)
export const usePageMeta = (title, description = DEFAULT_DESCRIPTION) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.content;
    if (meta && description) meta.content = description;

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
    };
  }, [title, description]);
};
