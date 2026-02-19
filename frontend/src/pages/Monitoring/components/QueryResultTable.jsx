import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getRemarkValue } from '../hooks/useMonitoring';
import BulkRemarkUpdate from './BulkRemarkUpdate';
import { useTheme } from '../../../contexts/ThemeContext';
import { THEME_COLORS, THEME_TRANSITIONS, COMPONENT_CLASSES } from '../../../utils/themeUtils';
import RemarkInput from './RemarkInput';
import api from '../../../utils/api';

// Dasar kolom tanggal yang digunakan di berbagai tempat
const DATE_COLUMN_NAMES = [
  'orderdate', 'sla', 'datamasukcms', 'datamasukxml',
  'interfacedate', 'transferdate', 'entdte', 'moddte',
  'mandte', 'tanggalpembayaran', 'created_at', 'updated_at',
  'tanggal_transaksi'
];

// Helper untuk format tanggal
const formatDateString = (value) => {
  if (!value) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

// Tambahkan debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Komponen Advanced Filter Dropdown
const AdvancedFilterDropdown = React.memo(({ isOpen, onClose, options = [], selectedValues = [], onApply, title }) => {
  const [tempSelected, setTempSelected] = useState(selectedValues || []);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const { isDarkMode } = useTheme();
  const [alignRight, setAlignRight] = useState(false);

  // Deteksi posisi dropdown untuk mencegah overflow ke kanan
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen]);

  // Reset tempSelected when selectedValues changes from outside
  useEffect(() => {
    setTempSelected(selectedValues || []);
  }, [selectedValues]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(option =>
      String(option).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Auto-select hasil pencarian
  useEffect(() => {
    if (searchTerm.trim() && filteredOptions.length > 0) {
      setTempSelected(prev => {
        const newSelection = [...prev];
        filteredOptions.forEach(option => {
          if (!newSelection.includes(String(option))) {
            newSelection.push(String(option));
          }
        });
        return newSelection;
      });
    }
  }, [searchTerm, filteredOptions]);

  // Cek apakah semua item dipilih
  const allSelected = useMemo(() => {
    return filteredOptions.length > 0 && filteredOptions.every(option =>
      tempSelected.includes(String(option))
    );
  }, [filteredOptions, tempSelected]);

  // Cek apakah sebagian item dipilih
  const someSelected = useMemo(() => {
    return !allSelected && filteredOptions.some(option =>
      tempSelected.includes(String(option))
    );
  }, [filteredOptions, tempSelected, allSelected]);

  // Handler untuk select all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setTempSelected(prev =>
        prev.filter(item => !filteredOptions.some(option => String(option) === item))
      );
    } else {
      setTempSelected(prev => {
        const newSelection = [...prev];
        filteredOptions.forEach(option => {
          if (!newSelection.includes(String(option))) {
            newSelection.push(String(option));
          }
        });
        return newSelection;
      });
    }
  }, [allSelected, filteredOptions]);

  // Handler untuk select item
  const handleSelectItem = useCallback((option) => {
    setTempSelected(prev => {
      const optionStr = String(option);
      if (prev.includes(optionStr)) {
        return prev.filter(item => item !== optionStr);
      } else {
        return [...prev, optionStr];
      }
    });
  }, []);

  // Handler untuk apply filter
  const handleApply = useCallback(() => {
    onApply(tempSelected);
    onClose();
  }, [onApply, onClose, tempSelected]);

  // Handler untuk click di luar dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 mt-1 ${alignRight ? 'right-0' : 'left-0'} ${THEME_COLORS.card.light} ${THEME_COLORS.card.dark} shadow-lg rounded-md ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} w-64 ${THEME_TRANSITIONS.default}`}
      style={{ maxHeight: '350px', overflowY: 'auto' }}
    >
      <div className={`p-2 border-b ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${THEME_TRANSITIONS.default}`}>
        <div className={`text-sm font-medium mb-1.5 ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
          {title || 'Filter'}
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari..."
            className={`w-full px-2.5 py-1.5 pl-7 text-xs border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ${THEME_TRANSITIONS.default}`}
            autoFocus
          />
          <div className={`absolute left-2 top-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ${THEME_TRANSITIONS.default}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              className={`absolute right-2 top-1.5 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} ${THEME_TRANSITIONS.default}`}
              onClick={() => setSearchTerm('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto">
        <div className="p-1">
          <label className={`flex items-center p-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded cursor-pointer ${THEME_TRANSITIONS.default}`}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
              ref={el => {
                if (el) el.indeterminate = someSelected;
              }}
              className="mr-2 text-blue-600 rounded"
            />
            <span className={`text-xs ${someSelected ? (isDarkMode ? 'text-gray-400' : 'text-gray-500') + ' font-normal' : 'font-medium'} ${THEME_TRANSITIONS.default}`}>
              (Select All Search Results)
            </span>
          </label>

          {filteredOptions.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded cursor-pointer ${THEME_TRANSITIONS.default}`}
            >
              <input
                type="checkbox"
                checked={tempSelected.includes(String(option))}
                onChange={() => handleSelectItem(option)}
                className="mr-2 text-blue-600 rounded"
              />
              <span className={`text-xs truncate ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} ${THEME_TRANSITIONS.default}`}>
                {String(option)}
              </span>
            </label>
          ))}

          {filteredOptions.length === 0 && (
            <div className={`text-center p-2 text-xs ${THEME_COLORS.text.muted.light} ${THEME_COLORS.text.muted.dark} ${THEME_TRANSITIONS.default}`}>
              Tidak ada hasil
            </div>
          )}
        </div>
      </div>

      <div className={`p-2 border-t ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} flex justify-end gap-2 ${THEME_TRANSITIONS.default}`}>
        <button
          onClick={onClose}
          className={`px-3 py-1 text-xs border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          OK
        </button>
      </div>
    </div>
  );
});

