import axios from 'axios';
import { getApiUrl, setApiUrl } from '../config';

// Flag untuk mencegah auto-discovery berulang
let isDiscoveryInProgress = false;
let lastDiscoveryAttempt = 0;
const DISCOVERY_COOLDOWN = 10000; // 10 detik cooldown antara percobaan auto-discovery

// Config API yang disimpan
let apiConfig = null;

/**
 * Memuat konfigurasi API dari server
 * Mencegah terlalu banyak permintaan dengan cooldown
 */
export const loadApiConfig = async () => {
  // Cek apakah discovery sedang berlangsung
  if (isDiscoveryInProgress) {
    console.debug('Auto-discovery sedang berlangsung, menunggu...');
    return false;
  }

  // Cek cooldown untuk mencegah terlalu banyak percobaan
  const now = Date.now();
  if (now - lastDiscoveryAttempt < DISCOVERY_COOLDOWN) {
    console.debug('Auto-discovery dalam cooldown, skip...');
    return false;
  }

  lastDiscoveryAttempt = now;
  isDiscoveryInProgress = true;
  
  try {
    // Coba gunakan URL dari config jika tersedia
    const currentApiUrl = getApiUrl();
    if (currentApiUrl) {
      try {
        const response = await axios.get(`${currentApiUrl}/config`, { timeout: 3000 });
        if (response.status === 200) {
          apiConfig = response.data;
          console.debug('Konfigurasi berhasil dimuat dari URL yang tersimpan');
          isDiscoveryInProgress = false;
          return true;
        }
      } catch (error) {
        console.debug('URL API tersimpan tidak dapat diakses, mencoba auto-discovery...');
      }
    }

    // Auto-discovery - coba beberapa kemungkinan IP/port
    const possibleHosts = [
      'http://localhost:5000/api',
      'http://127.0.0.1:5000/api',
      // Tambahkan IP server di jaringan lokal
      `http://${window.location.hostname}:5000/api`, // Menggunakan hostname dari URL saat ini
      // Tambahkan versi HTTPS untuk alamat yang sama
      'https://localhost:5000/api',
      'https://127.0.0.1:5000/api', 
      `https://${window.location.hostname}:5000/api` // HTTPS dengan hostname
    ];

    // Prioritaskan HTTPS jika halaman saat ini menggunakan HTTPS
    if (window.location.protocol === 'https:') {
      // Reorder array to prioritize HTTPS
      possibleHosts.sort((a, b) => {
        if (a.startsWith('https') && !b.startsWith('https')) return -1;
        if (!a.startsWith('https') && b.startsWith('https')) return 1;
        return 0;
      });
    }

    // Coba deteksi IP lokal server secara dinamis
    try {
      // Gunakan URL saat ini untuk mendapatkan alamat server
      const serverHostname = window.location.hostname;
      if (serverHostname && !possibleHosts.includes(`http://${serverHostname}:5000/api`)) {
        possibleHosts.push(`http://${serverHostname}:5000/api`);
      }
    } catch (e) {
      console.debug('Gagal mendapatkan IP dinamis:', e);
    }

    for (const host of possibleHosts) {
      try {
        const response = await axios.get(`${host}/config`, { timeout: 2000 });
        if (response.status === 200) {
          // Simpan URL yang berhasil
          setApiUrl(host);
          apiConfig = response.data;
          console.debug(`Server ditemukan di: ${host}`);
          isDiscoveryInProgress = false;
          return true;
        }
      } catch (error) {
        // Lanjut ke host berikutnya
        continue;
      }
    }

    console.debug('Tidak bisa menemukan server API melalui auto-discovery');
    return false;
  } catch (error) {
    console.error('Error selama auto-discovery:', error);
    return false;
  } finally {
    isDiscoveryInProgress = false;
  }
};

/**
 * Mendapatkan konfigurasi API yang tersimpan
 */
export const getApiConfig = () => {
  return apiConfig;
};

/**
 * Request ke API dengan endpoint tertentu
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiUrl();
  if (!baseUrl) {
    // Coba load config jika baseUrl tidak tersedia
    const success = await loadApiConfig();
    if (!success) {
      throw new Error('Tidak dapat terhubung ke API server');
    }
  }

  // Default options
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Merge options
  const requestOptions = { ...defaultOptions, ...options };
  
  // Set longer timeout for specific endpoints that might take longer
  if (endpoint.includes('sales-order-visualization') || endpoint.includes('summary') || endpoint.includes('order-monitoring')) {
    requestOptions.timeout = 120000; // 2 minutes for visualization endpoints
  } else {
    requestOptions.timeout = 30000; // 30 seconds for other endpoints
  }
  
  // Periksa apakah endpoint sudah diawali dengan "api/"
  let fullUrl = `${getApiUrl()}`;
  if (!endpoint.startsWith('/')) {
    fullUrl += '/';
  }
  fullUrl += endpoint;
  
  // Hindari duplikasi '/api/api/'
  fullUrl = fullUrl.replace('/api/api/', '/api/');
  
  // Retry logic for network errors
  const maxRetries = 2;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        url: fullUrl,
        ...requestOptions,
      });
      
      return response.data;
    } catch (error) {
      lastError = error;
      
      // If it's the last attempt or not a retryable error, throw
      if (attempt === maxRetries || (error.response && error.response.status >= 400 && error.response.status < 500)) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`Retrying request to ${endpoint} in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Handle error sesuai kebutuhan
  console.error(`Error pada request API ke ${endpoint}:`, lastError);
  throw lastError;
};

export default {
  loadApiConfig,
  getApiConfig,
  apiRequest,
}; 