import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import { usePageTitle } from '../../utils/pageTitle';

const QueryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(null);
  const [queryCode, setQueryCode] = useState('');
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('results'); // results, code, history
  
  // Menambahkan judul halaman
  usePageTitle('Detail Query SQL');
  
  // Fetch query details
  useEffect(() => {
    const fetchQueryDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, we would fetch from API
        // const response = await api.get(`/api/queries/${id}`);
        
        // For now, mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockQuery = {
          id: id,
          name: 'Laporan Penjualan Bulanan',
          description: 'Menampilkan penjualan total per bulan dengan perbandingan tahun lalu',
          created_at: '2023-05-15T08:30:00Z',
          updated_at: '2023-08-10T14:20:00Z',
          type: 'SQL',
          favorite: true,
          status: 'ready',
          last_run: '2023-08-10T14:20:00Z',
          tags: ['penjualan', 'laporan', 'dashboard'],
          database: 'sales_db',
          created_by: 'admin',
          run_history: [
            { id: 1, timestamp: '2023-08-10T14:20:00Z', duration: 1.2, status: 'success', rows: 12 },
            { id: 2, timestamp: '2023-07-25T09:15:00Z', duration: 1.5, status: 'success', rows: 12 },
            { id: 3, timestamp: '2023-06-18T11:30:00Z', duration: 3.2, status: 'error', error: 'Timeout error' },
            { id: 4, timestamp: '2023-06-15T10:45:00Z', duration: 0.8, status: 'success', rows: 12 }
          ]
        };
        
        const mockCode = `SELECT 
  DATE_FORMAT(order_date, '%Y-%m') AS month,
  COUNT(order_id) AS total_orders,
  SUM(total_amount) AS revenue,
  AVG(total_amount) AS avg_order_value
FROM 
  orders
WHERE 
  order_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH) AND CURRENT_DATE()
GROUP BY 
  DATE_FORMAT(order_date, '%Y-%m')
ORDER BY 
  month ASC;`;
        
        const mockColumns = [
          { id: 'month', name: 'Bulan', type: 'string' },
          { id: 'total_orders', name: 'Total Pesanan', type: 'numeric' },
          { id: 'revenue', name: 'Pendapatan', type: 'numeric' },
          { id: 'avg_order_value', name: 'Nilai Pesanan Rata-rata', type: 'numeric' }
        ];
        
        const mockResults = [
          { month: '2022-09', total_orders: 245, revenue: 45678000, avg_order_value: 186440 },
          { month: '2022-10', total_orders: 312, revenue: 62450000, avg_order_value: 200160 },
          { month: '2022-11', total_orders: 458, revenue: 98760000, avg_order_value: 215633 },
          { month: '2022-12', total_orders: 521, revenue: 125800000, avg_order_value: 241459 },
          { month: '2023-01', total_orders: 345, revenue: 78560000, avg_order_value: 227710 },
          { month: '2023-02', total_orders: 289, revenue: 65420000, avg_order_value: 226367 },
          { month: '2023-03', total_orders: 367, revenue: 87450000, avg_order_value: 238283 },
          { month: '2023-04', total_orders: 423, revenue: 95620000, avg_order_value: 226052 },
          { month: '2023-05', total_orders: 378, revenue: 84320000, avg_order_value: 223069 },
          { month: '2023-06', total_orders: 402, revenue: 92450000, avg_order_value: 229975 },
          { month: '2023-07', total_orders: 489, revenue: 112680000, avg_order_value: 230429 },
          { month: '2023-08', total_orders: 435, revenue: 98750000, avg_order_value: 226782 }
        ];
        
        setQuery(mockQuery);
        setQueryCode(mockCode);
        setColumns(mockColumns);
        setResults(mockResults);
      } catch (err) {
        console.error("Error fetching query details:", err);
        setError('Gagal memuat detail query. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueryDetails();
  }, [id]);
  
  // Handle running the query
  const handleRunQuery = async () => {
    setIsRunning(true);
    
    try {
      // In a real app, we would call the API
      // await api.post(`/api/queries/${id}/run`);
      
      // Mock execution delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the lastRun timestamp and add a new history entry
      setQuery(prev => ({
        ...prev,
        last_run: new Date().toISOString(),
        run_history: [
          {
            id: prev.run_history.length + 1,
            timestamp: new Date().toISOString(),
            duration: 1.1,
            status: 'success',
            rows: results.length
          },
          ...prev.run_history
        ]
      }));
    } catch (err) {
      console.error("Error running query:", err);
      setError('Gagal menjalankan query. Silakan coba lagi nanti.');
    } finally {
      setIsRunning(false);
    }
  };
  
  // Handle deleting the query
  const handleDeleteQuery = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus query ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        // In a real app, we would call the API
        // await api.delete(`/api/queries/${id}`);
        
        // Mock deletion delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        alert('Query berhasil dihapus');
        navigate('/generate');
      } catch (err) {
        console.error("Error deleting query:", err);
        setError('Gagal menghapus query. Silakan coba lagi nanti.');
      }
    }
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    try {
      // In a real app, we would call the API
      // await api.put(`/api/queries/${id}/favorite`, { favorite: !query.favorite });
      
      // Mock update
      setQuery(prev => ({
        ...prev,
        favorite: !prev.favorite
      }));
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setError('Gagal mengubah status favorit. Silakan coba lagi nanti.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
        {error}
        <div className="mt-4">
          <button
            onClick={() => navigate('/generate')}
            className="btn btn-primary"
          >
            Kembali ke Daftar Query
          </button>
        </div>
      </div>
    );
  }
  
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Query tidak ditemukan atau telah dihapus
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Query yang Anda cari tidak tersedia. Silakan kembali ke daftar query.
        </p>
        <button 
          onClick={() => navigate('/generate')} 
          className="btn btn-primary"
        >
          Kembali ke Daftar Query
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Link to="/generate" className="hover:text-primary-600 dark:hover:text-primary-400">
            Generate
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{query.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mr-2">
              {query.name}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
            >
              {query.favorite ? (
                <span className="text-yellow-500 dark:text-yellow-400">★</span>
              ) : (
                <span>☆</span>
              )}
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRunQuery}
              disabled={isRunning}
              className="btn btn-primary"
            >
              {isRunning ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Menjalankan...
                </>
              ) : (
                'Jalankan Query'
              )}
            </button>
            <Link to={`/queries/${id}/edit`} className="btn btn-outline dark:text-white">
              Edit
            </Link>
            <button
              onClick={handleDeleteQuery}
              className="btn btn-outline text-red-600 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Hapus
            </button>
          </div>
        </div>
        
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          {query.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {query.tags.map(tag => (
            <span 
              key={tag} 
              className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Database:</span>
            <span className="text-gray-700 dark:text-gray-300">{query.database}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Tipe:</span>
            <span className="text-gray-700 dark:text-gray-300">{query.type}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Dibuat oleh:</span>
            <span className="text-gray-700 dark:text-gray-300">{query.created_by}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Dibuat pada:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDistanceToNow(new Date(query.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2">Terakhir dijalankan:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDistanceToNow(new Date(query.last_run), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'results'
                ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Hasil
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'code'
                ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Kode Query
          </button>
          <button
            className={`px-4 py-3 font-medium ${
              activeTab === 'history'
                ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('history')}
          >
            Riwayat
          </button>
        </div>

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Hasil Query
              </h3>
              <div className="flex space-x-2">
                <button className="btn btn-sm btn-outline">
                  Export CSV
                </button>
                <button className="btn btn-sm btn-outline">
                  Export Excel
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.id}
                        scope="col"
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 ${
                          column.type === 'numeric' ? 'text-right' : ''
                        }`}
                      >
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {results.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column.id}`}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            column.type === 'numeric' 
                              ? 'text-right font-medium text-gray-900 dark:text-white' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {column.type === 'numeric' && column.id === 'revenue'
                            ? `Rp ${row[column.id].toLocaleString('id-ID')}`
                            : column.type === 'numeric' && column.id === 'avg_order_value'
                              ? `Rp ${row[column.id].toLocaleString('id-ID')}`
                              : column.type === 'numeric' 
                                ? row[column.id].toLocaleString('id-ID')
                                : row[column.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Kode Query
              </h3>
              <button className="btn btn-sm btn-outline">
                Copy
              </button>
            </div>
            
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {queryCode}
              </pre>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Riwayat Eksekusi
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Waktu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Durasi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Baris
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {query.run_history.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(run.timestamp), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {run.status === 'success' ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                            Sukses
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                            Gagal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {run.duration} detik
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {run.status === 'success' ? run.rows : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryDetail; 