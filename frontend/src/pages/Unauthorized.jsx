import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../utils/pageTitle';

const Unauthorized = () => {
  const { user } = useAuth();
  
  // Menambahkan judul halaman
  usePageTitle('Unauthorized Access');
  
  // Debug info
  console.log('Unauthorized page - User:', user);
  console.log('Unauthorized page - User role:', user?.role);
  console.log('Unauthorized page - Is admin:', user?.is_admin);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold text-red-600 dark:text-red-500">Akses Ditolak</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          
          {/* Debug info for development */}
          {import.meta.env.DEV && user && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-left text-sm">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Debug Info:</h3>
              <pre className="mt-1 text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                {JSON.stringify({
                  username: user.username,
                  email: user.email,
                  role: user.role,
                  isAdmin: user.is_admin
                }, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              to="/"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Kembali ke Beranda
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 