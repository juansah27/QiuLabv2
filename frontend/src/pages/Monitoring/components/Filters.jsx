import React from 'react';

function Filters({ filters, setFilters, onClear }) {
  return (
    <div className="flex flex-wrap items-center mb-4">
      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2 mb-2">Filter aktif:</span>
      <div className="flex flex-wrap">
        {filters.statusInterfaced && (
          <div className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 mb-2">
            <span>Status: {filters.statusInterfaced}</span>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, statusInterfaced: null }))} 
              className="ml-1.5 text-blue-600 dark:text-blue-300 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {filters.systemId && (
          <div className="flex items-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 mb-2">
            <span>SystemId: {filters.systemId}</span>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, systemId: null }))} 
              className="ml-1.5 text-green-600 dark:text-green-300 hover:text-green-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {filters.merchantName && (
          <div className="flex items-center bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300 mb-2">
            <span>Merchant: {filters.merchantName.length > 15 ? `${filters.merchantName.slice(0, 15)}...` : filters.merchantName}</span>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, merchantName: null }))} 
              className="ml-1.5 text-yellow-600 dark:text-yellow-300 hover:text-yellow-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {filters.orderStatus && (
          <div className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300 mb-2">
            <span>Status Order: {Array.isArray(filters.orderStatus) ? 'Multiple' : filters.orderStatus}</span>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, orderStatus: null }))} 
              className="ml-1.5 text-purple-600 dark:text-purple-300 hover:text-purple-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <button 
        onClick={onClear}
        className="mt-2 w-full sm:w-auto sm:mt-0 sm:ml-auto text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors mb-2"
      >
        Hapus Semua Filter
      </button>
    </div>
  );
}

export default Filters; 