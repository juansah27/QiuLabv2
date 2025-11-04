import { useState, useEffect } from 'react';

/**
 * Hook untuk melacak ukuran jendela browser dengan throttling
 * @param {Function} callback - Fungsi yang dipanggil saat ukuran jendela berubah
 * @param {number} [delay=200] - Delay throttling dalam milidetik
 * @returns {Object} Objek ukuran jendela {width, height}
 */
export const useWindowSize = (callback, delay = 200) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  // Untuk throttling
  const [throttleTimeout, setThrottleTimeout] = useState(null);

  useEffect(() => {
    // Handler dengan throttling
    const handleResize = () => {
      // Atur ulang timeout jika sudah ada
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      
      // Buat timeout baru
      setThrottleTimeout(
        setTimeout(() => {
          // Update state
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
          });
          
          // Panggil callback jika disediakan
          if (typeof callback === 'function') {
            callback();
          }
        }, delay)
      );
    };

    // Tambahkan event listener
    window.addEventListener('resize', handleResize);
    
    // Panggil sekali untuk menginisialisasi
    callback && callback();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [callback, delay, throttleTimeout]);

  return windowSize;
};

export default useWindowSize; 