import os
import math
import sqlite3
import secrets
import string
import json
from flask import Blueprint, request, jsonify, current_app as app, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_login import login_user, logout_user, current_user
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, get_jwt, decode_token
from models.user import User
from dotenv import load_dotenv

# Load .env
load_dotenv()

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validasi data
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
    
        # Cek apakah username sudah ada
        if User.get_by_username(data['username']):
            return jsonify({'error': 'Username already exists'}), 400
    
        # Buat user baru
        user = User.create(
            username=data['username'],
            email=data.get('email', f"{data['username']}@example.com"),
            password=data['password'],
            is_admin=data.get('is_admin', False)
        )
    
        # Generate token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'is_admin': user.is_admin,
                'username': user.username
            }
        )
    
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'message': 'Login failed', 'error': 'Username and password are required'}), 400
        
        user = User.get_by_username(data['username'])
        
        if not user:
            return jsonify({'message': 'Login failed', 'error': 'Invalid username or password'}), 401
        
        # Dapatkan is_superuser dari user jika ada
        is_superuser = False
        try:
            is_superuser = getattr(user, 'is_superuser', False)
        except Exception as e:
            print(f"Error getting is_superuser: {e}")
            # Tetap lanjutkan jika terjadi error
        
        print(f"Login attempt for {data['username']}, is_superuser: {is_superuser}")
        
        password_to_check = data['password']
        
        if user.check_password(password_to_check):
            # Get user_dict dengan aman
            user_dict = {}
            try:
                user_dict = user.to_dict()
            except Exception as e:
                print(f"Error in to_dict(): {str(e)}")
                # Fallback jika to_dict() gagal
                user_dict = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_admin,
                    'role': 'admin' if user.is_admin else 'user'
                }
            
            # Ambil role dari user_dict
            user_role = user_dict.get('role', 'user')
            
            jwt_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    'is_admin': user.is_admin,
                    'username': user.username,
                    'role': user_role,
                    'is_superuser': is_superuser
                }
            )
            
            # Get full_name safely
            full_name = user.username
            try:
                full_name = getattr(user, 'full_name', user.username)
            except Exception as e:
                print(f"Error getting full_name: {e}")
                # Tetap gunakan username jika terjadi error
            
            response_data = {
                'message': 'Login successful',
                'token': jwt_token,
                'access_token': jwt_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'full_name': full_name,
                    'role': user_role,
                    'is_admin': user.is_admin,
                    'is_superuser': is_superuser,
                    'email': user.email
                }
            }
            
            resp = make_response(jsonify(response_data))
            resp.set_cookie('token', jwt_token, httponly=True, secure=False)
            resp.headers['Authorization'] = f'Bearer {jwt_token}'
            
            print(f"Login berhasil untuk pengguna: {user.username}")
            return resp, 200
        else:
            return jsonify({'message': 'Login failed', 'error': 'Invalid username or password'}), 401
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user():
    try:
        # Debug auth header
        auth_header = request.headers.get('Authorization', 'No Auth header')
        print(f"Auth header in /me endpoint: {auth_header}")
        
        # Get user identity dan klaim tambahan
        user_identity = get_jwt_identity()
        claims = get_jwt()
        
        print(f"Decoded user_identity: {user_identity}, type: {type(user_identity)}")
        print(f"Claims: {claims}")
        
        # Check if this is a request for ladyqiu's data
        is_superuser_check = False
        if 'username' in claims and claims['username'] == 'ladyqiu':
            is_superuser_check = True
            print("SUPERUSER ACCESS CHECK - Attempting to get ladyqiu data")
            print(f"SUPERUSER DEBUG - User identity: {user_identity}")
            print(f"SUPERUSER DEBUG - Claims: {claims}")
        
        # User identity bisa berupa dict atau string/int
        user_id = None
        
        # Jika identity adalah dict (dari token lama)
        if isinstance(user_identity, dict) and 'id' in user_identity:
            user_id = user_identity['id']
            print(f"Extracted user_id from dict: {user_id}")
        
        # Jika identity adalah string yang bisa dikonversi ke int
        elif isinstance(user_identity, str) and user_identity.isdigit():
            user_id = int(user_identity)
            print(f"Converted string user_id to int: {user_id}")
        
        # Jika identity adalah int atau bisa dijadikan user_id langsung
        else:
            user_id = user_identity
            print(f"Using user_identity directly as user_id: {user_id}")
        
        # Khusus untuk ladyqiu, coba cari langsung dengan username
        if is_superuser_check and not user_id:
            superuser = User.get_by_username('ladyqiu')
            if superuser:
                print(f"SUPERUSER DEBUG - Found user by username: {superuser.id}, is_admin: {superuser.is_admin}")
                user_id = superuser.id
        
        # Coba ambil user dari database
        user = User.get_by_id(user_id)
        
        # Jika user tidak ditemukan tapi kita punya data dari token
        if not user:
            print(f"User not found in database for id: {user_id}")
            
            if is_superuser_check:
                print("SUPERUSER DEBUG - Creating response from claims")
                return jsonify({
                    'id': user_id or 2,  # ID default untuk ladyqiu
                    'username': 'ladyqiu',
                    'role': 'admin',
                    'is_admin': True,
                    'email': 'ladyqiu@example.com',
                    'name': 'Lady Qiu'
                }), 200
            
            # Jika kita memiliki data dari token, gunakan itu
            elif claims.get('username'):
                print("Using claims data instead")
                return jsonify({
                    'id': user_id,
                    'username': claims.get('username', 'unknown'),
                    'role': claims.get('role', 'user'),
                    'is_admin': claims.get('is_admin', False),
                    'email': claims.get('email', f"user{user_id}@example.com"),
                    'name': claims.get('name', 'Unknown User')
                }), 200
            else:
                return jsonify({'error': 'User not found'}), 404
        
        # Tambahkan role jika belum ada
        user_data = user.to_dict()
        if is_superuser_check and not user_data.get('role'):
            user_data['role'] = 'admin'
            print("SUPERUSER DEBUG - Added admin role to response")
        
        print(f"Returning user data: {user_data}")
        
        return jsonify(user_data), 200
    except Exception as e:
        print(f"Error in /me endpoint: {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 500

@auth_bp.route('/audit-logs', methods=['POST'])
@jwt_required()
def create_audit_log():
    """
    Endpoint untuk menyimpan log aktivitas pengguna
    """
    try:
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get data
        data = request.get_json(silent=True) or {}
        
        # Connect to database
        conn = User.get_db_connection()
        cursor = conn.cursor()
        
        # Create audit_logs table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Insert the log entry
        cursor.execute(
            "INSERT INTO audit_logs (user_id, username, action, details, timestamp) VALUES (?, ?, ?, ?, ?)",
            (
                data.get('user_id', user.id),
                data.get('username', user.username),
                data.get('action', 'unknown'),
                str(data.get('details', {})),
                data.get('timestamp', datetime.now().isoformat())
            )
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Audit log saved'}), 201
        
    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return jsonify({'error': f'Failed to save audit log: {str(e)}'}), 500

@auth_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """
    Endpoint untuk mengambil log aktivitas (admin only)
    """
    try:
        # Get user identity dan klaim tambahan
        user_identity = get_jwt_identity()
        claims = get_jwt()
        
        print(f"Decoded user_identity in /audit-logs: {user_identity}")
        
        # Cek apakah pengguna adalah admin
        is_admin = False
        
        # Cek dari claims dulu
        if claims.get('is_admin') == True or claims.get('role') == 'admin':
            print("User is admin based on JWT claims")
            is_admin = True
        else:
            # Jika tidak ada di claims, coba cek database
            # User identity bisa berupa dict atau string/int
            user_id = None
            
            # Jika identity adalah dict (dari token lama)
            if isinstance(user_identity, dict) and 'id' in user_identity:
                user_id = user_identity['id']
            # Jika identity adalah string yang bisa dikonversi ke int
            elif isinstance(user_identity, str) and user_identity.isdigit():
                user_id = int(user_identity)
            # Jika identity adalah int atau bisa dijadikan user_id langsung
            else:
                user_id = user_identity
                
            current_user = User.get_by_id(user_id)
            if current_user and current_user.is_admin:
                print("User is admin based on database record")
                is_admin = True
                
        if not is_admin:
            print(f"Unauthorized access to /audit-logs - user_identity: {user_identity}")
            return jsonify({'error': 'Unauthorized'}), 403
            
        # Connect to database
        conn = User.get_db_connection()
        cursor = conn.cursor()
        
        # Check if audit_logs table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'")
        if not cursor.fetchone():
            return jsonify([]), 200
            
        # Get filters from query parameters
        username = request.args.get('username')
        action = request.args.get('action')
        date_from = request.args.get('from')
        date_to = request.args.get('to')
        
        # Build query
        query = "SELECT * FROM audit_logs"
        params = []
        
        # Add filters
        conditions = []
        if username:
            conditions.append("username = ?")
            params.append(username)
        if action:
            conditions.append("action = ?")
            params.append(action)
        if date_from:
            conditions.append("timestamp >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("timestamp <= ?")
            params.append(date_to)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        # Add ordering
        query += " ORDER BY timestamp DESC"
        
        # Execute query
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # Convert to list of dictionaries
        result = []
        for log in logs:
            result.append({
                'id': log['id'],
                'user_id': log['user_id'],
                'username': log['username'],
                'action': log['action'],
                'details': log['details'],
                'timestamp': log['timestamp']
            })
            
        conn.close()
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch audit logs: {str(e)}'}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        # Cek apakah pengguna adalah admin
        claims = get_jwt()
        username = claims.get('username')
        is_admin = claims.get('is_admin') == True or claims.get('role') == 'admin'
        
        print(f"get_users: Request from user {username}, is_admin={is_admin}")
        
        if not is_admin:
            print(f"get_users: Access denied for user {username}, not an admin")
            return jsonify({'error': 'Unauthorized access, only admin users can manage users'}), 403
        
        # Ambil semua user dari database
        users = User.get_all()
        
        # Pastikan users adalah array
        if users is None:
            return jsonify([]), 200
            
        # Format response - pastikan kita selalu mengembalikan array
        users_list = [user.to_dict() for user in users]
        
        print(f"get_users: Successfully fetched {len(users_list)} users")
        
        return jsonify(users_list), 200
    except Exception as e:
        print(f"get_users: Error fetching users: {str(e)}")
        import traceback
        traceback.print_exc()
        # Kembalikan array kosong jika terjadi error
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    try:
        # Cek apakah pengguna adalah admin
        claims = get_jwt()
        username = claims.get('username')
        is_admin = claims.get('is_admin') == True or claims.get('role') == 'admin'
        
        print(f"create_user: Request from user {username}, is_admin={is_admin}, claims={claims}")
        
        if not is_admin:
            print(f"create_user: Access denied for user {username}, not an admin")
            return jsonify({'error': 'Unauthorized access, only admins can manage users'}), 403
        
        data = request.get_json()
        print(f"create_user: Received data: {data}")
        
        # Validasi data
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        if not data.get('username'):
            return jsonify({'error': 'Username is required'}), 400
            
        if not data.get('password'):
            return jsonify({'error': 'Password is required'}), 400
        
        # Cek apakah username sudah ada
        existing_user = User.get_by_username(data['username'])
        if existing_user:
            print(f"create_user: Username {data['username']} already exists")
            return jsonify({'error': 'Username already exists'}), 400
        
        # Buat user baru
        is_admin_user = data.get('role') == 'admin'
        role = data.get('role', 'user')
        
        print(f"create_user: Creating user {data['username']} with role={role}, is_admin={is_admin_user}")
        
        user = User.create(
            username=data['username'],
            email=data.get('email', ''),
            password=data['password'],
            is_admin=is_admin_user,
            role=role
        )
        
        print(f"create_user: User {data['username']} created successfully")
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        print(f"create_user: Error creating user: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        # Cek apakah pengguna adalah admin
        claims = get_jwt()
        username = claims.get('username')
        is_admin = claims.get('is_admin') == True or claims.get('role') == 'admin'
        
        print(f"delete_user: Request from user {username}, is_admin={is_admin}, target user_id={user_id}")
        
        if not is_admin:
            print(f"delete_user: Access denied for user {username}, not an admin")
            return jsonify({'error': 'Unauthorized access, only admin users can manage users'}), 403
        
        # Cari user yang akan dihapus
        user = User.get_by_id(user_id)
        
        if not user:
            print(f"delete_user: User {user_id} not found")
            return jsonify({'error': 'User not found'}), 404
        
        # Jangan izinkan penghapusan pengguna ladyqiu
        if user.username == 'ladyqiu':
            print(f"delete_user: Attempt to delete superuser ladyqiu prevented")
            return jsonify({'error': 'Cannot delete superuser account'}), 403
        
        # Hapus user
        success = User.delete(user_id)
        
        if success:
            print(f"delete_user: User {user_id} deleted successfully")
            return jsonify({'message': 'User deleted successfully'}), 200
        else:
            print(f"delete_user: Failed to delete user {user_id}")
            return jsonify({'error': 'Failed to delete user'}), 500
    except Exception as e:
        print(f"delete_user: Error deleting user: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>/simple-permissions', methods=['GET'])
@jwt_required()
def get_simple_user_permissions(user_id):
    """
    Endpoint yang lebih sederhana untuk mendapatkan izin pengguna
    tanpa mencoba membuat tabel atau mengelola database kompleks.
    """
    try:
        # Log request
        print(f"get_simple_user_permissions: Requested for user {user_id}")
        
        # Verifikasi token dan peran
        claims = get_jwt()
        print(f"Token claims: {claims}")
        
        # Cek apakah pengguna adalah admin
        is_admin = claims.get('is_admin') == True or claims.get('role') == 'admin'
        
        if not is_admin:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        # Dapatkan user
        target_user = User.get_by_id(user_id)
        if not target_user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
            
        # Tentukan izin berdasarkan peran
        permissions = []
        user_role = target_user.role
        
        if user_role == 'admin' or target_user.is_admin:
            # Admin memiliki semua izin
            permissions = [
                'excel:create', 'excel:read', 'excel:update', 'excel:delete',
                'query:create', 'query:read', 'query:update', 'query:delete', 'query:execute',
                'database:read', 'database:modify',
                'setup:create', 'setup:read',
                'user:create', 'user:read', 'user:update', 'user:delete'
            ]
        else:
            # User biasa memiliki izin standar yang ditingkatkan
            permissions = [
                'excel:create', 'excel:read', 'excel:update', 'excel:delete',
                'query:create', 'query:read', 'query:update', 'query:delete', 'query:execute',
                'database:read',
                'setup:read',
                'user:read'
            ]
        
        # Return response
        return jsonify({
            'user_id': user_id,
            'username': target_user.username,
            'role': target_user.role or ('admin' if target_user.is_admin else 'user'),
            'permissions': permissions
        }), 200
        
    except Exception as e:
        print(f"Error in get_simple_user_permissions: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>/permissions', methods=['GET'])
@jwt_required()
def get_user_permissions(user_id):
    try:
        # Debug info
        print(f"get_user_permissions: Fetching permissions for user {user_id}")
        
        # Cek apakah pengguna adalah admin
        user_identity = get_jwt_identity()
        claims = get_jwt()
        
        print(f"get_user_permissions: Request from user {user_identity}, claims: {claims}")
        
        # Pastikan hanya admin yang bisa melihat izin atau user melihat izinnya sendiri
        is_admin = False
        is_self = str(user_id) == str(user_identity)
        
        if claims.get('is_admin') == True or claims.get('role') == 'admin':
            is_admin = True
        else:
            current_user = User.get_by_id(user_identity)
            if current_user and current_user.is_admin:
                is_admin = True
                
        if not is_admin and not is_self:
            print(f"get_user_permissions: Unauthorized attempt by {user_identity}")
            return jsonify({'error': 'Tidak memiliki izin untuk melihat izin akses pengguna ini'}), 403
            
        # Dapatkan user yang akan dilihat izinnya
        target_user = User.get_by_id(user_id)
        if not target_user:
            print(f"get_user_permissions: User {user_id} not found")
            return jsonify({'error': 'Pengguna tidak ditemukan'}), 404
            
        # Dapatkan izin dari database
        try:
            conn = User.get_db_connection()
            cursor = conn.cursor()
            
            # Cek apakah tabel user_permissions ada
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='user_permissions'
            """)
            
            if not cursor.fetchone():
                # Tabel belum ada, kembalikan izin default berdasarkan role
                conn.close()
                
                # Tentukan role
                user_role = 'user'
                if target_user.is_admin:
                    user_role = 'admin'
                
                # Berikan izin default berdasarkan role
                default_permissions = get_default_permissions(user_role)
                
                return jsonify({
                    'success': True,
                    'user_id': user_id,
                    'role': user_role,
                    'permissions': default_permissions,
                    'is_default': True
                }), 200
                
            # Ambil izin dari database
            cursor.execute(
                "SELECT permission FROM user_permissions WHERE user_id = ?",
                (user_id,)
            )
            
            permissions = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            # Tentukan role berdasarkan izin
            role = 'user'
            if target_user.is_admin:
                role = 'admin'
                
            return jsonify({
                'success': True,
                'user_id': user_id,
                'role': role,
                'permissions': permissions,
                'is_default': False
            }), 200
            
        except sqlite3.Error as sql_error:
            print(f"get_user_permissions: Database error: {str(sql_error)}")
            return jsonify({'error': f'Kesalahan database: {str(sql_error)}'}), 500
            
    except Exception as e:
        print(f"get_user_permissions: Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Kesalahan tidak terduga: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>/permissions', methods=['PUT'])
@jwt_required()
def update_user_permissions(user_id):
    try:
        # Debug info
        print(f"update_user_permissions: Attempting to update permissions for user {user_id}")
        
        # Cek apakah pengguna adalah admin
        user_identity = get_jwt_identity()
        claims = get_jwt()
        
        print(f"update_user_permissions: Request from user {user_identity}, claims: {claims}")
        
        # Pastikan hanya admin yang bisa mengubah izin
        is_admin = False
        if claims.get('is_admin') == True or claims.get('role') == 'admin':
            is_admin = True
        else:
            current_user = User.get_by_id(user_identity)
            if current_user and current_user.is_admin:
                is_admin = True
                
        if not is_admin:
            print(f"update_user_permissions: Unauthorized attempt by {user_identity}")
            return jsonify({'error': 'Tidak memiliki izin untuk mengubah izin akses pengguna'}), 403
            
        # Dapatkan user yang akan diubah izinnya
        target_user = User.get_by_id(user_id)
        if not target_user:
            print(f"update_user_permissions: User {user_id} not found")
            return jsonify({'error': 'Pengguna tidak ditemukan'}), 404
            
        # Dapatkan data izin dari request
        data = request.get_json()
        print(f"update_user_permissions: Received request data: {data}")
        
        if not data or 'permissions' not in data:
            print("update_user_permissions: No permissions data in request")
            return jsonify({'error': 'Data izin tidak ditemukan dalam permintaan'}), 400
            
        permissions = data['permissions']
        if not isinstance(permissions, list):
            print(f"update_user_permissions: Invalid permissions data type: {type(permissions)}")
            return jsonify({'error': 'Data izin harus berupa array'}), 400
            
        # Validasi izin yang dikirim
        valid_permissions = [
            'excel:create', 'excel:read', 'excel:update', 'excel:delete',
            'query:create', 'query:read', 'query:update', 'query:delete', 'query:execute',
            'database:read', 'database:modify',
            'setup:create', 'setup:read',
            'user:create', 'user:read', 'user:update', 'user:delete'
        ]
        
        # Sanitasi izin
        valid_permissions_only = []
        invalid_permissions = []
        
        for permission in permissions:
            if permission in valid_permissions:
                valid_permissions_only.append(permission)
            else:
                invalid_permissions.append(permission)
                
        if invalid_permissions:
            print(f"update_user_permissions: Found invalid permissions: {invalid_permissions}")
            
        # Simpan izin ke database
        try:
            conn = User.get_db_connection()
            cursor = conn.cursor()
            
            # Cek apakah tabel user_permissions ada, jika tidak buat
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    permission TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    UNIQUE(user_id, permission)
                )
            """)
            
            # Hapus semua izin yang ada
            cursor.execute("DELETE FROM user_permissions WHERE user_id = ?", (user_id,))
            print(f"update_user_permissions: Deleted existing permissions for user {user_id}")
            
            # Tambahkan izin baru
            for permission in valid_permissions_only:
                cursor.execute(
                    "INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)",
                    (user_id, permission)
                )
                
            conn.commit()
            conn.close()
            
            print(f"update_user_permissions: Successfully updated permissions for user {user_id}")
            
            # Tentukan role baru berdasarkan izin
            new_role = 'user'  # Default role
            
            # Jika memiliki izin admin, set sebagai admin
            if any(p in valid_permissions_only for p in ['user:create', 'user:update', 'user:delete']):
                new_role = 'admin'
                
            # Update is_admin flag berdasarkan role
            conn = User.get_db_connection()
            cursor = conn.cursor()
            
            is_admin_value = 1 if new_role == 'admin' else 0
            cursor.execute(
                "UPDATE users SET is_admin = ? WHERE id = ?",
                (is_admin_value, user_id)
            )
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Izin akses berhasil diperbarui',
                'user_id': user_id,
                'role': new_role,
                'permissions': valid_permissions_only
            }), 200
            
        except sqlite3.Error as sql_error:
            print(f"update_user_permissions: Database error: {str(sql_error)}")
            return jsonify({'error': f'Kesalahan database: {str(sql_error)}'}), 500
            
    except Exception as e:
        print(f"update_user_permissions: Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Kesalahan tidak terduga: {str(e)}'}), 500

# Helper function untuk mendapatkan izin default berdasarkan role
def get_default_permissions(role):
    if role == 'admin':
        return [
            'excel:create', 'excel:read', 'excel:update', 'excel:delete',
            'query:create', 'query:read', 'query:update', 'query:delete', 'query:execute',
            'database:read', 'database:modify',
            'setup:create', 'setup:read',
            'user:create', 'user:read', 'user:update', 'user:delete'
        ]
    else:  # user
        return [
            'excel:create', 'excel:read', 'excel:update', 'excel:delete',
            'query:create', 'query:read', 'query:update', 'query:delete', 'query:execute',
            'database:read',
            'setup:read',
            'user:read'
        ]

@auth_bp.route('/debug-token', methods=['GET'])
def debug_token():
    """
    Endpoint untuk validasi dan debug token.
    Digunakan oleh frontend untuk memeriksa status token.
    """
    try:
        # Ambil Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'status': 'error',
                'data': {
                    'token': {
                        'valid': False,
                        'error': 'Token tidak tersedia atau format tidak valid'
                    }
                }
            }), 401
        
        # Ekstrak token
        token = auth_header.split(' ')[1]
        
        try:
            # Decode token tanpa verifikasi tambahan
            decoded = decode_token(token)
            print(f"Token debug: {decoded}")
            
            # Kembalikan informasi token yang berhasil di-decode
            return jsonify({
                'status': 'success',
                'data': {
                    'token': {
                        'valid': True,
                        'sub': decoded.get('sub', 'unknown'),
                        'username': decoded.get('username', 'unknown'),
                        'role': decoded.get('role', 'user'),
                        'is_admin': decoded.get('is_admin', False),
                        'exp': decoded.get('exp')
                    }
                }
            }), 200
            
        except Exception as e:
            # Token tidak valid
            print(f"Error decoding token: {str(e)}")
            return jsonify({
                'status': 'error',
                'data': {
                    'token': {
                        'valid': False,
                        'error': str(e)
                    }
                }
            }), 401
    
    except Exception as e:
        print(f"Error in debug-token endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500
