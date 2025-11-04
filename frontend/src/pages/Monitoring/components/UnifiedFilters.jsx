import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const UnifiedFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  onRefresh,
  isDataFresh,
  dataTimestamp,
  filtersApplied 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Available brands and marketplaces (could be fetched from API)
  const availableBrands = useMemo(() => [
    'AMAN MAJU NUSANTARA',
    'MOP',
    'MOTHER OF PEARL',
    'SH680AFFCF5F1503000192BFEF',
    'SH680AFFA3CFF47E0001ABE2F8',
    'SH680A5D8BE21B8400014847F3',
    'SH680A60EB5F1503000192A84B',
    'SH683034454CEDFD000169A351',
    'SH680A672AE21B8400014849A9',
    'SH681AD742E21B840001E630EF',
    'SH682709144CEDFD0001FA8810',
    'SH680A67FDE21B8400014849AB'
  ], []);

  const availableMarketplaces = useMemo(() => [
    'MPSH',
    'SHOPEE',
    'LAZADA',
    'TOKOPEDIA',
    'BUKALAPAK'
  ], []);

  const availableStatuses = useMemo(() => [
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' }
  ], []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  // Handle date range changes
  const handleDateRangeChange = useCallback((field, value) => {
    const newDateRange = {
      ...localFilters.dateRange,
      [field]: value
    };
    handleFilterChange('dateRange', newDateRange);
  }, [localFilters.dateRange, handleFilterChange]);

  // Handle status filter changes
  const handleStatusChange = useCallback((event) => {
    const value = event.target.value;
    handleFilterChange('status', value);
  }, [handleFilterChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      dateRange: {
        start_date: null,
        end_date: null
      },
      brand: null,
      marketplace: null,
      status: ['cancelled', 'unpaid', 'pending_payment']
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  }, [onClearFilters]);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      localFilters.dateRange.start_date ||
      localFilters.dateRange.end_date ||
      localFilters.brand ||
      localFilters.marketplace ||
      (localFilters.status && localFilters.status.length > 0)
    );
  }, [localFilters]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon color="primary" />
            <Typography variant="h6" component="h2">
              Unified Filters
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${Object.keys(filtersApplied).filter(key => filtersApplied[key]).length} active`}
                color="primary"
                size="small"
              />
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={onRefresh}
                color={isDataFresh ? "success" : "primary"}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Clear all filters">
              <IconButton 
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Data freshness indicator */}
        {dataTimestamp && (
          <Alert 
            severity={isDataFresh ? "success" : "warning"} 
            icon={<InfoIcon />}
            sx={{ mb: 2 }}
          >
            Data last updated: {formatTimestamp(dataTimestamp)}
            {!isDataFresh && " (Consider refreshing for latest data)"}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box display="flex" gap={1}>
                <DatePicker
                  label="Start Date"
                  value={localFilters.dateRange.start_date}
                  onChange={(value) => handleDateRangeChange('start_date', value)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  maxDate={localFilters.dateRange.end_date || new Date()}
                />
                <DatePicker
                  label="End Date"
                  value={localFilters.dateRange.end_date}
                  onChange={(value) => handleDateRangeChange('end_date', value)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={localFilters.dateRange.start_date}
                  maxDate={new Date()}
                />
              </Box>
            </LocalizationProvider>
          </Grid>

          {/* Brand Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={localFilters.brand || ''}
                label="Brand"
                onChange={(e) => handleFilterChange('brand', e.target.value || null)}
              >
                <MenuItem value="">
                  <em>All Brands</em>
                </MenuItem>
                {availableBrands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Marketplace Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Marketplace</InputLabel>
              <Select
                value={localFilters.marketplace || ''}
                label="Marketplace"
                onChange={(e) => handleFilterChange('marketplace', e.target.value || null)}
              >
                <MenuItem value="">
                  <em>All Marketplaces</em>
                </MenuItem>
                {availableMarketplaces.map((marketplace) => (
                  <MenuItem key={marketplace} value={marketplace}>
                    {marketplace}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Advanced Filters */}
          <Grid item xs={12}>
            <Button
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              startIcon={<FilterIcon />}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </Grid>

          {showAdvanced && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Exclude Status</InputLabel>
                <Select
                  multiple
                  value={localFilters.status || []}
                  label="Exclude Status"
                  onChange={handleStatusChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={availableStatuses.find(s => s.value === value)?.label || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {availableStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Active Filters:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {localFilters.dateRange.start_date && (
                <Chip
                  label={`From: ${new Date(localFilters.dateRange.start_date).toLocaleDateString()}`}
                  onDelete={() => handleDateRangeChange('start_date', null)}
                  size="small"
                />
              )}
              {localFilters.dateRange.end_date && (
                <Chip
                  label={`To: ${new Date(localFilters.dateRange.end_date).toLocaleDateString()}`}
                  onDelete={() => handleDateRangeChange('end_date', null)}
                  size="small"
                />
              )}
              {localFilters.brand && (
                <Chip
                  label={`Brand: ${localFilters.brand}`}
                  onDelete={() => handleFilterChange('brand', null)}
                  size="small"
                />
              )}
              {localFilters.marketplace && (
                <Chip
                  label={`Marketplace: ${localFilters.marketplace}`}
                  onDelete={() => handleFilterChange('marketplace', null)}
                  size="small"
                />
              )}
              {localFilters.status && localFilters.status.length > 0 && (
                <Chip
                  label={`Excluded: ${localFilters.status.length} statuses`}
                  onDelete={() => handleFilterChange('status', [])}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedFilters;
