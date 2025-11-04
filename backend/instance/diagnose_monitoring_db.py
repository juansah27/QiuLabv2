import os
import sqlite3

def main():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app.db'))
    print(f"Path absolut database: {db_path}")
    if not os.path.exists(db_path):
        print("[ERROR] File database TIDAK DITEMUKAN!")
        return
    print("[OK] File database ditemukan.")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Cek tabel monitoring
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='monitoring'")
        if not cursor.fetchone():
            print("[ERROR] Tabel 'monitoring' TIDAK ADA di database!")
            return
        print("[OK] Tabel 'monitoring' ditemukan.")
        # Print kolom tabel
        cursor.execute("PRAGMA table_info(monitoring)")
        columns = cursor.fetchall()
        print("Kolom tabel monitoring:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        # Print isi tabel
        cursor.execute("SELECT * FROM monitoring")
        rows = cursor.fetchall()
        print(f"\nIsi tabel monitoring ({len(rows)} baris):")
        for row in rows:
            print(row)
        if not rows:
            print("[INFO] Tabel monitoring kosong.")
        conn.close()
    except Exception as e:
        print(f"[ERROR] Gagal akses database: {e}")

if __name__ == '__main__':
    main() 