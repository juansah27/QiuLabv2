from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sqlite3
from models.query import Query
from models.user import User
import os
from dotenv import load_dotenv, find_dotenv
import pyodbc
from datetime import datetime, timedelta

# Helper function to get available ODBC driver
def get_odbc_driver():
    """
    Get available ODBC Driver for SQL Server.
    Tries multiple driver names in order of preference.
    Returns the first available driver or raises exception.
    """
    # List of drivers to try in order of preference
    drivers_to_try = [
        'ODBC Driver 17 for SQL Server',
        'ODBC Driver 18 for SQL Server',
        'ODBC Driver 19 for SQL Server',
        'SQL Server Native Client 11.0',
        'SQL Server',
        'SQL Server Native Client 10.0'
    ]
    
    # Get list of available drivers
    try:
        available_drivers = [driver for driver in pyodbc.drivers()]
        
        # Try to find a matching driver
        for driver_name in drivers_to_try:
            if driver_name in available_drivers:
                return driver_name
        
        # If no driver found, return error message with available drivers
        available_list = ', '.join(available_drivers) if available_drivers else 'None'
        raise Exception(
            f"ODBC Driver for SQL Server tidak ditemukan. "
            f"Driver yang tersedia: {available_list}. "
            f"Silakan install 'ODBC Driver 17 for SQL Server' dari: "
            f"https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server"
        )
    except Exception as e:
        if "ODBC Driver" in str(e):
            raise e
        raise Exception(f"Error checking ODBC drivers: {str(e)}")

# Helper function to create connection string with driver detection
def create_sql_server_connection_string(server, database, username, password, timeout=30, mars_connection=False):
    """
    Create SQL Server connection string with automatic driver detection.
    Includes platform-specific optimizations for Linux.
    """
    import platform
    driver = get_odbc_driver()
    
    connection_string = f'DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
    
    if timeout:
        connection_string += f';TIMEOUT={timeout}'
    
    if mars_connection:
        connection_string += ';Mars_Connection=yes'
    
    # Linux-specific optimizations for better network performance
    if platform.system() == "Linux":
        # Increase packet size for better network performance
        connection_string += ';Packet Size=4096'
        # Use TDS protocol version 7.4 (more efficient)
        connection_string += ';TDS_Version=7.4'
    
    return connection_string

query_bp = Blueprint('query', __name__)

@query_bp.route('/', methods=['GET'])
@jwt_required()
def get_queries():
    """Get all queries visible to the current user"""
    user_id = get_jwt_identity()
    
    # Get all queries that are either created by this user or public (no user_id)
    queries = Query.get_all(user_id)
    
    return jsonify([query.to_dict() for query in queries]), 200

