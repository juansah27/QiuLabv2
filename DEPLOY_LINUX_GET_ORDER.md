# Panduan Deployment Get-Order di Linux Server

Dokumen ini menjelaskan langkah-langkah manual untuk menerapkan halaman Get-Order di Linux server.

## 📋 Prasyarat

1. **Server Linux** (Ubuntu 20.04+ recommended)
2. **Akses root/sudo** untuk instalasi
3. **Koneksi ke network share** (SMB/CIFS) untuk akses file `.exe` otomasi
4. **Python 3.8+**
5. **Node.js 16+** (untuk frontend)

---

## 🚀 Langkah-langkah Deployment

### 1. Install Dependencies Sistem

```bash
# Update package manager
sudo apt update

# Install Python dan dependencies
sudo apt install -y python3 python3-venv python3-dev python3-pip
sudo apt install -y build-essential unixodbc-dev

# Install tools untuk mount network share
sudo apt install -y cifs-utils

# Install Node.js (jika belum ada)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install tmux (untuk menjalankan service di background)
sudo apt install -y tmux
```

---

### 2. Mount Network Share

File `.exe` untuk otomasi ada di network share. Anda perlu mount share tersebut.

#### 2.1 Buat Direktori Mount Point

```bash
# Buat direktori untuk mount
sudo mkdir -p /mnt/share2
sudo mkdir -p /mnt/jubelio
sudo mkdir -p /mnt/share1

# Set permissions (sesuaikan dengan user yang akan menjalankan aplikasi)
sudo chown -R $USER:$USER /mnt/share2
sudo chown -R $USER:$USER /mnt/jubelio
sudo chown -R $USER:$USER /mnt/share1
```

#### 2.2 Mount Network Share

**PENTING:** Pastikan direktori mount point sudah dibuat terlebih dahulu (lihat langkah 2.1)!

```bash
# Verifikasi direktori mount point sudah ada
ls -la /mnt/share2
ls -la /mnt/jubelio

# Jika direktori belum ada, buat terlebih dahulu:
sudo mkdir -p /mnt/share2
sudo mkdir -p /mnt/jubelio
```

**Install cifs-utils jika belum terinstall:**
```bash
sudo apt install -y cifs-utils
```

**Test koneksi ke server sebelum mount:**
```bash
# Test ping ke server
ping -c 3 10.6.12.146

# Test apakah port SMB (445) terbuka
telnet 10.6.12.146 445
# Atau
nc -zv 10.6.12.146 445

# PENTING: List shares yang tersedia untuk menemukan nama share yang benar
sudo apt install -y smbclient
smbclient -L //10.6.12.146 -U YOUR_USERNAME
# Masukkan password ketika diminta
# Output akan menampilkan semua share yang tersedia, gunakan nama yang benar!
```

**Mount share (ganti YOUR_USERNAME dan YOUR_PASSWORD, dan nama share yang benar):**

**PENTING:** Gunakan nama share yang benar dari hasil `smbclient -L` di atas! Bisa jadi bukan "share2" tapi "Share2", "SHARE2", atau nama lain.

```bash
# Mount share untuk marketplace (Shopee, Lazada, Tiktok, Desty, Ginee)
# Ganti "share2" dengan nama share yang benar dari hasil smbclient -L
sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
    -o username=YOUR_USERNAME,password=YOUR_PASSWORD,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777

# Jika error dengan versi default, coba dengan versi SMB yang berbeda:
# Versi 1.0 (untuk server Windows lama)
sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
    -o username=YOUR_USERNAME,password=YOUR_PASSWORD,vers=1.0,uid=$(id -u),gid=$(id -g),iocharset=utf8

# Versi 2.0
sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
    -o username=YOUR_USERNAME,password=YOUR_PASSWORD,vers=2.0,uid=$(id -u),gid=$(id -g),iocharset=utf8

# Mount share untuk Jubelio (server berbeda: 10.6.12.174)
# Catatan: Mount share "JubelioJob", lalu akses folder "JubelioManual" di dalamnya
sudo mount -t cifs //10.6.12.174/JubelioJob /mnt/jubelio \
    -o username=YOUR_USERNAME,password=YOUR_PASSWORD,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777

# Set environment variable ke subfolder JubelioManual
export JUBELIO_BASE_PATH="/mnt/jubelio/JubelioManual"

# Verifikasi mount berhasil
ls -la /mnt/share2
ls -la /mnt/jubelio

# Cek apakah sudah ter-mount
mount | grep cifs
df -h | grep /mnt
```

