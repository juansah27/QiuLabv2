# Pengujian Konfigurasi Otomatis

Dokumen ini berisi langkah-langkah untuk memverifikasi bahwa sistem dapat beradaptasi saat berpindah antar jaringan tanpa perlu konfigurasi manual.

## 1. Pengujian Perubahan Jaringan Backend

### Skenario 1: Perpindahan dari Jaringan Kantor ke Jaringan Rumah

#### Langkah-langkah:
1. **Di Jaringan Kantor:**
   - Jalankan backend dengan `python run_dev.py`
   - Catat alamat IP yang terdeteksi (akan ditampilkan di terminal)
   - Jalankan frontend dengan `npm run dev:network`
   - Verifikasi aplikasi berjalan dengan baik melalui browser

2. **Simulasi Perpindahan Jaringan:**
   - Matikan backend
   - Pindahkan perangkat ke jaringan lain (atau gunakan VPN/hotspot untuk simulasi)
   - Jalankan kembali backend dengan `python run_dev.py`
   - Perhatikan bahwa alamat IP akan berubah secara otomatis
   - Restart frontend dengan `npm run dev:network`
   - Verifikasi bahwa frontend dapat terhubung ke backend tanpa perlu konfigurasi manual

3. **Pengujian Endpoint Konfigurasi:**
   - Dengan backend berjalan, akses `http://<ip-backend>:5000/api/config` dari browser
   - Verifikasi bahwa endpoint mengembalikan data konfigurasi yang benar termasuk apiUrl yang sudah terupdate

### Skenario 2: Pengujian Deteksi IP Otomatis

#### Langkah-langkah:
1. **Setup:**
   - Buka file `backend/config.py` dan tambahkan log untuk melihat proses deteksi IP:
     ```python
     ip = get_local_ip()
     print(f"IP terdeteksi: {ip}")
     ```
   - Jalankan backend di beberapa kondisi jaringan berbeda:
     - Dengan kabel LAN terhubung
     - Dengan WiFi terhubung (LAN dilepas)
     - Dengan koneksi VPN aktif
   - Verifikasi bahwa sistem dapat mendeteksi IP yang tepat di setiap kondisi

## 2. Pengujian Frontend Auto-Discovery

### Skenario 1: Frontend Menemukan Backend di Jaringan Lokal

#### Langkah-langkah:
1. **Setup Pengujian:**
   - Matikan backend dan frontend
   - Hapus `.env.local` di frontend (jika ada) agar tidak menggunakan URL hardcoded
   - Jalankan backend dengan `python run_dev.py`
   - Buka konsol browser (DevTools) untuk melihat log

2. **Jalankan Frontend:**
   - Jalankan frontend dengan `npm run dev:network`
   - Di konsol browser, perhatikan log yang menunjukkan proses pencarian backend
   - Verifikasi bahwa frontend berhasil menemukan backend dengan pesan seperti:
     ```
     Server ditemukan di: http://192.168.x.x:5000/api
     Konfigurasi API berhasil dimuat: {...}
     ```

3. **Pengujian Fallback:**
   - Matikan backend sementara frontend tetap berjalan
   - Perhatikan log di konsol browser yang menunjukkan bahwa frontend gagal terhubung
   - Jalankan kembali backend dengan alamat IP berbeda (gunakan hotspot/VPN)
   - Refresh halaman frontend
   - Verifikasi bahwa frontend dapat menemukan backend dengan alamat baru

## 3. Pengujian dari Perangkat Berbeda

### Skenario 1: Akses dari Perangkat Mobile

#### Langkah-langkah:
1. **Setup:**
   - Pastikan backend dan frontend berjalan di mode jaringan
   - Pastikan perangkat mobile terhubung ke jaringan yang sama
   - Catat alamat IP komputer yang menjalankan backend dan frontend

2. **Akses dari Mobile:**
   - Buka browser di perangkat mobile
   - Akses aplikasi dengan URL `http://<ip-frontend>:3000`
   - Verifikasi bahwa aplikasi berjalan dengan benar
   - Periksa log di frontend untuk memastikan koneksi ke backend berhasil

### Skenario 2: Akses dari Komputer Lain di Jaringan

#### Langkah-langkah:
1. **Setup:**
   - Pastikan backend dan frontend berjalan di mode jaringan
   - Siapkan komputer kedua yang terhubung ke jaringan yang sama

2. **Akses dari Komputer Kedua:**
   - Buka browser di komputer kedua
   - Akses aplikasi dengan URL `http://<ip-frontend>:3000`
   - Verifikasi bahwa aplikasi berjalan dengan benar
   - Coba beberapa fitur yang memerlukan komunikasi dengan backend

## 4. Pengujian Mode Development vs Production

### Skenario 1: Perbandingan Mode Development dan Production

#### Langkah-langkah:
1. **Mode Development:**
   - Jalankan backend dengan `python run_dev.py`
   - Jalankan frontend dengan `npm run dev:network`
   - Periksa output log di terminal backend (harus detail/verbose)
   - Periksa log di konsol browser (harus menampilkan informasi debugging)

2. **Mode Production:**
   - Jalankan backend dengan `python run_prod.py`
   - Build frontend dengan `npm run build`
   - Jalankan hasil build dengan `npm run preview:network`
   - Periksa output log di terminal backend (harus minimal)
   - Periksa konsol browser (seharusnya tidak ada log debugging)
   - Pastikan proses auto-discovery tetap berfungsi di mode production

## Catatan Hasil Pengujian

| Skenario | Status | Catatan |
|----------|--------|---------|
| Perubahan Jaringan Backend | | |
| Deteksi IP Otomatis | | |
| Frontend Auto-Discovery | | |
| Pengujian di Perangkat Mobile | | |
| Pengujian di Komputer Lain | | |
| Perbandingan Dev vs Prod | | |

## Troubleshooting

Jika terjadi masalah saat pengujian:

1. **Frontend tidak dapat menemukan backend:**
   - Periksa status backend dengan akses manual ke `http://<ip-backend>:5000/api/health`
   - Periksa apakah ada firewall yang memblokir koneksi
   - Periksa konsol browser untuk error detail

2. **Deteksi IP gagal:**
   - Periksa output log di terminal backend
   - Coba pengaturan jaringan alternatif (misalnya dari WiFi ke kabel)
   - Verifikasi bahwa fungsi `get_local_ip()` berjalan dengan benar

3. **Aplikasi tidak bisa diakses dari perangkat lain:**
   - Periksa apakah frontend dijalankan dengan opsi host, mis. `--host 0.0.0.0`
   - Periksa firewall komputer dan jaringan
   - Pastikan semua perangkat berada di jaringan yang sama 