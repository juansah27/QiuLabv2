#!/usr/bin/env python3
"""
Script untuk memeriksa dan me-reset password pengguna di database.
"""
import os
import sys
import sqlite3
from werkzeug.security import generate_password_hash

def get_db_connection():
    """Membuat koneksi ke database SQLite"""
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

def check_user_exists(username):
    """Memeriksa apakah pengguna dengan username tertentu ada di database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    conn.close()
    
    return user is not None

def get_user_info(username):
    """Mendapatkan informasi pengguna berdasarkan username"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, is_admin FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return dict(user)
    return None

def change_user_password(username, new_password):
    """Mengubah password pengguna"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate hash baru untuk password
    password_hash = generate_password_hash(new_password)
    
    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        (password_hash, username)
    )
    conn.commit()
    
    success = cursor.rowcount > 0
    conn.close()
    
    return success

def list_all_users():
    """Menampilkan daftar semua pengguna di database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, is_admin FROM users ORDER BY username")
    users = cursor.fetchall()
    
    conn.close()
    
    if not users:
        print("Tidak ada pengguna dalam database.")
        return []
    
    print("\nDaftar pengguna:")
    print("-" * 60)
    print(f"{'ID':<5} {'Username':<20} {'Email':<30} {'Admin'}")
    print("-" * 60)
    
    user_list = []
    for user in users:
        user_dict = dict(user)
        user_list.append(user_dict)
        print(f"{user['id']:<5} {user['username']:<20} {user['email']:<30} {'Ya' if user['is_admin'] else 'Tidak'}")
    
    print("-" * 60)
    return user_list

def main():
    """Fungsi utama dari script"""
    print("\n=== TOOLS PENGELOLAAN USER ===\n")
    
    # Cek apakah database dan tabel users ada
    try:
        if not os.path.exists('instance/app.db'):
            print("Database tidak ditemukan. Pastikan aplikasi sudah diinisialisasi.")
            return 1
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("Tabel 'users' tidak ditemukan. Jalankan 'python check_db.py' untuk membuat tabel.")
            conn.close()
            return 1
        conn.close()
        
        # Tampilkan menu
        print("Pilih tindakan:")
        print("1. Tampilkan semua pengguna")
        print("2. Cek informasi pengguna")
        print("3. Reset password pengguna")
        print("4. Keluar")
        
        choice = input("Pilihan Anda (1-4): ")
        
        if choice == '1':
            list_all_users()
        
        elif choice == '2':
            username = input("Masukkan username pengguna: ")
            
            if check_user_exists(username):
                user_info = get_user_info(username)
                print("\nInformasi Pengguna:")
                print(f"ID: {user_info['id']}")
                print(f"Username: {user_info['username']}")
                print(f"Email: {user_info['email']}")
                print(f"Admin: {'Ya' if user_info['is_admin'] else 'Tidak'}")
            else:
                print(f"Pengguna dengan username '{username}' tidak ditemukan.")
        
        elif choice == '3':
            username = input("Masukkan username pengguna: ")
            
            if check_user_exists(username):
                new_password = input("Masukkan password baru: ")
                if not new_password:
                    print("Password tidak boleh kosong.")
                    return 1
                
                confirm = input(f"Apakah Anda yakin ingin mengubah password pengguna '{username}'? (y/n): ")
                if confirm.lower() == 'y':
                    success = change_user_password(username, new_password)
                    if success:
                        print(f"Password untuk pengguna '{username}' berhasil diubah.")
                    else:
                        print(f"Gagal mengubah password untuk pengguna '{username}'.")
                else:
                    print("Operasi dibatalkan.")
            else:
                print(f"Pengguna dengan username '{username}' tidak ditemukan.")
        
        elif choice == '4':
            print("Keluar dari program.")
            return 0
        
        else:
            print("Pilihan tidak valid.")
            return 1
        
        return 0
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 