**Jika masih error, coba dengan verbose untuk melihat detail error:**
```bash
sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
    -o username=YOUR_USERNAME,password=YOUR_PASSWORD,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777,verbose

# Check kernel messages untuk detail error
dmesg | tail -20
```

#### 2.3 Mount Permanen (Auto-mount saat boot)

Edit `/etc/fstab` untuk auto-mount:

```bash
sudo nano /etc/fstab
```

Tambahkan baris berikut (ganti USERNAME dan PASSWORD dengan credentials):

```bash
# Network shares untuk Get-Order
//10.6.0.6/share2 /mnt/share2 cifs username=YOUR_USERNAME,password=YOUR_PASSWORD,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777,_netdev 0 0
//10.6.12.174/JubelioJob/JubelioManual /mnt/jubelio cifs username=YOUR_USERNAME,password=YOUR_PASSWORD,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777,_netdev 0 0
```

**Catatan:** Untuk keamanan lebih baik, gunakan credential file:

```bash
# Buat file credentials
sudo nano /etc/cifs-credentials
```

Isi file:
```
username=YOUR_USERNAME
password=YOUR_PASSWORD
domain=YOUR_DOMAIN
```

Set permissions:
```bash
sudo chmod 600 /etc/cifs-credentials
```

Update `/etc/fstab`:
```bash
//10.6.0.6/share2 /mnt/share2 cifs credentials=/etc/cifs-credentials,uid=$(id -u),gid=$(id -g),iocharset=utf8,file_mode=0777,dir_mode=0777,_netdev 0 0
```

---

### 3. Clone/Copy Project

```bash
# Clone repository (atau copy dari Windows)
git clone https://github.com/juansah27/QiuLabv2.git
cd QiuLabv2

# Atau jika sudah ada, pull latest changes
git pull origin main
```

---

### 4. Setup Environment Variables

Set environment variables untuk path marketplace. Ada 2 cara:

#### 4.1 Method 1: Export di Shell (Sementara)

Tambahkan ke `~/.bashrc` atau `~/.profile`:

```bash
nano ~/.bashrc
```

Tambahkan di akhir file:

```bash
# Get-Order Path Configuration
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
export TIKTOK_BASE_PATH="/mnt/share2/TIKTOK/GetOrderTiktok"
export LAZADA_BASE_PATH="/mnt/share2/LAZADA/LazadaGetOrder"
export DESTY_BASE_PATH="/mnt/share2/DESTY/DestyGetOrder"
export GINEE_BASE_PATH="/mnt/share2/GINEE"
export JUBELIO_BASE_PATH="/mnt/jubelio/JubelioManual"
```

Apply changes:
```bash
source ~/.bashrc
```

#### 4.2 Method 2: File .env (Recommended untuk Flask)

Buat file `.env` di direktori `backend/`:

```bash
cd backend
nano .env
```

Tambahkan:

```env
# Get-Order Path Configuration
SHOPEE_BASE_PATH=/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
TIKTOK_BASE_PATH=/mnt/share2/TIKTOK/GetOrderTiktok
LAZADA_BASE_PATH=/mnt/share2/LAZADA/LazadaGetOrder
DESTY_BASE_PATH=/mnt/share2/DESTY/DestyGetOrder
GINEE_BASE_PATH=/mnt/share2/GINEE
JUBELIO_BASE_PATH=/mnt/jubelio/JubelioManual
```

**Catatan:** Pastikan path sesuai dengan struktur folder di network share Anda. Verifikasi dengan:
```bash
ls -la "$SHOPEE_BASE_PATH"
ls -la "$LAZADA_BASE_PATH"
# dll
```

---

### 5. Setup Backend

