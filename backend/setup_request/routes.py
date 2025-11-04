import os
import tempfile
import logging
import json
import traceback
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from flask_cors import cross_origin
from .processor import SetupRequestProcessor
from .database import (
    initialize_database, get_all_shop_mappings, 
    add_shop_mapping, delete_shop_mapping, import_mappings_from_csv,
    get_setup_request_statistics
)
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# Import fungsi untuk menambahkan file ke download center
from routes.downloads import add_file_to_downloads

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create blueprint
setup_request_bp = Blueprint('setup_request', __name__, url_prefix='/api/setup-request')

# Initialize database on startup
# Flask 2.x tidak lagi mendukung before_app_first_request
# Gunakan metode alternatif dengan dekorator before_app_request dan variable untuk memastikan hanya dijalankan sekali
_is_database_initialized = False

@setup_request_bp.before_app_request
def before_request():
    global _is_database_initialized
    if not _is_database_initialized:
        initialize_database()
        logger.info("Database initialized for setup_request module")
        _is_database_initialized = True

# Define allowed extensions
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@setup_request_bp.route('/process', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required(optional=True)  # Make JWT optional for OPTIONS requests
def process_file():
    """
    API endpoint to process Excel file
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response
        
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        claims = get_jwt() if user_identity else {}
        
        logger.info(f"Setup request process from user {user_identity}, claims: {claims}")
        
        # Debug request
        logger.info(f"Request method: {request.method}")
        logger.info(f"Content type: {request.content_type}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request form data: {request.form}")
        logger.info(f"Request files: {request.files}")
        logger.info(f"Request data: {request.data}")
        
        # Check if form data is empty
        if not request.form and not request.files:
            logger.error("No form data or files received")
            return jsonify({
                'status': 'error', 
                'message': '❌ DATA FORM KOSONG\n\nTidak ada data form atau file yang diterima.\n\n💡 SOLUSI:\n• Pastikan file telah dipilih dengan benar\n• Periksa apakah semua field form terisi\n• Refresh halaman dan coba lagi',
                'error_code': 'MISSING_DATA'
            }), 400
        
        # Handle multipart/form-data properly
        file = None
        if 'file' in request.files:
            file = request.files['file']
        
        # Check if file is in request
        if not file:
            available_keys = list(request.files.keys())
            logger.error(f"No 'file' key in request.files. Available keys: {available_keys}")
            
            # If only one file was sent with a different key, use that
            if len(available_keys) == 1:
                file_key = available_keys[0]
                logger.info(f"Using alternative file key: {file_key}")
                file = request.files[file_key]
            else:
                return jsonify({
                    'status': 'error', 
                    'message': '❌ FILE TIDAK DITEMUKAN\n\nFile tidak ditemukan dalam permintaan.\n\n💡 SOLUSI:\n• Pastikan file telah dipilih dengan benar\n• Coba pilih file lagi\n• Refresh halaman dan upload ulang',
                    'error_code': 'FILE_NOT_FOUND',
                    'available_keys': available_keys
                }), 400
                
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Check if file is empty
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({
                'status': 'error', 
                'message': '❌ NAMA FILE KOSONG\n\nNama file kosong atau tidak valid.\n\n💡 SOLUSI:\n• Pastikan file telah dipilih dengan benar\n• Pilih file yang memiliki nama yang valid\n• Coba pilih file lagi',
                'error_code': 'EMPTY_FILENAME'
            }), 400
        
        # Check if file extension is allowed
        if not allowed_file(file.filename):
            file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'unknown'
            logger.error(f"File with extension {file_extension} not allowed")
            return jsonify({
                'status': 'error', 
                'message': f'❌ FORMAT FILE TIDAK DIDUKUNG\n\nFile yang diunggah memiliki ekstensi .{file_extension}.\n\n💡 SOLUSI:\n• Gunakan file Excel (.xlsx atau .xls)\n• Pastikan file benar-benar file Excel\n• Download template Excel dari halaman ini',
                'error_code': 'INVALID_FILE_TYPE',
                'file_extension': file_extension,
                'allowed_extensions': list(ALLOWED_EXTENSIONS)
            }), 400
        
        # Check file size (10MB limit)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file.seek(0, 2)  # Seek to end to get file size
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            file_size_mb = file_size / (1024 * 1024)
            logger.error(f"File too large: {file_size_mb:.2f}MB")
            return jsonify({
                'status': 'error',
                'message': f'❌ FILE TERLALU BESAR\n\nUkuran file: {file_size_mb:.2f}MB\nMaksimal ukuran file: 10MB\n\n💡 SOLUSI:\n• Kompres file Excel atau hapus data yang tidak perlu\n• Bagi file menjadi beberapa bagian yang lebih kecil\n• Pastikan file tidak berisi gambar atau data yang tidak perlu',
                'error_code': 'FILE_TOO_LARGE',
                'file_size_mb': round(file_size_mb, 2),
                'max_size_mb': 10
            }), 413
        
        # Get form data
        process_type = request.form.get('process_type', 'Bundle')
        created_by = request.form.get('created_by', 'System')
        
        # Use username from token if available
        if created_by == 'System' and claims.get('username'):
            created_by = claims.get('username')
            
        combine_sheets = request.form.get('combine_sheets', 'false').lower() == 'true'
        output_format = request.form.get('output_format', 'xlsx')
        
        logger.info(f"Processing file {file.filename} with type {process_type} created by {created_by}")
        
        # Create temporary file
        uploads_dir = os.path.join(current_app.instance_path, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        filename = secure_filename(file.filename)
        temp_path = os.path.join(uploads_dir, f"{timestamp}_{filename}")
        
        # Save file
        file.save(temp_path)
        logger.info(f"File saved at {temp_path}")
        
        # Process file
        processor = SetupRequestProcessor(
            file_path=temp_path,
            process_type=process_type,
            created_by=created_by,
            combine_sheets=combine_sheets,
            output_format=output_format
        )
        
        # Start processing
        result = processor.process()
        
        if result["status"] == "success":
            # Store output path for later download
            output_path = result["output_path"]
            request_id = timestamp
            
            # Save information about processed file
            processed_info = {
                'request_id': request_id,
                'original_filename': filename,
                'process_type': process_type,
                'created_by': created_by,
                'timestamp': timestamp,
                'output_path': output_path,
                'output_format': output_format
            }
            
            # Store in session or database
            session_dir = os.path.join(current_app.instance_path, 'sessions')
            os.makedirs(session_dir, exist_ok=True)
            
            with open(os.path.join(session_dir, f"{request_id}.json"), 'w') as f:
                json.dump(processed_info, f)
            
            # Save analytics data
            try:
                from .database import save_setup_request_analytics
                
                # Extract analytics data from processed file
                analytics_data = result.get('analytics_data', [])
                
                logger.info(f"Analytics data received: {len(analytics_data) if isinstance(analytics_data, list) else 'Not a list'}")
                logger.info(f"Analytics data type: {type(analytics_data)}")
                logger.info(f"Analytics data content: {analytics_data}")
                
                if analytics_data and isinstance(analytics_data, list):
                    saved_count = 0
                    for record in analytics_data:
                        try:
                            success = save_setup_request_analytics(
                                request_id=request_id,
                                client=record.get('client', ''),
                                marketplace=record.get('marketplace', ''),
                                gift_type=record.get('gift_type', '3'),
                                process_type=process_type,
                                created_by=created_by,
                                shop_id=record.get('shop_id'),
                                client_id=record.get('client_id')
                            )
                            if success:
                                saved_count += 1
                            else:
                                logger.error(f"Failed to save analytics record: {record}")
                        except Exception as record_error:
                            logger.error(f"Error saving individual analytics record: {str(record_error)}")
                    
                    logger.info(f"Analytics data saved: {saved_count}/{len(analytics_data)} records for request {request_id}")
                else:
                    logger.warning(f"No analytics data to save for request {request_id}")
                    
            except Exception as e:
                logger.error(f"Error saving analytics data: {str(e)}")
                logger.error(f"Full error details: {traceback.format_exc()}")
                # Don't fail the entire request if analytics saving fails
            
            # Tambahkan file ke download center untuk ditampilkan di dropdown
            try:
                output_filename = os.path.basename(output_path)
                with open(output_path, 'rb') as file_content:
                    # Tambahkan file ke download center
                    add_file_to_downloads(
                        filename=f"{process_type}_{output_filename}",
                        file_content=file_content.read(),
                        username=created_by
                    )
                logger.info(f"File {output_filename} added to download center")
            except Exception as e:
                logger.error(f"Error adding file to download center: {str(e)}")
                # Jangan gagalkan seluruh request jika gagal menambahkan ke download center
            
            return jsonify({
                'status': 'success',
                'message': 'File berhasil diproses',
                'request_id': request_id,
                'logs': result["logs"]
            })
        else:
            return jsonify({
                'status': 'error',
                'message': result["error"],
                'error_code': 'PROCESSING_FAILED',
                'logs': result["logs"]
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan yang tidak terduga saat memproses file. Silakan coba lagi atau hubungi administrator.',
            'error_code': 'UNEXPECTED_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500

@setup_request_bp.route('/download/<request_id>', methods=['GET'])
@jwt_required()
def download_file(request_id):
    """
    API endpoint to download processed file
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        logger.info(f"Download request from user {user_identity} for request ID {request_id}")
        
        # Get information about processed file
        session_dir = os.path.join(current_app.instance_path, 'sessions')
        session_file = os.path.join(session_dir, f"{request_id}.json")
        
        if not os.path.exists(session_file):
            logger.error(f"Session file {session_file} not found")
            return jsonify({
                'status': 'error', 
                'message': 'File tidak ditemukan. Session pemrosesan mungkin telah kedaluwarsa.',
                'error_code': 'SESSION_NOT_FOUND'
            }), 404
        
        with open(session_file, 'r') as f:
            processed_info = json.load(f)
        
        output_path = processed_info['output_path']
        
        if not os.path.exists(output_path):
            return jsonify({
                'status': 'error', 
                'message': 'File hasil tidak ditemukan. File mungkin telah dihapus atau dipindahkan.',
                'error_code': 'OUTPUT_FILE_NOT_FOUND'
            }), 404
        
        # Pastikan nama file untuk download sama persis dengan yang dibuat di processor.py
        original_filename = processed_info.get('original_filename', '')
        process_type = processed_info.get('process_type', 'Bundle')
        
        # Extract client name from the output path filename
        basename = os.path.basename(output_path)
        
        # Get output format from processed info
        output_format = processed_info.get('output_format', 'xlsx')
        
        # Deteksi nama file dari path output agar sama dengan yang ditampilkan di log
        filename_only = os.path.basename(output_path)
        
        # Tambahkan entri ke download center jika belum ada
        try:
            if not hasattr(download_file, '_added_to_downloads') or request_id not in download_file._added_to_downloads:
                # Baca file untuk ditambahkan ke download center
                with open(output_path, 'rb') as file_content:
                    # Tambahkan file ke download center dengan username dari processed_info
                    add_file_to_downloads(
                        filename=f"{process_type}_{filename_only}",
                        file_content=file_content.read(),
                        username=processed_info.get('created_by', user_identity)
                    )
                # Simpan bahwa file ini sudah ditambahkan untuk mencegah duplikasi
                if not hasattr(download_file, '_added_to_downloads'):
                    download_file._added_to_downloads = set()
                download_file._added_to_downloads.add(request_id)
                logger.info(f"File {filename_only} added to download center during download")
        except Exception as e:
            # Log error tapi jangan gagalkan download
            logger.error(f"Error adding file to download center during download: {str(e)}")
        
        # Set header spesifik untuk memastikan browser mengenali nama file
        response = send_file(
            output_path, 
            as_attachment=True,
            download_name=filename_only,  # Menggunakan nama file tanpa path
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                     if output_path.endswith('.xlsx') else 'text/csv'
        )
        
        # Secara manual tambahkan header Content-Disposition yang lebih eksplisit
        response.headers['Content-Disposition'] = f'attachment; filename="{filename_only}"'
        # Tambahkan juga header CORS
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response
        
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan saat mengunduh file. Silakan coba lagi.',
            'error_code': 'DOWNLOAD_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500

@setup_request_bp.route('/download/file/<filename>', methods=['GET'])
@jwt_required()
def download_file_by_name(filename):
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        logger.info(f"Download by name request from user {user_identity} for file {filename}")
        
        # Direktori tempat file hasil disimpan
        output_dir = os.path.join(os.getcwd(), 'instance', 'uploads', 'output')
        file_path = os.path.join(output_dir, filename)
        
        # Validasi file ada
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': 'File tidak ditemukan'
            }), 404
        
        # Kirim file sebagai attachment
        return send_file(
            file_path, 
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@setup_request_bp.route('/mappings', methods=['GET'])
@jwt_required()
def get_mappings():
    """
    API endpoint to get all shop mappings
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        logger.info(f"Get mappings request from user {user_identity}")
        
        # Tambahkan log informasi tentang proses
        logger.info("Mengambil data mapping dari database")
        
        mappings = get_all_shop_mappings()
        
        # Debug hasil mapping yang dikembalikan
        logger.info(f"Retrieved {len(mappings)} shop mappings")
        logger.info(f"Sample mapping data: {mappings[:2] if mappings else 'Empty'}")
        
        # Pastikan mappings adalah list
        if mappings is None:
            mappings = []
            logger.warning("Mappings is None, defaulting to empty list")
        
        # Pastikan format JSON yang dikembalikan
        response_data = {
            'status': 'success',
            'mappings': mappings
        }
        logger.info(f"Returning response: {response_data}")
        
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error getting mappings: {str(e)}")
        return jsonify({'status': 'error', 'message': f'Error: {str(e)}'}), 500

@setup_request_bp.route('/mappings', methods=['POST'])
@jwt_required()
def add_mapping():
    """
    API endpoint to add shop mapping
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        logger.info(f"Add mapping request from user {user_identity}")
        
        data = request.json
        
        # Validate required fields
        required_fields = ['marketplace', 'client', 'shop_id']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            field_names = {
                'marketplace': 'Marketplace',
                'client': 'Client', 
                'shop_id': 'Shop ID'
            }
            missing_field_names = [field_names.get(field, field) for field in missing_fields]
            
            return jsonify({
                'status': 'error', 
                'message': f'❌ FIELD WAJIB KOSONG\n\nField berikut harus diisi:\n• {", ".join(missing_field_names)}\n\n💡 SOLUSI:\n• Pastikan semua field wajib terisi\n• Periksa apakah ada spasi kosong di field\n• Field yang ditandai dengan * adalah wajib',
                'error_code': 'MISSING_REQUIRED_FIELDS',
                'missing_fields': missing_fields
            }), 400
        
        # Add mapping
        result = add_shop_mapping(
            marketplace=data['marketplace'],
            client=data['client'],
            shop_id=data['shop_id'],
            client_id=data.get('client_id')
        )
        
        if result:
            return jsonify({
                'status': 'success',
                'message': 'Mapping berhasil ditambahkan'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Gagal menambahkan mapping. Silakan coba lagi.',
                'error_code': 'MAPPING_ADD_FAILED'
            }), 500
    
    except Exception as e:
        logger.error(f"Error adding mapping: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan saat menambahkan mapping. Silakan coba lagi.',
            'error_code': 'MAPPING_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500

@setup_request_bp.route('/mappings/<int:mapping_id>', methods=['DELETE'])
@jwt_required()
def delete_mapping(mapping_id):
    """
    API endpoint to delete shop mapping
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        claims = get_jwt()
        logger.info(f"Delete mapping request from user {user_identity} for mapping ID {mapping_id}")
        
        # Periksa apakah pengguna adalah admin
        is_admin = claims.get('is_admin') == True or claims.get('role') == 'admin'
        
        if not is_admin:
            logger.warning(f"Unauthorized delete mapping attempt by user {user_identity}")
            return jsonify({
                'status': 'error',
                'message': 'Tidak memiliki izin untuk menghapus mapping. Hanya administrator yang dapat menghapus mapping.',
                'error_code': 'INSUFFICIENT_PERMISSIONS'
            }), 403
        
        result = delete_shop_mapping(mapping_id)
        
        if result:
            return jsonify({
                'status': 'success',
                'message': 'Mapping berhasil dihapus'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Gagal menghapus mapping. Mapping mungkin tidak ditemukan.',
                'error_code': 'MAPPING_DELETE_FAILED'
            }), 500
    
    except Exception as e:
        logger.error(f"Error deleting mapping: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan saat menghapus mapping. Silakan coba lagi.',
            'error_code': 'MAPPING_DELETE_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500

@setup_request_bp.route('/mappings/import', methods=['POST'])
@jwt_required()
def import_mappings():
    """
    API endpoint to import shop mappings from CSV
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        logger.info(f"Import mappings request from user {user_identity}")
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'status': 'error', 
                'message': 'Tidak ada file yang dikirim. Pastikan file CSV telah dipilih.',
                'error_code': 'NO_FILE_SENT'
            }), 400
        
        file = request.files['file']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({
                'status': 'error', 
                'message': 'Tidak ada file yang dipilih. Silakan pilih file CSV.',
                'error_code': 'EMPTY_FILENAME'
            }), 400
        
        # Check if file extension is CSV
        if not file.filename.lower().endswith('.csv'):
            file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'unknown'
            return jsonify({
                'status': 'error', 
                'message': f'Format file tidak didukung. File yang diunggah memiliki ekstensi .{file_extension}. Gunakan file CSV (.csv).',
                'error_code': 'INVALID_FILE_TYPE',
                'file_extension': file_extension
            }), 400
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp:
            file.save(temp.name)
            temp_path = temp.name
        
        # Import mappings
        result, count = import_mappings_from_csv(temp_path)
        
        # Delete temporary file
        os.unlink(temp_path)
        
        if result:
            return jsonify({
                'status': 'success',
                'message': f'{count} mapping berhasil diimpor'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Gagal mengimpor mapping. Pastikan format CSV sesuai dengan template.',
                'error_code': 'IMPORT_FAILED'
            }), 500
    
    except Exception as e:
        logger.error(f"Error importing mappings: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan saat mengimpor mapping. Silakan coba lagi.',
            'error_code': 'IMPORT_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500

@setup_request_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """
    API endpoint to get setup request statistics
    """
    try:
        # Get user identity from JWT
        user_identity = get_jwt_identity()
        period = request.args.get('period', 'week')  # Default to week if not specified
        logger.info(f"Get statistics request from user {user_identity} for period {period}")
        
        # Get statistics from database
        stats = get_setup_request_statistics(period=period)
        
        return jsonify({
            'status': 'success',
            'statistics': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        return jsonify({
            'status': 'error', 
            'message': 'Terjadi kesalahan saat mengambil statistik. Silakan coba lagi.',
            'error_code': 'STATISTICS_ERROR',
            'details': str(e) if current_app.debug else None
        }), 500 