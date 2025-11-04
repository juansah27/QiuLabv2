# Date Validation Documentation

## Overview

Sistem validasi tanggal telah ditambahkan untuk mencegah pemrosesan data ketika **End_Date** lebih awal dari **Start_Date**. Validasi ini diterapkan di semua tipe proses (Bundle, Supplementary, dan Gift).

## Masalah yang Diatasi

### Contoh Data Tidak Valid
```
Start_Date: "8/27/2025 00:00"
End_Date:   "8/26/2025 00:00"  ← Lebih awal dari Start_Date
```

**Hasil**: Proses akan dihentikan dengan pesan error yang informatif.

## Implementasi

### 1. Fungsi Validasi (`validate_date_range`)

```python
def validate_date_range(self, df, start_date_col, end_date_col):
    """
    Validate that End_Date is not before Start_Date
    Returns list of invalid rows with details
    """
    invalid_rows = []
    
    for index, row in df.iterrows():
        try:
            start_date_str = str(row[start_date_col]).strip()
            end_date_str = str(row[end_date_col]).strip()
            
            # Skip if dates are empty or invalid
            if pd.isna(start_date_str) or pd.isna(end_date_str) or start_date_str == 'nan' or end_date_str == 'nan':
                continue
            
            # Convert string dates to datetime objects
            start_date = pd.to_datetime(start_date_str, errors='coerce')
            end_date = pd.to_datetime(end_date_str, errors='coerce')
            
            # Skip if conversion failed
            if pd.isna(start_date) or pd.isna(end_date):
                continue
            
            # Check if end_date is before start_date
            if end_date < start_date:
                invalid_rows.append({
                    'row': index + 1,  # Excel row number (1-based)
                    'start_date': start_date_str,
                    'end_date': end_date_str,
                    'sku_bundle': str(row.get('SKU Bundle', 'N/A')),
                    'client': str(row.get('Client', 'N/A')),
                    'marketplace': str(row.get('Marketplace', 'N/A'))
                })
                
        except Exception as e:
            self.log(f"Error validating date range at row {index + 1}: {str(e)}", "warning")
            continue
    
    return invalid_rows
```

### 2. Integrasi di Setiap Process Type

#### Bundle Process
```python
# Validate date ranges before processing
self.log("Memvalidasi range tanggal...")
invalid_date_rows = self.validate_date_range(df, 'Start_Date', 'End_Date')

if invalid_date_rows:
    # Create detailed error message
    error_details = []
    for row_info in invalid_date_rows:
        error_details.append(
            f"Baris {row_info['row']}: SKU '{row_info['sku_bundle']}' "
            f"(Client: {row_info['client']}, Marketplace: {row_info['marketplace']}) - "
            f"Start_Date: {row_info['start_date']}, End_Date: {row_info['end_date']}"
        )
    
    error_msg = (
        f"Data tanggal tidak valid ditemukan di {len(invalid_date_rows)} baris. "
        f"End_Date tidak boleh lebih awal dari Start_Date.\n\n"
        f"Detail error:\n" + "\n".join(error_details)
    )
    
    self.log(error_msg, "error")
    raise ValueError(error_msg)

self.log("Validasi tanggal berhasil - semua range tanggal valid")
```

#### Supplementary Process
```python
# Validate date ranges before processing
self.log("Memvalidasi range tanggal untuk Supplementary...")
invalid_date_rows = self.validate_date_range(df, 'Start_Date', 'End_Date')

if invalid_date_rows:
    # Create detailed error message
    error_details = []
    for row_info in invalid_date_rows:
        error_details.append(
            f"Baris {row_info['row']}: Main SKU '{row_info.get('sku_bundle', 'N/A')}' "
            f"(Client: {row_info['client']}, Marketplace: {row_info['marketplace']}) - "
            f"Start_Date: {row_info['start_date']}, End_Date: {row_info['end_date']}"
        )
    
    error_msg = (
        f"Data tanggal tidak valid ditemukan di {len(invalid_date_rows)} baris. "
        f"End_Date tidak boleh lebih awal dari Start_Date.\n\n"
        f"Detail error:\n" + "\n".join(error_details)
    )
    
    self.log(error_msg, "error")
    raise ValueError(error_msg)

self.log("Validasi tanggal berhasil - semua range tanggal valid")
```

#### Gift Process
```python
# Validate date ranges before processing
self.log("Memvalidasi range tanggal untuk Gift...")
invalid_date_rows = self.validate_date_range(df, 'Start_Date', 'End_Date')

if invalid_date_rows:
    # Create detailed error message
    error_details = []
    for row_info in invalid_date_rows:
        error_details.append(
            f"Baris {row_info['row']}: Main SKU '{row_info.get('sku_bundle', 'N/A')}' "
            f"(Client: {row_info['client']}, Marketplace: {row_info['marketplace']}) - "
            f"Start_Date: {row_info['start_date']}, End_Date: {row_info['end_date']}"
        )
    
    error_msg = (
        f"Data tanggal tidak valid ditemukan di {len(invalid_date_rows)} baris. "
        f"End_Date tidak boleh lebih awal dari Start_Date.\n\n"
        f"Detail error:\n" + "\n".join(error_details)
    )
    
    self.log(error_msg, "error")
    raise ValueError(error_msg)

self.log("Validasi tanggal berhasil - semua range tanggal valid")
```

