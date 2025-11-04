# Panduan Penyelesaian Masalah Login pada QiuLab

## Masalah Umum dan Solusinya

### 1. Error "No token received in login response"

Jika Anda melihat error "No token received in login response" di konsol browser, ini menunjukkan ketidakcocokan antara format respons dari backend dan ekspektasi frontend.

**Penyebab:**
- Frontend mencari field `access_token` dalam respons
- Backend mengirimkan token dengan nama field `token`

**Solusi:**
1. Perbarui Frontend (AuthContext.jsx) untuk mendukung kedua format:
   ```javascript
   const access_token = response.data.access_token || response.data.token;
   ```

2. Perbarui Backend (auth.py) untuk mengirim format yang konsisten:
   ```python
   response_data = {
       'token': jwt_token,
       'access_token': jwt_token,  # Untuk backward compatibility
       'user': { ... }
   }
   ```

3. Jalankan kembali aplikasi dan periksa respons login di DevTools.

### 2. Error 500 (INTERNAL SERVER ERROR) saat Login

Jika Anda melihat error 500 saat mencoba login, ini berarti ada masalah di server backend. Beberapa langkah untuk menyelesaikannya:

1. **Periksa apakah server berjalan**
   ```
   python check_app.py
   ```

2. **Reset password pengguna**
   ```
   python reset_user.py
   ```
   - Pilih opsi 3 (Reset password pengguna)
   - Masukkan username yang bermasalah
   - Masukkan password baru

3. **Jika pengguna baru dibuat langsung di database**
   Masalah paling umum adalah jika pengguna dibuat langsung di database tanpa menggunakan `User.create()` yang melakukan hashing password dengan benar. Untuk user Aisyah, Anda bisa menjalankan:
   ```
   python check_aisyah.py
   ```

### 3. Login Gagal dengan Username/Password Salah

1. **Pastikan Anda menggunakan username dan password yang benar**
   - Username bersifat case-sensitive (peka huruf besar-kecil)
   - Password minimal 8 karakter

2. **Jika Anda yakin informasi login benar**
   - Reset password dengan `python reset_user.py`
   - Pastikan tidak ada spasi ekstra pada awal atau akhir username

### 4. Masalah Login untuk Pengguna Admin

1. **Periksa apakah pengguna memiliki hak admin**
   ```
   python -c "import sqlite3; conn = sqlite3.connect('instance/app.db'); cursor = conn.cursor(); cursor.execute('SELECT username, is_admin FROM users WHERE username = ?', ('NAMA_PENGGUNA',)); user = cursor.fetchone(); print(f'Admin: {user[1] if user else None}'); conn.close()"
   ```

2. **Jika perlu, berikan hak admin**
   ```
   python -c "import sqlite3; conn = sqlite3.connect('instance/app.db'); cursor = conn.cursor(); cursor.execute('UPDATE users SET is_admin = 1 WHERE username = ?', ('NAMA_PENGGUNA',)); conn.commit(); print('Hak admin diberikan'); conn.close()"
   ```

## Cara Membuat Pengguna Baru yang Benar

Untuk membuat pengguna baru, selalu gunakan metode yang tepat alih-alih menambahkan langsung ke database:

```python
from models.user import User

# Membuat pengguna regular
user = User.create(
    username="nama_pengguna",
    email="email@example.com",
    password="password123",
    is_admin=False
)

# Membuat pengguna admin
admin = User.create(
    username="admin_baru",
    email="admin@example.com",
    password="admin123",
    is_admin=True
)
```

## Jika Masalah Berlanjut

Jika masalah login masih berlanjut setelah mencoba semua langkah di atas:

1. Periksa log server untuk melihat error yang lebih spesifik
2. Validasi struktur database dengan `python check_db.py`
3. Pastikan konfigurasi CORS benar dengan `python check_cors.py`
4. Coba jalankan aplikasi dalam mode debug dengan mengubah `debug=True` di app.py

## Struktur Tabel Users

Pastikan tabel `users` memiliki struktur yang tepat:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0
);
```

Catatan: Field `password_hash` harus berisi hash password yang dibuat dengan `werkzeug.security.generate_password_hash` dan bukan password plaintext. 