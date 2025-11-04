import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { THEME_TRANSITIONS, THEME_COLORS } from '../../utils/themeUtils';
import logoSrc from '../../assets/images/qiulab-logo.svg';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = ({ toggleSidebar, pageTitle }) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1),
      path: '/' + paths.slice(0, index + 1).join('/')
    }));
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleToggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleSidebar === 'function') {
      toggleSidebar();
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 right-0 left-0 z-40 flex items-center h-14 bg-white dark:bg-gray-800 shadow-sm ${THEME_TRANSITIONS.default}`}>
      {/* Left section - Hamburger, Logo and Breadcrumbs */}
      <div className="flex items-center pl-1.5 md:pl-2 lg:pl-2 pr-2 space-x-2">
        {/* Hamburger menu button */}
        <button 
          onClick={handleToggleSidebar}
          className={`flex items-center justify-center p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none ${THEME_TRANSITIONS.default}`}
          aria-label="Toggle sidebar"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={logoSrc} 
            alt="QiuLab Logo" 
            className="h-8 w-32"
            style={{ 
              filter: isDarkMode ? 'brightness(1.2) contrast(0.85)' : 'none',
              transition: 'filter 300ms',
              objectFit: 'contain',
            }}
          />
        </Link>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 flex justify-center">
        <div className={`relative ${isSearchActive ? 'w-56 sm:w-72 md:w-80' : 'w-40 sm:w-48 md:w-56'} transition-all duration-300`}>
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={`w-full pl-8 pr-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white ${THEME_TRANSITIONS.default}`}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            aria-label="Search"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <span className={`text-gray-500 dark:text-gray-400 text-xs ${THEME_TRANSITIONS.default}`}>🔍</span>
          </div>
        </div>
      </div>

      {/* Right section - Actions and User Profile */}
      <div className="flex items-center pr-1 md:pr-2 lg:pr-3 space-x-2">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={toggleNotifications}
            className={`flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none ${THEME_TRANSITIONS.default}`}
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1 -translate-y-1"></span>
          </button>
          
          {isNotificationsOpen && (
            <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${THEME_TRANSITIONS.default}`}>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</h3>
                <div className="mt-2 space-y-2">
                  {/* Sample notifications */}
                  <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-300">New update available</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="relative">
          <button 
            className={`flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none ${THEME_TRANSITIONS.default}`}
            aria-label="Quick Actions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {/* User profile */}
        {user && (
          <div className="relative">
            <button 
              onClick={toggleUserMenu}
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-0 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 ${THEME_TRANSITIONS.default}`}
              aria-label="User menu"
              type="button"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.username}'s avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-medium text-xs uppercase">
                  {user.username?.substring(0, 2) || "U"}
                </span>
              )}
            </button>
            
            {isUserMenuOpen && (
              <div 
                className={`absolute right-0 mt-1 w-40 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${THEME_TRANSITIONS.default}`}
                onBlur={() => setIsUserMenuOpen(false)}
              >
                <div className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 ${THEME_TRANSITIONS.default}`}>
                  <p className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${THEME_TRANSITIONS.default}`}>
                    {user.username}
                  </p>
                  <p className={`text-xs text-gray-500 dark:text-gray-400 truncate ${THEME_TRANSITIONS.default}`}>
                    {user.email}
                  </p>
                  {user.role && (
                    <span className={`mt-1 inline-block px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ${THEME_TRANSITIONS.default}`}>
                      {user.role}
                    </span>
                  )}
                </div>
                
                <Link 
                  to="/profile" 
                  className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${THEME_TRANSITIONS.default}`}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profil
                </Link>
                
                <button 
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ${THEME_TRANSITIONS.default}`}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar; 