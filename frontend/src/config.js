import { getApiConfig } from './services/api';

/**
 * Konfigurasi aplikasi frontend
 */

// Local storage key
const API_URL_KEY = 'qiulab_api_url';

// Default config dari environment
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_TIMEOUT = parseInt(import.meta.env.VITE_AXIOS_TIMEOUT || '30000', 10);

// Cache config
let apiUrlCache = null;

/**
 * Mendapatkan API URL dari localStorage atau default
 */
export const getApiUrl = () => {
  if (apiUrlCache) {
    return apiUrlCache;
  }
  
  // Coba dapatkan dari localStorage
  const savedUrl = localStorage.getItem(API_URL_KEY);
  if (savedUrl) {
    apiUrlCache = savedUrl;
    return savedUrl;
  }
  
  // Fallback ke default
  return DEFAULT_API_URL;
};

/**
 * Menyimpan API URL ke localStorage
 */
export const setApiUrl = (url) => {
  apiUrlCache = url;
  localStorage.setItem(API_URL_KEY, url);
};

/**
 * Menghapus API URL dari localStorage (untuk reset)
 */
export const clearApiUrl = () => {
  apiUrlCache = null;
  localStorage.removeItem(API_URL_KEY);
};

/**
 * Mendapatkan konfigurasi aplikasi
 */
export const getConfig = () => {
  return {
    apiUrl: getApiUrl(),
    timeout: DEFAULT_TIMEOUT,
    environment: import.meta.env.MODE,
    features: {
      debug: import.meta.env.DEV || import.meta.env.MODE === 'development',
    },
    cacheBuster: new Date().getTime()
  };
};

export default {
  getApiUrl,
  setApiUrl,
  clearApiUrl,
  getConfig
};