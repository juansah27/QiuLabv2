from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid
import pandas as pd
from datetime import datetime
import sqlite3
import json

excel_bp = Blueprint('excel', __name__)

# Helper function to get DB connection
def get_db_connection():
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

@excel_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_excel():
    """Upload an Excel file for processing"""
    user_id = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith(('.xlsx', '.xls')):
        # Generate unique filename
        original_filename = file.filename
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}_{original_filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # Save the file
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Save file metadata to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO excel_files (id, filename, original_filename, user_id, upload_date, file_size) VALUES (?, ?, ?, ?, ?, ?)",
            (unique_id, filename, original_filename, user_id, datetime.now().isoformat(), file_size)
        )
        
        conn.commit()
        conn.close()
        
        # Try to read the Excel file to return a preview
        try:
            df = pd.read_excel(file_path)
            preview = df.head(5).to_dict(orient='records')
            columns = df.columns.tolist()
            
            return jsonify({
                'message': 'File uploaded successfully',
                'file_id': unique_id,
                'filename': original_filename,
                'columns': columns,
                'preview': preview
            }), 201
        
        except Exception as e:
            return jsonify({
                'message': 'File uploaded but could not generate preview',
                'file_id': unique_id,
                'filename': original_filename,
                'error': str(e)
            }), 201
    
    return jsonify({'error': 'Invalid file format. Only Excel files (.xlsx, .xls) are allowed'}), 400

@excel_bp.route('/files', methods=['GET'])
@jwt_required()
def get_excel_files():
    """Get all Excel files uploaded by the current user"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM excel_files WHERE user_id = ? ORDER BY upload_date DESC",
        (user_id,)
    )
    
    files = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': file['id'],
        'filename': file['original_filename'],
        'upload_date': file['upload_date'],
        'size': file['file_size']
    } for file in files]), 200

@excel_bp.route('/files/<file_id>', methods=['GET'])
@jwt_required()
def get_excel_file(file_id):
    """Get information about a specific Excel file"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM excel_files WHERE id = ? AND user_id = ?",
        (file_id, user_id)
    )
    
    file = cursor.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'File not found or you do not have access'}), 404
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file['filename'])
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    # Get basic file info
    file_info = {
        'id': file['id'],
        'filename': file['original_filename'],
        'upload_date': file['upload_date'],
        'size': file['file_size']
    }
    
    # Add sheet names and columns
    try:
        excel_file = pd.ExcelFile(file_path)
        sheets = {}
        
        for sheet_name in excel_file.sheet_names:
            df = excel_file.parse(sheet_name)
            sheets[sheet_name] = {
                'columns': df.columns.tolist(),
                'rows': len(df)
            }
        
        file_info['sheets'] = sheets
    except Exception as e:
        file_info['error'] = f"Error getting sheet information: {str(e)}"
    
    return jsonify(file_info), 200

@excel_bp.route('/files/<file_id>/download', methods=['GET'])
@jwt_required()
def download_excel_file(file_id):
    """Download an Excel file"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM excel_files WHERE id = ? AND user_id = ?",
        (file_id, user_id)
    )
    
    file = cursor.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'File not found or you do not have access'}), 404
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file['filename'])
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    return send_file(file_path, as_attachment=True, download_name=file['original_filename'])

@excel_bp.route('/files/<file_id>/preview', methods=['GET'])
@jwt_required()
def preview_excel_file(file_id):
    """Get a preview of an Excel file with option to specify sheet and rows"""
    user_id = get_jwt_identity()
    
    # Get query parameters
    sheet_name = request.args.get('sheet', 0)  # Default to first sheet
    rows = int(request.args.get('rows', 10))   # Default to 10 rows
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM excel_files WHERE id = ? AND user_id = ?",
        (file_id, user_id)
    )
    
    file = cursor.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'File not found or you do not have access'}), 404
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file['filename'])
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    try:
        # Read the specified sheet
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        # Get preview data
        preview = df.head(rows).to_dict(orient='records')
        columns = df.columns.tolist()
        total_rows = len(df)
        
        return jsonify({
            'sheet_name': sheet_name,
            'total_rows': total_rows,
            'columns': columns,
            'preview': preview
        }), 200
    
    except Exception as e:
        return jsonify({'error': f"Error generating preview: {str(e)}"}), 400

@excel_bp.route('/files/<file_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_excel_file(file_id):
    """Perform analysis on an Excel file based on specified operations"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No analysis parameters provided'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM excel_files WHERE id = ? AND user_id = ?",
        (file_id, user_id)
    )
    
    file = cursor.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'File not found or you do not have access'}), 404
    
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file['filename'])
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    try:
        # Get analysis parameters
        sheet_name = data.get('sheet', 0)
        operations = data.get('operations', [])
        
        # Read the Excel file
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        # Apply operations (this is a simplified example)
        results = {}
        
        for op in operations:
            op_type = op.get('type')
            
            if op_type == 'describe':
                # Statistical description
                results['describe'] = json.loads(df.describe().to_json())
            
            elif op_type == 'count':
                # Count values in a column
                column = op.get('column')
                if column in df.columns:
                    results[f'count_{column}'] = df[column].value_counts().to_dict()
            
            elif op_type == 'filter':
                # Filter data
                column = op.get('column')
                value = op.get('value')
                if column in df.columns:
                    filtered_df = df[df[column] == value]
                    results[f'filter_{column}_{value}'] = filtered_df.head(20).to_dict(orient='records')
            
            elif op_type == 'group':
                # Group by
                column = op.get('column')
                agg_column = op.get('agg_column')
                agg_func = op.get('agg_func', 'mean')
                
                if column in df.columns and agg_column in df.columns:
                    grouped = df.groupby(column)[agg_column].agg(agg_func).to_dict()
                    results[f'group_{column}_{agg_column}_{agg_func}'] = grouped
        
        return jsonify({
            'file_id': file_id,
            'filename': file['original_filename'],
            'sheet_name': sheet_name,
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({'error': f"Error performing analysis: {str(e)}"}), 400 