@query_bp.route('/<query_id>', methods=['GET'])
@jwt_required()
def get_query(query_id):
    """Get a specific query by ID"""
    user_id = get_jwt_identity()
    query = Query.get_by_id(query_id)
    
    if not query:
        return jsonify({'error': 'Query not found'}), 404
    
    # Check if user has access (either the creator or it's a public query)
    if query.user_id and query.user_id != user_id:
        # Get user to check if admin
        user = User.get_by_id(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(query.to_dict()), 200

@query_bp.route('/', methods=['POST'])
@jwt_required()
def create_query():
    """Create a new query"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('query_text'):
        return jsonify({'error': 'Name and query text are required'}), 400
    
    # Create the new query
    query = Query.create(
        name=data['name'],
        query_text=data['query_text'],
        description=data.get('description'),
        user_id=user_id
    )
    
    return jsonify(query.to_dict()), 201

@query_bp.route('/<query_id>', methods=['PUT'])
@jwt_required()
def update_query(query_id):
    """Update an existing query"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    query = Query.get_by_id(query_id)
    
    if not query:
        return jsonify({'error': 'Query not found'}), 404
    
    # Check if user is the creator or admin
    if query.user_id and query.user_id != user_id:
        user = User.get_by_id(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Update the query
    updated_query = query.update(
        name=data.get('name'),
        query_text=data.get('query_text'),
        description=data.get('description')
    )
    
    return jsonify(updated_query.to_dict()), 200

@query_bp.route('/<query_id>', methods=['DELETE'])
@jwt_required()
def delete_query(query_id):
    """Delete a query"""
    user_id = get_jwt_identity()
    
    query = Query.get_by_id(query_id)
    
    if not query:
        return jsonify({'error': 'Query not found'}), 404
    
    # Check if user is the creator or admin
    if query.user_id and query.user_id != user_id:
        user = User.get_by_id(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete the query
    query.delete()
    
    return jsonify({'message': 'Query deleted successfully'}), 200

@query_bp.route('/<query_id>/execute', methods=['POST'])
@jwt_required()
def execute_query(query_id):
    """Execute a query and return the results"""
    user_id = get_jwt_identity()
    
    query = Query.get_by_id(query_id)
    
    if not query:
        return jsonify({'error': 'Query not found'}), 404
    
    # Check if user has access
    if query.user_id and query.user_id != user_id:
        user = User.get_by_id(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Execute the query
        results = query.execute()
        
        # If there are results, get column names from the first row
        columns = []
        if results and len(results) > 0:
            columns = list(results[0].keys())
        
        return jsonify({
            'query': query.to_dict(),
            'columns': columns,
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Error executing query',
            'details': str(e)
        }), 400

@query_bp.route('/monitoring', methods=['POST'])
@jwt_required()
def run_monitoring_query():
    """Execute monitoring query for SystemRefIds and return results in categorized format"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('system_ref_ids'):
            return jsonify({'error': 'SystemRefIds are required'}), 400
            
        # Get list of SystemRefIds from request
        system_ref_ids = data.get('system_ref_ids', [])
        
        # Filter out empty values and create a comma separated list for SQL query
        filtered_ids = [id.strip() for id in system_ref_ids if id.strip()]
        
        if not filtered_ids:
            return jsonify({'error': 'No valid SystemRefIds provided'}), 400
            
        # Dapatkan koneksi dari modul Query
        try:
            # Load environment variables
            load_dotenv()
            
            # Get connection details from environment
            server = os.getenv('DB_SERVER')
            database = os.getenv('DB_NAME')
            username = os.getenv('DB_USERNAME')
            password = os.getenv('DB_PASSWORD')
            
            use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
            
            # Gunakan SQLite untuk testing jika dikonfigurasi demikian
            if use_sqlite_for_testing:
                # Ambil data dari SQLite tabel monitoring
                db_path = os.path.join(os.path.dirname(__file__), '../instance/app.db')
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                placeholders = ','.join(['?'] * len(filtered_ids))
                monitoring_query = f"SELECT *, remark FROM monitoring WHERE system_ref_id IN ({placeholders})"
                cursor.execute(monitoring_query, filtered_ids)
                results = [dict(row) for row in cursor.fetchall()]
                # Normalisasi field Remark (huruf besar)
                for row in results:
                    if 'remark' in row and 'Remark' not in row:
                        row['Remark'] = row['remark']
                    elif 'Remark' not in row:
                        # Ensure all rows have a Remark field, even if null
                        row['Remark'] = None
                    if 'system_ref_id' in row and 'SystemRefId' not in row:
                        row['SystemRefId'] = row['system_ref_id']
                cursor.close()
                conn.close()
            else:
                # Buat koneksi langsung ke SQL Server untuk menggunakan parameter query
                connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
                conn = pyodbc.connect(connection_string)
                cursor = conn.cursor()
                
                # Buat placeholder untuk parameter IN clause
                placeholders = ','.join(['?' for _ in filtered_ids])
                
                # Construct the monitoring query with parameterized IN clause
                # OPTIMIZED VERSION: Removed slow EXISTS subqueries
                monitoring_query = f"""
                SELECT
                    so.SystemId,
                    CASE 
                        WHEN so.MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                        WHEN so.MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                        ELSE so.MerchantName
                    END AS MerchantName, 
                    so.SystemRefId,
                    so.OrderStatus,
                    so.Awb,
                    so.OrderedById,
                    CASE 
                        WHEN COUNT(ol.ordnum) > 0 THEN 'Yes'
                        ELSE 'No'
                    END AS [Status_Interfaced],
                    CASE 
                        WHEN so.SystemId = 'MPSH' THEN 
                            CASE 
                                WHEN so.OrderedById = 'LOGISTICS_NOT_START' AND so.OrderStatus = 'READY_TO_SHIP' THEN 'Pending Verifikasi'
                                ELSE 'Follow Up!'
                            END
                        ELSE 'Follow Up!'
                    END AS [Status_SC],
                    CASE 
                        WHEN so.OrderDate >= CAST(CONVERT(varchar, GETDATE(), 23) + ' 00:00:00' AS DATETIME)
                        AND so.OrderDate <  CAST(CONVERT(varchar, GETDATE(), 23) + ' 17:00:01' AS DATETIME) THEN 'Batch 1'
                        WHEN so.OrderDate >= CAST(CONVERT(varchar, GETDATE(), 23) + ' 17:00:01' AS DATETIME)
                        AND so.OrderDate <= CAST(CONVERT(varchar, GETDATE(), 23) + ' 23:59:59' AS DATETIME) THEN 'Batch 2'
                        ELSE 'Out of Range'
                    END AS Batch,
                    '' AS Issue,
                    '' AS [SKU Telat Masuk],
                    CASE 
                        WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 30 THEN 'Lebih Dari 1 jam'
                        ELSE 'Kurang Dari 1 jam'
                    END AS [Status_Durasi],
                    CAST('' AS NVARCHAR(MAX)) AS ItemIds,
                    so.OrderDate,
                    so.DtmCrt,
                    so.DeliveryMode,    
                    so.importlog,
                    so.FulfilledByFlexo,
                    MAX(ol.moddte) AS AddDate,  
                    CASE 
                        WHEN so.Origin = 1 OR so.Origin IS NULL THEN 'Flexofast-TGR'
                        WHEN so.Origin = 3 THEN 'Flexofast-SBY'
                        ELSE 'Unknown'
                    END AS Origin
                FROM Flexo_Db.dbo.SalesOrder so WITH (NOLOCK)
                LEFT JOIN WMSPROD.dbo.ord_line ol WITH (NOLOCK)
                    ON ol.ordnum = so.SystemRefId
                WHERE so.SystemRefId IN ({placeholders})
                GROUP BY
                    so.SystemId, so.SystemRefId, so.MerchantName, so.OrderDate, so.DtmCrt, 
                    so.OrderStatus, so.Awb, so.DeliveryMode, so.Origin, so.ImportLog, so.FulfilledByFlexo, so.OrderedById
                OPTION (MAXDOP 4, OPTIMIZE FOR UNKNOWN)
                """
                
                # Execute the query with parameters
                cursor.execute(monitoring_query, filtered_ids)
                
                # Get column names
                columns = [column[0] for column in cursor.description]
                
                # Fetch all rows and convert to dictionaries
                results = []
                for row in cursor.fetchall():
                    row_dict = {}
                    for i, value in enumerate(row):
                        row_dict[columns[i]] = value
                    results.append(row_dict)
                
                cursor.close()
                conn.close()
            
            # Setelah results diisi (SQL Server), merge remark dari SQLite
            try:
                db_path = os.path.join(os.path.dirname(__file__), '../instance/app.db')
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                # Buat mapping SystemRefId -> Remark dari SQLite
                system_ref_ids = [row.get('SystemRefId') for row in results if row.get('SystemRefId')]
                if system_ref_ids:
                    placeholders = ','.join(['?'] * len(system_ref_ids))
                    cursor.execute(f"SELECT system_ref_id, remark FROM monitoring WHERE system_ref_id IN ({placeholders})", system_ref_ids)
                    remark_map = {row['system_ref_id']: row['remark'] for row in cursor.fetchall()}
                    for row in results:
                        sysid = row.get('SystemRefId')
                        if sysid in remark_map:
                            row['Remark'] = remark_map[sysid]
                        else:
                            # Ensure all rows have a Remark field, even if null
                            row['Remark'] = None
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"[WARNING] Gagal merge remark dari SQLite: {e}")
            
            # Process results into required categories
            pending_verifikasi_count = 0
            cancelled_count = 0
            na_null_count = 0
            kurang_dari_1_jam = 0
            lebih_dari_1_jam = 0
            
            for row in results:
                # Count for summary cards
                if row.get('Status_SC') == 'PENDING VERIFIKASI':
                    pending_verifikasi_count += 1
                
                if row.get('OrderStatus') in ['IN_CANCEL', 'CANCELLED']:
                    cancelled_count += 1
                
                if not row.get('OrderStatus') or row.get('OrderStatus') == 'N/A':
                    na_null_count += 1
                
                # Count for duration summary
                if row.get('Status_Durasi') == 'Kurang Dari 1 jam':
                    kurang_dari_1_jam += 1
                elif row.get('Status_Durasi') == 'Lebih Dari 1 jam':
                    lebih_dari_1_jam += 1
            
            # Prepare response
            response = {
                "status": "success",
                "data": {
                    "results": results,  # Full result set for table
                    "summary": {
                        "pending_verifikasi": pending_verifikasi_count,
                        "cancelled": cancelled_count,
                        "na_null": na_null_count
                    },
                    "duration": {
                        "kurang_dari_1_jam": kurang_dari_1_jam,
                        "lebih_dari_1_jam": lebih_dari_1_jam
                    }
                }
            }
            
            return jsonify(response), 200
            
        except pyodbc.Error as e:
            import traceback
            print("PYODBC ERROR:", str(e))
            print(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'error': 'Error database',
                'details': str(e)
            }), 400
        except Exception as e:
            import traceback
            print("GENERAL ERROR:", str(e))
            print(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'error': 'Error executing monitoring query',
                'details': str(e)
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'Server error',
            'details': str(e)
        }), 500

@query_bp.route('/database-config', methods=['GET'])
@jwt_required()
def get_database_config():
    """Get current database configuration"""
    try:
        # Verifikasi apakah user adalah admin
        user_id = get_jwt_identity()
        
        try:
            user = User.get_by_id(user_id)
            
            # Jika untuk testing/development, izinkan semua user (opsional)
            is_development = os.environ.get('FLASK_ENV') == 'development'
            if not is_development and (not user or not user.is_admin):
                return jsonify({
                    'status': 'error',
                    'error': 'Unauthorized. Hanya admin yang bisa mengakses konfigurasi database.'
                }), 403
        except Exception as user_err:
            # Log error tetapi tetap berikan respons untuk testing
            print(f"Error verifying user: {str(user_err)}")
            # Gunakan fallback jika ada error saat verifikasi user
            
        # Load environment variables
        import os
        from dotenv import load_dotenv, find_dotenv
        
        try:
            # Reload untuk mendapatkan nilai terbaru
            dotenv_path = find_dotenv()
            if not dotenv_path:
                # Jika file .env tidak ditemukan, gunakan nilai default
                return jsonify({
                    'status': 'success',
                    'config': {
                        'server': 'localhost',
                        'database': 'master',
                        'username': 'sa',
                        'use_sqlite_for_testing': True
                    }
                }), 200
                
            load_dotenv(dotenv_path, override=True)
        except Exception as dotenv_err:
            print(f"Error loading .env file: {str(dotenv_err)}")
            # Fallback jika gagal load .env
            return jsonify({
                'status': 'success',
                'config': {
                    'server': 'localhost',
                    'database': 'master', 
                    'username': 'sa',
                    'use_sqlite_for_testing': True
                }
            }), 200
        
        # Get configuration (tanpa password)
        config = {
            'server': os.getenv('DB_SERVER', 'localhost'),
            'database': os.getenv('DB_NAME', 'master'),
            'username': os.getenv('DB_USERNAME', 'sa'),
            'use_sqlite_for_testing': os.getenv('USE_SQLITE_FOR_TESTING', 'True').lower() == 'true'
        }
        
        return jsonify({
            'status': 'success',
            'config': config
        }), 200
        
    except Exception as e:
        print(f"Error in get_database_config: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Gagal memuat konfigurasi database',
            'details': str(e)
        }), 500 

@query_bp.route('/database-config', methods=['POST'])
@jwt_required()
def update_database_config():
    """Update database configuration"""
    try:
        # Verifikasi apakah user adalah admin
        user_id = get_jwt_identity()
        
        try:
            user = User.get_by_id(user_id)
            
            # Jika untuk testing/development, izinkan semua user (opsional)
            is_development = os.environ.get('FLASK_ENV') == 'development'
            if not is_development and (not user or not user.is_admin):
                return jsonify({
                    'status': 'error',
                    'error': 'Unauthorized. Hanya admin yang bisa mengakses konfigurasi database.'
                }), 403
        except Exception as user_err:
            # Log error tetapi tetap berikan respons untuk testing
            print(f"Error verifying user: {str(user_err)}")
            if os.environ.get('FLASK_ENV') != 'development':
                return jsonify({
                    'status': 'error',
                    'error': 'Terjadi kesalahan saat verifikasi user.'
                }), 500
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'No data provided'
            }), 400
        
        # Update .env file
        try:
            dotenv_path = find_dotenv()
            if not dotenv_path:
                # Create .env file if it doesn't exist
                dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
            
            # Load current env
            load_dotenv(dotenv_path)
            
            # Update values
            env_vars = {}
            if 'server' in data:
                env_vars['DB_SERVER'] = data['server']
            if 'database' in data:
                env_vars['DB_NAME'] = data['database']
            if 'username' in data:
                env_vars['DB_USERNAME'] = data['username']
            if 'password' in data and data['password']:
                env_vars['DB_PASSWORD'] = data['password']
            if 'use_sqlite_for_testing' in data:
                env_vars['USE_SQLITE_FOR_TESTING'] = str(data['use_sqlite_for_testing']).lower()
                
            # Write back to .env
            with open(dotenv_path, 'a+') as f:
                f.seek(0)
                lines = f.readlines()
                existing_keys = {}
                for line in lines:
                    if '=' in line:
                        key = line.split('=')[0].strip()
                        existing_keys[key] = True
                
                # Write new or update existing
                for key, value in env_vars.items():
                    if key in existing_keys:
                        continue  # Skip existing keys, will update later
                    f.write(f"\n{key}={value}")
            
            # Update existing values
            import re
            with open(dotenv_path, 'r') as f:
                content = f.read()
            
            for key, value in env_vars.items():
                # Escape special characters in the value
                escaped_value = value.replace('\\', '\\\\').replace('$', '\\$')
                pattern = re.compile(f'^{key}=.*$', re.MULTILINE)
                if pattern.search(content):
                    content = pattern.sub(f'{key}={escaped_value}', content)
            
            with open(dotenv_path, 'w') as f:
                f.write(content)
            
            # Reload environment
            load_dotenv(dotenv_path, override=True)
            
            return jsonify({
                'status': 'success',
                'message': 'Database configuration updated successfully'
            }), 200
            
        except Exception as e:
            print(f"Error updating database config: {str(e)}")
            return jsonify({
                'status': 'error',
                'error': 'Gagal menyimpan konfigurasi database',
                'details': str(e)
            }), 500
            
    except Exception as e:
        print(f"Error in update_database_config: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Unexpected error occurred',
            'details': str(e)
        }), 500

@query_bp.route('/test-connection', methods=['POST'])
@jwt_required()
def test_database_connection():
    """Test connection to SQL Server with given credentials"""
    try:
        # Get connection parameters from request
        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'error': 'No connection data provided'
            }), 400
        
        # Extract connection parameters
        server = data.get('server')
        database = data.get('database')
        username = data.get('username')
        password = data.get('password')
        
        # Validate required fields
        if not server or not database or not username:
            return jsonify({
                'status': 'error',
                'error': 'Missing required connection parameters'
            }), 400
            
        # Try to connect to SQL Server
        try:
            import pyodbc
            
            # If password not provided, try to get from env
            if not password:
                password = os.getenv('DB_PASSWORD', '')
                
            # Create connection string
            conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
            
            # Test connection
            conn = pyodbc.connect(conn_str, timeout=5)
            conn.close()
            
            return jsonify({
                'status': 'success',
                'message': 'Koneksi berhasil!'
            }), 200
            
        except ImportError:
            return jsonify({
                'status': 'error',
                'error': 'Module pyodbc not installed. Please install it to test SQL Server connections.',
                'details': 'ImportError: No module named pyodbc'
            }), 500
            
        except Exception as db_err:
            return jsonify({
                'status': 'error',
                'error': 'Koneksi gagal',
                'details': str(db_err)
            }), 400
            
    except Exception as e:
        print(f"Error in test_database_connection: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Unexpected error occurred',
            'details': str(e)
        }), 500

@query_bp.route('/database-status', methods=['GET'])
@jwt_required()
def check_database_status():
    """Check database connection and configuration status"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        # Check configuration
        config_status = {
            'DB_SERVER': bool(server),
            'DB_NAME': bool(database),
            'DB_USERNAME': bool(username),
            'DB_PASSWORD': bool(password),
            'all_configured': bool(server and database and username and password)
        }
        
        # Test connection if configured
        connection_status = None
        if config_status['all_configured']:
            try:
                connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
                conn = pyodbc.connect(connection_string, timeout=5)
                cursor = conn.cursor()
                
                # Test simple query
                cursor.execute("SELECT GETDATE() as current_time, COUNT(*) as order_count FROM Flexo_Db.dbo.SalesOrder WITH (NOLOCK)")
                result = cursor.fetchone()
                
                connection_status = {
                    'connected': True,
                    'current_time': str(result[0]) if result else None,
                    'total_orders': result[1] if result else None
                }
                
                cursor.close()
                conn.close()
                
            except Exception as e:
                connection_status = {
                    'connected': False,
                    'error': str(e)
                }
        
        return jsonify({
            'status': 'success',
            'config': config_status,
            'connection': connection_status
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'Error checking database status',
            'details': str(e)
        }), 500



@query_bp.route('/sales-order-visualization/test', methods=['GET'])
def test_sales_order_visualization():
    """Test endpoint for sales order visualization"""
    return jsonify({
        'status': 'success',
        'message': 'Sales order visualization endpoint is working',
        'timestamp': str(datetime.now())
    }), 200

@query_bp.route('/sales-order-visualization', methods=['GET'])
@jwt_required()
def get_sales_order_visualization():
    """Get sales order visualization data with pagination and filtering"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 1000, type=int)  # Default 1000 rows per page
        merchant_filter = request.args.get('merchant', '')
        status_filter = request.args.get('status', '')
        batch_filter = request.args.get('batch', '')
        line_status_filter = request.args.get('line_status', '')
        interface_filter = request.args.get('interface', '')
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        # Build the base query
        base_query = """
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                    WHEN MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                    ELSE MerchantName
                END AS MerchantName,
                so.SystemRefId,
                so.EntityId,
                so.OrderDate,
                CASE 
                    WHEN so.SystemId = 'MPSH' 
                         AND so.OrderedById = 'LOGISTICS_NOT_START' 
                         AND so.OrderStatus = 'READY_TO_SHIP' 
                    THEN 'PENDING VERIFIKASI'
                    ELSE so.OrderStatus 
                END AS [ORDER STATUS],
                so.Awb,
                CASE
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 11:59:59') THEN 'Batch-1'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 16:59:59') THEN 'Batch-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 23:59:59') THEN 'Batch-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 11:59:59') THEN 'Batch-1 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 16:59:59') THEN 'Batch-2 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 23:59:59') THEN 'Batch-3 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 11:59:59') THEN 'Batch-1 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 16:59:59') THEN 'Batch-2 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 23:59:59') THEN 'Batch-3 Day-3'
                  ELSE 'Out Of Range'
                END AS Batch,
                CASE 
                    WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 59 THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi],
                so.FulfilledByFlexo
            FROM 
                Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE 
                so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
                AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
                )
                AND so.FulfilledByFlexo <> '0'
        ),
        DuplicateCTE AS (
            SELECT ORDNUM, ORDLIN, COUNT(*) AS jumlah
            FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG
            GROUP BY ORDNUM, ORDLIN
            HAVING COUNT(*) > 1
        )
        SELECT 
            so.SystemId,
            so.MerchantName,
            so.OrderDate,
            lseg.ORDNUM,
            so.[ORDER STATUS],
            so.Awb,
            so.Batch,
            so.Status_Durasi,
            so.FulfilledByFlexo,
            lseg.ORDLIN,
            lseg.PRTNUM,
            CASE WHEN od.ordnum IS NOT NULL THEN 'Yes' ELSE 'No' END AS Interface,
            CASE 
                WHEN lseg.ordqty = ol.ordqty THEN 'Match'
                WHEN lseg.ORDNUM IS NULL THEN 'Pending'
                WHEN lseg.ordqty <> ol.ordqty AND od.ordnum IS NULL THEN 'Not Match'
                ELSE 'Pending'
            END AS LineStatus,
            CASE 
                WHEN sku.prtnum IS NULL AND lseg.PRTNUM IS NOT NULL THEN 'Invalid SKU'
                ELSE ''
            END AS Issue,
            CASE WHEN dup.ORDNUM IS NOT NULL THEN 'Yes' ELSE 'No' END AS IsDuplicate
        FROM SalesOrderCTE so
        LEFT JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] lseg WITH(NOLOCK) ON so.SystemRefId = lseg.ORDNUM
        LEFT JOIN [WMSPROD].[dbo].ord_line ol WITH(NOLOCK)
            ON lseg.ordnum = ol.ordnum 
            AND lseg.ordlin = ol.ordlin 
            AND lseg.ordsln = ol.ordsln 
            AND lseg.prtnum = ol.prtnum
        LEFT JOIN [WMSPROD].[dbo].ord od WITH(NOLOCK) ON lseg.ordnum = od.ordnum
        LEFT JOIN [WMSPROD].[dbo].prtmst sku WITH(NOLOCK)
            ON lseg.prtnum = sku.prtnum AND sku.wh_id_tmpl = 'WMD1'
        LEFT JOIN DuplicateCTE dup ON lseg.ORDNUM = dup.ORDNUM AND lseg.ORDLIN = dup.ORDLIN
        """
        
        # Add filters
        where_conditions = []
        if merchant_filter:
            where_conditions.append(f"so.MerchantName LIKE '%{merchant_filter}%'")
        if status_filter:
            where_conditions.append(f"so.[ORDER STATUS] LIKE '%{status_filter}%'")
        if batch_filter:
            where_conditions.append(f"so.Batch LIKE '%{batch_filter}%'")
        if line_status_filter:
            where_conditions.append(f"LineStatus LIKE '%{line_status_filter}%'")
        if interface_filter:
            where_conditions.append(f"Interface = '{interface_filter}'")
        
        if where_conditions:
            base_query += " WHERE " + " AND ".join(where_conditions)
        
        # Add pagination
        base_query += f" ORDER BY so.SystemRefId, lseg.ORDLIN OFFSET {offset} ROWS FETCH NEXT {per_page} ROWS ONLY"
        
        # Get total count for pagination
        count_query = f"""
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                    WHEN MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                    ELSE MerchantName
                END AS MerchantName,
                so.SystemRefId,
                so.EntityId,
                so.OrderDate,
                CASE 
                    WHEN so.SystemId = 'MPSH' 
                         AND so.OrderedById = 'LOGISTICS_NOT_START' 
                         AND so.OrderStatus = 'READY_TO_SHIP' 
                    THEN 'PENDING VERIFIKASI'
                    ELSE so.OrderStatus 
                END AS [ORDER STATUS],
                so.Awb,
                CASE
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 11:59:59') THEN 'Batch-1'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 16:59:59') THEN 'Batch-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 23:59:59') THEN 'Batch-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 11:59:59') THEN 'Batch-1 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 16:59:59') THEN 'Batch-2 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 23:59:59') THEN 'Batch-3 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 11:59:59') THEN 'Batch-1 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 16:59:59') THEN 'Batch-2 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 23:59:59') THEN 'Batch-3 Day-3'
                  ELSE 'Out Of Range'
                END AS Batch,
                CASE 
                    WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 59 THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi],
                so.FulfilledByFlexo
            FROM 
                Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE 
                so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
                AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
                )
                AND so.FulfilledByFlexo <> '0'
        ),
        DuplicateCTE AS (
            SELECT ORDNUM, ORDLIN, COUNT(*) AS jumlah
            FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG
            GROUP BY ORDNUM, ORDLIN
            HAVING COUNT(*) > 1
        )
        SELECT COUNT(*) as total_count
        FROM SalesOrderCTE so
        LEFT JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] lseg WITH(NOLOCK) ON so.SystemRefId = lseg.ORDNUM
        LEFT JOIN [WMSPROD].[dbo].ord_line ol WITH(NOLOCK)
            ON lseg.ordnum = ol.ordnum 
            AND lseg.ordlin = ol.ordlin 
            AND lseg.ordsln = ol.ordsln 
            AND lseg.prtnum = ol.prtnum
        LEFT JOIN [WMSPROD].[dbo].ord od WITH(NOLOCK) ON lseg.ordnum = od.ordnum
        LEFT JOIN [WMSPROD].[dbo].prtmst sku WITH(NOLOCK)
            ON lseg.prtnum = sku.prtnum AND sku.wh_id_tmpl = 'WMD1'
        LEFT JOIN DuplicateCTE dup ON lseg.ORDNUM = dup.ORDNUM AND lseg.ORDLIN = dup.ORDLIN
        """
        
        if where_conditions:
            count_query += " WHERE " + " AND ".join(where_conditions)
        
        # Execute queries
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        # Fallback to default configuration if environment variables not set
        if not server:
            server = "10.6.0.6\\newjda"
        if not database:
            database = "Flexo_Db"
        if not username:
            username = "fservice"
        if not password:
            password = "SophieHappy33"
        
        # Create connection string
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute(count_query)
        total_count = cursor.fetchone()[0]
        
        # Get paginated data
        cursor.execute(base_query)
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        data = []
        for row in rows:
            data.append(dict(zip(columns, row)))
        
        cursor.close()
        conn.close()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        
        return jsonify({
            'data': data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            },
            'filters': {
                'merchant': merchant_filter,
                'status': status_filter,
                'batch': batch_filter,
                'line_status': line_status_filter,
                'interface': interface_filter
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@query_bp.route('/sales-order-visualization/summary', methods=['GET'])
@jwt_required()
def get_sales_order_summary():
    """Get summary statistics for sales order visualization"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        # Fallback to default configuration if environment variables not set
        if not server:
            server = "10.6.0.6\\newjda"
        if not database:
            database = "Flexo_Db"
        if not username:
            username = "fservice"
        if not password:
            password = "SophieHappy33"
        
        # Create connection string
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Get summary statistics
        summary_query = """
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                    WHEN MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                    ELSE MerchantName
                END AS MerchantName,
                so.SystemRefId,
                so.EntityId,
                so.OrderDate,
                CASE 
                    WHEN so.SystemId = 'MPSH' 
                         AND so.OrderedById = 'LOGISTICS_NOT_START' 
                         AND so.OrderStatus = 'READY_TO_SHIP' 
                    THEN 'PENDING VERIFIKASI'
                    ELSE so.OrderStatus 
                END AS [ORDER STATUS],
                so.Awb,
                CASE
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 11:59:59') THEN 'Batch-1'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 16:59:59') THEN 'Batch-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE(), 110) + ' 23:59:59') THEN 'Batch-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 11:59:59') THEN 'Batch-1 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 16:59:59') THEN 'Batch-2 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-1, 110) + ' 23:59:59') THEN 'Batch-3 Day-2'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 00:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 11:59:59') THEN 'Batch-1 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 12:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 16:59:59') THEN 'Batch-2 Day-3'
                  WHEN so.OrderDate >= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 17:00:00') 
                       AND so.OrderDate <= CONVERT(datetime, CONVERT(nvarchar, GETDATE()-2, 110) + ' 23:59:59') THEN 'Batch-3 Day-3'
                  ELSE 'Out Of Range'
                END AS Batch,
                CASE 
                    WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 59 THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi],
                so.FulfilledByFlexo
            FROM 
                Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE 
                so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
                AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
                )
                AND so.FulfilledByFlexo <> '0'
        ),
        DuplicateCTE AS (
            SELECT ORDNUM, ORDLIN, COUNT(*) AS jumlah
            FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG
            GROUP BY ORDNUM, ORDLIN
            HAVING COUNT(*) > 1
        )
        SELECT 
            COUNT(*) as total_orders,
            COUNT(DISTINCT so.SystemRefId) as unique_orders,
            COUNT(CASE WHEN od.ordnum IS NOT NULL THEN 1 END) as interfaced_orders,
            COUNT(CASE WHEN lseg.ordqty = ol.ordqty THEN 1 END) as matched_lines,
            COUNT(CASE WHEN lseg.ORDNUM IS NULL THEN 1 END) as pending_lines,
            COUNT(CASE WHEN lseg.ordqty <> ol.ordqty AND od.ordnum IS NULL THEN 1 END) as not_matched_lines,
            COUNT(CASE WHEN sku.prtnum IS NULL AND lseg.PRTNUM IS NOT NULL THEN 1 END) as invalid_sku_count,
            COUNT(CASE WHEN dup.ORDNUM IS NOT NULL THEN 1 END) as duplicate_count
        FROM SalesOrderCTE so
        LEFT JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] lseg WITH(NOLOCK) ON so.SystemRefId = lseg.ORDNUM
        LEFT JOIN [WMSPROD].[dbo].ord_line ol WITH(NOLOCK)
            ON lseg.ordnum = ol.ordnum 
            AND lseg.ordlin = ol.ordlin 
            AND lseg.ordsln = ol.ordsln 
            AND lseg.prtnum = ol.prtnum
        LEFT JOIN [WMSPROD].[dbo].ord od WITH(NOLOCK) ON lseg.ordnum = od.ordnum
        LEFT JOIN [WMSPROD].[dbo].prtmst sku WITH(NOLOCK)
            ON lseg.prtnum = sku.prtnum AND sku.wh_id_tmpl = 'WMD1'
        LEFT JOIN DuplicateCTE dup ON lseg.ORDNUM = dup.ORDNUM AND lseg.ORDLIN = dup.ORDLIN
        """
        
        cursor.execute(summary_query)
        summary_row = cursor.fetchone()
        
        # Get merchant distribution
        merchant_query = """
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                    WHEN MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                    ELSE MerchantName
                END AS MerchantName,
                so.SystemRefId
            FROM 
                Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE 
                so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE))
                AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
                )
                AND so.FulfilledByFlexo <> '0'
        )
        SELECT 
            MerchantName,
            COUNT(DISTINCT SystemRefId) as order_count
        FROM SalesOrderCTE
        GROUP BY MerchantName
        ORDER BY order_count DESC
        """
        
        cursor.execute(merchant_query)
        merchant_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'summary': {
                'total_orders': summary_row[0],
                'unique_orders': summary_row[1],
                'interfaced_orders': summary_row[2],
                'matched_lines': summary_row[3],
                'pending_lines': summary_row[4],
                'not_matched_lines': summary_row[5],
                'invalid_sku_count': summary_row[6],
                'duplicate_count': summary_row[7]
            },
            'merchant_distribution': [
                {'merchant': row[0], 'count': row[1]} for row in merchant_data
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@query_bp.route('/refreshdb/search', methods=['POST'])
@jwt_required()
def search_refreshdb():
    """Search orders in vw_sweeping view"""
    try:
        data = request.get_json()
        search_term = data.get('search_term', '').strip()
        
        if not search_term:
            return jsonify({
                'status': 'error',
                'error': 'Search term is required'
            }), 400
        
        # Database configuration for Flexo_db
        server = os.getenv('DB2_SERVER', '10.6.0.6\\newjda')
        database = os.getenv('DB2_NAME', 'Flexo_db')
        username = os.getenv('DB2_USERNAME', 'fservice')
        password = os.getenv('DB2_PASSWORD', 'SophieHappy33')
        
        try:
            # Create connection to SQL Server
            connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
            print(f"Attempting to connect to: {server}")
            conn = pyodbc.connect(connection_string, timeout=10)
            print("Database connection successful")
            cursor = conn.cursor()
            
            # Get search type from request
            search_type = data.get('search_type', 'entityid').lower()
            
            # Split search terms by comma and newline, then clean them
            # First split by newlines, then by commas
            all_terms = []
            for line in search_term.split('\n'):
                line_terms = [term.strip() for term in line.split(',') if term.strip()]
                all_terms.extend(line_terms)
            
            # Remove duplicates and empty terms
            search_terms = list(set([term for term in all_terms if term.strip()]))
            
            if not search_terms:
                return jsonify({
                    'status': 'error',
                    'error': 'Search term is required'
                }), 400
            
            # Validate search terms (allow common characters in order IDs)
            import re
            invalid_terms = []
            for term in search_terms:
                # Allow alphanumeric, hyphens, underscores, dots, forward slashes, ampersand, and spaces
                if not re.match(r'^[a-zA-Z0-9\-_\.\/&\s]+$', term):
                    invalid_terms.append(term)
            
            if invalid_terms:
                return jsonify({
                    'status': 'error',
                    'error': f'Invalid search terms found: {invalid_terms[:5]}. Only alphanumeric characters, hyphens, underscores, dots, forward slashes, ampersand, and spaces are allowed.'
                }), 400
            
            # Check if number of search terms exceeds limit
            MAX_SEARCH_TERMS = 100
            if len(search_terms) > MAX_SEARCH_TERMS:
                return jsonify({
                    'status': 'error',
                    'error': f'Too many search terms. Maximum allowed is {MAX_SEARCH_TERMS}, but you provided {len(search_terms)}. Please reduce the number of search terms.'
                }), 400
            
            # Additional validation for 'all' search type
            if search_type == 'all' and len(search_terms) > 25:
                return jsonify({
                    'status': 'error',
                    'error': f'For "All Fields" search, maximum allowed is 25 terms due to query complexity. You provided {len(search_terms)} terms.'
                }), 400
            
            # Create placeholders for IN clause
            placeholders = ','.join(['?' for _ in search_terms])
            
            # Build query based on search type
            if search_type == 'entityid':
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE EntityId IN ({placeholders})
                ORDER BY OrderDate DESC
                """
                # Query will be executed in the try block below
            elif search_type == 'systemrefid':
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE SystemRefId IN ({placeholders})
                ORDER BY OrderDate DESC
                """
                # Query will be executed in the try block below
            elif search_type == 'origsystemrefid':
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE OrigSystemRefId IN ({placeholders})
                ORDER BY OrderDate DESC
                """
                # Query will be executed in the try block below
            elif search_type == 'awb':
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE Awb IN ({placeholders})
                ORDER BY OrderDate DESC
                """
                cursor.execute(query, search_terms)
            elif search_type == 'all':
                # For 'all' search, we need to create separate placeholders for each field
                all_placeholders = ','.join(['?' for _ in search_terms])
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE EntityId IN ({all_placeholders})
                   OR OrigSystemRefId IN ({all_placeholders})
                   OR SystemRefId IN ({all_placeholders})
                   OR Awb IN ({all_placeholders})
                ORDER BY OrderDate DESC
                """
                # Create parameters list with search_terms repeated 4 times
                all_params = search_terms * 4
                print(f"All search - Number of parameters: {len(all_params)}")
                # Query will be executed in the try block below
            else:
                # Default to entityid search
                query = f"""
                SELECT TOP 100 
                    EntityId,
                    OrigSystemRefId,
                    SystemRefId,
                    OrderDate,
                    Orderstatus,
                    WhLoc,
                    Ordnum,
                    [Status JDA],
                    Brand,
                    Adddte,
                    [Refresh time],
                    [Cek Order],
                    Status,
                    Order_type,
                    Deadline,
                    [Now],
                    AWBLive,
                    Manifest,
                    Awb
                FROM vw_sweeping 
                WHERE EntityId IN ({placeholders})
                ORDER BY OrderDate DESC
                """
                # Query will be executed in the try block below
            
            print(f"Executing query with search type: {search_type}")
            print(f"Number of search terms: {len(search_terms)}")
            print(f"First few terms: {search_terms[:5]}")
            print(f"Query: {query}")
            
            try:
                # Execute query based on search type
                if search_type == 'all':
                    cursor.execute(query, all_params)
                else:
                    cursor.execute(query, search_terms)
                
                # Get column names
                columns = [column[0] for column in cursor.description]
                print(f"Query returned columns: {columns}")
            except Exception as query_error:
                print(f"Query execution error: {str(query_error)}")
                import traceback
                traceback.print_exc()
                return jsonify({
                    'status': 'error',
                    'error': 'Query execution failed',
                    'details': str(query_error)
                }), 500
            
            # Fetch all rows
            rows = cursor.fetchall()
            print(f"Query returned {len(rows)} rows")
            
            # Convert rows to dictionaries
            results = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    # Convert datetime to string if needed
                    if hasattr(value, 'strftime'):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    row_dict[columns[i]] = value
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': results,
                'total': len(results)
            }), 200
            
        except pyodbc.Error as db_error:
            print(f"Database error: {str(db_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'error': 'Database connection failed',
                'details': str(db_error)
            }), 500
        
    except Exception as e:
        print(f"Error in search_refreshdb: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'error': 'Gagal mencari data',
            'details': str(e)
        }), 500

@query_bp.route('/refreshdb/test-connection', methods=['GET'])
@jwt_required()
def test_refreshdb_connection():
    """Test database connection for RefreshDB"""
    try:
        # Database configuration for Flexo_db
        server = os.getenv('DB2_SERVER', '10.6.0.6\\newjda')
        database = os.getenv('DB2_NAME', 'Flexo_db')
        username = os.getenv('DB2_USERNAME', 'fservice')
        password = os.getenv('DB2_PASSWORD', 'SophieHappy33')
        
        # Create connection to SQL Server
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        print(f"Testing connection to: {server}")
        conn = pyodbc.connect(connection_string, timeout=10)
        print("Test connection successful")
        
        cursor = conn.cursor()
        
        # Test simple query
        cursor.execute("SELECT TOP 1 * FROM vw_sweeping")
        row = cursor.fetchone()
        
        if row:
            print("Test query successful")
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'success',
                'message': 'Database connection and query test successful'
            }), 200
        else:
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'warning',
                'message': 'Database connected but no data found in vw_sweeping'
            }), 200
        conn.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'server': server,
            'database': database,
            'has_data': row is not None
        }), 200
        
    except Exception as e:
        print(f"Test connection error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Database connection failed',
            'details': str(e)
        }), 500

@query_bp.route('/monitoring-order-test', methods=['GET'])
def get_monitoring_order_data_test():
    """Test endpoint for monitoring order data without authentication"""
    return get_monitoring_order_data_internal()

@query_bp.route('/monitoring-order', methods=['GET'])
@jwt_required()
def get_monitoring_order_data():
    """Get monitoring order data for visualization dashboard with pagination and compression"""
    return get_monitoring_order_data_internal()

def get_monitoring_order_data_internal():
    """Internal function for monitoring order data"""
    try:
        # Get filter parameters from query string
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')
        brand = request.args.get('brand', '')
        marketplace = request.args.get('marketplace', '')
        
        # Get pagination parameters with reasonable defaults for network performance
        # Reduce default per_page for Linux to improve initial load time
        import platform
        system = platform.system()
        default_per_page = 2000 if system == "Linux" else 5000
        default_limit = 30000 if system == "Linux" else 50000
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', default_per_page, type=int)
        limit = request.args.get('limit', default_limit, type=int)
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 50000:
            per_page = 5000
        if limit < 1 or limit > 200000:
            limit = 50000
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
        
        if use_sqlite_for_testing:
            # Mock data for testing
            mock_data = [
                {
                    'MARKETPLACE': 'SHOPEE',
                    'Brand': 'FACETOLOGY',
                    'SystemRefId': 'SO001',
                    'OrderDate': '2024-01-16T10:30:00',
                    'ORDER STATUS': 'READY_TO_SHIP',
                    'Status_Interfaced': 'Yes',
                    'Status_Durasi': 'Lebih Dari 1 jam'
                },
                {
                    'MARKETPLACE': 'LAZADA',
                    'Brand': 'SOMEBYMI',
                    'SystemRefId': 'SO002',
                    'OrderDate': '2024-01-16T11:15:00',
                    'ORDER STATUS': 'PENDING VERIFIKASI',
                    'Status_Interfaced': 'No',
                    'Status_Durasi': 'Kurang Dari 1 jam'
                }
            ]
            
            # Add more mock data
            import random
            marketplaces = ['SHOPEE', 'LAZADA', 'TOKOPEDIA', 'BLIBLI', 'TIKTOK', 'SHOPIFY', 'ZALORA', 'JUBELIO', 'UPLOAD', 'DESTY', 'GINEE']
            brands = ['FACETOLOGY', 'SOMEBYMI', 'ESQA', 'KIVA', 'SOMBONG', 'NACIFIC', 'CETAPHIL', 'INNISFREE', 'MOTHERLOVE', 'DEOXIDE', 'TAG', 'SEOLMI', 'REI SKIN', 'AMAN MAJU NUSANTARA', 'CENTRAL MEDIKA SEHAT', 'OREGT', 'PURESIA', 'SAFFNCO', 'ISWHITE', 'ELVICTO', 'POME', 'LUXCRIME', 'SKIN GAME', 'HISTOIRE', 'ESQA2BCON', 'GLOBAL MEDIKA SEHAT', 'DETOSLIM', 'MUSTELA', 'RAECCA', 'SKIN1004', 'BRIGHTY', 'FACETOLOGY ODOO', 'OREMT', 'LUXCRIME2B2B', 'RAHASIA BEAUTY', 'SECONDATE', 'PERFECT WHITE', 'PRECIOUS SKIN', 'BUTTERED', 'AVOSKIN', 'MOTHER OF PEARL', 'FINALLY FOUND YOU', 'ELSHEKIN', 'VITMAKER', 'NURILAB', 'GLOOWNBE', 'BEAUTETOX', 'DRTEALS', 'NACIFICSKIN', 'HAIRMONY', 'KEWPIE', 'ELVICTO PARFUME', 'RUHEE DIARY', 'MRKT', 'SOLARTECH', 'TENTANG ANAK', 'KYND', 'MOLAGI', 'DENISE CHARISTA', 'ATOPALM', 'ESQAWATSON', 'REEDERMA', 'EUNYUL', 'DEARDOER', 'NIUZ', 'SUNTORYSTORE', 'KAYARU', 'GREECHEF', 'SUNTORYBRAND', 'ISELECT']
            
            for i in range(50):
                mock_data.append({
                    'MARKETPLACE': random.choice(marketplaces),
                    'Brand': random.choice(brands),
                    'SystemRefId': f'SO{str(i + 3).zfill(3)}',
                    'OrderDate': datetime.now().replace(hour=random.randint(0, 23), minute=random.randint(0, 59)).isoformat(),
                    'ORDER STATUS': 'PENDING VERIFIKASI' if random.random() > 0.8 else 'READY_TO_SHIP',
                    'Status_Interfaced': 'Yes' if random.random() > 0.3 else 'No',
                    'Status_Durasi': 'Lebih Dari 1 jam' if random.random() > 0.5 else 'Kurang Dari 1 jam'
                })
            
            # Apply filters to mock data
            if start_date or end_date or brand or marketplace:
                filtered_data = []
                for item in mock_data:
                    # Date filter
                    if start_date and end_date:
                        item_date = datetime.fromisoformat(item['OrderDate'].replace('Z', '+00:00'))
                        start_dt = datetime.fromisoformat(start_date.replace('T', ' '))
                        end_dt = datetime.fromisoformat(end_date.replace('T', ' '))
                        if not (start_dt <= item_date <= end_dt):
                            continue
                    
                    # Brand filter
                    if brand and item['Brand'] != brand:
                        continue
                    
                    # Marketplace filter
                    if marketplace and item['MARKETPLACE'] != marketplace:
                        continue
                    
                    filtered_data.append(item)
                mock_data = filtered_data
            
            return jsonify({
                'status': 'success',
                'data': mock_data,
                'total': len(mock_data),
                'data_source': 'mock_data'
            }), 200
        
        else:
            # Create connection to SQL Server with timeout and network optimizations
            # Mars_Connection=yes helps with network issues and packet duplicates
            # Increase timeout for Linux due to potential network latency
            connection_timeout = 90 if system == "Linux" else 55
            
            try:
                connection_string = create_sql_server_connection_string(
                    server, database, username, password, timeout=connection_timeout, mars_connection=True
                )
                conn = pyodbc.connect(connection_string)
            except Exception as driver_error:
                print(f"ODBC Driver error: {str(driver_error)}")
                return jsonify({
                    'status': 'error',
                    'error': 'Database connection failed',
                    'message': str(driver_error),
                    'details': 'ODBC Driver untuk SQL Server tidak ditemukan. Silakan install ODBC Driver 17 for SQL Server.'
                }), 500
            cursor = conn.cursor()
            
            # Build WHERE clause based on filters
            where_conditions = []
            params = []
            
            # Date filter - replace hardcoded filter with dynamic one
            if start_date and end_date:
                # Convert ISO datetime strings to SQL Server datetime format
                try:
                    # Parse ISO datetime and convert to SQL Server format
                    from datetime import datetime
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    
                    # Format for SQL Server
                    start_sql = start_dt.strftime('%Y-%m-%d %H:%M:%S')
                    end_sql = end_dt.strftime('%Y-%m-%d %H:%M:%S')
                    
                    print(f"Filtering by date range: {start_sql} to {end_sql}")
                    where_conditions.append("so.OrderDate >= ? AND so.OrderDate <= ?")
                    params.extend([start_sql, end_sql])
                except Exception as date_error:
                    print(f"Date parsing error: {date_error}")
                    # Fallback to default date range
                    where_conditions.append("so.OrderDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))")
            else:
                # Default to last 7 days if no date filter provided
                print("No date filter provided, using default range")
                where_conditions.append("so.OrderDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))")
            
            # Brand filter
            if brand:
                print(f"Filtering by brand: {brand}")
                where_conditions.append("so.MerchantName = ?")
                params.append(brand)
            
            # Marketplace filter
            if marketplace:
                print(f"Filtering by marketplace: {marketplace}")
                where_conditions.append("so.SystemId = ?")
                params.append(marketplace)
            
            # Add existing status filter
            where_conditions.append("LOWER(ISNULL(so.OrderStatus, '')) NOT IN ('cancelled', 'cancellations', 'canceled', 'confirmed', 'to_confirm_receive', 'to_return', 'returned', 'cancel', 'unpaid', 'matched', 'pending_payment','pending','expired')")
            
            where_clause = " AND ".join(where_conditions)
            
            # Get total count first for pagination info - optimized: remove unnecessary LEFT JOIN
            count_query = f"""
            SELECT COUNT(DISTINCT so.SystemRefId) as total_count
            FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE {where_clause}
            AND so.FulfilledByFlexo <> '0'
            """
            
            # Execute count query
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # For dashboard, limit maximum per_page to prevent timeout
            # Linux: max 20k per page (increased from 10k for better data coverage)
            # Windows: max 50k per page
            max_per_page = 20000 if system == "Linux" else 50000
            
            # Don't fetch all data at once, use pagination with reasonable limits
            if per_page > max_per_page:
                per_page = max_per_page
            
            # Calculate total pages based on limited per_page
            if total_count > limit:
                total_count = limit
            
            total_pages = (total_count + per_page - 1) // per_page
            
            # Ensure offset is within bounds
            if offset >= total_count:
                offset = 0
                # Use pagination for very large datasets
                if total_count > limit:
                    total_count = limit
                
                # Calculate total pages
                total_pages = (total_count + per_page - 1) // per_page
                
                # Ensure offset is within bounds
                if offset >= total_count:
                    offset = 0
            
            # Execute the optimized monitoring order query with pagination
            monitoring_order_query = f"""
            SELECT
                CASE 
                    WHEN so.SystemId ='MPSH' THEN 'Shopee'
                    WHEN so.SystemId ='MSTP' THEN 'Tokopedia'
                    WHEN so.SystemId = 'GCOOP' THEN 'GCOOP'
                    WHEN so.SystemId = 'Jubelio' THEN 'Jubelio'
                    WHEN so.SystemId = 'MPJD' THEN 'JD.ID'
                    WHEN so.SystemId = 'MPLZ' THEN 'Lazada'
                    WHEN so.SystemId = 'Other' THEN 'Other'
                    WHEN so.SystemId = 'SS' THEN 'Sistersel'
                    WHEN so.SystemId = 'MPBI' THEN 'Blibli'
                    WHEN so.SystemId = 'GDTech' THEN 'GDTech'
                    WHEN so.SystemId = 'MPTS' THEN 'Tiktok'
                    WHEN so.SystemId = 'SHPY' THEN 'Shopify'
                    WHEN so.SystemId = 'MPZR' THEN 'ZALORA'
                    WHEN so.SystemId = 'MPUP' THEN 'CMS FLEXO'
                    WHEN so.SystemId = 'MPGN' THEN 'GINEE'
                    WHEN so.SystemId = 'MPDS' THEN 'DESTY'
                    ELSE 'New Channel'
                END AS MARKETPLACE,
                CASE 
                    WHEN so.MerchantName = 'FACETOLOGY' THEN 'FACETOLOGY'
                    WHEN so.MerchantName = 'OSF' THEN 'OSF'
                    WHEN so.MerchantName = 'SOMEBYMI' THEN 'SOMEBYMI'
                    WHEN so.MerchantName = 'KIVA' THEN 'KIVA'
                    WHEN so.MerchantName = 'EBLO-INTERBAT' THEN 'INTERBAT'
                    WHEN so.MerchantName = 'FILMORE' THEN 'FILMORE'
                    WHEN so.MerchantName = 'SCORA' THEN 'SCORA'
                    WHEN so.MerchantName = 'EBLO-MOTHERLOVE' THEN 'MOTHERLOVE'
                    WHEN so.MerchantName = 'DEOXIDE' THEN 'DEOXIDE'
                    WHEN so.MerchantName = 'SOMBONG' THEN 'SOMBONG'
                    WHEN so.MerchantName = 'ESQA' THEN 'ESQA'
                    WHEN so.MerchantName = 'NUTRA HERBAL' THEN 'NUTRA HERBAL'
                    WHEN so.MerchantName = 'TAG' THEN 'TAG'
                    WHEN so.MerchantName = 'SEOLMI' THEN 'SEOLMI'
                    WHEN so.MerchantName = 'REI SKIN' THEN 'REI SKIN'
                    WHEN so.MerchantName = 'AMAN MAJU NUSANTARA' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'CENTRAL MEDIKA SEHAT' THEN 'CENTRAL MEDIKA SEHAT'
                    WHEN so.MerchantName = 'OREGT' THEN 'OREGT'
                    WHEN so.MerchantName = 'PURESIA' THEN 'PURESIA'
                    WHEN so.MerchantName = 'NACIFIC' THEN 'NACIFIC'
                    WHEN so.MerchantName = 'SAFFNCO' THEN 'SAFFNCO'
                    WHEN so.MerchantName = 'EBLO-CETAPHIL' THEN 'CETAPHIL'
                    WHEN so.MerchantName = 'ISWHITE' THEN 'ISWHITE'
                    WHEN so.MerchantName = 'ELVICTO' THEN 'ELVICTO'
                    WHEN so.MerchantName = 'POME' THEN 'POME'
                    WHEN so.MerchantName = 'LUXCRIME ID' THEN 'LUXCRIME'
                    WHEN so.MerchantName = 'SKIN GAME' THEN 'SKIN GAME'
                    WHEN so.MerchantName = 'SOMBONG OFFICIAL STORE' THEN 'SOMBONG'
                    WHEN so.MerchantName = 'SKIN GAME OFFICIAL SHOP' THEN 'SKIN GAME'
                    WHEN so.MerchantName = 'HISTOIRE NATURELLE OFFICIAL STORE' THEN 'HISTOIRE'
                    WHEN so.MerchantName = 'SOMBONG MENS CARE' THEN 'SOMBONG'
                    WHEN so.MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                    WHEN so.MerchantName = 'ESQA2BCON' THEN 'ESQA2BCON'
                    WHEN so.MerchantName = 'ESQA2B2B' THEN 'ESQA2BCON'
                    WHEN so.MerchantName = 'SH680AFFA3CF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680AFFCF5F1503000192BEFF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH683034454CEDF000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName IS NULL THEN 'UNDEFINED'
                    WHEN so.MerchantName = 'CMS' THEN 'CMS'
                    WHEN so.MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A60EB5F1503000192B48B' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A5DBE21B84000148473F3' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A742E21B840001E630F' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'GLOBAL MEDIKA SEHAT' THEN 'GLOBAL MEDIKA SEHAT'
                    WHEN so.MerchantName = 'DETOSLIM' THEN 'DETOSLIM'
                    WHEN so.MerchantName = 'HISTOIRE NATURELLE INDONESIA' THEN 'HISTOIRE'
                    WHEN so.MerchantName = 'EBLO-MUSTELA' THEN 'MUSTELA'
                    WHEN so.MerchantName = 'EBLO-CETAPHIL-2' THEN 'CETAPHIL'
                    WHEN so.MerchantName = 'EBLO-INNISFREE' THEN 'INNISFREE'
                    WHEN so.MerchantName = 'RAECCA' THEN 'RAECCA'
                    WHEN so.MerchantName = 'SKIN1004' THEN 'SKIN1004'
                    WHEN so.MerchantName = 'BRIGHTY' THEN 'BRIGHTY'
                    WHEN so.MerchantName = 'FACETOLOGYODOO' THEN 'FACETOLOGY ODOO'
                    WHEN so.MerchantName = 'OREMT' THEN 'OREMT'
                    WHEN so.MerchantName = 'LUXCRIME2B2B' THEN 'LUXCRIME2B2B'
                    WHEN so.MerchantName = 'RAHASIA BEAUTY' THEN 'RAHASIA BEAUTY'
                    WHEN so.MerchantName = 'SECONDATE' THEN 'SECONDATE'
                    WHEN so.MerchantName = 'PERFECT WHITE' THEN 'PERFECT WHITE'
                    WHEN so.MerchantName = 'PRECIOUS SKIN' THEN 'PRECIOUS SKIN'
                    WHEN so.MerchantName = 'BUTTERED' THEN 'BUTTERED'
                    WHEN so.MerchantName = 'AVOSKIN' THEN 'AVOSKIN'
                    WHEN so.MerchantName = 'MOTHER OF PEARL' THEN 'MOTHER OF PEARL'
                    WHEN so.MerchantName = 'FINALLY FOUND YOU' THEN 'FINALLY FOUND YOU'
                    WHEN so.MerchantName = 'ELSHEKIN' THEN 'ELSHEKIN'
                    WHEN so.MerchantName = 'VITMAKER' THEN 'VITMAKER'
                    WHEN so.MerchantName = 'NURILAB' THEN 'NURILAB'
                    WHEN so.MerchantName = 'GLOOWNBE' THEN 'GLOOWNBE'
                    WHEN so.MerchantName = 'SOMEBYMI OFFICIAL' THEN 'SOMEBYMI'
                    WHEN so.MerchantName = 'BEAUTETOX' THEN 'BEAUTETOX'
                    WHEN so.MerchantName = 'EBLO-DRTEALS' THEN 'DRTEALS'
                    WHEN so.MerchantName = 'NACIFICSKIN' THEN 'NACIFICSKIN'
                    WHEN so.MerchantName = 'HAIRMONY' THEN 'HAIRMONY'
                    WHEN so.MerchantName = 'KEWPIE' THEN 'KEWPIE'
                    WHEN so.MerchantName = 'ELVICTO_PARFUME' THEN 'ELVICTO PARFUME'
                    WHEN so.MerchantName = 'RUHEE DIARY' THEN 'RUHEE DIARY'
                    WHEN so.MerchantName = 'EBLO-CETAPHIL-TTS' THEN 'CETAPHIL'
                    WHEN so.MerchantName = 'SH682709144CEDF0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'EBLO-INNISFREE-TTS' THEN 'INNISFREE'
                    WHEN so.MerchantName = 'RAECCA' THEN 'RAECCA'
                    WHEN so.MerchantName = 'MRKT' THEN 'MRKT'
                    WHEN so.MerchantName = 'ESQA SHOPEE' THEN 'ESQA'
                    WHEN so.MerchantName = 'MOTHER OF PEARL SHOPIFY' THEN 'MOTHER OF PEARL'
                    WHEN so.MerchantName = 'SOLARTECH' THEN 'SOLARTECH'
                    WHEN so.MerchantName = 'TENTANG ANAK B2B' THEN 'TENTANG ANAK'
                    WHEN so.MerchantName = 'KYNDBEAUTY-TTS' THEN 'KYND'
                    WHEN so.MerchantName = 'MOLAGI' THEN 'MOLAGI'
                    WHEN so.MerchantName = 'EBLO-MOLAGI' THEN 'MOLAGI'
                    WHEN so.MerchantName = 'DENISE CHARISTA' THEN 'DENISE CHARISTA'
                    WHEN so.MerchantName = 'EBLO-ATOPALM' THEN 'ATOPALM'
                    WHEN so.MerchantName = 'ESQAWATSON' THEN 'ESQAWATSON'
                    WHEN so.MerchantName = 'EBLO-TAG' THEN 'TAG'
                    WHEN so.MerchantName = 'REEDERMA LAZADA' THEN 'REEDERMA'
                    WHEN so.MerchantName = 'EBLO-EUNYUL' THEN 'EUNYUL'
                    WHEN so.MerchantName = 'EBLO-DEARDOER' THEN 'DEARDOER'
                    WHEN so.MerchantName = 'NIUZ' THEN 'NIUZ'
                    WHEN so.MerchantName = 'SUNTORYSTORE' THEN 'SUNTORYSTORE'
                    WHEN so.MerchantName = 'KAYARU' THEN 'KAYARU'
                    WHEN so.MerchantName = 'GREENCHEF' THEN 'GREECHEF'
                    WHEN so.MerchantName = 'SH680A67A2E21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                    WHEN so.MerchantName = 'SUNTORYBRAND' THEN 'SUNTORYBRAND'
                    WHEN so.MerchantName = 'EBLO-ISELECT' THEN 'ISELECT'
                    WHEN so.MerchantName = 'EBLO-CETAPHIL-TTS' THEN 'CETAPHIL'
                    WHEN so.MerchantName = 'FILMORE-TTS' THEN 'FILMORE'
                    WHEN so.MerchantName = 'EBLO-INNISFREE-TTS' THEN 'INNISFREE'
                    WHEN so.MerchantName = 'MRKT' THEN 'MRKT'
                    WHEN so.MerchantName = 'ESQA SHOPEE' THEN 'ESQA'
                    WHEN so.MerchantName = 'MOTHER OF PEARL SHOPIFY' THEN 'MOTHER OF PEARL'
                    WHEN so.MerchantName = 'SOLARTECH' THEN 'SOLARTECH'
                    WHEN so.MerchantName = 'TENTANG ANAK B2B' THEN 'TENTANG ANAK'
                    WHEN so.MerchantName = 'KYNDBEAUTY-TTS' THEN 'KYND'
                    WHEN so.MerchantName = 'MOLAGI' THEN 'MOLAGI'
                    ELSE so.MerchantName
                END AS Brand,
                so.SystemRefId,
                so.OrderDate,
                CASE 
                    WHEN so.SystemId = 'MPSH'
                     AND so.OrderedById = 'LOGISTICS_NOT_START'
                     AND so.OrderStatus = 'READY_TO_SHIP'
                    THEN 'PENDING VERIFIKASI'
                    ELSE so.OrderStatus
                END AS [ORDER STATUS],
                CASE 
                    WHEN ol.ordnum IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS [Status_Interfaced],
                CASE 
                    WHEN so.OrderDate < DATEADD(MINUTE, -59, GETDATE())
                    THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi]
            FROM Flexo_Db.dbo.SalesOrder so WITH (NOLOCK)
            LEFT JOIN (
                SELECT DISTINCT ordnum
                FROM WMSPROD.dbo.ord_line WITH (NOLOCK)
            ) ol
                ON ol.ordnum = so.SystemRefId
            WHERE {where_clause}
              AND so.FulfilledByFlexo <> '0'
            ORDER BY so.OrderDate DESC
            OFFSET {offset} ROWS 
            FETCH NEXT {per_page} ROWS ONLY
            """
            
            # Note: pyodbc doesn't support cursor.timeout attribute
            # Query timeout is handled via connection timeout and query execution
            # Connection timeout is already set in connection_string
            query_timeout = 85 if system == "Linux" else 50
            
            try:
                import time
                import pyodbc as pyodbc_module
                print(f"Executing query with params: {params}")
                print(f"Offset: {offset}, Per Page: {per_page}")
                print(f"Query timeout: {query_timeout}s (informational), Connection timeout: {connection_timeout}s (Platform: {system})")
                print(f"pyodbc version: {pyodbc_module.version}")
                print(f"Python version: {__import__('sys').version}")
                
                start_time = time.time()
                # Execute query - timeout is handled by connection timeout and query complexity
                cursor.execute(monitoring_order_query, params)
                query_execution_time = time.time() - start_time
                print(f"Query execution time: {query_execution_time:.2f} seconds")
            except Exception as query_error:
                print(f"Query execution error: {str(query_error)}")
                print(f"Query: {monitoring_order_query}")
                print(f"Params: {params}")
                raise query_error
            
            # Get column names
            columns = [column[0] for column in cursor.description]
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries with optimized data types
            results = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    # Convert datetime to string if needed
                    if hasattr(value, 'strftime'):
                        value = value.strftime('%Y-%m-%d %H:%M:%S')
                    # Optimize data types for compression
                    elif value is None:
                        value = None
                    elif isinstance(value, (int, float)):
                        # Keep numbers as is for better compression
                        pass
                    elif isinstance(value, str):
                        # Truncate very long strings to save bandwidth
                        if len(value) > 1000:
                            value = value[:1000] + '...'
                    row_dict[columns[i]] = value
                results.append(row_dict)
            
            cursor.close()
            conn.close()
            
            print(f"Monitoring Order API: {len(results)} records returned (Page {page}/{total_pages})")
            print(f"Total count: {total_count}, Per page: {per_page}, Offset: {offset}")
            if results:
                print(f"Sample record: {results[0]}")
                print(f"Available fields: {list(results[0].keys())}")
                # Check for Brand and MARKETPLACE fields
                brand_count = sum(1 for r in results if r.get('Brand'))
                marketplace_count = sum(1 for r in results if r.get('MARKETPLACE'))
                print(f"Records with Brand: {brand_count}")
                print(f"Records with MARKETPLACE: {marketplace_count}")
                
                # Check date range of returned data
                if results:
                    dates = [r.get('OrderDate') for r in results if r.get('OrderDate')]
                    if dates:
                        print(f"Date range in results: {min(dates)} to {max(dates)}")
            
            # Create response with pagination info
            response_data = {
                'status': 'success',
                'data': results,
                'data_source': 'sql_server',  # Always indicate real SQL Server data
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                },
                'filters': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'brand': brand,
                    'marketplace': marketplace
                },
                'performance': {
                    'records_returned': len(results),
                    'compression_enabled': True,
                    'query_optimized': True
                }
            }
            
            return jsonify(response_data), 200
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_monitoring_order_data: {str(e)}")
        print(f"Full traceback:\n{error_trace}")
        return jsonify({
            'status': 'error',
            'error': 'Gagal mengambil data monitoring order',
            'details': str(e),
            'error_type': type(e).__name__
        }), 500

@query_bp.route('/monitoring-unified', methods=['POST'])
@jwt_required()
def run_unified_monitoring_query():
    """Execute unified monitoring query with consistent filters for cards and charts"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or not data.get('system_ref_ids'):
            return jsonify({'error': 'SystemRefIds are required'}), 400
            
        # Get filters from request
        filters = data.get('filters', {})
        date_range = filters.get('dateRange', {})
        brand_filter = filters.get('brand')
        marketplace_filter = filters.get('marketplace')
        status_filter = filters.get('status', [])
        
        # Get list of SystemRefIds from request
        system_ref_ids = data.get('system_ref_ids', [])
        
        # Filter out empty values and create a comma separated list for SQL query
        filtered_ids = [id.strip() for id in system_ref_ids if id.strip()]
        
        if not filtered_ids:
            return jsonify({'error': 'No valid SystemRefIds provided'}), 400
            
        # Dapatkan koneksi dari modul Query
        try:
            # Load environment variables
            load_dotenv()
            
            # Get connection details from environment
            server = os.getenv('DB_SERVER')
            database = os.getenv('DB_NAME')
            username = os.getenv('DB_USERNAME')
            password = os.getenv('DB_PASSWORD')
            
            use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
            
            # Gunakan SQLite untuk testing jika dikonfigurasi demikian
            if use_sqlite_for_testing:
                # Ambil data dari SQLite tabel monitoring
                db_path = os.path.join(os.path.dirname(__file__), '../instance/app.db')
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                placeholders = ','.join(['?'] * len(filtered_ids))
                monitoring_query = f"SELECT *, remark FROM monitoring WHERE system_ref_id IN ({placeholders})"
                cursor.execute(monitoring_query, filtered_ids)
                results = [dict(row) for row in cursor.fetchall()]
                # Normalisasi field Remark (huruf besar)
                for row in results:
                    if 'remark' in row and 'Remark' not in row:
                        row['Remark'] = row['remark']
                    elif 'Remark' not in row:
                        # Ensure all rows have a Remark field, even if null
                        row['Remark'] = None
                    if 'system_ref_id' in row and 'SystemRefId' not in row:
                        row['SystemRefId'] = row['system_ref_id']
                cursor.close()
                conn.close()
            else:
                # Buat koneksi langsung ke SQL Server untuk menggunakan parameter query
                connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
                conn = pyodbc.connect(connection_string)
                cursor = conn.cursor()
                
                # Buat placeholder untuk parameter IN clause
                placeholders = ','.join(['?' for _ in filtered_ids])
                
                # Build WHERE clause with unified filters
                where_conditions = [f"so.SystemRefId IN ({placeholders})"]
                query_params = filtered_ids.copy()
                
                # Add date range filter
                if date_range.get('start_date') and date_range.get('end_date'):
                    where_conditions.append("so.OrderDate >= ? AND so.OrderDate <= ?")
                    query_params.extend([date_range['start_date'], date_range['end_date']])
                
                # Add brand filter
                if brand_filter:
                    where_conditions.append("so.MerchantName = ?")
                    query_params.append(brand_filter)
                
                # Add marketplace filter
                if marketplace_filter:
                    where_conditions.append("so.SystemId = ?")
                    query_params.append(marketplace_filter)
                
                # Add status filter (exclude cancelled, unpaid, pending_payment)
                if status_filter:
                    excluded_statuses = ['cancelled', 'unpaid', 'pending_payment']
                    status_conditions = []
                    for status in excluded_statuses:
                        status_conditions.append("so.OrderStatus != ?")
                        query_params.append(status)
                    if status_conditions:
                        where_conditions.append(f"({' AND '.join(status_conditions)})")
                
                # Construct the unified monitoring query
                monitoring_query = f"""
                SELECT
                    so.SystemId,
                    CASE 
                        WHEN MerchantName = 'SH680AFFCF5F1503000192BFEF' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH680AFFA3CFF47E0001ABE2F8' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH680A5D8BE21B8400014847F3' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH680A60EB5F1503000192A84B' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH683034454CEDFD000169A351' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH680A672AE21B8400014849A9' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH681AD742E21B840001E630EF' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH682709144CEDFD0001FA8810' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'SH680A67FDE21B8400014849AB' THEN 'AMAN MAJU NUSANTARA'
                        WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
                        WHEN MerchantName = 'LUXCRIME_ID' THEN 'LUXCRIME'
                        ELSE MerchantName
                    END AS MerchantName, 
                    so.SystemRefId,
                    so.OrderStatus,
                    so.Awb,
                    CASE 
                        WHEN COUNT(ol.ordnum) > 0 THEN 'Yes'
                        ELSE 'No'
                    END AS [Status_Interfaced],
                    CASE 
                        WHEN so.SystemId = 'MPSH' THEN 
                        CASE 
                        WHEN so.OrderedById = 'LOGISTICS_NOT_START' AND so.OrderStatus = 'READY_TO_SHIP' THEN 'Pending Verifikasi'
                        ELSE 'Follow Up!'
                    END
                        ELSE 'Follow Up!'
                    END AS [Status_SC],
                    CASE 
                        WHEN so.OrderDate >= CAST(CONVERT(varchar, GETDATE(), 23) + ' 00:00:00' AS DATETIME)
                        AND so.OrderDate <  CAST(CONVERT(varchar, GETDATE(), 23) + ' 17:00:01' AS DATETIME) THEN 'Batch 1'
                        WHEN so.OrderDate >= CAST(CONVERT(varchar, GETDATE(), 23) + ' 17:00:01' AS DATETIME)
                        AND so.OrderDate <= CAST(CONVERT(varchar, GETDATE(), 23) + ' 23:59:59' AS DATETIME) THEN 'Batch 2'
                        ELSE 'Out of Range'
                    END AS Batch,
                    CASE   
                        WHEN so.Origin = 1 
                            AND EXISTS (
                                SELECT 1 FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ol2
                                WHERE ol2.ordnum = so.SystemRefId
                                AND NOT EXISTS (
                                    SELECT 1 FROM WMSPROD.dbo.prtmst sku 
                                    WHERE sku.prtnum = ol2.prtnum
                                )
                            ) 
                        THEN 'Invalid SKU JDA'
                        WHEN so.Origin = 3 
                            AND EXISTS (
                                SELECT 1 FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ol2
                                WHERE ol2.ordnum = so.SystemRefId
                            ) 
                        THEN 'Invalid SKU JDA'
                        ELSE '' 
                    END AS Issue,
                    CASE
                        WHEN so.Origin = 1 AND EXISTS (
                            SELECT 1 
                            FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ol2
                            WHERE ol2.ordnum = so.SystemRefId
                            AND NOT EXISTS (
                                SELECT 1 
                                FROM WMSPROD.dbo.ord_line wms
                                WHERE wms.ordnum = ol2.ordnum
                                AND wms.ordlin = ol2.ordlin
                            )
                        ) THEN 'Cek'

                        WHEN so.Origin = 3 AND EXISTS (
                            SELECT 1 
                            FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ol2
                            WHERE ol2.ordnum = so.SystemRefId
                        ) THEN 'Cek'

                        ELSE ''
                    END AS [SKU Telat Masuk],
                    CASE 
                        WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 30 THEN 'Lebih Dari 1 jam'
                        ELSE 'Kurang Dari 1 jam'
                    END AS [Status_Durasi],
                    ISNULL(STUFF(( 
                        SELECT ', ' + ol2.prtnum 
                        FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ol2
                        WHERE ol2.ordnum = so.SystemRefId
                        FOR XML PATH(''), TYPE
                    ).value('(./text())[1]', 'NVARCHAR(MAX)'), 1, 2, ''), 'No Items') AS ItemIds,
                    so.OrderDate,
                    so.DtmCrt,
                    so.DeliveryMode,    
                    so.importlog,
                    so.FulfilledByFlexo,
                    MAX(ol.moddte) AS AddDate,  
                    CASE 
                        WHEN so.Origin = 1 OR so.Origin IS NULL THEN 'Flexofast-TGR'
                        WHEN so.Origin = 3 THEN 'Flexofast-SBY'
                        ELSE 'Unknown'
                    END AS Origin

                FROM Flexo_Db.dbo.SalesOrder so
                LEFT JOIN WMSPROD.dbo.ord_line ol 
                    ON ol.ordnum = so.SystemRefId

                WHERE {' AND '.join(where_conditions)}
                GROUP BY
                    so.SystemId, so.SystemRefId, so.MerchantName, so.OrderDate, so.DtmCrt, 
                    so.OrderStatus, so.Awb, so.DeliveryMode, so.Origin, so.ImportLog, so.FulfilledByFlexo, so.OrderedById
                """
                
                # Execute the query with parameters
                cursor.execute(monitoring_query, query_params)
                
                # Get column names
                columns = [column[0] for column in cursor.description]
                
                # Fetch all rows and convert to dictionaries
                results = []
                for row in cursor.fetchall():
                    row_dict = {}
                    for i, value in enumerate(row):
                        row_dict[columns[i]] = value
                    results.append(row_dict)
                
                cursor.close()
                conn.close()
            
            # Setelah results diisi (SQL Server), merge remark dari SQLite
            try:
                db_path = os.path.join(os.path.dirname(__file__), '../instance/app.db')
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                # Buat mapping SystemRefId -> Remark dari SQLite
                system_ref_ids = [row.get('SystemRefId') for row in results if row.get('SystemRefId')]
                if system_ref_ids:
                    placeholders = ','.join(['?'] * len(system_ref_ids))
                    cursor.execute(f"SELECT system_ref_id, remark FROM monitoring WHERE system_ref_id IN ({placeholders})", system_ref_ids)
                    remark_map = {row['system_ref_id']: row['remark'] for row in cursor.fetchall()}
                    for row in results:
                        sysid = row.get('SystemRefId')
                        if sysid in remark_map:
                            row['Remark'] = remark_map[sysid]
                        else:
                            # Ensure all rows have a Remark field, even if null
                            row['Remark'] = None
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"[WARNING] Gagal merge remark dari SQLite: {e}")
            
            # Calculate unified metrics for cards
            total_orders = len(results)
            interfaced_count = sum(1 for row in results if row.get('Status_Interfaced') == 'Yes')
            not_interfaced_count = sum(1 for row in results if row.get('Status_Interfaced') == 'No')
            pending_verification_count = sum(1 for row in results if row.get('Status_SC') == 'Pending Verifikasi')
            
            # Calculate hour-based metrics
            current_time = datetime.now()
            hour_minus_1 = current_time - timedelta(hours=1)
            hour_plus_1 = current_time + timedelta(hours=1)
            
            hour_minus_1_count = sum(1 for row in results 
                                   if row.get('OrderDate') and 
                                   datetime.fromisoformat(str(row['OrderDate']).replace('Z', '+00:00')) >= hour_minus_1)
            hour_plus_1_count = sum(1 for row in results 
                                  if row.get('OrderDate') and 
                                  datetime.fromisoformat(str(row['OrderDate']).replace('Z', '+00:00')) < hour_minus_1)
            
            # Calculate chart data
            # Top brands
            brand_counts = {}
            for row in results:
                brand = row.get('MerchantName', 'Unknown')
                brand_counts[brand] = brand_counts.get(brand, 0) + 1
            
            top_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:20]
            
            # Platform distribution
            platform_counts = {}
            for row in results:
                platform = row.get('SystemId', 'Unknown')
                platform_counts[platform] = platform_counts.get(platform, 0) + 1
            
            # Order evolution by hour
            hour_counts = {}
            for row in results:
                if row.get('OrderDate'):
                    try:
                        order_date = datetime.fromisoformat(str(row['OrderDate']).replace('Z', '+00:00'))
                        hour_key = order_date.strftime('%Y-%m-%d %H:00')
                        hour_counts[hour_key] = hour_counts.get(hour_key, 0) + 1
                    except:
                        continue
            
            # Sort hour counts by date
            order_evolution = sorted(hour_counts.items(), key=lambda x: x[0])
            
            # Prepare unified response
            response = {
                "status": "success",
                "data": {
                    "results": results,  # Full result set for table
                    "cards": {
                        "total_orders": total_orders,
                        "interfaced": interfaced_count,
                        "not_interfaced": not_interfaced_count,
                        "pending_verification": pending_verification_count,
                        "hour_minus_1": hour_minus_1_count,
                        "hour_plus_1": hour_plus_1_count
                    },
                    "charts": {
                        "top_brands": [{"name": brand, "value": count} for brand, count in top_brands],
                        "platform_distribution": [{"name": platform, "value": count} for platform, count in platform_counts.items()],
                        "order_evolution": [{"name": hour, "value": count} for hour, count in order_evolution]
                    },
                    "filters_applied": {
                        "dateRange": date_range,
                        "brand": brand_filter,
                        "marketplace": marketplace_filter,
                        "status": status_filter
                    },
                    "data_timestamp": current_time.isoformat()
                }
            }
            
            return jsonify(response), 200
            
        except pyodbc.Error as e:
            import traceback
            print("PYODBC ERROR:", str(e))
            print(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'error': 'Error database',
                'details': str(e)
            }), 400
        except Exception as e:
            import traceback
            print("GENERAL ERROR:", str(e))
            print(traceback.format_exc())
            return jsonify({
                'status': 'error',
                'error': 'Error executing monitoring query',
                'details': str(e)
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': 'Server error',
            'details': str(e)
        }), 500

