import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, PieChart, Pie, Legend, Tooltip, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, CartesianGrid, Line, Label, LabelList, ReferenceLine, AreaChart, Area } from 'recharts';
import { useMediaQuery, useTheme } from '@mui/material';
import { normalizeStatusName, getStatusGroups, getStatusColors, getStatusPriorities } from '../../../config/statusGroups';

// Fungsi helper untuk mendapatkan nilai remark (sudah di-merge dari backend)
const getRemarkValue = (rowData) => {
  // Remark sudah di-merge dari database di backend
  return rowData.Remark;
};

const SummaryCard = ({ title, value, icon, color, onClick, isActive = false }) => {
  // Konversi color ke class Tailwind yang sesuai
  const getColorClass = (colorHex) => {
    switch (colorHex) {
      case '#FF9800': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30';
      case '#F44336': return 'text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30';
      case '#9E9E9E': return 'text-gray-500 bg-gray-50 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600/30';
      case '#4CAF50': return 'text-green-500 bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30';
      case '#3F51B5': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/30';
      case '#5C6BC0': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/30';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30';
    }
  };

  const handleClick = (e) => {
    // Tambahkan efek ripple
    const el = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(el.clientWidth, el.clientHeight);

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - el.offsetLeft - diameter / 2}px`;
    circle.style.top = `${e.clientY - el.offsetTop - diameter / 2}px`;
    circle.classList.add('ripple');

    const ripple = el.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    el.appendChild(circle);

    // Jalankan onClick callback
    if (onClick) onClick(e);
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 h-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden group ${isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
      onClick={handleClick}
      style={{ isolation: 'isolate' }}
    >
      {/* Indikator aktif */}
      {isActive && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-blue-500 border-r-transparent z-10"></div>
      )}

      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.4);
          transform: scale(0);
          animation: ripple 0.6s linear;
          z-index: 1;
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
            {title}
          </h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Order</span>
          </div>
        </div>

        <div className={`rounded-full p-2 ${getColorClass(color)} flex-shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white dark:to-gray-800 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        Klik untuk filter
      </div>
    </div>
  );
};

