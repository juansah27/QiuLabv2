import React, { useMemo } from 'react';
import VirtualTable from './VirtualTable';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

const TableExample = () => {
  // Data dummy untuk contoh
  const data = useMemo(() => 
    Array.from({ length: 1000 }, (_, index) => ({
      id: index + 1,
      nama: `Pengguna ${index + 1}`,
      email: `pengguna${index + 1}@example.com`,
      status: Math.random() > 0.5 ? 'Aktif' : 'Tidak Aktif',
      tanggal: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
      nilai: Math.floor(Math.random() * 100),
    })),
  []);

  // Definisi kolom
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'nama',
      header: 'Nama',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => (
        <Badge
          variant={info.getValue() === 'Aktif' ? 'success' : 'destructive'}
          className="text-xs"
        >
          {info.getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'nilai',
      header: 'Nilai',
      cell: info => info.getValue(),
    },
    {
      id: 'aksi',
      header: 'Aksi',
      cell: info => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert(`Edit data dengan ID: ${info.row.original.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => alert(`Hapus data dengan ID: ${info.row.original.id}`)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <Card className="container mx-auto p-4">
      <CardContent>
        <VirtualTable 
          data={data} 
          columns={columns} 
          title="Tabel Data Pengguna (Virtual)"
          enableFiltering={true}
          enableSorting={true}
          enablePagination={true}
          enableExport={true}
          pageSize={10}
        />
      </CardContent>
    </Card>
  );
};

export default TableExample; 