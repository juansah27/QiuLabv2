import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../../config';

// Fungsi untuk membersihkan SystemRefId dari whitespace dan karakter tak terlihat
export const cleanSystemRefId = (id) => {
  if (!id) return id;
  // Hanya hapus whitespace di awal/akhir, bukan di tengah
  return String(id).replace(/^[\s\u00A0\u1680\u2000-\u200F\u2028-\u202F\u205F\u3000\uFEFF]+|[\s\u00A0\u1680\u2000-\u200F\u2028-\u202F\u205F\u3000\uFEFF]+$/g, '');
};

// Fungsi untuk membersihkan SystemRefId dari teks yang di-paste
export const cleanInput = (input) => {
  if (!input) return '';
  // Split, trim, dan gabung lagi, tapi jangan hapus spasi di tengah
  return input.split(/[\n,;]+/).map(id => cleanSystemRefId(id)).filter(Boolean).join('\n');
};

// Fungsi helper untuk mendapatkan nilai remark dari localStorage jika tersedia
export const getRemarkValue = (rowData) => {
  // Remark sekarang selalu diambil dari backend
  return rowData.Remark;
};

// Fungsi untuk menormalisasi string untuk perbandingan
export const normalizeString = (str) => {
  return str ? String(str).toLowerCase().trim() : '';
};

// Fungsi untuk menentukan kategori remark (untuk status card)
export const getRemarkCategory = (remark) => {
  if (!remark || remark === '' || remark === null || remark === undefined) {
    return 'na';
  }
  
  const normalized = normalizeString(remark);
  
  // Deteksi Cancel
  if (normalized === 'cancel' || normalized === 'cancelled' || normalized === 'canceled' || 
      normalized === 'in_cancel' || normalized.includes('cancel')) {
    return 'cancel';
  }
  
  // Deteksi Pending verifikasi
  if (normalized.includes('pending') && normalized.includes('verifikasi')) {
    return 'pending';
  }
  
  // Deteksi Success interfaced
  if (normalized.includes('success') || normalized.includes('berhasil') || 
      normalized.includes('interfaced')) {
    return 'sukses';
  }
  
  // Default category
  return 'other';
};

// Konfigurasi batch processing yang dioptimalkan
const BATCH_CONFIG = {
  BATCH_SIZE: 200,
  PARALLEL_BATCHES: 5,
  DELAY_BETWEEN_BATCHES: 50,
  CACHE_EXPIRY: 1000 * 60 * 30, // 30 menit
  TRANSFORM_CHUNK_SIZE: 1000, // Ukuran chunk untuk transformasi data
  TRANSFORM_DELAY: 0 // Tidak ada delay untuk transformasi
};

// Fungsi helper untuk IndexedDB
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MonitoringDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('monitoringData')) {
        const store = db.createObjectStore('monitoringData', { keyPath: 'cacheKey' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

const saveToIndexedDB = async (cacheKey, data) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['monitoringData'], 'readwrite');
    const store = transaction.objectStore('monitoringData');
    
    await store.put({
      cacheKey,
      data,
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
};

const getFromIndexedDB = async (cacheKey) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['monitoringData'], 'readonly');
    const store = transaction.objectStore('monitoringData');
    
    const request = store.get(cacheKey);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() - result.timestamp < BATCH_CONFIG.CACHE_EXPIRY) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting from IndexedDB:', error);
    return null;
  }
};

const cleanupExpiredCache = async () => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['monitoringData'], 'readwrite');
    const store = transaction.objectStore('monitoringData');
    const index = store.index('timestamp');
    
    const expiredTimestamp = Date.now() - BATCH_CONFIG.CACHE_EXPIRY;
    const request = index.openCursor(IDBKeyRange.upperBound(expiredTimestamp));
    
    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
};

