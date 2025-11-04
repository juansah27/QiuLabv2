import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { usePageTitle } from '../../utils/pageTitle';

const UserManagement = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user'
  });

  // Set page title
  usePageTitle('Manajemen Pengguna Sistem');

  // Periksa apakah pengguna adalah admin (ladyqiu)
  useEffect(() => {
    if (user?.username !== 'ladyqiu' && !hasRole('admin')) {
      navigate('/unauthorized');
    } else {
      // Fetch users
      fetchUsers();
    }
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/auth/users`);
      
      // Pastikan users selalu berupa array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && typeof response.data === 'object') {
        // Jika response.data adalah objek, ubah ke array jika mungkin
        const usersArray = Object.values(response.data).filter(item => item && typeof item === 'object');
        console.log('Mengubah objek pengguna menjadi array:', usersArray);
        setUsers(usersArray);
      } else {
        // Jika tidak bisa dikonversi, set array kosong
        console.error('Format data pengguna tidak valid:', response.data);
        setUsers([]);
        setError('Format data pengguna tidak valid. Silakan hubungi administrator.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Gagal mengambil data pengguna. Silakan coba lagi nanti.');
      setUsers([]); // Set empty array to avoid mapping errors
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = getApiUrl();
      await axios.post(`${apiUrl}/auth/users`, newUser);
      setNewUser({
        username: '',
        password: '',
        email: '',
        role: 'user'
      });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error adding user:', error);
      setError('Gagal menambahkan pengguna. Silakan coba lagi nanti.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        const apiUrl = getApiUrl();
        await axios.delete(`${apiUrl}/auth/users/${userId}`);
        fetchUsers(); // Refresh user list
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Gagal menghapus pengguna. Silakan coba lagi nanti.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-0 py-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Manajemen Pengguna</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add User Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Tambah Pengguna Baru</h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Tambah Pengguna
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white">
          Daftar Pengguna
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr key="header-row">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {!Array.isArray(users) || users.length === 0 ? (
                <tr key="empty-row">
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.username !== 'ladyqiu' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 