import sqlite3
from werkzeug.security import generate_password_hash

def get_db_connection():
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

def delete_users_except_ladyqiu():
    print("Memulai proses pembersihan pengguna...")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Cek apakah ladyqiu sudah ada
        cursor.execute("SELECT * FROM users WHERE username = ?", ('ladyqiu',))
        ladyqiu_user = cursor.fetchone()
        
        # Jika ladyqiu belum ada, buat akun ladyqiu
        if not ladyqiu_user:
            print("Membuat akun ladyqiu...")
            password_hash = generate_password_hash('@Wanipiro27')
            cursor.execute(
                "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
                ('ladyqiu', 'ladyqiu@example.com', password_hash, 1)
            )
            conn.commit()
            print("Akun ladyqiu berhasil dibuat!")
        else:
            print("Akun ladyqiu sudah ada dengan ID:", ladyqiu_user['id'])
            
            # Pastikan ladyqiu memiliki hak admin
            if not ladyqiu_user['is_admin']:
                cursor.execute("UPDATE users SET is_admin = 1 WHERE username = 'ladyqiu'")
                conn.commit()
                print("Akun ladyqiu ditingkatkan ke admin")
        
        # Hapus semua pengguna kecuali ladyqiu
        cursor.execute("DELETE FROM users WHERE username != 'ladyqiu'")
        deleted_count = cursor.rowcount
        conn.commit()
        
        print(f"Berhasil menghapus {deleted_count} pengguna lain")
        print("Proses pembersihan pengguna selesai")
        
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    delete_users_except_ladyqiu() 