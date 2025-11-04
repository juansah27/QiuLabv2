import React, { memo } from 'react';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Sophisticated loading spinner with multiple variants
export const LoadingSpinner = memo(({ 
  size = 'md', 
  color = 'blue', 
  variant = 'spin',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    red: 'border-red-500',
    gray: 'border-gray-500'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} rounded-full bg-${color}-500 animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-${color}-500 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className={`h-full w-full rounded-full border-2 border-t-transparent ${colorClasses[color]} animate-spin`} />
    </div>
  );
});

// Skeleton loader for cards
export const CardSkeleton = memo(({ isDarkMode, count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
    {Array.from({ length: count }).map((_, index) => (
      <div 
        key={index}
        className={`${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-xl p-6 shadow-sm animate-pulse`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div className="w-6 h-6 bg-gray-400 rounded" />
          </div>
          <div className="flex-1">
            <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-2`} />
            <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-20`} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

// Skeleton loader for charts
export const ChartSkeleton = memo(({ isDarkMode, height = 450 }) => (
  <div 
    className={`${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-xl p-6 shadow-sm animate-pulse`}
    style={{ height: height + 100 }}
  >
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div className="w-5 h-5 bg-gray-400 rounded" />
        </div>
        <div>
          <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-2 w-48`} />
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-32`} />
        </div>
      </div>
      <div className={`h-8 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-32`} />
    </div>
    
    {/* Chart area skeleton */}
    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg`} style={{ height }}>
      <div className="p-4 h-full flex items-end justify-center space-x-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-t animate-pulse`}
            style={{
              width: '20px',
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 200}ms`
            }}
          />
        ))}
      </div>
    </div>
  </div>
));

// Full page loading state
export const PageLoadingState = memo(({ isDarkMode, message = "Loading Dashboard" }) => (
  <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative mb-8">
            <LoadingSpinner size="xl" color="blue" className="mx-auto" />
            <div className="absolute inset-0 animate-ping">
              <LoadingSpinner size="xl" color="blue" variant="pulse" className="mx-auto opacity-20" />
            </div>
          </div>
          <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            {message}
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-pulse`}>
            Please wait while we fetch your data...
          </p>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

// Error state component
export const ErrorState = memo(({ 
  isDarkMode, 
  error, 
  onRetry, 
  retryCount = 0,
  maxRetries = 3 
}) => (
  <div className={`${
    isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
  } border rounded-xl p-6 mb-6`}>
    <div className="flex items-start space-x-3">
      <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-red-200' : 'text-red-800'
        } mb-2`}>
          Failed to Load Data
        </h3>
        <p className={`${isDarkMode ? 'text-red-300' : 'text-red-700'} mb-4`}>
          {error || 'An unexpected error occurred while loading the dashboard data.'}
        </p>
        
        {retryCount > 0 && (
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-4`}>
            Retry attempts: {retryCount}/{maxRetries}
          </p>
        )}
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onRetry}
            disabled={retryCount >= maxRetries}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              retryCount >= maxRetries 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>{retryCount >= maxRetries ? 'Max Retries Reached' : 'Try Again'}</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  </div>
));

// Warning state component
export const WarningState = memo(({ 
  isDarkMode, 
  message, 
  action,
  actionLabel = "Dismiss"
}) => (
  <div className={`${
    isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
  } border rounded-xl p-4 mb-6`}>
    <div className="flex items-start space-x-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className={`${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
          {message}
        </p>
      </div>
      {action && (
        <button
          onClick={action}
          className={`text-sm font-medium ${
            isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-700 hover:text-yellow-600'
          } transition-colors`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
));

// Success state component
export const SuccessState = memo(({ 
  isDarkMode, 
  message, 
  action,
  actionLabel = "Dismiss",
  autoHide = true,
  duration = 5000
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!visible) return null;

  return (
    <div className={`${
      isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
    } border rounded-xl p-4 mb-6 transition-all duration-300`}>
      <div className="flex items-start space-x-3">
        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className={`${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
            {message}
          </p>
        </div>
        {action && (
          <button
            onClick={action}
            className={`text-sm font-medium ${
              isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-600'
            } transition-colors`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
});

// Info state component
export const InfoState = memo(({ 
  isDarkMode, 
  message, 
  action,
  actionLabel = "Learn More"
}) => (
  <div className={`${
    isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
  } border rounded-xl p-4 mb-6`}>
    <div className="flex items-start space-x-3">
      <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          {message}
        </p>
      </div>
      {action && (
        <button
          onClick={action}
          className={`text-sm font-medium ${
            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-600'
          } transition-colors`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
));

// Combined loading state for dashboard
export const DashboardLoadingState = memo(({ isDarkMode }) => (
  <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
    <div className="max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`h-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded mb-2 w-80 animate-pulse`} />
            <div className={`h-5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded w-64 animate-pulse`} />
          </div>
          <div className={`h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded w-24 animate-pulse`} />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className={`${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border rounded-xl p-6 shadow-sm mb-6 animate-pulse`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-2 w-20`} />
              <div className={`h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards skeleton */}
      <CardSkeleton isDarkMode={isDarkMode} />

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
        <div className="lg:col-span-7">
          <ChartSkeleton isDarkMode={isDarkMode} height={500} />
        </div>
        <div className="lg:col-span-3">
          <ChartSkeleton isDarkMode={isDarkMode} height={500} />
        </div>
      </div>
      
      <ChartSkeleton isDarkMode={isDarkMode} height={400} />
    </div>
  </div>
));

// Set display names
LoadingSpinner.displayName = 'LoadingSpinner';
CardSkeleton.displayName = 'CardSkeleton';
ChartSkeleton.displayName = 'ChartSkeleton';
PageLoadingState.displayName = 'PageLoadingState';
ErrorState.displayName = 'ErrorState';
WarningState.displayName = 'WarningState';
SuccessState.displayName = 'SuccessState';
InfoState.displayName = 'InfoState';
DashboardLoadingState.displayName = 'DashboardLoadingState';

export default {
  LoadingSpinner,
  CardSkeleton,
  ChartSkeleton,
  PageLoadingState,
  ErrorState,
  WarningState,
  SuccessState,
  InfoState,
  DashboardLoadingState
};