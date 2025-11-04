import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePageTitle } from '../utils/pageTitle';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';



// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

const Statistics = () => {
  usePageTitle('Statistik Setup Request');

  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeFilter, setTimeFilter] = useState('week');
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Fetch statistics from API
  const fetchStatistics = async (period = timeFilter) => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login kembali.');
      }

      const response = await axios.get(`/setup-request/statistics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setStatistics(response.data.statistics);
      } else {
        throw new Error(`Gagal memuat statistik: ${response.data.message || 'Format respons tidak sesuai'}`);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`❌ GAGAL MEMUAT STATISTIK\n\n${errorMsg}\n\n💡 SOLUSI:\n• Periksa koneksi internet Anda\n• Refresh halaman dan coba lagi\n• Hubungi administrator jika masalah berlanjut`);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Handle time filter change
  const handleTimeFilterChange = (period) => {
    setTimeFilter(period);
    fetchStatistics(period);
  };

  // Get trend data from statistics or use fallback
  const getTrendData = () => {
    if (!statistics || !statistics.trend_data) {
      // Fallback data if no trend data available
      const fallbackData = {
        today: {
          labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
          data: Array(24).fill(0)
        },
        week: {
          labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
          data: [0, 0, 0, 0, 0, 0, 0]
        },
        month: {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
          data: [0, 0, 0, 0]
        }
      };

      return {
        labels: fallbackData[timeFilter]?.labels || fallbackData.week.labels,
        datasets: [{
          label: 'Requests',
          data: fallbackData[timeFilter]?.data || fallbackData.week.data,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#1e40af',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      };
    }

    // Use real trend data from API
    const trendData = statistics.trend_data[timeFilter] || statistics.trend_data.week;
    
    return {
      labels: trendData.labels,
      datasets: [{
        label: 'Requests',
        data: trendData.data,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#1e40af',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    };
  };

  const trendData = getTrendData();

  // Create distribution data from statistics
  const getDistributionData = () => {
    if (!statistics) return {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        cutout: '70%'
      }],
      total: 0,
      items: []
    };

    const processTypes = statistics.process_types;
    
    const data = [
      { label: 'Bundle', value: processTypes.bundle, color: '#3b82f6', icon: '📦' },
      { label: 'Supplementary', value: processTypes.supplementary, color: '#10b981', icon: '🎁' },
      { label: 'Gift Type 2', value: processTypes.gift_type_2, color: '#f59e0b', icon: '🎉' },
      { label: 'Gift Type 3', value: processTypes.gift_type_3, color: '#f97316', icon: '🎊' }
    ].filter(item => item.value > 0); // Only show items with data

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return {
      labels: data.map(item => item.label),
      datasets: [{
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderWidth: 0,
        cutout: '70%'
      }],
      total: total,
      items: data.map(item => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
      }))
    };
  };

  const distributionData = getDistributionData();

    const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 20,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: { 
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      },
      datalabels: {
        color: function(context) {
          // Check if dark mode is active
          const isDark = document.documentElement.classList.contains('dark');
          return isDark ? '#e2e8f0' : '#1e293b';
        },
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: function(value) {
          return value;
        },
        anchor: 'end',
        align: 'top',
        offset: 4
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      },
      datalabels: {
        display: false
      }
    },
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        const dataIndex = activeElements[0].index;
        const label = distributionData.labels[dataIndex];
        const value = distributionData.datasets[0].data[dataIndex];
        setHoveredSegment({ label, value });
      } else {
        setHoveredSegment(null);
      }
    }
  };

  // Skeleton Loading Component
  const SkeletonCard = ({ className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 animate-pulse ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
        <div className="w-16 h-4 bg-white/10 rounded"></div>
      </div>
      <div className="h-10 bg-white/10 rounded mb-2"></div>
      <div className="h-4 bg-white/10 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-white/10 rounded w-1/2"></div>
    </div>
  );

  const SkeletonChart = ({ className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 animate-pulse ${className}`}>
      <div className="h-6 bg-white/10 rounded mb-5 w-1/3"></div>
      <div className="h-64 bg-white/10 rounded"></div>
    </div>
  );

  const SkeletonTable = ({ className = "" }) => (
    <div className={`bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 animate-pulse ${className}`}>
      <div className="h-6 bg-white/10 rounded mb-5 w-1/2"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-4 bg-white/10 rounded"></div>
              <div className="w-24 h-4 bg-white/10 rounded"></div>
            </div>
            <div className="w-12 h-6 bg-white/10 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-5">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-8 bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-64"></div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 bg-black/30 p-1 rounded-xl">
                <div className="w-20 h-8 bg-white/10 rounded-lg"></div>
                <div className="w-20 h-8 bg-white/10 rounded-lg"></div>
                <div className="w-20 h-8 bg-white/10 rounded-lg"></div>
              </div>
              <div className="w-24 h-8 bg-white/10 rounded-lg"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <SkeletonChart className="lg:col-span-2" />
            <SkeletonChart />
          </div>

          {/* Tables Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonTable />
            <SkeletonTable />
          </div>
        </div>
      </div>
    );
  }

      return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/80 dark:bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
            📊 Statistik Setup Request
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-gray-100 dark:bg-black/30 p-1 rounded-xl">
              <button 
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'today' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleTimeFilterChange('today')}
                disabled={isLoading}
              >
                Hari Ini
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleTimeFilterChange('week')}
                disabled={isLoading}
              >
                Minggu Ini
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-all ${
                  timeFilter === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleTimeFilterChange('month')}
                disabled={isLoading}
              >
                Bulan Ini
              </button>
            </div>

            <button 
              onClick={() => fetchStatistics(timeFilter)}
              disabled={isLoading}
              className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
        </div>



        {/* Error State */}
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-red-400 text-xl">❌</div>
              <div className="flex-1">
                <div 
                  className="text-sm whitespace-pre-line text-red-200"
                  dangerouslySetInnerHTML={{ 
                    __html: errorMessage
                      .replace(/\n/g, '<br/>')
                      .replace(/❌/g, '<span class="font-bold text-red-400">❌</span>')
                      .replace(/💡/g, '<span class="font-bold text-blue-400">💡</span>')
                  }}
                />
              </div>
              <button 
                className="text-red-400/80 hover:text-red-400"
                onClick={() => setErrorMessage('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Statistics Content */}
        {statistics && (
          <div className="space-y-6 relative">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-slate-300 text-sm">Memuat data...</p>
                </div>
              </div>
            )}
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Total Requests */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300 group shadow-lg dark:shadow-none">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                    ↗ +8.2%
                  </div>
                </div>
                <div className={`text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 transition-all duration-300 ${
                  isLoading ? 'animate-pulse' : ''
                }`}>
                  {statistics.summary?.total_requests || 0}
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm mb-2 font-medium">Total Requests</div>
                <div className="text-gray-500 dark:text-slate-400 text-xs">
                  Rata-rata: 7.3/hari
                </div>
              </div>

              {/* Total Clients */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300 group shadow-lg dark:shadow-none">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                    ↗ +12.5%
                  </div>
                </div>
                <div className={`text-4xl font-bold text-green-600 dark:text-green-400 mb-2 transition-all duration-300 ${
                  isLoading ? 'animate-pulse' : ''
                }`}>
                  {statistics.summary?.total_clients || 0}
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm mb-2 font-medium">Total Clients</div>
                <div className="text-gray-500 dark:text-slate-400 text-xs">
                  Client unik yang aktif • 3 client baru minggu ini
                </div>
              </div>

              {/* Total PICs */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300 group shadow-lg dark:shadow-none">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                    🎯
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                    ↗ +5.1%
                  </div>
                </div>
                <div className={`text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2 transition-all duration-300 ${
                  isLoading ? 'animate-pulse' : ''
                }`}>
                  {statistics.summary?.total_pics || 0}
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm mb-2 font-medium">Total PIC</div>
                <div className="text-gray-500 dark:text-slate-400 text-xs">
                  PIC yang aktif • Conversion rate: 36.4%
                </div>
              </div>

              {/* Top PIC */}
              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden hover:transform hover:-translate-y-1 transition-all duration-300 group shadow-lg dark:shadow-none">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                    👨‍💼
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold">
                    {statistics.setup_by_pic && statistics.setup_by_pic.length > 0 && statistics.setup_by_pic[0].completion_rate >= 80 ? '↗ High' : '→ Good'}
                  </div>
                </div>
                <div className={`text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2 transition-all duration-300 ${
                  isLoading ? 'animate-pulse' : ''
                }`}>
                  {statistics.setup_by_pic && statistics.setup_by_pic.length > 0 ? statistics.setup_by_pic[0].username : 'N/A'}
                </div>
                <div className="text-gray-700 dark:text-slate-300 text-sm mb-2 font-medium">Top PIC</div>
                <div className="text-gray-500 dark:text-slate-400 text-xs">
                  {statistics.setup_by_pic && statistics.setup_by_pic.length > 0 ? `${statistics.setup_by_pic[0].count} requests • ${statistics.setup_by_pic[0].completion_rate}% completion` : '0 requests'}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Trend Chart */}
              <div className="lg:col-span-2 bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-5">
                  📈 Tren Request {
                    timeFilter === 'today' ? 'Harian' :
                    timeFilter === 'month' ? 'Bulanan' : 'Mingguan'
                  }
                </div>
                <div className="w-full h-80">
                  <Line data={trendData} options={chartOptions} />
                </div>
              </div>
              
              {/* Distribution Chart */}
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-5">📊 Distribusi Tipe Proses</div>
                <div className="w-full h-64 relative mb-4">
                  <Doughnut data={distributionData} options={doughnutOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {hoveredSegment ? (
                      <>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {hoveredSegment.label}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {hoveredSegment.value} requests
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                          {distributionData.total || 0}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          Total Requests
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Legend with percentages */}
                <div className="space-y-2">
                  {distributionData.items && distributionData.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.icon} {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.value}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[45px] text-right">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Clients Table */}
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-5">🏆 Top Clients Performance</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Client</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Requests</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Tipe Proses</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.top_clients.slice(0, 4).map((client, index) => {
                        // Determine display text for process type
                        let processTypeDisplay = client.process_type || 'Bundle';
                        if (client.process_type === 'Gift' && client.gift_type) {
                          processTypeDisplay = `Gift Type ${client.gift_type}`;
                        }
                        
                        return (
                          <tr key={index} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{client.name}</td>
                            <td className="py-3 px-2">
                              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg text-xs font-semibold">
                                {client.count}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                client.process_type === 'Bundle' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                                client.process_type === 'Gift' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400' : 
                                'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                              }`}>
                                {processTypeDisplay}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  client.status === 'Active' ? 'bg-green-500' :
                                  client.status === 'Recent' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <span className="text-slate-700 dark:text-slate-300 text-sm">{client.status}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Setup by PIC Table */}
              <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-5">📋 Setup by PIC Analysis</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">PIC</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Requests</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Completion</th>
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.setup_by_pic.slice(0, 4).map((pic, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{pic.username}</td>
                          <td className="py-3 px-2">
                            <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg text-xs font-semibold">
                              {pic.count}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm">
                            <span className={`${
                              pic.completion_rate >= 90 ? 'text-green-600 dark:text-green-400' :
                              pic.completion_rate >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {pic.completion_rate}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-700 dark:text-slate-300 text-sm">
                            {pic.avg_time}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Empty State */}
        {!isLoading && !statistics && !errorMessage && (
          <div className="text-center py-20">
            <div className="text-slate-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              Tidak ada data statistik
            </h3>
            <p className="text-slate-400 mb-6">
              Belum ada data setup request yang tersedia untuk ditampilkan.
            </p>
            <button 
              onClick={fetchStatistics}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
            >
              🔄 Muat Ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
