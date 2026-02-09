import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'app.db')
print(f"Checking database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, is_admin FROM users")
    users = cursor.fetchall()
    print("Users found:")
    for user in users:
        print(user)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
