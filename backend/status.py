#!/usr/bin/env python3
"""
Script untuk memeriksa status sistem dan koneksi login
"""
import requests
import json
import os
import sys
import sqlite3
from werkzeug.security import generate_password_hash

API_URL = "http://127.0.0.1:5000"
LOGIN_ENDPOINT = f"{API_URL}/api/auth/login"
HEALTH_ENDPOINT = f"{API_URL}/health"

def check_server_status():
    """Memeriksa apakah server berjalan"""
    print("\n=== Memeriksa Status Server ===")
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        if response.status_code == 200:
            print("✅ Server berjalan dengan baik")
            return True
        else:
            print(f"❌ Server merespons tapi status tidak OK: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Tidak dapat terhubung ke server. Pastikan server sedang berjalan.")
        return False
    except Exception as e:
        print(f"❌ Error saat memeriksa server: {str(e)}")
        return False

def test_login(username, password):
    """Menguji login dengan kredensial tertentu"""
    print(f"\n=== Menguji Login untuk Pengguna '{username}' ===")
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    data = {
        'username': username,
        'password': password
    }
    
    try:
        print(f"Mengirim request ke: {LOGIN_ENDPOINT}")
        response = requests.post(LOGIN_ENDPOINT, headers=headers, json=data, timeout=5)
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Memeriksa format respons
            print("\nFormat respons:")
            if 'token' in response_data:
                print("✅ Field 'token' ditemukan")
            else:
                print("❌ Field 'token' tidak ditemukan")
                
            if 'access_token' in response_data:
                print("✅ Field 'access_token' ditemukan")
            else:
                print("❌ Field 'access_token' tidak ditemukan")
                
            if 'user' in response_data:
                print("✅ Field 'user' ditemukan")
                user_data = response_data.get('user', {})
                print(f"  - ID: {user_data.get('id')}")
                print(f"  - Username: {user_data.get('username')}")
                print(f"  - Role: {user_data.get('role')}")
                print(f"  - Admin: {user_data.get('is_admin')}")
            else:
                print("❌ Field 'user' tidak ditemukan")
                
            print("\n✅ Login berhasil!")
            return True
        else:
            error_msg = "Unknown error"
            try:
                error_data = response.json()
                error_msg = error_data.get('error') or error_data.get('message') or error_msg
            except:
                pass
                
            print(f"❌ Login gagal: {error_msg}")
            print(f"Response: {response.content.decode()}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Tidak dapat terhubung ke server. Pastikan server sedang berjalan.")
        return False
    except Exception as e:
        print(f"❌ Error saat menguji login: {str(e)}")
        return False

def fix_aisyah_account():
    """Memeriksa dan memperbaiki akun Aisyah jika perlu"""
    print("\n=== Memeriksa Akun Aisyah ===")
    try:
        # Koneksi ke database
        conn = sqlite3.connect('instance/app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Cek apakah pengguna Aisyah ada
        cursor.execute("SELECT * FROM users WHERE username = ?", ('Aisyah',))
        user = cursor.fetchone()
        
        if user:
            print(f"✅ Pengguna Aisyah ditemukan dengan ID: {user['id']}")
            
            # Reset password
            new_password = 'system123'
            password_hash = generate_password_hash(new_password)
            
            cursor.execute(
                "UPDATE users SET password_hash = ? WHERE username = ?",
                (password_hash, 'Aisyah')
            )
            conn.commit()
            
            print(f"✅ Password untuk Aisyah telah di-reset ke: {new_password}")
            return True
        else:
            print("❌ Pengguna Aisyah tidak ditemukan, membuat pengguna baru...")
            
            # Buat user baru
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
                ('Aisyah', 'aisyah@example.com', generate_password_hash('system123'), 0)
            )
            conn.commit()
            
            print("✅ Pengguna Aisyah berhasil dibuat dengan password: system123")
            return True
            
    except Exception as e:
        print(f"❌ Error saat memeriksa akun Aisyah: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    """Fungsi utama"""
    print("\n🔍 PEMERIKSAAN STATUS DAN LOGIN QUILAB 🔍\n")
    
    # Periksa status server
    server_ok = check_server_status()
    
    if not server_ok:
        print("\n❌ Server tidak berjalan. Pastikan server dijalankan terlebih dahulu.")
        return 1
    
    # Fix akun Aisyah
    aisyah_fixed = fix_aisyah_account()
    
    if aisyah_fixed:
        # Uji login untuk Aisyah
        login_ok = test_login('Aisyah', 'system123')
        
        if login_ok:
            print("\n🎉 SELAMAT! Sistem login berfungsi dengan baik.")
        else:
            print("\n⚠️ Sistem login masih bermasalah. Periksa output di atas untuk detailnya.")
    else:
        print("\n⚠️ Gagal memperbaiki akun Aisyah. Sistem login mungkin masih bermasalah.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 