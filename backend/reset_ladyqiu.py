import sqlite3
from werkzeug.security import generate_password_hash

def reset_ladyqiu_user():
    """Reset password dan hak akses untuk user ladyqiu"""
    try:
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        
        # Generate password hash baru
        new_password = '@Wanipiro27'
        password_hash = generate_password_hash(new_password)
        
        # Update password dan is_admin
        cursor.execute(
            "UPDATE users SET password_hash = ?, is_admin = 1 WHERE username = ?",
            (password_hash, 'ladyqiu')
        )
        
        rows_affected = cursor.rowcount
        conn.commit()
        
        print(f"User ladyqiu diperbarui: {rows_affected} baris terpengaruh")
        print(f"Password diubah menjadi: {new_password}")
        print(f"Hak akses admin diaktifkan")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    reset_ladyqiu_user() 