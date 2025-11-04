import axios from 'axios';
import { getApiUrl } from '../config';

/**
 * Fungsi untuk memeriksa apakah API server tersedia
 * @param {number} timeout - Timeout dalam milidetik
 * @returns {Promise<boolean>} - Promise yang resolve menjadi true jika server tersedia
 */
export const checkServerHealth = async (timeout = 5000) => {
  try {
    // Gunakan endpoint health check dengan timeout yang lebih singkat
    const apiUrl = getApiUrl();
    const healthEndpoint = `${apiUrl}/health`;
    const response = await axios.get(healthEndpoint, {
      timeout: timeout,
      withCredentials: false,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.warn('Server health check failed:', error.message);
    return false;
  }
};

/**
 * Menunggu server tersedia dengan interval retry
 * @param {number} maxRetries - Jumlah maksimum percobaan
 * @param {number} interval - Interval antara percobaan (ms)
 * @returns {Promise<boolean>} - True jika server tersedia, false jika gagal setelah maxRetries
 */
export const waitForServer = async (maxRetries = 3, interval = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    const isAvailable = await checkServerHealth();
    if (isAvailable) {
      return true;
    }
    
    console.log(`Server tidak tersedia, mencoba lagi dalam ${interval/1000} detik... (${i+1}/${maxRetries})`);
    // Tunggu interval sebelum mencoba lagi
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
};

export default {
  checkServerHealth,
  waitForServer
}; 