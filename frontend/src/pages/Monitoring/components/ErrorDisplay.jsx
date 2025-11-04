import React from 'react';

function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mt-4">
      <div className="flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
          <p className="mb-4">{error.toString()}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay; 