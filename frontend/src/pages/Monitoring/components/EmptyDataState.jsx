import React from 'react';
import { RefreshIcon } from '../icons/TableIcons';

const EmptyDataState = ({ 
  message = "Tidak ada data untuk ditampilkan", 
  subMessage = "Silakan refresh atau ubah filter untuk melihat data",
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <div className="p-8 text-center">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
        />
      </svg>
      <p className="text-gray-600 dark:text-gray-300 text-lg">
        {message}
      </p>
      {subMessage && (
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {subMessage}
        </p>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150"
          disabled={isRefreshing}
        >
          <RefreshIcon className={`h-4 w-4 inline-block mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      )}
    </div>
  );
};

export default EmptyDataState; 