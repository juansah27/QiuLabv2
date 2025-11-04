import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import api, { loadApiConfig, getApiConfig } from '../services/api';

/**
 * Custom hook untuk mengkonfigurasi Axios dengan default settings dan interceptors
 */
export const useAxios = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const initializeAxios = async () => {
      try {
        // Coba muat konfigurasi dari backend
        const success = await loadApiConfig();
        if (success) {
          console.log('Konfigurasi API berhasil dimuat dari server');
        } else {
          console.warn('Tidak dapat memuat konfigurasi dari server, menggunakan konfigurasi default');
        }
        
        const config = getApiConfig() || {};
        const defaultTimeout = parseInt(import.meta.env.VITE_AXIOS_TIMEOUT || '30000', 10);
        
        // Konfigurasi default Axios global (untuk kompatibilitas kode lama)
        axios.defaults.baseURL = getApiUrl();
        axios.defaults.timeout = config.timeout || defaultTimeout;
        axios.defaults.withCredentials = false;
        
        // Penanganan retry otomatis untuk error jaringan
        axios.interceptors.response.use(null, async (error) => {
          const config = error.config;
          
          // Jika error disebabkan timeout atau network error dan belum mencoba ulang
          if ((error.code === 'ECONNABORTED' || !error.response) && !config._retry) {
            config._retry = true; // Set flag retry
            config._retryCount = 1; // Track jumlah retry

            // Tambah timeout untuk retry (setiap retry tambah 5 detik)
            config.timeout = defaultTimeout + 5000;
            
            console.log('Mencoba ulang request karena network error atau timeout...');
            
            // Tunggu 2 detik sebelum retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Retry request
            return axios(config);
          }
          
          return Promise.reject(error);
        });
      } catch (error) {
        console.error('Error initializing Axios:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    initializeAxios();
    
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Pastikan Content-Type terisi dengan benar saat mengirim data
          if ((config.method === 'post' || config.method === 'put') && config.data) {
            config.headers['Content-Type'] = 'application/json';
          }
        }
        // Hanya log jika dalam mode development
        if (import.meta.env.DEV) {
          console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`, config);
        }
        return config;
      },
      (error) => {
        console.error('[Axios Request Error]', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        // Hanya log jika dalam mode development
        if (import.meta.env.DEV) {
          console.log(`[Axios Response] ${response.status} ${response.statusText} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        const requestUrl = error.config?.url || 'unknown URL';
        console.error('[Axios Response Error]', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: requestUrl,
          method: error.config?.method?.toUpperCase() || 'unknown',
          headers: error.config?.headers
        });
        
        // Handle specific error cases
        if (error.response) {
          // Server responded with error status (4xx, 5xx)
          setError({
            type: 'server',
            status: error.response.status,
            message: error.response.data?.error || error.response.statusText || 'Server error'
          });
        } else if (error.code === 'ECONNABORTED') {
          // Request timed out
          setError({
            type: 'timeout',
            message: 'Permintaan ke server terlalu lama. Silakan coba lagi.'
          });
        } else if (error.request) {
          // Request was made but no response received
          setError({
            type: 'network',
            message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau server mungkin sedang offline.'
          });
        } else {
          // Error during request setup
          setError({
            type: 'request',
            message: error.message || 'Terjadi kesalahan saat menyiapkan permintaan'
          });
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);
  
  return { error, loading, initialized };
};

export default useAxios; 