```bash
cd backend

# Buat virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Jika ada masalah dengan pyodbc, install manual:
sudo apt install -y unixodbc unixodbc-dev
# Download dan install Microsoft ODBC Driver
# https://docs.microsoft.com/en-us/sql/connect/odbc/linux-mac/install-microsoft-odbc-driver-sql-server-macos
```

---

### 6. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build untuk production
npm run build
```

---

### 7. Verifikasi Konfigurasi Path

Test apakah path sudah terdeteksi dengan benar:

```bash
cd backend
source venv/bin/activate
python3 -c "from otomasi.path_helper import get_shopee_path, get_lazada_path, get_jubelio_path; print('Shopee:', get_shopee_path()); print('Lazada:', get_lazada_path()); print('Jubelio:', get_jubelio_path())"
```

Output harus menunjukkan path yang benar, contoh:
```
[OK] Using SHOPEE path from env: /mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
[OK] Using LAZADA path from env: /mnt/share2/LAZADA/LazadaGetOrder
[OK] Using JUBELIO path from env: /mnt/jubelio
Shopee: /mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
Lazada: /mnt/share2/LAZADA/LazadaGetOrder
Jubelio: /mnt/jubelio
```

---

### 8. Test Script Get-Order Manual

Test apakah script bisa membaca file dan folder:

```bash
cd backend/otomasi
source ../venv/bin/activate

# Test load orders
python3 Get_Otomasi_Shopee.py
python3 Get_Otomasi_Lazada.py
python3 Get_Otomasi_Jubelio.py
```

Jika ada error, periksa:
- Apakah network share sudah ter-mount?
- Apakah path benar?
- Apakah user punya permission untuk read/write di network share?

---

### 9. Jalankan Aplikasi

#### 9.1 Development Mode

```bash
# Backend (terminal 1)
cd backend
source venv/bin/activate
export FLASK_APP=app.py
export FLASK_ENV=development
python app.py

# Frontend (terminal 2)
cd frontend
npm run dev
```

#### 9.2 Production Mode dengan tmux

```bash
# Buat session tmux untuk backend
tmux new -s qiulab-backend -d
tmux send-keys -t qiulab-backend "cd /path/to/QiuLabv2/backend && source venv/bin/activate && export FLASK_APP=app.py && export FLASK_ENV=production && python app.py" Enter

# Buat session tmux untuk frontend (atau serve static files dengan nginx)
tmux new -s qiulab-frontend -d
tmux send-keys -t qiulab-frontend "cd /path/to/QiuLabv2/frontend && npm run build && npx serve -s dist -l 3000" Enter

# Check status
tmux list-sessions
```

#### 9.3 Production dengan gunicorn (Recommended)

```bash
cd backend
source venv/bin/activate

# Jalankan dengan gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

Untuk frontend, gunakan nginx atau serve static files:

```bash
# Install nginx
sudo apt install -y nginx

# Copy build frontend
sudo cp -r frontend/dist/* /var/www/html/

# Atau serve dengan simple server
cd frontend
npm run build
npx serve -s dist -l 80
```

---

### 10. Verifikasi Get-Order Berfungsi

1. **Akses halaman Get-Order:**
   - Buka browser: `http://YOUR_SERVER_IP/get-order`
   - Atau jika pakai port custom: `http://YOUR_SERVER_IP:PORT/get-order`

2. **Test dengan input order:**
   - Masukkan test order, contoh:
     ```
     TEST BRAND	SP-123456789
     ```
   - Klik "Check" atau "Run"
   - Verifikasi tidak ada error path

3. **Cek log:**
   ```bash
   # Jika pakai tmux
   tmux attach -t qiulab-backend
   
   # Atau cek log file
   tail -f backend/logs/app.log
   ```

---

## 🔧 Troubleshooting

### Issue: Network share tidak bisa di-mount

**Error: "mount error(2): No such file or directory"**

**Penyebab dan Solusi:**

1. **Direktori mount point belum dibuat:**
   ```bash
   # Pastikan direktori sudah dibuat
   sudo mkdir -p /mnt/share2
   ls -la /mnt/share2  # Harus tidak error
   ```