# Additional monitoring endpoints for the 3 new grids

@query_bp.route('/late-sku', methods=['GET'])
@jwt_required()
def get_late_sku_data():
    """Get SKU Telat Masuk data"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
        
        if use_sqlite_for_testing:
            # Mock data for testing
            mock_data = [
                {'Client': 'FACETOLOGY', 'ORDNUM': 'ORD001', 'ORDLIN': '1', 'PRTNUM': 'SKU001', 'Interface': 'Yes', 'LineStatus': 'Match'},
                {'Client': 'SOMEBYMI', 'ORDNUM': 'ORD002', 'ORDLIN': '2', 'PRTNUM': 'SKU002', 'Interface': 'No', 'LineStatus': 'Not Match'},
                {'Client': 'FACETOLOGY', 'ORDNUM': 'ORD003', 'ORDLIN': '1', 'PRTNUM': 'SKU003', 'Interface': 'Yes', 'LineStatus': 'Match'},
                {'Client': 'ESQA', 'ORDNUM': 'ORD004', 'ORDLIN': '3', 'PRTNUM': 'SKU004', 'Interface': 'No', 'LineStatus': 'Not Match'},
                {'Client': 'KIVA', 'ORDNUM': 'ORD005', 'ORDLIN': '1', 'PRTNUM': 'SKU005', 'Interface': 'Yes', 'LineStatus': 'Match'}
            ]
            
            return jsonify({
                'status': 'success',
                'data': mock_data,
                'data_source': 'mock_data'
            }), 200
        
        else:
            # Create connection to SQL Server
            try:
                connection_string = create_sql_server_connection_string(
                    server, database, username, password, timeout=30
                )
                conn = pyodbc.connect(connection_string)
            except Exception as driver_error:
                print(f"ODBC Driver error in late-sku: {str(driver_error)}")
                return jsonify({
                    'status': 'error',
                    'error': 'Database connection failed',
                    'message': str(driver_error),
                    'details': 'ODBC Driver untuk SQL Server tidak ditemukan. Silakan install ODBC Driver 17 for SQL Server.'
                }), 500
            
            cursor = conn.cursor()
            
            # Execute the SKU Telat Masuk query
            query = """
            WITH XML_RANK AS (
                SELECT
                    x.ORDNUM,
                    x.PRTNUM,
                    x.ORDLIN,
                    x.ORDSLN,
                    ROW_NUMBER() OVER (
                        PARTITION BY x.ORDNUM, x.ORDLIN, x.ORDSLN, x.PRTNUM
                        ORDER BY x.ENTDTE DESC
                    ) AS rn
                FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG x
                WHERE EXISTS (
                    SELECT 1
                    FROM SPIDSTGJDANew.dbo.ORDER_LINE_SEG j
                    WHERE j.ORDNUM = x.ORDNUM
                      AND j.ENTDTE >= DATEADD(DAY, -3, GETDATE())
                )
            )
            SELECT x.ORDNUM, x.PRTNUM, x.ORDLIN, x.ORDSLN
            FROM XML_RANK x
            WHERE x.rn = 1
            AND NOT EXISTS (
                SELECT 1
                FROM SPIDSTGJDANew.dbo.ORDER_LINE_SEG j
                WHERE j.ORDNUM = x.ORDNUM
                  AND j.ORDLIN = x.ORDLIN
                  AND j.ORDSLN = x.ORDSLN
                  AND j.PRTNUM = x.PRTNUM
            )
            """
            
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': results,
                'data_source': 'sql_server'
            }), 200
            
    except Exception as e:
        print(f"Error in late-sku endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Failed to fetch late SKU data',
            'details': str(e)
        }), 500

@query_bp.route('/invalid-sku', methods=['GET'])
@jwt_required()
def get_invalid_sku_data():
    """Get Invalid SKU data"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
        
        if use_sqlite_for_testing:
            # Mock data for testing
            mock_data = [
                {'Client': 'FACETOLOGY', 'ORDNUM': 'ORD004', 'ORDLIN': '1', 'PRTNUM': 'INVALID001', 'Issue': 'Invalid SKU'},
                {'Client': 'SOMEBYMI', 'ORDNUM': 'ORD005', 'ORDLIN': '2', 'PRTNUM': 'INVALID002', 'Issue': 'Invalid SKU'},
                {'Client': 'ESQA', 'ORDNUM': 'ORD006', 'ORDLIN': '1', 'PRTNUM': 'INVALID003', 'Issue': 'Invalid SKU'},
                {'Client': 'KIVA', 'ORDNUM': 'ORD007', 'ORDLIN': '3', 'PRTNUM': 'INVALID004', 'Issue': 'Invalid SKU'},
                {'Client': 'SOMBONG', 'ORDNUM': 'ORD008', 'ORDLIN': '2', 'PRTNUM': 'INVALID005', 'Issue': 'Invalid SKU'}
            ]
            
            return jsonify({
                'status': 'success',
                'data': mock_data,
                'data_source': 'mock_data'
            }), 200
        
        else:
            # Create connection to SQL Server
            try:
                connection_string = create_sql_server_connection_string(
                    server, database, username, password, timeout=30
                )
                conn = pyodbc.connect(connection_string)
            except Exception as driver_error:
                print(f"ODBC Driver error in invalid-sku: {str(driver_error)}")
                return jsonify({
                    'status': 'error',
                    'error': 'Database connection failed',
                    'message': str(driver_error),
                    'details': 'ODBC Driver untuk SQL Server tidak ditemukan. Silakan install ODBC Driver 17 for SQL Server.'
                }), 500
            
            cursor = conn.cursor()
            
            # Execute the Invalid SKU query
            query = """
            SELECT
                UPPER(so.MerchantName) AS Client,
                lseg.ORDNUM,
                lseg.ORDLIN,
                lseg.PRTNUM,
                'Invalid SKU' AS Issue
            FROM Flexo_db.dbo.SalesOrder so WITH(NOLOCK)
            JOIN SPIDSTGEXML.dbo.ORDER_LINE_SEG lseg WITH(NOLOCK)
                ON lseg.ordnum = so.systemrefid
            LEFT JOIN WMSPROD.dbo.prtmst sku WITH(NOLOCK)
                ON lseg.prtnum = sku.prtnum
               AND sku.wh_id_tmpl = 'WMD1'
            WHERE 
                so.OrderDate >= DATEADD(DAY, -3, CAST(GETDATE() AS DATE))
                AND so.FulfilledByFlexo <> '0'
                AND so.orderstatus <> 'cancelled'
                AND sku.prtnum IS NULL
            ORDER BY lseg.PRTNUM
            """
            
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': results,
                'data_source': 'sql_server'
            }), 200
            
    except Exception as e:
        print(f"Error in invalid-sku endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Failed to fetch invalid SKU data',
            'details': str(e)
        }), 500

