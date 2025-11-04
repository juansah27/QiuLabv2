import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { usePageTitle } from '../../utils/pageTitle';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email) {
      setMessage({ type: 'error', text: 'Username dan email harus diisi' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // In a real app, this would call your API
      // const response = await api.put('/api/auth/profile', {
      //   username: formData.username,
      //   email: formData.email
      // });
      
      // Mock successful response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local user state
      updateProfile({
        username: formData.username,
        email: formData.email
      });
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memperbarui profil' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Semua field password harus diisi' });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // In a real app, this would call your API
      // const response = await api.put('/api/auth/password', {
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword
      // });
      
      // Mock successful response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Password berhasil diperbarui' });
      setIsChangingPassword(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memperbarui password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Menambahkan judul halaman
  usePageTitle('Profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Profil Pengguna
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Kelola informasi pribadi dan pengaturan akun Anda.
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Informasi Akun
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-outline text-sm"
            >
              Edit
            </button>
          )}
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleProfileUpdate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="label">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data
                      if (user) {
                        setFormData(prev => ({
                          ...prev,
                          username: user.username || '',
                          email: user.email || ''
                        }));
                      }
                    }}
                    className="btn btn-outline"
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</h3>
                <p className="mt-1 text-gray-900 dark:text-white">{user?.username}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Ubah Password
          </h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn btn-outline text-sm"
            >
              Ubah
            </button>
          )}
        </div>
        
        <div className="p-6">
          {isChangingPassword ? (
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="label">Password Saat Ini</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="label">Password Baru</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="label">Konfirmasi Password Baru</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      // Reset form data
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      }));
                    }}
                    className="btn btn-outline"
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Anda dapat mengubah password Anda kapan saja.
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-red-600 dark:text-red-400">
            Zona Berbahaya
          </h2>
        </div>
        
        <div className="p-6">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Tindakan berikut ini tidak dapat dibatalkan. Harap berhati-hati.
          </p>
          
          <button
            className="btn bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            Hapus Akun Saya
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 