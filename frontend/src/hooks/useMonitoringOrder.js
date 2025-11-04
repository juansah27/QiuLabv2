import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getApiUrl } from '../config';

/**
 * Custom hook for managing Monitoring Order data with optimizations
 * Provides enhanced error handling, caching, and performance optimizations
 */
export const useMonitoringOrder = () => {
  // Core state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetch, setLastFetch] = useState(null);
  
  // Filters state with defaults
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    brand: '',
    marketplace: ''
  });
  
  // Cache and performance refs
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Initialize default date range on mount
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startDate = new Date(yesterday);
    startDate.setHours(17, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(17, 0, 0, 0);
    
    setFilters({
      startDate: startDate.toISOString().slice(0, 16),
      endDate: endDate.toISOString().slice(0, 16),
      brand: '',
      marketplace: ''
    });
  }, []);

  // Optimized data processing with memoization
  const processedData = useMemo(() => {
    if (!rawData.length) {
      return {
        cards: {
          totalOrder: 0,
          totalOrderInterface: 0,
          totalOrderNotYetInterface: 0,
          totalOrderPendingVerifikasi: 0,
          totalOrderLebihDari1Jam: 0,
          totalOrderKurangDari1Jam: 0
        },
        orderEvolution: [],
        top20Data: [],
        topMarketplaceData: [],
        brands: [],
        marketplaces: []
      };
    }

    // Process cards with enhanced performance
    const cards = {
      totalOrder: rawData.length,
      totalOrderInterface: rawData.filter(item => item.Status_Interfaced === 'Yes').length,
      totalOrderNotYetInterface: rawData.filter(item => item.Status_Interfaced === 'No').length,
      totalOrderPendingVerifikasi: rawData.filter(item => item['ORDER STATUS'] === 'PENDING VERIFIKASI').length,
      totalOrderLebihDari1Jam: rawData.filter(item => item.Status_Durasi === 'Lebih Dari 1 jam').length,
      totalOrderKurangDari1Jam: rawData.filter(item => item.Status_Durasi === 'Kurang Dari 1 jam').length
    };

    // Extract unique brands and marketplaces with sorting
    const brands = [...new Set(rawData.map(item => item.Brand).filter(Boolean))].sort();
    const marketplaces = [...new Set(rawData.map(item => item.MARKETPLACE).filter(Boolean))].sort();

    // Process TOP 20 brands data with enhanced counting
    const brandCounts = rawData.reduce((acc, item) => {
      if (item.Brand) {
        acc[item.Brand] = (acc[item.Brand] || 0) + 1;
      }
      return acc;
    }, {});
    
    const top20Data = Object.entries(brandCounts)
      .map(([brand, count]) => ({ name: brand, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Process marketplace data
    const marketplaceCounts = rawData.reduce((acc, item) => {
      if (item.MARKETPLACE) {
        acc[item.MARKETPLACE] = (acc[item.MARKETPLACE] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topMarketplaceData = Object.entries(marketplaceCounts)
      .map(([marketplace, count]) => ({ name: marketplace, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Enhanced order evolution processing with better time handling
    const orderEvolution = [];
    const now = new Date();
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() - 1);
    startTime.setHours(17, 0, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(17, 0, 0, 0);

    // Generate hourly intervals with better performance
    for (let time = new Date(startTime); time <= endTime; time.setHours(time.getHours() + 1)) {
      const nextHour = new Date(time);
      nextHour.setHours(nextHour.getHours() + 1);
      
      const ordersInHour = rawData.filter(item => {
        const orderTime = new Date(item.OrderDate);
        return orderTime >= time && orderTime < nextHour;
      }).length;

      orderEvolution.push({
        time: time.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        orders: ordersInHour,
        timestamp: time.getTime()
      });
    }

    return {
      cards,
      orderEvolution,
      top20Data,
      topMarketplaceData,
      brands,
      marketplaces
    };
  }, [rawData]);

  // Enhanced filtered data processing
  const filteredData = useMemo(() => {
    if (!rawData.length) return rawData;

    let filtered = [...rawData];

    // Apply date range filter with enhanced validation
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      // Validate dates
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        filtered = filtered.filter(item => {
          const orderDate = new Date(item.OrderDate);
          return !isNaN(orderDate.getTime()) && orderDate >= startDate && orderDate <= endDate;
        });
      }
    }

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter(item => item.Brand === filters.brand);
    }

    // Apply marketplace filter
    if (filters.marketplace) {
      filtered = filtered.filter(item => item.MARKETPLACE === filters.marketplace);
    }

    return filtered;
  }, [rawData, filters]);

  // Enhanced fetch function with retry logic and caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first (unless force refresh)
    const cacheKey = 'monitoring-order-data';
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached data');
      setRawData(cached.data);
      setLoading(false);
      setError(null);
      setLastFetch(new Date(cached.timestamp));
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    const attemptFetch = async (attempt = 1) => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        
        const response = await fetch(`${apiUrl}/query/monitoring-order`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          const timestamp = now;
          
          // Cache the result
          cacheRef.current.set(cacheKey, {
            data: result.data,
            timestamp
          });
          
          setRawData(result.data);
          setLastFetch(new Date(timestamp));
          setRetryCount(0);
          console.log('Data fetched successfully:', result.data.length, 'items');
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }

        console.error(`Fetch attempt ${attempt} failed:`, err);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
          return attemptFetch(attempt + 1);
        } else {
          // Final fallback with mock data
          console.log('All attempts failed, using fallback mock data');
          const mockData = generateMockData();
          setRawData(mockData);
          setError(`Failed to fetch data after ${MAX_RETRIES} attempts: ${err.message}`);
          setRetryCount(attempt);
        }
      } finally {
        setLoading(false);
      }
    };

    await attemptFetch();
  }, []);

  // Generate mock data for fallback
  const generateMockData = useCallback(() => {
    const mockEntries = [
      { 'MARKETPLACE': 'SHOPEE', 'Brand': 'FACETOLOGY', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam' },
      { 'MARKETPLACE': 'LAZADA', 'Brand': 'SOMEBYMI', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'No', 'Status_Durasi': 'Kurang Dari 1 jam' },
      { 'MARKETPLACE': 'TOKOPEDIA', 'Brand': 'BRAND_A', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Kurang Dari 1 jam' },
      { 'MARKETPLACE': 'TIKTOK', 'Brand': 'BRAND_B', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'No', 'Status_Durasi': 'Lebih Dari 1 jam' },
      { 'MARKETPLACE': 'SHOPEE', 'Brand': 'BRAND_C', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Kurang Dari 1 jam' }
    ];

    // Generate diverse mock data
    const mockData = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const baseEntry = mockEntries[i % mockEntries.length];
      const orderTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      
      mockData.push({
        ...baseEntry,
        OrderDate: orderTime.toISOString(),
        SystemRefId: `MOCK_${1000 + i}`,
        id: i + 1
      });
    }
    
    return mockData;
  }, []);

  // Enhanced filter update function
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters function
  const clearFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      brand: '',
      marketplace: ''
    });
  }, []);

  // Retry function for manual retry
  const retry = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute statistics for performance monitoring
  const stats = useMemo(() => ({
    totalRecords: rawData.length,
    filteredRecords: filteredData.length,
    filterEfficiency: rawData.length > 0 ? (filteredData.length / rawData.length * 100).toFixed(1) : 0,
    lastUpdate: lastFetch,
    cacheStatus: cacheRef.current.size > 0 ? 'active' : 'empty',
    retryCount
  }), [rawData.length, filteredData.length, lastFetch, retryCount]);

  return {
    // Data
    rawData,
    filteredData,
    processedData,
    
    // State
    loading,
    error,
    filters,
    stats,
    
    // Actions
    fetchData,
    updateFilters,
    clearFilters,
    retry,
    
    // Computed values
    hasData: rawData.length > 0,
    hasFilters: Object.values(filters).some(filter => filter !== ''),
    isStale: lastFetch && (Date.now() - lastFetch.getTime()) > CACHE_DURATION
  };
};

export default useMonitoringOrder;