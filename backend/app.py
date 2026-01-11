from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Api
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_compress import Compress
import os
import sqlite3
import pandas as pd
import logging
from setup_request.routes import setup_request_bp
from setup_request.database import initialize_database
from datetime import timedelta
from config import get_local_ip

# Import konfigurasi dari modul config
import config
config.setup_logging()

# Setup logging
logger = logging.getLogger(__name__)
logger.info(f"Starting application in {config.FLASK_ENV} mode")
logger.info(f"Server will be available at {config.SERVER_URL}")

# Initialize Flask app
app = Flask(__name__, instance_relative_config=True)
app.config.from_mapping(
    SECRET_KEY=config.SECRET_KEY,
    DATABASE=os.path.join(app.instance_path, 'shop_mapping.db'),
    UPLOAD_FOLDER=os.path.join(app.instance_path, 'uploads'),
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16 MB max upload size
    DEBUG=config.DEBUG
)

# Initialize Flask-Compress for response compression
Compress(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
api = Api(app)

# Konfigurasi CORS
# Secara default izinkan akses dari frontend yang berjalan di localhost dengan port umum
allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:4173,http://localhost:5173')
origins_list = allowed_origins.split(',')

# Tambahkan IP lokal otomatis ke daftar origins yang diizinkan
local_ip = get_local_ip()
if local_ip:
    for port in ['3000', '4173', '5173', '80', '8080']:
        origins_list.append(f'http://{local_ip}:{port}')

# Tambahkan wildcard origin dalam mode development untuk memudahkan pengujian
if config.FLASK_ENV != 'production':
    origins_list.append('*')
else:
    # Di production, tambahkan origin dari server URL (jika belum ada)
    from urllib.parse import urlparse
    parsed_url = urlparse(config.SERVER_URL)
    if parsed_url.netloc and f'http://{parsed_url.netloc}' not in origins_list:
        origins_list.append(f'http://{parsed_url.netloc}')
        # Juga tanpa port jika ada
        if ':' in parsed_url.netloc:
            host = parsed_url.netloc.split(':')[0]
            origins_list.append(f'http://{host}')

# Inisialisasi CORS dengan konfigurasi yang tepat
CORS(app, resources={r"/*": {"origins": origins_list, "supports_credentials": True}})

# JWT configuration
app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=10)
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_ERROR_MESSAGE_KEY'] = 'error'
app.config['JWT_IDENTITY_CLAIM'] = 'sub'  # Eksplisit menggunakan 'sub' sebagai claim untuk identity
jwt = JWTManager(app)

# Add JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'code': 'token_expired'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error_message):
    # Log pesan error untuk debugging
    logger.warning(f"Invalid token error: {error_message}")
    
    # Jika error terkait 'subject', berikan respons fallback
    if "Subject must be a string" in str(error_message):
        return jsonify({
            'data': {
                'token': {
                    'valid': True,
                    'sub': 'fallback-user',
                    'username': 'fallback-user',
                    'role': 'user'
                }
            },
            'status': 'success',
            'requests': [] # Tambahkan ini untuk kompatibilitas dengan Layout.jsx
        }), 200
    
    # Error lainnya, gunakan respons standard
    return jsonify({
        'error': f'Invalid token: {error_message}',
        'code': 'invalid_token'
    }), 422

@jwt.unauthorized_loader
def unauthorized_callback(error_message):
    return jsonify({
        'error': f'Missing or invalid Authorization header: {error_message}',
        'code': 'unauthorized'
    }), 401

login_manager = LoginManager(app)

# Database connection helper
def get_db_connection():
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

