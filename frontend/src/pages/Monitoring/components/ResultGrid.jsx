import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { useVirtualizer } from '@tanstack/react-virtual';

// Icon components
const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const SortUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const SortDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ExcelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ResultGrid = ({ data = [], loading = false, title = "Query Result" }) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [copiedCell, setCopiedCell] = useState(null);
  const [copyTooltip, setCopyTooltip] = useState({ show: false, x: 0, y: 0 });
  
  // Reference untuk tabel
  const tableContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  
  // Memori untuk menghindari re-render yang tidak perlu
  const defaultData = useMemo(() => [], []);
  
  // Memori untuk kolom tabel
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Ambil sampel data pertama untuk mendapatkan kolom
    const sample = data[0];
    return Object.keys(sample).map(key => ({
      id: key,
      accessorKey: key,
      header: () => (
        <div className="font-semibold text-left flex items-center">
          {key}
        </div>
      ),
      cell: info => (
        <div 
          className="truncate px-1 py-0.5 tabular-nums" 
          title={info.getValue()}
          onDoubleClick={(e) => handleCellDoubleClick(e, info)}
          onClick={(e) => handleCellClick(e, info)}
          data-value={info.getValue()}
        >
          {renderCellValue(info.getValue())}
        </div>
      ),
      enableSorting: true,
      enableFiltering: true,
    }));
  }, [data]);
  
  // Fungsi untuk render nilai sel dengan format yang benar
  const renderCellValue = useCallback((value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    } else if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    } else if (typeof value === 'object' && value instanceof Date) {
      return value.toISOString();
    } else if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  }, []);
  
  // Handle klik sel untuk copy paste
  const handleCellClick = useCallback((e, info) => {
    // Menandai sel yang dipilih untuk digunakan oleh handlers keyboard
    setCopiedCell({
      rowIndex: info.row.index,
      columnId: info.column.id,
      value: info.getValue()
    });
  }, []);
  
  // Handler untuk double klik pada sel - copy konten
  const handleCellDoubleClick = useCallback((e, info) => {
    e.preventDefault();
    const value = info.getValue();
    
    // Copy ke clipboard
    navigator.clipboard.writeText(value !== null && value !== undefined ? String(value) : '')
      .then(() => {
        // Tampilkan tooltip
        setCopyTooltip({
          show: true,
          x: e.clientX,
          y: e.clientY
        });
        
        // Sembunyikan tooltip setelah 1.5 detik
        setTimeout(() => {
          setCopyTooltip({ show: false, x: 0, y: 0 });
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy cell value: ', err);
      });
  }, []);
  
  // Handler key press untuk key commands (copy, paste, dll)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && copiedCell) {
        const { value } = copiedCell;
        navigator.clipboard.writeText(value !== null && value !== undefined ? String(value) : '');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copiedCell]);
  
  // Konfigurasi tabel 
  const table = useReactTable({
    data: data || defaultData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  });
  
  // Implementasi virtualization untuk performa
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    getScrollElement: () => tableBodyRef.current,
    count: rows.length,
    estimateSize: () => 35, // estimasi tinggi setiap baris
    overscan: 20, // jumlah baris ekstra yang di-render di atas dan bawah
  });
  
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;
  
  // Menyiapkan data untuk ekspor
  const csvData = useMemo(() => {
    // Jika ada row selection, hanya ekspor baris yang dipilih
    if (Object.keys(rowSelection).length > 0) {
      return data.filter((_, index) => rowSelection[index]);
    }
    // Jika tidak, ekspor semua data yang ditampilkan (termasuk filter)
    return table.getFilteredRowModel().rows.map(row => row.original);
  }, [data, rowSelection, table.getFilteredRowModel]);
  
  // Generate nama file untuk ekspor
  const exportFileName = useMemo(() => {
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `query-result-${date}`;
  }, []);
  
  // Fungsi untuk seleksi semua baris
  const selectAllRows = useCallback(() => {
    const newSelection = {};
    table.getFilteredRowModel().rows.forEach(row => {
      newSelection[row.id] = true;
    });
    setRowSelection(newSelection);
  }, [table]);
  
  // Fungsi untuk membersihkan seleksi
  const clearRowSelection = useCallback(() => {
    setRowSelection({});
  }, []);
  
  // Render tabel dengan virtualisasi
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            {title}
            {loading && (
              <span className="ml-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {table.getFilteredRowModel().rows.length} baris
            {table.getFilteredRowModel().rows.length !== data.length && ` (dari total ${data.length})`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Global search */}
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Cari..."
              className="px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
            <div className="absolute left-2.5 top-2 text-gray-400 dark:text-gray-500">
              <SearchIcon />
            </div>
          </div>
          
          {/* Export buttons */}
          <div className="relative group">
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded flex items-center">
              <DownloadIcon />
              <span className="ml-1">Export</span>
            </button>
            <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg w-32 z-10 hidden group-hover:block">
              <CSVLink
                data={csvData}
                filename={`${exportFileName}.csv`}
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    <DownloadIcon />
                  </span>
                  CSV
                </div>
              </CSVLink>
              <button 
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left" 
                onClick={() => {
                  // Export to Excel (xlsx) implementation
                  alert("Export ke Excel akan segera tersedia");
                }}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    <ExcelIcon />
                  </span>
                  Excel
                </div>
              </button>
              <button 
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left" 
                onClick={() => {
                  // Copy to clipboard implementation
                  const headers = columns.map(col => col.id);
                  const rows = table.getFilteredRowModel().rows.map(row => 
                    columns.map(col => {
                      const value = row.original[col.id];
                      return value !== null && value !== undefined ? String(value) : '';
                    })
                  );
                  
                  // Format as tab-separated text
                  const tsvContent = [
                    headers.join('\t'),
                    ...rows.map(row => row.join('\t'))
                  ].join('\n');
                  
                  navigator.clipboard.writeText(tsvContent)
                    .then(() => {
                      alert("Data disalin ke clipboard");
                    })
                    .catch(err => {
                      console.error("Gagal menyalin data", err);
                    });
                }}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    <CopyIcon />
                  </span>
                  Copy All
                </div>
              </button>
            </div>
          </div>
          
          {/* Row selection actions */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={selectAllRows}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded"
            >
              Pilih Semua
            </button>
            {Object.keys(rowSelection).length > 0 && (
              <button 
                onClick={clearRowSelection}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded flex items-center"
              >
                <span className="text-xs bg-blue-500 text-white rounded-full h-4 w-4 inline-flex items-center justify-center mr-1">
                  {Object.keys(rowSelection).length}
                </span>
                Hapus Pilihan
              </button>
            )}
          </div>
          
          {/* Page size selector */}
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            {[50, 100, 250, 500, 1000].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize} baris
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Table container */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        <table 
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed text-sm"
          style={{ tableLayout: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap group sticky top-0 bg-gray-50 dark:bg-gray-800"
                    style={{ minWidth: '120px' }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <SortUpIcon />,
                          desc: <SortDownIcon />,
                        }[header.column.getIsSorted()] ?? header.column.getCanSort() ? (
                          <span className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400">
                            <SortIcon />
                          </span>
                        ) : null}
                      </div>
                    )}
                    
                    {/* Column filter */}
                    {header.column.getCanFilter() ? (
                      <div className="mt-1">
                        <input
                          type="text"
                          value={(header.column.getFilterValue() ?? '').toString()}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder="Filter..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        />
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          {/* Table body dengan virtualisasi */}
          <tbody
            ref={tableBodyRef}
            className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800 relative overflow-auto"
            style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
          >
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
              </tr>
            )}
            {virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <tr 
                  key={row.id}
                  className={
                    rowSelection[row.id]
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/30'
                      : 'even:bg-gray-50 dark:even:bg-[#111827] hover:bg-gray-100 dark:hover:bg-[#1f2937]'
                  }
                  onClick={() => {
                    const newSelection = { ...rowSelection };
                    newSelection[row.id] = !rowSelection[row.id];
                    setRowSelection(newSelection);
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Halaman{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} dari{' '}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
        </div>
      </div>
      
      {/* Copy tooltip */}
      {copyTooltip.show && (
        <div 
          className="fixed bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg z-50"
          style={{
            left: copyTooltip.x + 'px',
            top: (copyTooltip.y - 30) + 'px',
            transform: 'translateX(-50%)',
          }}
        >
          Disalin!
        </div>
      )}
    </div>
  );
};

export default ResultGrid; 