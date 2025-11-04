import React from 'react';

/**
 * Utilitas untuk mengelola judul halaman
 */

// Nama aplikasi untuk ditampilkan di judul halaman
const APP_NAME = "QiuLab";
const APP_DESCRIPTION = "Transform Anything. Track Everything.";
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 155;

/**
 * Membatasi panjang teks tanpa memotong kata secara kasar
 */
const truncate = (text, max) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim() + '…';
};

/**
 * Membuat title lengkap yang konsisten
 */
const composeTitle = (pageTitle) => {
  if (!pageTitle || pageTitle === APP_NAME) return APP_NAME;
  const clean = String(pageTitle).trim();
  return truncate(clean, MAX_TITLE_LENGTH);
};

/**
 * Membuat atau memperbarui meta tag
 */
const upsertMeta = (selector, attrs) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'content') el.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  if (attrs.content !== undefined) {
    el.setAttribute('content', attrs.content);
  }
};

/**
 * Mengatur judul halaman
 * @param {string} pageTitle - Judul halaman spesifik
 */
export const setPageTitle = (pageTitle) => {
  const fullTitle = composeTitle(pageTitle);
  if (document.title !== fullTitle) {
    document.title = fullTitle;
  }

  const description = truncate(
    pageTitle ? `${pageTitle} - ${APP_DESCRIPTION}` : APP_DESCRIPTION,
    MAX_DESCRIPTION_LENGTH
  );

  // HTML meta
  upsertMeta('meta[name="description"]', { name: 'description', content: description });

  // Open Graph
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });

  // Twitter Cards
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
};

/**
 * Hook untuk mengatur judul halaman dalam komponen React dengan debounce
 * @param {string} pageTitle - Judul halaman spesifik
 */
export const usePageTitle = (pageTitle) => {
  // Set title immediately on mount and when pageTitle changes
  React.useEffect(() => {
    if (pageTitle) {
      // Set title immediately
      setPageTitle(pageTitle);
      
      // Also set it after a small delay to ensure it takes precedence
      const timer = setTimeout(() => {
        setPageTitle(pageTitle);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pageTitle]);
}; 