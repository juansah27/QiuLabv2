import sqlite3

def check_and_update_user_schema():
    """Periksa dan tambahkan kolom 'role' jika belum ada"""
    try:
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        
        # Periksa apakah kolom 'role' sudah ada
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print(f"Kolom yang ada: {columns}")
        
        if 'role' not in columns:
            print("Kolom 'role' tidak ditemukan. Menambahkan kolom...")
            cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
            conn.commit()
            
            # Update role untuk admin
            cursor.execute("UPDATE users SET role = 'admin' WHERE is_admin = 1")
            admin_updated = cursor.rowcount
            conn.commit()
            
            print(f"Kolom 'role' berhasil ditambahkan. {admin_updated} admin diperbarui.")
        else:
            print("Kolom 'role' sudah ada.")
        
        # Update role untuk ladyqiu
        cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'ladyqiu'")
        rows_affected = cursor.rowcount
        conn.commit()
        
        print(f"Role untuk ladyqiu diperbarui: {rows_affected} baris terpengaruh")
        
        # Tampilkan data user ladyqiu
        cursor.execute("SELECT id, username, email, is_admin, role FROM users WHERE username = 'ladyqiu'")
        user_data = cursor.fetchone()
        
        if user_data:
            print(f"Data user ladyqiu:")
            print(f"  ID: {user_data[0]}")
            print(f"  Username: {user_data[1]}")
            print(f"  Email: {user_data[2]}")
            print(f"  Is Admin: {user_data[3]}")
            print(f"  Role: {user_data[4]}")
        else:
            print("User ladyqiu tidak ditemukan.")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    check_and_update_user_schema() 