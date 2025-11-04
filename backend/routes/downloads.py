from flask import Blueprint, jsonify, request, send_file, current_app, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json
from datetime import datetime
import pathlib
import uuid
import time

# Buat blueprint untuk API downloads
downloads_bp = Blueprint('downloads', __name__)

# Direktori untuk menyimpan file unduhan
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'downloads')
METADATA_FILE = os.path.join(DOWNLOAD_DIR, 'metadata.json')

# Pastikan direktori unduhan ada
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Dictionary untuk menyimpan waktu akses terakhir per pengguna
# untuk implementasi rate limiting sederhana
last_access_times = {}
# Minimal interval antar permintaan dalam detik
MIN_REQUEST_INTERVAL = 10  # Menaikkan ke 10 detik

# Fungsi untuk membaca/menulis metadata
def get_downloads_metadata():
    if not os.path.exists(METADATA_FILE):
        return []
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_downloads_metadata(metadata):
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

# API untuk mengambil daftar file unduhan - DINONAKTIFKAN
@downloads_bp.route('/downloads', methods=['GET'])
@jwt_required()
def get_downloads():
    """
    Endpoint ini telah dinonaktifkan.
    """
    return jsonify({
        'error': 'Endpoint telah dinonaktifkan',
        'message': 'Fitur download sedang dalam perbaikan.'
    }), 410  # 410 GONE - Indicates resource is no longer available

# API untuk menandai semua file sebagai sudah dilihat - DINONAKTIFKAN
@downloads_bp.route('/downloads/mark-viewed', methods=['POST'])
@jwt_required()
def mark_as_viewed():
    """
    Endpoint ini telah dinonaktifkan.
    """
    return jsonify({
        'error': 'Endpoint telah dinonaktifkan',
        'message': 'Fitur download sedang dalam perbaikan.'
    }), 410  # 410 GONE

# Fungsi demo untuk menambahkan file contoh - DINONAKTIFKAN
@downloads_bp.route('/downloads/demo', methods=['POST'])
@jwt_required()
def add_demo_file():
    """
    Endpoint ini telah dinonaktifkan.
    """
    return jsonify({
        'error': 'Endpoint telah dinonaktifkan',
        'message': 'Fitur download sedang dalam perbaikan.'
    }), 410  # 410 GONE

# API untuk mengunduh file - DINONAKTIFKAN
@downloads_bp.route('/downloads/<filename>', methods=['GET'])
@jwt_required()
def download_file(filename):
    """
    Endpoint ini telah dinonaktifkan.
    """
    return jsonify({
        'error': 'Endpoint telah dinonaktifkan',
        'message': 'Fitur download sedang dalam perbaikan.'
    }), 410  # 410 GONE

# API untuk menghapus file - DINONAKTIFKAN
@downloads_bp.route('/downloads/<filename>', methods=['DELETE'])
@jwt_required()
def delete_file(filename):
    """
    Endpoint ini telah dinonaktifkan.
    """
    return jsonify({
        'error': 'Endpoint telah dinonaktifkan',
        'message': 'Fitur download sedang dalam perbaikan.'
    }), 410  # 410 GONE

# Fungsi utilitas untuk menambahkan file ke sistem download - DINONAKTIFKAN
def add_file_to_downloads(filename, file_content, username):
    """
    Fungsi ini telah dinonaktifkan.
    """
    print("Upaya untuk menggunakan fungsi add_file_to_downloads yang telah dinonaktifkan")
    return None

# Export fungsi untuk digunakan di modul lain
__all__ = ['downloads_bp', 'add_file_to_downloads'] 