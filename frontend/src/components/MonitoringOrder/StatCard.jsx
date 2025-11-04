import React, { memo, useState, useEffect } from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

// Enhanced StatCard with animations and accessibility
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  loading = false,
  previousValue = null,
  description = null,
  trend = null,
  interactive = false,
  onClick = null,
  className = '',
  size = 'default'
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Color configuration
  const colorConfig = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:bg-green-50 dark:hover:bg-green-900/30'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:bg-red-50 dark:hover:bg-red-900/30'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
      hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/30'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30'
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-700'
    }
  };

  // Size configuration
  const sizeConfig = {
    compact: {
      card: 'p-4',
      icon: 'p-2',
      iconSize: 'w-4 h-4',
      title: 'text-xs',
      value: 'text-lg',
      spacing: 'space-x-2'
    },
    default: {
      card: 'p-6',
      icon: 'p-3',
      iconSize: 'w-6 h-6',
      title: 'text-sm',
      value: 'text-2xl',
      spacing: 'space-x-3'
    },
    large: {
      card: 'p-8',
      icon: 'p-4',
      iconSize: 'w-8 h-8',
      title: 'text-base',
      value: 'text-3xl',
      spacing: 'space-x-4'
    }
  };

  const colors = colorConfig[color] || colorConfig.blue;
  const sizes = sizeConfig[size] || sizeConfig.default;

  // Animate value changes
  useEffect(() => {
    if (loading || typeof value !== 'number') return;

    const startValue = animatedValue;
    const endValue = value;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, loading]);

  // Calculate trend information
  const trendInfo = previousValue !== null && typeof value === 'number' && typeof previousValue === 'number' 
    ? {
        percentage: previousValue === 0 ? 100 : ((value - previousValue) / previousValue * 100),
        isPositive: value >= previousValue,
        difference: value - previousValue
      }
    : null;

  // Format display value
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  // Handle click
  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (event) => {
    if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        rounded-xl 
        border border-gray-200 dark:border-gray-700 
        ${sizes.card} 
        shadow-sm 
        transition-all duration-300 ease-in-out
        ${interactive ? `${colors.hover} cursor-pointer transform hover:scale-105 hover:shadow-md` : ''}
        ${isHovered ? 'shadow-lg' : ''}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? 'button' : 'presentation'}
      aria-label={interactive ? `${title}: ${formatValue(value)}` : undefined}
    >
      <div className={`flex items-center ${sizes.spacing}`}>
        {/* Icon Container */}
        <div className={`${colors.bg} ${sizes.icon} rounded-lg transition-all duration-300 ${
          isHovered && interactive ? 'transform rotate-3 scale-110' : ''
        }`}>
          {Icon && (
            <Icon className={`${sizes.iconSize} ${colors.text} transition-all duration-300 ${
              isHovered && interactive ? 'animate-pulse' : ''
            }`} />
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          {/* Title with optional tooltip */}
          <div className="flex items-center space-x-1">
            <p className={`${sizes.title} font-medium text-gray-600 dark:text-gray-400 truncate`}>
              {title}
            </p>
            {description && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="More information"
                >
                  <InformationCircleIcon className="w-4 h-4" />
                </button>
                {showTooltip && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      {description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Value Display */}
          <div className="flex items-baseline space-x-2">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-20" />
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className={`${sizes.value} font-bold text-gray-900 dark:text-white transition-all duration-300 ${
                  isHovered && interactive ? 'text-blue-600 dark:text-blue-400' : ''
                }`}>
                  {formatValue(animatedValue)}
                </p>
                
                {/* Trend indicator */}
                {(trend || trendInfo) && (
                  <div className="flex items-center space-x-1">
                    {trend === 'up' || (trendInfo?.isPositive && trendInfo?.difference !== 0) ? (
                      <TrendingUpIcon className="w-4 h-4 text-green-500" />
                    ) : trend === 'down' || (trendInfo && !trendInfo.isPositive) ? (
                      <TrendingDownIcon className="w-4 h-4 text-red-500" />
                    ) : null}
                    
                    {trendInfo && (
                      <span className={`text-xs font-medium ${
                        trendInfo.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {trendInfo.percentage > 0 ? '+' : ''}{trendInfo.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Additional info */}
          {previousValue !== null && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Previous: {formatValue(previousValue)}
            </p>
          )}
        </div>

        {/* Interactive indicator */}
        {interactive && (
          <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <svg 
              className="w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 ${colors.bg.replace('bg-', 'bg-').split(' ')[0]} rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Stats cards grid wrapper
export const StatsGrid = memo(({ 
  children, 
  columns = 'auto',
  gap = 6,
  className = '' 
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={`grid ${columnClasses[columns] || columnClasses.auto} ${gapClasses[gap] || gapClasses[6]} ${className}`}>
      {children}
    </div>
  );
});

// Multiple stats cards with consistent animation timing
export const AnimatedStatsGrid = memo(({ stats, loading = false, ...props }) => {
  return (
    <StatsGrid {...props}>
      {stats.map((stat, index) => (
        <div
          key={stat.id || index}
          style={{ 
            animationDelay: `${index * 100}ms`,
            animation: loading ? 'none' : 'fadeInUp 0.6s ease-out forwards'
          }}
          className="opacity-0"
        >
          <StatCard {...stat} loading={loading} />
        </div>
      ))}
    </StatsGrid>
  );
});

// Add CSS for animations
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

StatCard.displayName = 'StatCard';
StatsGrid.displayName = 'StatsGrid';
AnimatedStatsGrid.displayName = 'AnimatedStatsGrid';

export default StatCard;