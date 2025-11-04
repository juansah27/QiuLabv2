import React, { memo, useMemo, useState, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LabelList, Cell
} from 'recharts';
import { 
  ChartBarIcon, ClockIcon, TrendingUpIcon, TrendingDownIcon,
  EyeIcon, EyeSlashIcon
} from '@heroicons/react/24/outline';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6'];

// Custom tooltip component
const CustomTooltip = memo(({ active, payload, label, isDarkMode, formatValue = (value) => value }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg p-3`}>
      <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {entry.name}: <span className="font-semibold">{formatValue(entry.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
});

// Top 20 Brands Chart
export const Top20BrandsChart = memo(({ data, isDarkMode, view, setView, isLoading = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })), [data]
  );

  const formatValue = useCallback((value) => new Intl.NumberFormat().format(value), []);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              TOP 20 Brands by Order Count
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.length} brands • Total: {data.reduce((sum, item) => sum + item.count, 0).toLocaleString()} orders
            </p>
          </div>
        </div>
        
        <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setView('chart')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'chart' ? 'bg-blue-500 text-white shadow-md' : 
              `${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'list' ? 'bg-blue-500 text-white shadow-md' : 
              `${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Chart View */}
      {view === 'chart' && (
        <div className="h-[450px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={0} height={80}
                />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tickFormatter={formatValue} />
                <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} formatValue={formatValue} />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Order Count">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} 
                      opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6} />
                  ))}
                  <LabelList dataKey="count" position="top" formatter={formatValue} 
                    fill={isDarkMode ? '#f9fafb' : '#374151'} fontSize={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ChartBarIcon className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No brand data available
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="h-[450px] overflow-y-auto">
          {data.length > 0 ? (
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={index} className={`group flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 ${
                    isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  } hover:shadow-md transform hover:-translate-y-0.5`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                    isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Brand ID: {item.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {formatValue(item.count)}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>orders</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No brand data available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center text-sm">
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-medium">Total Brands:</span> {data.length} | 
            <span className="font-medium ml-2">Highest Count:</span> {data.length > 0 ? formatValue(data[0].count) : 'N/A'}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Data updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
});

// Marketplace Chart
export const MarketplaceChart = memo(({ data, isDarkMode, view, setView, isLoading = false }) => {
  const formatValue = useCallback((value) => new Intl.NumberFormat().format(value), []);
  const totalOrders = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data]);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <TrendingUpIcon className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Platform Orders Distribution
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total: {formatValue(totalOrders)} orders across {data.length} platforms
            </p>
          </div>
        </div>
        
        <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setView('chart')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'chart' ? 'bg-green-500 text-white shadow-md' : 
              `${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'list' ? 'bg-green-500 text-white shadow-md' : 
              `${isDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[450px]">
        {view === 'chart' && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data.map(item => ({ platform: item.name, orders: item.count }))}
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis type="number" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tickFormatter={formatValue} />
              <YAxis dataKey="platform" type="category" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} width={90} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} formatValue={formatValue} />} />
              <Bar dataKey="orders" fill="#22c55e" name="Order Count" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {view === 'list' && (
          <div className="h-full overflow-y-auto">
            {data.length > 0 ? (
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    } hover:shadow-sm`}>
                    <div className={`w-6 text-xs font-bold text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatValue(item.count)} orders
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No marketplace data available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Order Evolution Chart
export const OrderEvolutionChart = memo(({ data, isDarkMode, isLoading = false }) => {
  const formatValue = useCallback((value) => new Intl.NumberFormat().format(value), []);

  const statsData = useMemo(() => {
    if (!data.length) return null;
    const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
    const peakHour = data.reduce((max, item) => item.orders > max.orders ? item : max, data[0]);
    const avgPerHour = Math.round(totalOrders / data.length);
    const peakOrders = Math.max(...data.map(item => item.orders));
    return { totalOrders, peakHour, avgPerHour, peakOrders };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
            <ClockIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Order Evolution (17:00 Yesterday - 17:00 Today)
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.length} time periods • Hourly order tracking
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Orders</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatValue(statsData.totalOrders)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">Peak Hour</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300 truncate">
              {statsData.peakHour.time}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Peak Orders</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {formatValue(statsData.peakOrders)}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Avg/Hour</div>
            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
              {formatValue(statsData.avgPerHour)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[400px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="time" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} 
                angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} formatValue={formatValue} />} />
              <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#orderGradient)" 
                name="Order Count" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No order evolution data available
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {data.length > 0 && (
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center text-sm">
            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">Time Range:</span> {data[0]?.time} - {data[data.length - 1]?.time} | 
              <span className="font-medium ml-2">Periods:</span> {data.length} hours
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Data updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Top20BrandsChart.displayName = 'Top20BrandsChart';
MarketplaceChart.displayName = 'MarketplaceChart';
OrderEvolutionChart.displayName = 'OrderEvolutionChart';

export default { Top20BrandsChart, MarketplaceChart, OrderEvolutionChart };