import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { usePageTitle } from '../../utils/pageTitle';
import logoSrc from '../../assets/images/qiulab-logo.svg';

const Register = () => {
  usePageTitle('Register');

  const { register } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Silakan isi semua bidang');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password harus terdiri dari minimal 6 karakter');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
      console.error(err);
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
                className="w-40 h-auto object-contain" 
                style={{ 
                  filter: isDarkMode ? 'brightness(1.2) contrast(0.85)' : 'none',
                  transition: 'filter 300ms',
                }}
              />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
              Daftar Akun Baru
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
              Atau{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                login jika sudah memiliki akun
              </Link>
            </p>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="nama@example.com"
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
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konfirmasi Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ulangi password"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="agree-terms" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Saya setuju dengan <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">syarat dan ketentuan</a>
                </label>
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
                    'Daftar Sekarang'
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
          </div>
        </div>
      </div>
      
      <div className="relative flex-1 hidden w-0 lg:block">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-500 dark:from-primary-900 dark:to-secondary-900">
          <div className="flex items-center justify-center h-full p-12">
            <div className="max-w-xl text-white">
              <img 
                src={logoSrc} 
                alt="QiuLab Logo" 
                className="w-48 h-auto object-contain mb-6" 
                style={{ 
                  filter: isDarkMode ? 'brightness(1.2) contrast(0.85)' : 'none',
                  transition: 'filter 300ms',
                  maxWidth: '80%', 
                }}
              />
              <h2 className="text-4xl font-bold">Transform Anything. Track Everything.</h2>
              <p className="mt-4 text-xl">
                Gabung sekarang untuk memulai mengelola dan menganalisis data Anda dengan lebih efisien.
              </p>
              <ul className="mt-8 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Unggah dan kelola file Excel</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Simpan dan jalankan query SQL</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Visualisasikan data dengan chart interaktif</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Pengelolaan database yang mudah</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 