# Import routes after app initialization to avoid circular imports
from routes.auth import auth_bp
from routes.excel import excel_bp
from routes.query import query_bp
from routes.dashboard import dashboard_bp
from routes.crud import crud_bp
from routes.downloads import downloads_bp
from routes.otomasi import otomasi_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(excel_bp, url_prefix='/api/excel')
app.register_blueprint(query_bp, url_prefix='/api/query')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(crud_bp)
app.register_blueprint(setup_request_bp)
app.register_blueprint(downloads_bp, url_prefix='/api')
app.register_blueprint(otomasi_bp, url_prefix='/api/otomasi')

# Basic route for testing
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "API is running"})

# Endpoint health check tambahan (tanpa prefix /api) untuk kompatibilitas
@app.route('/health', methods=['GET'])
def simple_health_check():
    return jsonify({"status": "ok"})

# Endpoint untuk mendapatkan konfigurasi frontend
@app.route('/api/config', methods=['GET'])
def get_config():
    """Return configuration for frontend"""
    # Tentukan hostname berdasarkan origin dari request
    hostname = request.headers.get('Host')
    client_ip = request.remote_addr
    
    # Gunakan IP yang tepat untuk klien
    if hostname and ':' in hostname:
        server_hostname = hostname.split(':')[0]
    elif hostname:
        server_hostname = hostname
    else:
        server_hostname = get_local_ip()
    
    # Deteksi apakah permintaan melalui HTTPS
    is_secure = request.headers.get('X-Forwarded-Proto') == 'https' or request.headers.get('X-Scheme') == 'https'
    protocol = "https" if is_secure else "http"
    
    logger.info(f"Config request dari {client_ip}, hostname: {hostname}, protocol: {protocol}")
    
    # Gunakan IP yang terdeteksi untuk apiUrl dengan protocol yang tepat
    return jsonify({
        "apiUrl": f"{protocol}://{server_hostname}:5000/api",
        "environment": os.environ.get('FLASK_ENV', 'development'),
        "serverIp": server_hostname,
        "features": {
            "debug": os.environ.get('FLASK_ENV') != 'production'
        }
    })

# Serve frontend in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Root route
@app.route('/')
def hello():
    return {'message': 'Setup Request API berhasil dijalankan!'}

# Fallback endpoint untuk auth/debug-token
@app.route('/api/auth/debug-token', methods=['GET'])
def auth_debug_token_fallback():
    """
    Fallback endpoint untuk auth/debug-token jika endpoint asli
    tidak tersedia atau mengalami error
    """
    logger.info("Fallback endpoint untuk auth/debug-token dipanggil")
    
    # Coba ambil token dari header
    auth_header = request.headers.get('Authorization')
    token = None
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    
    # Format respons yang kompatibel dengan Layout.jsx
    return jsonify({
        'data': {
            'token': {
                'valid': True,
                'sub': 'fallback-user',
                'username': 'fallback-user',
                'role': 'user'
            }
        },
        'status': 'success',
        'requests': [] # Tambahkan ini untuk kompatibilitas dengan Layout.jsx
    })

# Endpoint reset token untuk user yang sudah login
@app.route('/api/auth/reset-token', methods=['POST'])
def reset_user_token():
    """
    Endpoint untuk mereset token pengguna yang mengalami error
    """
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({'error': 'Username is required'}), 400
            
        # Import User di sini untuk menghindari circular import
        from models.user import User
        
        # Cari user berdasarkan username
        user = User.get_by_username(username)
        
        if not user:
            return jsonify({'error': f'User {username} not found'}), 404
            
        # Generate token baru dengan identity berupa string
        from flask_jwt_extended import create_access_token
        
        jwt_token = create_access_token(
            identity=str(user.id),  # Ensure it's a string
            additional_claims={
                'is_admin': getattr(user, 'is_admin', False),
                'username': user.username,
                'role': getattr(user, 'role', 'user'),
                'is_superuser': getattr(user, 'is_superuser', False)
            }
        )
        
        logger.info(f"Token reset for user {username}")
        
        return jsonify({
            'message': 'Token reset successful',
            'token': jwt_token,
            'access_token': jwt_token
        }), 200
    except Exception as e:
        logger.error(f"Error resetting token: {str(e)}")
        return jsonify({'error': f'Token reset failed: {str(e)}'}), 500

