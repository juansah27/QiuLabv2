#!/usr/bin/env python3
"""
Test script untuk memverifikasi koneksi database SQL Server
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import pyodbc
    from db_config.database import get_connection_string
    print("✓ pyodbc imported successfully")
    print("✓ Using existing database configuration from config.py")
except ImportError as e:
    print(f"✗ Error importing dependencies: {e}")
    print("Please install required packages: pip install pyodbc python-dotenv")
    sys.exit(1)

def test_connection():
    """Test koneksi database"""
    print("\n=== Testing Database Connection ===")
    
    try:
        # Get connection string
        conn_str = get_connection_string()
        print(f"Connection string: {conn_str}")
        
        # Test connection
        print("Attempting to connect...")
        conn = pyodbc.connect(conn_str)
        print("✓ Database connection successful!")
        
        # Test simple query
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"✓ SQL Server version: {version.split()[0]} {version.split()[1]}")
        
        # Test access to required databases
        databases = ['Flexo_Db', 'SPIDSTGEXML', 'WMSPROD']
        for db in databases:
            try:
                cursor.execute(f"USE [{db}]")
                print(f"✓ Access to {db} database: OK")
            except Exception as e:
                print(f"✗ Access to {db} database: FAILED - {e}")
        
        cursor.close()
        conn.close()
        print("✓ Connection closed successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_query():
    """Test query order monitoring"""
    print("\n=== Testing Order Monitoring Query ===")
    
    try:
        conn = pyodbc.connect(get_connection_string())
        cursor = conn.cursor()
        
        # Simplified test query
        test_query = """
        SELECT TOP 5 
            so.SystemId,
            so.MerchantName,
            so.OrderDate,
            so.SystemRefId
        FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
        WHERE so.FulfilledByFlexo <> '0'
        ORDER BY so.OrderDate DESC
        """
        
        cursor.execute(test_query)
        results = cursor.fetchall()
        
        if results:
            print(f"✓ Query executed successfully, found {len(results)} records")
            print("Sample data:")
            for i, row in enumerate(results[:3]):
                print(f"  {i+1}. SystemId: {row[0]}, Merchant: {row[1]}, Date: {row[2]}")
        else:
            print("✓ Query executed successfully, but no data found")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Query test failed: {e}")
        return False

if __name__ == "__main__":
    print("Order Monitoring Database Connection Test")
    print("=" * 50)
    
    # Test connection
    connection_ok = test_connection()
    
    if connection_ok:
        # Test query
        query_ok = test_query()
        
        if query_ok:
            print("\n🎉 All tests passed! Database is ready for Order Monitoring.")
        else:
            print("\n⚠️  Connection OK but query failed. Check database permissions.")
    else:
        print("\n❌ Database connection failed. Please check configuration.")
        print("\nTroubleshooting tips:")
        print("1. Check if SQL Server is running")
        print("2. Verify server name/IP in .env file")
        print("3. Install ODBC Driver 17 for SQL Server")
        print("4. Check firewall settings")
        print("5. Verify database credentials")
