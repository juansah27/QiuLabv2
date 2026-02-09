import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, CircularProgress, Typography, Button, Snackbar, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePageTitle } from '../../utils/pageTitle';
import TableChartIcon from '@mui/icons-material/TableChart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import html2canvas from 'html2canvas';

import StatusCards from './components/StatusCards';
import QueryResultTable from './components/QueryResultTable';
import SystemRefInput from './components/SystemRefInput';
import { useMonitoring, getRemarkValue } from './hooks/useMonitoring';
import { normalizeStatusName } from '../../config/statusGroups';



// Preload library XLSX untuk ekspor Excel
const preloadXLSXLibrary = () => {
  // Cek apakah library sudah dimuat sebelumnya
  if (typeof window.XLSX !== 'undefined') {
    console.log('Library XLSX sudah tersedia');
    return;
  }

  console.log('Memuat library XLSX...');
  // Buat element script
  const scriptEl = document.createElement('script');
  scriptEl.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  scriptEl.async = true;
  scriptEl.id = 'xlsx-script';

  // Tambahkan event untuk memantau status loading
  scriptEl.onload = () => {
    console.log('Library XLSX berhasil dimuat');
  };

  scriptEl.onerror = (error) => {
    console.error('Gagal memuat library XLSX:', error);
  };

  // Tambahkan script ke body
  document.body.appendChild(scriptEl);
};

const MonitoringPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Set page title
  usePageTitle('Cek Order');

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [systemRefIds, setSystemRefIds] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const [activeFilters, setActiveFilters] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const dashboardRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({
      open: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  const handleFilterClick = useCallback((column, value) => {
    setActiveFilters(prev => {
      const existingFilterIndex = prev.findIndex(
        filter => filter.column === column && filter.value === value
      );

      if (existingFilterIndex >= 0) {
        const newFilters = [...prev];
        newFilters.splice(existingFilterIndex, 1);
        return newFilters;
      }

      return [...prev, { column, value }];
    });
  }, []);

  const removeFilter = useCallback((index) => {
    setActiveFilters(prev => {
      const newFilters = [...prev];
      newFilters.splice(index, 1);
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!systemRefIds.trim()) {
      setError('Silakan masukkan minimal satu SystemRefId');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idsArray = systemRefIds
        .split(/[\n,]+/)
        .map(id => id.trim())
        .filter(id => id);

      const BATCH_SIZE = 2000;
      const DELAY_BETWEEN_BATCHES = 50;
      const PARALLEL_BATCHES = 4;
      const totalBatches = Math.ceil(idsArray.length / BATCH_SIZE);
      let processedIds = new Set();

      // Reset data before starting
      setData([]);

      // Function to process a single batch
      const processBatch = async (batchIndex) => {
        const start = batchIndex * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batchIds = idsArray.slice(start, end);
        try {
          const response = await fetch('/api/query/monitoring', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              system_ref_ids: batchIds
            })
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || `Error pada batch ${batchIndex + 1}: ${response.status} ${response.statusText}`);
          }
          const result = await response.json();
          const batchData = result.data?.results || [];
          const newBatch = [];
          for (const item of batchData) {
            if (item && (item['Order Number'] || item.SystemRefId)) {
              const cleanId = (item['Order Number'] || item.SystemRefId).trim();
              if (!processedIds.has(cleanId)) {
                processedIds.add(cleanId);
                newBatch.push({
                  ...item,
                  Remark: item.Remark || null // Ensure Remark is always present
                });
              }
            }
          }
          // Incremental rendering: update data after each batch
          if (newBatch.length > 0) setData(prev => [...prev, ...newBatch]);
          // Update progress notification
          const progress = Math.round((processedIds.size / idsArray.length) * 100);
          setNotification({
            open: true,
            message: `Memproses Data... ${progress}% (${processedIds.size}/${idsArray.length} Order)`,
            type: 'info'
          });
        } catch (batchError) {
          console.error(`Error pada batch ${batchIndex + 1}:`, batchError);
        }
      };

      // Process batches with optimized parallel processing
      const processBatches = async () => {
        let currentBatchIndex = 0;
        const workerPool = new Array(PARALLEL_BATCHES).fill(null);
        const processNextBatch = async (workerIndex) => {
          if (currentBatchIndex >= totalBatches) return;
          const batchIndex = currentBatchIndex++;
          await processBatch(batchIndex);
          if (currentBatchIndex < totalBatches) {
            await processNextBatch(workerIndex);
          }
        };
        const workerPromises = workerPool.map((_, index) => processNextBatch(index));
        await Promise.all(workerPromises);
      };

      await processBatches();

      // Find missing IDs
      const missingIds = idsArray.filter(id => !processedIds.has(id.trim()));
      if (missingIds.length > 0) {
        setNotification({
          open: true,
          message: `Peringatan: ${missingIds.length} SystemRefId tidak ditemukan: ${missingIds.join(', ')}`,
          type: 'warning'
        });
      }
      // Final notification
      const successMessage = missingIds.length > 0
        ? `${processedIds.size} Data berhasil dimuat dari ${idsArray.length} SystemRefId (${missingIds.length} SystemRefId tidak ditemukan)`
        : `${processedIds.size} Data berhasil dimuat dari ${idsArray.length} SystemRefId`;
      showNotification(successMessage, 'success');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
      showNotification('Gagal memuat data: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [systemRefIds, showNotification]);

  const handleSubmit = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleSystemRefChange = useCallback((value) => {
    setSystemRefIds(value);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Add retry mechanism
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          // Reset data before fetching new data
          setData([]);
          await fetchData();
          showNotification('Data berhasil diperbarui', 'success');
          return;
        } catch (err) {
          lastError = err;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      throw lastError;
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err.message || 'Gagal memuat data. Silakan coba lagi.');
      showNotification('Gagal memuat data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, showNotification]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      const pad = (num) => String(num).padStart(2, '0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    } catch {
      return date;
    }
  };

  useEffect(() => {
    preloadXLSXLibrary();
  }, []);



  const filteredData = useMemo(() => {
    if (!data || !data.length) {
      return data;
    }

    // If no filters are active, return all data
    if (!activeFilters || activeFilters.length === 0) {
      return data;
    }

    const filtered = data.filter(item => {
      if (!item) return false;

      // Check each active filter
      for (const filter of activeFilters) {
        const { column, value } = filter;

        if (column === 'all') continue;

        const itemValue = item[column];

        if (column === 'Remark') {
          const remarkValue = getRemarkValue(item);
          const normalizedRemarkValue = normalizeStatusName(remarkValue);
          let matches = false;

          // Handle special cases for Remark filtering
          if (value === 'NULL' && (!remarkValue || remarkValue === '' || remarkValue === null)) {
            matches = true;
          } else if (value === 'Cancel' && (normalizedRemarkValue === 'Cancel' || normalizedRemarkValue === 'IN_Cancel' || normalizedRemarkValue === 'Cancelled')) {
            matches = true;
          } else if (value === 'Pending Verifikasi' && normalizedRemarkValue === 'Pending Verifikasi') {
            matches = true;
          } else if (normalizedRemarkValue === value) {
            matches = true;
          }

          if (!matches) {
            return false;
          }
        } else {
          // For other columns, do direct comparison
          if (itemValue !== value) {
            return false;
          }
        }
      }

      return true;
    });

    return filtered;
  }, [data, activeFilters]);

  const handleScreenshot = async () => {
    if (!dashboardRef.current) return;
    await document.fonts.ready; // ensure fonts are loaded
    const isDarkMode = theme.palette.mode === 'dark';
    const canvas = await html2canvas(dashboardRef.current, {
      backgroundColor: isDarkMode ? '#181A20' : '#fff',
      useCORS: true,
      scale: 2
    });
    const link = document.createElement('a');
    link.download = `monitoring-dashboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Tambahkan handler untuk update data lokal
  const handleDataChange = (updatedData) => {
    setData(updatedData);
  };

  return (
    <Box sx={{ width: '100%', p: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white" style={{ margin: 0 }}>
          Monitoring Dashboard
        </h1>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {data && data.length > 0 && (
            <Button
              variant="contained"
              color={showTable ? 'secondary' : 'primary'}
              startIcon={<TableChartIcon />}
              onClick={() => setShowTable((prev) => !prev)}
              sx={{
                boxShadow: 2,
                fontWeight: 600,
                letterSpacing: 0.5,
                borderRadius: 2,
                minWidth: 170,
                height: 44
              }}
            >
              {showTable ? 'Sembunyikan Tabel' : 'Tampilkan Tabel'}
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CameraAltIcon />}
            onClick={handleScreenshot}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              minWidth: 44,
              height: 44
            }}
          >
            Screenshot
          </Button>
        </Box>
      </Box>

      {/* Wrap dashboard visual in a ref for screenshot */}
      <div ref={dashboardRef}>
        {!data || data.length === 0 ? (
          <Box sx={{ mb: 4 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <SystemRefInput
                value={systemRefIds}
                onChange={handleSystemRefChange}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </Box>
        ) : null}

        {error && (
          <Box sx={{
            mb: 3,
            p: 2,
            bgcolor: 'error.light',
            color: 'error.dark',
            borderRadius: 1,
            '&.MuiBox-root': {
              backgroundColor: theme.palette.mode === 'dark' ? '#3A1D1D' : 'error.light',
              color: theme.palette.mode === 'dark' ? '#F4A5A5' : 'error.dark',
            }
          }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              Error: {error}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRefresh}
              sx={{ mt: 1 }}
            >
              Coba Lagi
            </Button>
          </Box>
        )}

        {isLoading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            my: 4,
            '& .MuiCircularProgress-root': {
              color: theme.palette.mode === 'dark' ? '#90CAF9' : '#1976d2'
            }
          }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && !error && (
          <Box sx={{ mb: 4 }}>
            <StatusCards
              tableData={data}
              onFilterClick={handleFilterClick}
              activeFilters={activeFilters}
            />
          </Box>
        )}

        {/* Table only rendered if showTable is true */}
        {!isLoading && !error && filteredData.length > 0 && showTable && (
          <Box sx={{ width: '100%', mb: 4 }}>
            <QueryResultTable
              data={filteredData}
              loading={isLoading}
              activeFilters={activeFilters}
              onRefresh={handleRefresh}
              onClearExternalFilters={clearAllFilters}
              onDataChange={handleDataChange}
            />
          </Box>
        )}

        {/* Show message when table is hidden but data is available */}
        {!isLoading && !error && filteredData.length > 0 && !showTable && (
          <Box sx={{
            width: '100%',
            mb: 4,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24, 26, 32, 0.95)' : 'background.paper',
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: 1
          }}>
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p className="mb-2">Tabel tersembunyi. Klik "Tampilkan Tabel" untuk melihat data yang difilter.</p>
              <p className="text-sm">Data yang difilter: {filteredData.length} dari {data.length} total</p>
            </div>
          </Box>
        )}



        {!isLoading && !error && data.length > 0 && filteredData.length === 0 && (
          <Box sx={{
            width: '100%',
            mb: 4,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(24, 26, 32, 0.95)' : 'background.paper',
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: 1
          }}>
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mb-2">Tidak ada data yang sesuai dengan filter yang dipilih</p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                Hapus Semua Filter
              </button>
            </div>
          </Box>
        )}
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.5)' : '0 3px 5px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <Alert
          elevation={6}
          variant="filled"
          severity={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonitoringPage; 