@query_bp.route('/duplicate-orders', methods=['GET'])
@jwt_required()
def get_duplicate_orders_data():
    """Get Order Duplikat data"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
        
        if use_sqlite_for_testing:
            # Mock data for testing
            mock_data = [
                {'ORDNUM': 'ORD006', 'ORDLIN': '1', 'jumlah': 2},
                {'ORDNUM': 'ORD007', 'ORDLIN': '2', 'jumlah': 3},
                {'ORDNUM': 'ORD008', 'ORDLIN': '1', 'jumlah': 2},
                {'ORDNUM': 'ORD009', 'ORDLIN': '3', 'jumlah': 4},
                {'ORDNUM': 'ORD010', 'ORDLIN': '2', 'jumlah': 2}
            ]
            
            return jsonify({
                'status': 'success',
                'data': mock_data,
                'data_source': 'mock_data'
            }), 200
        
        else:
            # Create connection to SQL Server
            try:
                connection_string = create_sql_server_connection_string(
                    server, database, username, password, timeout=30
                )
                conn = pyodbc.connect(connection_string)
            except Exception as driver_error:
                print(f"ODBC Driver error in duplicate-orders: {str(driver_error)}")
                return jsonify({
                    'status': 'error',
                    'error': 'Database connection failed',
                    'message': str(driver_error),
                    'details': 'ODBC Driver untuk SQL Server tidak ditemukan. Silakan install ODBC Driver 17 for SQL Server.'
                }), 500
            
            cursor = conn.cursor()
            
            # Execute the Order Duplikat query
            query = """
            SELECT ORDNUM, PRTNUM, ORDLIN, ORDSLN
            FROM (
                SELECT *,
                       ROW_NUMBER() OVER (
                           PARTITION BY ORDNUM, PRTNUM, ORDLIN, ORDSLN 
                           ORDER BY ENTDTE DESC
                       ) AS rn
                FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG WITH (NOLOCK)
                WHERE ENTDTE >= DATEADD(DAY, -90, GETDATE())
            ) a
            WHERE rn > 1 and TOT_PLN_PAL_QTY IS NULL
            """
            
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            conn.close()
            
            return jsonify({
                'status': 'success',
                'data': results,
                'data_source': 'sql_server'
            }), 200
            
    except Exception as e:
        print(f"Error in duplicate-orders endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': 'Failed to fetch duplicate orders data',
            'details': str(e)
        }), 500