import os
import sqlite3
import json
from datetime import datetime
from collections import Counter
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint('dashboard', __name__)

# Helper function to get DB connection
def get_db_connection():
    conn = sqlite3.connect('instance/app.db')
    conn.row_factory = sqlite3.Row
    return conn

# Helper function to get setup-request DB connection
def get_setup_request_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'shop_mapping.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@dashboard_bp.route('/configs', methods=['GET'])
@jwt_required()
def get_dashboard_configs():
    """Get all dashboard configurations for the current user"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM dashboard_configs WHERE user_id = ? ORDER BY updated_at DESC",
        (user_id,)
    )
    
    configs = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'id': config['id'],
        'name': config['name'],
        'updated_at': config['updated_at']
    } for config in configs]), 200

@dashboard_bp.route('/configs/<config_id>', methods=['GET'])
@jwt_required()
def get_dashboard_config(config_id):
    """Get a specific dashboard configuration"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM dashboard_configs WHERE id = ? AND user_id = ?",
        (config_id, user_id)
    )
    
    config = cursor.fetchone()
    conn.close()
    
    if not config:
        return jsonify({'error': 'Dashboard configuration not found or you do not have access'}), 404
    
    # Parse the stored JSON configuration
    try:
        config_data = json.loads(config['config'])
        
        return jsonify({
            'id': config['id'],
            'name': config['name'],
            'config': config_data,
            'created_at': config['created_at'],
            'updated_at': config['updated_at']
        }), 200
    
    except Exception as e:
        return jsonify({'error': f"Error parsing dashboard configuration: {str(e)}"}), 500

@dashboard_bp.route('/configs', methods=['POST'])
@jwt_required()
def create_dashboard_config():
    """Create a new dashboard configuration"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('config'):
        return jsonify({'error': 'Name and configuration are required'}), 400
    
    # Validate the configuration format
    try:
        # Ensure config is a JSON string
        if isinstance(data['config'], dict):
            config_json = json.dumps(data['config'])
        else:
            config_json = data['config']
            # Validate that it's valid JSON
            json.loads(config_json)
    
    except Exception as e:
        return jsonify({'error': f"Invalid configuration format: {str(e)}"}), 400
    
    # Create a new dashboard configuration
    conn = get_db_connection()
    cursor = conn.cursor()
    
    config_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO dashboard_configs (id, name, config, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        (config_id, data['name'], config_json, user_id, created_at, created_at)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': config_id,
        'name': data['name'],
        'created_at': created_at,
        'updated_at': created_at
    }), 201

@dashboard_bp.route('/configs/<config_id>', methods=['PUT'])
@jwt_required()
def update_dashboard_config(config_id):
    """Update an existing dashboard configuration"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the configuration exists and belongs to the user
    cursor.execute(
        "SELECT * FROM dashboard_configs WHERE id = ? AND user_id = ?",
        (config_id, user_id)
    )
    
    config = cursor.fetchone()
    
    if not config:
        conn.close()
        return jsonify({'error': 'Dashboard configuration not found or you do not have access'}), 404
    
    # Update the configuration
    updates = {}
    
    if 'name' in data:
        updates['name'] = data['name']
    
    if 'config' in data:
        try:
            # Ensure config is a JSON string
            if isinstance(data['config'], dict):
                updates['config'] = json.dumps(data['config'])
            else:
                updates['config'] = data['config']
                # Validate that it's valid JSON
                json.loads(updates['config'])
        
        except Exception as e:
            conn.close()
            return jsonify({'error': f"Invalid configuration format: {str(e)}"}), 400
    
    if not updates:
        conn.close()
        return jsonify({'error': 'No valid updates provided'}), 400
    
    # Set the updated timestamp
    updated_at = datetime.now().isoformat()
    updates['updated_at'] = updated_at
    
    # Build the SQL update statement
    set_clause = ', '.join([f"{key} = ?" for key in updates.keys()])
    values = list(updates.values()) + [config_id]
    
    cursor.execute(
        f"UPDATE dashboard_configs SET {set_clause} WHERE id = ?",
        values
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': config_id,
        'name': data.get('name', config['name']),
        'updated_at': updated_at
    }), 200

@dashboard_bp.route('/configs/<config_id>', methods=['DELETE'])
@jwt_required()
def delete_dashboard_config(config_id):
    """Delete a dashboard configuration"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the configuration exists and belongs to the user
    cursor.execute(
        "SELECT * FROM dashboard_configs WHERE id = ? AND user_id = ?",
        (config_id, user_id)
    )
    
    config = cursor.fetchone()
    
    if not config:
        conn.close()
        return jsonify({'error': 'Dashboard configuration not found or you do not have access'}), 404
    
    # Delete the configuration
    cursor.execute(
        "DELETE FROM dashboard_configs WHERE id = ?",
        (config_id,)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Dashboard configuration deleted successfully'}), 200

@dashboard_bp.route('/setup-request-analytics', methods=['GET'])
@jwt_required(optional=True)  # Make JWT optional for testing
def get_setup_request_analytics():
    """Get analytics data from setup-request processing"""
    try:
        # Import the analytics function from setup_request database
        from setup_request.database import get_setup_request_analytics_summary
        
        # Get analytics summary
        analytics_data = get_setup_request_analytics_summary()
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        return jsonify({'error': f"Error getting setup-request analytics: {str(e)}"}), 500

@dashboard_bp.route('/data', methods=['POST'])
@jwt_required()
def get_dashboard_data():
    """Get data for dashboard visualizations"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('query_id'):
        return jsonify({'error': 'Query ID is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the specified query
    cursor.execute(
        "SELECT * FROM queries WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
        (data['query_id'], user_id)
    )
    
    query = cursor.fetchone()
    
    if not query:
        conn.close()
        return jsonify({'error': 'Query not found or you do not have access'}), 404
    
    # Execute the query to get data
    try:
        cursor.execute(query['query_text'])
        results = cursor.fetchall()
        
        # Convert rows to dictionaries
        result_list = []
        for row in results:
            row_dict = {}
            for key in row.keys():
                row_dict[key] = row[key]
            result_list.append(row_dict)
        
        # Get column names from the first row if available
        columns = []
        if result_list and len(result_list) > 0:
            columns = list(result_list[0].keys())
        
        conn.close()
        
        return jsonify({
            'query_id': data['query_id'],
            'query_name': query['name'],
            'columns': columns,
            'data': result_list
        }), 200
    
    except Exception as e:
        conn.close()
        return jsonify({'error': f"Error executing query: {str(e)}"}), 400 