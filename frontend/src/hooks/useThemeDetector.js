import { useState, useEffect, useCallback } from 'react';

/**
 * Hook untuk mendeteksi preferensi tema gelap dari sistem
 * Juga mendengarkan perubahan preferensi di tingkat sistem
 */
const useThemeDetector = () => {
  // Fungsi untuk memeriksa apakah mode gelap diaktifkan
  const getCurrentTheme = useCallback(() => {
    try {
      // Prioritaskan localStorage jika ada
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      
      // Jika tidak ada pengaturan, gunakan preferensi browser
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.error('Error getting current theme:', error);
      return false; // Default to light theme on error
    }
  }, []);
  
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme);
  
  // Effect untuk update tema berdasarkan preferensi sistem
  useEffect(() => {
    let darkThemeMediaQuery;
    let handleSystemThemeChange;

    try {
      darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Handler untuk perubahan tema di level sistem
      handleSystemThemeChange = (event) => {
        // Cek apakah tema sudah diatur di localStorage
        if (!localStorage.getItem('theme')) {
          setIsDarkTheme(event.matches);
          applyTheme(event.matches);
        }
      };
      
      // Attach listener untuk perubahan tema
      darkThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } catch (error) {
      console.error('Error setting up theme detector:', error);
    }
    
    // Cleanup listener saat komponen unmount
    return () => {
      if (darkThemeMediaQuery && handleSystemThemeChange) {
        darkThemeMediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, []);
  
  // Fungsi untuk menerapkan tema ke DOM
  const applyTheme = useCallback((isDark) => {
    try {
      // Tambahkan transisi halus ke seluruh halaman
      document.documentElement.classList.add('theme-transition');
      
      // Terapkan kelas dark mode
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Simpan preferensi di localStorage
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Hilangkan kelas transisi setelah animasi selesai
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transition');
        }, 350); // sedikit lebih lama dari durasi transisi untuk memastikan transisi selesai
      });
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, []);
  
  // Fungsi untuk toggle tema
  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    applyTheme(newTheme);
  }, [isDarkTheme, applyTheme]);
  
  // Fungsi untuk set tema spesifik
  const setTheme = useCallback((isDark) => {
    setIsDarkTheme(isDark);
    applyTheme(isDark);
  }, [applyTheme]);
  
  return {
    isDarkTheme,
    toggleTheme,
    setTheme
  };
};

export default useThemeDetector; 