// Komponen untuk menampilkan dropdown penyesuaian kolom
const ColumnCustomizer = React.memo(({ isOpen, onClose, columns = [], visibleColumns = [], onApply }) => {
  const [selectedColumns, setSelectedColumns] = useState([...visibleColumns]);
  const dropdownRef = useRef(null);
  const { isDarkMode } = useTheme();

  // Handler untuk toggle select column
  const toggleColumn = useCallback((columnId) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  }, []);

  // Handler untuk select all
  const selectAll = useCallback(() => {
    setSelectedColumns(columns.map(col => col.id));
  }, [columns]);

  // Handler untuk deselect all
  const deselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  // Handler untuk apply changes
  const handleApply = useCallback(() => {
    onApply(selectedColumns);
    onClose();
  }, [onApply, onClose, selectedColumns]);

  // Handler untuk click di luar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`${THEME_COLORS.card.light} ${THEME_COLORS.card.dark} shadow-lg rounded-md border ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} w-64 ${THEME_TRANSITIONS.default}`}
      style={{ maxHeight: '400px', overflowY: 'auto' }}
    >
      <div className={`p-2 border-b ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark}`}>
        <div className="flex justify-between items-center">
          <h3 className={`text-sm font-medium ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark}`}>
            Atur Kolom
          </h3>
          <div className="space-x-1">
            <button
              onClick={selectAll}
              className={`px-2 py-0.5 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded`}
            >
              Pilih Semua
            </button>
            <button
              onClick={deselectAll}
              className={`px-2 py-0.5 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded`}
            >
              Batalkan
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        <div className="p-1">
          {columns.map(column => (
            <label
              key={column.id}
              className={`flex items-center p-1.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded cursor-pointer`}
            >
              <input
                type="checkbox"
                checked={selectedColumns.includes(column.id)}
                onChange={() => toggleColumn(column.id)}
                className="mr-2 text-blue-600 rounded"
              />
              <span className={`text-xs ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark}`}>{column.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={`p-2 border-t ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} flex justify-end gap-2`}>
        <button
          onClick={onClose}
          className={`px-3 py-1 text-xs border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark}`}
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          OK
        </button>
      </div>
    </div>
  );
});

// Komponen TableSkeleton untuk menampilkan skeleton loading saat data dimuat
const TableSkeleton = ({ columns = 6, rows = 10 }) => {
  const { isDarkMode } = useTheme();

  // Array dengan jumlah kolom yang diberikan
  const columnsArray = [...Array(columns)].map((_, i) => i);

  // Array dengan jumlah baris yang diberikan
  const rowsArray = [...Array(rows)].map((_, i) => i);

  return (
    <div className={`w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm animate-pulse`}>
      {/* Header Skeleton */}
      <div className={`px-4 py-3 flex flex-wrap items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3 md:mb-0">
          <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={`h-8 w-24 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
          <div className={`h-8 w-24 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
          <div className={`h-8 w-24 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        </div>
      </div>

      {/* Search and Filter Skeleton */}
      <div className={`px-4 py-2 flex flex-wrap gap-2 items-center ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'
        } border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`h-8 w-64 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        <div className={`h-8 w-32 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              {columnsArray.map((col) => (
                <th key={`skeleton-header-${col}`} scope="col" className="px-6 py-3">
                  <div className={`h-4 w-full rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
            {rowsArray.map((row) => (
              <tr key={`skeleton-row-${row}`}>
                {columnsArray.map((col) => (
                  <td key={`skeleton-cell-${row}-${col}`} className="px-6 py-3">
                    <div
                      className={`h-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                      style={{ width: `${Math.floor(Math.random() * 50) + 50}%` }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className={`px-4 py-3 flex items-center justify-between border-t ${isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
        <div className={`h-8 w-32 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
          <div className={`h-8 w-8 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
          <div className={`h-8 w-8 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    </div>
  );
};

const QueryResultTable = ({
  data = [],
  loading = false,
  activeFilters = [],
  onRefresh,  // Tambahkan prop onRefresh
  onClearExternalFilters,  // Tambahkan prop untuk clear external filters
  onDataChange  // Tambahkan prop onDataChange
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [editingCell, setEditingCell] = useState(null); // {rowIndex, columnId}
  const [remarks, setRemarks] = useState({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState([]);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]); // State untuk kolom yang dipilih
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' }); // State untuk notifikasi
  const lastSelectedColumnRef = useRef(null); // Referensi untuk kolom terakhir yang dipilih (untuk shift+click)
  const [showColumnHelpDialog, setShowColumnHelpDialog] = useState(false); // State untuk dialog bantuan
  const [isCompactView, setIsCompactView] = useState(false); // State untuk mode compact view
  const [showAllData, setShowAllData] = useState(false); // State untuk menampilkan semua data
  const { isDarkMode } = useTheme();
  const [activeCell, setActiveCell] = useState(null); // Untuk menyimpan sel aktif untuk navigasi keyboard

  // Urutan kolom yang diinginkan
  const columnOrder = useMemo(() => [
    'SalesChannel',
    'Brand',
    'Order Number',
    'Remark',
    'OrderDate',
    'OrderStatus',
    'No. Resi',
    'Validasi SKU',
    'SKU',
    'Tanggal Pembayaran',
    'SLA',
    'Data Masuk CMS',
    'Data Masuk XML',
    'Batch',
    'Status SC',
    'Transporter',
    'WH Loc',
    'Diproses Flexo',
    'Interface Date',
    'Status Interfaced',
    'Status Durasi'
  ], []);

  // Mendapatkan kolom dari data dengan urutan yang ditentukan
  const allColumns = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Ambil semua key yang ada pada data pertama
    const firstItem = data[0];
    const availableKeys = Object.keys(firstItem);

    // Buat mapping ID kolom ke label untuk pengecekan
    const keyMapping = {};
    availableKeys.forEach(key => {
      // Mapping key asli ke versi yang sudah diformat (lower case, tanpa underscore, tanpa spasi)
      keyMapping[key.toLowerCase().replace(/_/g, '').replace(/\s+/g, '')] = key;
    });

    // Buat array kolom dengan urutan yang ditentukan
    const orderedColumns = [];

    // Tambahkan kolom sesuai urutan yang ditentukan
    columnOrder.forEach(preferredKey => {
      // Cari key yang cocok (case insensitive, tanpa underscore)
      const normalizedKey = preferredKey.toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
      const actualKey = keyMapping[normalizedKey];

      if (actualKey) {
        orderedColumns.push({
          id: actualKey,
          label: preferredKey,
          editable: actualKey.toLowerCase() === 'remark',
          filterable: true
        });
        // Hapus key yang sudah digunakan dari mapping
        delete keyMapping[normalizedKey];
      }
    });

    // Tambahkan sisa kolom yang belum dimasukkan (jika ada)
    Object.values(keyMapping).forEach(key => {
      orderedColumns.push({
        id: key,
        label: key.replace(/_/g, ' '),
        editable: key.toLowerCase() === 'remark',
        filterable: true
      });
    });

    return orderedColumns;
  }, [data, columnOrder]);

  // Kolom yang ditampilkan berdasarkan pilihan pengguna
  const columns = useMemo(() => {
    if (visibleColumnIds.length === 0) {
      return allColumns;
    }

    return visibleColumnIds
      .map(id => allColumns.find(col => col.id === id))
      .filter(Boolean);
  }, [allColumns, visibleColumnIds]);

  // Load preferensi kolom dan remarks dari API saat komponen mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load remarks dari API
        const response = await api.get('/monitoring/remarks');
        if (response.data.status === 'success') {
          setRemarks(response.data.data || {});
        }
      } catch (error) {
        console.error('Error loading remarks from API:', error);
      }

      try {
        // Load preferensi kolom dari localStorage (ini bisa tetap di localStorage)
        const savedColumns = localStorage.getItem('table_visible_columns');
        if (savedColumns) {
          setVisibleColumnIds(JSON.parse(savedColumns));
        }
      } catch (error) {
        console.error('Error loading columns from localStorage:', error);
      }
    };

    loadInitialData();

    // Clear old localStorage remarks on mount (migration cleanup)
    try {
      localStorage.removeItem('table_remarks');
      localStorage.removeItem('tableRemarks');
    } catch (e) {
      console.error('Error clearing old localStorage:', e);
    }
  }, []);

  // Simpan preferensi kolom ke localStorage saat berubah
  useEffect(() => {
    if (visibleColumnIds.length > 0) {
      localStorage.setItem('table_visible_columns', JSON.stringify(visibleColumnIds));
    }
  }, [visibleColumnIds]);

  // Handler untuk mengubah kolom yang ditampilkan
  const handleColumnVisibilityChange = (selectedColumns) => {
    setVisibleColumnIds(selectedColumns);
  };

  // Data yang sudah difilter berdasarkan pencarian global
  const globalFilteredData = useMemo(() => {
    // If no search term, return the data as-is (already filtered by parent)
    if (!searchTerm.trim() || !data) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return data.filter(row => {
      // Early return jika tidak ada data
      if (!row) return false;

      // Cari di semua kolom yang terlihat saja
      return columns.some(column => {
        const value = row[column.id];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }, [data, searchTerm, columns]);

  // Membuat opsi filter unik untuk setiap kolom
  const filterOptions = useMemo(() => {
    // Gunakan globalFilteredData sebagai sumber data awal
    const sourceData = globalFilteredData || data;
    if (!sourceData || sourceData.length === 0) return {};

    const options = {};

    columns.forEach(column => {
      if (column.filterable) {
        // Kasus khusus untuk kolom Remark - gunakan getRemarkValue untuk mendapatkan nilai yang mungkin diubah di localStorage
        if (column.id === 'Remark') {
          // Ambil nilai unik untuk Remark, termasuk yang disimpan di localStorage
          const uniqueValues = Array.from(new Set(
            sourceData
              .map(row => getRemarkValue(row, column.id))
              .filter(value => value !== null && value !== undefined)
          )).sort();

          // Pastikan NULL/empty string tersedia sebagai opsi filter untuk Remark
          if (!uniqueValues.includes('')) {
            uniqueValues.push('');
          }

          // Tambahkan opsi 'NULL' secara eksplisit untuk memfilter nilai kosong
          if (!uniqueValues.includes('NULL')) {
            uniqueValues.push('NULL');
          }

          options[column.id] = uniqueValues;
        } else {
          // Untuk kolom lain, gunakan implementasi asli
          const uniqueValues = Array.from(new Set(
            sourceData
              .map(row => {
                const val = row[column.id];
                // Check if it's a date column
                const columnIdName = column.id.toLowerCase().replace(/[^a-z]/g, '');
                if (DATE_COLUMN_NAMES.includes(columnIdName) && val) {
                  return formatDateString(val);
                }
                return val;
              })
              .filter(value => value !== null && value !== undefined)
          )).sort();

          options[column.id] = uniqueValues;
        }
      }
    });

    return options;
  }, [globalFilteredData, data, columns, remarks]); // Tambahkan data sebagai fallback dependency

  // Data yang sudah difilter berdasarkan filter kolom (data sudah difilter oleh parent component)
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0 || !globalFilteredData) return globalFilteredData;

    return globalFilteredData.filter(row => {
      // Early return jika tidak ada data
      if (!row) return false;

      // Cek semua filter kolom
      return Object.entries(columnFilters).every(([columnId, filterValues]) => {
        // Early return jika filter kosong
        if (!filterValues || (Array.isArray(filterValues) && filterValues.length === 0)) return true;

        // Kasus khusus untuk Remark - gunakan nilai dari localStorage jika ada
        if (columnId === 'Remark') {
          const remarkValue = getRemarkValue(row, columnId);

          // Early return untuk nilai null/undefined
          if (remarkValue === null || remarkValue === undefined) {
            return filterValues.includes('') || filterValues.includes('NULL');
          }

          // Fungsi untuk normalisasi string agar case-insensitive
          const normalizeString = (str) => String(str).toLowerCase().trim();
          const normalizedRemark = normalizeString(remarkValue);

          // Jika filter adalah array, periksa jika salah satu nilai cocok
          if (Array.isArray(filterValues)) {
            // Penanganan khusus untuk nilai NULL/empty
            if (filterValues.includes('') || filterValues.includes('NULL')) {
              if (remarkValue === null || remarkValue === undefined || remarkValue === '') {
                return true;
              }
            }

            // Penanganan khusus untuk 'Cancel' yang mencakup 'IN_Cancel' dan variasinya
            const cancelVariations = ['cancel', 'cancelled', 'in_cancelled', 'in_cancel', 'in cancel', 'in cancelled'];
            if (filterValues.some(f => normalizeString(f) === 'cancel')) {
              if (cancelVariations.some(variation => normalizedRemark === variation)) {
                return true;
              }
            }

            // Cek apakah nilai cocok dengan salah satu filter (case-insensitive)
            return filterValues.some(filter =>
              filter !== '' &&
              filter !== 'NULL' &&
              normalizeString(filter) === normalizedRemark
            );
          }

          // Untuk single value filter
          if (filterValues === '' || filterValues === 'NULL') {
            return remarkValue === null || remarkValue === undefined || remarkValue === '';
          }

          // Gunakan perbandingan case-insensitive
          return normalizeString(filterValues) === normalizedRemark;
        }

        // Untuk kolom non-Remark
        const value = row[columnId];

        // Early return untuk nilai null/undefined
        if (value === null || value === undefined) {
          return filterValues.includes('') || filterValues.includes('NULL');
        }

        // Handle array atau single value
        const filters = Array.isArray(filterValues) ? filterValues : [filterValues];

        const columnIdName = columnId.toLowerCase().replace(/[^a-z]/g, '');
        if (DATE_COLUMN_NAMES.includes(columnIdName) && value) {
          const formattedValue = formatDateString(value);
          return filters.some(filter => String(formattedValue) === String(filter));
        }

        // Jika salah satu filter cocok, lulus
        return filters.some(filter => String(value) === String(filter));
      });
    });
  }, [globalFilteredData, columnFilters, remarks]);

  // Menerapkan sorting jika ada
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !filteredData) return filteredData;

    return [...filteredData].sort((a, b) => {
      // Menangani nilai null atau undefined
      if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      const columnId = sortConfig.key.toLowerCase().replace(/[^a-z]/g, '');
      const isDateColumn = DATE_COLUMN_NAMES.includes(columnId);

      if (isDateColumn) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      // Memastikan kita membandingkan string dengan string
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Data untuk halaman saat ini
  const paginatedData = useMemo(() => {
    if (!sortedData) return [];

    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  // Total halaman
  const totalPages = useMemo(() => {
    return Math.ceil((sortedData?.length || 0) / rowsPerPage);
  }, [sortedData, rowsPerPage]);

  // Handler untuk perubahan halaman
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handler untuk perubahan jumlah baris per halaman
  const handleRowsPerPageChange = (event) => {
    const value = event.target.value;
    if (value === 'all') {
      setShowAllData(true);
      setRowsPerPage(filteredData?.length || data.length);
    } else {
      setShowAllData(false);
      setRowsPerPage(parseInt(value, 10));
    }
    setCurrentPage(0); // Reset ke halaman pertama
  };

  // Handler untuk perubahan sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handler untuk perubahan pencarian
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0); // Reset ke halaman pertama saat pencarian berubah
  };

  // Handler untuk filter kolom
  const handleColumnFilterChange = (columnId, values) => {
    // Jika values kosong, berarti kita ingin menghapus semua filter untuk kolom ini
    if (!values || (Array.isArray(values) && values.length === 0)) {
      // Hapus filter internal
      setColumnFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[columnId];
        return newFilters;
      });

      // Jika onClearExternalFilters tersedia dan ini adalah filter kolom yang juga ada di filter eksternal,
      // hapus juga filter eksternal yang terkait
      if (onClearExternalFilters && activeFilters && activeFilters.length > 0) {
        // Periksa apakah ada filter eksternal untuk kolom ini
        const hasExternalFilter = activeFilters.some(filter => {
          // Cari kolom yang sesuai di data
          const matchingColumn = columns.find(col =>
            col.id === filter.column ||
            col.label === filter.column ||
            col.id.toLowerCase().replace(/_/g, '') === filter.column.toLowerCase().replace(/_/g, '')
          );
          const mappedColumnId = matchingColumn?.id;

          return mappedColumnId === columnId || filter.column === columnId;
        });

        // Jika ada filter eksternal untuk kolom ini, beri tahu parent component
        if (hasExternalFilter) {
          console.log(`Requesting parent to clear external filters for column: ${columnId}`);
          onClearExternalFilters();
        }
      }

      setCurrentPage(0);
      return;
    }

    // Pastikan tidak ada duplikasi nilai pada array values
    let uniqueValues = values;
    if (Array.isArray(values)) {
      // Gunakan Set untuk menghilangkan duplikasi (case-sensitive)
      uniqueValues = [...new Set(values)];

      // Jika perlu case-insensitive, gunakan map untuk menormalisasi
      const normalized = new Map();
      values.forEach(value => {
        const key = String(value).toLowerCase();
        if (!normalized.has(key)) {
          normalized.set(key, value);
        }
      });
      uniqueValues = Array.from(normalized.values());
    }

    setColumnFilters(prev => ({ ...prev, [columnId]: uniqueValues }));
    setCurrentPage(0); // Reset ke halaman pertama
  };

  // Handler untuk menghapus semua filter
  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setCurrentPage(0);

    // Jika onClearExternalFilters tersedia, panggil untuk membersihkan filter eksternal
    if (onClearExternalFilters) {
      onClearExternalFilters();
    }
  };

  // Handler untuk edit cell
  const handleCellEdit = (rowIndex, columnId, currentValue) => {
    setEditingCell({ rowIndex, columnId });
  };

  // Optimasi handleSaveEdit dengan debounce
  const handleSaveEdit = useCallback(async (rowIndex, columnId, value) => {
    const rowData = paginatedData[rowIndex];
    if (!rowData) return;

    // Validasi input
    const trimmedValue = value?.trim();
    if (trimmedValue === '') {
      value = null; // Simpan sebagai null jika kosong
    }

    // Jika kolom Remark, update ke backend
    if (columnId === 'Remark' && (rowData['Order Number'] || rowData.SystemRefId)) {
      try {
        await api.post('/monitoring/remark', {
          system_ref_id: rowData['Order Number'] || rowData.SystemRefId,
          remark: value
        });

        // Update state lokal dengan Order Number sebagai key
        setRemarks(prev => ({
          ...prev,
          [rowData['Order Number'] || rowData.SystemRefId]: value
        }));
      } catch (err) {
        console.error('Gagal update remark ke backend:', err);
        showNotification('Gagal menyimpan remark', 'error');
      }
    }

    setEditingCell(null);

    // Optimistic update: update Remark di data lokal (tampilan langsung berubah)
    if (typeof onDataChange === 'function') {
      const updatedData = data.map((row, idx) => {
        if (idx === rowIndex && columnId === 'Remark') {
          return { ...row, Remark: value };
        }
        return row;
      });
      onDataChange(updatedData);
    }
  }, [paginatedData, data, onDataChange]);

  // Handler untuk batal edit
  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  // Fungsi untuk mendapatkan nama file ekspor berdasarkan filter aktif
  const getExportFileName = (extension) => {
    // Format tanggal dalam format yyyymmdd hh:mm:ss
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Cek filter aktif
    let filterName = '';

    // Cek filter dari activeFilters (dari komponen StatusCards)
    if (activeFilters && activeFilters.length > 0) {
      // Prioritaskan filter yang lebih spesifik
      const priorityFilters = ['Pending Verifikasi', 'Cancel', 'Remark'];

      // Cari filter prioritas yang mungkin aktif
      for (const priority of priorityFilters) {
        const found = activeFilters.find(filter =>
          filter.value === priority ||
          (filter.column === 'Remark' && filter.value === priority)
        );

        if (found) {
          filterName = found.value;
          break;
        }
      }

      // Jika tidak ada filter prioritas, gunakan filter pertama
      if (!filterName && activeFilters[0]) {
        filterName = activeFilters[0].value;
      }
    }

    // Cek filter dari columnFilters (dari tabel)
    if (!filterName && Object.keys(columnFilters).length > 0) {
      // Prioritaskan filter Remark
      if (columnFilters['Remark']) {
        const remarkFilters = Array.isArray(columnFilters['Remark'])
          ? columnFilters['Remark']
          : [columnFilters['Remark']];

        // Prioritaskan beberapa nilai Remark khusus
        const priorityValues = ['Pending Verifikasi', 'Cancel', 'IN_Cancel'];

        for (const priority of priorityValues) {
          if (remarkFilters.includes(priority)) {
            filterName = priority === 'IN_Cancel' ? 'Cancel' : priority;
            break;
          }
        }

        // Jika tidak ada nilai prioritas, gunakan nilai pertama
        if (!filterName && remarkFilters.length > 0 && remarkFilters[0] !== '' && remarkFilters[0] !== 'NULL') {
          filterName = remarkFilters[0];
        }
      }
      // Jika tidak ada filter Remark, gunakan filter kolom pertama
      else {
        const firstColumn = Object.keys(columnFilters)[0];
        const firstValue = columnFilters[firstColumn];

        if (Array.isArray(firstValue) && firstValue.length > 0) {
          filterName = firstValue[0];
        } else if (firstValue) {
          filterName = firstValue;
        }
      }
    }

    // Jika ada filter, tambahkan ke nama file
    const fileName = filterName
      ? `Data Monitoring ${filterName} ${formattedDate}`
      : `Data Monitoring ${formattedDate}`;

    return `${fileName}.${extension}`;
  };

  // Fungsi untuk ekspor data ke CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      console.log('Tidak ada data untuk diekspor');
      return false;
    }

    try {
      console.log('Memulai ekspor ke CSV...');

      // Dapatkan header kolom
      const headers = columns.map(col => col.id);

      // Gunakan data yang sudah difilter jika ada pencarian atau filter
      const dataToExport = sortedData;

      console.log(`Mengekspor ${dataToExport.length} baris data ke CSV`);

      // Convert data ke format CSV
      const csvContent = [
        // Header baris
        headers.join(','),
        // Data baris
        ...dataToExport.map((row) =>
          headers.map(header => {
            let value = row[header];

            // Gunakan nilai remark dari localStorage jika yang diedit
            if (header.toLowerCase() === 'remark') {
              value = getRemarkValue(row, header);
            }

            if (DATE_COLUMN_NAMES.includes(header.toLowerCase().replace(/[^a-z]/g, ''))) {
              value = formatDateString(value);
            }

            // Handle nilai null/undefined
            if (value === null || value === undefined) return '';
            // Jika nilai mengandung koma, kutip nilai tersebut
            const stringValue = String(value);
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      // Dapatkan nama file berdasarkan filter aktif
      const fileName = getExportFileName('csv');

      // Buat blob dan link untuk download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);

      console.log('File CSV siap diunduh');
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Export CSV selesai');
      }, 100);

      return true;
    } catch (error) {
      console.error('Error saat mengekspor CSV:', error);
      alert('Terjadi kesalahan saat mengekspor CSV: ' + error.message);
      return false;
    }
  };

  // Fungsi untuk ekspor data ke Excel (XLSX)
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      console.log('Tidak ada data untuk diekspor');
      return false;
    }

    try {
      console.log('Memulai ekspor ke Excel...');

      // Cek ketersediaan XLSX library
      if (typeof window.XLSX === 'undefined') {
        console.log('Library XLSX belum dimuat, memuat library...');
        // Load SheetJS library jika belum tersedia
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => {
          console.log('Library XLSX berhasil dimuat, melanjutkan ekspor');
          performExcelExport();
        };
        script.onerror = (error) => {
          console.error('Gagal memuat library XLSX:', error);
          alert('Gagal memuat library Excel. Silakan gunakan opsi CSV atau coba lagi nanti.');
        };
        document.body.appendChild(script);
      } else {
        console.log('Library XLSX tersedia, melanjutkan ekspor');
        performExcelExport();
      }
      return true;
    } catch (error) {
      console.error('Error saat mempersiapkan ekspor Excel:', error);
      alert('Terjadi kesalahan saat mempersiapkan ekspor Excel: ' + error.message);
      return false;
    }
  };

  // Fungsi untuk melakukan ekspor Excel
  const performExcelExport = () => {
    try {
      console.log('Melakukan ekspor Excel...');

      if (typeof window.XLSX === 'undefined') {
        console.error('Library XLSX tidak tersedia');
        alert('Library Excel tidak tersedia. Silakan gunakan opsi CSV atau coba lagi nanti.');
        return false;
      }

      const XLSX = window.XLSX;

      // Persiapkan header dan data
      const headers = columns.map(col => col.label);
      console.log('Headers Excel:', headers);

      // Siapkan data dengan mengganti nilai remark dari localStorage jika ada
      const formattedData = sortedData.map(row => {
        const formattedRow = {};
        columns.forEach(col => {
          let value = row[col.id];

          // Gunakan nilai remark dari localStorage jika yang diedit
          if (col.id.toLowerCase() === 'remark') {
            value = getRemarkValue(row, col.id);
          }

          // Handle nilai null/undefined
          formattedRow[col.label] = value === null || value === undefined ? '' : value;
        });
        return formattedRow;
      });

      console.log(`Mengekspor ${formattedData.length} baris data ke Excel`);

      // Dapatkan nama file berdasarkan filter aktif
      const fileName = getExportFileName('xlsx');

      // Buat workbook baru
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Ekspor ke file
      XLSX.writeFile(workbook, fileName);
      console.log('File Excel berhasil dibuat');
      return true;
    } catch (error) {
      console.error('Error saat mengekspor Excel:', error);
      alert('Terjadi kesalahan saat mengekspor Excel: ' + error.message);
      return false;
    }
  };

  // Fungsi alternatif untuk ekspor data jika cara utama gagal
  const downloadDataAsCSV = (data, filename = null) => {
    try {
      console.log('Menggunakan fungsi alternatif untuk ekspor CSV...');

      if (!data || data.length === 0) {
        console.log('Tidak ada data untuk diekspor');
        return false;
      }

      // Format nama file jika tidak diberikan
      if (!filename) {
        filename = getExportFileName('csv');
      }

      // Ekstrak kolom dari data pertama
      const headers = Object.keys(data[0]);

      // Buat konten CSV
      let csvContent = headers.join(',') + '\n';

      // Tambahkan baris data
      data.forEach(row => {
        const rowData = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';

          // Escape tanda kutip dan karakter khusus
          const cellValue = String(value).replace(/"/g, '""');

          // Bungkus dengan tanda kutip jika berisi koma, newline, atau tanda kutip
          if (cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"')) {
            return `"${cellValue}"`;
          }
          return cellValue;
        });

        csvContent += rowData.join(',') + '\n';
      });

      // Buat blob dan link download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Gunakan metode alternatif untuk browser yang tidak mendukung URL.createObjectURL
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        console.log('Ekspor CSV menggunakan msSaveOrOpenBlob berhasil');
        return true;
      }

      try {
        // Metode standar dengan URL.createObjectURL
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 200);

        console.log('Ekspor CSV menggunakan URL.createObjectURL berhasil');
        return true;
      } catch (error) {
        console.error('Error saat ekspor dengan URL.createObjectURL:', error);

        // Metode fallback dengan data URI (kurang efisien untuk file besar)
        if (csvContent.length < 2000000) { // Batasi untuk konten < 2MB
          const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
          }, 200);

          console.log('Ekspor CSV menggunakan data URI berhasil');
          return true;
        } else {
          console.error('File terlalu besar untuk metode data URI');
          return false;
        }
      }
    } catch (error) {
      console.error('Error pada fungsi alternatif ekspor CSV:', error);
      return false;
    }
  };

  // Fungsi untuk ekspor data ke format dari fitur Explorer
  const handleExport = (format) => {
    console.log(`Memulai ekspor dalam format: ${format}`);
    try {
      if (format === 'csv') {
        const success = exportToCSV();
        if (success === false) {
          // Jika metode utama gagal, coba metode alternatif
          console.log('Mencoba metode ekspor alternatif...');

          // Dapatkan nama file berdasarkan filter aktif
          const fileName = getExportFileName('csv');

          if (!downloadDataAsCSV(sortedData, fileName)) {
            alert('Gagal mengekspor data ke CSV. Silakan coba lagi nanti.');
          }
        }
      } else if (format === 'excel') {
        exportToExcel();
      }
    } catch (error) {
      console.error(`Error saat menangani ekspor ${format}:`, error);
      alert(`Terjadi kesalahan saat mengekspor ke ${format}. Silakan coba lagi.`);
    }
  };

  // Effect untuk mendeteksi perubahan tema
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    // Update state ketika isDarkMode berubah
    setDarkMode(isDarkMode);
    console.log('Theme updated:', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Effect untuk menerapkan filter eksternal dari activeFilters
  useEffect(() => {
    if (activeFilters && activeFilters.length > 0) {
      console.log("🔍 External filters received:", activeFilters);

      // Buat struktur filter baru dari activeFilters
      const newColumnFilters = { ...columnFilters };

      // Buat set untuk melacak filter yang sudah diproses
      const processedFilters = new Set();

      // Proses setiap filter
      activeFilters.forEach(filter => {
        const { column, value } = filter;

        // Buat kunci unik untuk filter ini
        const filterKey = `${column}:${value}`;

        // Lewati jika filter ini sudah diproses
        if (processedFilters.has(filterKey)) {
          console.log(`  Skipping duplicate filter: ${column} = ${value}`);
          return;
        }

        processedFilters.add(filterKey);
        console.log(`  Processing filter: ${column} = ${value}`);

        // Cari kolom yang sesuai di data
        const columnId = columns.find(col =>
          col.id === column ||
          col.label === column ||
          col.id.toLowerCase().replace(/_/g, '') === column.toLowerCase().replace(/_/g, '')
        )?.id;

        console.log(`  Mapped to column ID: ${columnId}`);

        if (columnId) {
          // Jika kolom ditemukan, tambahkan ke filter
          if (!newColumnFilters[columnId]) {
            newColumnFilters[columnId] = [];
          }

          if (Array.isArray(newColumnFilters[columnId])) {
            // Tambahkan nilai filter jika belum ada (cek dengan case-insensitive)
            const normalizedValues = newColumnFilters[columnId].map(v => String(v).toLowerCase());
            if (!normalizedValues.includes(String(value).toLowerCase())) {
              newColumnFilters[columnId] = [...newColumnFilters[columnId], value];
            }
          } else if (String(newColumnFilters[columnId]).toLowerCase() !== String(value).toLowerCase()) {
            // Jika sudah ada nilai lain, konversi ke array
            newColumnFilters[columnId] = [newColumnFilters[columnId], value];
          }
        }

        // Kasus khusus untuk filter Remark dengan NULL
        if (column === 'Remark' && value === 'NULL') {
          console.log("  Handling special case: Remark NULL");
          if (!newColumnFilters['Remark']) {
            newColumnFilters['Remark'] = [];
          }

          if (Array.isArray(newColumnFilters['Remark'])) {
            const hasEmptyValue = newColumnFilters['Remark'].some(v =>
              v === '' || v === null || v === undefined
            );

            if (!hasEmptyValue) {
              newColumnFilters['Remark'].push('');
            }
          }
        }
      });

      console.log("📋 Applied column filters:", newColumnFilters);
      // Terapkan filter baru
      setColumnFilters(newColumnFilters);
    }
  }, [activeFilters, columns]);

  // Log perubahan pada filteredData
  useEffect(() => {
    if (data && data.length > 0 && filteredData) {
      console.log(`📊 Filtering results: ${filteredData.length} out of ${data.length} rows`);
    }
  }, [data, filteredData]);

  // Function to handle bulk updates
  const handleBulkUpdate = async (updates) => {
    const updatedRemarks = { ...remarks };
    let successCount = 0;
    for (const update of updates) {
      const matchingRow = data.find(row => (row['Order Number'] || row.SystemRefId) === update.id);
      if (matchingRow) {
        try {
          await api.post('/monitoring/remark', {
            system_ref_id: update.id,
            remark: update.remark
          });
          // Update local state only if backend update succeeds
          updatedRemarks[update.id] = update.remark;
          successCount++;
        } catch (err) {
          console.error('Failed to update remark for', update.id, err);
        }
      }
    }
    setRemarks(updatedRemarks);
    setShowBulkUpdateModal(false);
    showNotification(`Berhasil update ${successCount} remark ke server`, 'success');
  };

  // Handler untuk pemilihan kolom
  const handleColumnSelect = (columnId, event) => {
    // Cek apakah Ctrl/Cmd key ditekan
    if (event.ctrlKey || event.metaKey) {
      // Toggle kolom yang dipilih
      setSelectedColumns(prev => {
        if (prev.includes(columnId)) {
          return prev.filter(id => id !== columnId);
        } else {
          return [...prev, columnId];
        }
      });
      lastSelectedColumnRef.current = columnId;
    }
    // Cek apakah Shift key ditekan
    else if (event.shiftKey && lastSelectedColumnRef.current) {
      // Pilih range kolom
      const visibleColumns = columns.map(col => col.id);
      const lastIndex = visibleColumns.indexOf(lastSelectedColumnRef.current);
      const currentIndex = visibleColumns.indexOf(columnId);

      if (lastIndex > -1 && currentIndex > -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const columnsInRange = visibleColumns.slice(start, end + 1);

        setSelectedColumns(prev => {
          // Merge kolom yang sudah dipilih dengan range baru
          const merged = [...new Set([...prev, ...columnsInRange])];
          return merged;
        });
      }
    }
    // Jika tidak ada tombol modifier yang ditekan
    else {
      // Jika kolom sudah dipilih dan hanya itu satu-satunya, hapus pilihan
      if (selectedColumns.length === 1 && selectedColumns[0] === columnId) {
        setSelectedColumns([]);
      } else {
        // Pilih hanya kolom ini
        setSelectedColumns([columnId]);
        lastSelectedColumnRef.current = columnId;
      }
    }
  };

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });

    // Auto hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fungsi fallback untuk menyalin teks ke clipboard menggunakan document.execCommand
  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Menyembunyikan textarea dari pandangan
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showNotification('✅ Kolom berhasil disalin ke clipboard!');
      } else {
        console.error('Gagal menyalin menggunakan execCommand');
        showNotification('❌ Gagal menyalin data', 'error');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      showNotification('❌ Gagal menyalin data: ' + err.message, 'error');
    }

    document.body.removeChild(textArea);
  };

  // Fungsi untuk menyalin data dari kolom yang dipilih ke clipboard
  const copySelectedColumnsToClipboard = () => {
    if (selectedColumns.length === 0) return;

    try {
      // Ambil data yang sudah difilter dan diurutkan
      const dataToCopy = paginatedData;

      // Ambil header kolom yang dipilih
      const selectedColumnHeaders = columns
        .filter(col => selectedColumns.includes(col.id))
        .map(col => col.label);

      // Format data
      // Buat variabel dengan header untuk digunakan jika diperlukan di masa mendatang
      const headerRow = selectedColumnHeaders.join('\t');

      // Mulai dengan string kosong, tanpa header
      let csvContent = '';

      // Tambahkan baris data
      dataToCopy.forEach(row => {
        const rowValues = selectedColumns.map(columnId => {
          const value = columnId === 'Remark' ? getRemarkValue(row, columnId) : row[columnId];
          return value !== null && value !== undefined ? value : '';
        });
        csvContent += rowValues.join('\t') + '\n';
      });

      // Salin ke clipboard, cek dulu apakah Clipboard API tersedia di secure context
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(csvContent)
          .then(() => {
            showNotification('✅ Kolom berhasil disalin ke clipboard!');
          })
          .catch(err => {
            console.error('Gagal menyalin ke clipboard:', err);
            // Jika gagal menggunakan API, coba metode fallback
            fallbackCopyToClipboard(csvContent);
          });
      } else {
        // Gunakan metode fallback jika Clipboard API tidak tersedia
        fallbackCopyToClipboard(csvContent);
      }
    } catch (error) {
      console.error('Error copying data:', error);
      showNotification('❌ Terjadi kesalahan saat menyalin data', 'error');
    }
  };

  // Fungsi untuk menghapus pilihan kolom
  const clearSelectedColumns = () => {
    setSelectedColumns([]);
    lastSelectedColumnRef.current = null;
  };

  // Fungsi untuk mendeteksi mode gelap/terang menggunakan hook useTheme
  useEffect(() => {
    // Dark mode sudah dideteksi melalui hook useTheme
    console.log('Theme updated:', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle compact view
  const toggleCompactView = () => {
    setIsCompactView(prev => !prev);

    // Simpan preferensi ke localStorage
    try {
      localStorage.setItem('table_compact_view', !isCompactView);
    } catch (error) {
      console.error('Error saving compact view preference:', error);
    }
  };

  // Load preferensi compact view dari localStorage saat komponen mount
  useEffect(() => {
    try {
      const savedCompactView = localStorage.getItem('table_compact_view');
      if (savedCompactView !== null) {
        setIsCompactView(savedCompactView === 'true');
      }
    } catch (error) {
      console.error('Error loading compact view preference:', error);
    }
  }, []);

  // Efek untuk memperbarui rowsPerPage saat showAllData berubah atau filteredData berubah
  useEffect(() => {
    if (showAllData && filteredData) {
      setRowsPerPage(filteredData.length || data.length);
    }
  }, [showAllData, filteredData, data]);

  // Tambahkan useEffect untuk memastikan setiap item data memiliki field Remark
  useEffect(() => {
    if (data && data.length > 0) {
      const needsRemark = data.some(item => !('Remark' in item));
      if (needsRemark) {
        data.forEach(item => {
          if (!('Remark' in item)) item.Remark = null;
        });
      }
    }
  }, [data]);

  // Tambahkan useEffect untuk normalisasi field Remark
  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(item => {
        if (!('Remark' in item) && 'remark' in item) {
          item.Remark = item.remark;
        }
        if (!('Remark' in item)) {
          item.Remark = null;
        }
      });
    }
  }, [data]);

  if (loading) {
    return <TableSkeleton columns={visibleColumns.length || 6} rows={10} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>Tidak ada data untuk ditampilkan</p>
      </div>
    );
  }

  // Menentukan apakah ada filter aktif
  const hasActiveFilters = searchTerm.trim() !== '' || Object.keys(columnFilters).length > 0;

  // Menentukan apakah ada filter eksternal
  const hasExternalFilters = activeFilters && activeFilters.length > 0;

  // Fungsi untuk menangani navigasi keyboard antar sel
  const handleKeyDown = (e, rowIndex, colIndex) => {
    const totalRows = paginatedData.length;
    const totalCols = columns.length;
    const currentColumn = columns[colIndex];

    // Jika sedang dalam mode edit
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl + Enter: simpan tanpa pindah
          handleSaveEdit(rowIndex, currentColumn.id, e.target.value);
        } else {
          // Enter: simpan dan pindah ke sel bawah
          handleSaveEdit(rowIndex, currentColumn.id, e.target.value);
          if (rowIndex < totalRows - 1) {
            setActiveCell({ rowIndex: rowIndex + 1, colIndex });
            document.getElementById(`cell-${rowIndex + 1}-${colIndex}`)?.focus();
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
        return;
      }
      // Biarkan event keyboard lainnya untuk input text
      return;
    }

    // Jika tidak dalam mode edit
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (currentColumn.id === 'Remark') {
          handleCellEdit(rowIndex, currentColumn.id, getRemarkValue(paginatedData[rowIndex], currentColumn.id));
        }
        break;
      case 'F2':
        e.preventDefault();
        if (currentColumn.id === 'Remark') {
          handleCellEdit(rowIndex, currentColumn.id, getRemarkValue(paginatedData[rowIndex], currentColumn.id));
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Tab: pindah ke sel kiri
          if (colIndex > 0) {
            setActiveCell({ rowIndex, colIndex: colIndex - 1 });
            document.getElementById(`cell-${rowIndex}-${colIndex - 1}`)?.focus();
          } else if (rowIndex > 0) {
            // Jika di kolom pertama, pindah ke kolom terakhir baris sebelumnya
            setActiveCell({ rowIndex: rowIndex - 1, colIndex: totalCols - 1 });
            document.getElementById(`cell-${rowIndex - 1}-${totalCols - 1}`)?.focus();
          }
        } else {
          // Tab: pindah ke sel kanan
          if (colIndex < totalCols - 1) {
            setActiveCell({ rowIndex, colIndex: colIndex + 1 });
            document.getElementById(`cell-${rowIndex}-${colIndex + 1}`)?.focus();
          } else if (rowIndex < totalRows - 1) {
            // Jika di kolom terakhir, pindah ke kolom pertama baris berikutnya
            setActiveCell({ rowIndex: rowIndex + 1, colIndex: 0 });
            document.getElementById(`cell-${rowIndex + 1}-0`)?.focus();
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setActiveCell({ rowIndex: rowIndex - 1, colIndex });
          document.getElementById(`cell-${rowIndex - 1}-${colIndex}`)?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, colIndex });
          document.getElementById(`cell-${rowIndex + 1}-${colIndex}`)?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          setActiveCell({ rowIndex, colIndex: colIndex - 1 });
          document.getElementById(`cell-${rowIndex}-${colIndex - 1}`)?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < totalCols - 1) {
          setActiveCell({ rowIndex, colIndex: colIndex + 1 });
          document.getElementById(`cell-${rowIndex}-${colIndex + 1}`)?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl + Home: ke sel pertama
          setActiveCell({ rowIndex: 0, colIndex: 0 });
          document.getElementById(`cell-0-0`)?.focus();
        } else {
          // Home: ke awal baris
          setActiveCell({ rowIndex, colIndex: 0 });
          document.getElementById(`cell-${rowIndex}-0`)?.focus();
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl + End: ke sel terakhir
          setActiveCell({ rowIndex: totalRows - 1, colIndex: totalCols - 1 });
          document.getElementById(`cell-${totalRows - 1}-${totalCols - 1}`)?.focus();
        } else {
          // End: ke akhir baris
          setActiveCell({ rowIndex, colIndex: totalCols - 1 });
          document.getElementById(`cell-${rowIndex}-${totalCols - 1}`)?.focus();
        }
        break;
    }
  };


  // Modifikasi renderCellValue untuk menggunakan RemarkInput yang dioptimasi
  const renderCellValue = (value, row, column, rowIndex) => {
    if (column.editable) {
      const isEditing = editingCell &&
        editingCell.rowIndex === rowIndex &&
        editingCell.columnId === column.id;

      // Ambil nilai remark dari localStorage atau data asli                  
      const displayValue = getRemarkValue(row, column.id);

      if (isEditing) {
        return (
          <RemarkInput
            value={displayValue}
            onSave={(newValue) => handleSaveEdit(rowIndex, column.id, newValue)}
            onCancel={handleCancelEdit}
            isDarkMode={isDarkMode}
            rowIndex={rowIndex}
            colIndex={columns.findIndex(col => col.id === column.id)}
            onKeyDown={handleKeyDown}
          />
        );
      }

      const isEdited = displayValue !== row[column.id];

      return (
        <div
          className={`group cursor-pointer px-2 py-1 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded ${isEdited ? `font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}` : ''
            } ${THEME_TRANSITIONS.default} hover:bg-blue-100 dark:hover:bg-blue-800/30 w-full truncate`}
          onClick={() => handleCellEdit(rowIndex, column.id, displayValue)}
          title={`Klik untuk mengedit (atau tekan Enter/F2)\n${displayValue !== null && displayValue !== undefined ? String(displayValue) : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 truncate">
              {displayValue === null || displayValue === undefined ?
                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} italic text-xs ${THEME_TRANSITIONS.default}`}>
                  Klik untuk menambahkan
                </span> :
                <span className="truncate">{String(displayValue)}</span>
              }
            </div>
            <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {isEdited && <span className="text-xs mr-1">✏️</span>}
              <span className="text-xs text-gray-500">⌨️</span>
            </div>
          </div>
        </div>
      );
    }

    if (value === null || value === undefined) {
      return (
        <div className="truncate w-full" title="NULL">
          <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} italic text-xs ${THEME_TRANSITIONS.default}`}>NULL</span>
        </div>
      );
    }

    if (typeof value === 'boolean') {
      const text = value ? 'Ya' : 'Tidak';
      return <div className="truncate w-full" title={text}>{text}</div>;
    }

    if (DATE_COLUMN_NAMES.includes(column.label.toLowerCase().replace(/[^a-z]/g, '')) ||
      DATE_COLUMN_NAMES.includes(column.id.toLowerCase().replace(/[^a-z]/g, '')) ||
      value instanceof Date) {
      const formattedDate = formatDateString(value);
      return <div className="truncate w-full" title={formattedDate}>{formattedDate}</div>;
    }

    // Khusus untuk SystemRefId, hilangkan spasi dan baris baru
    if (column.id === 'SystemRefId') {
      const text = String(value).replace(/\s+/g, '');
      return <div className="truncate w-full" title={text}>{text}</div>;
    }

    // Pewarnaan kondisional berdasarkan jenis kolom dan nilai
    if (column.id === 'Status_Interfaced' || column.id === 'Status Interfaced') {
      const strValue = String(value);
      if (strValue.toLowerCase() === 'yes' || strValue.toLowerCase() === 'ya') {
        return (
          <div className="truncate w-full" title={strValue}>
            <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
          </div>
        );
      } else if (strValue.toLowerCase() === 'no' || strValue.toLowerCase() === 'tidak') {
        return (
          <div className="truncate w-full" title={strValue}>
            <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
          </div>
        );
      }
      return <div className="truncate w-full" title={strValue}>{strValue}</div>;
    }

    const strValue = String(value);
    return <div className="truncate w-full" title={strValue}>{strValue}</div>;
  };

  // Fokus ke sel aktif saat berubah
  useEffect(() => {
    if (activeCell) {
      const cellElement = document.getElementById(`cell-${activeCell.rowIndex}-${activeCell.colIndex}`);
      if (cellElement) {
        cellElement.focus();
        // Scroll ke sel yang aktif jika tidak terlihat
        cellElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeCell]);

  return (
    <div className="relative">
      {/* Bulk Update Modal */}
      <BulkRemarkUpdate
        open={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        onUpdate={handleBulkUpdate}
        data={data}
      />

      {/* Table Wrapper */}
      <div className={`w-full ${THEME_COLORS.card.light} ${THEME_COLORS.card.dark} rounded-lg overflow-hidden shadow-sm ${THEME_TRANSITIONS.default}`}>
        {/* Table Header */}
        <div className={`px-4 py-3 flex flex-wrap items-center justify-between ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          } border-b ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${THEME_TRANSITIONS.default}`}>
          <div className="flex items-center gap-2 mb-3 md:mb-0">
            <div className={`text-sm font-medium ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
              {data.length} transaksi {filteredData.length !== data.length && `(${filteredData.length} difilter)`}
            </div>

            {/* Tombol Refresh */}
            {onRefresh && (
              <button
                onClick={() => {
                  // Tampilkan notifikasi bahwa refresh sedang berlangsung
                  showNotification('🔄 Memperbarui data...', 'info');
                  // Panggil fungsi onRefresh
                  onRefresh();
                }}
                disabled={loading}
                className={`px-2 py-1 text-xs rounded-md border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} flex items-center space-x-1 ${THEME_TRANSITIONS.default}`}
                title="Perbarui data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            )}

            {/* Column customizer */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowColumnCustomizer(true)}
                className={`px-2 py-1 text-xs rounded-md border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                  } ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} flex items-center space-x-1 ${THEME_TRANSITIONS.default}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Kolom</span>
              </button>

              {showColumnCustomizer && (
                <div className="absolute left-0 top-full mt-1 z-50">
                  <ColumnCustomizer
                    isOpen={showColumnCustomizer}
                    onClose={() => setShowColumnCustomizer(false)}
                    columns={allColumns}
                    visibleColumns={visibleColumnIds.length > 0 ? visibleColumnIds : allColumns.map(col => col.id)}
                    onApply={handleColumnVisibilityChange}
                  />
                </div>
              )}
            </div>

            {/* Compact View Toggle */}
            <button
              onClick={toggleCompactView}
              className={`px-2 py-1 text-xs rounded-md border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                } ${isCompactView ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''} ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} flex items-center space-x-1 ${THEME_TRANSITIONS.default}`}
              title={isCompactView ? "Tampilan Normal" : "Tampilan Compact"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>{isCompactView ? "Tampilan Normal" : "Tampilan Compact"}</span>
            </button>

            {/* Bulk update remarks */}
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className={`px-2 py-1 text-xs rounded-md border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                } ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} flex items-center space-x-1 ${THEME_TRANSITIONS.default}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
              </svg>
              <span>Edit Remark</span>
            </button>

            {/* Multi-column select help */}
            <button
              onClick={() => setShowColumnHelpDialog(true)}
              className={`px-2 py-1 text-xs rounded-md border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                } ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} flex items-center space-x-1 ${THEME_TRANSITIONS.default}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Multi-Kolom</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="mt-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari data..."
                className={`w-full px-2 py-1 pl-7 text-xs border ${THEME_COLORS.inputBorder.light} ${THEME_COLORS.inputBorder.dark} rounded ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
                  } ${THEME_TRANSITIONS.default}`}
              />
              <div className={`absolute left-2 top-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ${THEME_TRANSITIONS.default}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Ganti export dropdown dengan 2 tombol terpisah */}
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
              title="Export ke CSV"
              disabled={loading || data.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded border border-green-500 bg-green-500 text-white hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-500"
              title="Export ke Excel"
              disabled={loading || data.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel
            </button>

            {/* Page size selector with "Show All" option */}
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Tampilkan:</span>
              <select
                value={showAllData ? 'all' : rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {[25, 50, 100, 200, 500].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
                <option value="all">Semua</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active filters display */}
        {(hasActiveFilters || hasExternalFilters) && (
          <div className="bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs flex flex-wrap items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Filter aktif:</span>

            {/* Kita akan menggabungkan semua filter berdasarkan kolom */}
            {(() => {
              // Gabungkan filter eksternal dan filter kolom
              const combinedFilters = {};

              // Proses filter eksternal
              if (hasExternalFilters) {
                activeFilters.forEach(filter => {
                  const { column, value } = filter;
                  // Cari kolom yang sesuai di data
                  const matchingColumn = columns.find(col =>
                    col.id === column ||
                    col.label === column ||
                    col.id.toLowerCase().replace(/_/g, '') === column.toLowerCase().replace(/_/g, '')
                  );
                  const columnId = matchingColumn?.id || column;

                  if (!combinedFilters[columnId]) {
                    combinedFilters[columnId] = new Set();
                  }
                  combinedFilters[columnId].add(value);
                });
              }

              // Proses filter kolom
              Object.entries(columnFilters).forEach(([columnId, values]) => {
                if (!combinedFilters[columnId]) {
                  combinedFilters[columnId] = new Set();
                }

                const filterValues = Array.isArray(values) ? values : [values];
                filterValues.forEach(value => {
                  combinedFilters[columnId].add(value);
                });
              });

              // Tampilkan filter yang sudah digabungkan
              return Object.entries(combinedFilters).map(([columnId, valuesSet]) => {
                const column = columns.find(col => col.id === columnId);
                const filterValues = Array.from(valuesSet);

                if (filterValues.length === 0) return null;

                return (
                  <span
                    key={columnId}
                    className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded flex items-center"
                  >
                    <span className="mr-1">
                      {column?.label || columnId}:
                    </span>
                    {filterValues.length === 1 ? (
                      <span>{filterValues[0]}</span>
                    ) : (
                      <span>{filterValues.length} dipilih</span>
                    )}
                    <button
                      onClick={() => handleColumnFilterChange(columnId, [])}
                      className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                );
              });
            })()}

            {/* Tampilkan filter pencarian global jika ada */}
            {searchTerm.trim() !== '' && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded flex items-center">
                Global: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              Hapus semua
              {/* Tambahkan badge kecil jika ada filter eksternal */}
              {(hasExternalFilters || Object.keys(columnFilters).length > 0) && (
                <span className="ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-[9px] px-1 rounded-full">
                  {(hasExternalFilters ? activeFilters.length : 0) + Object.keys(columnFilters).length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium">Tidak ada data yang cocok</p>
            <p className="mt-1 text-xs">Coba ubah kriteria pencarian Anda</p>
            {(searchTerm || Object.keys(columnFilters).length > 0) && (
              <button
                onClick={clearAllFilters}
                className="mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
              >
                Hapus Semua Filter
              </button>
            )}
          </div>
        )}

        {/* Tombol Salin Multi Kolom */}
        {selectedColumns.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">{selectedColumns.length}</span> kolom dipilih
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearSelectedColumns}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Batal
              </button>
              <button
                onClick={copySelectedColumnsToClipboard}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin Kolom Terpilih
              </button>
            </div>
          </div>
        )}

        {/* Notifikasi */}
        {notification.show && (
          <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {notification.message}
          </div>
        )}

        {/* Table Responsive Container */}
        {filteredData.length > 0 && (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} text-xs ${THEME_TRANSITIONS.default}`}>
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${THEME_TRANSITIONS.default} sticky top-0 z-10`}>
                <tr>
                  {columns.map((column, colIndex) => (
                    <th
                      key={column.id}
                      scope="col"
                      className={`${isCompactView ? 'px-2 py-1' : 'px-3 py-2'} text-xs font-medium text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        } select-none cursor-pointer ${selectedColumns.includes(column.id) ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100') : ''
                        } ${THEME_TRANSITIONS.default} w-[180px] min-w-[180px] max-w-[180px]`}
                      onClick={(e) => handleColumnSelect(column.id, e)}
                      title="Klik untuk memilih kolom. Gunakan Ctrl+klik untuk multi-pilih atau Shift+klik untuk memilih rentang kolom."
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {sortConfig.key === column.id && (
                            <span className="mr-1 text-blue-500">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          <span className="truncate">{column.label}</span>
                        </div>

                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Hindari trigger event klik header
                              handleSort(column.id);
                            }}
                            title={`Urutkan ${sortConfig.key === column.id && sortConfig.direction === 'asc' ? 'menurun' : 'menaik'}`}
                            className={`p-0.5 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded ${THEME_TRANSITIONS.default}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </button>

                          {column.filterable && (
                            <div
                              className="relative"
                              onClick={(e) => {
                                e.stopPropagation(); // Hindari trigger event klik header
                              }}
                            >
                              <button
                                className={`p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded ${columnFilters[column.id] && columnFilters[column.id].length > 0
                                  ? 'text-blue-500 dark:text-blue-400'
                                  : 'text-gray-400 dark:text-gray-500'
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent column selection
                                  setOpenFilterDropdown(openFilterDropdown === column.id ? null : column.id);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                              </button>

                              {columnFilters[column.id] && columnFilters[column.id].length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center text-[9px] font-semibold">
                                  {columnFilters[column.id].length}
                                </span>
                              )}

                              {openFilterDropdown === column.id && (
                                <AdvancedFilterDropdown
                                  isOpen={true}
                                  onClose={() => setOpenFilterDropdown(null)}
                                  options={filterOptions[column.id] || []}
                                  selectedValues={columnFilters[column.id] || []}
                                  onApply={(values) => handleColumnFilterChange(column.id, values)}
                                  title={`Filter: ${column.label}`}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${THEME_TRANSITIONS.default}`}>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className={`${rowIndex % 2 === 0
                      ? (isDarkMode ? 'bg-[#111827]' : 'bg-white')
                      : (isDarkMode ? 'bg-[#1f2937]' : 'bg-gray-50')
                      } ${THEME_TRANSITIONS.default} ${isCompactView ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''}`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        id={`cell-${rowIndex}-${colIndex}`}
                        tabIndex="0"
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        className={`${isCompactView ? 'px-2 py-1' : 'px-3 py-2'} whitespace-nowrap ${isCompactView ? 'text-xs' : 'text-sm'
                          } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          } ${selectedColumns.includes(column.id)
                            ? (isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50')
                            : ''
                          } ${activeCell && activeCell.rowIndex === rowIndex && activeCell.colIndex === colIndex
                            ? 'outline outline-2 outline-blue-500 dark:outline-blue-400 relative z-10'
                            : ''
                          } ${THEME_TRANSITIONS.default} focus:outline-blue-500 focus:outline-2 focus:z-10 w-[180px] min-w-[180px] max-w-[180px]`}
                      >
                        {renderCellValue(
                          column.id === 'Remark' ? getRemarkValue(row, column.id) : row[column.id],
                          row,
                          column,
                          rowIndex
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - hide if showing all data */}
        {!showAllData && filteredData.length > 0 && (
          <div className={`px-2 py-1.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-t ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} flex items-center justify-between text-xs ${THEME_TRANSITIONS.default}`}>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className={`text-xs ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
                  Menampilkan <span className="font-medium">{paginatedData.length}</span> dari{' '}
                  <span className="font-medium">{filteredData.length}</span> hasil
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className={`px-1.5 py-0.5 text-xs rounded-md ${currentPage === 0
                    ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') + ' cursor-not-allowed'
                    : (isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    } ${THEME_TRANSITIONS.default}`}
                >
                  &laquo;
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`px-1.5 py-0.5 text-xs rounded-md ${currentPage === 0
                    ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') + ' cursor-not-allowed'
                    : (isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    } ${THEME_TRANSITIONS.default}`}
                >
                  &lt;
                </button>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Halaman <span className="font-medium">{currentPage + 1}</span> dari{' '}
                  <span className="font-medium">{totalPages || 1}</span>
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-1.5 py-0.5 text-xs rounded-md ${currentPage >= totalPages - 1
                    ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') + ' cursor-not-allowed'
                    : (isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    } ${THEME_TRANSITIONS.default}`}
                >
                  &gt;
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-1.5 py-0.5 text-xs rounded-md ${currentPage >= totalPages - 1
                    ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') + ' cursor-not-allowed'
                    : (isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    } ${THEME_TRANSITIONS.default}`}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex justify-between items-center px-4 py-2 border-t ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${isDarkMode ? 'bg-gray-700' : 'bg-white'
          } text-xs ${THEME_TRANSITIONS.default}`}>
          <div className="flex items-center">
            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${THEME_TRANSITIONS.default}`}>
              {showAllData ? (
                `Menampilkan semua ${sortedData.length} baris data`
              ) : (
                `Menampilkan ${paginatedData.length ? (currentPage * rowsPerPage) + 1 : 0}-${Math.min((currentPage + 1) * rowsPerPage, sortedData.length)} dari ${sortedData.length} baris`
              )}
              {data && sortedData && data.length !== sortedData.length && (
                <span className={`ml-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'} ${THEME_TRANSITIONS.default}`}>
                  (difilter dari {data.length} total)
                </span>
              )}
              {activeFilters && activeFilters.length > 0 && (
                <span className={`ml-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} ${THEME_TRANSITIONS.default}`}>
                  | Filter StatusCards: {activeFilters.map(f => `${f.column}=${f.value}`).join(', ')}
                </span>
              )}
              {isCompactView && (
                <span className={`ml-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} ${THEME_TRANSITIONS.default}`}>
                  | Mode Compact aktif
                </span>
              )}
            </span>
          </div>

          {showAllData && (
            <div>
              <button
                onClick={() => {
                  setShowAllData(false);
                  setRowsPerPage(25);
                }}
                className={`px-2 py-1 text-xs rounded-md ${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Kembali ke tampilan halaman
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-column help dialog */}
      {showColumnHelpDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowColumnHelpDialog(false)}>
          <div className={`${THEME_COLORS.card.light} ${THEME_COLORS.card.dark} rounded-lg shadow-xl max-w-md w-full m-4 ${THEME_TRANSITIONS.default}`} onClick={e => e.stopPropagation()}>
            <div className={`p-4 border-b ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} ${THEME_TRANSITIONS.default}`}>
              <h3 className={`text-lg font-medium ${THEME_COLORS.text.primary.light} ${THEME_COLORS.text.primary.dark} flex items-center ${THEME_TRANSITIONS.default}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cara Penggunaan Multi-Kolom
              </h3>
            </div>
            <div className="p-4">
              <div className={`space-y-3 text-sm ${THEME_COLORS.text.secondary.light} ${THEME_COLORS.text.secondary.dark} ${THEME_TRANSITIONS.default}`}>
                <p>Fitur ini memungkinkan Anda untuk memilih dan menyalin beberapa kolom secara bersamaan:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Klik pada header kolom</strong> untuk memilih satu kolom.
                  </li>
                  <li>
                    <strong>Ctrl + Klik</strong> (atau <strong>⌘ Cmd + Klik</strong> di Mac) untuk memilih beberapa kolom secara individual.
                  </li>
                  <li>
                    <strong>Shift + Klik</strong> untuk memilih rentang kolom berurutan.
                  </li>
                  <li>
                    Kolom yang dipilih akan disorot dengan warna biru.
                  </li>
                  <li>
                    Klik tombol <strong>"Salin Kolom Terpilih"</strong> yang muncul untuk menyalin data ke clipboard.
                  </li>
                  <li>
                    Hasil salinan dapat langsung di-paste ke Excel, Google Sheets, atau aplikasi lainnya.
                  </li>
                </ul>
                <p className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} font-medium ${THEME_TRANSITIONS.default}`}>
                  Tips: Gunakan fitur ini untuk mempermudah analisis data di spreadsheet.
                </p>
              </div>
            </div>
            <div className={`p-4 border-t ${THEME_COLORS.border.light} ${THEME_COLORS.border.dark} flex justify-end ${THEME_TRANSITIONS.default}`}>
              <button
                onClick={() => setShowColumnHelpDialog(false)}
                className="px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryResultTable; 