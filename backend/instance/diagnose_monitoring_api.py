import requests
import json

BACKEND_URL = 'http://localhost:5000/api/query/monitoring'  # Ganti jika port/backend berbeda
JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1MTQzOTQ3OSwianRpIjoiOTEzZjUzNjMtM2JkNS00MzBhLWJhMDQtYWM0ODQ3OTZlNzFkIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NTE0Mzk0NzksImV4cCI6MTc1MjMwMzQ3OSwiaXNfYWRtaW4iOnRydWUsInVzZXJuYW1lIjoibGFkeXFpdSIsInJvbGUiOiJhZG1pbiIsImlzX3N1cGVydXNlciI6ZmFsc2V9.3AAv8UOGMzhOmkctVxPzLLYMg9Ut5-3WHdUwRqge5cE'  # Isi token JWT jika perlu autentikasi

def main():
    system_ref_id = input('Masukkan SystemRefId yang ingin dicek: ').strip()
    headers = {'Content-Type': 'application/json'}
    if JWT_TOKEN:
        headers['Authorization'] = f'Bearer {JWT_TOKEN}'
    payload = {"system_ref_ids": [system_ref_id]}
    print(f"\nMengirim request ke {BACKEND_URL} dengan payload: {payload}\n")
    try:
        resp = requests.post(BACKEND_URL, headers=headers, json=payload)
        print(f"Status code: {resp.status_code}")
        data = resp.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
        # Cek apakah SystemRefId ditemukan dan Remark ada
        results = data.get('data', {}).get('results', [])
        found = False
        for row in results:
            if row.get('SystemRefId') == system_ref_id:
                found = True
                remark = row.get('Remark')
                print(f"\n[HASIL] SystemRefId: {system_ref_id} -> Remark: {remark!r}")
        if not found:
            print(f"\n[INFO] SystemRefId '{system_ref_id}' TIDAK ditemukan di response API.")
    except Exception as e:
        print(f"[ERROR] Gagal request ke API: {e}")

if __name__ == '__main__':
    main() 