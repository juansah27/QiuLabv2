# Backend Flask Application

Ini adalah aplikasi backend menggunakan Flask untuk mengelola DataFrame Excel, mengeksekusi query SQL, dan menyediakan sistem manajemen pengguna.

## Fitur

- Autentikasi pengguna dengan JWT dan Flask-Login
- Pengelolaan file Excel menggunakan Pandas
- Penyimpanan dan eksekusi query SQL
- Konfigurasi dashboard visualisasi data
- CRUD interface untuk database

## Persiapan Pengembangan

1. Pastikan Python 3.8+ telah terpasang pada sistem Anda

2. Buat virtual environment:
```
python -m venv venv
```

3. Aktifkan virtual environment:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```
pip install -r requirements.txt
```

5. Inisialisasi database:
```
python init_db.py
```

6. Jalankan aplikasi:
```
flask run
```

Aplikasi akan berjalan di http://localhost:5000

## Struktur Direktori

- `/routes`: Endpoint API Flask
- `/models`: Model data dan interaksi database
- `/utils`: Utilitas dan helper functions
- `/uploads`: Tempat penyimpanan file Excel yang diunggah
- `/instance`: Database SQLite dan file konfigurasi

## API Endpoints

### Autentikasi
- `POST /api/auth/register`: Mendaftarkan pengguna baru
- `POST /api/auth/login`: Login pengguna
- `POST /api/auth/logout`: Logout pengguna
- `GET /api/auth/me`: Mendapatkan profil pengguna yang sedang login

### Excel
- `POST /api/excel/upload`: Mengunggah file Excel
- `GET /api/excel/files`: Mendapatkan daftar file Excel yang diunggah
- `GET /api/excel/files/<id>`: Mendapatkan informasi file Excel
- `GET /api/excel/files/<id>/download`: Mengunduh file Excel
- `GET /api/excel/files/<id>/preview`: Pratinjau data Excel
- `POST /api/excel/files/<id>/analyze`: Menganalisis data Excel

### Query
- `GET /api/query/`: Mendapatkan daftar query
- `GET /api/query/<id>`: Mendapatkan query dengan ID tertentu
- `POST /api/query/`: Membuat query baru
- `PUT /api/query/<id>`: Memperbarui query
- `DELETE /api/query/<id>`: Menghapus query
- `POST /api/query/<id>/execute`: Mengeksekusi query

### Dashboard
- `GET /api/dashboard/configs`: Mendapatkan daftar konfigurasi dashboard
- `GET /api/dashboard/configs/<id>`: Mendapatkan konfigurasi dashboard dengan ID tertentu
- `POST /api/dashboard/configs`: Membuat konfigurasi dashboard baru
- `PUT /api/dashboard/configs/<id>`: Memperbarui konfigurasi dashboard
- `DELETE /api/dashboard/configs/<id>`: Menghapus konfigurasi dashboard
- `POST /api/dashboard/data`: Mendapatkan data untuk visualisasi dashboard

### CRUD Database
- `GET /api/crud/tables`: Mendapatkan daftar tabel
- `GET /api/crud/tables/<table>/schema`: Mendapatkan schema tabel
- `GET /api/crud/tables/<table>/data`: Mendapatkan data tabel
- `POST /api/crud/tables/<table>/data`: Membuat record baru
- `PUT /api/crud/tables/<table>/data/<id>`: Memperbarui record
- `DELETE /api/crud/tables/<table>/data/<id>`: Menghapus record

## Default Admin User

Username: admin
Password: admin123

Ganti password default ini segera setelah login pertama kali!

## Perubahan dan Perbaikan Terbaru

### 1. Perbaikan CORS untuk Mengatasi Masalah Preflight Request

Telah dilakukan perbaikan pada konfigurasi CORS untuk mengatasi masalah preflight request yang sebelumnya mengembalikan status 200 dan bukan 204 yang standar:

1. **Perbaikan di app.py**:
   - Menambahkan parameter `automatic_options` dan `send_wildcard` pada konfigurasi CORS
   - Mengimplementasikan handler `after_request` untuk mengubah status ke 204 pada request OPTIONS
   - Memastikan semua respons preflight konsisten dengan standar CORS

2. **Peningkatan Tool Diagnostik**:
   - Tool `check_cors.py` telah ditingkatkan untuk memberikan informasi diagnostik yang lebih detail
   - Menampilkan status kesiapan aplikasi untuk semua aspek CORS
   - Rekomendasi perbaikan yang lebih spesifik

Perubahan ini memperbaiki masalah CORS yang dapat menyebabkan error komunikasi antara frontend dan backend, terutama pada browser modern yang menerapkan kebijakan CORS dengan ketat.

