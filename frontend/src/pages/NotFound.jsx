import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../utils/pageTitle';

const NotFound = () => {
  const { user } = useAuth();
  
  // Menambahkan judul halaman
  usePageTitle('Page Not Found');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-800 dark:text-gray-200">Halaman Tidak Ditemukan</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Maaf, kami tidak dapat menemukan halaman yang Anda cari.
        </p>
        <div className="mt-8">
          <Link
            to={user ? "/dashboard" : "/login"}
            className="btn btn-primary"
          >
            {user ? 'Kembali ke Dashboard' : 'Kembali ke Login'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 