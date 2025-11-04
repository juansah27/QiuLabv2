import sqlite3
from werkzeug.security import generate_password_hash

# Koneksi ke database
conn = sqlite3.connect('instance/app.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Memeriksa apakah pengguna Aisyah ada
cursor.execute("SELECT * FROM users WHERE username = ?", ('Aisyah',))
user = cursor.fetchone()

if user:
    print(f"Pengguna Aisyah ditemukan dengan ID: {user['id']}")
    
    # Reset password
    new_password = 'system123'
    password_hash = generate_password_hash(new_password)
    
    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        (password_hash, 'Aisyah')
    )
    conn.commit()
    
    print(f"Password untuk Aisyah telah di-reset ke: {new_password}")
else:
    print("Pengguna Aisyah tidak ditemukan, membuat pengguna baru...")
    
    # Buat user baru
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
        ('Aisyah', 'aisyah@example.com', generate_password_hash('system123'), 0)
    )
    conn.commit()
    
    print("Pengguna Aisyah berhasil dibuat dengan password: system123")

# Tampilkan semua pengguna
print("\nDaftar semua pengguna:")
cursor.execute("SELECT id, username, email, is_admin FROM users")
users = cursor.fetchall()

for user in users:
    print(f"ID: {user['id']}, Username: {user['username']}, Email: {user['email']}, Admin: {'Ya' if user['is_admin'] else 'Tidak'}")

conn.close() 