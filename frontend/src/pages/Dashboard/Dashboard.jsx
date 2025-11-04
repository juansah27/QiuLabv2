import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../utils/pageTitle';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_COLORS, THEME_TRANSITIONS, COMPONENT_CLASSES } from '../../utils/themeUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, LabelList
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalPermintaan: 14,
    totalMerek: 9,
    totalJenisPermintaan: 4,
    totalPIC: 2,
    distribusiMerek: [
      { name: 'NACIFIC', value: 5 },
      { name: 'INNISFREE', value: 3 },
      { name: 'FACETOLOGY', value: 2 },
      { name: 'SKINGAME', value: 1 },
      { name: 'ELVICTO', value: 1 },
      { name: 'SOMEBYMI', value: 1 },
      { name: 'SCORA', value: 1 },
      { name: 'REEDERMA', value: 1 },
      { name: 'MUSTELA', value: 1 }
    ],
    jenisPermintaan: [
      { name: 'Bundle', value: 4 },
      { name: 'Type 3 - by Value', value: 6 },
      { name: 'Supplementary', value: 2 },
      { name: '+2 - by Min.QTY', value: 2 }
    ],
    detailPermintaan: [
      { name: '01 Mar', count: 2500 },
      { name: '05 Mar', count: 3000 },
      { name: '10 Mar', count: 4800 },
      { name: '15 Mar', count: 3500 },
      { name: '20 Mar', count: 4200 },
      { name: '25 Mar', count: 3800 },
      { name: '30 Mar', count: 4300 }
    ],
    distribusiPIC: [
      { name: 'Aisyah', value: 64 },
      { name: 'Juansah', value: 36 }
    ],
    hubunganMerekJenis: [
      { merek: 'NACIFIC', jenis: 'Bundle', pic: 'Aisyah', jumlah: 2 },
      { merek: 'NACIFIC', jenis: 'Supplementary', pic: 'Juansah', jumlah: 2 },
      { merek: 'NACIFIC', jenis: 'Gift Type 3 - by Value', pic: 'Aisyah', jumlah: 1 },
      { merek: 'FACETOLOGY', jenis: 'Bundle', pic: 'Aisyah', jumlah: 1 },
      { merek: 'FACETOLOGY', jenis: 'Regular', pic: 'Juansah', jumlah: 1 },
      { merek: 'MUSTELA', jenis: 'Gift Type 3 - by Value', pic: 'Aisyah', jumlah: 1 }
    ]
  });

  // Format data untuk radar chart
  const radarData = useMemo(() => {
    const maxValue = Math.max(...dashboardData.distribusiMerek.map(item => item.value), 1);
    return dashboardData.distribusiMerek.map(item => ({
      subject: item.name,
      A: item.value,
      fullMark: maxValue
    }));
  }, [dashboardData.distribusiMerek]);

  // Menambahkan judul halaman
  usePageTitle('Dashboard Analitik Setup Request');

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        console.log('Token available:', !!token);
        
        // Fetch real data from setup-request analytics API
        const apiUrl = '/api/dashboard/setup-request-analytics';
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        // Transform API data to match dashboard format
        const transformedData = {
          totalPermintaan: data.totalRequestClient || 0,
          totalMerek: data.topClientRequest || 0,
          totalJenisPermintaan: (data.giftType2Count || 0) + (data.giftType3Count || 0),
          totalPIC: data.totalSetup || 0,
          distribusiMerek: data.distribusiBrand || [],
          jenisPermintaan: [
            { name: 'Gift Type 2', value: data.giftType2Count || 0 },
            { name: 'Gift Type 3', value: data.giftType3Count || 0 }
          ],
          detailPermintaan: data.totalRequestByType || [],
          distribusiPIC: [], // This will be populated if we have user data
          hubunganMerekJenis: [] // This can be calculated from the data if needed
        };
        
        setDashboardData(transformedData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        
        // Fallback to mock data if API fails
        console.log('Falling back to mock data...');
        const mockData = {
          totalPermintaan: 9,
          totalMerek: 6,
          totalJenisPermintaan: 20,
          totalPIC: 2,
          distribusiMerek: [
            { name: 'NACIFIC', value: 6 },
            { name: 'INNISFREE', value: 4 },
            { name: 'FACETOLOGY', value: 3 },
            { name: 'SKINGAME', value: 2 },
            { name: 'SOMEBYMI', value: 1 },
            { name: 'SCORA', value: 1 },
            { name: 'REEDERMA', value: 1 },
            { name: 'MUSTELA', value: 1 },
            { name: 'ELVICTO', value: 1 }
          ],
          jenisPermintaan: [
            { name: 'Gift Type 2', value: 10 },
            { name: 'Gift Type 3', value: 10 }
          ],
          detailPermintaan: [
            { name: 'shopee', value: 7 },
            { name: 'tiktok', value: 4 },
            { name: 'lazada', value: 3 },
            { name: 'tokopedia', value: 2 },
            { name: 'zalora', value: 1 },
            { name: 'jubelio', value: 1 },
            { name: 'desty', value: 1 },
            { name: 'blibli', value: 1 }
          ],
          distribusiPIC: [],
          hubunganMerekJenis: []
        };
        
        setDashboardData(mockData);
        setError('Menggunakan data sample karena API tidak tersedia. Error: ' + err.message);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Warna konsisten seperti halaman monitoring
  const primaryBlue = '#0ea5e9';      // Sky blue
  const secondaryBlue = '#38bdf8';    // Lighter sky blue
  const primaryPurple = '#8b5cf6';    // Purple
  const secondaryPurple = '#a78bfa';  // Lighter purple
  const accentColor = '#f472b6';      // Pink
  const successColor = '#4ade80';     // Green
  const warningColor = '#fbbf24';     // Amber
  const errorColor = '#f87171';       // Red
  
  // Warna untuk Pie Chart 
  const PIE_COLORS = [primaryBlue, successColor];
  
  // Text dan grid colors berdasarkan tema
  const textColor = isDarkMode ? '#f3f4f6' : '#374151'; // Gray-100 : Gray-700
  const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb'; // Gray-600 : Gray-200

  // Memoize CSS classes
  const cardClass = useMemo(() => `${COMPONENT_CLASSES.card} p-6`, []);
  const titleClass = useMemo(() => `text-lg font-semibold mb-4 ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`, []);
  const headerClass = useMemo(() => `text-2xl font-semibold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`, []);
  const subtitleClass = useMemo(() => `text-sm ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`, []);
  const labelClass = useMemo(() => `${THEME_COLORS.text.muted.light} ${THEME_COLORS.text.muted.dark} text-sm uppercase ${THEME_TRANSITIONS.default}`, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-400 ${THEME_TRANSITIONS.default}`}>
        {error}
      </div>
    );
  }

  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('id-ID', { month: 'long' })} ${currentDate.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className={headerClass}>
          Dashboard Setup Request
        </h1>
        <div className={subtitleClass}>
          Data Tanggal: {formattedDate}
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className={cardClass}>
          <div className={labelClass}>Total Request Client</div>
          <div className={`mt-2 text-3xl font-bold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>{dashboardData.totalPermintaan}</div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">Unique Clients</div>
        </div>
        
        <div className={cardClass}>
          <div className={labelClass}>Top Client Request</div>
          <div className={`mt-2 text-3xl font-bold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>{dashboardData.totalMerek}</div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">Highest Request Count</div>
        </div>
        
        <div className={cardClass}>
          <div className={labelClass}>Gift Type 2</div>
          <div className={`mt-2 text-3xl font-bold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>{dashboardData.jenisPermintaan.find(item => item.name === 'Gift Type 2')?.value || 0}</div>
          <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">Type 2 Count</div>
        </div>
        
        <div className={cardClass}>
          <div className={labelClass}>Gift Type 3</div>
          <div className={`mt-2 text-3xl font-bold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>{dashboardData.jenisPermintaan.find(item => item.name === 'Gift Type 3')?.value || 0}</div>
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">Type 3 Count</div>
        </div>
        
        <div className={cardClass}>
          <div className={labelClass}>Total Setup</div>
          <div className={`mt-2 text-3xl font-bold ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>{dashboardData.totalPIC}</div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">Unique Users</div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribusi Merek Chart - menggunakan RadarChart */}
        <div className={cardClass}>
          <h2 className={titleClass}>Distribusi Brand</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: textColor }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: textColor }} />
                <Radar 
                  name="Jumlah" 
                  dataKey="A" 
                  stroke={primaryBlue} 
                  fill={primaryBlue} 
                  fillOpacity={0.6} 
                >
                  <LabelList dataKey="A" position="top" fill={textColor} />
                </Radar>
                <Tooltip formatter={(value) => [`${value} permintaan`]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Total Request berdasarkan Tipe Proses Chart */}
        <div className={cardClass}>
          <h2 className={titleClass}>Total Request berdasarkan Tipe Proses</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.detailPermintaan}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  label={{ value: 'Marketplace', position: 'insideBottomRight', offset: -10, fill: textColor }}
                  tick={{ fill: textColor }}
                />
                <YAxis 
                  label={{ value: 'Jumlah Request', angle: -90, position: 'insideLeft', fill: textColor }} 
                  tick={{ fill: textColor }}
                />
                <Tooltip formatter={(value) => [`${value} request`]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={successColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={successColor} stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <Bar 
                  dataKey="value" 
                  fill="url(#barGradient)"
                  barSize={30} 
                  animationDuration={2000}
                  label={{
                    position: 'top',
                    fill: textColor,
                    fontSize: 12
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Summary section */}
      <div className={cardClass}>
        <h2 className={titleClass}>Ringkasan Aktivitas</h2>
        <div className={`p-4 rounded-lg border ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${THEME_TRANSITIONS.default}`}>
          <p className={`mb-3 ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
            Berdasarkan data setup-request yang terekam, terdapat {dashboardData.totalPermintaan} client unik yang telah melakukan setup request,
            dengan client terbanyak melakukan {dashboardData.totalMerek} request.
            {dashboardData.distribusiMerek.length > 0 && `Client dengan request terbanyak adalah ${dashboardData.distribusiMerek[0]?.name} dengan ${dashboardData.distribusiMerek[0]?.value} request.`}
          </p>
          <p className={`mb-3 ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
            Gift Type 2: {dashboardData.jenisPermintaan.find(item => item.name === 'Gift Type 2')?.value || 0} request, 
            Gift Type 3: {dashboardData.jenisPermintaan.find(item => item.name === 'Gift Type 3')?.value || 0} request.
            Total {dashboardData.totalPIC} user unik yang telah menggunakan fitur setup-request.
          </p>
          <Link 
            to="/monitoring" 
            className={`inline-flex items-center mt-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 ${THEME_TRANSITIONS.default}`}
          >
            Lihat data lengkap di halaman monitoring
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 