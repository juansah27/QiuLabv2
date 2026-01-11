import React, { useState, useCallback, useMemo } from 'react';
import {
  ChartBarIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, XCircleIcon, ArrowPathIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  Cog6ToothIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

// Custom hooks and components
import useMonitoringOrder from '../../hooks/useMonitoringOrder';
import { useTheme } from '../../contexts/ThemeContext';
import { usePageTitle } from '../../utils/pageTitle';

// Enhanced components
import StatCard, { AnimatedStatsGrid } from '../../components/MonitoringOrder/StatCard';
import FilterSection from '../../components/MonitoringOrder/FilterSection';
import {
  Top20BrandsChart,
  MarketplaceChart,
  OrderEvolutionChart
} from '../../components/MonitoringOrder/OptimizedCharts';
import {
  DashboardLoadingState,
  ErrorState,
  WarningState,
  SuccessState
} from '../../components/MonitoringOrder/LoadingStates';

const MonitoringOrderOptimized = () => {
  // Set page title
  usePageTitle('SalesOrder Monitoring');

  // Theme context
  const { isDarkMode } = useTheme();

  // Custom hook for data management
  const {
    rawData,
    filteredData,
    processedData,
    loading,
    error,
    filters,
    stats,
    fetchData,
    updateFilters,
    clearFilters,
    retry,
    hasData,
    hasFilters,
    isStale
  } = useMonitoringOrder();

  // Local state for UI interactions
  const [brandsView, setBrandsView] = useState('chart');
  const [marketplaceView, setMarketplaceView] = useState('chart');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Memoized stats configuration
  const statsConfig = useMemo(() => [
    {
      id: 'total',
      title: 'Total Orders',
      value: processedData.cards.totalOrder,
      icon: ChartBarIcon,
      color: 'blue',
      description: 'Total number of orders in the selected period',
      previousValue: stats.totalRecords > 0 ? stats.totalRecords - 10 : null
    },
    {
      id: 'interfaced',
      title: 'Interfaced',
      value: processedData.cards.totalOrderInterface,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Orders successfully interfaced to the system',
      trend: processedData.cards.totalOrderInterface > processedData.cards.totalOrderNotYetInterface ? 'up' : 'down'
    },
    {
      id: 'not-interfaced',
      title: 'Not Interfaced',
      value: processedData.cards.totalOrderNotYetInterface,
      icon: XCircleIcon,
      color: 'red',
      description: 'Orders that have not been interfaced yet',
      interactive: true,
      onClick: () => addNotification('Filtering to show non-interfaced orders', 'info')
    },
    {
      id: 'pending',
      title: 'Pending Verification',
      value: processedData.cards.totalOrderPendingVerifikasi,
      icon: ClockIcon,
      color: 'yellow',
      description: 'Orders pending verification process',
      interactive: true,
      onClick: () => addNotification('Filtering to show pending verification orders', 'info')
    },
    {
      id: 'over-hour',
      title: '> 1 Hour',
      value: processedData.cards.totalOrderLebihDari1Jam,
      icon: ArrowTrendingUpIcon,
      color: 'orange',
      description: 'Orders processed over 1 hour ago'
    },
    {
      id: 'under-hour',
      title: '< 1 Hour',
      value: processedData.cards.totalOrderKurangDari1Jam,
      icon: ArrowTrendingDownIcon,
      color: 'purple',
      description: 'Orders processed within the last hour'
    }
  ], [processedData.cards, stats.totalRecords]);

  // Notification management
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Handle data refresh
  const handleRefresh = useCallback(async () => {
    try {
      await fetchData(true);
      addNotification('Data refreshed successfully', 'success');
    } catch (err) {
      addNotification('Failed to refresh data', 'error');
    }
  }, [fetchData, addNotification]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    updateFilters(newFilters);
    addNotification('Filters updated', 'info');
  }, [updateFilters, addNotification]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    retry();
    addNotification('Retrying data fetch...', 'info');
  }, [retry, addNotification]);

  // Loading state
  if (loading && !hasData) {
    return <DashboardLoadingState isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      } transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                } transition-colors duration-200`}>
                SalesOrder Monitoring
              </h1>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                } transition-colors duration-200`}>
                Real-time monitoring of order processing • {stats.totalRecords} records
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Data freshness indicator */}
              {stats.lastUpdate && (
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  } flex items-center space-x-1`}>
                  <ClockIcon className="w-4 h-4" />
                  <span>Updated: {stats.lastUpdate.toLocaleTimeString()}</span>
                  {isStale && (
                    <span className="text-yellow-500 ml-1">• Stale</span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                {/* Settings button */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  aria-label="Dashboard settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>

                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none ${loading ? 'cursor-not-allowed' : 'active:scale-95'
                    }`}
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Performance metrics */}
          {stats.filterEfficiency && (
            <div className={`inline-flex items-center space-x-4 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border text-sm`}>
              <div className="flex items-center space-x-1">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Filter Efficiency:
                </span>
                <span className={`font-medium ${stats.filterEfficiency > 50 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                  {stats.filterEfficiency}%
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cache:
                </span>
                <span className={`font-medium ${stats.cacheStatus === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                  {stats.cacheStatus}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div key={notification.id}>
              {notification.type === 'success' && (
                <SuccessState
                  isDarkMode={isDarkMode}
                  message={notification.message}
                  action={() => removeNotification(notification.id)}
                  actionLabel="×"
                />
              )}
              {notification.type === 'error' && (
                <ErrorState
                  isDarkMode={isDarkMode}
                  error={notification.message}
                  onRetry={() => removeNotification(notification.id)}
                />
              )}
              {notification.type === 'warning' && (
                <WarningState
                  isDarkMode={isDarkMode}
                  message={notification.message}
                  action={() => removeNotification(notification.id)}
                  actionLabel="×"
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <ErrorState
            isDarkMode={isDarkMode}
            error={error}
            onRetry={handleRetry}
            retryCount={stats.retryCount}
          />
        )}

        {/* Stale data warning */}
        {isStale && (
          <WarningState
            isDarkMode={isDarkMode}
            message="Data may be outdated. Consider refreshing for the latest information."
            action={handleRefresh}
            actionLabel="Refresh Now"
          />
        )}

        {/* Filter Section */}
        <div className="mb-8">
          <FilterSection
            filters={filters}
            setFilters={handleFilterChange}
            brands={processedData.brands}
            marketplaces={processedData.marketplaces}
            loading={loading}
            onClear={clearFilters}
          />
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <AnimatedStatsGrid
            stats={statsConfig}
            loading={loading}
            columns="auto"
            gap={6}
          />
        </div>

        {/* Charts Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* TOP 20 Brands Chart - Takes 8 columns on large screens */}
          <div className="lg:col-span-8">
            <Top20BrandsChart
              data={processedData.top20Data}
              isDarkMode={isDarkMode}
              view={brandsView}
              setView={setBrandsView}
              isLoading={loading}
            />
          </div>

          {/* Marketplace Chart - Takes 4 columns on large screens */}
          <div className="lg:col-span-4">
            <MarketplaceChart
              data={processedData.topMarketplaceData}
              isDarkMode={isDarkMode}
              view={marketplaceView}
              setView={setMarketplaceView}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Order Evolution Chart - Full width */}
        <div className="mb-8">
          <OrderEvolutionChart
            data={processedData.orderEvolution}
            isDarkMode={isDarkMode}
            isLoading={loading}
          />
        </div>

        {/* Footer with meta information */}
        <footer className={`mt-12 p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } transition-colors duration-200`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 sm:mb-0`}>
              <span className="font-medium">Performance:</span> Filtered {stats.filteredRecords} of {stats.totalRecords} records
              {stats.filterEfficiency && ` (${stats.filterEfficiency}% efficiency)`}
            </div>
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-4`}>
              <span>Cache: {stats.cacheStatus}</span>
              {stats.retryCount > 0 && (
                <span>Retries: {stats.retryCount}</span>
              )}
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MonitoringOrderOptimized;