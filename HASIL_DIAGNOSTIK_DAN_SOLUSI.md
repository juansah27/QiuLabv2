# Hasil Diagnostik & Solusi - Monitoring Order Lambat di Linux

## 📊 Hasil Diagnostik Awal

Dari hasil `check_monitoring_order.sh`, ditemukan:

### ✅ Yang Sudah OK:
1. **ODBC Driver**: Terinstall (Driver 17 & 18)
2. **OS**: Ubuntu 24.04.3 LTS (stabil)
3. **Python**: 3.12.3
4. **Aplikasi Running**: Uvicorn di port 8001 dengan 4 workers
5. **Firewall**: Port 5000, 8001 sudah di-allow

### ⚠️ Yang Perlu Dicek:
1. **Virtual Environment**: Aplikasi pakai `/opt/venv/`, bukan Python global
2. **Load Average**: 1.53 (cukup tinggi, perlu monitor)
3. **Memory**: 6GB/15GB digunakan (masih OK)
4. **Disk**: 75% terpakai (perlu perhatian)
5. **Log Files**: Perlu cek query execution time

---

## 🔍 Langkah Selanjutnya

### 1. Jalankan Script Detail Check

```bash
cd ~/QiuLabv2
chmod +x check_monitoring_detailed.sh
./check_monitoring_detailed.sh
```

Script ini akan:
- ✅ Cek virtual environment `/opt/venv/`
- ✅ Analisis log untuk query execution time
- ✅ Test koneksi database langsung
- ✅ Test network latency ke SQL Server
- ✅ Cek API endpoint

### 2. Cek Log Aplikasi Manual

```bash
# Cek log production
tail -100 backend/logs/production.log | grep -i "query execution time"

# Atau monitor real-time
tail -f backend/logs/production.log | grep -E "query|timeout|error|monitoring"

# Cek semua error terkait monitoring-order
grep -i "monitoring.order\|monitoring-order" backend/logs/production.log | tail -20
```

### 3. Test Koneksi Database Manual

```bash
# Aktifkan virtual environment
source /opt/venv/bin/activate

# Test connection
python3 << 'EOF'
import os
from dotenv import load_dotenv
import pyodbc
import time
from datetime import datetime, timedelta

load_dotenv('backend/.env')  # atau .env sesuai lokasi

server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWORD')

conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT=90;Mars_Connection=yes;Packet Size=4096;TDS_Version=7.4'

print("Connecting...")
start = time.time()
conn = pyodbc.connect(conn_str, timeout=90)
print(f"Connected in {time.time() - start:.2f}s")

cursor = conn.cursor()

# Test count query
yesterday = datetime.now() - timedelta(days=1)
start_date = yesterday.replace(hour=17, minute=0)
end_date = datetime.now()

query = """
SELECT COUNT(DISTINCT so.SystemRefId)
FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
WHERE so.OrderDate >= ? AND so.OrderDate <= ?
AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN ('cancelled', 'cancellations', 'canceled', 'confirmed', 'to_confirm_receive', 'to_return', 'returned', 'cancel', 'unpaid', 'matched', 'pending_payment','pending','expired')
AND so.FulfilledByFlexo <> '0'
"""

print("Executing count query...")
start = time.time()
cursor.execute(query, (start_date.strftime('%Y-%m-%d %H:%M:%S'), end_date.strftime('%Y-%m-%d %H:%M:%S')))
count = cursor.fetchone()[0]
elapsed = time.time() - start

print(f"Count: {count}")
print(f"Query time: {elapsed:.2f}s")

if elapsed > 30:
    print("⚠️  WARNING: Query sangat lambat!")
elif elapsed > 10:
    print("⚠️  Query agak lambat")
else:
    print("✓ Query performance OK")

conn.close()
EOF
```

### 4. Monitor Resource Saat Aplikasi Running

```bash
# Monitor CPU/Memory real-time
htop

# Atau
watch -n 1 'free -h && echo "" && uptime'

# Monitor disk I/O
iostat -x 1 5
```

