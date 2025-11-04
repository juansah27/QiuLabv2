import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { CSVLink } from 'react-csv';
import { useTheme } from '../../../contexts/ThemeContext';
import { ExportIcon, FilterIcon, SearchIcon, ColumnsIcon, DensityIcon, RefreshIcon, ExpandIcon, CollapseIcon, CopyIcon, EyeOffIcon, LightBulbIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon, DocumentIcon, CodeIcon } from '../icons/TableIcons';
import ExpandedRowDetails from './ExpandedRowDetails';
import EmptyDataState from './EmptyDataState';
import TableSkeleton from './TableSkeleton';
import RefreshOverlay from './RefreshOverlay';
import { exportToExcel, exportToXLSX } from '../../../utils/exportUtils';
import { toast } from 'react-toastify';
import { BiFilterAlt, BiX, BiCheck, BiSearch, BiCopy } from 'react-icons/bi';
import numeral from 'numeral';
import { getRemarkValue } from '../hooks/useMonitoring';
import { normalizeStatusName } from '../../../config/statusGroups';
import AdvancedFilter from './AdvancedFilter';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { LoadingIcon } from '../icons/TableIcons';



// Definisikan animasi fade-in dan animasi lainnya di awal file sebagai CSS keyframes
const animations = {
  '@keyframes fadeIn': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
  },
  '@keyframes slideInUp': {
    '0%': { transform: 'translateY(10px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 }
  },
  fadeIn: 'fadeIn 0.3s ease-in-out',
  slideInUp: 'slideInUp 0.3s ease-out'
};

// Konstanta untuk mode tampilan densitas
const DENSITY_OPTIONS = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
  SPACIOUS: 'spacious'
};

// Definisikan urutan kolom yang diinginkan sesuai dengan hasil query
const COLUMN_ORDER = [
  "SystemId",
  "MerchantName",
  "SystemRefId",
  "Remark",
  "Batch",
  "Issue",
  "OrderStatus",
  "Awb",
  "Status Interfaced",
  "Status SC",
  "Status Durasi",
  "ItemIds",
  "OrderDate",
  "DtmCrt",
  "DeliveryMode",
  "importlog",
  "FulfilledByFlexo",
  "AddDate",
  "Origin"
];

// Opsi default untuk Remark dengan warna
const DEFAULT_REMARK_OPTIONS = {
  'Pending Verifikasi': {
    value: 'Pending Verifikasi',
    color: 'bg-yellow-100 text-yellow-800 border border-yellow-300'
  },
  'IN_Cancel': {
    value: 'IN_Cancel',
    color: 'bg-red-100 text-red-800 border border-red-300'
  },
  'Cancel': {
    value: 'Cancel',
    color: 'bg-red-100 text-red-800 border border-red-300'
  },
  'Pengiriman Kilat': {
    value: 'Pengiriman Kilat',
    color: 'bg-green-100 text-green-800 border border-green-300'
  }
};

// Fungsi utilitas untuk membersihkan SystemRefId secara konsisten
const cleanSystemRefId = (id) => {
  if (!id) return id;
  
  // Konversi ke string jika bukan string
  const idStr = String(id);
  
  // Log sebelum pembersihan untuk debugging
  if (idStr.match(/\s/) || idStr.includes(' ')) {
    console.log('SystemRefId dengan spasi terdeteksi:', {
      original: idStr,
      'panjang asli': idStr.length,
      'kode karakter': Array.from(idStr).map(c => c.charCodeAt(0))
    });
  }
  
  // Metode lebih ketat:
  // 1. Hapus semua whitespace (spasi, tab, baris baru, dll) dengan regex \s+
  // 2. Hapus lagi spasi eksplisit untuk jaga-jaga 
  // 3. Hapus karakter kontrol dan formatting (kategori Unicode Cc dan Cf)
  const cleaned = idStr
    .replace(/\s+/g, '')         // Hapus semua whitespace (\n, \t, spasi, dll)
    .replace(/ /g, '')           // Hapus spasi eksplisit lagi
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, ''); // Hapus karakter kontrol dan formatting
  
  // Log setelah pembersihan jika ada perubahan
  if (cleaned !== idStr) {
    console.log('SystemRefId setelah pembersihan:', {
      cleaned: cleaned,
      'panjang baru': cleaned.length,
      'kode karakter baru': Array.from(cleaned).map(c => c.charCodeAt(0))
    });
  }
  
  return cleaned;
};

