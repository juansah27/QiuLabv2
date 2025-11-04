import React, { memo, useState, useCallback, useMemo } from 'react';
import { 
  FunnelIcon, 
  CalendarIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Enhanced FilterSection with better UX and mobile responsiveness
const FilterSection = memo(({ 
  filters, 
  setFilters, 
  brands, 
  marketplaces, 
  loading = false,
  onClear = null,
  className = '',
  showAdvanced = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerms, setSearchTerms] = useState({
    brand: '',
    marketplace: ''
  });

  // Filter options with search functionality
  const filteredBrands = useMemo(() => {
    if (!searchTerms.brand) return brands;
    return brands.filter(brand => 
      brand.toLowerCase().includes(searchTerms.brand.toLowerCase())
    );
  }, [brands, searchTerms.brand]);

  const filteredMarketplaces = useMemo(() => {
    if (!searchTerms.marketplace) return marketplaces;
    return marketplaces.filter(marketplace => 
      marketplace.toLowerCase().includes(searchTerms.marketplace.toLowerCase())
    );
  }, [marketplaces, searchTerms.marketplace]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(filter => filter !== '');
  }, [filters]);

  // Handle filter updates
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, [setFilters]);

  // Handle clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      brand: '',
      marketplace: ''
    });
    setSearchTerms({ brand: '', marketplace: '' });
    if (onClear) onClear();
  }, [setFilters, onClear]);

  // Handle dropdown toggle
  const toggleDropdown = useCallback((dropdown) => {
    setActiveDropdown(prev => prev === dropdown ? null : dropdown);
  }, []);

  // Close dropdown when clicking outside
  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  // Enhanced date input with validation
  const DateRangeInput = memo(({ startDate, endDate, onChange, disabled }) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <CalendarIcon className="w-4 h-4 inline mr-2" />
        Date Range
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 ${
              disabled 
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50' 
                : 'bg-white dark:bg-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-200 ${
              disabled 
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50' 
                : 'bg-white dark:bg-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            } border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
          />
        </div>
      </div>
    </div>
  ));

  // Enhanced dropdown with search
  const SearchableDropdown = memo(({ 
    label, 
    value, 
    options, 
    onChange, 
    placeholder, 
    searchTerm, 
    onSearchChange,
    disabled = false,
    dropdownKey 
  }) => {
    const isOpen = activeDropdown === dropdownKey;
    
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <button
          type="button"
          onClick={() => !disabled && toggleDropdown(dropdownKey)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between transition-all duration-200 ${
            disabled 
              ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-gray-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 dark:border-gray-600'} text-gray-900 dark:text-white`}
        >
          <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
            {value || placeholder}
          </span>
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={closeDropdown}
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {/* Search input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-40 overflow-y-auto">
                {/* Clear option */}
                <button
                  onClick={() => {
                    onChange('');
                    closeDropdown();
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                    <span>Clear selection</span>
                  </div>
                </button>
                
                {/* Options list */}
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onChange(option);
                        closeDropdown();
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-white"
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {value === option && (
                          <CheckIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No {label.toLowerCase()} found
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilters ? 'Active filters applied' : 'No filters applied'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${
              isExpanded ? 'transform rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`transition-all duration-300 overflow-hidden ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-6 space-y-6">
          {/* Date Range */}
          <DateRangeInput
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={updateFilter}
            disabled={loading}
          />

          {/* Brand and Marketplace Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableDropdown
              label="Brand"
              value={filters.brand}
              options={filteredBrands}
              onChange={(value) => updateFilter('brand', value)}
              placeholder="All Brands"
              searchTerm={searchTerms.brand}
              onSearchChange={(term) => setSearchTerms(prev => ({ ...prev, brand: term }))}
              disabled={loading}
              dropdownKey="brand"
            />

            <SearchableDropdown
              label="Marketplace"
              value={filters.marketplace}
              options={filteredMarketplaces}
              onChange={(value) => updateFilter('marketplace', value)}
              placeholder="All Marketplaces"
              searchTerm={searchTerms.marketplace}
              onSearchChange={(term) => setSearchTerms(prev => ({ ...prev, marketplace: term }))}
              disabled={loading}
              dropdownKey="marketplace"
            />
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Active Filters:
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.startDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                    Start: {new Date(filters.startDate).toLocaleDateString()}
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                    End: {new Date(filters.endDate).toLocaleDateString()}
                  </span>
                )}
                {filters.brand && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200">
                    Brand: {filters.brand}
                  </span>
                )}
                {filters.marketplace && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
                    Marketplace: {filters.marketplace}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Applying filters...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Set display names
DateRangeInput.displayName = 'DateRangeInput';
SearchableDropdown.displayName = 'SearchableDropdown';
FilterSection.displayName = 'FilterSection';

export default FilterSection;