from waitress import serve
from app import app

if __name__ == '__main__':
    print("=== Menjalankan server dengan Waitress (server WSGI yang kompatibel dengan Windows) ===")
    print("=== Server berjalan di http://0.0.0.0:5000 (dapat diakses dari jaringan) ===")
    print("=== Akses dari perangkat lain menggunakan http://192.168.1.14:5000 ===")
    print("=== Akses lokal menggunakan http://localhost:5000 ===")
    
    # Menggunakan host="0.0.0.0" untuk mendengarkan semua interface jaringan
    serve(app, host='0.0.0.0', port=5000, threads=4)
