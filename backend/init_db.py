import sqlite3
import os
from werkzeug.security import generate_password_hash

# Ensure instance directory exists
os.makedirs('instance', exist_ok=True)

# Connect to database
conn = sqlite3.connect('instance/app.db')
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT 0
)
''')

# Create excel_files table
cursor.execute('''
CREATE TABLE IF NOT EXISTS excel_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
''')

# Create sql_queries table
cursor.execute('''
CREATE TABLE IF NOT EXISTS sql_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sql_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
''')

# Create dashboards table
cursor.execute('''
CREATE TABLE IF NOT EXISTS dashboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    layout JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
''')

# Insert default admin user if not exists
cursor.execute("SELECT id FROM users WHERE username = 'admin'")
if not cursor.fetchone():
    admin_password_hash = generate_password_hash('admin123')
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
        ('admin', 'admin@example.com', admin_password_hash, True)
    )
    print("Created admin user: username='admin', password='admin123'")

# Commit changes and close connection
conn.commit()
conn.close()

print("Database initialized successfully.") 