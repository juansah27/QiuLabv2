import sqlite3
import os
import sys

print("Script list_users.py dimulai")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Files in current directory: {os.listdir('.')}")

def get_db_connection():
    # Cek apakah file database ada
    db_path = 'instance/app.db'
    abs_path = os.path.abspath(db_path)
    print(f"Mencari database di: {abs_path}")
    
    if not os.path.exists(db_path):
        print(f"Database tidak ditemukan di {db_path}")
        print("Direktori saat ini:", os.getcwd())
        print("Isi direktori:", os.listdir())
        if os.path.exists('instance'):
            print("Isi direktori instance:", os.listdir('instance'))
        else:
            print("Direktori instance tidak ditemukan")
        raise FileNotFoundError(f"Database tidak ditemukan di {db_path}")
    
    print(f"Database ditemukan di {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def list_all_users():
    print("Daftar pengguna dalam database:")
    print("=" * 50)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Cek apakah tabel users ada
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("Tabel 'users' tidak ditemukan dalam database")
            print("Tabel yang ada dalam database:")
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            for table in tables:
                print(f" - {table['name']}")
            return
        
        cursor.execute("SELECT * FROM users ORDER BY id")
        users = cursor.fetchall()
        
        if not users:
            print("Tidak ada pengguna dalam database.")
        else:
            print(f"Total pengguna: {len(users)}")
            print("-" * 50)
            print(f"{'ID':<5} {'Username':<15} {'Email':<25} {'Admin':<5}")
            print("-" * 50)
            
            for user in users:
                print(f"{user['id']:<5} {user['username']:<15} {user['email']:<25} {'Ya' if user['is_admin'] else 'Tidak':<5}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")
        print(f"Tipe error: {type(e).__name__}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Main block running")
    list_all_users()
    print("Script selesai") 