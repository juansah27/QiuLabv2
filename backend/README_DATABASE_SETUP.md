# Database Setup untuk Order Monitoring

## Prerequisites

1. **SQL Server ODBC Driver**
   - Install "ODBC Driver 17 for SQL Server" atau versi yang sesuai
   - Download dari: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

2. **Python Dependencies**
   ```bash
   pip install pyodbc==4.0.39
   ```

## Konfigurasi Database

### 1. Menggunakan Konfigurasi yang Sudah Ada

Order Monitoring menggunakan konfigurasi database yang sudah ada di `config.py`. Pastikan variabel berikut sudah diatur di file `.env` atau environment variables:

```env
# Database Configuration (sudah ada di config.py)
DB_SERVER=your_server_name_or_ip
DB_NAME=Flexo_Db
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Tambahan untuk SQL Server (opsional)
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_TRUSTED_CONNECTION=yes
```

### 2. Sesuaikan konfigurasi:

- **DB_SERVER**: Nama server atau IP address SQL Server (sudah ada di config.py)
- **DB_NAME**: Nama database (default: Flexo_Db, sudah ada di config.py)
- **DB_USERNAME & DB_PASSWORD**: Jika menggunakan SQL Server Authentication (sudah ada di config.py)
- **DB_TRUSTED_CONNECTION**: 
  - `yes` untuk Windows Authentication
  - `no` untuk SQL Server Authentication

### 3. Database yang Diperlukan

Pastikan database berikut tersedia:
- `Flexo_Db` - Database utama
- `SPIDSTGEXML` - Database staging
- `WMSPROD` - Database WMS production

### 4. Tables yang Diperlukan

- `Flexo_Db.dbo.SalesOrder`
- `SPIDSTGEXML.dbo.ORDER_LINE_SEG`
- `WMSPROD.dbo.ord_line`
- `WMSPROD.dbo.ord`
- `WMSPROD.dbo.prtmst`

## Testing Connection

Untuk test koneksi database, jalankan:

```bash
cd backend
python test_db_connection.py
```

Atau secara manual:

```python
import pyodbc
from config.database import get_connection_string

try:
    conn = pyodbc.connect(get_connection_string())
    print("Database connection successful!")
    conn.close()
except Exception as e:
    print(f"Database connection failed: {e}")
```

## Troubleshooting

### Error: "ODBC Driver not found"
- Install ODBC Driver yang sesuai dengan versi SQL Server
- Pastikan driver terdaftar di Windows ODBC Data Source Administrator

### Error: "Login failed"
- Periksa username/password jika menggunakan SQL Server Authentication
- Pastikan user memiliki akses ke database yang diperlukan

### Error: "Server not found"
- Periksa nama server/IP address di config.py atau .env
- Pastikan SQL Server berjalan dan dapat diakses dari aplikasi
- Periksa apakah konfigurasi DB_SERVER sudah benar di file .env