2. **cifs-utils belum terinstall:**
   ```bash
   sudo apt install -y cifs-utils
   ```

3. **Path share salah atau server tidak bisa diakses:**
   ```bash
   # Test koneksi
   ping -c 3 10.6.12.146
   
   # Test port SMB
   nc -zv 10.6.12.146 445
   # Atau
   telnet 10.6.12.146 445
   
   # List shares yang tersedia (jika smbclient terinstall)
   sudo apt install -y smbclient
   smbclient -L //10.6.12.146 -U YOUR_USERNAME
   ```

4. **Username/password salah atau format share path salah:**
   ```bash
   # Coba mount dengan verbose untuk melihat detail error
   sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
       -o username=YOUR_USERNAME,password=YOUR_PASSWORD,verbose
   
   # Check kernel messages
   dmesg | tail -30
   journalctl -xe | tail -30
   ```

5. **Format share path mungkin berbeda:**
   ```bash
   # Beberapa kemungkinan format:
   # //SERVER/SHARE
   # //SERVER/SHARE$  (hidden share dengan $ di akhir)
   # //IP/SHARE
   
   # Coba list shares dulu
   smbclient -L //10.6.12.146 -U ayu%Sweeping123
   ```

6. **SMB versi tidak kompatibel:**
   ```bash
   # Coba dengan versi SMB 1.0 (kurang aman tapi kadang diperlukan)
   sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
       -o username=YOUR_USERNAME,password=YOUR_PASSWORD,vers=1.0
   
   # Atau versi 2.0
   sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
       -o username=YOUR_USERNAME,password=YOUR_PASSWORD,vers=2.0
   
   # Atau versi 3.0 (default modern)
   sudo mount -t cifs //10.6.12.146/share2 /mnt/share2 \
       -o username=YOUR_USERNAME,password=YOUR_PASSWORD,vers=3.0
   ```

### Issue: Permission denied pada network share

**Solusi:**
```bash
# Mount dengan uid/gid
sudo mount -t cifs //SERVER/SHARE /mnt/share2 \
    -o username=USER,password=PASS,uid=$(id -u),gid=$(id -g)
```

### Issue: Script tidak bisa menemukan .exe

**Solusi:**
1. Verifikasi path dengan:
   ```bash
   ls -la "$SHOPEE_BASE_PATH"
   ```
2. Cek environment variable:
   ```bash
   echo $SHOPEE_BASE_PATH
   ```
3. Pastikan path benar di `.env` atau export di shell

### Issue: Python tidak bisa execute .exe

**Catatan:** `.exe` adalah Windows executable. Di Linux, Anda perlu:
- Menggunakan Wine untuk menjalankan .exe
- Atau pastikan ada versi Linux-native executable
- Atau gunakan remote execution ke Windows server

**Install Wine (jika perlu):**
```bash
sudo apt install -y wine
# Test
wine /path/to/executable.exe
```

### Issue: Path dengan spasi tidak terdeteksi

**Solusi:** Gunakan quotes saat set environment variable:
```bash
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
```

---

## 📝 Checklist Deployment

- [ ] Dependencies sistem terinstall
- [ ] Network share ter-mount dan bisa diakses
- [ ] Environment variables sudah di-set
- [ ] Backend dependencies terinstall
- [ ] Frontend dependencies terinstall dan di-build
- [ ] Path verification test berhasil
- [ ] Script Get-Order bisa dijalankan manual
- [ ] Aplikasi berjalan tanpa error
- [ ] Halaman Get-Order bisa diakses di browser
- [ ] Test order berhasil diproses

---

## 🔐 Keamanan

1. **Jangan hardcode credentials** di script atau code
2. **Gunakan credential file** dengan permission 600 untuk mount
3. **Set firewall** untuk membatasi akses ke aplikasi
4. **Gunakan HTTPS** di production (nginx + SSL)
5. **Regular backup** untuk konfigurasi dan data

---

## 📞 Support

Jika ada masalah, check:
1. Log aplikasi: `backend/logs/app.log`
2. System log: `journalctl -xe`
3. Network share mount: `mount | grep cifs`
4. Environment variables: `env | grep _BASE_PATH`

