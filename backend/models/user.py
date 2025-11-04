from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid
from datetime import datetime

class User(UserMixin):
    def __init__(self, id, username, email, password_hash, is_admin=False, role=None):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_admin = is_admin
        self.role = role if role else ('admin' if is_admin else 'user')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        # Menentukan role berdasarkan yang tersimpan di database atau fallback ke is_admin
        try:
            role = getattr(self, 'role', None)
        except Exception:
            role = None
            
        if not role:
            role = 'admin' if self.is_admin else 'user'
        
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'role': role
        }

    @staticmethod
    def get_db_connection():
        conn = sqlite3.connect('instance/app.db')
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def get_by_id(cls, user_id):
        try:
            # Pastikan user_id adalah integer
            if user_id is None:
                print(f"User.get_by_id: user_id is None")
                return None
                
            # Coba konversi user_id ke integer jika diperlukan
            if not isinstance(user_id, int):
                try:
                    user_id = int(user_id)
                except (ValueError, TypeError) as e:
                    print(f"User.get_by_id: Error converting user_id to int: {user_id}, error: {str(e)}")
                    return None
            
            conn = cls.get_db_connection()
            cursor = conn.cursor()
            
            print(f"User.get_by_id: Querying for user_id={user_id}, type={type(user_id)}")
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_data = cursor.fetchone()
            
            conn.close()
            
            if user_data:
                # Pastikan role ada (kompatibel dengan database lama)
                role = None
                try:
                    # Coba akses kolom role
                    role = user_data['role']
                except (IndexError, KeyError):
                    # Jika kolom role tidak ada, gunakan None
                    pass
                
                return cls(
                    id=user_data['id'],
                    username=user_data['username'],
                    email=user_data['email'],
                    password_hash=user_data['password_hash'],
                    is_admin=bool(user_data['is_admin']),
                    role=role
                )
            
            print(f"User.get_by_id: No user found with id={user_id}")
            return None
        except sqlite3.Error as db_error:
            print(f"User.get_by_id: Database error for user_id={user_id}: {str(db_error)}")
            return None
        except Exception as e:
            print(f"User.get_by_id: Unexpected error for user_id={user_id}: {str(e)}")
            return None

    @classmethod
    def get_by_username(cls, username):
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_data = cursor.fetchone()
        
        conn.close()
        
        if user_data:
            # Pastikan role ada (kompatibel dengan database lama)
            role = None
            try:
                # Coba akses kolom role
                role = user_data['role']
            except (IndexError, KeyError):
                # Jika kolom role tidak ada, gunakan None
                pass
            
            return cls(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                is_admin=bool(user_data['is_admin']),
                role=role
            )
        return None

    @classmethod
    def get_by_email(cls, email):
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user_data = cursor.fetchone()
        
        conn.close()
        
        if user_data:
            # Pastikan role ada (kompatibel dengan database lama)
            role = None
            try:
                # Coba akses kolom role
                role = user_data['role']
            except (IndexError, KeyError):
                # Jika kolom role tidak ada, gunakan None
                pass
            
            return cls(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                password_hash=user_data['password_hash'],
                is_admin=bool(user_data['is_admin']),
                role=role
            )
        return None

    @classmethod
    def create(cls, username, email, password, is_admin=False, role='user'):
        try:
            print(f"User.create: Creating new user {username}, is_admin={is_admin}, role={role}")
            conn = cls.get_db_connection()
            cursor = conn.cursor()
            
            password_hash = generate_password_hash(password)
            
            # Periksa apakah tabel users memiliki kolom role
            cursor.execute("PRAGMA table_info(users)")
            columns_info = cursor.fetchall()
            columns = [col[1] for col in columns_info]
            print(f"User.create: Table columns: {columns}")
            
            user_id = None
            
            if 'role' in columns:
                print(f"User.create: Using query with role column")
                # Jika kolom role ada, gunakan query dengan role
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash, is_admin, role) VALUES (?, ?, ?, ?, ?)",
                    (username, email, password_hash, 1 if is_admin else 0, role)
                )
            else:
                print(f"User.create: Role column does not exist, adding it")
                # Jika kolom role tidak ada, coba tambahkan dulu
                try:
                    cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
                    print(f"User.create: Role column added successfully")
                    
                    # Sekarang insert dengan role
                    cursor.execute(
                        "INSERT INTO users (username, email, password_hash, is_admin, role) VALUES (?, ?, ?, ?, ?)",
                        (username, email, password_hash, 1 if is_admin else 0, role)
                    )
                except Exception as e:
                    print(f"User.create: Error adding role column: {e}")
                    # Jika gagal menambahkan kolom, gunakan query tanpa role
                    cursor.execute(
                        "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
                        (username, email, password_hash, 1 if is_admin else 0)
                    )
            
            conn.commit()
            
            # Get the ID of the inserted user
            user_id = cursor.lastrowid
            print(f"User.create: User created with ID {user_id}")
            
            # Verifikasi user telah tersimpan dengan benar
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            saved_user = cursor.fetchone()
            if saved_user:
                print(f"User.create: User verification successful, found: {dict(saved_user)}")
            else:
                print(f"User.create: User verification failed, not found with ID {user_id}")
            
            conn.close()
            
            return cls(
                id=user_id,
                username=username,
                email=email,
                password_hash=password_hash,
                is_admin=is_admin,
                role=role
            )
        except Exception as e:
            print(f"User.create: Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            raise

    @classmethod
    def update(cls, user_id, data):
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        
        # Build SQL query based on provided data
        set_clauses = []
        values = []
        
        if 'username' in data:
            set_clauses.append("username = ?")
            values.append(data['username'])
        
        if 'email' in data:
            set_clauses.append("email = ?")
            values.append(data['email'])
        
        if 'password' in data:
            set_clauses.append("password_hash = ?")
            values.append(generate_password_hash(data['password']))
        
        if 'is_admin' in data:
            set_clauses.append("is_admin = ?")
            values.append(data['is_admin'])
        
        if not set_clauses:
            return False
        
        sql = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ?"
        values.append(user_id)
        
        cursor.execute(sql, values)
        conn.commit()
        
        success = cursor.rowcount > 0
        conn.close()
        
        return success

    @classmethod
    def delete(cls, user_id):
        conn = cls.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        
        success = cursor.rowcount > 0
        conn.close()
        
        return success

    @classmethod
    def get_all_users(cls):
        try:
            print("User.get_all_users: Attempting to get database connection")
            conn = cls.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM users")
            user_rows = cursor.fetchall()
            
            conn.close()
            
            users = []
            for user_data in user_rows:
                try:
                    # Pastikan role ada (kompatibel dengan database lama)
                    role = None
                    try:
                        # Coba akses kolom role
                        role = user_data['role']
                    except (IndexError, KeyError):
                        # Jika kolom role tidak ada, gunakan None
                        pass
                    
                    user = cls(
                        id=user_data['id'],
                        username=user_data['username'],
                        email=user_data['email'],
                        password_hash=user_data['password_hash'],
                        is_admin=bool(user_data['is_admin']),
                        role=role
                    )
                    users.append(user)
                except Exception as e:
                    print(f"Error processing user data: {str(e)}")
                    # Lanjutkan pemrosesan untuk data lain
                    continue
            
            return users
        except Exception as e:
            print(f"User.get_all_users: Error: {str(e)}")
            return []  # Return empty array on error, never None

    # Alias untuk get_all_users
    get_all = get_all_users 