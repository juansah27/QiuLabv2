import os
from dotenv import load_dotenv

# Load environment variables from config.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_SERVER, DB_NAME, DB_USERNAME, DB_PASSWORD

# Database Configuration
DB_CONFIG = {
    'driver': os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server'),
    'server': DB_SERVER or os.getenv('DB_SERVER', 'localhost'),
    'database': DB_NAME or os.getenv('DB_NAME', 'Flexo_Db'),
    'trusted_connection': os.getenv('DB_TRUSTED_CONNECTION', 'yes'),
    'username': DB_USERNAME or os.getenv('DB_USERNAME', ''),
    'password': DB_PASSWORD or os.getenv('DB_PASSWORD', ''),
}

def get_connection_string():
    """Generate connection string based on configuration"""
    # Use SQL Server Authentication if username and password are provided
    if DB_CONFIG['username'] and DB_CONFIG['password']:
        # SQL Server Authentication
        conn_str = (
            f"DRIVER={{{DB_CONFIG['driver']}}};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database']};"
            f"UID={DB_CONFIG['username']};"
            f"PWD={DB_CONFIG['password']};"
        )
    else:
        # Windows Authentication (fallback)
        conn_str = (
            f"DRIVER={{{DB_CONFIG['driver']}}};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database']};"
            f"Trusted_Connection=yes;"
        )
    
    return conn_str
