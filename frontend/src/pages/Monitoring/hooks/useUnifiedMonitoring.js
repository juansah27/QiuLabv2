import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../../config';

export function useUnifiedMonitoring() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unifiedData, setUnifiedData] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  
  // Unified filter state
  const [filters, setFilters] = useState({
    dateRange: {
      start_date: null,
      end_date: null
    },
    brand: null,
    marketplace: null,
    status: ['cancelled', 'unpaid', 'pending_payment'] // Default excluded statuses
  });

  // Process unified data from API
  const processUnifiedData = useCallback(async (systemRefIds) => {
    if (!systemRefIds || systemRefIds.length === 0) {
      setError('No SystemRefIds provided');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      setNotification({
        open: true,
        message: 'Fetching unified monitoring data...',
        type: 'info'
      });

      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        return false;
      }

      // Call the unified monitoring endpoint
      const response = await axios.post(
        `${apiUrl}/query/monitoring-unified`,
        {
          system_ref_ids: systemRefIds,
          filters: filters
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        const data = response.data.data;
        
        // Validate data consistency
        const validationResult = validateDataConsistency(data);
        
        if (!validationResult.isValid) {
          console.warn('Data consistency warning:', validationResult.warnings);
        }

        setUnifiedData(data);
        
        setNotification({
          open: true,
          message: `Successfully loaded ${data.results.length} orders with unified filters`,
          type: 'success'
        });

        return true;
      } else {
        setError(response.data.error || 'Failed to fetch unified data');
        return false;
      }

    } catch (err) {
      console.error('Error fetching unified monitoring data:', err);
      const errorMessage = err.response?.data?.details || 
                         err.response?.data?.error || 
                         err.message || 
                         'Terjadi kesalahan saat memproses data';
      setError(errorMessage);
      
      setNotification({
        open: true,
        message: errorMessage,
        type: 'error'
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Validate data consistency between cards and charts
  const validateDataConsistency = useCallback((data) => {
    const warnings = [];
    
    // Check if total orders in cards matches sum of chart data
    const totalOrders = data.cards.total_orders;
    
    // Check top brands sum
    const topBrandsSum = data.charts.top_brands.reduce((sum, item) => sum + item.value, 0);
    if (totalOrders !== topBrandsSum) {
      warnings.push(`Top brands sum (${topBrandsSum}) doesn't match total orders (${totalOrders})`);
    }
    
    // Check platform distribution sum
    const platformSum = data.charts.platform_distribution.reduce((sum, item) => sum + item.value, 0);
    if (totalOrders !== platformSum) {
      warnings.push(`Platform distribution sum (${platformSum}) doesn't match total orders (${totalOrders})`);
    }
    
    // Check order evolution sum
    const evolutionSum = data.charts.order_evolution.reduce((sum, item) => sum + item.value, 0);
    if (totalOrders !== evolutionSum) {
      warnings.push(`Order evolution sum (${evolutionSum}) doesn't match total orders (${totalOrders})`);
    }
    
    return {
      isValid: warnings.length === 0,
      warnings
    };
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: {
        start_date: null,
        end_date: null
      },
      brand: null,
      marketplace: null,
      status: ['cancelled', 'unpaid', 'pending_payment']
    });
  }, []);

  // Get filtered data for specific components
  const getCardsData = useMemo(() => {
    if (!unifiedData) return null;
    return unifiedData.cards;
  }, [unifiedData]);

  const getChartsData = useMemo(() => {
    if (!unifiedData) return null;
    return unifiedData.charts;
  }, [unifiedData]);

  const getTableData = useMemo(() => {
    if (!unifiedData) return [];
    return unifiedData.results || [];
  }, [unifiedData]);

  const getFiltersApplied = useMemo(() => {
    if (!unifiedData) return {};
    return unifiedData.filters_applied || {};
  }, [unifiedData]);

  const getDataTimestamp = useMemo(() => {
    if (!unifiedData) return null;
    return unifiedData.data_timestamp;
  }, [unifiedData]);

  // Check if data is fresh (within last 5 minutes)
  const isDataFresh = useMemo(() => {
    if (!getDataTimestamp) return false;
    
    const dataTime = new Date(getDataTimestamp);
    const currentTime = new Date();
    const diffMinutes = (currentTime - dataTime) / (1000 * 60);
    
    return diffMinutes < 5;
  }, [getDataTimestamp]);

  return {
    // State
    isLoading,
    error,
    unifiedData,
    notification,
    filters,
    
    // Actions
    processUnifiedData,
    updateFilters,
    clearFilters,
    
    // Computed data
    getCardsData,
    getChartsData,
    getTableData,
    getFiltersApplied,
    getDataTimestamp,
    isDataFresh,
    
    // Validation
    validateDataConsistency
  };
}
