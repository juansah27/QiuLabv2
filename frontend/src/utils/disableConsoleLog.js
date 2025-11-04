/**
 * Utilitas untuk menonaktifkan console.log dalam mode produksi
 * Fungsi ini akan menggantikan console.log dengan fungsi kosong 
 * sehingga tidak ada log yang tampil di konsol browser
 */

// Fungsi untuk menonaktifkan console.log
export const disableConsoleLog = (options = {}) => {
  // Opsi default
  const defaultOptions = {
    preserveError: true,      // Tetap pertahankan console.error
    preserveWarn: true,       // Tetap pertahankan console.warn
    replacement: () => {},    // Fungsi pengganti untuk console.log
  };
  
  // Gabungkan opsi yang diberikan dengan default
  const config = { ...defaultOptions, ...options };
  
  // Simpan referensi asli console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    error: console.error,
    warn: console.warn,
  };
  
  // Ganti console.log dengan fungsi kosong
  console.log = config.replacement;
  console.info = config.replacement;
  console.debug = config.replacement;
  
  // Jika error tidak dipertahankan, ganti juga
  if (!config.preserveError) {
    console.error = config.replacement;
  }
  
  // Jika warn tidak dipertahankan, ganti juga
  if (!config.preserveWarn) {
    console.warn = config.replacement;
  }
  
  // Mengembalikan fungsi untuk memulihkan console methods
  return () => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  };
};

// Fungsi untuk menonaktifkan console.log kecuali dalam lingkungan tertentu
export const setupConsoleForEnvironment = () => {
  // Nonaktifkan console.log secara otomatis jika bukan dalam mode development
  if (process.env.NODE_ENV !== 'development') {
    return disableConsoleLog();
  }
  
  // Dalam mode development, tetap pertahankan semua console methods
  return () => {}; // Return no-op restore function
};

// Inisialisasi konsol berdasarkan lingkungan
const restoreConsole = setupConsoleForEnvironment();

export default { 
  disableConsoleLog,
  setupConsoleForEnvironment,
  restoreConsole
}; 