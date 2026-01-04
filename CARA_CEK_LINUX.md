# Cara Cek VM Linux Ubuntu - Monitoring Order Lambat

## Quick Start

### Langkah 1: Upload Script ke Server
```bash
# Upload file check_monitoring_order.sh ke server Ubuntu VM
scp check_monitoring_order.sh user@your-server-ip:/home/user/
```

### Langkah 2: Jalankan Script Diagnostik
```bash
# SSH ke server
ssh user@your-server-ip

# Masuk ke direktori aplikasi
cd /path/to/your/app

# Jalankan script
bash check_monitoring_order.sh

# Atau jika sudah di server, langsung:
chmod +x check_monitoring_order.sh
./check_monitoring_order.sh
```

### Langkah 3: Cek Log Aplikasi
```bash
# Jika menggunakan systemd:
sudo journalctl -u your-app-service -f --lines=50

# Jika menggunakan PM2:
pm2 logs your-app-name --lines 50

# Jika log ke file:
tail -f /var/log/your-app/app.log

# Cari pesan "Query execution time"
grep "Query execution time" /var/log/your-app/app.log | tail -10
```

### Langkah 4: Test Koneksi Database
```bash
# Test ping ke SQL Server
ping -c 5 YOUR_SQL_SERVER_IP

# Test port 1433
telnet YOUR_SQL_SERVER_IP 1433
# atau
nc -zv YOUR_SQL_SERVER_IP 1433
```

### Langkah 5: Cek Resource Server
```bash
# Monitor resource real-time
htop
# atau
top

# Cek memory
free -h

# Cek disk
df -h
iostat -x 1 5
```

## Yang Perlu Dicek

1. **Query Execution Time** - Harus < 30 detik, jika > 60 detik = masalah
2. **Network Latency** - Ping ke SQL Server harus < 50ms
3. **Resource Usage** - CPU < 80%, Memory tidak penuh
4. **ODBC Driver** - Harus terinstall "ODBC Driver 17 for SQL Server"
5. **Connection Timeout** - Di kode sudah 90s untuk Linux, cek apakah cukup

## Troubleshooting Cepat

### Jika Query Timeout:
```bash
# Cek apakah query terlalu kompleks
# Cek index pada OrderDate di database
# Kurangi date range filter
```

### Jika Connection Error:
```bash
# Cek ODBC driver
odbcinst -q -d

# Test connection manual
python3 -c "import pyodbc; print(pyodbc.version)"
```

### Jika Server Lambat:
```bash
# Cek resource
htop
free -h
df -h

# Cek process yang makan resource
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

## Kirimkan Hasil

Setelah menjalankan diagnostik, kirimkan:
1. Output dari `check_monitoring_order.sh`
2. Log aplikasi (terutama "Query execution time")
3. Hasil `ping` ke SQL Server
4. Hasil `htop` atau `top` saat aplikasi running

## File Terkait

- `DIAGNOSTIK_LINUX_MONITORING_ORDER.md` - Panduan lengkap
- `check_monitoring_order.sh` - Script diagnostik otomatis