// Konfigurasi performa
const PERFORMANCE_CONFIG = {
  ROW_HEIGHT: 48,
  OVERSCAN_COUNT: 5,
  CHUNK_SIZE: 50,
  DEBOUNCE_DELAY: 300,
  CACHE_SIZE: 100
};

const TableResults = ({ 
  data: initialData, 
  totalCount, 
  filteredCount, 
  page: externalPage, 
  rowsPerPage: externalRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onDataChange,
  onRefresh,
  onExposeFunctions,
  onFilterChange,
  isLoading = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const listRef = useRef(null);
  const [visibleColumns, setVisibleColumns] = useState(COLUMN_ORDER.filter(col => !hiddenColumns.includes(col)));
  const [loadedData, setLoadedData] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [rowCache, setRowCache] = useState(new Map());
  const [scrollPosition, setScrollPosition] = useState(0);

  // Cache untuk hasil filter
  const filterCache = useRef(new Map());
  const lastFilterKey = useRef('');

  // Memoize data processing
  const processedData = useMemo(() => {
    return initialData.map(row => ({
      ...row,
      SystemRefId: cleanSystemRefId(row.SystemRefId),
      Remark: row.Remark || null
    }));
  }, [initialData]);

  // Lazy loading dengan chunking
  const loadMoreData = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const currentLength = loadedData.length;
    const nextData = processedData.slice(currentLength, currentLength + 50);

    if (nextData.length === 0) {
      setHasMore(false);
    } else {
      setLoadedData(prev => [...prev, ...nextData]);
    }

    setIsLoadingMore(false);
  }, [processedData, isLoadingMore, hasMore]);

  // Initial data load
  useEffect(() => {
    setLoadedData(processedData.slice(0, 50));
    setHasMore(processedData.length > 50);
  }, [processedData]);

  // Cache row rendering
  const renderRow = useCallback(({ index, style }) => {
    const row = loadedData[index];
    if (!row) return null;

    // Cek cache
    const cacheKey = `${row.SystemRefId}-${index}`;
    if (rowCache.has(cacheKey)) {
      return rowCache.get(cacheKey);
    }

    const renderedRow = (
      <div style={style} className={`flex items-center border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {visibleColumns.map((column, colIndex) => (
          <div
            key={column.id}
            className={`px-4 py-2 ${column.className || ''}`}
            style={{ width: column.width || 'auto' }}
          >
            {column.render ? column.render(row) : row[column.id]}
          </div>
        ))}
      </div>
    );

    // Update cache
    if (rowCache.size >= 100) {
      const firstKey = rowCache.keys().next().value;
      rowCache.delete(firstKey);
    }
    rowCache.set(cacheKey, renderedRow);

    return renderedRow;
  }, [visibleColumns, isDarkMode, rowCache]);

  // Optimized scroll handler
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }) => {
    setScrollPosition(scrollOffset);
    
    if (!scrollUpdateWasRequested && scrollOffset > 0) {
      const listHeight = listRef.current?.props.height || 0;
      const scrollHeight = listRef.current?.props.itemCount * 48;
      
      if (scrollOffset + listHeight >= scrollHeight - 100) {
        loadMoreData();
      }
    }
  }, [loadMoreData]);

  // Memoize table header
  const TableHeader = useMemo(() => (
    <div className={`sticky top-0 z-10 flex items-center border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      {visibleColumns.map((column, index) => (
        <div
          key={column.id}
          className={`px-4 py-2 font-medium ${column.className || ''}`}
          style={{ width: column.width || 'auto' }}
        >
          {column.header}
        </div>
      ))}
    </div>
  ), [visibleColumns, isDarkMode]);

  // Memoize filter function
  const applyFilters = useCallback((data, filters) => {
    const filterKey = JSON.stringify(filters);
    
    // Cek cache
    if (filterCache.current.has(filterKey) && lastFilterKey.current === filterKey) {
      return filterCache.current.get(filterKey);
    }

    // Buat index untuk filter yang sering digunakan
    const filterIndex = new Map();
    data.forEach((row, index) => {
      const key = `${row.SystemId}-${row.MerchantName}-${row.OrderStatus}-${row.Status_Interfaced}`;
      if (!filterIndex.has(key)) {
        filterIndex.set(key, []);
      }
      filterIndex.get(key).push(index);
    });

    // Terapkan filter dengan optimasi
    const filteredData = data.filter(row => {
      // Cek filter SystemId
      if (filters.SystemId && row.SystemId !== filters.SystemId) return false;
      
      // Cek filter MerchantName
      if (filters.MerchantName && row.MerchantName !== filters.MerchantName) return false;
      
      // Cek filter OrderStatus
      if (filters.OrderStatus && row.OrderStatus !== filters.OrderStatus) return false;
      
      // Cek filter Status_Interfaced
      if (filters.Status_Interfaced && row.Status_Interfaced !== filters.Status_Interfaced) return false;
      
      // Cek filter Remark
      if (filters.Remark) {
        const remarkValue = getRemarkValue(row);
        const normalizedRemarkValue = normalizeStatusName(remarkValue);
        if (normalizedRemarkValue !== filters.Remark) return false;
      }
      
      return true;
    });

    // Update cache
    filterCache.current.set(filterKey, filteredData);
    lastFilterKey.current = filterKey;

    // Batasi ukuran cache
    if (filterCache.current.size > 10) {
      const firstKey = filterCache.current.keys().next().value;
      filterCache.current.delete(firstKey);
    }

    return filteredData;
  }, []);

  // Optimize filter change handler
  const handleFilterChange = useCallback((columnId, value) => {
    const startTime = performance.now();
    
    // Update filter state
    setFilters(prev => {
      const newFilters = { ...prev, [columnId]: value };
      
      // Terapkan filter dengan optimasi
      const filteredData = applyFilters(processedData, newFilters);
      
      // Update loaded data dengan hasil filter
      setLoadedData(filteredData.slice(0, 50));
      setHasMore(filteredData.length > 50);
      
      // Log performa
      const endTime = performance.now();
      console.log(`Filter operation took ${endTime - startTime}ms`);
      
      return newFilters;
    });
  }, [processedData, applyFilters]);

  // Optimize filter click handler
  const handleFilterClick = useCallback((column, value) => {
    const startTime = performance.now();
    
    setActiveFilters(prev => {
      const existingFilterIndex = prev.findIndex(
        filter => filter.column === column && filter.value === value
      );
      
      let newFilters;
      if (existingFilterIndex >= 0) {
        newFilters = [...prev];
        newFilters.splice(existingFilterIndex, 1);
      } else {
        newFilters = [...prev, { column, value }];
      }
      
      // Terapkan filter dengan optimasi
      const filteredData = applyFilters(processedData, newFilters);
      
      // Update loaded data dengan hasil filter
      setLoadedData(filteredData.slice(0, 50));
      setHasMore(filteredData.length > 50);
      
      // Log performa
      const endTime = performance.now();
      console.log(`Filter click operation took ${endTime - startTime}ms`);
      
      return newFilters;
    });
  }, [processedData, applyFilters]);

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
      {TableHeader}

      <div className="flex-1 virtualized-list">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              width={width}
              itemCount={isLoading ? 10 : loadedData.length}
              itemSize={48}
              overscanCount={5}
              onScroll={handleScroll}
              initialScrollOffset={scrollPosition}
            >
              {isLoading ? SkeletonRow : renderRow}
            </List>
          )}
        </AutoSizer>
      </div>

      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <LoadingIcon className="h-5 w-5 text-blue-500" />
        </div>
      )}
    </div>
  );
};

// Optimized skeleton row
const SkeletonRow = useCallback(({ index, style }) => (
  <div style={style} className={`flex items-center border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    {visibleColumns.map((column, colIndex) => (
      <div
        key={column.id}
        className={`px-4 py-2 ${column.className || ''}`}
        style={{ width: column.width || 'auto' }}
      >
        <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`} />
      </div>
    ))}
  </div>
), [visibleColumns, isDarkMode]);

export default TableResults; 