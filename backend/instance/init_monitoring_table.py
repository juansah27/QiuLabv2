import os
import sqlite3

def main():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'app.db'))
    print(f"Path absolut database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Buat tabel jika belum ada
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monitoring (
            id INTEGER PRIMARY KEY,
            system_ref_id TEXT,
            remark TEXT
        )
    ''')
    print("[OK] Tabel 'monitoring' sudah dipastikan ada.")
    # Tambah dummy data jika tabel kosong
    cursor.execute("SELECT COUNT(*) FROM monitoring")
    count = cursor.fetchone()[0]
    if count == 0:
        dummy = [
            (1, 'Order A', 'Remark untuk Order A'),
            (2, 'Order B', 'Remark untuk Order B'),
            (3, 'Order C', None),
        ]
        cursor.executemany("INSERT INTO monitoring (id, system_ref_id, remark) VALUES (?, ?, ?)", dummy)
        print("[OK] Dummy data dimasukkan.")
    else:
        print(f"[INFO] Tabel sudah berisi {count} baris, tidak menambah dummy data.")
    conn.commit()
    conn.close()
    print("[SELESAI]")

if __name__ == '__main__':
    main() 