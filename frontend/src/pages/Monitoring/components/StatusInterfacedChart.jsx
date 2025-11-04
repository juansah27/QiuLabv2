import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Warna untuk berbagai tipe status
const COLORS = {
  SUCCESS: '#10b981',   // Emerald-500
  PENDING: '#f59e0b',   // Amber-500
  ERROR: '#ef4444',     // Red-500
  UNKNOWN: '#9ca3af'    // Gray-400
};

const StatusInterfacedChart = React.memo(({ data, onFilterClick, isLoading }) => {
  const [chartData, setChartData] = useState([]);
  const [activePie, setActivePie] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  
  // Optimize theme colors with useMemo
  const themeColors = useMemo(() => ({
    textColor: isDarkMode ? '#ffffff' : '#374151',
    tooltipBg: isDarkMode ? '#1f2937' : '#ffffff',
    tooltipBorder: isDarkMode ? '#374151' : '#e5e7eb'
  }), [isDarkMode]);

  // Optimize chart data processing
  const processedChartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts = {
      SUCCESS: 0,
      PENDING: 0,
      ERROR: 0,
      UNKNOWN: 0
    };
    
    data.forEach(item => {
      const status = item.Status_Interfaced || item['Status Interfaced'];
      if (status === 'Yes') counts.SUCCESS++;
      else if (status === 'No') counts.PENDING++;
      else if (status === 'Error') counts.ERROR++;
      else counts.UNKNOWN++;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[name]
      }));
  }, [data]);

  // Update chart data when processed data changes
  useEffect(() => {
    setChartData(processedChartData);
  }, [processedChartData]);

  // Optimize click handler
  const handlePieClick = useCallback((data, index) => {
    setActivePie(index === activePie ? null : index);
    
    if (onFilterClick && data && data.name) {
      const columnName = 'Status';
      const filterValue = data.name === 'UNKNOWN' ? '' : data.name;
      onFilterClick(columnName, filterValue);
    }
  }, [activePie, onFilterClick]);

  // Optimize custom label rendering
  const renderCustomLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={themeColors.textColor}
        textAnchor="middle" 
        dominantBaseline="central"
        fontWeight="500"
        fontSize="12"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }, [themeColors.textColor]);

  // Optimize tooltip rendering
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const percentage = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div 
        style={{
          backgroundColor: themeColors.tooltipBg,
          border: `1px solid ${themeColors.tooltipBorder}`,
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p style={{ 
          color: themeColors.textColor, 
          fontWeight: 500, 
          marginBottom: '5px',
          borderBottom: `1px solid ${themeColors.tooltipBorder}`,
          paddingBottom: '4px' 
        }}>
          {data.name}
        </p>
        <p style={{ 
          color: themeColors.textColor, 
          fontSize: '13px',
          margin: 0
        }}>
          {`${data.value} item (${percentage}%)`}
        </p>
      </div>
    );
  }, [chartData, themeColors]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full h-80 flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render empty state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-80 flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Tidak ada data untuk ditampilkan
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
        </svg>
        Statistik Status
      </h3>
      <div className="mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Klik pada chart untuk memfilter data
        </p>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              cursor="pointer"
              animationDuration={300}
              animationBegin={0}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  fillOpacity={index === activePie ? 1 : 0.8}
                  stroke={index === activePie ? '#ffffff' : 'none'}
                  strokeWidth={index === activePie ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default StatusInterfacedChart; 