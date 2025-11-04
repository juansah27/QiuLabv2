import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../../config';

const DatabaseConfig = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({
    server: '',
    database: '',
    username: '',
    useMockData: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(null);

  // Fungsi untuk membuka dialog
  const handleOpen = () => {
    setOpen(true);
    loadConfig();
  };

  // Fungsi untuk menutup dialog
  const handleClose = () => {
    setOpen(false);
    setIsError(null);
  };

  // Load konfigurasi saat ini
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setIsError(null);
      
      const apiUrl = getApiUrl();
      const response = await axios.get(
        `${apiUrl}/query/database-config`,
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          timeout: 5000 // Timeout setelah 5 detik
        }
      );
      
      if (response.data.status === 'success') {
        setConfig({
          server: response.data.config.server || '',
          database: response.data.config.database || '',
          username: response.data.config.username || '',
          useMockData: response.data.config.use_sqlite_for_testing || false
        });
      } else {
        setIsError(response.data.error || 'Gagal memuat konfigurasi');
        // Tetap gunakan nilai default
        setConfig({
          server: 'localhost',
          database: 'master',
          username: 'sa',
          useMockData: true
        });
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setIsError('Gagal memuat konfigurasi. Menggunakan nilai default.');
      
      // Gunakan nilai default jika terjadi error
      setConfig({
        server: 'localhost',
        database: 'master',
        username: 'sa',
        useMockData: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className="inline-flex items-center px-3 py-1 text-sm border border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={handleOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Info Database
      </button>

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Dialog Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                Informasi Koneksi Database
              </h3>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {isError && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300 dark:border-red-600">
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isError}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Server</p>
                      <p className="text-gray-800 dark:text-white break-all">{config.server}</p>
                    </div>
                    
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Database</p>
                      <p className="text-gray-800 dark:text-white break-all">{config.database}</p>
                    </div>
                    
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Username</p>
                      <p className="text-gray-800 dark:text-white break-all">{config.username}</p>
                    </div>
                    
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mode Data</p>
                      <p className="text-gray-800 dark:text-white">
                        {config.useMockData ? 'Data Simulasi (SQLite)' : 'SQL Server'}
                      </p>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Halaman ini hanya untuk monitoring. Hubungi administrator untuk mengubah konfigurasi database.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Dialog Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatabaseConfig; 