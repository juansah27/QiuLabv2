import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { FaFileCsv, FaFileExcel, FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

const VirtualTable = ({
  data = [],
  columns = [],
  title = '',
  enableFiltering = true,
  enableSorting = true,
  enablePagination = true,
  enableExport = true,
  pageSize = 10,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableFiltering,
    enableSorting,
    enablePagination,
  });
  
  // Set default page size
  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);
  
  // Setup virtualizer
  const tableContainerRef = React.useRef(null);
  
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35, // approximate row height
    overscan: 5,
  });
  
  // Export functions
  const handleExportCsv = () => {
    return table.getFilteredRowModel().rows.map(row => {
      const rowData = {};
      columns.forEach(column => {
        if (column.accessorKey) {
          rowData[column.header] = row.original[column.accessorKey];
        }
      });
      return rowData;
    });
  };
  
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      table.getFilteredRowModel().rows.map(row => {
        const rowData = {};
        columns.forEach(column => {
          if (column.accessorKey) {
            rowData[column.header] = row.original[column.accessorKey];
          }
        });
        return rowData;
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${title || 'data'}.xlsx`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {title}
        </CardTitle>
        {enableExport && (
          <div className="flex space-x-2">
            <CSVLink data={handleExportCsv()} filename={`${title || 'data'}.csv`}>
              <Button variant="outline" size="sm">
                <FaFileCsv className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CSVLink>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FaFileExcel className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {enableFiltering && (
          <div className="mb-4">
            <Input
              placeholder="Search..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto" ref={tableContainerRef}>
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center space-x-2",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="ml-2">
                                {header.column.getIsSorted() === "desc" ? (
                                  <FaSortDown className="h-4 w-4" />
                                ) : header.column.getIsSorted() === "asc" ? (
                                  <FaSortUp className="h-4 w-4" />
                                ) : (
                                  <FaSort className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
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
              </tbody>
            </table>
          </div>
        </div>
        {enablePagination && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirtualTable; 