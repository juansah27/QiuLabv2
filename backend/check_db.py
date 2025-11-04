import sqlite3
import os

def check_databases():
    print("=== CHECKING DATABASES ===\n")
    
    # Check shop_mapping.db
    if os.path.exists('shop_mapping.db'):
        print("✅ shop_mapping.db exists")
        conn = sqlite3.connect('shop_mapping.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"   Tables: {[table[0] for table in tables]}")
        
        # Check setup_request_analytics table
        if ('setup_request_analytics',) in tables:
            cursor.execute("SELECT COUNT(*) FROM setup_request_analytics")
            count = cursor.fetchone()[0]
            print(f"   setup_request_analytics records: {count}")
        
        conn.close()
    else:
        print("❌ shop_mapping.db not found")
    
    print()
    
    # Check app.db
    if os.path.exists('instance/app.db'):
        print("✅ app.db exists")
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"   Tables: {[table[0] for table in tables]}")
        conn.close()
    else:
        print("❌ app.db not found")

if __name__ == "__main__":
    check_databases() 