"""
Script untuk menjalankan aplikasi Flask dengan Waitress dan SSL
"""
from waitress import serve
import os
import sys
import ssl
import socket
import pathlib
from app import app
from config import get_local_ip

def create_self_signed_cert(cert_dir):
    """Membuat sertifikat self-signed jika belum ada"""
    from OpenSSL import crypto
    
    cert_path = os.path.join(cert_dir, "server.crt")
    key_path = os.path.join(cert_dir, "server.key")
    
    # Jika sertifikat sudah ada, pakai yang sudah ada
    if os.path.exists(cert_path) and os.path.exists(key_path):
        print(f"Menggunakan sertifikat yang sudah ada di {cert_dir}")
        return cert_path, key_path
        
    print(f"Membuat sertifikat self-signed baru di {cert_dir}")
    
    # Pastikan direktori ada
    if not os.path.exists(cert_dir):
        os.makedirs(cert_dir)
    
    # Buat key pair
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)
    
    # Buat self-signed certificate
    cert = crypto.X509()
    cert.get_subject().C = "ID"
    cert.get_subject().ST = "Jakarta"
    cert.get_subject().L = "Jakarta"
    cert.get_subject().O = "QiuLab"
    cert.get_subject().OU = "Development"
    cert.get_subject().CN = socket.gethostname()
    
    # Tambahkan semua nama alternatif yang mungkin
    alt_names = [
        f"DNS:localhost",
        f"DNS:{socket.gethostname()}",
        f"DNS:{get_local_ip()}",
        f"IP:127.0.0.1",
        f"IP:{get_local_ip()}"
    ]
    
    cert.add_extensions([
        crypto.X509Extension(
            b"subjectAltName", 
            False, 
            ", ".join(alt_names).encode()
        )
    ])
    
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(10*365*24*60*60)  # 10 tahun
    cert.set_issuer(cert.get_subject())
    cert.set_pubkey(k)
    cert.sign(k, 'sha256')
    
    # Simpan sertifikat dan key
    with open(cert_path, "wb") as f:
        f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))
    
    with open(key_path, "wb") as f:
        f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, k))
    
    print(f"Sertifikat self-signed berhasil dibuat di {cert_dir}")
    return cert_path, key_path

def run_waitress_ssl():
    """Menjalankan aplikasi Flask dengan server Waitress + SSL"""
    # Siapkan sertifikat
    cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certs")
    cert_path, key_path = create_self_signed_cert(cert_dir)
    
    # Inisialisasi konteks SSL
    try:
        import OpenSSL
        ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_context.load_cert_chain(cert_path, keyfile=key_path)
        print("=== Memulai server Waitress dengan SSL (HTTPS) ===")
        print(f"Host: 0.0.0.0, Port: 5000")
        print(f"Mode: HTTPS dengan sertifikat self-signed")
        print(f"Server dapat diakses di: https://{get_local_ip()}:5000")
        print("PENTING: Karena menggunakan sertifikat self-signed, ")
        print("browser akan menampilkan peringatan keamanan. Ini normal dan dapat diterima.")
        
        # Jalankan server dengan SSL
        serve(
            app,
            host='0.0.0.0', 
            port=5000,
            url_scheme='https',
            trusted_proxy='*'
        )
    except (ImportError, Exception) as e:
        print(f"Error saat menyiapkan SSL: {e}")
        print("Menjalankan server tanpa SSL...")
        serve(
            app,
            host='0.0.0.0', 
            port=5000
        )

if __name__ == "__main__":
    run_waitress_ssl()
