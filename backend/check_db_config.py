#!/usr/bin/env python3
"""
Script untuk mengecek konfigurasi database yang sedang digunakan
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config import DB_SERVER, DB_NAME, DB_USERNAME, DB_PASSWORD
    from db_config.database import get_connection_string, DB_CONFIG
    print("✓ Successfully imported database configuration")
except ImportError as e:
    print(f"✗ Error importing configuration: {e}")
    sys.exit(1)

def check_config():
    """Check current database configuration"""
    print("\n=== Current Database Configuration ===")
    print(f"Server: {DB_SERVER or 'Not set'}")
    print(f"Database: {DB_NAME or 'Not set'}")
    print(f"Username: {DB_USERNAME or 'Not set'}")
    print(f"Password: {'***' if DB_PASSWORD else 'Not set'}")
    
    print("\n=== Connection String Preview ===")
    conn_str = get_connection_string()
    # Mask password in connection string
    masked_conn_str = conn_str.replace(DB_PASSWORD, '***') if DB_PASSWORD else conn_str
    print(f"Connection String: {masked_conn_str}")
    
    print("\n=== Environment Variables ===")
    env_vars = ['DB_SERVER', 'DB_NAME', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DRIVER', 'DB_TRUSTED_CONNECTION']
    for var in env_vars:
        value = os.getenv(var, 'Not set')
        if var == 'DB_PASSWORD' and value != 'Not set':
            value = '***'
        print(f"{var}: {value}")
    
    print("\n=== Configuration Status ===")
    if DB_SERVER and DB_NAME:
        print("✓ Server and Database configured")
    else:
        print("✗ Server or Database not configured")
    
    if DB_USERNAME and DB_PASSWORD:
        print("✓ SQL Server Authentication configured")
    elif not DB_USERNAME and not DB_PASSWORD:
        print("✓ Windows Authentication will be used")
    else:
        print("⚠️  Incomplete SQL Server Authentication (missing username or password)")

if __name__ == "__main__":
    print("Database Configuration Checker")
    print("=" * 40)
    
    check_config()
    
    print("\n" + "=" * 40)
    print("Next steps:")
    print("1. If configuration looks correct, run: python test_db_connection.py")
    print("2. If configuration needs updating, check your .env file")
    print("3. Make sure DB_SERVER, DB_NAME, DB_USERNAME, DB_PASSWORD are set correctly")
