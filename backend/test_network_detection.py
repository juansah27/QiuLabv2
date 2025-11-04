import os
import socket
import requests
import time
import json
from config import get_local_ip, SERVER_URL

def test_local_ip_detection():
    """
    Menguji fungsi deteksi IP lokal
    """
    print("\n=== TEST DETEKSI IP LOKAL ===")
    
    # Test 1: Deteksi IP standar
    detected_ip = get_local_ip()
    print(f"IP Terdeteksi: {detected_ip}")
    
    # Test 2: Validasi format IP
    is_valid = True
    try:
        octets = detected_ip.split('.')
        if len(octets) != 4:
            is_valid = False
        for octet in octets:
            num = int(octet)
            if num < 0 or num > 255:
                is_valid = False
    except:
        is_valid = False
    
    print(f"Format IP Valid: {is_valid}")
    
    # Test 3: Verifikasi bahwa IP bukan localhost
    is_not_localhost = detected_ip not in ['127.0.0.1', 'localhost']
    print(f"Bukan localhost: {is_not_localhost}")
    
    return detected_ip, is_valid and is_not_localhost

def test_network_interfaces():
    """
    Mencoba mendapatkan semua interface jaringan
    """
    print("\n=== TEST NETWORK INTERFACES ===")
    
    interfaces = []
    try:
        # Pendekatan alternatif untuk mendapatkan network interfaces
        import netifaces
        interfaces = netifaces.interfaces()
        
        for interface in interfaces:
            try:
                addrs = netifaces.ifaddresses(interface)
                if netifaces.AF_INET in addrs:
                    for addr in addrs[netifaces.AF_INET]:
                        ip = addr['addr']
                        if ip != '127.0.0.1':
                            print(f"Interface: {interface}, IP: {ip}")
            except:
                pass
    except ImportError:
        print("netifaces tidak terinstal. Gunakan: pip install netifaces")
        
        # Fallback ke informasi socket
        hostname = socket.gethostname()
        try:
            ip_list = socket.gethostbyname_ex(hostname)[2]
            print(f"Host: {hostname}, IPs: {ip_list}")
        except:
            print("Gagal mendapatkan info IP dari hostname")
    
    return len(interfaces) > 0

def test_backend_connectivity(ip=None):
    """
    Menguji konektivitas ke backend
    """
    print("\n=== TEST KONEKTIVITAS BACKEND ===")
    
    if not ip:
        ip = get_local_ip()
    
    base_url = f"http://{ip}:5000"
    
    # Test 1: Health check
    try:
        health_url = f"{base_url}/api/health"
        print(f"Mencoba health check: {health_url}")
        response = requests.get(health_url, timeout=2)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        health_ok = response.status_code == 200
    except Exception as e:
        print(f"Health check error: {str(e)}")
        health_ok = False
    
    # Test 2: Configuration endpoint
    try:
        config_url = f"{base_url}/api/config"
        print(f"Mencoba endpoint config: {config_url}")
        response = requests.get(config_url, timeout=2)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        config_ok = response.status_code == 200
    except Exception as e:
        print(f"Config endpoint error: {str(e)}")
        config_ok = False
    
    return health_ok and config_ok

def simulate_network_change():
    """
    Simulasi perubahan jaringan (hanya untuk tujuan pengujian)
    """
    print("\n=== SIMULASI PERUBAHAN JARINGAN ===")
    print("Ini adalah simulasi perubahan jaringan.")
    print("Dalam situasi nyata, Anda akan:")
    print("1. Berpindah ke jaringan lain (WiFi/LAN berbeda)")
    print("2. Restart aplikasi di jaringan baru")
    print("\nUntuk keperluan tes, kita akan hanya memeriksa kondisi saat ini.")
    print(f"URL Server saat ini: {SERVER_URL}")
    
    # Tunggu input user
    input("\nTekan Enter untuk melanjutkan...")
    return True

if __name__ == "__main__":
    # Jalankan semua tes
    print("=== PENGUJIAN DETEKSI JARINGAN DAN KONEKTIVITAS ===")
    
    # Test 1: Deteksi IP
    ip, ip_valid = test_local_ip_detection()
    
    # Test 2: Network interfaces
    interfaces_ok = test_network_interfaces()
    
    # Test 3: Backend connectivity
    backend_ok = test_backend_connectivity(ip)
    
    # Test 4: Simulate network change
    network_change_ok = simulate_network_change()
    
    # Rangkuman hasil
    print("\n=== RANGKUMAN HASIL PENGUJIAN ===")
    print(f"Deteksi IP           : {'✓' if ip_valid else '✗'} ({ip})")
    print(f"Network Interfaces   : {'✓' if interfaces_ok else '⚠️'}")
    print(f"Konektivitas Backend : {'✓' if backend_ok else '✗'}")
    print(f"Simulasi Ganti Jaringan: {'✓' if network_change_ok else '✗'}")
    
    # Status keseluruhan
    overall = all([ip_valid, backend_ok])
    print(f"\nStatus Keseluruhan   : {'✓ SUKSES' if overall else '✗ GAGAL'}")
    
    if not overall:
        print("\nSaran troubleshooting:")
        if not ip_valid:
            print("- Periksa konfigurasi jaringan")
            print("- Pastikan perangkat terhubung ke jaringan")
        if not backend_ok:
            print("- Periksa apakah backend berjalan di port 5000")
            print("- Periksa firewall yang mungkin memblokir koneksi")
    else:
        print("\nSemua tes berhasil! Sistem siap digunakan di jaringan ini.") 