### 5. Test Network ke SQL Server

```bash
# Cek IP SQL Server dari .env
grep DB_SERVER backend/.env

# Test ping (ganti dengan IP SQL Server)
ping -c 10 YOUR_SQL_SERVER_IP

# Test port 1433
telnet YOUR_SQL_SERVER_IP 1433
# atau
nc -zv YOUR_SQL_SERVER_IP 1433
```

---

## 🎯 Kemungkinan Penyebab & Solusi

### 1. Query Database Lambat

**Gejala**: Query execution time > 60 detik

**Solusi**:
- Cek index pada kolom `OrderDate` di database
- Kurangi date range filter (default: 17:00 kemarin sampai sekarang)
- Tambah index jika belum ada:
  ```sql
  CREATE INDEX IX_SalesOrder_OrderDate_FulfilledByFlexo 
  ON Flexo_Db.dbo.SalesOrder(OrderDate, FulfilledByFlexo)
  INCLUDE (SystemRefId, OrderStatus, MerchantName, SystemId);
  ```

### 2. Network Latency Tinggi

**Gejala**: Ping ke SQL Server > 50ms

**Solusi**:
- Cek network connection (wired vs wireless)
- Cek apakah SQL Server di network yang sama
- Pertimbangkan connection pooling
- Increase timeout (sudah 90s untuk Linux)

### 3. Resource Server Terbatas

**Gejala**: CPU > 80%, Memory penuh

**Solusi**:
- Upgrade VM resources
- Kurangi jumlah workers uvicorn (saat ini 4)
- Optimasi query untuk mengurangi load

### 4. ODBC Driver Issue

**Gejala**: Connection timeout atau error

**Solusi**:
- Pastikan pakai ODBC Driver 17 (sudah terinstall ✓)
- Cek konfigurasi di `/etc/odbcinst.ini`
- Test connection manual (lihat langkah 3)

---

## 📝 Checklist Troubleshooting

Setelah menjalankan `check_monitoring_detailed.sh`, cek:

- [ ] Query execution time dari log
- [ ] Network latency ke SQL Server
- [ ] Resource usage (CPU/Memory) saat query running
- [ ] Error messages di log
- [ ] Connection test berhasil
- [ ] Index database pada OrderDate

---

## 🚀 Quick Fixes

### Jika Query Lambat:
1. **Kurangi date range** - Gunakan filter yang lebih spesifik
2. **Tambah pagination** - Load data per batch
3. **Enable caching** - Cache hasil query untuk beberapa menit

### Jika Connection Timeout:
1. **Increase timeout** - Sudah 90s untuk Linux (OK)
2. **Check network** - Pastikan koneksi stabil
3. **Retry mechanism** - Tambah retry di aplikasi

### Jika Server Overload:
1. **Reduce workers** - Kurangi dari 4 ke 2 workers
2. **Schedule queries** - Jangan semua user query bersamaan
3. **Upgrade VM** - Tambah CPU/RAM

---

## 📞 Informasi yang Perlu Dikirim

Setelah menjalankan `check_monitoring_detailed.sh`, kirimkan:

1. **Query execution time** dari log atau test manual
2. **Network latency** ke SQL Server (hasil ping)
3. **Resource usage** saat aplikasi running (htop screenshot)
4. **Error messages** (jika ada) dari log
5. **Hasil connection test** (berhasil/gagal, berapa detik)

Dengan informasi ini, kita bisa identifikasi masalah spesifik dan berikan solusi yang tepat.

---

## 📁 File yang Tersedia

- `check_monitoring_order.sh` - Diagnostik dasar
- `check_monitoring_detailed.sh` - Diagnostik detail (JALANKAN INI!)
- `DIAGNOSTIK_LINUX_MONITORING_ORDER.md` - Panduan lengkap
- `CARA_CEK_LINUX.md` - Quick start guide


