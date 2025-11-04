import React from 'react';

const LoadingState = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${Math.random() * 100 + 100}px` }} />
        ))}
      </div>

      {/* Rows Skeleton */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                style={{ width: `${Math.random() * 100 + 100}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState; 