export function useMonitoring() {
  const [systemRefIds, setSystemRefIds] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const [filters, setFilters] = useState({
    statusInterfaced: null,
    Status_Interfaced: null,
    SystemId: null,
    systemId: null,
    MerchantName: null,
    merchantName: null,
    OrderStatus: null,
    orderStatus: null,
    Status_Durasi: null,
    statusDurasi: null,
    Remark: null,
    remark: null
  });
  const [activeFilters, setActiveFilters] = useState([]);

  // Cache untuk menyimpan hasil filter
  const filterCache = useRef(new Map());
  const lastFilterKey = useRef('');

  // Fungsi untuk transformasi data yang dioptimalkan
  const transformData = useCallback((data) => {
    const transformedData = [];
    const chunkSize = BATCH_CONFIG.TRANSFORM_CHUNK_SIZE;
    
    // Proses transformasi dalam chunk
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const transformedChunk = chunk.map(row => ({
        ...row,
        SystemRefId: cleanSystemRefId(row.SystemRefId),
        Remark: row.Remark || null
      }));
      transformedData.push(...transformedChunk);
    }
    
    return transformedData;
  }, []);

  // Fungsi utama untuk memproses data dari API dengan optimasi batch
  const processApiData = useCallback(async (idsArray) => {
    try {
      setIsLoading(true);
      const apiUrl = getApiUrl();
      
      // Cek cache terlebih dahulu
      const cacheKey = idsArray.sort().join(',');
      const cachedData = await getFromIndexedDB(cacheKey);
      
      if (cachedData) {
        setMonitoringData(cachedData);
        return true;
      }
      
      // Proses data dalam batch yang dioptimalkan
      const totalBatches = Math.ceil(idsArray.length / BATCH_CONFIG.BATCH_SIZE);
      let allData = [];
      let processedCount = 0;
      
      // Buat promise untuk setiap batch
      const batchPromises = [];
      for (let i = 0; i < totalBatches; i += BATCH_CONFIG.PARALLEL_BATCHES) {
        for (let j = 0; j < BATCH_CONFIG.PARALLEL_BATCHES && i + j < totalBatches; j++) {
          const startIdx = (i + j) * BATCH_CONFIG.BATCH_SIZE;
          const endIdx = Math.min(startIdx + BATCH_CONFIG.BATCH_SIZE, idsArray.length);
          const batchIds = idsArray.slice(startIdx, endIdx);
          
          batchPromises.push(
            axios.post(
              `${apiUrl}/query/monitoring`,
              { system_ref_ids: batchIds },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            )
          );
        }
      }
      
      // Proses semua batch secara paralel
      const batchResults = await Promise.all(batchPromises);
      
      // Transformasi data secara bertahap
      let currentIndex = 0;
      const processNextChunk = () => {
        const chunkSize = BATCH_CONFIG.TRANSFORM_CHUNK_SIZE;
        const endIndex = Math.min(currentIndex + chunkSize, batchResults.length);
        
        const chunk = batchResults.slice(currentIndex, endIndex)
          .flatMap(response => response.data.data.results || []);
        
        const transformedChunk = transformData(chunk);
        allData = [...allData, ...transformedChunk];
        processedCount += chunk.length;
        
        // Update progress
        const progress = Math.round((endIndex / batchResults.length) * 100);
        setNotification({
          open: true,
          message: `Memproses Data... ${progress}% (${processedCount}/${idsArray.length} Order)`,
          type: 'info'
        });
        
        currentIndex = endIndex;
        
        if (currentIndex < batchResults.length) {
          // Gunakan requestAnimationFrame untuk transformasi berikutnya
          requestAnimationFrame(processNextChunk);
        } else {
          // Semua data telah diproses
          const summaryData = calculateSummaryData(allData);
          const enrichedData = {
            results: allData,
            summaryData
          };
          
          // Simpan ke cache
          saveToIndexedDB(cacheKey, enrichedData);
          setMonitoringData(enrichedData);
          
          // Bersihkan cache yang expired
          cleanupExpiredCache();
        }
      };
      
      // Mulai proses transformasi
      processNextChunk();
      
      return true;
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      const errorMessage = err.response?.data?.details || 
                         err.response?.data?.error || 
                         err.message || 
                         'Terjadi kesalahan saat memproses data';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [transformData]);

  // Fungsi untuk menghitung data kartu ringkasan
  const calculateSummaryData = useCallback((results) => {
    if (!results || !Array.isArray(results)) return {};

    // Count berdasarkan kategori
    const counts = {
      sukses: 0,
      pending: 0,
      cancel: 0,
      na: 0
    };
    
    // Hitung jumlah untuk setiap kategori
    results.forEach(row => {
      // Ambil nilai remark (termasuk dari localStorage jika ada)
      const remarkValue = getRemarkValue(row);
      const category = getRemarkCategory(remarkValue);
      
      // Increment counter untuk kategori yang sesuai
      if (counts[category] !== undefined) {
        counts[category]++;
      }
      
      // Special case: jika Status_Interfaced adalah 'Yes', tambahkan ke sukses
      if (row.Status_Interfaced === 'Yes') {
        counts.sukses++;
      }
    });

    return counts;
  }, []);

  return {
    systemRefIds,
    isLoading,
    error,
    monitoringData,
    filters,
    activeFilters,
    notification,
    setSystemRefIds,
    setFilters,
    setActiveFilters,
    processApiData
  };
} 