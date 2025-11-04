import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

import { useUnifiedMonitoring } from './hooks/useUnifiedMonitoring';
import UnifiedFilters from './components/UnifiedFilters';
import UnifiedCards from './components/UnifiedCards';
import UnifiedCharts from './components/UnifiedCharts';

const UnifiedMonitoringPage = () => {
  const [systemRefIds, setSystemRefIds] = useState('');
  const [showTable, setShowTable] = useState(false);
  
  const {
    isLoading,
    error,
    unifiedData,
    notification,
    filters,
    processUnifiedData,
    updateFilters,
    clearFilters,
    getCardsData,
    getChartsData,
    getTableData,
    getFiltersApplied,
    getDataTimestamp,
    isDataFresh,
    validateDataConsistency
  } = useUnifiedMonitoring();

  // Handle system ref IDs input
  const handleSystemRefIdsChange = (event) => {
    setSystemRefIds(event.target.value);
  };

  // Process system ref IDs
  const handleProcessData = useCallback(async () => {
    if (!systemRefIds.trim()) {
      return;
    }

    // Parse system ref IDs (comma-separated or newline-separated)
    const ids = systemRefIds
      .split(/[,\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (ids.length === 0) {
      return;
    }

    await processUnifiedData(ids);
  }, [systemRefIds, processUnifiedData]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (unifiedData && systemRefIds.trim()) {
      const ids = systemRefIds
        .split(/[,\n]/)
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      await processUnifiedData(ids);
    }
  }, [unifiedData, systemRefIds, processUnifiedData]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Export data
  const handleExportData = useCallback(() => {
    if (!unifiedData) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      filters: getFiltersApplied,
      cards: getCardsData,
      charts: getChartsData,
      table: getTableData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [unifiedData, getFiltersApplied, getCardsData, getChartsData, getTableData]);

  // Close notification
  const handleCloseNotification = useCallback(() => {
    // This would be handled by the hook, but we can add additional logic here
  }, []);

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Unified Order Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consistent data across cards and charts with unified filtering
          </Typography>
        </Box>

        {/* System Ref IDs Input */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Reference IDs
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Enter System Reference IDs (comma or newline separated)"
                  value={systemRefIds}
                  onChange={handleSystemRefIdsChange}
                  placeholder="ORDER001, ORDER002, ORDER003..."
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={handleProcessData}
                    disabled={!systemRefIds.trim() || isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    fullWidth
                  >
                    {isLoading ? 'Processing...' : 'Process Data'}
                  </Button>
                  {unifiedData && (
                    <Button
                      variant="outlined"
                      onClick={handleExportData}
                      startIcon={<DownloadIcon />}
                    >
                      Export
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Unified Filters */}
        {unifiedData && (
          <UnifiedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            onRefresh={handleRefresh}
            isDataFresh={isDataFresh}
            dataTimestamp={getDataTimestamp}
            filtersApplied={getFiltersApplied}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" ml={2}>
              Processing unified monitoring data...
            </Typography>
          </Box>
        )}

        {/* Data Display */}
        {unifiedData && !isLoading && (
          <Box>
            {/* Cards Section */}
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Summary Cards
              </Typography>
              <UnifiedCards
                cardsData={getCardsData}
                isDataFresh={isDataFresh}
                dataTimestamp={getDataTimestamp}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Charts Section */}
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Analytics Charts
              </Typography>
              <UnifiedCharts
                chartsData={getChartsData}
                isDataFresh={isDataFresh}
                dataTimestamp={getDataTimestamp}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Table Section */}
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">
                  Detailed Data Table
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setShowTable(!showTable)}
                  startIcon={<ViewIcon />}
                >
                  {showTable ? 'Hide Table' : 'Show Table'}
                </Button>
              </Box>
              
              {showTable && (
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Showing {getTableData.length} records
                    </Typography>
                    
                    {/* Simple table display - you can replace this with a more sophisticated table component */}
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              SystemRefId
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              SystemId
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              MerchantName
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              OrderStatus
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              Status_Interfaced
                            </th>
                            <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                              OrderDate
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTableData.slice(0, 50).map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.SystemRefId}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.SystemId}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.MerchantName}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.OrderStatus}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.Status_Interfaced}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                {row.OrderDate ? new Date(row.OrderDate).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {getTableData.length > 50 && (
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Showing first 50 records of {getTableData.length} total records
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default UnifiedMonitoringPage;
