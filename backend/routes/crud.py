from flask import Blueprint, request, jsonify
import sqlite3
import os

crud_bp = Blueprint('crud', __name__)

# Database connection helper
def get_db_connection():
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

# Get all tables in database
@crud_bp.route('/tables', methods=['GET'])
def get_tables():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # SQLite specific query to get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row['name'] for row in cursor.fetchall() if not row['name'].startswith('sqlite_')]
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "data": tables
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Get table structure
@crud_bp.route('/tables/<table_name>/structure', methods=['GET'])
def get_table_structure(table_name):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = [{'name': row['name'], 'type': row['type']} for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "data": columns
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Get all records from table
@crud_bp.route('/tables/<table_name>/records', methods=['GET'])
def get_table_records(table_name):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        offset = (page - 1) * per_page
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) as count FROM {table_name};")
        total = cursor.fetchone()['count']
        
        # Get paginated data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT {per_page} OFFSET {offset};")
        records = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "data": {
                "records": records,
                "pagination": {
                    "total": total,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total + per_page - 1) // per_page
                }
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Add new record to table
@crud_bp.route('/tables/<table_name>/records', methods=['POST'])
def add_record(table_name):
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Construct the SQL query
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        values = list(data.values())
        
        cursor.execute(f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders});", values)
        conn.commit()
        
        # Get the ID of the inserted record
        new_id = cursor.lastrowid
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Record added successfully",
            "id": new_id
        }), 201
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Update a record
@crud_bp.route('/tables/<table_name>/records/<int:record_id>', methods=['PUT'])
def update_record(table_name, record_id):
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Construct the SQL query
        set_clause = ', '.join([f"{key} = ?" for key in data.keys()])
        values = list(data.values())
        
        cursor.execute(f"UPDATE {table_name} SET {set_clause} WHERE rowid = ?;", values + [record_id])
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                "status": "error",
                "message": f"Record with ID {record_id} not found"
            }), 404
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Record updated successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# Delete a record
@crud_bp.route('/tables/<table_name>/records/<int:record_id>', methods=['DELETE'])
def delete_record(table_name, record_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"DELETE FROM {table_name} WHERE rowid = ?;", [record_id])
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({
                "status": "error",
                "message": f"Record with ID {record_id} not found"
            }), 404
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Record deleted successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500 

@crud_bp.route('/api/monitoring/remark', methods=['POST'])
def update_monitoring_remark():
    data = request.get_json()
    system_ref_id = data.get('system_ref_id')
    remark = data.get('remark')
    if not system_ref_id or remark is None:
        return jsonify({'error': 'system_ref_id and remark are required'}), 400
    try:
        db_path = os.path.join(os.path.dirname(__file__), '../instance/app.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('UPDATE monitoring SET remark = ? WHERE system_ref_id = ?', (remark, system_ref_id))
        updated = cursor.rowcount
        if updated == 0:
            cursor.execute('INSERT INTO monitoring (system_ref_id, remark) VALUES (?, ?)', (system_ref_id, remark))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Remark inserted for new ID'}), 201
        conn.commit()
        conn.close()
        return jsonify({'message': 'Remark updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 