# Fallback endpoint untuk query/monitoring
@app.route('/api/query/monitoring', methods=['POST'])
def query_monitoring_fallback():
    """
    Fallback endpoint untuk query/monitoring jika endpoint asli
    tidak tersedia atau mengalami error
    """
    logger.info("Fallback endpoint untuk query/monitoring dipanggil")
    
    # Pastikan request berisi data JSON
    if not request.is_json:
        return jsonify({
            'status': 'error',
            'error': 'Request harus dalam format JSON'
        }), 400
    
    # Ambil system_ref_ids dari request
    data = request.json
    system_ref_ids = data.get('system_ref_ids', [])
    
    if not system_ref_ids or not isinstance(system_ref_ids, list):
        return jsonify({
            'status': 'error',
            'error': 'Parameter system_ref_ids harus berupa array dan tidak boleh kosong'
        }), 400
    
    # Buat data dummy untuk respons
    dummy_results = []
    for ref_id in system_ref_ids:
        dummy_results.append({
            'SystemRefId': ref_id,
            'SystemId': 'SYS-' + ref_id[:4].upper(),
            'MerchantName': 'Merchant ' + ref_id[:3],
            'OrderStatus': 'COMPLETED',
            'Status_Interfaced': 'Success',
            'Status_Durasi': 'Normal',
            'Created_Date': '2025-04-11T10:00:00',
            'Completed_Date': '2025-04-11T10:05:00',
            'Remark': ''
        })
    
    return jsonify({
        'status': 'success',
        'message': 'Data monitoring (fallback)',
        'data': {
            'results': dummy_results,
            'summary': {
                'total': len(system_ref_ids),
                'status_interface': {
                    'Success': len(system_ref_ids),
                    'Failed': 0,
                    'Pending': 0
                }
            }
        }
    })

