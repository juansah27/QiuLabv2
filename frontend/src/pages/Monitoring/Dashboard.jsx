import React, { useState, useEffect, useRef, useCallback } from 'react';
import StatsCard from './components/StatsCard';
import { normalizeStatusName, getStatusGroups } from '../../config/statusGroups';



const Dashboard = () => {
  const [data, setData] = useState([]); 
  const [remarkStats, setRemarkStats] = useState(() => {
    const stats = { 'N/A': 0 };
    getStatusGroups().forEach(groupName => {
      stats[groupName] = 0;
    });
    return stats;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fungsi untuk mendapatkan nilai remark dari localStorage jika tersedia
  const getRemarkValue = (rowData, columnId) => {
    try {
      // Periksa localStorage untuk remark yang diedit
      const savedRemarks = localStorage.getItem('table_remarks');
      if (savedRemarks) {
        const remarkData = JSON.parse(savedRemarks);
        const rowKey = JSON.stringify(rowData);
        
        if (remarkData[rowKey] && remarkData[rowKey][columnId] !== undefined) {
          return remarkData[rowKey][columnId];
        }
      }
    } catch (error) {
      console.error('Error saat membaca remark dari localStorage:', error);
    }
    
    // Kembalikan nilai asli jika tidak ada di localStorage
    return rowData[columnId];
  };
  
  // Fungsi untuk mengambil data dari API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ambil data dari session storage jika ada (untuk demo)
      const savedData = sessionStorage.getItem('monitoringData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log('Menggunakan data dari session storage:', parsedData.length);
           
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setData(parsedData);
            return;
          } else {
            console.warn('Data dari session storage bukan array valid');
          }
        } catch (e) {
          console.error('Error parsing data dari session storage:', e);
        }
      }
      
      // Generate data dummy untuk testing
      const dummyData = Array.from({ length: 100 }, (_, i) => ({
        SystemRefId: `ORDER${1000 + i}`,
        SystemId: `SYS${i % 3 + 1}`,
        MerchantName: `Merchant ${i % 5 + 1}`,
        OrderStatus: i % 4 === 0 ? 'COMPLETED' : i % 4 === 1 ? 'PENDING' : i % 4 === 2 ? 'CANCELLED' : 'IN_PROCESS',
        Remark: i % 5 === 0 ? 'Pending Verifikasi' : i % 5 === 1 ? 'Cancel' : i % 5 === 2 ? 'IN_Cancel' : null,
        Status_Interfaced: i % 3 === 0 ? 'Success' : 'Failed',
        Interfaced: i % 3 === 0 ? 'Yes' : 'No',
        Status_SC: i % 2 === 0 ? 'Pending Verifikasi' : 'Follow Up!',
        Status_Durasi: i % 2 === 0 ? 'Kurang Dari 1 jam' : 'Lebih Dari 1 jam',
        OrderDate: new Date(Date.now() - i * 86400000).toISOString(),
        Awb: `AWB${100000 + i}`,
        ItemIds: `ITEM${i},ITEM${i+1}`,
        DeliveryMode: i % 2 === 0 ? 'Regular' : 'Express',
        DtmCrt: new Date(Date.now() - i * 86400000).toISOString(),
        Origin: i % 2 === 0 ? 'Flexofast-TGR' : 'Flexofast-SBY',
        ADDDATE: new Date(Date.now() - i * 86400000).toISOString(),
        FULFILLEDBYFLEXO: i % 2 === 0 ? 'Yes' : 'No'
      }));
      
      console.log('Menggunakan data dummy:', dummyData.length);
      console.log('Sample data:', dummyData.slice(0, 2));
      setData(dummyData);
      
      // Menghitung statistik untuk kartu
      const stats = { 'N/A': 0 };
      getStatusGroups().forEach(groupName => {
        stats[groupName] = 0;
      });
      
      dummyData.forEach(row => {
        const normalizedRemark = normalizeStatusName(row.Remark);
        if (getStatusGroups().includes(normalizedRemark)) {
          stats[normalizedRemark]++;
        } else if (normalizedRemark === 'NULL') {
          stats['N/A']++;
        }
      });
      
      setRemarkStats(stats);
      
      // Simpan data dummy ke session storage
      sessionStorage.setItem('monitoringData', JSON.stringify(dummyData));
    } catch (err) {
      console.error('Error fetchData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Panggil fetchData saat komponen di-mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Menghitung jumlah data dengan Interfaced = 'No'
  const countNotInterfaced = useCallback(() => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return data.filter(row => row.Interfaced === 'No').length;
  }, [data]);
  
  // Function untuk menangani perubahan data
  const handleDataChange = (newData) => {
    console.log('Dashboard: handleDataChange called with data length:', newData?.length);
    setData(newData);
    
    // Hitung statistik Remark
    const stats = { 'N/A': 0 };
    getStatusGroups().forEach(groupName => {
      stats[groupName] = 0;
    });
    
    if (Array.isArray(newData)) {
      newData.forEach(row => {
        // Gunakan getRemarkValue untuk membaca nilai yang bisa jadi telah diedit
        const remarkValue = getRemarkValue(row, 'Remark');
        const normalizedRemark = normalizeStatusName(remarkValue);
        
        if (getStatusGroups().includes(normalizedRemark)) {
          stats[normalizedRemark]++;
        } else if (normalizedRemark === 'NULL') {
          stats['N/A']++;
        }
      });
    } else {
      console.error('Dashboard: handleDataChange received non-array data:', newData);
    }
    
    console.log('Dashboard: Stats calculated:', stats);
    setRemarkStats(stats);
  };
  
  // Perbarui statistik saat data berubah atau saat localStorage berubah
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Hitung ulang statistik remark dengan nilai dari localStorage
      const stats = { 'N/A': 0 };
      getStatusGroups().forEach(groupName => {
        stats[groupName] = 0;
      });
      
              data.forEach(row => {
          const remarkValue = getRemarkValue(row, 'Remark');
          const normalizedRemark = normalizeStatusName(remarkValue);
          
          if (getStatusGroups().includes(normalizedRemark)) {
            stats[normalizedRemark]++;
          } else if (normalizedRemark === 'NULL') {
            stats['N/A']++;
          }
        });
      
      setRemarkStats(stats);
    }
  }, [data]);
  
  // Juga perbarui saat localStorage berubah (dengan menggunakan event listener)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'table_remarks') {
        // Jika localStorage berubah, perbarui statistik
        if (Array.isArray(data) && data.length > 0) {
          const stats = {
            'Pending Verifikasi': 0,
            'Cancel': 0,
            'IN_Cancel': 0,
            'N/A': 0
          };
          
          data.forEach(row => {
            const remarkValue = getRemarkValue(row, 'Remark');
            
            if (remarkValue === 'Pending Verifikasi') {
              stats['Pending Verifikasi']++;
            } else if (remarkValue === 'Cancel') {
              stats['Cancel']++;
            } else if (remarkValue === 'IN_Cancel') {
              stats['IN_Cancel']++;
            } else if (remarkValue === null || remarkValue === undefined || remarkValue === '') {
              stats['N/A']++;
            }
          });
          
          setRemarkStats(stats);
        }
      }
    };
    
    // Tambahkan event listener untuk storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [data]);
  
  // Render komponen Dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dashboard Monitoring</h1>
        <button 
          onClick={() => {
            sessionStorage.removeItem('monitoringData');
            fetchData();
          }}
          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium"
        >
          Reset Data
        </button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pending Verifikasi"
          count={remarkStats['Pending Verifikasi']}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
          }
          colorClass="bg-yellow-50 dark:bg-yellow-900/20"
          textColorClass="text-yellow-600 dark:text-yellow-400"
        />
        <StatsCard
          title="Cancel"
          count={remarkStats['Cancel']}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
          }
          colorClass="bg-red-50 dark:bg-red-900/20"
          textColorClass="text-red-600 dark:text-red-400"
        />
        <StatsCard
          title="IN_Cancel"
          count={remarkStats['IN_Cancel']}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
          }
          colorClass="bg-orange-50 dark:bg-orange-900/20"
          textColorClass="text-orange-600 dark:text-orange-400"
        />
        <StatsCard
          title="N/A (Tanpa Remark)"
          count={remarkStats['N/A']}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
          }
          colorClass="bg-gray-50 dark:bg-gray-800"
          textColorClass="text-gray-600 dark:text-gray-400"
        />
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error:</h3>
              <div className="mt-1 text-sm">{error}</div>
              <button 
                onClick={fetchData}
                className="mt-2 px-3 py-1 text-xs bg-red-200 hover:bg-red-300 text-red-800 rounded"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tambahkan pesan informasi di tempat tabel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Tampilan Tabel Dihapus</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Tabel monitoring telah dihapus sesuai permintaan. Anda masih dapat melihat ringkasan data pada kartu statistik di atas.
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard; 