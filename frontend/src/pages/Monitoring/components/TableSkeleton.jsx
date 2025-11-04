import React from 'react';

const TableSkeleton = ({ columns = 5, rows = 10 }) => {
  // Array untuk iterasi berdasarkan jumlah kolom dan baris
  const columnsArray = Array.from({ length: columns }, (_, i) => i);
  const rowsArray = Array.from({ length: rows }, (_, i) => i);
  
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Skeleton untuk TableToolbar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="flex items-center space-x-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
      
      {/* Skeleton untuk Tabel */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-50 shadow-sm">
            <div className="flex">
              <div className="w-10 px-4 py-3 border-b border-gray-200 dark:border-gray-600"></div>
              {columnsArray.map((col) => (
                <div
                  key={col}
                  className="flex-1 px-4 py-3 text-left border-b border-gray-200 dark:border-gray-600"
                >
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Body */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {rowsArray.map((row) => (
              <div 
                key={row} 
                className={`flex ${row % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/60'}`}
              >
                <div className="w-10 p-4 flex justify-center">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                {columnsArray.map((col) => (
                  <div key={col} className="flex-1 p-4 border-r border-gray-100 dark:border-gray-700">
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded" 
                      style={{ width: `${Math.floor(Math.random() * 70) + 30}%` }}
                    ></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Skeleton untuk Pagination */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between">
        <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="flex items-center space-x-4">
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton; 