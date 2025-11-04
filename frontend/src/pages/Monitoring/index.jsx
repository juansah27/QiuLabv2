import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import '../../styles/charts.css';

const Monitoring = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Ambil Order
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Delay untuk simulasi loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch data dari API mock
        const response = await axios.get(`${getApiUrl()}/api/monitoring/transactions`);
        setTransactionData(response.data);
      } catch (err) {
        console.error('Error fetching transaction data:', err);
        setError(err.message || 'Failed to fetch transaction data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handler untuk refresh data
  const handleRefreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      notification.id = 'loading-notification';
      notification.textContent = 'Memuat ulang data...';
      document.body.appendChild(notification);
      
      // Delay untuk simulasi loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch data dari API mock
      const response = await axios.get(`${getApiUrl()}/api/monitoring/transactions`);
      setTransactionData(response.data);
      
      // Hapus notifikasi loading
      if (document.getElementById('loading-notification')) {
        document.body.removeChild(document.getElementById('loading-notification'));
      }
      
      // Tampilkan notifikasi sukses
      const successNotif = document.createElement('div');
      successNotif.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successNotif.id = 'success-notification';
      successNotif.textContent = 'Data berhasil dimuat ulang';
      document.body.appendChild(successNotif);
      
      // Hapus notifikasi setelah 3 detik
      setTimeout(() => {
        if (document.getElementById('success-notification')) {
          document.body.removeChild(document.getElementById('success-notification'));
        }
      }, 3000);
      
      return true;
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err.message || 'Failed to refresh transaction data');
      
      // Hapus notifikasi loading jika masih ada
      if (document.getElementById('loading-notification')) {
        document.body.removeChild(document.getElementById('loading-notification'));
      }
      
      // Tampilkan notifikasi error
      const errorNotif = document.createElement('div');
      errorNotif.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorNotif.id = 'error-notification';
      errorNotif.textContent = 'Gagal memuat ulang data';
      document.body.appendChild(errorNotif);
      
      // Hapus notifikasi error setelah 3 detik
      setTimeout(() => {
        if (document.getElementById('error-notification')) {
          document.body.removeChild(document.getElementById('error-notification'));
        }
      }, 3000);
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler untuk view full dashboard
  const handleViewFullDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Function to add notification
  const addNotification = useCallback((message, type = 'info') => {
    // Buat ID unik untuk notifikasi
    const id = Date.now();
    
    // Tambahkan notifikasi baru ke state
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Hapus notifikasi setelah 3 detik
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  }, []);

  // Render Dashboard
  const renderDashboard = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-64">Loading transaction data...</div>;
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 mb-4">Error loading transaction data: {error}</p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleRefreshData}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!transactionData) {
      return <div className="flex justify-center items-center h-64">No Order available</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Order Summary</h3>
          <p>Total Orders: {transactionData.totalTransactions}</p>
          <p>Successful: {transactionData.successfulTransactions}</p>
          <p>Failed: {transactionData.failedTransactions}</p>
          <p>Pending: {transactionData.pendingTransactions || 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Order Velocity</h3>
          <p>Orders per minute: {transactionData.transactionsPerMinute}</p>
          <p>Average processing time: {transactionData.averageProcessingTime}ms</p>
          <p>Peak time: {transactionData.peakTime || 'N/A'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-0 py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transaction Monitoring</h2>
        <div className="flex space-x-4">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Order'}
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleViewFullDashboard}
          >
            View Full Dashboard
          </button>
        </div>
      </div>

      {renderDashboard()}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`mb-2 px-4 py-2 rounded-lg shadow-lg ${
              notif.type === 'success' ? 'bg-green-500' : 
              notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white`}
          >
            {notif.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Monitoring; 