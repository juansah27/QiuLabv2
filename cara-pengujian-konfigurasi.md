# Cara Pengujian Konfigurasi Jaringan

Dokumen ini berisi langkah-langkah praktis untuk memverifikasi bahwa aplikasi dapat berjalan dengan baik di berbagai lingkungan jaringan.

## Persiapan

1. Pastikan dependensi di frontend dan backend sudah terinstal:
   ```bash
   # Di direktori backend
   pip install -r requirements.txt
   
   # Di direktori frontend
   npm install
   ```

2. Pastikan Python package tambahan untuk pengujian sudah terpasang:
   ```bash
   pip install requests netifaces
   ```

## Pengujian Backend

### 1. Jalankan Tes Deteksi Jaringan

1. Buka terminal di direktori backend
2. Jalankan skrip pengujian deteksi jaringan:
   ```bash
   python test_network_detection.py
   ```
3. Perhatikan output pengujian dan pastikan semua tes berhasil

### 2. Pengujian Perubahan Jaringan

1. Jalankan backend dalam mode development:
   ```bash
   python run_dev.py
   ```
2. Catat alamat IP yang terdeteksi (ditampilkan di terminal)
3. Buka browser dan akses endpoint berikut:
   ```
   http://<ip-terdeteksi>:5000/api/config
   ```
4. Verifikasi bahwa endpoint mengembalikan respons JSON yang benar
5. Matikan backend
6. Pindahkan ke jaringan lain (misalnya dari WiFi kantor ke hotspot handphone)
7. Jalankan kembali backend dan pastikan IP terdeteksi berubah sesuai jaringan baru

## Pengujian Frontend

### 1. Pengujian Halaman Diagnostik

1. Pastikan backend sudah berjalan
2. Jalankan frontend dalam mode development:
   ```bash
   npm run dev:network
   ```
3. Buka aplikasi di browser:
   ```
   http://localhost:3000/connection-test
   ```
4. Pada halaman pengujian koneksi:
   - Klik tombol "Jalankan Tes Koneksi"
   - Klik tombol "Jalankan Auto-Discovery"
   - Verifikasi bahwa kedua tes berhasil dan menampilkan hasil yang benar

### 2. Pengujian Auto-Discovery Frontend

1. Matikan backend dan frontend
2. Jalankan backend tanpa memberitahu frontend alamat IP-nya:
   ```bash
   python run_dev.py
   ```
3. Jalankan frontend:
   ```bash
   npm run dev:network
   ```
4. Buka konsol browser (DevTools)
5. Perhatikan log yang menunjukkan proses pencarian backend
6. Verifikasi bahwa frontend berhasil menemukan alamat backend dengan pesan:
   ```
   Server ditemukan di: http://x.x.x.x:5000/api
   Konfigurasi API berhasil dimuat: {...}
   ```

### 3. Pengujian Fallback Mechanism

1. Dengan frontend masih berjalan, matikan backend
2. Refresh halaman frontend
3. Perhatikan bahwa frontend mencoba menemukan backend tetapi gagal
4. Jalankan kembali backend, tetapi di jaringan berbeda
5. Refresh halaman frontend
6. Verifikasi bahwa frontend dapat menemukan backend di alamat IP baru

## Pengujian dari Perangkat Lain

### 1. Akses dari Perangkat Mobile

1. Pastikan backend dan frontend berjalan
2. Pastikan perangkat mobile terhubung ke jaringan yang sama
3. Pada perangkat mobile, buka browser dan akses:
   ```
   http://<ip-komputer>:3000
   ```
4. Verifikasi bahwa aplikasi berjalan dengan benar
5. Coba beberapa fitur yang memerlukan komunikasi dengan backend

## Pengujian Mode Development vs Production

### 1. Mode Development

1. Jalankan backend dalam mode development:
   ```bash
   python run_dev.py
   ```
2. Jalankan frontend dalam mode development:
   ```bash
   npm run dev:network
   ```
3. Perhatikan log detail di terminal dan konsol browser

### 2. Mode Production

1. Jalankan backend dalam mode production:
   ```bash
   python run_prod.py
   ```
2. Build frontend untuk production:
   ```bash
   npm run build
   ```
3. Jalankan hasil build:
   ```bash
   npm run preview:network
   ```
4. Perhatikan bahwa log menjadi lebih minimal
5. Verifikasi bahwa fungsi auto-discovery tetap berjalan dengan baik

## Formulir Hasil Pengujian

| Skenario Pengujian | Status (Berhasil/Gagal) | Catatan |
|--------------------|-------------------------|---------|
| Deteksi IP Backend | | |
| Perubahan Jaringan Backend | | |
| Tes Koneksi Frontend | | |
| Auto-Discovery Frontend | | |
| Fallback Mechanism | | |
| Akses dari Perangkat Lain | | |
| Mode Development | | |
| Mode Production | | | 