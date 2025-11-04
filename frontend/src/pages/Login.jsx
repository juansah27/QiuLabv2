import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getApiUrl } from '../config';
import { printDebugInfo } from '../utils/debugConfig';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { IconButton } from '@mui/material';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Tambahkan debug info saat komponen dimuat
  useEffect(() => {
    console.log('Login page loaded. API URL:', getApiUrl());
    printDebugInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      console.log('Attempting login for:', credentials.username);
      const result = await login(credentials);
      
      if (result.success) {
        console.log('Login successful, redirecting...');
        if (result.user.role === 'admin' || result.user.is_admin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        console.error('Login failed:', result.message);
        setLoginError(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <motion.div
        className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center mb-8">
          <motion.div variants={itemVariants} className="text-center flex-1">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>QiuLab</h2>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Sign in to your account</p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <IconButton
              onClick={toggleDarkMode}
              color="inherit"
              aria-label="toggle dark mode"
              className={isDarkMode ? 'text-white' : 'text-gray-800'}
            >
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </motion.div>
        </div>

        {loginError && (
          <motion.div
            variants={itemVariants}
            className={`${isDarkMode ? 'bg-red-900' : 'bg-red-100'} border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4`}
            role="alert"
          >
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{loginError}</span>
          </motion.div>
        )}

        <motion.form onSubmit={handleSubmit} variants={containerVariants}>
          <motion.div variants={itemVariants} className="mb-4">
            <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </motion.div>
          <motion.div variants={itemVariants} className="mb-6">
            <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <button
              type="submit"
              className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </motion.div>
        </motion.form>

        <motion.div variants={itemVariants} className="text-center mt-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Need help? Contact administrator
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 