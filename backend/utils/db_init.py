import sqlite3
import os
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime

def init_db():
    """Initialize the database and create all required tables"""
    
    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    
    db_path = os.path.join(instance_path, 'app.db')
    
    # Connect to database (it will be created if it doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0
    )
    ''')
    
    # Create queries table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        query_text TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create dashboard_configs table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS dashboard_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create excel_files table to track uploaded files
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS excel_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        user_id TEXT,
        upload_date TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create a default admin user if none exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin = 1")
    admin_count = cursor.fetchone()[0]
    
    if admin_count == 0:
        user_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        # Default admin: username=admin, password=admin123
        cursor.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, "admin", "admin@example.com", generate_password_hash("admin123"), created_at, 1)
        )
        print("Created default admin user: admin / admin123")
    
    # Create some sample queries
    cursor.execute("SELECT COUNT(*) FROM queries")
    query_count = cursor.fetchone()[0]
    
    if query_count == 0:
        sample_queries = [
            ("List all users", "SELECT id, username, email, created_at, is_admin FROM users", "Shows all registered users"),
            ("List all queries", "SELECT id, name, description FROM queries", "Shows all available queries"),
            ("List all Excel files", "SELECT id, filename, original_filename, upload_date, file_size FROM excel_files", "Shows all uploaded Excel files")
        ]
        
        for name, query_text, description in sample_queries:
            query_id = str(uuid.uuid4())
            created_at = datetime.now().isoformat()
            cursor.execute(
                "INSERT INTO queries (id, name, query_text, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (query_id, name, query_text, description, created_at, created_at)
            )
        
        print("Created sample queries")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print(f"Database initialized at {db_path}")

if __name__ == "__main__":
    init_db() 