# Panduan Menjalankan Aplikasi

Aplikasi ini terdiri dari dua bagian: backend (Flask) dan frontend (React/Vite). Berikut adalah langkah-langkah untuk menjalankan aplikasi di jaringan 192.168.1.14.

## Author Information

**QiuLab** - A smart insight tool built by Handiyan Juansah

- **Developer**: Handiyan Juansah
- **LinkedIn**: [https://linkedin.com/in/handiyanjuansah](https://linkedin.com/in/handiyanjuansah)

## Menjalankan Backend

1. Pastikan Python 3.8+ telah terpasang
2. Masuk ke direktori backend
   ```
   cd backend
   ```
3. Siapkan virtual environment (opsional tapi disarankan)
   ```
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
4. Instal dependensi
   ```
   pip install -r requirements.txt
   ```
5. Jalankan server menggunakan waitress
   ```
   python run_waitress.py
   ```
   
Server akan berjalan di http://192.168.1.14:5000

## Menjalankan Frontend

1. Pastikan Node.js (versi 16+) telah terpasang
2. Masuk ke direktori frontend
   ```
   cd frontend
   ```
3. Instal dependensi
   ```
   npm install
   ```
4. Jalankan server development untuk akses jaringan
   ```
   npm run dev:network
   ```
   
Frontend akan berjalan di http://192.168.1.14:3000

## Akses Aplikasi

Setelah menjalankan kedua bagian, Anda dapat mengakses aplikasi melalui browser di alamat:
http://192.168.1.14:3000

## Troubleshooting

- Jika terjadi masalah koneksi, pastikan firewall mengizinkan port 3000 dan 5000
- Jika terjadi masalah CORS, pastikan frontend dan backend berjalan dengan benar
- Periksa log di konsol browser untuk melihat error yang terjadi 

# Konfigurasi Jaringan Aplikasi

Aplikasi ini telah dikonfigurasi untuk dapat berjalan di berbagai lingkungan jaringan tanpa perlu konfigurasi manual. Berikut adalah panduan cara menjalankan aplikasi baik dalam mode development maupun production.

## Fitur Utama

1. **Deteksi Jaringan Otomatis**:
   - Backend secara otomatis mendeteksi alamat IP jaringan lokal
   - Frontend bisa otomatis menemukan backend meskipun alamat IP berubah

2. **Mode Development dan Production**:
   - Konfigurasi terpisah untuk pengembangan dan produksi
   - File `.env` khusus untuk masing-masing mode

3. **Logging dan Debugging**:
   - Logging lebih detail di development
   - Logging minimal di production

## Menjalankan Backend

### Mode Development

```bash
cd backend
python run_dev.py
```

### Mode Production

```bash
cd backend
python run_prod.py
```

## Menjalankan Frontend

### Mode Development

```bash
cd frontend
npm run dev        # Hanya bisa diakses dari localhost
npm run dev:network  # Bisa diakses dari perangkat lain di jaringan
```

### Mode Production

```bash
cd frontend
npm run build      # Build aplikasi untuk production
npm run preview    # Jalankan hasil build secara lokal
npm run preview:network  # Jalankan hasil build di jaringan
```

## Cara Kerja Konfigurasi Dinamis

1. **Backend**:
   - Mendeteksi IP lokal menggunakan socket connection
   - Menyediakan endpoint `/api/config` untuk frontend
   - Memuat file .env sesuai environment (development/production)

2. **Frontend**:
   - Mencoba terhubung ke beberapa alamat IP potensial untuk menemukan backend
   - Menggunakan API untuk mendapatkan konfigurasi dari backend
   - Fallback ke konfigurasi lokal jika backend tidak ditemukan

## Troubleshooting

Jika frontend tidak dapat menemukan backend:

1. Pastikan backend berjalan dan bisa diakses di jaringan
2. Periksa firewall di komputer server (backend)
3. Coba akses `/api/health` dari browser untuk memastikan backend berjalan
4. Untuk dev mode, atur `VITE_PROXY_URL` di file `.env.development` ke alamat backend yang benar

## Mengubah Konfigurasi

### Backend

Edit file konfigurasi di:
- `backend/.env.development` untuk pengembangan
- `backend/.env.production` untuk produksi

### Frontend

Edit file konfigurasi di:
- `frontend/.env.development` untuk pengembangan  
- `frontend/.env.production` untuk produksi 

## Pembersihan File Sementara (Cleanup)

Beberapa folder di aplikasi QiuLab menyimpan file-file sementara yang dapat dihapus secara berkala untuk menghemat ruang disk dan menjaga performa aplikasi. Berikut adalah panduan tentang folder mana yang dapat dibersihkan:

### File Sessions (`backend/instance/sessions`)

Folder `backend/instance/sessions` berisi file JSON yang menyimpan informasi tentang permintaan setup (setup requests) yang telah diproses. File-file ini digunakan untuk:
- Mengaitkan ID permintaan dengan file output yang dihasilkan
- Menyediakan informasi untuk download file yang sudah diproses

**Rekomendasi pembersihan:**
- File-file ini AMAN untuk dihapus jika proses setup telah selesai dan file output sudah tidak diperlukan
- Sebaiknya simpan file session terbaru (1-2 minggu terakhir) untuk memastikan user masih bisa mengakses file yang baru diproses
- Anda dapat menghapus secara manual atau menggunakan script untuk menghapus file yang lebih lama dari periode tertentu

### File Uploads Sementara (`backend/instance/uploads`)

Folder ini berisi file yang diunggah pengguna untuk diproses:
- File Excel asli yang diunggah pengguna
- File output hasil proses dalam subfolder `output/`

**Rekomendasi pembersihan:**
- File dalam `backend/instance/uploads` (kecuali subfolder `output/`) AMAN untuk dihapus setelah diproses
- File dalam `backend/instance/uploads/output/` terhubung dengan file session - hapus hanya jika file session terkaitnya juga dihapus

### File Cache dan Penyimpanan Sementara Lainnya

Beberapa folder lain yang mungkin perlu dibersihkan secara berkala:
- `frontend/dist`: File hasil build frontend, aman dihapus jika tidak diperlukan (akan dibuat ulang saat build)
- `backend/logs`: Berisi file log, dapat dirotasi atau dihapus yang terlalu lama
- `backend/venv`: Lingkungan virtual Python, jangan dihapus kecuali ingin menginstal ulang dependencies

**Catatan Penting:**
Selalu buat backup sebelum melakukan penghapusan massal. Jika ragu, konsultasikan dengan Handiyan Juansah terlebih dahulu.

---

*Made with 💻 by Handiyan Juansah • [LinkedIn](https://linkedin.com/in/handiyanjuansah)* 