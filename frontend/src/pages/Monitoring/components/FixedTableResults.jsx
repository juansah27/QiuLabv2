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
  
  // Metode lebih ketat:
  // 1. Hapus semua whitespace (spasi, tab, baris baru, dll) dengan regex \s+
  // 2. Hapus lagi spasi eksplisit untuk jaga-jaga 
  // 3. Hapus karakter kontrol dan formatting (kategori Unicode Cc dan Cf)
  const cleaned = idStr
    .replace(/\s+/g, '')         // Hapus semua whitespace (\n, \t, spasi, dll)
    .replace(/ /g, '')           // Hapus spasi eksplisit lagi
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, ''); // Hapus karakter kontrol dan formatting
  
  return cleaned;
};

const TableResults = ({ 
  data: initialData = [], 
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
  // Tema
  const { isDarkMode } = useTheme();
  
  // State untuk menyimpan data yang bisa dimodifikasi
  const [data, setData] = useState(initialData.map(row => ({
    ...row,
    // Bersihkan SystemRefId dari semua whitespace
    SystemRefId: cleanSystemRefId(row.SystemRefId),
    Remark: row.Remark || null
  })));

  // State untuk menunjukkan loading saat refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State untuk mode tampilan densitas
  const [densityMode, setDensityMode] = useState(DENSITY_OPTIONS.COMFORTABLE);
  
  // State untuk filter dan sorting
  const [filters, setFilters] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [highlightedColumn, setHighlightedColumn] = useState(null);
  
  // State untuk paginasi
  const [internalPage, setInternalPage] = useState(externalPage || 0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(externalRowsPerPage || 25);
  
  // State untuk pencarian global
  const [globalSearch, setGlobalSearch] = useState('');
  const searchInputRef = useRef(null);
  const initialRenderRef = useRef(true);
  const prevGlobalFilterRef = useRef(null);
  
  // State untuk dropdown, expanded rows dan kolom
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // State untuk edit dan filter
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const activeRemarkInputRef = useRef(null);
  const [openFilterId, setOpenFilterId] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const dropdownRefs = useRef({});
  const previousRemarkRef = useRef(null);
  const [uniqueValues, setUniqueValues] = useState({});
  
  // Logging untuk debugging
  useEffect(() => {
    console.log('TableResults: Data awal diterima:', initialData?.length, initialData?.slice(0, 3));
    console.log('TableResults: Data setelah diproses:', data?.length, data?.slice(0, 3));
    console.log('TableResults: Filtered data:', filteredData?.length);
    console.log('TableResults: Paginated data:', paginatedData?.length);
  }, [initialData, data, filteredData, paginatedData]);
  
  // Effect untuk memperbarui data saat initialData berubah
  useEffect(() => {
    if (Array.isArray(initialData)) {
      setData(initialData.map(row => ({
        ...row,
        // Bersihkan SystemRefId dari semua whitespace
        SystemRefId: cleanSystemRefId(row.SystemRefId),
        Remark: row.Remark || null
      })));
    } else {
      console.error('TableResults: initialData bukan array:', initialData);
    }
  }, [initialData]);
  
  // Computed state untuk data yang sudah difilter
  const filteredData = useMemo(() => {
    console.log('Computing filteredData from data:', data?.length);
    
    if (!data || data.length === 0) {
      return [];
    }
    
    let result = [...data];
    
    // Terapkan filter global jika ada
    if (globalSearch?.trim()) {
      const searchTerm = globalSearch.trim().toLowerCase();
      result = result.filter(row => {
        // Cari di semua kolom
        return Object.values(row).some(value => {
          // Hanya cari di nilai yang bisa dikonversi ke string
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }
    
    // Terapkan filter kolom
    Object.entries(columnFilters).forEach(([columnId, filter]) => {
      if (!filter) return;
      
      if (filter.type === 'checkbox' && filter.values) {
        // Untuk filter checkbox, row harus cocok dengan salah satu nilai yang dipilih
        result = result.filter(row => {
          // Tangani nilai null/undefined khusus
          if (filter.values.includes('NULL') && (row[columnId] === null || row[columnId] === undefined || row[columnId] === '')) {
            return true;
          }
          
          // Tangani null value
          if (row[columnId] === null || row[columnId] === undefined) {
            return false;
          }
          
          return filter.values.includes(row[columnId]);
        });
      } else if (filter.type === 'text' && filter.value) {
        // Untuk filter teks, row harus mengandung substring
        const searchValue = filter.value.toLowerCase();
        result = result.filter(row => {
          // Tangani null value
          if (row[columnId] === null || row[columnId] === undefined) {
            return false;
          }
          
          return String(row[columnId]).toLowerCase().includes(searchValue);
        });
      }
    });
    
    // Terapkan sorting jika ada
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Pastikan untuk menangani nilai null/undefined
        const aValue = a[sortConfig.key] === null || a[sortConfig.key] === undefined ? '' : a[sortConfig.key];
        const bValue = b[sortConfig.key] === null || b[sortConfig.key] === undefined ? '' : b[sortConfig.key];
        
        // Normalisasi kedua nilai untuk perbandingan yang konsisten
        const valueA = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
        const valueB = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [data, globalSearch, columnFilters, sortConfig.key, sortConfig.direction]);
  
  // Gunakan paginasi internal atau eksternal
  const page = externalPage !== undefined ? externalPage : internalPage;
  const rowsPerPage = externalRowsPerPage !== undefined ? externalRowsPerPage : internalRowsPerPage;
  
  // Hitung total halaman
  const totalPages = Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage));
  
  // Data yang dipaginasi untuk tampilan tabel
  const paginatedData = useMemo(() => {
    console.log('Computing paginatedData from filteredData:', filteredData?.length);
    
    if (!filteredData || filteredData.length === 0) {
      return [];
    }
    
    const startIdx = page * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    
    return filteredData.slice(startIdx, endIdx);
  }, [filteredData, page, rowsPerPage]);
  
  // Logging untuk debugging 
  useEffect(() => {
    if (filteredData && paginatedData) {
      console.log('TableResults: Data awal diterima:', initialData?.length, initialData?.slice(0, 3));
      console.log('TableResults: Data setelah diproses:', data?.length, data?.slice(0, 3));
      console.log('TableResults: Filtered data:', filteredData?.length);
      console.log('TableResults: Paginated data:', paginatedData?.length);
    }
  }, [initialData, data, filteredData, paginatedData]);

  // Define columns dynamically based on the data, but maintain the predefined order
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Ambil semua kunci dari data
    const allKeys = Object.keys(data[0] || {});
    
    // Normalisasi nama kolom untuk pencocokan yang lebih fleksibel
    const normalizeColumnName = (name) => {
      return name.toUpperCase().replace(/[_\s-]/g, '');
    };
    
    // Normalisasi semua kunci dari data
    const normalizedDataKeys = allKeys.map(key => normalizeColumnName(key));
    
    // Susun kolom sesuai urutan COLUMN_ORDER yang telah didefinisikan
    const orderedKeys = [];
    
    // Tambahkan kolom yang ada di COLUMN_ORDER dan juga ada di data (dengan pencocokan fleksibel)
    COLUMN_ORDER.forEach(orderKey => {
      const normalizedOrderKey = normalizeColumnName(orderKey);
      
      // Cari indeks kolom dalam data yang cocok (setelah normalisasi)
      const index = normalizedDataKeys.findIndex(k => k === normalizedOrderKey);
      
      if (index !== -1) {
        // Gunakan kunci asli dari data untuk mempertahankan format yang benar
        orderedKeys.push(allKeys[index]);
      } else {
        // Coba pencocokan lebih fleksibel dengan mencari substring
        const similarIndex = normalizedDataKeys.findIndex(k => 
          k.includes(normalizedOrderKey) || normalizedOrderKey.includes(k)
        );
        
        if (similarIndex !== -1) {
          orderedKeys.push(allKeys[similarIndex]);
        }
      }
    });
    
    // Tambahkan kolom yang ada di data tapi tidak didefinisikan di COLUMN_ORDER
    allKeys.forEach(key => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });
    
    // Map ke format yang diperlukan untuk tabel
    return orderedKeys.map(key => ({
      id: key,
      label: key.replace(/_/g, ' '),
      minWidth: 120
    }));
  }, [data]);
  
  // Fungsi untuk render cell (basic)
  const cellRendering = (column, row) => {
    const value = row[column.id];
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    
    // Format berdasarkan tipe data
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    // Default: return as string
    return String(value);
  };
  
  // Mendapatkan kelas untuk densitas tampilan
  const getDensityClasses = () => {
    switch (densityMode) {
      case DENSITY_OPTIONS.COMPACT:
        return {
          table: 'text-xs',
          headerPadding: 'px-2 py-1',
          cellPadding: 'px-2 py-1',
          fontSize: 'text-xs'
        };
      case DENSITY_OPTIONS.SPACIOUS:
        return {
          table: 'text-base',
          headerPadding: 'px-6 py-4',
          cellPadding: 'px-6 py-4',
          fontSize: 'text-base'
        };
      case DENSITY_OPTIONS.COMFORTABLE:
      default:
        return {
          table: 'text-sm',
          headerPadding: 'px-4 py-3',
          cellPadding: 'px-4 py-3',
          fontSize: 'text-sm'
        };
    }
  };
  
  const densityClasses = getDensityClasses();
  
  // Komponen untuk loading overlay
  const RefreshOverlay = ({ visible }) => {
    if (!visible) return null;
    
    return (
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-800/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-800 dark:text-gray-200 font-medium">Memuat data...</span>
        </div>
      </div>
    );
  };
  
  // React Portal untuk elemen yang perlu di-mount di luar hierarki komponen
  const Portal = ({ children }) => {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;
    return createPortal(children, portalRoot);
  };
  
  // Log data untuk debugging
  console.log('Rendering TableResults with:', {
    dataLength: data?.length,
    filteredDataLength: filteredData?.length,
    paginatedDataLength: paginatedData?.length,
    sampleData: paginatedData?.slice(0, 2),
    isLoading
  });
  
  return (
    <div className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
      {/* Overlay loading saat refresh */}
      <RefreshOverlay visible={isRefreshing || isLoading} />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-xs bg-yellow-50 border-b border-yellow-200 text-yellow-800">
          Debug: {filteredData?.length || 0} rows filtered, {paginatedData?.length || 0} rows paginated
        </div>
      )}
      
      {/* Table wrapper with overflow */}
      <div className="overflow-x-auto">
        <table className={`w-full ${densityClasses.table}`}>
          {/* Table header */}
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 select-none text-gray-600 dark:text-gray-300">
            <tr>
              {columns
                .filter(column => !hiddenColumns.includes(column.id))
                .map((column, index) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={`${densityClasses.headerPadding} text-left ${densityClasses.fontSize} font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200 dark:border-gray-600`}
                    style={{ minWidth: column.minWidth || 120 }}
                  >
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          
          {/* Table body - Simplified implementation */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={columns.filter(column => !hiddenColumns.includes(column.id)).length} 
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                    <span className="text-lg font-medium">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : !Array.isArray(paginatedData) || paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.filter(column => !hiddenColumns.includes(column.id)).length} 
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-lg font-medium">Tidak ada data yang ditemukan</span>
                    <p className="text-sm mt-1 max-w-lg">
                      {globalSearch 
                        ? `Tidak ada hasil yang cocok dengan pencarian '${globalSearch}'` 
                        : `Tidak ada data untuk ditampilkan (filtered: ${filteredData?.length || 0})`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              Array.from(paginatedData).map((row, rowIndex) => (
                <tr 
                  key={`row-${rowIndex}-${row?.SystemRefId || rowIndex}`}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rowIndex % 2 === 0 ? 'bg-white dark:bg-[#111827]' : 'bg-gray-50/50 dark:bg-[#1f2937]'}`}
                >
                  {columns
                    .filter(column => !hiddenColumns.includes(column.id))
                    .map((column, cellIndex) => (
                      <td 
                        key={`cell-${rowIndex}-${cellIndex}-${column.id}`} 
                        className={`${densityClasses.cellPadding} whitespace-nowrap`}
                      >
                        {row[column.id] === null || row[column.id] === undefined 
                          ? <span className="text-gray-400 italic">—</span>
                          : String(row[column.id])}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table footer with pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          {/* Row count indicator */}
          <span>
            Menampilkan {paginatedData.length} dari {filteredData.length} baris
            {totalCount > 0 && filteredData.length !== totalCount && (
              <span> (dari total {totalCount} baris)</span>
            )}
          </span>
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          {/* Rows per page selector */}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              if (onRowsPerPageChange) {
                onRowsPerPageChange(newValue);
              } else {
                setInternalRowsPerPage(newValue);
              }
            }}
            className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {[10, 25, 50, 100].map(option => (
              <option key={option} value={option}>
                {option} baris
              </option>
            ))}
          </select>
          
          {/* Page navigation */}
          <button
            onClick={() => {
              const newPage = page - 1;
              if (onPageChange) {
                onPageChange(newPage);
              } else {
                setInternalPage(newPage);
              }
            }}
            disabled={page === 0}
            className={`p-1 rounded-md ${
              page === 0
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Halaman {page + 1} dari {totalPages}
          </span>
          
          <button
            onClick={() => {
              const newPage = page + 1;
              if (onPageChange) {
                onPageChange(newPage);
              } else {
                setInternalPage(newPage);
              }
            }}
            disabled={page >= totalPages - 1}
            className={`p-1 rounded-md ${
              page >= totalPages - 1
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableResults; 