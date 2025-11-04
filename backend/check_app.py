#!/usr/bin/env python3
"""
Script untuk memeriksa status aplikasi QiuLab secara menyeluruh.
Menjalankan semua pemeriksaan penting dan memberikan laporan status.
"""
import os
import sys
import sqlite3
import requests
from urllib.parse import urljoin
import subprocess
import platform

def print_header(title):
    """Mencetak header dengan format yang menarik"""
    line = "=" * 60
    print(f"\n{line}")
    print(f" {title} ".center(60, "="))
    print(f"{line}\n")

def print_result(message, success=True):
    """Mencetak hasil dengan emoji yang sesuai"""
    icon = "✅" if success else "❌"
    print(f"{icon} {message}")

def check_python_version():
    """Memeriksa versi Python"""
    print_header("PEMERIKSAAN VERSI PYTHON")
    version = platform.python_version()
    major, minor, _ = version.split(".")
    
    print(f"Versi Python terdeteksi: {version}")
    if int(major) >= 3 and int(minor) >= 6:
        print_result("Versi Python kompatibel")
        return True
    else:
        print_result("Versi Python tidak kompatibel, diperlukan Python 3.6+", False)
        return False

def check_dependencies():
    """Memeriksa dependensi yang diperlukan"""
    print_header("PEMERIKSAAN DEPENDENSI")
    
    required_packages = [
        "flask", "flask-cors", "flask-jwt-extended", "flask_login", 
        "werkzeug", "pandas", "sqlite3", "requests", "dotenv"
    ]
    
    success = True
    for package in required_packages:
        try:
            # Gunakan __import__ untuk mencoba mengimpor package
            if package == "sqlite3":  # sqlite3 adalah bagian dari Python standard library
                import sqlite3
                imported = True
            elif package == "dotenv":
                import dotenv
                imported = True
            else:
                __import__(package.replace("-", "_"))
                imported = True
        except ImportError:
            imported = False
        
        print_result(f"Package {package}", imported)
        if not imported:
            success = False
    
    return success

def check_database():
    """Memeriksa status database"""
    print_header("PEMERIKSAAN DATABASE")
    
    # Periksa file database
    db_path = "instance/app.db"
    if not os.path.exists(db_path):
        print_result(f"File database {db_path} tidak ditemukan", False)
        return False
    
    print_result(f"File database {db_path} ditemukan")
    
    # Periksa tabel users
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Cek tabel users
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print_result("Tabel 'users' tidak ditemukan", False)
            conn.close()
            return False
        
        print_result("Tabel 'users' ditemukan")
        
        # Cek jumlah pengguna
        cursor.execute("SELECT COUNT(*) as count FROM users")
        count = cursor.fetchone()['count']
        print_result(f"Jumlah pengguna dalam database: {count}")
        
        # Cek admin user
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_admin = 1")
        admin_count = cursor.fetchone()['count']
        print_result(f"Jumlah admin dalam database: {admin_count}")
        
        if admin_count == 0:
            print_result("Tidak ada user admin yang ditemukan", False)
            print("Jalankan 'python check_db.py' dan buat admin default")
        
        conn.close()
        return count > 0 and admin_count > 0
    except sqlite3.Error as e:
        print_result(f"Error database: {str(e)}", False)
        return False

def check_server_running():
    """Memeriksa apakah server sedang berjalan"""
    print_header("PEMERIKSAAN SERVER")
    
    api_url = "http://127.0.0.1:5000"
    
    try:
        response = requests.get(urljoin(api_url, "/health"), timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                print_result(f"Server berjalan di {api_url}")
                return True
        print_result(f"Server merespons tetapi status tidak sesuai: {response.status_code}", False)
        return False
    except requests.exceptions.ConnectionError:
        print_result(f"Tidak dapat terhubung ke server di {api_url}", False)
        print("Pastikan server sedang berjalan dengan 'flask run' atau 'python app.py'")
        return False
    except Exception as e:
        print_result(f"Error saat memeriksa server: {str(e)}", False)
        return False

def check_cors():
    """Memeriksa konfigurasi CORS"""
    print_header("PEMERIKSAAN CORS")
    
    api_url = "http://127.0.0.1:5000"
    
    try:
        # OPTIONS request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
            'Access-Control-Request-Method': 'GET'
        }
        
        options_resp = requests.options(urljoin(api_url, '/health'), headers=headers, timeout=3)
        
        if options_resp.status_code == 204:
            print_result("Preflight OPTIONS request berhasil (status 204)")
            
            # Periksa header CORS
            cors_headers = [h for h, v in options_resp.headers.items() if h.lower().startswith('access-control')]
            if cors_headers:
                print_result("Header CORS ditemukan pada respons OPTIONS")
                return True
            else:
                print_result("Header CORS tidak ditemukan pada respons OPTIONS", False)
                return False
        else:
            print_result(f"Preflight OPTIONS status {options_resp.status_code} (harusnya 204)", False)
            return False
    except Exception as e:
        print_result(f"Error saat memeriksa CORS: {str(e)}", False)
        return False

def run_full_check():
    """Menjalankan pemeriksaan penuh dan memberikan rangkuman"""
    results = {
        "Python": check_python_version(),
        "Dependencies": check_dependencies(),
        "Database": check_database(),
        "Server": check_server_running(),
        "CORS": check_cors()
    }
    
    print_header("RANGKUMAN PEMERIKSAAN")
    
    all_passed = True
    for name, result in results.items():
        print_result(f"{name}: {'BAIK' if result else 'BERMASALAH'}", result)
        if not result:
            all_passed = False
    
    print("\n")
    if all_passed:
        print("🎉 SELAMAT! Semua pemeriksaan berhasil. Aplikasi QiuLab siap digunakan!")
    else:
        print("⚠️ Beberapa pemeriksaan gagal. Silakan perbaiki masalah yang terdeteksi.")
    
    return all_passed

if __name__ == "__main__":
    print("\n🔍 PEMERIKSAAN APLIKASI QUILAB 🔍\n")
    print("Menjalankan pemeriksaan menyeluruh...")
    
    sys.exit(0 if run_full_check() else 1) 