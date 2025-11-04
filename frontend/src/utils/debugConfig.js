// File untuk membantu debug konfigurasi aplikasi
import { getApiUrl } from '../config';

// Cetak semua variabel lingkungan Vite yang relevan
export const printDebugInfo = () => {
  console.log('====== DEBUG INFO ======');
  console.log('API URL (getApiUrl()):', getApiUrl());
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_AXIOS_TIMEOUT:', import.meta.env.VITE_AXIOS_TIMEOUT);
  console.log('VITE_CACHE_BUSTER:', import.meta.env.VITE_CACHE_BUSTER);
  console.log('Current URL:', window.location.href);
  console.log('========================');
  
  // Tambahkan div debug ke halaman
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.bottom = '10px';
  debugDiv.style.right = '10px';
  debugDiv.style.padding = '10px';
  debugDiv.style.background = 'rgba(0,0,0,0.7)';
  debugDiv.style.color = 'white';
  debugDiv.style.fontSize = '12px';
  debugDiv.style.zIndex = '9999';
  debugDiv.style.borderRadius = '5px';
  debugDiv.innerHTML = `
    <div><strong>API URL:</strong> ${getApiUrl()}</div>
    <div><strong>VITE_API_URL:</strong> ${import.meta.env.VITE_API_URL || 'undefined'}</div>
    <div><strong>Current URL:</strong> ${window.location.href}</div>
  `;
  
  document.body.appendChild(debugDiv);
  
  return {
    apiUrl: getApiUrl(),
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_AXIOS_TIMEOUT: import.meta.env.VITE_AXIOS_TIMEOUT,
    VITE_CACHE_BUSTER: import.meta.env.VITE_CACHE_BUSTER
  };
};

export const debugConfig = () => {
  // Tampilkan informasi konfigurasi untuk debugging
  console.log('== DEBUG CONFIG ==');
  console.log('getApiUrl():', getApiUrl());
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('DEV:', import.meta.env.DEV);
  console.log('PROD:', import.meta.env.PROD);
  console.log('MODE:', import.meta.env.MODE);
  console.log('=================');
};

export const getDebugInfo = () => {
  const html = `
    <div class="debug-info">
      <h3>Debug Info</h3>
      <div><strong>Environment:</strong> ${import.meta.env.MODE}</div>
      <div><strong>Development:</strong> ${import.meta.env.DEV ? 'true' : 'false'}</div>
      <div><strong>Production:</strong> ${import.meta.env.PROD ? 'true' : 'false'}</div>
      <div><strong>getApiUrl():</strong> ${getApiUrl()}</div>
      <div><strong>API URL:</strong> ${getApiUrl()}</div>
      <div><strong>VITE_API_URL:</strong> ${import.meta.env.VITE_API_URL || 'undefined'}</div>
    </div>
  `;
  
  return html;
};

export const debugInfo = {
  getApiUrl: getApiUrl(),
  apiUrl: getApiUrl(),
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
}; 