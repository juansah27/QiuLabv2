/**
 * Centralized error handling utility for the application
 */

// Error message mappings for different error types
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  TIMEOUT_ERROR: 'Permintaan timeout. Silakan coba lagi.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File terlalu besar. Maksimal ukuran file adalah 10MB.',
  INVALID_FILE_TYPE: 'Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).',
  FILE_CORRUPTED: 'File rusak atau tidak dapat dibaca. Silakan periksa file Anda.',
  FILE_EMPTY: 'File kosong atau tidak berisi data yang valid.',
  
  // Processing errors
  PROCESSING_ERROR: 'Terjadi kesalahan saat memproses file. Silakan coba lagi.',
  INVALID_DATA_FORMAT: 'Format data dalam file tidak sesuai dengan template yang diharapkan.',
  MISSING_REQUIRED_COLUMNS: 'File tidak memiliki kolom yang diperlukan.',
  DUPLICATE_DATA: 'Data duplikat ditemukan dalam file.',
  INVALID_DATE_RANGE: 'Range tanggal tidak valid. End_Date tidak boleh lebih awal dari Start_Date.',
  
  // Authentication errors
  UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
  
  // Database errors
  DATABASE_ERROR: 'Terjadi kesalahan pada database. Silakan coba lagi.',
  DUPLICATE_MAPPING: 'Mapping dengan data yang sama sudah ada.',
  
  // Server errors
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  SERVICE_UNAVAILABLE: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.',
  VALIDATION_ERROR: 'Data yang dimasukkan tidak valid. Silakan periksa kembali.'
};

// HTTP status code mappings
const HTTP_STATUS_MESSAGES = {
  400: 'Permintaan tidak valid. Periksa data yang dikirim.',
  401: 'Anda harus login untuk mengakses fitur ini.',
  403: 'Anda tidak memiliki izin untuk mengakses fitur ini.',
  404: 'Data atau file yang diminta tidak ditemukan.',
  413: 'File terlalu besar untuk diproses.',
  422: 'Data yang dikirim tidak valid.',
  429: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
  500: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  502: 'Server sedang dalam pemeliharaan. Silakan coba lagi nanti.',
  503: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
  504: 'Server tidak merespons. Silakan coba lagi nanti.'
};

/**
 * Get user-friendly error message based on error type
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred (e.g., 'upload', 'mapping', 'download')
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, context = 'general') => {
  // If error has a specific message from server, use it
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for specific error types
  if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  // Check HTTP status codes
  if (error.response?.status) {
    const statusMessage = HTTP_STATUS_MESSAGES[error.response.status];
    if (statusMessage) {
      return statusMessage;
    }
  }
  
  // Context-specific error messages
  switch (context) {
         case 'upload':
       if (error.message.includes('File too large')) {
         return ERROR_MESSAGES.FILE_TOO_LARGE;
       }
       if (error.message.includes('Invalid file type')) {
         return ERROR_MESSAGES.INVALID_FILE_TYPE;
       }
       if (error.message.includes('File corrupted')) {
         return ERROR_MESSAGES.FILE_CORRUPTED;
       }
       if (error.message.includes('Data tanggal tidak valid') || error.message.includes('End_Date tidak boleh lebih awal')) {
         return ERROR_MESSAGES.INVALID_DATE_RANGE;
       }
       return ERROR_MESSAGES.PROCESSING_ERROR;
      
    case 'mapping':
      if (error.response?.status === 409) {
        return ERROR_MESSAGES.DUPLICATE_MAPPING;
      }
      return ERROR_MESSAGES.DATABASE_ERROR;
      
    case 'download':
      if (error.response?.status === 404) {
        return 'File hasil tidak ditemukan. Silakan proses ulang file Anda.';
      }
      return 'Gagal mengunduh file. Silakan coba lagi.';
      
    case 'template':
      return 'Gagal mengunduh template. Silakan coba lagi.';
      
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

/**
 * Log error with additional context
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logError = (error, context = 'general', additionalData = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', errorInfo);
  }
  
  // Here you could also send to error tracking service like Sentry
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     extra: errorInfo
  //   });
  // }
};

/**
 * Handle axios error with proper error message extraction
 * @param {Error} error - Axios error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} Object containing error message and should retry flag
 */
export const handleAxiosError = (error, context = 'general') => {
  const message = getErrorMessage(error, context);
  const shouldRetry = error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
  
  logError(error, context, {
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
    method: error.config?.method
  });
  
  return {
    message,
    shouldRetry,
    status: error.response?.status,
    originalError: error
  };
};

/**
 * Validate file before upload
 * @param {File} file - File object to validate
 * @returns {Object} Validation result with isValid and errorMessage
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, errorMessage: 'Tidak ada file yang dipilih.' };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, errorMessage: ERROR_MESSAGES.FILE_TOO_LARGE };
  }
  
  // Check file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream' // Some systems may use this for Excel files
  ];
  
  const fileExtension = file.name.toLowerCase();
  const isValidExtension = fileExtension.endsWith('.xlsx') || fileExtension.endsWith('.xls');
  const isValidType = allowedTypes.includes(file.type) || isValidExtension;
  
  if (!isValidType) {
    return { isValid: false, errorMessage: ERROR_MESSAGES.INVALID_FILE_TYPE };
  }
  
  return { isValid: true, errorMessage: null };
};

/**
 * Create retry mechanism for failed requests
 * @param {Function} requestFn - Function that makes the request
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} Promise that resolves with the result or rejects with error
 */
export const withRetry = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const { shouldRetry } = handleAxiosError(error);
      
      if (!shouldRetry || attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};
