import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LabelList, Dot
} from 'recharts';
import { 
  ChartBarIcon, ClockIcon, CheckCircleIcon, 
  ExclamationTriangleIcon, XCircleIcon, ArrowPathIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  FunnelIcon, CalendarIcon, XMarkIcon, ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { usePageTitle } from '../../utils/pageTitle';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Theme-aware colors
const getThemeColors = (isDarkMode) => ({
  text: isDarkMode ? '#f9fafb' : '#374151',
  textSecondary: isDarkMode ? '#9ca3af' : '#6b7280',
  background: isDarkMode ? '#1f2937' : '#ffffff',
  backgroundSecondary: isDarkMode ? '#374151' : '#f9fafb',
  border: isDarkMode ? '#374151' : '#1f2937',
  grid: isDarkMode ? '#374151' : '#1f2937',
  tooltipBg: isDarkMode ? '#1f2937' : '#ffffff',
  tooltipBorder: isDarkMode ? '#374151' : '#1f2937',
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#8b5cf6'
});

const StatCard = ({ title, value, icon: Icon, color, loading = false, onClick }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    };
    return colorMap[color] || colorMap.blue;
  };

    return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton Components
const StatCardSkeleton = ({ color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900/20',
      green: 'bg-green-100 dark:bg-green-900/20',
      red: 'bg-red-100 dark:bg-red-900/20',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20',
      orange: 'bg-orange-100 dark:bg-orange-900/20',
      purple: 'bg-purple-100 dark:bg-purple-900/20'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg ${getColorClasses(color)} animate-pulse`}>
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="flex-1">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
          <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

const ChartSkeleton = ({ height = '400px' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div className="flex items-center justify-between mb-4">
      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </div>
    <div 
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
      style={{ height }}
    ></div>
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-3 py-2">
                <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-3 py-2">
                  <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Popup Modal Component
const DetailModal = ({ isOpen, onClose, title, data, loading = false, isMockData = false }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');

  // Add keyboard event listener for ESC key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine data type and get appropriate headers and summary stats
  const getDataConfig = () => {
    if (!data || data.length === 0) return { headers: [], summaryStats: [] };
    
    const firstItem = data[0];
    
    // Optimize summary stats calculation for large datasets
    const calculateStats = (dataArray, type) => {
      if (dataArray.length > 10000) {
        // For very large datasets, use sampling for better performance
        const sampleSize = Math.min(10000, dataArray.length);
        const sample = dataArray.slice(0, sampleSize);
        
        switch (type) {
          case 'main':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Interfaced', value: sample.filter(item => item.Status_Interfaced === 'Yes').length, color: 'green' },
              { label: 'Not Interfaced', value: sample.filter(item => item.Status_Interfaced === 'No').length, color: 'red' },
              { label: 'Pending', value: sample.filter(item => item['ORDER STATUS'] === 'PENDING VERIFIKASI').length, color: 'yellow' }
            ];
          case 'lateSku':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Interface Yes', value: sample.filter(item => item.Interface === 'Yes').length, color: 'green' },
              { label: 'Interface No', value: sample.filter(item => item.Interface === 'No').length, color: 'red' },
              { label: 'Line Match', value: sample.filter(item => item.LineStatus === 'Match').length, color: 'yellow' }
            ];
          case 'invalidSku':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Unique Clients', value: new Set(sample.map(item => item.Client)).size, color: 'green' },
              { label: 'Unique Orders', value: new Set(sample.map(item => item.ORDNUM)).size, color: 'orange' },
              { label: 'Unique SKUs', value: new Set(sample.map(item => item.PRTNUM)).size, color: 'purple' }
            ];
          case 'duplicate':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Total Duplicates', value: sample.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0), color: 'red' },
              { label: 'Unique Orders', value: new Set(sample.map(item => item.ORDNUM)).size, color: 'green' },
              { label: 'Avg Duplicates', value: Math.round(sample.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0) / sample.length), color: 'orange' }
            ];
          default:
            return [{ label: 'Total Records', value: dataArray.length, color: 'blue' }];
        }
      } else {
        // For smaller datasets, calculate normally
        switch (type) {
          case 'main':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Interfaced', value: dataArray.filter(item => item.Status_Interfaced === 'Yes').length, color: 'green' },
              { label: 'Not Interfaced', value: dataArray.filter(item => item.Status_Interfaced === 'No').length, color: 'red' },
              { label: 'Pending', value: dataArray.filter(item => item['ORDER STATUS'] === 'PENDING VERIFIKASI').length, color: 'yellow' }
            ];
          case 'lateSku':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Interface Yes', value: dataArray.filter(item => item.Interface === 'Yes').length, color: 'green' },
              { label: 'Interface No', value: dataArray.filter(item => item.Interface === 'No').length, color: 'red' },
              { label: 'Line Match', value: dataArray.filter(item => item.LineStatus === 'Match').length, color: 'yellow' }
            ];
          case 'invalidSku':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Unique Clients', value: new Set(dataArray.map(item => item.Client)).size, color: 'green' },
              { label: 'Unique Orders', value: new Set(dataArray.map(item => item.ORDNUM)).size, color: 'orange' },
              { label: 'Unique SKUs', value: new Set(dataArray.map(item => item.PRTNUM)).size, color: 'purple' }
            ];
          case 'duplicate':
            return [
              { label: 'Total Records', value: dataArray.length, color: 'blue' },
              { label: 'Total Duplicates', value: dataArray.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0), color: 'red' },
              { label: 'Unique Orders', value: new Set(dataArray.map(item => item.ORDNUM)).size, color: 'green' },
              { label: 'Avg Duplicates', value: Math.round(dataArray.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0) / dataArray.length), color: 'orange' }
            ];
          default:
            return [{ label: 'Total Records', value: dataArray.length, color: 'blue' }];
        }
      }
    };
    
    // Check if it's main order data
    if (firstItem.MARKETPLACE && firstItem.Brand && firstItem.SystemRefId) {
      return {
        headers: ['MARKETPLACE', 'Brand', 'SystemRefId', 'ORDER STATUS', 'Status_Interfaced', 'Status_Durasi', 'OrderDate'],
        summaryStats: calculateStats(data, 'main')
      };
    }
    
    // Check if it's late SKU data
    if (firstItem.Client && firstItem.ORDNUM && firstItem.PRTNUM) {
      return {
        headers: ['Client', 'ORDNUM', 'ORDLIN', 'PRTNUM', 'Interface', 'LineStatus'],
        summaryStats: calculateStats(data, 'lateSku')
      };
    }
    
    // Check if it's invalid SKU data
    if (firstItem.Client && firstItem.ORDNUM && firstItem.Issue) {
      return {
        headers: ['Client', 'ORDNUM', 'ORDLIN', 'PRTNUM', 'Issue'],
        summaryStats: calculateStats(data, 'invalidSku')
      };
    }
    
    // Check if it's duplicate order data
    if (firstItem.ORDNUM && firstItem.ORDLIN && firstItem.jumlah) {
      return {
        headers: ['ORDNUM', 'ORDLIN', 'jumlah'],
        summaryStats: calculateStats(data, 'duplicate')
      };
    }
    
    // Default fallback
    const headers = Object.keys(firstItem);
    return {
      headers,
      summaryStats: calculateStats(data, 'default')
    };
  };

  const dataConfig = getDataConfig();
  const { headers, summaryStats } = dataConfig;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Yes': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'No': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'PENDING VERIFIKASI': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Lebih Dari 1 jam': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Kurang Dari 1 jam': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Match': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'Mismatch': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const copyColumnData = async (columnName) => {
    try {
      const columnData = data.map(item => item[columnName]).filter(Boolean);
      const textToCopy = columnData.join('\n');
      
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(columnName);
      setSelectedColumn(columnName);
      
      // Reset success message after 2 seconds
      setTimeout(() => {
        setCopySuccess('');
        setSelectedColumn('');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy data:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      const columnData = data.map(item => item[columnName]).filter(Boolean);
      textArea.value = columnData.join('\n');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopySuccess(columnName);
      setSelectedColumn(columnName);
      
      setTimeout(() => {
        setCopySuccess('');
        setSelectedColumn('');
      }, 2000);
    }
  };

  const copyAllData = async () => {
    try {
      // Show loading state for copy operation
      setCopySuccess('copying');
      
      // Use setTimeout to prevent UI freeze for large datasets
      setTimeout(async () => {
        try {
          // Limit data for clipboard to prevent browser freeze
          const maxRecords = 15000;
          const dataToCopy = data.slice(0, maxRecords);
          
          const csvData = [
            headers.join('\t'),
            ...dataToCopy.map(item => 
              headers.map(header => item[header] || '').join('\t')
            )
          ].join('\n');
          
          await navigator.clipboard.writeText(csvData);
          setCopySuccess('all');
          
          setTimeout(() => {
            setCopySuccess('');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy data:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          const maxRecords = 15000;
          const dataToCopy = data.slice(0, maxRecords);
          
          const csvData = [
            headers.join('\t'),
            ...dataToCopy.map(item => 
              headers.map(header => item[header] || '').join('\t')
            )
          ].join('\n');
          
          textArea.value = csvData;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setCopySuccess('all');
          
          setTimeout(() => {
            setCopySuccess('');
          }, 2000);
        }
      }, 100);
    } catch (err) {
      console.error('Failed to copy all data:', err);
      setCopySuccess('');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button - Always Visible */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 transition-colors"
          title="Close modal (ESC)"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            {isMockData && (
              <div className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700 rounded-full text-xs font-medium">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1"></div>
                  Mock Data
                </span>
              </div>
            )}
          </div>
          {/* Removed duplicate close button - using floating button instead */}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
            </div>
          ) : data && data.length > 0 ? (
            <div className="space-y-4">
              {/* Copy All Data Button */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Click column headers to copy data, or copy all data below
                    {data.length > 10000 && (
                      <span className="text-orange-600 dark:text-orange-400 ml-1">
                        (Large dataset - performance optimized)
                      </span>
                    )}
                  </div>
                  {isMockData && (
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700 rounded-full text-xs font-medium">
                      Mock Data
                    </div>
                  )}
                </div>
                <button
                  onClick={copyAllData}
                  disabled={copySuccess === 'copying'}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    copySuccess === 'all'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : copySuccess === 'copying'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
                  }`}
                >
                  {copySuccess === 'copying' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                  <span>
                    {copySuccess === 'all' ? 'Copied!' : 
                     copySuccess === 'copying' ? 'Copying...' : 
                     `Copy All Data${data.length > 15000 ? ` (First 15,000)` : ''}`}
                  </span>
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {summaryStats.map((stat, index) => (
                  <div key={index} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 p-4 rounded-lg`}>
                    <div className={`text-sm text-${stat.color}-600 dark:text-${stat.color}-400 font-medium`}>{stat.label}</div>
                    <div className={`text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {headers.map((header) => (
                        <th 
                          key={header}
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                            selectedColumn === header 
                              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => copyColumnData(header)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                            {copySuccess === header && (
                              <span className="text-green-600 dark:text-green-400 text-xs">✓ Copied</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.slice(0, 1000).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {headers.map((header) => (
                          <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {header === 'OrderDate' ? (
                              new Date(item[header]).toLocaleString()
                            ) : header === 'ORDER STATUS' || header === 'Status_Interfaced' || header === 'Status_Durasi' || header === 'Interface' || header === 'LineStatus' || header === 'Issue' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item[header])}`}>
                                {item[header]}
                              </span>
                            ) : header === 'jumlah' ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400">
                                {item[header]} times
                              </span>
                            ) : (
                              item[header]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 1000 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 text-yellow-600 dark:text-yellow-400">
                        <ExclamationTriangleIcon />
                      </div>
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        Showing first 1,000 records of {data.length.toLocaleString()} total records for performance. 
                        Use the copy functions above to export all data.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <ChartBarIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h3>
              <p className="text-gray-500 dark:text-gray-400">There are no records matching the selected criteria.</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {data ? data.length : 0} records
            {data && data.length > 1000 && (
              <span className="ml-2 text-orange-600 dark:text-orange-400">
                (Displaying first 1,000)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ filters, setFilters, brands, marketplaces, loading }) => {
  const [tempFilters, setTempFilters] = useState(filters);

  // Update temp filters when actual filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
  };

  const handleClearFilters = () => {
    // Reset to default date range (17:00 yesterday to current time)
    const now = new Date();
    
    // Get yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Set start time to 17:00 yesterday
    const startDate = new Date(yesterday);
    startDate.setHours(17, 0, 0, 0);
    
    // Set end time to current time
    const endDate = new Date(now);
    
    // Convert to local datetime string for input fields
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    const clearedFilters = {
      startDate: formatLocalDateTime(startDate),
      endDate: formatLocalDateTime(endDate),
      brand: '',
      marketplace: ''
    };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>
      
      {/* Filter Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Date Range
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="datetime-local"
              value={tempFilters.startDate}
              onChange={(e) => setTempFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">to</span>
            <input
              type="datetime-local"
              value={tempFilters.endDate}
              onChange={(e) => setTempFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Brand Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Brand
          </label>
          <select
            value={tempFilters.brand}
            onChange={(e) => setTempFilters(prev => ({ ...prev, brand: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Marketplace Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Marketplace
          </label>
          <select
            value={tempFilters.marketplace}
            onChange={(e) => setTempFilters(prev => ({ ...prev, marketplace: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">All Marketplaces</option>
            {marketplaces.map(marketplace => (
              <option key={marketplace} value={marketplace}>{marketplace}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleClearFilters}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Clear Filters
        </button>
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
        >
          {loading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
};

const MonitoringOrder = () => {
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);

  const [chartKey, setChartKey] = useState(0);
  const [brandsView, setBrandsView] = useState('chart');
  const [marketplaceView, setMarketplaceView] = useState('chart');
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  
  // New state for the 3 additional grids
  const [lateSkuData, setLateSkuData] = useState([]);
  const [invalidSkuData, setInvalidSkuData] = useState([]);
  const [duplicateOrderData, setDuplicateOrderData] = useState([]);
  const [loadingAdditionalData, setLoadingAdditionalData] = useState(false);
  const [additionalDataSources, setAdditionalDataSources] = useState({
    lateSku: 'sql',
    invalidSku: 'sql', 
    duplicateOrders: 'sql'
  });
  

  // Set default date range (17:00 yesterday to current time)
  const getDefaultDateRange = () => {
    const now = new Date();
    
    // Get yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Set start time to 17:00 yesterday
    const startDate = new Date(yesterday);
    startDate.setHours(17, 0, 0, 0);
    
    // Set end time to current time
    const endDate = new Date(now);
    
    // Convert to local datetime string for input fields
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    console.log('Default date range:', {
      startDate: formatLocalDateTime(startDate),
      endDate: formatLocalDateTime(endDate),
      startDateFull: startDate.toString(),
      endDateFull: endDate.toString()
    });
    
    return {
      startDate: formatLocalDateTime(startDate),
      endDate: formatLocalDateTime(endDate),
      brand: '',
      marketplace: ''
    };
  };

  const [filters, setFilters] = useState(getDefaultDateRange());
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    data: [],
    loading: false
  });
  
  const [dataSource, setDataSource] = useState('sql'); // 'sql' or 'mock'
  
  const [data, setData] = useState({
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
    brands: [],
    marketplaces: []
  });

  // Theme detection
  useEffect(() => {
    const detectThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && mutation.target === document.documentElement) {
          detectThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Set page title for browser tab
  const baseTitle = 'SalesOrder Monitoring';
  const orderCount = data.cards.totalOrder;
  const pageTitle = orderCount > 0 
    ? `${baseTitle} - ${orderCount.toLocaleString()} Orders`
    : baseTitle;
  
  usePageTitle(pageTitle);

  // Apply filters with useMemo for better performance
  const filteredDataMemo = useMemo(() => {
    if (!rawData.length) return [];

    let filtered = [...rawData];

    // Filter by date range
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      filtered = filtered.filter(item => {
        const orderDate = new Date(item.OrderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Filter by brand
    if (filters.brand) {
      filtered = filtered.filter(item => item.Brand === filters.brand);

    }

    // Filter by marketplace
    if (filters.marketplace) {
      filtered = filtered.filter(item => item.MARKETPLACE === filters.marketplace);

    }



    return filtered;
  }, [rawData, filters]);

  // Optimized data processing with useMemo - using filtered data
  const processedData = useMemo(() => {
    // Use filteredDataMemo for consistent processing
    const dataToProcess = filteredDataMemo;
    
    if (!dataToProcess || dataToProcess.length === 0) {
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

    // Show processing indicator for large datasets
    if (dataToProcess.length > 100000) {
      console.log(`Processing large dataset: ${dataToProcess.length.toLocaleString()} records`);
    }

    // Process cards efficiently - use the same data for all calculations
    const cards = {
      totalOrder: dataToProcess.length,
      totalOrderInterface: 0,
      totalOrderNotYetInterface: 0,
      totalOrderPendingVerifikasi: 0,
      totalOrderLebihDari1Jam: 0,
      totalOrderKurangDari1Jam: 0
    };

    // Single pass through data for all calculations
    const brandCounts = {};
    const marketplaceCounts = {};
    const hourlyData = {};

    // Track unique SystemRefId for duration-based counting
    const systemRefIdsLebihDari1Jam = new Set();
    const systemRefIdsKurangDari1Jam = new Set();

    dataToProcess.forEach(item => {
      // Count interfaced status
      if (item.Status_Interfaced === 'Yes') cards.totalOrderInterface++;
      else if (item.Status_Interfaced === 'No') cards.totalOrderNotYetInterface++;

      // Count order status
      if (item['ORDER STATUS'] === 'PENDING VERIFIKASI') cards.totalOrderPendingVerifikasi++;

      // Count unique SystemRefId that are not interfaced based on duration
      if (item.Status_Interfaced === 'No' && item.SystemRefId) {
        if (item.Status_Durasi === 'Lebih Dari 1 jam') {
          systemRefIdsLebihDari1Jam.add(item.SystemRefId);
        } else if (item.Status_Durasi === 'Kurang Dari 1 jam') {
          systemRefIdsKurangDari1Jam.add(item.SystemRefId);
        }
      }

      // Count brands
      if (item.Brand) {
        brandCounts[item.Brand] = (brandCounts[item.Brand] || 0) + 1;
      }

      // Count marketplaces
      if (item.MARKETPLACE) {
        marketplaceCounts[item.MARKETPLACE] = (marketplaceCounts[item.MARKETPLACE] || 0) + 1;
      } else {
        // Count undefined/empty marketplace as "UNKNOWN"
        marketplaceCounts['UNKNOWN'] = (marketplaceCounts['UNKNOWN'] || 0) + 1;
      }

      // Process hourly data
      if (item.OrderDate) {
        const orderTime = new Date(item.OrderDate);
        const hourKey = orderTime.toISOString().slice(0, 13) + ':00:00';
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
      }
    });

    // Assign the unique SystemRefId counts to cards
    cards.totalOrderLebihDari1Jam = systemRefIdsLebihDari1Jam.size;
    cards.totalOrderKurangDari1Jam = systemRefIdsKurangDari1Jam.size;

    // Extract unique brands and marketplaces
    const brands = Object.keys(brandCounts).sort();
    const marketplaces = Object.keys(marketplaceCounts).sort();

    // Process TOP 20 brands
    const top20Data = Object.entries(brandCounts)
      .map(([brand, count]) => ({ name: brand, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Process TOP marketplace data
    const topMarketplaceData = Object.entries(marketplaceCounts)
      .map(([marketplace, count]) => ({ name: marketplace, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);



    // Process order evolution (hourly data) - use filter dates
    const orderEvolution = [];
    
    // Use filter dates for order evolution
    const filterStartDate = new Date(filters.startDate);
    const filterEndDate = new Date(filters.endDate);
    


    // Generate hourly intervals based on filter dates
    for (let time = new Date(filterStartDate); time <= filterEndDate; time.setHours(time.getHours() + 1)) {
      const hourKey = time.toISOString().slice(0, 13) + ':00:00';
      
      orderEvolution.push({
        time: time.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        orders: hourlyData[hourKey] || 0,
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
  }, [filteredDataMemo, filters]);

  // Update data state when processed data changes
  useEffect(() => {
    setData(processedData); // Use the same processed data for everything
    setChartKey(prev => prev + 1);
  }, [processedData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsFiltering(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Build query parameters with optimized pagination for dashboard
      const params = new URLSearchParams({
        page: '1',
        per_page: '100000', // 100k records per page for better performance
        limit: '1000000'    // Max 1M records total for dashboard
      });
      
      // Add filters if they exist
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.marketplace) params.append('marketplace', filters.marketplace);
      
      // Timeout 180 detik (3 menit) untuk query kompleks di Ubuntu server
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 180 seconds')), 180000);
      });
      
      // Create the fetch promise with progress indicator and compression
      const fetchPromise = fetch(`/api/query/monitoring-order?${params.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        setRawData(result.data);
        // Set data source based on API response
        const source = result.data_source === 'sql_server' ? 'sql' : 'mock';
        setDataSource(source);
        
        // Log performance info if available
        if (result.performance) {
          console.log('API Performance:', result.performance);
        }
        
        // Log pagination info if available
        if (result.pagination) {
          console.log('Pagination Info:', result.pagination);
        }
        
        // Log data info
        console.log(`Received ${result.data.length} records from API`);
        if (result.data.length > 0) {
          console.log('Sample data:', result.data[0]);
          console.log('Data fields:', Object.keys(result.data[0]));
        }
  
        // Clear any previous mock data indicator
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error:', err);
      
      // Check if it's an authentication error
      if (err.message.includes('401') || err.message.includes('403')) {
        setError('Authentication failed. Please login again.');
        // Redirect to login or refresh token
        return;
      }
      
      // Check if it's a timeout error
      if (err.message.includes('timeout')) {
        setError('Database query timeout (>30s). Showing mock data for demonstration.');
      } else {
        setError(`Database connection failed: ${err.message}. Showing mock data.`);
      }
      
      // Fallback to mock data with more variety
      const mockData = [
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'FACETOLOGY', 'SystemRefId': 'MOCK001', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T10:30:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'SOMEBYMI', 'SystemRefId': 'MOCK002', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'No', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T11:15:00' },
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'FACETOLOGY', 'SystemRefId': 'MOCK003', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T12:30:00' },
        { 'MARKETPLACE': 'TOKOPEDIA', 'Brand': 'SOMEBYMI', 'SystemRefId': 'MOCK004', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'No', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T13:15:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'FACETOLOGY', 'SystemRefId': 'MOCK005', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T14:30:00' },
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'BRAND_A', 'SystemRefId': 'MOCK006', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T15:30:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'BRAND_B', 'SystemRefId': 'MOCK007', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'No', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T16:15:00' },
        { 'MARKETPLACE': 'TOKOPEDIA', 'Brand': 'BRAND_C', 'SystemRefId': 'MOCK008', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T17:30:00' },
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'BRAND_D', 'SystemRefId': 'MOCK009', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'No', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T18:15:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'BRAND_E', 'SystemRefId': 'MOCK010', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T19:30:00' },
        // Add more data to ensure bars appear
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'FACETOLOGY', 'SystemRefId': 'MOCK011', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T20:30:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'SOMEBYMI', 'SystemRefId': 'MOCK012', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'No', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T21:15:00' },
        { 'MARKETPLACE': 'TOKOPEDIA', 'Brand': 'BRAND_A', 'SystemRefId': 'MOCK013', 'ORDER STATUS': 'PENDING VERIFIKASI', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-16T22:30:00' },
        { 'MARKETPLACE': 'SHOPEE', 'Brand': 'BRAND_B', 'SystemRefId': 'MOCK014', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'No', 'Status_Durasi': 'Kurang Dari 1 jam', 'OrderDate': '2024-01-16T23:15:00' },
        { 'MARKETPLACE': 'LAZADA', 'Brand': 'BRAND_C', 'SystemRefId': 'MOCK015', 'ORDER STATUS': 'READY_TO_SHIP', 'Status_Interfaced': 'Yes', 'Status_Durasi': 'Lebih Dari 1 jam', 'OrderDate': '2024-01-17T00:30:00' }
      ];
      setRawData(mockData);
      setDataSource('mock'); // Mark as mock data

    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  }, [filters]);

  // Function to fetch additional data for the 3 new grids
  const fetchAdditionalData = useCallback(async () => {
    try {
      setLoadingAdditionalData(true);
      const token = localStorage.getItem('token');
      
      // Fetch Late SKU Data
      try {
        const lateSkuResponse = await fetch('/api/query/late-sku', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        
                 if (lateSkuResponse.ok) {
           const lateSkuResult = await lateSkuResponse.json();
           if (lateSkuResult.status === 'success') {
             setLateSkuData(lateSkuResult.data || []);
             setAdditionalDataSources(prev => ({ ...prev, lateSku: lateSkuResult.data_source || 'sql' }));
           }
         } else {
           console.warn('Late SKU API returned:', lateSkuResponse.status);
         }
      } catch (err) {
        console.warn('Error fetching late SKU data:', err);
      }
      
      // Fetch Invalid SKU Data
      try {
        const invalidSkuResponse = await fetch('/api/query/invalid-sku', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        
                 if (invalidSkuResponse.ok) {
           const invalidSkuResult = await invalidSkuResponse.json();
           if (invalidSkuResult.status === 'success') {
             setInvalidSkuData(invalidSkuResult.data || []);
             setAdditionalDataSources(prev => ({ ...prev, invalidSku: invalidSkuResult.data_source || 'sql' }));
           }
         } else {
           console.warn('Invalid SKU API returned:', invalidSkuResponse.status);
         }
      } catch (err) {
        console.warn('Error fetching invalid SKU data:', err);
      }
      
      // Fetch Duplicate Order Data
      try {
        const duplicateOrderResponse = await fetch('/api/query/duplicate-orders', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });
        
                 if (duplicateOrderResponse.ok) {
           const duplicateOrderResult = await duplicateOrderResponse.json();
           if (duplicateOrderResult.status === 'success') {
             setDuplicateOrderData(duplicateOrderResult.data || []);
             setAdditionalDataSources(prev => ({ ...prev, duplicateOrders: duplicateOrderResult.data_source || 'sql' }));
           }
         } else {
           console.warn('Duplicate Orders API returned:', duplicateOrderResponse.status);
         }
      } catch (err) {
        console.warn('Error fetching duplicate orders data:', err);
      }
      
    } catch (err) {
      console.error('Error in fetchAdditionalData:', err);
    } finally {
      setLoadingAdditionalData(false);
    }
  }, []);



  // Handle card click to show modal
  const handleCardClick = useCallback((cardType) => {
    // Show loading state immediately
    setModalState({
      isOpen: true,
      title: 'Loading...',
      data: [],
      loading: true
    });

    // Use setTimeout to prevent UI freeze for large datasets
    setTimeout(() => {
      try {
        // Use the same filtered data that's used for cards
        let modalData = [...filteredDataMemo];
        let title = '';
        
        // Filter by card type based on the current filtered data
        switch (cardType) {
          case 'totalOrder':
            title = 'All Orders';
            break;
          case 'totalOrderInterface':
            modalData = modalData.filter(item => item.Status_Interfaced === 'Yes');
            title = 'Interfaced Orders';
            break;
          case 'totalOrderNotYetInterface':
            modalData = modalData.filter(item => item.Status_Interfaced === 'No');
            title = 'Not Yet Interfaced Orders';
            break;
          case 'totalOrderPendingVerifikasi':
            modalData = modalData.filter(item => item['ORDER STATUS'] === 'PENDING VERIFIKASI');
            title = 'Pending Verification Orders';
            break;
          case 'totalOrderLebihDari1Jam':
            modalData = modalData.filter(item => 
              item.Status_Interfaced === 'No' && 
              item.Status_Durasi === 'Lebih Dari 1 jam' &&
              item.SystemRefId
            );
            title = 'SystemRefId Not Interfaced > 1 Hour';
            break;
          case 'totalOrderKurangDari1Jam':
            modalData = modalData.filter(item => 
              item.Status_Interfaced === 'No' && 
              item.Status_Durasi === 'Kurang Dari 1 jam' &&
              item.SystemRefId
            );
            title = 'SystemRefId Not Interfaced < 1 Hour';
            break;
          default:
            title = 'Order Details';
        }
        
        // Limit data to prevent performance issues (show first 10,000 records)
        const limitedData = modalData.slice(0, 10000);
        
        setModalState({
          isOpen: true,
          title: `${title}${modalData.length > 10000 ? ` (Showing first 10,000 of ${modalData.length.toLocaleString()})` : ''}`,
          data: limitedData,
          loading: false
        });
      } catch (error) {
        console.error('Error processing modal data:', error);
        setModalState({
          isOpen: true,
          title: 'Error Loading Data',
          data: [],
          loading: false
        });
      }
    }, 100); // Small delay to prevent UI freeze
  }, [filteredDataMemo]);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      title: '',
      data: [],
      loading: false
    });
  }, []);

  useEffect(() => {
    fetchData();
    fetchAdditionalData();
  }, [fetchData, fetchAdditionalData]);

  if (loading && rawData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Fetching data from database...</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                This may take a few seconds for large datasets
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SalesOrder Monitoring</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time monitoring of SalesOrder</p>
              </div>
              {/* Data Source Indicator */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                dataSource === 'sql' 
                  ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' 
                  : 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700'
              }`}>
                {dataSource === 'sql' ? (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Live SQL Data
                  </span>
                ) : (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Mock Data
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                // Update endDate to current time when refreshing
                const now = new Date();
                const formatLocalDateTime = (date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                };
                
                const updatedFilters = {
                  ...filters,
                  endDate: formatLocalDateTime(now)
                };
                
                setFilters(updatedFilters);
                fetchData();
                fetchAdditionalData();
              }}
              disabled={loading || loadingAdditionalData}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${(loading || loadingAdditionalData) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
          </div>
        )}

        {/* Filters */}
        <FilterSection 
          filters={filters} 
          setFilters={setFilters} 
          brands={data.brands} 
          marketplaces={data.marketplaces}
          loading={loading}
        />

                  {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                <StatCard 
                  title="Total Orders" 
                  value={data.cards.totalOrder} 
                  icon={ChartBarIcon} 
                  color="blue" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrder')}
                />
                <StatCard 
                  title="Interfaced" 
                  value={data.cards.totalOrderInterface} 
                  icon={CheckCircleIcon} 
                  color="green" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrderInterface')}
                />
                <StatCard 
                  title="Not Interfaced" 
                  value={data.cards.totalOrderNotYetInterface} 
                  icon={XCircleIcon} 
                  color="red" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrderNotYetInterface')}
                />
                <StatCard 
                  title="Pending Verification" 
                  value={data.cards.totalOrderPendingVerifikasi} 
                  icon={ClockIcon} 
                  color="yellow" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrderPendingVerifikasi')}
                />
                <StatCard 
                  title=" > 1 Hour" 
                  value={data.cards.totalOrderLebihDari1Jam} 
                  icon={ArrowTrendingUpIcon} 
                  color="orange" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrderLebihDari1Jam')}
                />
                <StatCard 
                  title=" < 1 Hour" 
                  value={data.cards.totalOrderKurangDari1Jam} 
                  icon={ArrowTrendingDownIcon} 
                  color="purple" 
                  loading={loading}
                  onClick={() => handleCardClick('totalOrderKurangDari1Jam')}
                />
          </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
          {/* TOP 20 Brands List - 70% */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                          <style>{`
              .recharts-bar-rectangle:hover {
                opacity: 1 !important;
                fill-opacity: 1 !important;
              }
              .recharts-bar-rectangle:active {
                opacity: 1 !important;
                fill-opacity: 1 !important;
              }
            `}</style>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                TOP 20 Brands by Order Count
              </h3>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Order Count by Brand</span>
                </div>
              </div>
              <div className="text-xs">
                Showing top {data.top20Data.length} brands | 
                Total: {data.top20Data.reduce((sum, item) => sum + item.count, 0).toLocaleString()} orders
              </div>
            </div>

            {/* Brands Chart and List Tabs */}
            <div className="mb-4">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setBrandsView('chart')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    brandsView === 'chart'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Chart View
                </button>
                <button
                  onClick={() => setBrandsView('list')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    brandsView === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            {/* Brands Chart View */}
            {brandsView === 'chart' && (
              <div className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</p>
                    </div>
                  </div>
                ) : data.top20Data && data.top20Data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.top20Data} 
                      margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={getThemeColors(isDarkMode).grid} strokeOpacity={0.2} />
                      <XAxis 
                        type="category" 
                        dataKey="name"
                        stroke={getThemeColors(isDarkMode).textSecondary}
                        tick={{ fontSize: 10, fill: getThemeColors(isDarkMode).textSecondary }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis 
                        type="number" 
                        stroke={getThemeColors(isDarkMode).textSecondary}
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fontSize: 12, fill: getThemeColors(isDarkMode).textSecondary }}
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip 
                        formatter={(value) => [value.toLocaleString(), 'Orders']}
                        labelFormatter={(label) => `Brand: ${label}`}
                        contentStyle={{
                          backgroundColor: getThemeColors(isDarkMode).tooltipBg,
                          border: `1px solid ${getThemeColors(isDarkMode).tooltipBorder}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                          color: getThemeColors(isDarkMode).text
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill={getThemeColors(isDarkMode).primary}
                        radius={[4, 4, 0, 0]} 
                        name="Orders"
                        barSize={30}
                        onMouseOver={(data, index) => {
                          // Prevent hover background
                        }}
                      >
                        <LabelList 
                          dataKey="count" 
                          position="top" 
                          formatter={(value) => value.toLocaleString()} 
                          fill={getThemeColors(isDarkMode).text}
                          fontSize={10}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <p>No brand data available</p>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Brands List View */}
            {brandsView === 'list' && (
            <div className="h-[500px] overflow-y-auto">
              {data.top20Data && data.top20Data.length > 0 ? (
                <div className="space-y-3">
                  {data.top20Data.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="w-8 text-sm font-bold text-gray-500 dark:text-gray-400 text-center">
                        #{index + 1}
                      </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Brand ID: {item.name} | Order Count
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {item.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            orders
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p>No brand data available</p>
                    
                  </div>
                </div>
              )}
            </div>
            )}
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Total Brands:</span> {data.top20Data.length} | 
                  <span className="font-medium ml-2">Highest Count:</span> {data.top20Data.length > 0 ? data.top20Data[0].count.toLocaleString() : 'N/A'} orders | 
                  <span className="font-medium ml-2">Total:</span> {data.top20Data.reduce((sum, item) => sum + item.count, 0).toLocaleString()} orders
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Data updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Orders BarChart - 30% */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <style>{`
              .recharts-bar-rectangle:hover {
                opacity: 1 !important;
                fill-opacity: 1 !important;
              }
              .recharts-bar-rectangle:active {
                opacity: 1 !important;
                fill-opacity: 1 !important;
              }
            `}</style>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Platform Orders Distribution
            </h3>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Order Count by Platform</span>
                {filters.brand || filters.marketplace ? (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Filtered
                  </span>
                ) : null}
              </div>
              <div className="text-xs">
                Total: {data.topMarketplaceData ? data.topMarketplaceData.reduce((sum, item) => sum + item.count, 0).toLocaleString() : '0'} orders
              </div>
            </div>

            {/* Platform Chart and List Tabs */}
            <div className="mb-4">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setMarketplaceView('chart')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    marketplaceView === 'chart'
                      ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Chart View
                </button>
                <button
                  onClick={() => setMarketplaceView('list')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    marketplaceView === 'list'
                      ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            {/* Platform Chart View */}
            {marketplaceView === 'chart' && (
              <div className="h-[500px]">

                {data.topMarketplaceData && data.topMarketplaceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical"
                      data={data.topMarketplaceData.map(item => ({
                        platform: item.name,
                        orders: item.count
                      }))}
                      margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      barCategoryGap="15%"
                      barSize={25}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={getThemeColors(isDarkMode).grid} strokeOpacity={0.2} />
                      <XAxis 
                        type="number" 
                        stroke={getThemeColors(isDarkMode).textSecondary}
                        tickFormatter={(value) => value.toLocaleString()}
                        tick={{ fontSize: 11, fill: getThemeColors(isDarkMode).textSecondary }}
                      />
                      <YAxis 
                        dataKey="platform" 
                        type="category"
                        stroke={getThemeColors(isDarkMode).textSecondary}
                        tick={{ fontSize: 11, fill: getThemeColors(isDarkMode).textSecondary }}
                        width={60}
                      />
                      <Tooltip 
                        formatter={(value) => [value.toLocaleString(), 'Orders']}
                        labelFormatter={(label) => `Platform: ${label}`}
                        contentStyle={{
                          backgroundColor: getThemeColors(isDarkMode).tooltipBg,
                          border: `1px solid ${getThemeColors(isDarkMode).tooltipBorder}`,
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: getThemeColors(isDarkMode).text
                        }}
                      />
                      <Bar 
                        dataKey="orders" 
                        fill={getThemeColors(isDarkMode).success}
                        name="Orders"
                        onMouseOver={(data, index) => {
                          // Prevent hover background
                        }}
                        label={{
                          position: 'right',
                          fill: getThemeColors(isDarkMode).textSecondary,
                          fontSize: 11,
                          formatter: (value) => value.toLocaleString()
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <p className="text-sm">No marketplace data available</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Platform List View */}
            {marketplaceView === 'list' && (
              <div className="h-[500px] overflow-y-auto">
                {data.topMarketplaceData && data.topMarketplaceData.length > 0 ? (
                  <div className="space-y-3">
                    {data.topMarketplaceData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className="w-6 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.count.toLocaleString()} orders
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <p className="text-sm">No marketplace data available</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Top:</span> {data.topMarketplaceData && data.topMarketplaceData.length > 0 ? `${data.topMarketplaceData[0].name} (${data.topMarketplaceData[0].count.toLocaleString()})` : 'N/A'} | 
                  <span className="font-medium ml-1">Lowest:</span> {data.topMarketplaceData && data.topMarketplaceData.length > 0 ? `${data.topMarketplaceData[data.topMarketplaceData.length - 1].name} (${data.topMarketplaceData[data.topMarketplaceData.length - 1].count.toLocaleString()})` : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Data Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* SKU Telat Masuk */}
          <StatCard
            title="SKU Telat Masuk"
            value={lateSkuData.length}
            icon={ExclamationTriangleIcon}
            color="red"
            loading={loadingAdditionalData}
            onClick={() => {
              setModalState({
                isOpen: true,
                title: 'SKU Telat Masuk Details',
                data: lateSkuData,
                loading: false
              });
            }}
          />

          {/* Invalid SKU */}
          <StatCard
            title="Invalid SKU"
            value={invalidSkuData.length}
            icon={XCircleIcon}
            color="orange"
            loading={loadingAdditionalData}
            onClick={() => {
              setModalState({
                isOpen: true,
                title: 'Invalid SKU Details',
                data: invalidSkuData,
                loading: false
              });
            }}
          />

          {/* Order Duplikat */}
          <StatCard
            title="Order Duplikat"
            value={duplicateOrderData.length}
            icon={ClipboardDocumentIcon}
            color="purple"
            loading={loadingAdditionalData}
            onClick={() => {
              setModalState({
                isOpen: true,
                title: 'Order Duplikat Details',
                data: duplicateOrderData,
                loading: false
              });
            }}
          />
        </div>

        {/* Order Evolution Chart */}
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Evolution (17:00 Yesterday - Now)
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Hourly Orders</span>
                </div>
                <div className="text-xs">
                  {data.orderEvolution.length} time periods
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {data.orderEvolution.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Orders</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {data.orderEvolution.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Peak Hour</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {(() => {
                      const peak = data.orderEvolution.reduce((max, item) => 
                        item.orders > max.orders ? item : max, data.orderEvolution[0]);
                      return peak ? peak.time : 'N/A';
                    })()}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Peak Orders</div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {data.orderEvolution.reduce((max, item) => 
                      Math.max(max, item.orders), 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Avg/Hour</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {Math.round(data.orderEvolution.reduce((sum, item) => sum + item.orders, 0) / data.orderEvolution.length).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-[400px]">
              {data.orderEvolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={data.orderEvolution} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={getThemeColors(isDarkMode).grid} strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      stroke={getThemeColors(isDarkMode).textSecondary}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11, fill: getThemeColors(isDarkMode).textSecondary }}
                    />
                    <YAxis 
                      stroke={getThemeColors(isDarkMode).textSecondary}
                      tickFormatter={(value) => value.toLocaleString()}
                      tick={{ fontSize: 11, fill: getThemeColors(isDarkMode).textSecondary }}
                    />
                    <Tooltip 
                      formatter={(value) => [value.toLocaleString(), 'Orders']}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{
                        backgroundColor: getThemeColors(isDarkMode).tooltipBg,
                        border: `1px solid ${getThemeColors(isDarkMode).tooltipBorder}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: getThemeColors(isDarkMode).text
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke={getThemeColors(isDarkMode).primary}
                      fill={getThemeColors(isDarkMode).primary}
                      fillOpacity={0.3}
                      name="Orders"
                      strokeWidth={2}
                      dot={{
                        fill: getThemeColors(isDarkMode).primary,
                        stroke: getThemeColors(isDarkMode).background,
                        strokeWidth: 2,
                        r: 4
                      }}
                      activeDot={{
                        fill: getThemeColors(isDarkMode).primary,
                        stroke: getThemeColors(isDarkMode).background,
                        strokeWidth: 3,
                        r: 6
                      }}
                    >
                      <LabelList 
                        dataKey="orders" 
                        position="top" 
                        formatter={(value) => value.toLocaleString()} 
                        fill={getThemeColors(isDarkMode).textSecondary}
                        fontSize={10}
                        offset={10}
                      />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p>No order evolution data available</p>

                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            {data.orderEvolution.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Time Range:</span> {data.orderEvolution[0]?.time} - {data.orderEvolution[data.orderEvolution.length - 1]?.time} | 
                    <span className="font-medium ml-2">Periods:</span> {data.orderEvolution.length} hours
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Data updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Detail Modal */}
        <DetailModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          data={modalState.data}
          loading={modalState.loading}
          isMockData={dataSource === 'mock'}
        />
      </div>
    </div>
  );
};

export default MonitoringOrder;
