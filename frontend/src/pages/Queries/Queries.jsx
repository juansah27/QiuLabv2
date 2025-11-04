import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../../utils/api';
import { usePageTitle } from '../../utils/pageTitle';

const Queries = () => {
  // Menambahkan judul halaman
  usePageTitle('Queries');
  
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, favorites, recent
  const [sortBy, setSortBy] = useState('date'); // date, name, type
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  
  // Fetch queries
  useEffect(() => {
    const fetchQueries = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, we would fetch from API
        // const response = await api.get('/api/queries');
        
        // For now, mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockQueries = [
          {
            id: '1',
            name: 'Laporan Penjualan Bulanan',
            description: 'Menampilkan penjualan total per bulan dengan perbandingan tahun lalu',
            created_at: '2023-05-15T08:30:00Z',
            updated_at: '2023-08-10T14:20:00Z',
            type: 'SQL',
            favorite: true,
            status: 'ready', // ready, running, failed
            last_run: '2023-08-10T14:20:00Z',
            tags: ['penjualan', 'laporan', 'dashboard'],
            database: 'sales_db',
            created_by: 'admin'
          },
          {
            id: '2',
            name: 'Analisis Demografi Pelanggan',
            description: 'Segmentasi pelanggan berdasarkan usia, lokasi, dan perilaku pembelian',
            created_at: '2023-06-22T10:15:00Z',
            updated_at: '2023-07-30T09:45:00Z',
            type: 'NoSQL',
            favorite: false,
            status: 'ready',
            last_run: '2023-07-30T09:45:00Z',
            tags: ['pelanggan', 'analisis', 'demografi'],
            database: 'customer_db',
            created_by: 'analyst1'
          },
          {
            id: '3',
            name: 'Tren Produk Terlaris',
            description: 'Mengidentifikasi produk dengan penjualan tertinggi berdasarkan periode',
            created_at: '2023-04-05T11:20:00Z',
            updated_at: '2023-08-15T16:30:00Z',
            type: 'SQL',
            favorite: true,
            status: 'ready',
            last_run: '2023-08-15T16:30:00Z',
            tags: ['produk', 'penjualan', 'tren'],
            database: 'inventory_db',
            created_by: 'manager'
          },
          {
            id: '4',
            name: 'Performa Cabang Regional',
            description: 'Perbandingan performa penjualan antar cabang di berbagai wilayah',
            created_at: '2023-07-10T09:00:00Z',
            updated_at: '2023-08-01T13:10:00Z',
            type: 'SQL',
            favorite: false,
            status: 'failed',
            last_run: '2023-08-01T13:10:00Z',
            tags: ['cabang', 'regional', 'performa'],
            database: 'sales_db',
            created_by: 'admin'
          },
          {
            id: '5',
            name: 'Analisis Sentimen Ulasan Pelanggan',
            description: 'Menganalisis sentimen dari ulasan pelanggan menggunakan NLP',
            created_at: '2023-08-01T14:45:00Z',
            updated_at: '2023-08-12T10:20:00Z',
            type: 'NoSQL',
            favorite: true,
            status: 'running',
            last_run: '2023-08-12T10:20:00Z',
            tags: ['ulasan', 'sentimen', 'pelanggan', 'NLP'],
            database: 'feedback_db',
            created_by: 'data_scientist'
          }
        ];
        
        setQueries(mockQueries);
      } catch (err) {
        console.error("Error fetching queries:", err);
        setError('Gagal memuat daftar query. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueries();
  }, []);
  
  // Filter and sort queries
  const filteredQueries = queries.filter(query => {
    // Filter by search term
    const matchesSearch = 
      query.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by filter type
    if (filter === 'favorites') {
      return matchesSearch && query.favorite;
    } else if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(query.updated_at) >= oneWeekAgo;
    } else {
      return matchesSearch;
    }
  });
  
  // Sort queries
  const sortedQueries = [...filteredQueries].sort((a, b) => {
    let compareResult = 0;
    
    if (sortBy === 'name') {
      compareResult = a.name.localeCompare(b.name);
    } else if (sortBy === 'type') {
      compareResult = a.type.localeCompare(b.type);
    } else { // date
      compareResult = new Date(b.updated_at) - new Date(a.updated_at);
    }
    
    return sortOrder === 'asc' ? compareResult : -compareResult;
  });
  
  // Handle sort change
  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = (id) => {
    setQueries(queries.map(query => 
      query.id === id ? { ...query, favorite: !query.favorite } : query
    ));
  };
  
  // Handle query deletion
  const handleDeleteQuery = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus query ini?')) {
      setQueries(queries.filter(query => query.id !== id));
    }
  };
  
  // Handle running a query
  const handleRunQuery = (id) => {
    setQueries(queries.map(query => 
      query.id === id ? { ...query, status: 'running', last_run: new Date().toISOString() } : query
    ));
    
    // Simulate query completion after 2 seconds
    setTimeout(() => {
      setQueries(queries.map(query => 
        query.id === id ? { ...query, status: 'ready' } : query
      ));
    }, 2000);
  };
  
  // Render status badge
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'ready':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">Siap</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 flex items-center">
          <span className="w-2 h-2 mr-1 rounded-full bg-blue-500 animate-pulse"></span>
          Sedang Berjalan
        </span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">Gagal</span>;
      default:
        return null;
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
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Daftar Query
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kelola dan jalankan query database Anda dari sini
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/generate" className="btn btn-secondary">
            Generate Queries
          </Link>
          <Link to="/queries/new" className="btn btn-primary">
            Buat Query Baru
          </Link>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Cari query..."
              className="input pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <div>
              <label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter
              </label>
              <select
                id="filter-select"
                className="input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Semua</option>
                <option value="favorites">Favorit</option>
                <option value="recent">Terbaru</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Urutkan
              </label>
              <select
                id="sort-select"
                className="input"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <option value="date-desc">Terbaru Dulu</option>
                <option value="date-asc">Terlama Dulu</option>
                <option value="name-asc">Nama (A-Z)</option>
                <option value="name-desc">Nama (Z-A)</option>
                <option value="type-asc">Tipe (A-Z)</option>
                <option value="type-desc">Tipe (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Queries List */}
      {sortedQueries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 dark:text-gray-500 text-5xl mb-4">📊</div>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tidak ada query yang ditemukan
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery 
              ? `Tidak ada hasil yang cocok dengan "${searchQuery}". Coba pencarian lain atau buat query baru.`
              : 'Buat query baru untuk mulai menganalisis data Anda.'}
          </p>
          <Link to="/queries/new" className="btn btn-primary">
            Buat Query Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedQueries.map(query => (
            <div 
              key={query.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Link 
                      to={`/queries/${query.id}`}
                      className="text-lg font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      {query.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {query.database} • {query.type}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleFavorite(query.id)}
                    className="text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400"
                  >
                    {query.favorite ? (
                      <span className="text-yellow-500 dark:text-yellow-400">★</span>
                    ) : (
                      <span>☆</span>
                    )}
                  </button>
                </div>
                
                <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                  {query.description}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {query.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Dijalankan terakhir: {formatDistanceToNow(new Date(query.last_run), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                    <div>{renderStatusBadge(query.status)}</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRunQuery(query.id)}
                      disabled={query.status === 'running'}
                      className="btn btn-sm btn-outline dark:text-white disabled:opacity-50"
                    >
                      Jalankan
                    </button>
                    <Link
                      to={`/queries/${query.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Queries; 