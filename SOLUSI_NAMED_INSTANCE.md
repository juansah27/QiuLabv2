# Solusi: SQL Server Named Instance & Port Issue

## 🔍 Masalah yang Ditemukan

Dari hasil diagnostik:
1. **Port 1433 tidak accessible** - Ini NORMAL untuk named instance!
2. **SQL Server menggunakan named instance**: `10.6.13.33\newjda`
3. **Virtual env path** - Process menggunakan `/opt/venv` tapi tidak terdeteksi

## ✅ Penjelasan Named Instance

SQL Server dengan **named instance** (seperti `\newjda`) menggunakan **dynamic port**, bukan port 1433 standar. 

- **Default instance**: Port 1433 (fixed)
- **Named instance**: Dynamic port (biasanya 1434+ atau port custom)
- **pyodbc** akan otomatis resolve port yang benar jika menggunakan format `server\instance`

## 🚀 Langkah Solusi

### 1. Test Koneksi dengan Script Baru

Saya sudah buat script khusus untuk handle named instance:

```bash
cd ~/QiuLabv2
chmod +x test_sql_connection.sh
./test_sql_connection.sh
```

Script ini akan:
- ✅ Handle named instance dengan benar
- ✅ Test koneksi database langsung
- ✅ Test query COUNT untuk monitoring-order
- ✅ Berikan waktu eksekusi query
- ✅ Diagnosa masalah jika ada

### 2. Cek Virtual Environment

Process uvicorn menggunakan `/opt/venv`, tapi mungkin ada permission issue:

```bash
# Cek apakah path ada
ls -la /opt/venv/bin/python

# Atau cek dari process
ps aux | grep uvicorn | grep -v grep

# Test akses
/opt/venv/bin/python --version
```

### 3. Test Koneksi Manual (jika script gagal)

```bash
# Aktifkan venv (sesuaikan path)
source /opt/venv/bin/activate
# atau
source backend/venv/bin/activate

# Test koneksi
python3 << 'EOF'
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

server = os.getenv('DB_SERVER')  # Format: 10.6.13.33\newjda
database = os.getenv('DB_NAME')
username = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWORD')

# pyodbc akan otomatis resolve port untuk named instance
conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT=90;Mars_Connection=yes;Packet Size=4096;TDS_Version=7.4'

print(f"Connecting to: {server}")
conn = pyodbc.connect(conn_str, timeout=90)
print("✅ Connected!")

cursor = conn.cursor()
cursor.execute("SELECT @@VERSION")
print(cursor.fetchone()[0])

conn.close()
EOF
```

## 🔧 Troubleshooting Named Instance

### Jika Connection Timeout:

1. **Cek SQL Server Browser Service**
   - Named instance memerlukan SQL Server Browser service running
   - Service ini listen di port 1434 (UDP)
   - Pastikan service running di SQL Server

2. **Cek Firewall**
   ```bash
   # Test port 1434 (SQL Server Browser)
   nc -uv 10.6.13.33 1434
   
   # Test beberapa port dynamic
   for port in 14330 14331 14332; do
       timeout 2 bash -c "echo > /dev/tcp/10.6.13.33/$port" && echo "Port $port OK"
   done
   ```

3. **Gunakan Port Spesifik (jika diketahui)**
   ```python
   # Jika tahu port exact, bisa specify:
   server = "10.6.13.33,14330"  # IP,port format
   # atau tetap pakai named instance (recommended)
   server = "10.6.13.33\\newjda"
   ```

### Jika Virtual Env Tidak Ditemukan:

```bash
# Cek semua lokasi possible
find /opt /home /var -name "venv" -type d 2>/dev/null | grep -E "(venv|virtualenv)"

# Cek dari process
ps aux | grep python | grep uvicorn

# Cek permission
ls -la /opt/venv/bin/python
```

## 📊 Expected Results

Setelah menjalankan `test_sql_connection.sh`, Anda harus melihat:

```
✅ Connection successful! (X.XXs)
✅ Simple query OK (X.XXXs)
✅ COUNT query completed!
  Total records: X,XXX
  Query time: X.XXs
```

**Performance benchmarks:**
- Connection time: < 5s (OK), > 10s (perlu cek network)
- COUNT query: < 10s (OK), 10-30s (agak lambat), > 30s (perlu optimasi)

## 🎯 Next Steps

1. **Jalankan test script**:
   ```bash
   ./test_sql_connection.sh
   ```

2. **Jika connection berhasil tapi query lambat**:
   - Cek index pada `OrderDate` di database
   - Kurangi date range filter
   - Optimasi query

3. **Jika connection gagal**:
   - Cek SQL Server Browser service
   - Cek firewall rules
   - Cek network connectivity
   - Cek credentials di .env

4. **Kirimkan hasil**:
   - Output dari `test_sql_connection.sh`
   - Error messages (jika ada)
   - Query execution time

## 📝 Notes

- **Port 1433 tidak accessible = NORMAL** untuk named instance
- pyodbc akan otomatis handle named instance jika format benar
- Pastikan SQL Server Browser service running
- Firewall harus allow port dynamic (1434 UDP + dynamic TCP ports)


