# Error Handling Documentation

## Overview

Sistem error handling yang telah ditingkatkan untuk halaman Setup Request memberikan pesan error yang lebih informatif dan user-friendly kepada pengguna.

## Komponen Error Handling

### 1. Error Handler Utility (`utils/errorHandler.js`)

File utility yang berisi fungsi-fungsi untuk menangani error secara terpusat:

#### Fungsi Utama:
- `getErrorMessage(error, context)` - Mengembalikan pesan error yang user-friendly
- `handleAxiosError(error, context)` - Menangani error dari Axios requests
- `validateFile(file)` - Validasi file sebelum upload
- `withRetry(requestFn, maxRetries, delay)` - Retry mechanism untuk failed requests
- `logError(error, context, additionalData)` - Logging error dengan context

#### Error Message Categories:
- **Network Errors**: Koneksi internet, timeout
- **File Upload Errors**: Ukuran file, format file, file rusak
- **Processing Errors**: Error saat memproses data
- **Authentication Errors**: Session expired, permission denied
- **Database Errors**: Error database operations
- **Server Errors**: Server unavailable, maintenance

### 2. HTTP Status Code Mappings

```javascript
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
```

## Implementasi di Frontend

### 1. File Validation
```javascript
const validation = validateFile(file);
if (!validation.isValid) {
  setErrorMessage(validation.errorMessage);
  return;
}
```

### 2. Retry Mechanism
```javascript
const response = await withRetry(async () => {
  return await axios.post('/api/setup-request/process', formData);
}, 3, 2000);
```

### 3. Error Handling dengan Context
```javascript
const { message } = handleAxiosError(error, 'upload');
setErrorMessage(message);
```

## Implementasi di Backend

### 1. Error Response Format
```python
{
    'status': 'error',
    'message': 'Pesan error yang informatif',
    'error_code': 'ERROR_CODE',
    'details': 'Detail teknis (hanya di debug mode)'
}
```

### 2. Error Codes
- `MISSING_DATA` - Data form atau file tidak diterima
- `FILE_NOT_FOUND` - File tidak ditemukan dalam request
- `EMPTY_FILENAME` - Nama file kosong
- `INVALID_FILE_TYPE` - Format file tidak didukung
- `FILE_TOO_LARGE` - File terlalu besar
- `PROCESSING_FAILED` - Gagal memproses file
- `UNEXPECTED_ERROR` - Error yang tidak terduga
- `SESSION_NOT_FOUND` - Session tidak ditemukan
- `OUTPUT_FILE_NOT_FOUND` - File hasil tidak ditemukan
- `DOWNLOAD_ERROR` - Error saat download
- `MISSING_REQUIRED_FIELDS` - Field yang diperlukan tidak ada
- `MAPPING_ADD_FAILED` - Gagal menambahkan mapping
- `MAPPING_ERROR` - Error saat operasi mapping
- `INSUFFICIENT_PERMISSIONS` - Tidak memiliki izin
- `MAPPING_DELETE_FAILED` - Gagal menghapus mapping
- `NO_FILE_SENT` - Tidak ada file yang dikirim
- `IMPORT_FAILED` - Gagal mengimpor mapping
- `IMPORT_ERROR` - Error saat import

### 3. File Validation di Backend
```python
# Check file size (10MB limit)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
file.seek(0, 2)  # Seek to end to get file size
file_size = file.tell()
file.seek(0)  # Reset to beginning

if file_size > MAX_FILE_SIZE:
    file_size_mb = file_size / (1024 * 1024)
    return jsonify({
        'status': 'error',
        'message': f'File terlalu besar ({file_size_mb:.2f}MB). Maksimal ukuran file adalah 10MB.',
        'error_code': 'FILE_TOO_LARGE',
        'file_size_mb': round(file_size_mb, 2),
        'max_size_mb': 10
    }), 413
```

### 4. Excel Processing Error Handling
```python
except pd.errors.EmptyDataError:
    error_msg = "File Excel kosong atau tidak berisi data yang valid. Pastikan file memiliki data yang dapat diproses."
    self.log(error_msg, "error")
    return {"status": "error", "logs": self.logs, "error": error_msg}
except pd.errors.ParserError as e:
    error_msg = f"File Excel rusak atau tidak dapat dibaca: {str(e)}. Pastikan file tidak rusak dan dapat dibuka di Excel."
    self.log(error_msg, "error")
    return {"status": "error", "logs": self.logs, "error": error_msg}
```

## UI Improvements

### 1. Enhanced Error Alert
```javascript
<Alert 
  onClose={() => handleCloseAlert('error')} 
  severity="error"
  variant="filled"
  icon={<ErrorOutlineIcon />}
  sx={{ 
    width: '100%',
    '& .MuiAlert-message': {
      width: '100%'
    }
  }}
>
  <AlertTitle sx={{ fontWeight: 'bold' }}>Terjadi Kesalahan</AlertTitle>
  {errorMessage}
</Alert>
```

### 2. File Size Display
```javascript
message: `File dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
```

### 3. Extended Auto-hide Duration
- Error messages: 8 seconds (dari 6 seconds)
- Success messages: 6 seconds

## Best Practices

### 1. Error Logging
- Semua error di-log dengan context yang jelas
- Detail teknis hanya ditampilkan di development mode
- Error tracking service dapat diintegrasikan (Sentry)

### 2. User Experience
- Pesan error dalam bahasa Indonesia
- Memberikan solusi atau saran tindakan
- Tidak menampilkan detail teknis ke user

### 3. Retry Strategy
- Retry otomatis untuk network errors
- Exponential backoff untuk retry
- Maksimal 3 retry untuk upload, 2 retry untuk operasi lain

### 4. Validation
- Client-side validation untuk immediate feedback
- Server-side validation untuk security
- File validation sebelum upload

## Testing Error Scenarios

### 1. Network Errors
- Disconnect internet connection
- Slow network simulation
- Server timeout

### 2. File Errors
- Upload file dengan format salah
- Upload file terlalu besar
- Upload file kosong
- Upload file rusak

### 3. Permission Errors
- Access tanpa login
- Access dengan role yang tidak sesuai
- Delete mapping tanpa permission admin

### 4. Data Errors
- Submit form dengan data kosong
- Upload file dengan kolom yang salah
- Import CSV dengan format tidak sesuai

## Monitoring dan Analytics

### 1. Error Tracking
```javascript
// Log error dengan context
logError(error, 'upload', {
  fileSize: file.size,
  fileType: file.type,
  processType: processType
});
```

### 2. Performance Monitoring
- Upload time tracking
- Processing time tracking
- Error rate monitoring

### 3. User Behavior
- Error frequency per user
- Most common error types
- User recovery actions

## Future Improvements

1. **Real-time Error Notifications** - WebSocket untuk error updates
2. **Error Recovery Suggestions** - AI-powered error resolution
3. **Progressive Error Handling** - Graceful degradation
4. **Error Analytics Dashboard** - Admin panel untuk monitoring
5. **Automated Error Reporting** - Integration dengan ticketing system
