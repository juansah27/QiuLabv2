#!/usr/bin/env python
"""
Script untuk membuat superuser (admin) secara langsung ke database.
Gunakan script ini jika metode lain tidak berfungsi.
"""
import sqlite3
import sys
from werkzeug.security import generate_password_hash

def create_superuser_direct(username, password, email):
    """
    Fungsi untuk membuat superuser dengan role admin
    langsung ke database.
    """
    try:
        # Koneksi ke database
        # Coba beberapa kemungkinan lokasi database
        locations = [
            'instance/app.db',  # Relatif terhadap direktori saat ini
            './instance/app.db',  # Relatif terhadap direktori saat ini (eksplisit)
            '../instance/app.db',  # Satu level ke atas
            'backend/instance/app.db',  # Folder backend
            '../backend/instance/app.db',  # Satu level ke atas dan folder backend
            'webapp/backend/instance/app.db',  # Folder webapp dan backend
            'shop_mapping.db'  # Nama database default lain yang mungkin digunakan
        ]
        
        conn = None
        db_location = None
        
        # Coba semua kemungkinan lokasi
        for location in locations:
            try:
                print(f"Mencoba koneksi ke database di: {location}")
                conn = sqlite3.connect(location)
                db_location = location
                print(f"Berhasil terhubung ke database di: {location}")
                break
            except sqlite3.Error:
                continue
                
        if not conn:
            print("Error: Tidak dapat menemukan database")
            return False
            
        cursor = conn.cursor()
        
        # Cek apakah tabel users sudah ada
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            # Buat tabel users jika belum ada
            cursor.execute('''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    is_admin INTEGER NOT NULL DEFAULT 0
                )
            ''')
            conn.commit()
            print("Tabel users berhasil dibuat")
        
        # Cek apakah username sudah ada
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            print(f"Error: Username '{username}' sudah digunakan")
            conn.close()
            return False
            
        # Cek apakah email sudah ada
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            print(f"Error: Email '{email}' sudah terdaftar")
            conn.close()
            return False
            
        # Generate password hash
        password_hash = generate_password_hash(password)
        
        # Masukkan user baru dengan is_admin=1 (True)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, 1)
        )
        conn.commit()
        
        # Ambil ID user baru
        user_id = cursor.lastrowid
        
        print(f"Superuser '{username}' berhasil dibuat dengan ID={user_id}")
        
        conn.close()
        return True
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Cek argumen command line
    if len(sys.argv) != 4:
        print("Penggunaan: python create_superuser_direct.py <username> <password> <email>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    email = sys.argv[3]
    
    # Konfirmasi
    print(f"Membuat superuser dengan username={username}, email={email}")
    
    # Buat superuser
    success = create_superuser_direct(username, password, email)
    
    # Exit dengan kode status sesuai
    sys.exit(0 if success else 1) 