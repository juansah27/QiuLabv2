import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateChartsOnThemeChange } from '../utils/chartTheme';

// Buat Theme Context
const ThemeContext = createContext();

// Ekspor ThemeContext agar kompatibel dengan kode yang sudah ada
export { ThemeContext };

// Hook untuk menggunakan tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Mendapatkan preferensi tema dari localStorage atau preferensi sistem
  const getInitialTheme = () => {
    // Cek localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    // Cek preferensi sistem
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());

  // Fungsi untuk toggle tema dengan efek segera pada chart
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });

    // Sedikit delay untuk memastikan DOM diperbarui
    setTimeout(() => {
      if (typeof updateChartsOnThemeChange === 'function') {
        updateChartsOnThemeChange();
      }
    }, 0);
  };

  // Terapkan tema ke body
  useEffect(() => {
    // Perbarui kelas untuk body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update chart jika ada
    if (typeof updateChartsOnThemeChange === 'function') {
      updateChartsOnThemeChange();
    }
  }, [isDarkMode]);

  // Listen untuk perubahan tema sistem
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Hanya perbarui jika tidak ada settingan di localStorage
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode,
      // Legacy support
      theme: isDarkMode ? 'dark' : 'light',
      toggleTheme: toggleDarkMode,
      setTheme: (mode) => {
        if (mode === 'dark' || mode === 'light') {
          setIsDarkMode(mode === 'dark');
        }
      }
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 