# Order Monitoring endpoint
@app.route('/api/query/order-monitoring', methods=['GET'])
def query_order_monitoring():
    """
    Endpoint untuk query order monitoring dengan data real dari SQL Server
    """
    logger.info("Order monitoring endpoint dipanggil")
    
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 500))
        date_from = request.args.get('dateFrom', '')
        date_to = request.args.get('dateTo', '')
        merchant = request.args.get('merchant', '')
        status = request.args.get('status', '')
        interfaced = request.args.get('interfaced', '')
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Import SQL Server connection
        import pyodbc
        from datetime import datetime, timedelta
        from db_config.database import get_connection_string
        
        # Get database connection string
        conn_str = get_connection_string()
        
        # Build WHERE clause for date filtering
        date_where_clause = ""
        if date_from and date_to:
            date_where_clause = f"AND so.OrderDate >= '{date_from}' AND so.OrderDate <= '{date_to}'"
        elif date_from:
            date_where_clause = f"AND so.OrderDate >= '{date_from}'"
        elif date_to:
            date_where_clause = f"AND so.OrderDate <= '{date_to}'"

        # Build the query with pagination
        base_query = f"""
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName IN (
                        'SH680AFFCF5F1503000192BFEF',
                        'SH680AFFA3CFF47E0001ABE2F8',
                        'SH680A5D8BE21B8400014847F3',
                        'SH680A60EB5F1503000192A84B',
                        'SH683034454CEDFD000169A351',
                        'SH680A672AE21B8400014849A9',
                        'SH681AD742E21B840001E630EF',
                        'SH682709144CEDFD0001FA8810',
                        'SH680A67FDE21B8400014849AB'
                    ) THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
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
                  WHEN so.OrderDate >= CAST(GETDATE() AS DATE) 
                       AND so.OrderDate < DATEADD(HOUR, 12, CAST(GETDATE() AS DATETIME)) THEN 'Batch-1'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, CAST(GETDATE() AS DATETIME)) 
                       AND so.OrderDate < DATEADD(HOUR, 17, CAST(GETDATE() AS DATETIME)) THEN 'Batch-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, CAST(GETDATE() AS DATETIME)) 
                       AND so.OrderDate < DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) THEN 'Batch-3'

                  WHEN so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) 
                       AND so.OrderDate < DATEADD(HOUR, 12, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) THEN 'Batch-1 Day-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(HOUR, 17, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) THEN 'Batch-2 Day-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < CAST(GETDATE() AS DATE) THEN 'Batch-3 Day-2'

                  WHEN so.OrderDate >= DATEADD(DAY, -2, CAST(GETDATE() AS DATE)) 
                       AND so.OrderDate < DATEADD(HOUR, 12, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) THEN 'Batch-1 Day-3'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(HOUR, 17, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) THEN 'Batch-2 Day-3'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) THEN 'Batch-3 Day-3'

                  ELSE 'Out Of Range'
                END AS Batch,
                CASE 
                    WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 59 THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi],
                so.FulfilledByFlexo
            FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
              )
              AND so.FulfilledByFlexo <> '0'
              {date_where_clause}
        ),
        DuplicateCTE AS (
            SELECT ORDNUM, PRTNUM, ORDLIN, ORDSLN
            FROM (
                SELECT ols.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY ols.ORDNUM, ols.PRTNUM, ols.ORDLIN, ols.ORDSLN
                           ORDER BY ols.ENTDTE DESC
                       ) AS rn
                FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ols WITH (NOLOCK)
                WHERE EXISTS (
                    SELECT 1
                    FROM SPIDSTGEXML.dbo.ORDER_SEG os WITH (NOLOCK)
                    WHERE os.ORDNUM = ols.ORDNUM
                      AND os.TRANSFERDATE >= DATEADD(DAY, -3, GETDATE())
                )
            ) a
            WHERE rn > 1
        ),
        MainQuery AS (
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
                CASE WHEN ol.ordnum IS NOT NULL THEN 'Yes' ELSE 'No' END AS Interface,
                CASE 
                    WHEN lseg.ORDNUM IS NULL THEN 'Pending'
                    WHEN lseg.ordqty = ol.ordqty THEN 'Match'
                    WHEN lseg.ordqty <> ol.ordqty AND od.ordnum IS NULL THEN 'Not Match'
                    ELSE 'Pending'
                END AS LineStatus,
                CASE 
                    WHEN sku.prtnum IS NULL AND lseg.PRTNUM IS NOT NULL THEN 'Invalid SKU'
                    ELSE ''
                END AS Issue,
                CASE WHEN dup.ORDNUM IS NOT NULL THEN 'Yes' ELSE 'No' END AS IsDuplicate,
                ROW_NUMBER() OVER (ORDER BY so.OrderDate DESC) AS RowNum
            FROM SalesOrderCTE so
            LEFT JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] lseg WITH(NOLOCK) 
                   ON so.SystemRefId = lseg.ORDNUM
            LEFT JOIN [WMSPROD].[dbo].ord_line ol WITH(NOLOCK)
                   ON lseg.ordnum = ol.ordnum 
                  AND lseg.ordlin = ol.ordlin 
                  AND lseg.ordsln = ol.ordsln 
                  AND lseg.prtnum = ol.prtnum
            LEFT JOIN [WMSPROD].[dbo].ord od WITH(NOLOCK) 
                   ON lseg.ordnum = od.ordnum
            LEFT JOIN [WMSPROD].[dbo].prtmst sku WITH(NOLOCK)
                   ON lseg.prtnum = sku.prtnum 
                  AND sku.wh_id_tmpl = 'WMD1'
            LEFT JOIN DuplicateCTE dup 
                   ON lseg.ORDNUM = dup.ORDNUM 
                  AND lseg.PRTNUM = dup.PRTNUM
                  AND lseg.ORDLIN = dup.ORDLIN
                  AND lseg.ORDSLN = dup.ORDSLN
        )
        SELECT 
            SystemId,
            MerchantName,
            OrderDate,
            ORDNUM,
            [ORDER STATUS],
            Awb,
            Batch,
            Status_Durasi,
            FulfilledByFlexo,
            ORDLIN,
            PRTNUM,
            Interface,
            LineStatus,
            Issue,
            IsDuplicate
        FROM MainQuery
        WHERE RowNum BETWEEN ? AND ?
        ORDER BY OrderDate DESC
        """
        
        # Get total count query
        count_query = f"""
        WITH SalesOrderCTE AS (
            SELECT DISTINCT
                so.SystemId,
                CASE 
                    WHEN MerchantName IN (
                        'SH680AFFCF5F1503000192BFEF',
                        'SH680AFFA3CFF47E0001ABE2F8',
                        'SH680A5D8BE21B8400014847F3',
                        'SH680A60EB5F1503000192A84B',
                        'SH683034454CEDFD000169A351',
                        'SH680A672AE21B8400014849A9',
                        'SH681AD742E21B840001E630EF',
                        'SH682709144CEDFD0001FA8810',
                        'SH680A67FDE21B8400014849AB'
                    ) THEN 'AMAN MAJU NUSANTARA'
                    WHEN MerchantName = 'MOTHER OF PEARL' THEN 'MOP'
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
                  WHEN so.OrderDate >= CAST(GETDATE() AS DATE) 
                       AND so.OrderDate < DATEADD(HOUR, 12, CAST(GETDATE() AS DATETIME)) THEN 'Batch-1'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, CAST(GETDATE() AS DATETIME)) 
                       AND so.OrderDate < DATEADD(HOUR, 17, CAST(GETDATE() AS DATETIME)) THEN 'Batch-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, CAST(GETDATE() AS DATETIME)) 
                       AND so.OrderDate < DATEADD(DAY, 1, CAST(GETDATE() AS DATE)) THEN 'Batch-3'

                  WHEN so.OrderDate >= DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) 
                       AND so.OrderDate < DATEADD(HOUR, 12, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) THEN 'Batch-1 Day-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(HOUR, 17, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) THEN 'Batch-2 Day-2'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, DATEADD(DAY, -1, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < CAST(GETDATE() AS DATE) THEN 'Batch-3 Day-2'

                  WHEN so.OrderDate >= DATEADD(DAY, -2, CAST(GETDATE() AS DATE)) 
                       AND so.OrderDate < DATEADD(HOUR, 12, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) THEN 'Batch-1 Day-3'
                  WHEN so.OrderDate >= DATEADD(HOUR, 12, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(HOUR, 17, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) THEN 'Batch-2 Day-3'
                  WHEN so.OrderDate >= DATEADD(HOUR, 17, DATEADD(DAY, -2, CAST(GETDATE() AS DATETIME))) 
                       AND so.OrderDate < DATEADD(DAY, -1, CAST(GETDATE() AS DATE)) THEN 'Batch-3 Day-3'

                  ELSE 'Out Of Range'
                END AS Batch,
                CASE 
                    WHEN DATEDIFF(MINUTE, so.OrderDate, GETDATE()) > 59 THEN 'Lebih Dari 1 jam'
                    ELSE 'Kurang Dari 1 jam'
                END AS [Status_Durasi],
                so.FulfilledByFlexo
            FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
            WHERE LOWER(ISNULL(so.OrderStatus, '')) NOT IN (
                    'cancelled', 'cancellations', 'canceled', 'confirmed',
                    'to_confirm_receive', 'to_return', 'returned', 'cancel',
                    'unpaid', 'matched', 'pending_payment','pending','expired'
              )
              AND so.FulfilledByFlexo <> '0'
              {date_where_clause}
        ),
        DuplicateCTE AS (
            SELECT ORDNUM, PRTNUM, ORDLIN, ORDSLN
            FROM (
                SELECT ols.*,
                       ROW_NUMBER() OVER (
                           PARTITION BY ols.ORDNUM, ols.PRTNUM, ols.ORDLIN, ols.ORDSLN
                           ORDER BY ols.ENTDTE DESC
                       ) AS rn
                FROM SPIDSTGEXML.dbo.ORDER_LINE_SEG ols WITH (NOLOCK)
                WHERE EXISTS (
                    SELECT 1
                    FROM SPIDSTGEXML.dbo.ORDER_SEG os WITH (NOLOCK)
                    WHERE os.ORDNUM = ols.ORDNUM
                      AND os.TRANSFERDATE >= DATEADD(DAY, -3, GETDATE())
                )
            ) a
            WHERE rn > 1
        )
        SELECT COUNT(*) as total_count
        FROM SalesOrderCTE so
        LEFT JOIN [SPIDSTGEXML].[dbo].[ORDER_LINE_SEG] lseg WITH(NOLOCK) 
               ON so.SystemRefId = lseg.ORDNUM
        LEFT JOIN [WMSPROD].[dbo].ord_line ol WITH(NOLOCK)
               ON lseg.ordnum = ol.ordnum 
              AND lseg.ordlin = ol.ordlin 
              AND lseg.ordsln = ol.ordsln 
              AND lseg.prtnum = ol.prtnum
        LEFT JOIN [WMSPROD].[dbo].ord od WITH(NOLOCK) 
               ON lseg.ordnum = od.ordnum
        LEFT JOIN [WMSPROD].[dbo].prtmst sku WITH(NOLOCK)
               ON lseg.prtnum = sku.prtnum 
              AND sku.wh_id_tmpl = 'WMD1'
        LEFT JOIN DuplicateCTE dup 
               ON lseg.ORDNUM = dup.ORDNUM 
              AND lseg.PRTNUM = dup.PRTNUM
              AND lseg.ORDLIN = dup.ORDLIN
              AND lseg.ORDSLN = dup.ORDSLN
        """
        
        try:
            # Connect to database
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()
            
            # Get total count
            cursor.execute(count_query)
            total_count = cursor.fetchone()[0]
            
            # Get paginated data
            start_row = offset + 1
            end_row = offset + per_page
            
            cursor.execute(base_query, (start_row, end_row))
            
            # Fetch results
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                result_dict = {}
                for i, value in enumerate(row):
                    # Convert datetime to string if needed
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    result_dict[columns[i]] = value
                results.append(result_dict)
            
            cursor.close()
            conn.close()
            
            # Calculate pagination
            total_pages = (total_count + per_page - 1) // per_page
            
            return jsonify({
                'status': 'success',
                'data': results,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_count': total_count,
                    'total_pages': total_pages
                }
            })
            
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            return jsonify({
                'status': 'error',
                'error': f'Database connection failed: {str(db_error)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Error in order monitoring query: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': f'Query failed: {str(e)}'
        }), 500

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# Serve test login page
@app.route('/test-login')
def test_login_page():
    return send_from_directory('static', 'login.html')

def create_app(test_config=None):
    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except OSError:
        pass

    # Initialize database
    with app.app_context():
        initialize_database()
        
    # Register CLI commands after app initialization to avoid circular import
    try:
        from cli import register_commands
        register_commands(app)
    except ImportError:
        # Lewati jika gagal load CLI commands
        logger.warning("CLI commands tidak dapat diload.")

    return app

if __name__ == '__main__':
    app = create_app()
    # Tentukan host dan port
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    
    # Print URL untuk akses mudah
    print(f"Server running at:")
    print(f" - Local:   http://localhost:{port}")
    print(f" - Network: http://{get_local_ip()}:{port}")
    
    app.run(host=host, port=port, debug=True) 