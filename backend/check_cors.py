import requests
import json
import sys
from urllib.parse import urljoin

def check_cors(api_url="http://127.0.0.1:5000"):
    """
    Memeriksa konfigurasi CORS pada backend API
    """
    print(f"Memeriksa konfigurasi CORS pada {api_url}...")
    
    # Headers kustom untuk menguji CORS
    headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
        'Access-Control-Request-Method': 'GET'
    }
    
    options_success = False
    get_success = False
    auth_success = False
    
    # 1. Cek endpoint health
    try:
        # OPTIONS request untuk preflight check
        options_resp = requests.options(urljoin(api_url, '/health'), headers=headers, timeout=5)
        print(f"\n[OPTIONS /health] Status: {options_resp.status_code}")
        print(f"Headers yang diterima:")
        
        cors_headers_found = False
        for header, value in options_resp.headers.items():
            if header.lower().startswith('access-control'):
                cors_headers_found = True
                print(f"  {header}: {value}")
        
        if options_resp.status_code == 204:
            print("✅ Preflight OPTIONS request berhasil (status 204)")
            options_success = True
        else:
            print(f"⚠️ Preflight OPTIONS status {options_resp.status_code} (harusnya 204)")
        
        if not cors_headers_found:
            print("❌ Tidak ada header CORS pada respons OPTIONS")
        
        # GET request untuk endpoint health
        get_resp = requests.get(urljoin(api_url, '/health'), headers={
            'Origin': 'http://localhost:3000'
        }, timeout=5)
        print(f"\n[GET /health] Status: {get_resp.status_code}")
        
        if get_resp.status_code == 200:
            print(f"Response data: {get_resp.text}")
            try:
                data = get_resp.json()
                if data.get('status') == 'ok':
                    print("✅ Health check berhasil")
                    get_success = True
                else:
                    print("⚠️ Health check merespon, tetapi format tidak seperti yang diharapkan")
            except ValueError:
                print("⚠️ Health check merespon, tetapi bukan format JSON")
        else:
            print("❌ Health check gagal")
    except requests.RequestException as e:
        print(f"❌ Gagal terhubung ke endpoint health: {str(e)}")
    
    # 2. Cek endpoint auth/users
    try:
        # Generate token dummy untuk pengujian
        auth_headers = {
            'Origin': 'http://localhost:3000', 
            'Authorization': 'Bearer dummy_token'
        }
        users_resp = requests.get(urljoin(api_url, '/api/auth/users'), headers=auth_headers, timeout=5)
        print(f"\n[GET /api/auth/users] Status: {users_resp.status_code}")
        
        if users_resp.status_code in (401, 403, 422):
            print("✅ Endpoint auth/users mengembalikan response auth (401/403/422), CORS berfungsi")
            auth_success = True
        elif users_resp.status_code == 200:
            print("✅ Endpoint auth/users merespon dengan sukses")
            auth_success = True
        else:
            print(f"⚠️ Endpoint auth/users merespon dengan status {users_resp.status_code}")
            
        cors_headers = [h for h, v in users_resp.headers.items() if h.lower().startswith('access-control')]
        if cors_headers:
            print("✅ Header CORS ditemukan pada respons auth/users")
            for header in cors_headers:
                print(f"  {header}: {users_resp.headers[header]}")
        else:
            print("❌ Header CORS tidak ditemukan pada respons auth/users")
    except requests.RequestException as e:
        print(f"❌ Gagal terhubung ke endpoint auth/users: {str(e)}")
    
    # 3. Rangkuman kondisi CORS
    print("\n=== Rangkuman CORS ===")
    cors_issues = []
    
    # Cek berdasarkan hasil tes di atas
    if not options_success:
        cors_issues.append("Preflight request tidak berfungsi dengan baik (harusnya status 204)")
    
    if not get_success:
        cors_issues.append("GET request untuk health check tidak berfungsi dengan baik")
    
    if 'get_resp' in locals() and 'Access-Control-Allow-Origin' not in get_resp.headers:
        cors_issues.append("Header Access-Control-Allow-Origin tidak ada pada respons GET")
    
    if cors_issues:
        print("⚠️ Terdeteksi masalah CORS:")
        for issue in cors_issues:
            print(f"  - {issue}")
        print("\nRekomendasi:")
        print("1. Pastikan CORS dikonfigurasi dengan benar di app.py")
        print("2. Pastikan semua endpoint mengembalikan header CORS")
        print("3. Cek apakah ada middleware yang mengintervensi respons CORS")
    else:
        print("✅ Tidak ada masalah CORS yang terdeteksi")
        print("\nSemua tes CORS berhasil! Konfigurasi CORS sudah benar.")
        
    print("\nStatus kesiapan aplikasi:")
    print(f"- Preflight OPTIONS request: {'✅ BAIK' if options_success else '❌ BERMASALAH'}")
    print(f"- Health check endpoint: {'✅ BAIK' if get_success else '❌ BERMASALAH'}")
    print(f"- Auth endpoint: {'✅ BAIK' if auth_success else '❌ BERMASALAH'}")

if __name__ == "__main__":
    api_url = "http://127.0.0.1:5000"
    
    # Terima parameter baris perintah untuk URL API kustom
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
    
    check_cors(api_url) 