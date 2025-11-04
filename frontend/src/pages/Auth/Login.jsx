import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';
import logoSrc from '../../assets/images/qiulab-logo.svg';

const Login = () => {
  usePageTitle('Login');
  
  const auth = useAuth();
  const loginFunction = auth.login || auth.handleLogin; // Gunakan salah satu yang tersedia
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuperuserMode, setIsSuperuserMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Deteksi otomatis mode superuser berdasarkan username
  useEffect(() => {
    const isSuperuser = formData.username.toLowerCase() === 'ladyqiu';
    setIsSuperuserMode(isSuperuser);
  }, [formData.username]);

  // Hook for effects
  useEffect(() => {
    // Clear any existing token when the login page is loaded
    localStorage.removeItem('token');
    console.log('Token dihapus dari localStorage saat halaman login dimuat');
    
    // Check for dark mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log(`Submitting login form with username: ${formData.username}`);
    
    try {
      if (!loginFunction) {
        throw new Error('Login function tidak tersedia dalam context. Coba reload halaman.');
      }
      
      // Gunakan fungsi login biasa untuk semua pengguna termasuk ladyqiu
      const result = await loginFunction({ 
        username: formData.username, 
        password: formData.password 
      });
      
      console.log('Login result:', result);
      
      if (result && result.success) {
        console.log('Login berhasil! User:', result.user);
        navigate('/dashboard');
      } else {
        setError(result?.message || 'Terjadi kesalahan saat login.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.response?.data?.error || err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div>
            <div className="flex justify-center">
              <img 
                src={logoSrc} 
                alt="QiuLab Logo" 
                className="w-48 h-auto object-contain" 
                style={{ 
                  filter: isDarkMode ? 'brightness(1.2) contrast(0.85)' : 'none',
                  transition: 'filter 300ms',
                }}
              />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
              {isSuperuserMode ? 'Login Admin' : 'Login ke Akun Anda'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              {isSuperuserMode ? 
                'Akses khusus untuk pengelolaan pengguna' : 
                <>Atau{' '}<Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">daftar untuk akun baru</Link></>
              }
            </p>
            {isSuperuserMode && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded-md dark:bg-blue-900/30 dark:text-blue-300">
                Mode admin terdeteksi untuk username: {formData.username}
              </div>
            )}
          </div>

          <div className="mt-8">
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-400">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="input"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input"
                    placeholder="Masukkan password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Lupa password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full flex justify-center"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    isSuperuserMode ? 'Login Admin' : 'Login'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6">
              <button 
                onClick={toggleDarkMode} 
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>

            {/* Debug Link */}
            {import.meta.env.DEV && (
              <div className="mt-4 text-center">
                <Link 
                  to="/debug-test" 
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Debug Test
                </Link>
                <span className="mx-2 text-gray-500">|</span>
                <Link 
                  to="/debug-token" 
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Debug Token
                </Link>
                <span className="mx-2 text-gray-500">|</span>
                <Link 
                  to="/password-reset" 
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Reset Password
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-500 dark:from-primary-900 dark:to-secondary-900">
          <div className="flex items-center justify-center h-full p-12">
            <div className="max-w-xl text-white">
              <img src={logoSrc} alt="QiuLab Logo" className="w-72 h-auto object-contain mb-6" />
              <h2 className="text-4xl font-bold">Transform Anything. Track Everything.</h2>
              <p className="mt-4 text-xl">
                Kelola file Excel dan query SQL Anda dalam satu platform terintegrasi.
                Analisis data dengan mudah dan visualisasikan hasilnya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 