import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { usePageTitle } from '../utils/pageTitle';
import './RefreshDB.css';

const RefreshDB = () => {
  // Set page title
  usePageTitle('Refresh Database');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('entityid');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [batchMode, setBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, percentage: 0 });
  
  // Filter states
  const [filters, setFilters] = useState({});
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null);
  
  const { user } = useAuth();
  const { theme } = useTheme();

  // Count search terms for display
  const getSearchTermsCount = () => {
    if (!searchTerm.trim()) return 0;
    const allTerms = [];
    for (const line of searchTerm.split('\n')) {
      const lineTerms = line.split(',').map(term => term.trim()).filter(term => term);
      allTerms.push(...lineTerms);
    }
    return new Set(allTerms).size; // Remove duplicates
  };

  // Process search terms into batches
  const processSearchTerms = () => {
    if (!searchTerm.trim()) return [];
    const allTerms = [];
    for (const line of searchTerm.split('\n')) {
      const lineTerms = line.split(',').map(term => term.trim()).filter(term => term);
      allTerms.push(...lineTerms);
    }
    return [...new Set(allTerms)]; // Remove duplicates
  };

  // Process single batch
  const processBatch = async (batchIds) => {
    try {
      const response = await api.post('/query/refreshdb/search', {
        search_term: batchIds.join('\n'),
        search_type: searchType
      });

      if (response.data.status === 'success') {
        return response.data.data || [];
      } else {
        throw new Error(response.data.error || 'Batch processing failed');
      }
    } catch (err) {
      console.error('Batch error:', err);
      throw err;
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSnackbar({
        open: true,
        message: 'Masukkan kata kunci pencarian',
        severity: 'warning'
      });
      return;
    }

    const searchTerms = processSearchTerms();
    if (searchTerms.length === 0) {
      setSnackbar({
        open: true,
        message: 'Tidak ada ID yang valid',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Check if batch mode is needed
      const needsBatchMode = searchTerms.length > 100;
      
      if (needsBatchMode && !batchMode) {
        setSnackbar({
          open: true,
          message: `Detected ${searchTerms.length} IDs. Enable batch mode to process large datasets.`,
          severity: 'info'
        });
        return;
      }

      if (batchMode && searchTerms.length > 100) {
        // Batch processing for large datasets
        const BATCH_SIZE = 100;
        const totalBatches = Math.ceil(searchTerms.length / BATCH_SIZE);
        let allResults = [];
        
        setBatchProgress({ current: 0, total: totalBatches, percentage: 0 });

        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE;
          const end = start + BATCH_SIZE;
          const batchIds = searchTerms.slice(start, end);

          try {
            const batchResults = await processBatch(batchIds);
            allResults = [...allResults, ...batchResults];
            
            // Update progress
            const current = i + 1;
            const percentage = Math.round((current / totalBatches) * 100);
            setBatchProgress({ current, total: totalBatches, percentage });
            
            // Update results incrementally
            setResults([...allResults]);
            
            // Show progress notification
            setSnackbar({
              open: true,
              message: `Processing batch ${current}/${totalBatches} (${percentage}%)`,
              severity: 'info'
            });

            // Small delay between batches to prevent overwhelming the server
            if (i < totalBatches - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError);
            setSnackbar({
              open: true,
              message: `Error in batch ${i + 1}: ${batchError.message}`,
              severity: 'error'
            });
          }
        }

        // Final success message
        setSnackbar({
          open: true,
          message: `Successfully processed ${allResults.length} results from ${searchTerms.length} IDs`,
          severity: 'success'
        });
      } else {
        // Single request for smaller datasets
        const response = await api.post('/query/refreshdb/search', {
          search_term: searchTerm.trim(),
          search_type: searchType
        });

        if (response.data.status === 'success') {
          setResults(response.data.data);
          if (response.data.data.length === 0) {
            setSnackbar({
              open: true,
              message: 'Tidak ada data yang ditemukan',
              severity: 'info'
            });
          }
        } else {
          setError(response.data.error || 'Terjadi kesalahan');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err.response?.data?.error || 'Gagal melakukan pencarian';
      setError(errorMessage);
      
      // Show specific message for too many search terms
      if (errorMessage.includes('Too many search terms')) {
        setSnackbar({
          open: true,
          message: 'Terlalu banyak ID. Aktifkan batch mode untuk memproses dataset besar.',
          severity: 'warning'
        });
      }
    } finally {
      setLoading(false);
      setBatchProgress({ current: 0, total: 0, percentage: 0 });
    }
  };

  const copyToClipboard = (text) => {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    
    // Fallback for older browsers or non-HTTPS
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve();
    } catch (err) {
      textArea.remove();
      return Promise.reject(err);
    }
  };

  const handleCopy = async (data) => {
    const orderNumbers = [
      data.EntityId,
      data.OrigSystemRefId,
      data.SystemRefId,
      data.OrderDate,
      data.Orderstatus,
      data.WhLoc,
      data.Ordnum,
      data['Status JDA'],
      data.Brand,
      data.Adddte,
      data['Refresh time'],
      data['Cek Order'],
      data.Status,
      data.Order_type,
      data.Deadline,
      data.Now,
      data.AWBLive,
      data.Manifest,
      data.Awb
    ].map(field => field || '').join('\t'); // Tab-separated for Excel

    try {
      await copyToClipboard(orderNumbers);
      setSnackbar({
        open: true,
        message: 'Nomor order berhasil disalin!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Copy error:', err);
      setSnackbar({
        open: true,
        message: 'Gagal menyalin ke clipboard',
        severity: 'error'
      });
    }
  };

  const handleCopyAll = async () => {
    try {
      // Use filtered results instead of all results
      const dataToCopy = filteredResults.length > 0 ? filteredResults : results;
      
      // Create tab-separated data for filtered results
      const allData = dataToCopy.map(row => [
        row.EntityId,
        row.OrigSystemRefId,
        row.SystemRefId,
        row.OrderDate,
        row.Orderstatus,
        row.WhLoc,
        row.Ordnum,
        row['Status JDA'],
        row.Brand,
        row.Adddte,
        row['Refresh time'],
        row['Cek Order'],
        row.Status,
        row.Order_type,
        row.Deadline,
        row.Now,
        row.AWBLive,
        row.Manifest,
        row.Awb
      ].map(field => field || '').join('\t')).join('\n'); // Each row on new line

      await copyToClipboard(allData);
      
      // Show appropriate message based on whether filters are active
      const isFiltered = getActiveFilterCount() > 0;
      const message = isFiltered 
        ? `${filteredResults.length} data yang difilter berhasil disalin!`
        : `Semua ${results.length} data berhasil disalin!`;
        
      setSnackbar({
        open: true,
        message: message,
        severity: 'success'
      });
    } catch (err) {
      console.error('Copy all error:', err);
      setSnackbar({
        open: true,
        message: 'Gagal menyalin data ke clipboard',
        severity: 'error'
      });
    }
  };





  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter or Cmd+Enter to search in multiline mode
      e.preventDefault();
      handleSearch();
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('success') || statusLower.includes('completed')) return 'success';
    if (statusLower.includes('error') || statusLower.includes('failed')) return 'error';
    if (statusLower.includes('pending') || statusLower.includes('processing')) return 'warning';
    return 'default';
  };

  // Get unique values for each column for filter options
  const getUniqueValues = (columnName) => {
    const values = new Set();
    results.forEach(row => {
      const value = row[columnName];
      if (value && value !== '-' && value !== 'N/A') {
        values.add(value);
      }
    });
    return Array.from(values).sort();
  };

  // Apply filters to results
  const filteredResults = useMemo(() => {
    if (!results.length) return [];
    
    return results.filter(row => {
      for (const [column, filterValues] of Object.entries(filters)) {
        if (!filterValues || filterValues.length === 0) continue;
        
        const cellValue = row[column];
        if (!cellValue || cellValue === '-' || cellValue === 'N/A') {
          return false;
        }
        
        // Check if cell value matches any of the selected filter values
        if (!filterValues.some(filterValue => 
          cellValue.toString().toLowerCase().includes(filterValue.toLowerCase())
        )) {
          return false;
        }
      }
      return true;
    });
  }, [results, filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setActiveFilterDropdown(null);
  };

  // Clear specific filter
  const clearFilter = (columnName) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnName];
      return newFilters;
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(values => values && values.length > 0).length;
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = (columnName) => {
    console.log('Toggle filter dropdown for:', columnName);
    console.log('Current activeFilterDropdown:', activeFilterDropdown);
    const newValue = activeFilterDropdown === columnName ? null : columnName;
    console.log('Setting activeFilterDropdown to:', newValue);
    setActiveFilterDropdown(newValue);
  };

  // Get dropdown position class based on data count and position
  const getDropdownPositionClass = (columnName) => {
    if (activeFilterDropdown !== columnName) return '';
    
    // For now, always show dropdown below to test
    return 'dropdown-position-down';
  };

  // Handle filter checkbox change
  const handleFilterChange = (columnName, value, checked) => {
    console.log('Filter change:', columnName, value, checked);
    setFilters(prev => {
      const currentFilters = prev[columnName] || [];
      if (checked) {
        return {
          ...prev,
          [columnName]: [...currentFilters, value]
        };
      } else {
        return {
          ...prev,
          [columnName]: currentFilters.filter(v => v !== value)
        };
      }
    });
  };

  // Handle select all filter
  const handleSelectAllFilter = (columnName, checked) => {
    const uniqueValues = getUniqueValues(columnName);
    if (checked) {
      setFilters(prev => ({
        ...prev,
        [columnName]: uniqueValues
      }));
    } else {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnName];
        return newFilters;
      });
    }
  };

  // Check if all values are selected for a column
  const isAllSelected = (columnName) => {
    const uniqueValues = getUniqueValues(columnName);
    const currentFilters = filters[columnName] || [];
    return uniqueValues.length > 0 && currentFilters.length === uniqueValues.length;
  };

  // Check if some values are selected for a column
  const isSomeSelected = (columnName) => {
    const uniqueValues = getUniqueValues(columnName);
    const currentFilters = filters[columnName] || [];
    return currentFilters.length > 0 && currentFilters.length < uniqueValues.length;
  };

  // Handle click outside filter dropdown
  const handleClickOutside = (event) => {
    if (activeFilterDropdown && !event.target.closest('.filter-dropdown-wrapper') && !event.target.closest('th')) {
      setActiveFilterDropdown(null);
    }
  };

  // Add click outside listener
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeFilterDropdown]);

  return (
    <div className={`refreshdb-container ${theme === 'dark' ? 'dark' : 'light'}`}>
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🗄️</div>
            <h1 className="main-title">RefreshDB</h1>
          </div>
          <h2 className="subtitle">Advanced Order Search & Management</h2>
          <p className="description">
            Cari dan kelola nomor order berdasarkan EntityID, SystemRefID, OrigSystemRefID, AWB, atau semua field dengan dukungan multiple values.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-card">
        <div className="card-header">
          <span className="card-icon">🔍</span>
          <h3>Search Configuration</h3>
        </div>
        
        <div className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label>Search Type</label>
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                disabled={loading}
                className="select-input"
              >
                <option value="entityid">EntityID (Default)</option>
                <option value="systemrefid">SystemRefID</option>
                <option value="origsystemrefid">OrigSystemRefID</option>
                <option value="awb">AWB</option>
                <option value="all">All Fields</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Processing Mode</label>
              <div className="mode-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={batchMode}
                    onChange={(e) => setBatchMode(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="mode-label">
                  {batchMode ? 'Batch Mode' : 'Single Mode'}
                  <span className="mode-description">
                    {batchMode ? ' (Supports 4000+ IDs)' : ' (Max 100 IDs)'}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="form-group textarea-group">
              <label>Search by {searchType.toUpperCase()}</label>
              <textarea
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Enter ${searchType} values...
• One per line
• Comma separated
• Mixed format
• ${batchMode ? 'Supports 4000+ IDs with batch processing' : 'Maximum 100 IDs per search'}

Examples:
BLI12181874766-284
BLI12181886055-284,BLI12181925864-284
DST-580066702183793668`}
                disabled={loading}
                rows={4}
                className="textarea-input"
              />
            </div>
            
            <div className="form-group button-group">
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className={`search-button ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🔍</span>
                    Search
                  </>
                )}
              </button>
              
              {searchTerm.trim() && (
                <div className="item-count">
                  <span className="count-badge">{getSearchTermsCount()}</span>
                  <span className="count-label">Items</span>
                </div>
              )}
              
              <button
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                  setError('');
                }}
                disabled={loading}
                className="clear-button"
                title="Clear all"
              >
                <span className="button-icon">🔄</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Batch Progress */}
      {batchMode && batchProgress.total > 0 && (
        <div className="batch-progress-card">
          <div className="progress-header">
            <span className="progress-icon">🔄</span>
            <h3>Batch Processing Progress</h3>
          </div>
          <div className="progress-content">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${batchProgress.percentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Batch {batchProgress.current} of {batchProgress.total} ({batchProgress.percentage}%)
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="results-card">
          <div className="card-header">
            <div className="header-left">
              <span className="card-icon">📊</span>
              <h3>Search Results</h3>
              <span className="results-count">
                {filteredResults.length} of {results.length} records
                {getActiveFilterCount() > 0 && (
                  <span className="filter-badge">({getActiveFilterCount()} filters active)</span>
                )}
              </span>
            </div>
            
                          <div className="header-actions">
                <button
                  onClick={() => setActiveFilterDropdown(null)}
                  className={`filter-toggle-button ${activeFilterDropdown ? 'active' : ''}`}
                  title="Toggle column filters"
                >
                  <span className="button-icon">🔍</span>
                  Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                </button>
                
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="clear-filters-button"
                    title="Clear all filters"
                  >
                    <span className="button-icon">🗑️</span>
                    Clear Filters
                  </button>
                )}
                
                <button
                  onClick={handleCopyAll}
                  className="action-button"
                  title="Copy all data in tab-separated format"
                >
                  <span className="button-icon">📋</span>
                  Copy All ({filteredResults.length})
                </button>
              </div>
                      </div>
            

            
            <div className="table-container">
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th className="table-header" onClick={() => toggleFilterDropdown('EntityId')}>
                        <div className="header-content">
                          <span className="header-text">EntityID</span>
                          <span className="header-icon">▼</span>
                        </div>
                                                {/* Debug: activeFilterDropdown = {activeFilterDropdown} */}
                        {activeFilterDropdown === 'EntityId' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('EntityId')}`} style={{border: '3px solid red'}}>
                            <div style={{padding: '10px', background: 'yellow'}}>DEBUG: Dropdown is visible!</div>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="filter-dropdown-header">
                    <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by EntityID</h4>
                    <button 
                      onClick={() => setActiveFilterDropdown(null)}
                      className="close-filter-dropdown"
                      title="Close filters"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="filter-dropdown-content">
                    <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                        <input
                          type="checkbox"
                                      checked={isAllSelected('EntityId')}
                                      onChange={(e) => handleSelectAllFilter('EntityId', e.target.checked)}
                        />
                                    <span>Select All</span>
                      </label>
                      <button
                                    onClick={() => clearFilter('EntityId')}
                        className="clear-filter-button"
                      >
                        Clear Filter
                      </button>
                    </div>
                    <div className="filter-checkbox-list">
                                  {getUniqueValues('EntityId').map(value => (
                        <label key={value} className="filter-checkbox-item">
                          <input
                            type="checkbox"
                                        checked={filters['EntityId']?.includes(value)}
                                        onChange={(e) => handleFilterChange('EntityId', value, e.target.checked)}
                          />
                                      <span className="filter-value">{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('OrigSystemRefId')}>
                        <div className="header-content">
                          <span className="header-text">OrigSystemRefID</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'OrigSystemRefId' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('OrigSystemRefId')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by OrigSystemRefID</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('OrigSystemRefId')}
                                      onChange={(e) => handleSelectAllFilter('OrigSystemRefId', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('OrigSystemRefId')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('OrigSystemRefId').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['OrigSystemRefId']?.includes(value)}
                                        onChange={(e) => handleFilterChange('OrigSystemRefId', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('SystemRefId')}>
                        <div className="header-content">
                          <span className="header-text">SystemRefID</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'SystemRefId' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('SystemRefId')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by SystemRefID</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('SystemRefId')}
                                      onChange={(e) => handleSelectAllFilter('SystemRefId', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('SystemRefId')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('SystemRefId').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['SystemRefId']?.includes(value)}
                                        onChange={(e) => handleFilterChange('SystemRefId', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('OrderDate')}>
                        <div className="header-content">
                          <span className="header-text">Order Date</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'OrderDate' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('OrderDate')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Order Date</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('OrderDate')}
                                      onChange={(e) => handleSelectAllFilter('OrderDate', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('OrderDate')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('OrderDate').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['OrderDate']?.includes(value)}
                                        onChange={(e) => handleFilterChange('OrderDate', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Orderstatus')}>
                        <div className="header-content">
                          <span className="header-text">Order Status</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Orderstatus' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Orderstatus')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Order Status</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Orderstatus')}
                                      onChange={(e) => handleSelectAllFilter('Orderstatus', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Orderstatus')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Orderstatus').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Orderstatus']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Orderstatus', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('WhLoc')}>
                        <div className="header-content">
                          <span className="header-text">WhLoc</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'WhLoc' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('WhLoc')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by WhLoc</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('WhLoc')}
                                      onChange={(e) => handleSelectAllFilter('WhLoc', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('WhLoc')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('WhLoc').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['WhLoc']?.includes(value)}
                                        onChange={(e) => handleFilterChange('WhLoc', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Ordnum')}>
                        <div className="header-content">
                          <span className="header-text">Ordnum</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Ordnum' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Ordnum')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Ordnum</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Ordnum')}
                                      onChange={(e) => handleSelectAllFilter('Ordnum', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Ordnum')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Ordnum').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Ordnum']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Ordnum', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Status JDA')}>
                        <div className="header-content">
                          <span className="header-text">Status JDA</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Status JDA' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Status JDA')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Status JDA</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Status JDA')}
                                      onChange={(e) => handleSelectAllFilter('Status JDA', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Status JDA')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Status JDA').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Status JDA']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Status JDA', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Brand')}>
                        <div className="header-content">
                          <span className="header-text">Brand</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Brand' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Brand')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Brand</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Brand')}
                                      onChange={(e) => handleSelectAllFilter('Brand', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Brand')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Brand').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Brand']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Brand', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Adddte')}>
                        <div className="header-content">
                          <span className="header-text">Adddte</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Adddte' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Adddte')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Adddte</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Adddte')}
                                      onChange={(e) => handleSelectAllFilter('Adddte', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Adddte')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Adddte').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Adddte']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Adddte', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Refresh time')}>
                        <div className="header-content">
                          <span className="header-text">Refresh Time</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Refresh time' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Refresh time')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Refresh Time</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Refresh time')}
                                      onChange={(e) => handleSelectAllFilter('Refresh time', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Refresh time')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Refresh time').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Refresh time']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Refresh time', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Cek Order')}>
                        <div className="header-content">
                          <span className="header-text">Cek Order</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Cek Order' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Cek Order')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Cek Order</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Cek Order')}
                                      onChange={(e) => handleSelectAllFilter('Cek Order', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Cek Order')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Cek Order').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Cek Order']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Cek Order', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Status')}>
                        <div className="header-content">
                          <span className="header-text">Status</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Status' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Status')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Status</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Status')}
                                      onChange={(e) => handleSelectAllFilter('Status', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Status')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Status').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Status']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Status', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Order_type')}>
                        <div className="header-content">
                          <span className="header-text">Order Type</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Order_type' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Order_type')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Order Type</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Order_type')}
                                      onChange={(e) => handleSelectAllFilter('Order_type', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Order_type')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Order_type').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Order_type']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Order_type', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Deadline')}>
                        <div className="header-content">
                          <span className="header-text">Deadline</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Deadline' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Deadline')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Deadline</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Deadline')}
                                      onChange={(e) => handleSelectAllFilter('Deadline', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Deadline')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Deadline').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Deadline']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Deadline', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Now')}>
                        <div className="header-content">
                          <span className="header-text">Now</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Now' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Now')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Now</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Now')}
                                      onChange={(e) => handleSelectAllFilter('Now', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Now')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Now').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Now']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Now', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('AWBLive')}>
                        <div className="header-content">
                          <span className="header-text">AWBLive</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'AWBLive' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('AWBLive')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by AWBLive</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('AWBLive')}
                                      onChange={(e) => handleSelectAllFilter('AWBLive', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('AWBLive')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('AWBLive').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['AWBLive']?.includes(value)}
                                        onChange={(e) => handleFilterChange('AWBLive', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Manifest')}>
                        <div className="header-content">
                          <span className="header-text">Manifest</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Manifest' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Manifest')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by Manifest</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Manifest')}
                                      onChange={(e) => handleSelectAllFilter('Manifest', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Manifest')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Manifest').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Manifest']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Manifest', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header" onClick={() => toggleFilterDropdown('Awb')}>
                        <div className="header-content">
                          <span className="header-text">AWB</span>
                          <span className="header-icon">▼</span>
                        </div>
                        {activeFilterDropdown === 'Awb' && (
                          <div className={`filter-dropdown-wrapper ${getDropdownPositionClass('Awb')}`}>
                            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                              <div className="filter-dropdown-header">
                                <span className="filter-dropdown-icon">🔍</span>
                                <h4>Filter by AWB</h4>
                                <button 
                                  onClick={() => setActiveFilterDropdown(null)}
                                  className="close-filter-dropdown"
                                  title="Close filters"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-dropdown-content">
                                <div className="filter-checkbox-group">
                                  <label className="select-all-label">
                                    <input
                                      type="checkbox"
                                      checked={isAllSelected('Awb')}
                                      onChange={(e) => handleSelectAllFilter('Awb', e.target.checked)}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  <button
                                    onClick={() => clearFilter('Awb')}
                                    className="clear-filter-button"
                                  >
                                    Clear Filter
                                  </button>
                                </div>
                                <div className="filter-checkbox-list">
                                  {getUniqueValues('Awb').map(value => (
                                    <label key={value} className="filter-checkbox-item">
                                      <input
                                        type="checkbox"
                                        checked={filters['Awb']?.includes(value)}
                                        onChange={(e) => handleFilterChange('Awb', value, e.target.checked)}
                                      />
                                      <span className="filter-value">{value}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </th>
                      <th className="table-header actions-header">
                        <div className="header-content">
                          <span className="header-text">Actions</span>
                        </div>
                      </th>
                </tr>
              </thead>
                              <tbody>
                  {filteredResults.map((row, index) => (
                      <tr key={index} className={`table-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                        <td className="table-cell entity-cell">
                          <div className="cell-content">
                            <span className="cell-text monospace">{row.EntityId || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell ref-cell">
                          <div className="cell-content">
                            <span className="cell-text monospace">{row.OrigSystemRefId || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell ref-cell">
                          <div className="cell-content">
                            <span className="cell-text monospace">{row.SystemRefId || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell date-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.OrderDate || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell status-cell">
                          <div className="cell-content">
                            <span className={`status-badge ${getStatusColor(row.Orderstatus)}`}>
                        {row.Orderstatus || 'N/A'}
                      </span>
                          </div>
                    </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.WhLoc || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text monospace">{row.Ordnum || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell status-cell">
                          <div className="cell-content">
                            <span className={`status-badge ${getStatusColor(row['Status JDA'])}`}>
                        {row['Status JDA'] || 'N/A'}
                      </span>
                          </div>
                    </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Brand || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Adddte || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row['Refresh time'] || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row['Cek Order'] || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell status-cell">
                          <div className="cell-content">
                            <span className={`status-badge ${getStatusColor(row.Status)}`}>
                        {row.Status || 'N/A'}
                      </span>
                          </div>
                    </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Order_type || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Deadline || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Now || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell status-cell">
                          <div className="cell-content">
                            <span className={`status-badge ${row.AWBLive === 'Live' ? 'success' : 'default'}`}>
                        {row.AWBLive || 'N/A'}
                      </span>
                          </div>
                    </td>
                        <td className="table-cell">
                          <div className="cell-content">
                            <span className="cell-text">{row.Manifest || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell awb-cell">
                          <div className="cell-content">
                            <span className="cell-text monospace">{row.Awb || '-'}</span>
                          </div>
                        </td>
                        <td className="table-cell actions-cell">
                          <div className="cell-content">
                      <button
                        onClick={() => handleCopy(row)}
                              className="action-btn copy-btn"
                        title="Copy row data"
                      >
                              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                      </button>
                          </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="instructions-card">
        <div className="card-header">
          <span className="card-icon">ℹ️</span>
          <h3>How to Use</h3>
        </div>
        
        <div className="instructions-content">
          <div className="instructions-grid">
            <div className="instruction-section">
              <h4>Search Process</h4>
              <ul>
                <li>1. Select search type (EntityID, SystemRefID, OrigSystemRefID, AWB, or All)</li>
                <li>2. Choose processing mode: Single (max 100 IDs) or Batch (4000+ IDs)</li>
                <li>3. Enter search terms - one per line or comma separated</li>
                <li>4. Click "Search" or press Ctrl+Enter</li>
              </ul>
            </div>
            
            <div className="instruction-section">
              <h4>Copy Options</h4>
              <ul>
                <li>• "Copy All" - Copy all data in tab-separated format (respects filters)</li>
                <li>• Row copy - Click the copy icon on any row</li>
                <li>• Filtered data - Copy functions only copy visible/filtered results</li>
              </ul>
            </div>
            
                         <div className="instruction-section">
               <h4>Column Filters</h4>
               <ul>
                 <li>• Click on any column header to open filter dropdown</li>
                 <li>• Use checkboxes to select specific values</li>
                 <li>• "Select All" to include all values</li>
                 <li>• "Clear Filter" to remove filter for that column</li>
                 <li>• Multiple filters work together (AND logic)</li>
                 <li>• "Clear All Filters" to reset all filters</li>
               </ul>
             </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="examples-section">
            <h4>Input Format Examples:</h4>
            <div className="code-block">
              BLI12181874766-284<br />
              BLI12181886055-284<br />
              BLI12181925864-284<br />
              <span className="code-note">or: BLI12181874766-284,BLI12181886055-284,BLI12181925864-284</span>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar for notifications */}
      {snackbar.open && (
        <div className={`snackbar ${snackbar.severity}`}>
          <span className="snackbar-icon">
            {snackbar.severity === 'success' && '✅'}
            {snackbar.severity === 'error' && '❌'}
            {snackbar.severity === 'warning' && '⚠️'}
            {snackbar.severity === 'info' && 'ℹ️'}
          </span>
          <span className="snackbar-message">{snackbar.message}</span>
          <button 
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            className="snackbar-close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default RefreshDB;
