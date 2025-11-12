#!/usr/bin/env python
"""
Script untuk menjalankan backend dalam mode production menggunakan waitress.
Pastikan flask-cors dan waitress sudah terinstal sebelumnya.
"""

import os
import sys
from waitress import serve
from app import create_app
from config import get_local_ip, PORT, HOST

def run_production_server():
    """Run backend server in production mode"""
    
    # Tetapkan environment variabel untuk production
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_DEBUG'] = '0'
    
    # Tampilkan pesan yang informatif
    local_ip = get_local_ip()
    print(f"\n{'='*50}")
    print(f"Running backend in PRODUCTION mode")
    print(f"{'='*50}\n")
    
    print(f"Server URLs:")
    print(f" - Local:   http://localhost:{PORT}")
    print(f" - Network: http://{local_ip}:{PORT}")
    print(f"\nPress Ctrl+C to stop the server\n")
    
    # Buat aplikasi Flask
    app = create_app()
    
    # Jalankan server dengan waitress
    # channel_timeout: timeout untuk request yang lambat (180 detik = 3 menit)
    # connection_limit: batas koneksi simultan
    try:
        serve(app, host=HOST, port=PORT, threads=8, channel_timeout=180, connection_limit=1000)
    except KeyboardInterrupt:
        print("\nServer stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_production_server() 