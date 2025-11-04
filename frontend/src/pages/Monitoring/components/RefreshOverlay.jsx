import React from 'react';
import { LoadingIcon } from '../icons/TableIcons';

/**
 * Komponen overlay untuk menampilkan animasi refreshing data
 * @param {boolean} visible - Apakah overlay ditampilkan
 * @param {string} message - Pesan yang ditampilkan (opsional)
 */
const RefreshOverlay = ({ 
  visible,
  message = 'Memuat data...'
}) => {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-800/80 z-50 flex items-center justify-center backdrop-blur-sm transition-all animate-fadeIn">
      <div className="flex flex-col items-center bg-white dark:bg-gray-700 px-6 py-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
        <LoadingIcon className="h-10 w-10 text-blue-500 mb-3" />
        <span className="text-gray-700 dark:text-gray-200 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default RefreshOverlay; 