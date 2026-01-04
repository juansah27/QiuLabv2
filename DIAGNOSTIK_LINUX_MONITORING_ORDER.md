# Panduan Diagnostik: Monitoring Order Lambat di Linux Ubuntu VM

## Masalah
Halaman monitoring-order memuat data dengan lambat di Linux Ubuntu VM.

## Langkah Diagnostik

### 1. Cek Log Backend (Python/Flask)

**Langkah:**
```bash
# SSH ke server Ubuntu VM
ssh user@your-server-ip

# Cek log aplikasi Flask/Python
# Jika menggunakan systemd service:
sudo journalctl -u your-app-service -f --lines=100

# Atau jika log ke file:
tail -f /var/log/your-app/app.log

# Atau jika menggunakan PM2:
pm2 logs your-app-name

# Atau jika running manual, cek console output
```

**Yang dicari:**
- Pesan "Query execution time: X.XX seconds"
- Error timeout atau connection error
- Pesan "Platform: Linux" dan timeout values
- Error ODBC driver

---

### 2. Cek Koneksi Database SQL Server

**Langkah:**
```bash
# Test koneksi dari server Linux ke SQL Server
# Install sqlcmd jika belum ada
sudo apt-get update
sudo apt-get install -y curl apt-transport-https

# Test koneksi network
ping your-sql-server-ip
telnet your-sql-server-ip 1433

# Cek latency network
time nc -zv your-sql-server-ip 1433
```

**Yang dicari:**
- Latency tinggi (>100ms)
- Connection timeout
- Network packet loss

---

### 3. Cek ODBC Driver dan Konfigurasi

**Langkah:**
```bash
# Cek ODBC driver terinstall
odbcinst -q -d

# Cek konfigurasi ODBC
cat /etc/odbcinst.ini
cat /etc/odbc.ini

# Test koneksi ODBC
isql -v "DRIVER={ODBC Driver 17 for SQL Server};SERVER=your-server;DATABASE=your-db;UID=user;PWD=pass" -b
```

**Yang dicari:**
- ODBC Driver 17 for SQL Server terinstall
- Konfigurasi driver benar
- Test connection berhasil

---

### 4. Cek Resource Server (CPU, Memory, Disk)

**Langkah:**
```bash
# Cek CPU usage
top
# atau
htop

# Cek memory usage
free -h

# Cek disk I/O
iostat -x 1 5
# atau
iotop

# Cek disk space
df -h

# Cek load average
uptime
```

**Yang dicari:**
- CPU usage tinggi (>80%)
- Memory penuh (swap digunakan)
- Disk I/O tinggi
- Load average tinggi

---

### 5. Cek Query Performance di Database

**Langkah:**
```bash
# Masuk ke Python environment di server
cd /path/to/your/app
source venv/bin/activate  # jika pakai virtualenv

# Jalankan test query langsung
python3 -c "
import pyodbc
import os
from dotenv import load_dotenv
import time

load_dotenv()
server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWORD')

conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT=90;Mars_Connection=yes;Packet Size=4096;TDS_Version=7.4'

start = time.time()
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

# Test simple query
cursor.execute('SELECT COUNT(*) FROM Flexo_Db.dbo.SalesOrder')
result = cursor.fetchone()
print(f'Count: {result[0]}')
print(f'Connection time: {time.time() - start:.2f}s')

# Test monitoring query dengan date filter
from datetime import datetime, timedelta
yesterday = datetime.now() - timedelta(days=1)
start_date = yesterday.replace(hour=17, minute=0, second=0)
end_date = datetime.now()

query = '''
SELECT COUNT(DISTINCT so.SystemRefId) as total_count
FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
WHERE so.OrderDate >= ? AND so.OrderDate <= ?
AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN ('cancelled', 'cancellations', 'canceled', 'confirmed', 'to_confirm_receive', 'to_return', 'returned', 'cancel', 'unpaid', 'matched', 'pending_payment','pending','expired')
AND so.FulfilledByFlexo <> '0'
'''

start = time.time()
cursor.execute(query, (start_date.strftime('%Y-%m-%d %H:%M:%S'), end_date.strftime('%Y-%m-%d %H:%M:%S')))
result = cursor.fetchone()
print(f'Monitoring query count: {result[0]}')
print(f'Query execution time: {time.time() - start:.2f}s')

conn.close()
"
```

**Yang dicari:**
- Query execution time > 30 detik
- Connection timeout
- Error saat execute query

---

### 6. Cek Network Latency ke SQL Server

**Langkah:**
```bash
# Install mssql-tools untuk test koneksi
# Atau gunakan Python script

# Test dengan ping
ping -c 10 your-sql-server-ip

# Test dengan traceroute
traceroute your-sql-server-ip

# Test dengan curl (jika SQL Server punya HTTP endpoint)
curl -v http://your-sql-server-ip:1433
```

