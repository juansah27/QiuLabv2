import axios from 'axios';
import { getApiUrl } from '../config';
import { loadApiConfig, getApiConfig } from '../services/api';

/**
 * Alat pengujian koneksi frontend ke backend
 * Digunakan untuk debugging dan troubleshooting
 * 
 * Cara penggunaan:
 * 1. Import di console browser: 
 *    import { testBackendConnection } from './utils/testConnection'
 * 2. Jalankan: await testBackendConnection()
 */

// Flag untuk mencegah auto-discovery berjalan berulang kali
let isDiscoveryRunning = false;

/**
 * Menguji auto-discovery backend
 */
export const testAutoDiscovery = async (verbose = false) => {
  // Mencegah pemanggilan berulang
  if (isDiscoveryRunning) {
    return { success: false, error: "Discovery sedang berjalan", skipped: true };
  }
  
  isDiscoveryRunning = true;
  
  if (verbose) console.group('🔍 Pengujian Auto-Discovery Backend');
  try {
    if (verbose) console.log('Memulai pencarian backend...');
    const startTime = performance.now();
    
    // Reset konfigurasi untuk memaksa pencarian ulang
    if (verbose) console.log('Menghapus konfigurasi yang disimpan...');
    
    // Coba muat konfigurasi
    const success = await loadApiConfig();
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (success) {
      const config = getApiConfig();
      if (verbose) console.log(`✅ Backend ditemukan dalam ${duration}ms`);
      if (verbose) console.log('Konfigurasi:', config);
      isDiscoveryRunning = false;
      return { success: true, config, duration };
    } else {
      if (verbose) console.warn(`❌ Gagal menemukan backend (${duration}ms)`);
      isDiscoveryRunning = false;
      return { success: false, duration };
    }
  } catch (error) {
    if (verbose) console.error('❌ Error selama auto-discovery:', error);
    isDiscoveryRunning = false;
    return { success: false, error: error.message };
  } finally {
    if (verbose) console.groupEnd();
    // Pastikan flag di-reset meskipun terjadi error
    isDiscoveryRunning = false;
  }
};

/**
 * Menguji koneksi API ke backend yang terkonfigurasi saat ini
 */
export const testBackendConnection = async (verbose = false) => {
  if (verbose) console.group('🔌 Pengujian Koneksi Backend');
  
  const results = {
    apiUrl: getApiUrl(),
    endpoints: {},
    overallStatus: false
  };
  
  try {
    if (verbose) console.log(`URL API yang digunakan: ${results.apiUrl}`);
    
    // Test 1: Health check
    try {
      if (verbose) console.log('Tes 1: Health check...');
      const healthUrl = `${results.apiUrl}/health`;
      const healthResponse = await axios.get(healthUrl, { timeout: 5000 });
      
      results.endpoints.health = {
        url: healthUrl,
        status: healthResponse.status,
        data: healthResponse.data,
        success: healthResponse.status === 200
      };
      
      if (verbose) console.log(results.endpoints.health.success ? '✅ Health check berhasil' : '❌ Health check gagal');
    } catch (error) {
      results.endpoints.health = {
        url: `${results.apiUrl}/health`,
        error: error.message,
        success: false
      };
      if (verbose) console.error('❌ Health check error:', error.message);
    }
    
    // Test 2: Config endpoint
    try {
      if (verbose) console.log('Tes 2: Config endpoint...');
      const configUrl = `${results.apiUrl}/config`;
      const configResponse = await axios.get(configUrl, { timeout: 5000 });
      
      results.endpoints.config = {
        url: configUrl,
        status: configResponse.status,
        data: configResponse.data,
        success: configResponse.status === 200
      };
      
      if (verbose) console.log(results.endpoints.config.success ? '✅ Config endpoint berhasil' : '❌ Config endpoint gagal');
    } catch (error) {
      results.endpoints.config = {
        url: `${results.apiUrl}/config`,
        error: error.message,
        success: false
      };
      if (verbose) console.error('❌ Config endpoint error:', error.message);
    }
    
    // Test 3: Auto-discovery
    if (verbose) console.log('Tes 3: Auto-discovery...');
    // Gunakan mode verbose false untuk mengurangi log berlebihan
    const discoveryResult = await testAutoDiscovery(verbose);
    results.discovery = discoveryResult;
    
    // Overall status
    results.overallStatus = (
      (results.endpoints.health?.success || results.endpoints.config?.success) &&
      results.discovery.success
    );
    
    if (verbose) {
      console.log(results.overallStatus ? '✅ Koneksi ke backend berhasil' : '❌ Koneksi ke backend gagal');
      
      // Tampilkan rangkuman
      console.log('\n📊 Rangkuman Hasil');
      console.table({
        'Health Check': results.endpoints.health?.success ? '✅ OK' : '❌ Gagal',
        'Config Endpoint': results.endpoints.config?.success ? '✅ OK' : '❌ Gagal',
        'Auto-Discovery': results.discovery.success ? '✅ OK' : '❌ Gagal',
        'Status Keseluruhan': results.overallStatus ? '✅ OK' : '❌ Gagal'
      });
    }
    
    return results;
    
  } catch (error) {
    if (verbose) console.error('❌ Error selama pengujian:', error);
    results.error = error.message;
    return results;
  } finally {
    if (verbose) console.groupEnd();
  }
};

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
  
  // Periksa apakah endpoint sudah diawali dengan "api/"
  let fullUrl = `${getApiUrl()}`;
  if (!endpoint.startsWith('/')) {
    fullUrl += '/';
  }
  fullUrl += endpoint;
  
  // Hindari duplikasi '/api/api/'
  fullUrl = fullUrl.replace('/api/api/', '/api/');
  
  try {
    const response = await axios({
      url: fullUrl,
      ...requestOptions,
    });
    
    return response.data;
  } catch (error) {
    // Handle error sesuai kebutuhan
    console.error(`Error pada request API ke ${endpoint}:`, error);
    throw error;
  }
};

export default {
  testBackendConnection,
  testAutoDiscovery
}; 