import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Rectangle, LabelList, Cell, Legend
} from 'recharts';

// Warna untuk berbagai tipe remark
const COLORS = {
  'OK': '#10b981',       // Emerald-500
  'PENDING': '#f59e0b',  // Amber-500
  'ERROR': '#ef4444',    // Red-500
  'EMPTY': '#9ca3af',    // Gray-400
  'OTHER': '#8b5cf6'     // Violet-500
};

const CustomShapeBarChart = ({ data, onFilterClick, isLoading }) => {
  const [chartData, setChartData] = useState([]);
  const [activeBar, setActiveBar] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [textColor, setTextColor] = useState(isDarkMode ? '#ffffff' : '#374151');
  const [tooltipBg, setTooltipBg] = useState(isDarkMode ? '#1f2937' : '#ffffff');
  const [tooltipBorder, setTooltipBorder] = useState(isDarkMode ? '#374151' : '#e5e7eb');
  
  // Observer untuk deteksi perubahan tema secara otomatis
  useEffect(() => {
    const detectThemeChange = () => {
      const newIsDarkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(newIsDarkMode);
      setTextColor(newIsDarkMode ? '#ffffff' : '#374151');
      setTooltipBg(newIsDarkMode ? '#1f2937' : '#ffffff');
      setTooltipBorder(newIsDarkMode ? '#374151' : '#e5e7eb');
    };

    // Deteksi perubahan tema menggunakan MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          detectThemeChange();
        }
      });
    });

    // Observasi perubahan pada class di html element
    observer.observe(document.documentElement, { attributes: true });

    // Cleanup observer ketika component unmount
    return () => observer.disconnect();
  }, []);
  
  // Process data for chart
  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setChartData([]);
      return;
    }

    // Hitung jumlah remark berdasarkan kategori
    const remarkCounts = data.reduce((acc, item) => {
      // Ambil nilai dari beberapa kemungkinan nama kolom
      let remark = item.Remark || item.remark || item.Remarks || item.remarks || item.Description || item.description || '';
      
      // Standardisasi format remark
      remark = !remark ? 'EMPTY' : 
               typeof remark !== 'string' ? String(remark) : 
               remark.trim() === '' ? 'EMPTY' : 
               remark.toUpperCase();
      
      // Tentukan kategori remark
      let category = 'OTHER';
      
      if (
        remark === 'OK' || 
        remark === 'SUCCESS' || 
        remark.includes('BERHASIL') || 
        remark.includes('SUKSES')
      ) {
        category = 'OK';
      } else if (
        remark.includes('PENDING') || 
        remark.includes('WAIT') || 
        remark.includes('TUNGGU') || 
        remark.includes('PROCESS')
      ) {
        category = 'PENDING';
      } else if (
        remark.includes('ERROR') || 
        remark.includes('FAIL') || 
        remark.includes('GAGAL') || 
        remark.includes('TIMEOUT')
      ) {
        category = 'ERROR';
      } else if (remark === 'EMPTY' || remark === '') {
        category = 'EMPTY';
      }
      
      if (!acc[category]) {
        acc[category] = { name: category, count: 0 };
      }
      
      acc[category].count += 1;
      return acc;
    }, {});
    
    // Konversi ke array untuk chart dan sort berdasarkan prioritas
    const priorityOrder = { OK: 0, PENDING: 1, ERROR: 2, EMPTY: 3, OTHER: 4 };
    const sortedData = Object.values(remarkCounts).sort((a, b) => 
      priorityOrder[a.name] - priorityOrder[b.name]
    );
    
    setChartData(sortedData);
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.count, 0);
      const percentage = ((data.count / total) * 100).toFixed(1);
      
      return (
        <div 
          style={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            padding: '10px',
            borderRadius: '6px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
        >
          <p style={{ 
            color: textColor, 
            fontWeight: 500, 
            marginBottom: '5px',
            borderBottom: `1px solid ${tooltipBorder}`,
            paddingBottom: '4px' 
          }}>
            {data.name}
          </p>
          <p style={{ 
            color: textColor, 
            fontSize: '13px',
            margin: 0
          }}>
            {`${data.count} item (${percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle bar click untuk filtering
  const handleBarClick = useCallback((data, index) => {
    setActiveBar(index === activeBar ? null : index);
    
    if (onFilterClick && data && data.name) {
      // Column name untuk filter
      const columnName = 'Remark';
      
      // Prepare filter value berdasarkan tipe remark
      let filterValue = '';
      switch(data.name) {
        case 'OK':
          filterValue = 'OK';
          break;
        case 'PENDING':
          filterValue = 'PENDING';
          break;
        case 'ERROR':
          filterValue = 'ERROR';
          break;
        case 'EMPTY':
          filterValue = '';
          break;
        case 'OTHER':
        default:
          filterValue = '';
          break;
      }
      
      onFilterClick(columnName, filterValue);
    }
  }, [activeBar, onFilterClick]);

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
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Statistik Remark
      </h3>
      <div className="mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">Klik pada bar untuk memfilter data</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 25,
            }}
            barSize={60}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="name" 
              tick={{ fill: textColor }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }} 
            />
            <YAxis 
              tick={{ fill: textColor }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }} 
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            />
            <Legend 
              formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              wrapperStyle={{ paddingTop: 10 }}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              onClick={handleBarClick}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name]} 
                  fillOpacity={index === activeBar ? 1 : 0.8}
                  stroke={index === activeBar ? '#ffffff' : 'none'}
                  strokeWidth={index === activeBar ? 2 : 0}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend dibawah */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {chartData.map((entry, index) => (
          <div 
            key={`legend-${index}`} 
            className="flex items-center cursor-pointer px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleBarClick(entry, index)}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: COLORS[entry.name] }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.name} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RemarkChart = React.memo(({ data, onFilterClick, isLoading }) => {
  const [activeBar, setActiveBar] = useState(null);
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
      OK: 0,
      PENDING: 0,
      ERROR: 0,
      EMPTY: 0,
      OTHER: 0
    };
    
    data.forEach(item => {
      const remark = item.Remark || '';
      if (remark === 'OK') counts.OK++;
      else if (remark === 'PENDING') counts.PENDING++;
      else if (remark === 'ERROR') counts.ERROR++;
      else if (!remark) counts.EMPTY++;
      else counts.OTHER++;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[name]
      }));
  }, [data]);

  // Optimize click handler
  const handleBarClick = useCallback((data, index) => {
    setActiveBar(index === activeBar ? null : index);
    
    if (onFilterClick && data && data.name) {
      const columnName = 'Remark';
      const filterValue = data.name === 'EMPTY' ? '' : data.name;
      onFilterClick(columnName, filterValue);
    }
  }, [activeBar, onFilterClick]);

  // Optimize tooltip rendering
  const CustomTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const total = processedChartData.reduce((sum, item) => sum + item.value, 0);
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
  }, [processedChartData, themeColors]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full h-80 flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render empty state
  if (!processedChartData || processedChartData.length === 0) {
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
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Statistik Remark
      </h3>
      <div className="mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">Klik pada bar untuk memfilter data</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={themeColors.textColor}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke={themeColors.textColor}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              onClick={handleBarClick}
              cursor="pointer"
              animationDuration={300}
              animationBegin={0}
              animationEasing="ease-out"
            >
              {processedChartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={index === activeBar ? 1 : 0.8}
                  stroke={index === activeBar ? '#ffffff' : 'none'}
                  strokeWidth={index === activeBar ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default RemarkChart; 