## Error Handling

### 1. Frontend Error Message
```javascript
// Error message mapping
INVALID_DATE_RANGE: 'Range tanggal tidak valid. End_Date tidak boleh lebih awal dari Start_Date.',

// Error detection in upload context
case 'upload':
  if (error.message.includes('Data tanggal tidak valid') || error.message.includes('End_Date tidak boleh lebih awal')) {
    return ERROR_MESSAGES.INVALID_DATE_RANGE;
  }
```

### 2. Backend Error Response
```python
{
    'status': 'error',
    'message': 'Data tanggal tidak valid ditemukan di 2 baris. End_Date tidak boleh lebih awal dari Start_Date.\n\nDetail error:\nBaris 3: SKU "BUNDLE001" (Client: ClientA, Marketplace: Shopee) - Start_Date: 8/27/2025 00:00, End_Date: 8/26/2025 00:00\nBaris 5: SKU "BUNDLE002" (Client: ClientB, Marketplace: Tokopedia) - Start_Date: 9/1/2025 00:00, End_Date: 8/30/2025 00:00',
    'error_code': 'INVALID_DATE_RANGE',
    'logs': [...]
}
```

## Fitur Validasi

### 1. **Comprehensive Date Parsing**
- Mendukung berbagai format tanggal
- Menggunakan `pd.to_datetime()` dengan `errors='coerce'`
- Skip baris dengan tanggal kosong atau tidak valid

### 2. **Detailed Error Reporting**
- Menampilkan nomor baris Excel (1-based)
- Informasi SKU, Client, dan Marketplace
- Nilai Start_Date dan End_Date yang bermasalah
- Jumlah total baris yang bermasalah

### 3. **Robust Error Handling**
- Skip baris dengan error parsing tanggal
- Log warning untuk baris yang tidak dapat divalidasi
- Tidak menghentikan validasi jika ada error di satu baris

### 4. **Process-Specific Context**
- Bundle: Menampilkan SKU Bundle
- Supplementary: Menampilkan Main SKU
- Gift: Menampilkan Main SKU

## Contoh Error Message

### Single Row Error
```
Data tanggal tidak valid ditemukan di 1 baris. 
End_Date tidak boleh lebih awal dari Start_Date.

Detail error:
Baris 3: SKU 'BUNDLE001' (Client: ClientA, Marketplace: Shopee) - Start_Date: 8/27/2025 00:00, End_Date: 8/26/2025 00:00
```

### Multiple Rows Error
```
Data tanggal tidak valid ditemukan di 3 baris. 
End_Date tidak boleh lebih awal dari Start_Date.

Detail error:
Baris 3: SKU 'BUNDLE001' (Client: ClientA, Marketplace: Shopee) - Start_Date: 8/27/2025 00:00, End_Date: 8/26/2025 00:00
Baris 5: SKU 'BUNDLE002' (Client: ClientB, Marketplace: Tokopedia) - Start_Date: 9/1/2025 00:00, End_Date: 8/30/2025 00:00
Baris 8: SKU 'BUNDLE003' (Client: ClientC, Marketplace: Lazada) - Start_Date: 10/15/2025 00:00, End_Date: 10/10/2025 00:00
```

## Logging

### Success Log
```
[INFO] Memvalidasi range tanggal...
[INFO] Validasi tanggal berhasil - semua range tanggal valid
```

### Error Log
```
[INFO] Memvalidasi range tanggal...
[ERROR] Data tanggal tidak valid ditemukan di 2 baris. End_Date tidak boleh lebih awal dari Start_Date.

Detail error:
Baris 3: SKU 'BUNDLE001' (Client: ClientA, Marketplace: Shopee) - Start_Date: 8/27/2025 00:00, End_Date: 8/26/2025 00:00
Baris 5: SKU 'BUNDLE002' (Client: ClientB, Marketplace: Tokopedia) - Start_Date: 9/1/2025 00:00, End_Date: 8/30/2025 00:00
```

### Warning Log
```
[WARNING] Error validating date range at row 7: Invalid date format
```

## Best Practices

### 1. **Data Preparation**
- Pastikan format tanggal konsisten di file Excel
- Gunakan format yang dapat diparsing oleh pandas
- Hindari tanggal kosong atau tidak valid

### 2. **Error Resolution**
- Periksa detail error untuk mengetahui baris yang bermasalah
- Perbaiki tanggal di file Excel sebelum upload ulang
- Pastikan End_Date selalu setelah atau sama dengan Start_Date

### 3. **Testing**
- Test dengan berbagai format tanggal
- Test dengan data kosong dan tidak valid
- Test dengan multiple rows yang bermasalah

## Future Enhancements

1. **Date Format Validation**: Validasi format tanggal yang lebih ketat
2. **Business Logic Validation**: Validasi tanggal berdasarkan business rules
3. **Auto-correction**: Saran perbaikan otomatis untuk tanggal yang bermasalah
4. **Visual Indicators**: Highlight baris bermasalah di UI
5. **Batch Validation**: Validasi multiple files sekaligus
