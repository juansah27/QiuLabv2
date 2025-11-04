import os
import socket
import logging
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Dict, Any, Union

# Mendapatkan environment yang digunakan
FLASK_ENV = os.environ.get("FLASK_ENV", "development")

# Load file .env yang sesuai berdasarkan environment
env_file = f".env.{FLASK_ENV}"
if not os.path.exists(env_file):
    env_file = ".env"  # Fallback ke .env default jika file spesifik tidak ada

load_dotenv(env_file)

# Konfigurasi dasar
DEBUG = FLASK_ENV == "development"
LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", 5000))

# Konfigurasi database
DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///instance/app.db")
DB_SERVER = os.environ.get("DB_SERVER", "")
DB_NAME = os.environ.get("DB_NAME", "")
DB_USERNAME = os.environ.get("DB_USERNAME", "")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
USE_SQLITE_FOR_TESTING = os.environ.get("USE_SQLITE_FOR_TESTING", "false").lower() == "true"

# Konfigurasi keamanan
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-this")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-key-change-this")

# Fungsi untuk mendapatkan alamat IP lokal yang dapat diakses di jaringan
def get_local_ip() -> str:
    """
    Mendapatkan alamat IP lokal mesin.
    Berguna untuk koneksi dalam jaringan lokal.
    """
    try:
        # Buat koneksi dummy untuk mendapatkan IP lokal
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Tidak benar-benar terhubung
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"Error saat mendapatkan IP lokal: {e}")
        # Fallback ke localhost jika gagal
        return '127.0.0.1'

# Mendapatkan alamat IP lokal
LOCAL_IP = get_local_ip()

# Menentukan alamat yang digunakan aplikasi
SERVER_URL = os.environ.get("SERVER_URL", f"http://{LOCAL_IP}:{PORT}")
if FLASK_ENV == "production":
    SERVER_URL = os.environ.get("SERVER_URL", SERVER_URL)

# CORS configuration
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:4173,http://localhost:5173,http://localhost:8080"
).split(',')

# Tambahkan IP lokal ke ALLOWED_ORIGINS untuk memungkinkan akses dari perangkat lain di jaringan
if LOCAL_IP and LOCAL_IP != '127.0.0.1':
    # Tambahkan port yang biasa digunakan
    for port in ['3000', '4173', '5173', '8080']:
        origin = f'http://{LOCAL_IP}:{port}'
        if origin not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(origin)

# Konfigurasi logging
def setup_logging():
    log_level = getattr(logging, LOG_LEVEL.upper(), logging.DEBUG)
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Pastikan direktori logs ada
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Setup logging ke file dan console
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.FileHandler(f"logs/{FLASK_ENV}.log"),
            logging.StreamHandler()
        ]
    )
    
    # Mengurangi log level untuk beberapa library pihak ketiga
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

# Konfigurasi untuk diexport ke frontend
def get_frontend_config() -> Dict[str, Any]:
    """
    Mendapatkan konfigurasi yang akan dikirim ke frontend
    """
    return {
        "apiUrl": f"http://{get_local_ip()}:{PORT}/api",
        "environment": FLASK_ENV,
        "serverIp": get_local_ip(),
        "features": {
            "debug": DEBUG
        }
    } 