// Extract BarChart component
const MerchantBarChart = React.memo(({
  data,
  isDarkMode,
  textColor,
  gridColor,
  handleChartClick,
  BAR_GRADIENT_COLORS,
  BarChartTooltip
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        barSize={12}
        barCategoryGap={3}
        barGap={0}
        className="text-xs"
        onClick={(data) => {
          if (data && data.activePayload && data.activePayload[0]) {
            const merchantName = data.activePayload[0].payload.name;
            handleChartClick('MerchantName', merchantName);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDarkMode ? '#374151' : '#e5e7eb'}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          stroke={textColor}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
          fontSize={10}
          tickFormatter={(value) => value}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{
            fontSize: 10,
            fill: textColor
          }}
          tickFormatter={(value) => {
            return value.length > 15 ? `${value.substring(0, 15)}...` : value;
          }}
          stroke={textColor}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
        />
        <Tooltip content={<BarChartTooltip />} cursor={{ fill: 'transparent', opacity: 0 }} />
        <Bar
          dataKey="Pending Verifikasi"
          stackId="a"
          fill="url(#pendingGradient)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Cancel"
          stackId="a"
          fill="url(#cancelGradient)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="IN_Cancel"
          stackId="a"
          fill="url(#inCancelGradient)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Tanpa Remark"
          stackId="a"
          fill="url(#emptyGradient)"
          radius={[0, 4, 4, 0]}
          label={{
            position: 'right',
            fill: textColor,
            fontSize: 10,
            formatter: (value) => value > 0 ? value : ''
          }}
        />
        <ReferenceLine
          x={0}
          stroke="none"
          label={({ viewBox, payload }) => {
            if (!payload || !payload[0]) return null;
            const total = payload[0].payload.total;
            return (
              <text
                x={viewBox.x + viewBox.width + 5}
                y={viewBox.y + viewBox.height / 2}
                fill={textColor}
                fontSize={10}
                textAnchor="start"
                dominantBaseline="middle"
              >
                {total}
              </text>
            );
          }}
        />
        <defs>
          <linearGradient id="pendingGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor={BAR_GRADIENT_COLORS['Pending Verifikasi'][0]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={BAR_GRADIENT_COLORS['Pending Verifikasi'][1]} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="cancelGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor={BAR_GRADIENT_COLORS['Cancel'][0]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={BAR_GRADIENT_COLORS['Cancel'][1]} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="inCancelGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor={BAR_GRADIENT_COLORS['IN_Cancel'][0]} stopOpacity={0.8} />
            <stop offset="95%" stopColor={BAR_GRADIENT_COLORS['IN_Cancel'][1]} stopOpacity={1} />
          </linearGradient>
          <linearGradient id="emptyGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#6b7280" stopOpacity={1} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
});

// Extract PieChart component
const StatusPieChart = React.memo(({
  data,
  activeIndex,
  renderActiveShape,
  onPieEnter,
  handleChartClick,
  statusColumn,
  PIE_COLORS,
  PieChartTooltip,
  statusInterfacedLegendData,
  textColor,
  isDarkMode
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={110}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          onMouseEnter={onPieEnter}
          onClick={(data, index) => handleChartClick(statusColumn, data.name === 'Interfaced' ? 'Yes' : 'No')}
          style={{ cursor: 'pointer' }}
          paddingAngle={5}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke={isDarkMode ? '#1a1a1a' : '#fff'}
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<PieChartTooltip />} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          payload={statusInterfacedLegendData.map(entry => ({
            value: entry.isSubItem
              ? `${entry.name}: ${entry.value}`
              : `${entry.name} (${entry.value})`,
            type: entry.isSubItem ? 'line' : 'circle',
            id: entry.id,
            color: entry.color,
            isSubItem: entry.isSubItem,
            entryName: entry.name
          }))}
          formatter={(value, entry, index) => (
            <span
              style={{
                color: textColor,
                fontSize: '12px',
                marginLeft: entry.isSubItem ? '16px' : '0',
                cursor: 'pointer',
                fontWeight: entry.isSubItem ? 'normal' : 'medium'
              }}
              onClick={() => {
                if (entry.isSubItem && entry.id && entry.id.startsWith('remark-')) {
                  const remarkName = entry.id.substring(7);
                  handleChartClick('Remark', remarkName === 'Tanpa Remark' ? 'NULL' : remarkName);
                } else {
                  handleChartClick(statusColumn, entry.entryName === 'Interfaced' ? 'Yes' : 'No');
                }
              }}
            >
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

const StatusCards = ({ remarkStats = {}, tableData = [], onFilterClick, activeFilters = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Optimize dark mode detection with useCallback
  const detectDarkMode = useCallback(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // Optimize theme colors with useMemo
  const themeColors = useMemo(() => ({
    textColor: isDarkMode ? '#f3f4f6' : '#374151',
    gridColor: isDarkMode ? '#4b5563' : '#e5e7eb',
    tooltipBg: isDarkMode ? '#1f2937' : '#ffffff',
    tooltipBorder: isDarkMode ? '#374151' : '#e5e7eb',
    tooltipTextColor: isDarkMode ? '#ffffff' : '#374151'
  }), [isDarkMode]);

  // Optimize chart settings with useMemo
  const chartSettings = useMemo(() => ({
    isAnimationActive: true,
    animationDuration: 800,
    animationEasing: 'ease-out',
    barChartMargin: { top: 5, right: 10, left: 80, bottom: 5 },
    pieChartMargin: { top: 10, right: 10, bottom: 10, left: 10 },
    tooltipStyle: {
      backgroundColor: themeColors.tooltipBg,
      borderColor: themeColors.tooltipBorder,
      borderRadius: '0.5rem',
      padding: '0.75rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      color: themeColors.tooltipTextColor
    }
  }), [themeColors]);

  // Optimize filter handlers with useCallback
  const handleChartClick = useCallback((column, value) => {
    if (onFilterClick) {
      onFilterClick(column, value);
    }
  }, [onFilterClick]);

  const handleCardClick = useCallback((column, value) => {
    if (onFilterClick) {
      onFilterClick(column, value);
    }
  }, [onFilterClick]);

  // Optimize isFilterActive with useCallback
  const isFilterActive = useCallback((column, value) => {
    return activeFilters.some(filter => filter.column === column && filter.value === value);
  }, [activeFilters]);

  // Optimize pie chart handlers with useCallback
  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  // Optimize column name detection with useMemo
  const columnNames = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        statusColumn: 'Status_Interfaced',
        merchantColumn: 'MerchantName',
        remarkColumn: 'Remark'
      };
    }

    const firstItem = tableData[0] || {};
    const columnKeys = Object.keys(firstItem);

    const getColumnName = (possibleNames) => {
      for (const name of possibleNames) {
        if (columnKeys.includes(name)) {
          return name;
        }
      }
      return possibleNames[0];
    };

    return {
      statusColumn: getColumnName(['Status_Interfaced', 'Status Interfaced']),
      merchantColumn: getColumnName(['Brand', 'MerchantName', 'Merchant Name', 'Merchant']),
      remarkColumn: getColumnName(['Remark'])
    };
  }, [tableData]);

  // Optimize chart colors with useMemo
  const chartColors = useMemo(() => {
    const statusColors = getStatusColors();
    return {
      primaryBlue: '#0ea5e9',
      secondaryBlue: '#38bdf8',
      primaryPurple: '#8b5cf6',
      secondaryPurple: '#a78bfa',
      accentColor: '#f472b6',
      successColor: '#4ade80',
      warningColor: '#fbbf24',
      errorColor: '#f87171',
      BAR_GRADIENT_COLORS: {
        'Pending Verifikasi': ['#0ea5e9', '#38bdf8'],
        'Cancel': ['#8b5cf6', '#a78bfa'],
        'IN_Cancel': ['#a78bfa', '#f472b6']
      },
      PIE_COLORS: ['#0ea5e9', '#8b5cf6', '#f472b6', '#4ade80'],
      STATUS_COLORS: statusColors,
      MARKETPLACE_COLORS: {
        'SHOPEE': '#EE4D2D',
        'TOKOPEDIA': '#03AC0E',
        'LAZADA': '#00008F',
        'TIKTOK': '#000105',
        'BLIBLI': '#0095DA',
        'ZALORA': '#000000',
        'WEB': '#3B82F6',
        'SHOPEE_FOOD': '#EE4D2D',
        'DEFAULT': '#9ca3af'
      }
    };
  }, []);



  // Helper function for legend data generation with grouping
  const generateLegendData = useCallback((statusCount, data, colors) => {
    let result = [];

    result = Object.keys(statusCount).map((key, index) => ({
      id: key,
      name: key === 'Yes' ? 'Interfaced' : 'Not Yet Interfaced',
      value: statusCount[key],
      color: colors[index % colors.length],
      isMainStatus: true
    })).filter(item => item.value > 0);

    if (statusCount['No'] > 0) {
      const remarkStats = {};

      data.forEach(row => {
        const status = row[columnNames.statusColumn];
        if (status === 'No') {
          const remark = getRemarkValue(row);
          if (remark === null || remark === undefined || remark === '') {
            remarkStats['NULL'] = (remarkStats['NULL'] || 0) + 1;
          } else {
            // Normalize the remark name for grouping
            const normalizedRemark = normalizeStatusName(remark);
            remarkStats[normalizedRemark] = (remarkStats[normalizedRemark] || 0) + 1;
          }
        }
      });

      const priorityRemarks = [...getStatusPriorities(), 'NULL'];
      const remarkEntries = Object.entries(remarkStats)
        .sort((a, b) => {
          const indexA = priorityRemarks.indexOf(a[0]);
          const indexB = priorityRemarks.indexOf(b[0]);
          if (indexA >= 0 && indexB >= 0) return indexA - indexB;
          if (indexA >= 0) return -1;
          if (indexB >= 0) return 1;
          return b[1] - a[1];
        })
        .slice(0, 5);

      remarkEntries.forEach(([remark, count]) => {
        result.push({
          id: `remark-${remark}`,
          name: remark === 'NULL' ? 'Tanpa Remark' : remark,
          value: count,
          color: 'rgba(150, 150, 150, 0.8)',
          isSubItem: true
        });
      });
    }

    return result;
  }, [columnNames, normalizeStatusName]);

  // Optimize data processing with useMemo
  const processedData = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        merchantRemarkData: [],
        statusInterfacedData: [],
        statusInterfacedLegendData: [],
        systemIdData: [],
        orderDateData: [],
        orderStats: {}
      };
    }

    // Process merchant remark data
    const merchantGroups = new Map();
    const notInterfacedData = tableData.filter(row => {
      const status = row[columnNames.statusColumn];
      return status === 'No';
    });

    // Calculate total orders and status counts
    const totalOrders = tableData.length;
    const interfacedOrders = tableData.filter(row => {
      const status = row[columnNames.statusColumn];
      return status === 'Yes';
    }).length;
    const pendingOrders = notInterfacedData.length;
    const cancelledOrders = notInterfacedData.filter(row => {
      const remark = getRemarkValue(row);
      const normalizedRemark = normalizeStatusName(remark);
      return normalizedRemark === 'Cancel' || normalizedRemark === 'IN_Cancel';
    }).length;
    const pendingVerificationOrders = notInterfacedData.filter(row => {
      const remark = getRemarkValue(row);
      const normalizedRemark = normalizeStatusName(remark);
      return normalizedRemark === 'Pending Verifikasi';
    }).length;

    notInterfacedData.forEach(row => {
      const merchant = row[columnNames.merchantColumn] || 'Unknown';
      const remark = getRemarkValue(row);
      const isEmptyRemark = remark === null || remark === undefined || remark === '';

      if (!merchantGroups.has(merchant)) {
        const groupTemplate = {
          name: merchant,
          'Tanpa Remark': 0,
          total: 0
        };

        // Add all status groups dynamically
        getStatusGroups().forEach(groupName => {
          groupTemplate[groupName] = 0;
        });

        merchantGroups.set(merchant, groupTemplate);
      }

      const group = merchantGroups.get(merchant);
      group.total++;

      if (isEmptyRemark) {
        group['Tanpa Remark']++;
      } else {
        const normalizedRemark = normalizeStatusName(remark);
        if (getStatusGroups().includes(normalizedRemark)) {
          group[normalizedRemark]++;
        } else {
          // For any other normalized remarks, add to Tanpa Remark
          group['Tanpa Remark']++;
        }
      }
    });

    // Process status interfaced data
    const statusCount = { 'Yes': 0, 'No': 0 };
    tableData.forEach(row => {
      const status = row[columnNames.statusColumn];
      if (status === 'Yes') {
        statusCount['Yes']++;
      } else if (status === 'No') {
        statusCount['No']++;
      }
    });

    const statusInterfacedData = Object.keys(statusCount)
      .map((key, index) => ({
        id: key,
        name: key === 'Yes' ? 'Interfaced' : 'Not Yet Interfaced',
        value: statusCount[key],
        color: chartColors.PIE_COLORS[index % chartColors.PIE_COLORS.length]
      }))
      .filter(item => item.value > 0);

    // Process system ID data
    const systemIdCount = new Map();
    tableData.forEach(row => {
      const systemId = row.SalesChannel || row.SystemID || row.systemID || row['System ID'] || row.SystemId || row['SystemId'] || 'Unknown';
      if (systemId && systemId !== 'Unknown') {
        systemIdCount.set(systemId, (systemIdCount.get(systemId) || 0) + 1);
      }
    });

    // Process order date data
    const hourCount = new Map();
    tableData.forEach(row => {
      const orderDate = row.OrderDate || row.orderDate || row.Order_Date || row.order_date;
      if (orderDate) {
        try {
          const date = new Date(orderDate);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid date:', orderDate);
            return;
          }

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hour = String(date.getHours()).padStart(2, '0');

          const formattedDate = `${year}-${month}-${day} ${hour}:00`;
          hourCount.set(formattedDate, (hourCount.get(formattedDate) || 0) + 1);
        } catch (error) {
          console.error('Error processing date:', orderDate, error);
        }
      }
    });

    // Convert to array and sort by date, limit to last 24 hours for better visualization
    const sortedHourData = Array.from(hourCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // If we have more than 24 data points, take the last 24
    let orderDateData = sortedHourData.length > 24
      ? sortedHourData.slice(-24)
      : sortedHourData;

    // If no data, create some dummy data for demonstration
    if (orderDateData.length === 0) {
      const now = new Date();
      orderDateData = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        return {
          date: `${year}-${month}-${day} ${hour}:00`,
          count: Math.floor(Math.random() * 10) + 1
        };
      });
    }

    return {
      merchantRemarkData: Array.from(merchantGroups.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10),
      statusInterfacedData,
      statusInterfacedLegendData: generateLegendData(statusCount, tableData, chartColors.PIE_COLORS),
      systemIdData: Array.from(systemIdCount.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      orderDateData: orderDateData,
      orderStats: {
        totalOrders,
        interfacedOrders,
        pendingOrders,
        cancelledOrders,
        pendingVerificationOrders
      }
    };
  }, [tableData, columnNames, chartColors, generateLegendData, normalizeStatusName]);

  // Deteksi perubahan tema dan update state
  useEffect(() => {
    const detectDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Panggil sekali untuk inisialisasi
    detectDarkMode();

    // Observer untuk mendeteksi perubahan class pada html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          detectDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Jika tidak ada data, tampilkan pesan
  if (!tableData || tableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 max-w-md w-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Belum ada data untuk ditampilkan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Silakan masukkan SystemRefId terlebih dahulu untuk melihat data monitoring.
          </p>
        </div>
      </div>
    );
  }

  // Optimize tooltip components with useMemo
  const BarChartTooltip = useMemo(() => {
    return ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const total = payload.reduce((sum, entry) => sum + entry.value, 0);

        const sortedPayload = [...payload].sort((a, b) => {
          const priorityOrder = {
            'Tanpa Remark': 1,
            'Pending Verifikasi': 2,
            'Cancel': 3,
            'IN_Cancel': 4
          };

          if (priorityOrder[a.name] && priorityOrder[b.name]) {
            return priorityOrder[a.name] - priorityOrder[b.name];
          }

          if (priorityOrder[a.name]) return -1;
          if (priorityOrder[b.name]) return 1;
          return b.value - a.value;
        });

        return (
          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">{`${label}`}</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
              Total: <span className="font-semibold">{total}</span> transaksi belum interfaced
            </p>

            {sortedPayload.map((entry, index) => {
              let color;
              switch (entry.name) {
                case 'Pending Verifikasi':
                  color = chartColors.BAR_GRADIENT_COLORS['Pending Verifikasi'][0];
                  break;
                case 'Cancel':
                  color = chartColors.BAR_GRADIENT_COLORS['Cancel'][0];
                  break;
                case 'IN_Cancel':
                  color = chartColors.BAR_GRADIENT_COLORS['IN_Cancel'][0];
                  break;
                case 'Tanpa Remark':
                  color = '#9ca3af';
                  break;
                default:
                  color = '#9ca3af';
              }

              return (
                <div key={`tooltip-${index}`} className="flex gap-2 items-center mt-1">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {`${entry.name}: ${entry.value}`}
                    {entry.name === 'Tanpa Remark' &&
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">(perlu ditindaklanjuti)</span>
                    }
                  </p>
                </div>
              );
            })}

            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-blue-600 dark:text-blue-400">
              Klik untuk filter berdasarkan client
            </div>
          </div>
        );
      }
      return null;
    };
  }, [chartColors]);

  const PieChartTooltip = useMemo(() => {
    return ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0];

        return (
          <div style={{
            backgroundColor: themeColors.tooltipBg,
            border: `1px solid ${themeColors.tooltipBorder}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            color: themeColors.tooltipTextColor,
            fontSize: '13px'
          }}>
            <p style={{
              fontWeight: 600,
              borderBottom: `1px solid ${themeColors.tooltipBorder}`,
              paddingBottom: '6px',
              marginBottom: '8px'
            }}>
              {data.name}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                backgroundColor: data.color || data.fill,
                borderRadius: '50%',
                marginRight: '8px'
              }} />
              <span style={{ fontWeight: 500 }}>{data.value} transaksi</span>
            </div>
          </div>
        );
      }
      return null;
    };
  }, [themeColors]);

  // Optimize renderActiveShape with useCallback
  const renderActiveShape = useCallback((props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={themeColors.textColor} fontSize={16} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={15} textAnchor="middle" fill={isDarkMode ? '#e5e7eb' : '#666'} fontSize={14}>
          {value} transaksi
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.9}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={2} />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={themeColors.textColor} fontSize={12}>
          {`${value} transaksi`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={isDarkMode ? '#e5e7eb' : '#666'} fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  }, [themeColors, isDarkMode]);

  return (
    <div className="space-y-4">
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BarChart for MerchantName by Remark */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 transition-all duration-300 hover:shadow-md">
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Not Yet Interfaced By Brand
          </h3>
          <div className="mb-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Klik pada batang untuk memfilter</p>
          </div>
          <div className="h-80">
            {processedData.merchantRemarkData.length > 0 ? (
              <MerchantBarChart
                data={processedData.merchantRemarkData}
                isDarkMode={isDarkMode}
                textColor={themeColors.textColor}
                gridColor={themeColors.gridColor}
                handleChartClick={handleChartClick}
                BAR_GRADIENT_COLORS={chartColors.BAR_GRADIENT_COLORS}
                BarChartTooltip={BarChartTooltip}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Tidak ada data untuk ditampilkan
              </div>
            )}
          </div>
        </div>

        {/* Bagian Status Interfaced */}
        <div className="mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 transition-all duration-300 hover:shadow-md">
            <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Status Interfaced
            </h3>
            <div className="mb-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Arahkan kursor ke sektor untuk detail. Klik untuk memfilter</p>
            </div>
            <div className="h-80" style={{ cursor: 'pointer' }}>
              {processedData.statusInterfacedData.length > 0 ? (
                <StatusPieChart
                  data={processedData.statusInterfacedData}
                  activeIndex={activeIndex}
                  renderActiveShape={renderActiveShape}
                  onPieEnter={onPieEnter}
                  handleChartClick={handleChartClick}
                  statusColumn={columnNames.statusColumn}
                  PIE_COLORS={chartColors.PIE_COLORS}
                  PieChartTooltip={PieChartTooltip}
                  statusInterfacedLegendData={processedData.statusInterfacedLegendData}
                  textColor={themeColors.textColor}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Monitoring Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Status Monitoring
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Orders Card */}
          <SummaryCard
            title="Total Orders"
            value={processedData.orderStats?.totalOrders || 0}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>}
            color={chartColors.primaryBlue}
            onClick={() => handleCardClick('all', 'all')}
            isActive={isFilterActive('all', 'all')}
          />

          {/* Interfaced Orders Card */}
          <SummaryCard
            title="Interfaced Orders"
            value={processedData.orderStats?.interfacedOrders || 0}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>}
            color={chartColors.successColor}
            onClick={() => handleCardClick(columnNames.statusColumn, 'Yes')}
            isActive={isFilterActive(columnNames.statusColumn, 'Yes')}
          />

          {/* Not Yet Interfaced Card */}
          <SummaryCard
            title="Not Yet Interfaced"
            value={processedData.orderStats?.pendingOrders || 0}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>}
            color={chartColors.warningColor}
            onClick={() => handleCardClick(columnNames.statusColumn, 'No')}
            isActive={isFilterActive(columnNames.statusColumn, 'No')}
          />

          {/* Cancelled Orders Card */}
          <SummaryCard
            title="Cancelled Orders"
            value={processedData.orderStats?.cancelledOrders || 0}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>}
            color={chartColors.errorColor}
            onClick={() => handleCardClick('Remark', 'Cancel')}
            isActive={isFilterActive('Remark', 'Cancel')}
          />

          {/* Pending Verification Card */}
          <SummaryCard
            title="Pending Verification"
            value={processedData.orderStats?.pendingVerificationOrders || 0}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>}
            color={chartColors.primaryPurple}
            onClick={() => handleCardClick('Remark', 'Pending Verifikasi')}
            isActive={isFilterActive('Remark', 'Pending Verifikasi')}
          />
        </div>

        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-md text-xs text-blue-700 dark:text-blue-300">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Total Not Yet Interfaced</strong> menampilkan semua data yang belum diproses. Klik kartu untuk memfilter.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row with 30/70 split */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 md:col-span-2">
        {/* BarChart for SystemID - 30% width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 transition-all duration-300 hover:shadow-md md:col-span-3">
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Distribution by Marketplace
          </h3>
          <div className="mb-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Klik pada batang untuk memfilter</p>
          </div>
          <div className="h-80">
            {processedData.systemIdData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedData.systemIdData}
                  layout="horizontal"
                  margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  barSize={20}
                  barCategoryGap={8}
                  barGap={0}
                  className="text-xs"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                    horizontal={false}
                    vertical={true}
                  />
                  <XAxis
                    type="category"
                    dataKey="name"
                    stroke={themeColors.textColor}
                    tickLine={false}
                    axisLine={{ stroke: themeColors.gridColor }}
                    fontSize={11}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    type="number"
                    stroke={themeColors.textColor}
                    tickLine={false}
                    axisLine={{ stroke: themeColors.gridColor }}
                    fontSize={11}
                    tickFormatter={(value) => value}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">{label}</p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Total: <span className="font-semibold">{payload[0].value}</span> data
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'transparent', opacity: 0 }}
                  />
                  <Bar
                    dataKey="value"
                    onClick={(data) => handleChartClick('SystemId', data.name)}
                    style={{ cursor: 'pointer' }}
                    isAnimationActive={chartSettings.isAnimationActive}
                    animationDuration={chartSettings.animationDuration}
                    animationEasing={chartSettings.animationEasing}
                    label={({ x, y, width, value }) => (
                      <text
                        x={x + width / 2}
                        y={y - 5}
                        fill={isDarkMode ? '#9CA3AF' : '#4B5563'}
                        fontSize={11}
                        textAnchor="middle"
                        dominantBaseline="bottom"
                      >
                        {value}
                      </text>
                    )}
                  >
                    {processedData.systemIdData.map((entry, index) => {
                      const name = entry.name.toUpperCase();
                      const color = chartColors.MARKETPLACE_COLORS[name] || chartColors.MARKETPLACE_COLORS['DEFAULT'];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={color}
                          radius={[4, 4, 0, 0]}
                        />
                      );
                    })}
                  </Bar>
                  <defs>
                    <linearGradient id="batchGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primaryBlue} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.secondaryBlue} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Tidak ada data untuk ditampilkan
              </div>
            )}
          </div>
        </div>

        {/* LineChart for OrderDate - 70% width */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 transition-all duration-300 hover:shadow-md md:col-span-7">
          <h3 className="text-base font-semibold mb-1 text-gray-800 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Order Trend per Jam
          </h3>
          <div className="mb-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Trend jumlah order berdasarkan jam</p>
          </div>
          <div className="h-80">
            {processedData.orderDateData && processedData.orderDateData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={processedData.orderDateData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={themeColors.textColor}
                    tickLine={false}
                    axisLine={{ stroke: isDarkMode ? '#374151' : '#e5e7eb' }}
                    fontSize={10}
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;

                        // Show only hour for better readability
                        const hour = String(date.getHours()).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${day}/${hour}`;
                      } catch (error) {
                        return value;
                      }
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={45}
                    interval="preserveStartEnd"
                    minTickGap={10}
                    dy={5}
                  />
                  <YAxis
                    stroke={themeColors.textColor}
                    tickLine={false}
                    axisLine={{ stroke: isDarkMode ? '#374151' : '#e5e7eb' }}
                    fontSize={10}
                    tickFormatter={(value) => value}
                    domain={[0, 'dataMax + 1']}
                    dx={-5}
                    width={40}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        try {
                          const date = new Date(label);
                          const formattedDate = date.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          return (
                            <div
                              className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-sm"
                              style={{
                                backgroundColor: themeColors.tooltipBg,
                                borderColor: themeColors.tooltipBorder,
                                color: themeColors.textColor
                              }}
                            >
                              <p className="font-medium mb-1">{formattedDate}</p>
                              <p className="text-blue-500 dark:text-blue-400">
                                Total: <span className="font-semibold">{payload[0].value}</span> order
                              </p>
                            </div>
                          );
                        } catch (error) {
                          return (
                            <div
                              className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-sm"
                              style={{
                                backgroundColor: themeColors.tooltipBg,
                                borderColor: themeColors.tooltipBorder,
                                color: themeColors.textColor
                              }}
                            >
                              <p className="font-medium mb-1">{label}</p>
                              <p className="text-blue-500 dark:text-blue-400">
                                Total: <span className="font-semibold">{payload[0].value}</span> order
                              </p>
                            </div>
                          );
                        }
                      }
                      return null;
                    }}
                    cursor={{
                      stroke: isDarkMode ? '#4B5563' : '#9CA3AF',
                      strokeWidth: 1,
                      strokeDasharray: '3 3'
                    }}
                  />
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#lineGradient)"
                    dot={{
                      fill: '#3B82F6',
                      stroke: isDarkMode ? '#1F2937' : '#FFFFFF',
                      strokeWidth: 2,
                      r: 4
                    }}
                    activeDot={{
                      fill: '#60A5FA',
                      stroke: isDarkMode ? '#1F2937' : '#FFFFFF',
                      strokeWidth: 3,
                      r: 6
                    }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm">Tidak ada data timeline untuk ditampilkan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards; 