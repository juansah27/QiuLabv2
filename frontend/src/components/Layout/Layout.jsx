import { Outlet } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { getApiUrl } from '../../config';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { useWindowSize } from '../../hooks/useWindowSize';
import NetworkStatusIndicator from '../NetworkStatusIndicator';

const Layout = () => {
  const location = useLocation();
  const auth = useAuth();
  
  // Page title berdasarkan path
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    
    // Mapping path ke judul yang lebih deskriptif
    const titleMap = {
      '/': 'Dashboard Utama',
      '/dashboard': 'Dashboard Utama',
      '/setup-request': 'Setup Request',
      '/user-management': 'Manajemen Pengguna',
      '/settings': 'Pengaturan Sistem',
      '/profile': 'Profil Pengguna',
      '/queries': 'Manajemen Query SQL',
      '/queries/generate': 'Generate Query SQL',
      '/monitoring': 'Cek Order',

      '/manage-users': 'Kelola Pengguna',
      '/login': 'Masuk ke Sistem',
      '/register': 'Daftar Akun Baru',
      '/unauthorized': 'Akses Ditolak',
      '/not-found': 'Halaman Tidak Ditemukan',
      '/debug/token': 'Debug Token',
      '/debug/test': 'Debug Test',
      '/debug/password-reset': 'Reset Password',
      '/debug/connection': 'Test Koneksi'
    };

    // Cari judul yang sesuai dari mapping
    const matchedTitle = Object.entries(titleMap).find(([key]) => path.startsWith(key));
    
    if (matchedTitle) {
      return matchedTitle[1];
    }
    
    // Default: capitalize first letter after last slash
    const lastSegment = path.substring(path.lastIndexOf('/') + 1);
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }, [location.pathname]);

  // Note: Individual pages will set their own titles using usePageTitle hook
  // This layout component should not override page-specific titles

  // State untuk layout
  const windowSize = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Cek localStorage untuk state sidebar
    const savedState = localStorage.getItem('sidebarState');
    if (savedState !== null) {
      return savedState === 'true';
    }
    // Default state berdasarkan ukuran layar
    return windowSize.width >= 768;
  });
  const [isMobile, setIsMobile] = useState(windowSize.width < 768);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  const { isDarkMode } = useTheme();
  
  // Simpan state sidebar ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem('sidebarState', isSidebarOpen.toString());
  }, [isSidebarOpen]);
  
  // Fetch token data untuk validasi dan debug
  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log("No token found");
          setIsTokenValid(false);
          return;
        }
        
        const response = await axios.get(`/auth/debug-token`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.data && response.data.data.token) {
          console.log("Token data received:", response.data.data.token);
          setTokenData(response.data.data.token);
          setIsTokenValid(response.data.data.token.valid === true);
        } else {
          console.error("Invalid token response format:", response.data);
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setIsTokenValid(false);
      }
    };
    
    validateToken();
  }, []);
  
  // Toggle sidebar - implementasi sederhana dan langsung
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prevState => !prevState);
  }, []);
  
  // Toggle user dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);
  
  // Toggle debug panel
  const toggleDebugPanel = useCallback(() => {
    setIsDebugPanelOpen(!isDebugPanelOpen);
  }, [isDebugPanelOpen]);
  
  // Callback untuk useWindowSize dengan custom throttle
  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const newIsMobile = width < 768;
    setIsMobile(newIsMobile);
    
    // Hanya ubah sidebar saat ukuran layar berubah dari mobile ke desktop atau sebaliknya
    if (newIsMobile !== isMobile) {
      setIsSidebarOpen(!newIsMobile ? true : false);
    }
  }, [isMobile]);
  
  // Use custom hook untuk track window size
  useWindowSize(updateDimensions);
  
  // Compute margin-left for main content based on sidebar state
  const mainContentStyle = useMemo(() => {
    return {
      marginLeft: isMobile ? '0' : (isSidebarOpen ? '12rem' : '3rem'),
      width: isMobile ? '100%' : (isSidebarOpen ? 'calc(100% - 12rem)' : 'calc(100% - 3rem)'),
      transition: 'margin 0.3s ease-in-out, width 0.3s ease-in-out'
    };
  }, [isSidebarOpen, isMobile]);
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile} 
      />
      
      {/* Main Content */}
      <div 
        className="flex flex-col flex-1 h-screen overflow-hidden" 
        style={mainContentStyle}
      >
        {/* Topbar */}
        <Navbar 
          pageTitle={pageTitle} 
          toggleSidebar={toggleSidebar} 
        />
        
        {/* Main content area */}
        <main 
          className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-all duration-300 pt-14 px-2 md:px-3`}
        >
          {/* Debug Panel */}
          {isDebugPanelOpen && (
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Debug Info</h3>
                <button 
                  onClick={toggleDebugPanel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  &times;
                </button>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 max-h-96 overflow-auto">
                <p>
                  <span className="font-semibold">Auth Status: </span>
                  {auth.isAuthenticated ? (
                    <span className="text-green-600 dark:text-green-400">Authenticated</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">Not Authenticated</span>
                  )}
                </p>
                <p><span className="font-semibold">User: </span>{auth.user?.username || 'None'}</p>
                <p><span className="font-semibold">Role: </span>{auth.user?.role || 'None'}</p>
                <p><span className="font-semibold">Token Valid: </span>{isTokenValid ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold">Theme: </span>{isDarkMode ? 'Dark' : 'Light'}</p>
                <p><span className="font-semibold">Page: </span>{location.pathname}</p>
                <p><span className="font-semibold">Sidebar Open: </span>{isSidebarOpen ? 'Yes' : 'No'}</p>
                
                {tokenData && (
                  <>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <p className="font-semibold">Token Data:</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(tokenData, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="py-3 w-full">
            <Outlet />
          </div>
          
          {/* Developer Credit Section */}
          <div className="text-center text-sm text-gray-500 mt-4 mb-6">
            <p><strong>QiuLab</strong> – A smart insight tool built by Handiyan Juansah • <a href="https://github.com/juansah27" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition">Github</a></p>
          </div>
        </main>
      </div>
      
      {/* Network Status Indicator */}
      <NetworkStatusIndicator />
    </div>
  );
};

export default Layout;