**Yang dicari:**
- Latency tinggi (>50ms)
- Packet loss
- Network hops banyak

---

### 7. Cek Index Database (jika punya akses)

**Langkah:**
```sql
-- Jalankan di SQL Server Management Studio atau query tool
-- Cek index pada tabel SalesOrder

-- Cek missing indexes
SELECT 
    migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) AS improvement_measure,
    'CREATE INDEX [missing_index_' + CONVERT (varchar, mig.index_group_handle) + '_' + CONVERT (varchar, mid.index_handle) 
    + '_' + LEFT (PARSENAME(mid.statement, 1), 32) + ']'
    + ' ON ' + mid.statement 
    + ' (' + ISNULL (mid.equality_columns,'') 
    + CASE WHEN mid.equality_columns IS NOT NULL AND mid.inequality_columns IS NOT NULL THEN ',' ELSE '' END
    + ISNULL (mid.inequality_columns, '')
    + ')' 
    + ISNULL (' INCLUDE (' + mid.included_columns + ')', '') AS create_index_statement,
    migs.*, mid.database_id, mid.[statement]
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) > 10
ORDER BY migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) DESC

-- Cek index pada OrderDate
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName,
    ic.is_included_column
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.object_id = OBJECT_ID('Flexo_Db.dbo.SalesOrder')
AND COL_NAME(ic.object_id, ic.column_id) = 'OrderDate'
```

**Yang dicari:**
- Missing indexes pada OrderDate
- Index tidak digunakan
- Fragmented indexes

---

### 8. Cek Application Logs (Frontend)

**Langkah:**
```bash
# Di browser, buka Developer Tools (F12)
# Tab Console - cek error atau warning
# Tab Network - cek waktu response API

# Atau cek log frontend jika ada
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Yang dicari:**
- Request timeout (>120 detik)
- HTTP 500 error
- Slow API response time

---

### 9. Cek Konfigurasi Timeout

**Langkah:**
```bash
# Cek file .env atau config
cat .env | grep -i timeout
cat .env | grep -i db

# Cek kode backend
grep -r "connection_timeout" backend/
grep -r "query_timeout" backend/
grep -r "TIMEOUT" backend/
```

**Yang dicari:**
- Timeout terlalu pendek untuk Linux
- Konfigurasi berbeda antara Windows dan Linux

---

### 10. Cek Firewall dan Security Rules

**Langkah:**
```bash
# Cek firewall Ubuntu
sudo ufw status
sudo iptables -L -n

# Cek jika ada rate limiting
sudo iptables -L -n -v

# Test koneksi dari server ke SQL Server
telnet your-sql-server-ip 1433
```

**Yang dicari:**
- Firewall block port 1433
- Rate limiting aktif
- Security group AWS/Azure block

---

## Solusi Umum

### 1. Optimasi Query
- Pastikan ada index pada `OrderDate`
- Gunakan filter date range yang lebih kecil
- Tambah pagination jika belum ada

### 2. Optimasi Network
- Gunakan connection pooling
- Enable compression (sudah ada di kode)
- Increase packet size (sudah ada untuk Linux)

### 3. Optimasi Server
- Upgrade VM resources (CPU/RAM)
- Gunakan SSD untuk disk
- Optimasi OS (disable unnecessary services)

### 4. Caching
- Implement caching untuk data yang tidak sering berubah
- Gunakan Redis atau memcached

---

## Script Quick Check

Buat file `check_monitoring_order.sh`:

```bash
#!/bin/bash

echo "=== Linux Monitoring Order Diagnostic ==="
echo ""

echo "1. System Info:"
uname -a
echo ""

echo "2. Python Version:"
python3 --version
echo ""

echo "3. ODBC Drivers:"
odbcinst -q -d
echo ""

echo "4. Resource Usage:"
echo "CPU Load:"
uptime
echo ""
echo "Memory:"
free -h
echo ""
echo "Disk:"
df -h
echo ""

echo "5. Network Test (ganti dengan SQL Server IP Anda):"
# ping -c 3 YOUR_SQL_SERVER_IP
echo ""

echo "6. Check Python packages:"
pip3 list | grep -E "(pyodbc|flask|python-dotenv)"
echo ""

echo "=== Done ==="
```

Jalankan:
```bash
chmod +x check_monitoring_order.sh
./check_monitoring_order.sh
```

---

## Next Steps

Setelah menjalankan diagnostik di atas, kirimkan hasil:
1. Query execution time dari log backend
2. Resource usage (CPU, Memory, Disk)
3. Network latency ke SQL Server
4. Error messages (jika ada)
5. ODBC driver version

Dengan informasi ini, kita bisa identifikasi masalah spesifik dan berikan solusi yang tepat.