### 2. Perbaikan Error Handling untuk User Management

Kami telah melakukan serangkaian perbaikan untuk mengatasi masalah error 500 pada endpoint `/api/auth/users` dan masalah infinite loop di halaman User Management:

#### Perbaikan di Backend:

1. **Model User.py**:
   - Menambahkan logging yang lebih detail di method `get_all_users`
   - Menambahkan penanganan error untuk setiap user yang diproses
   - Mengembalikan list kosong alih-alih error jika terjadi masalah database

2. **Routes Auth.py**:
   - Menambahkan logging dan debugging yang lebih detail di endpoint `/users`
   - Memperbaiki penanganan error untuk pengecekan admin
   - Menambahkan penanganan khusus untuk pengguna "ladyqiu"
   - Memformat pesan error yang lebih informatif

3. **App.py**:
   - Menambahkan endpoint `/health` untuk pemeriksaan koneksi dari frontend
   - Menyederhanakan respons health check untuk kompatibilitas yang lebih baik

4. **Tool Diagnostik**:
   - Membuat `check_db.py` untuk memeriksa dan memperbaiki struktur database
   - Membuat `check_cors.py` untuk mendiagnosis masalah CORS

#### Perbaikan di Frontend:

1. **UserManagement.jsx**:
   - Menambahkan health check sebelum request utama
   - Implementasi throttling dan backoff untuk retries
   - Validasi format data yang lebih ketat
   - Penanganan error yang lebih spesifik untuk berbagai kasus
   - Implementasi mode fallback dengan data dummy saat server tidak tersedia

### 3. Mencegah Infinite Loop

Penyebab utama infinite loop di halaman User Management adalah:

1. Request API yang terus gagal namun tetap dicoba ulang
2. Error handler yang tidak tepat mengakibatkan re-render berlebihan
3. Kurangnya throttling dan batasan retry

Solusi yang diimplementasikan:

1. Limitasi retry hingga maksimal 3 kali
2. Throttling request ke server (minimal 2 detik antar request)
3. Exponential backoff untuk retry
4. Penggunaan data mock/fallback saat server bermasalah

### 4. Pemeliharaan Database

Untuk mencegah masalah database di masa mendatang:

1. Pastikan struktur tabel `users` sudah benar dengan menjalankan `check_db.py`
2. Tambahkan user admin default jika belum ada
3. Periksa konfigurasi CORS dengan menjalankan `check_cors.py`

## Cara Menjalankan Tool Diagnostik

1. **Cek Status Aplikasi (Lengkap)**:
   ```
   python check_app.py
   ```
   Script ini akan memeriksa secara menyeluruh:
   - Versi Python
   - Dependensi yang diperlukan
   - Database dan tabel users
   - Status server
   - Konfigurasi CORS

2. **Periksa dan Uji Login**:
   ```
   python status.py
   ```
   Script ini akan:
   - Memeriksa status server
   - Memperbaiki atau membuat akun pengguna Aisyah
   - Menguji login untuk memastikan format respons sudah benar
   - Menampilkan detail format respons JSON dari endpoint login

3. **Cek Database**:
   ```
   python check_db.py
   ```

4. **Cek CORS**:
   ```
   python check_cors.py
   ```

5. **Kelola Pengguna (Reset Password)**:
   ```
   python reset_user.py
   ```
   Script ini memungkinkan Anda untuk:
   - Melihat daftar semua pengguna dalam database
   - Memeriksa informasi pengguna tertentu
   - Mereset password pengguna jika terjadi masalah login

## Konfigurasi

Pastikan file `.env` berisi konfigurasi yang benar, termasuk:
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS` (jika dibutuhkan)

## Troubleshooting Umum

1. **Error 500 pada `/api/auth/login`**:
   - Pastikan pengguna terdaftar dengan benar di database
   - Periksa format data login yang dikirim dari frontend
   - Jika masalah bertahan, coba reset password pengguna dengan `python reset_user.py`
   - Jika membuat user baru, pastikan menggunakan `User.create()` bukan registrasi langsung ke database

2. **Error 500 pada `/api/auth/users`**:
   - Periksa struktur database dengan `check_db.py`
   - Pastikan pengguna memiliki token dengan role admin yang valid

3. **CORS Error**:
   - Gunakan `check_cors.py` untuk mendiagnosis
   - Verifikasi konfigurasi CORS di `app.py`

4. **Infinite Loop di UserManagement**:
   - Frontend sekarang dilengkapi dengan mekanisme capping dan throttling
   - Jika masih terjadi, periksa log server untuk error yang lebih spesifik

Pastikan file `.env`