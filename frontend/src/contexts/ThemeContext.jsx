import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { updateChartsOnThemeChange } from '../utils/chartTheme';
import useThemeDetector from '../hooks/useThemeDetector';

// Create Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Gunakan hook untuk deteksi tema
  const { isDarkTheme, toggleTheme, setTheme } = useThemeDetector();
  
  // Konversi ke nilai yang kompatibel dengan Material UI
  const [materialTheme, setMaterialTheme] = useState(isDarkTheme ? 'dark' : 'light');

  // Efek untuk update Material UI theme saat dark mode berubah
  useEffect(() => {
    setMaterialTheme(isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);
  
  // Efek untuk update charts saat dark mode berubah
  useEffect(() => {
    let timer;
    try {
      // Delay untuk memastikan DOM sudah diperbarui
      timer = setTimeout(() => {
        if (typeof updateChartsOnThemeChange === 'function') {
          updateChartsOnThemeChange();
        }
      }, 300);
    } catch (error) {
      console.error('Error updating charts on theme change:', error);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isDarkTheme]);

  // Fungsi toggle dark mode dengan animasi
  const toggleDarkMode = useCallback(() => {
    try {
      toggleTheme();
      
      // Buat efek flash halus sebagai indikator visual
      const flashOverlay = document.createElement('div');
      flashOverlay.className = `fixed inset-0 bg-white dark:bg-black pointer-events-none z-[9999] transition-opacity duration-300 opacity-0`;
      document.body.appendChild(flashOverlay);
      
      // Tunjukkan flash
      requestAnimationFrame(() => {
        flashOverlay.style.opacity = '0.05';
        
        // Hilangkan flash
        requestAnimationFrame(() => {
          flashOverlay.style.opacity = '0';
          setTimeout(() => {
            flashOverlay.remove();
          }, 300);
        });
      });
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  }, [toggleTheme]);

  // Memoize context value untuk mencegah re-render yang tidak perlu
  const contextValue = useMemo(() => ({
    isDarkMode: isDarkTheme,
    toggleDarkMode,
    setDarkMode: setTheme,
    theme: materialTheme,
    toggleTheme: toggleDarkMode,
    setTheme: (mode) => {
      if (mode === 'dark' || mode === 'light') {
        setTheme(mode === 'dark');
      }
    }
  }), [isDarkTheme, materialTheme, toggleDarkMode, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook untuk menggunakan tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 