import sqlite3
import logging
import os

def get_db_path(db_name="shop_mapping.db"):
    """Get the full path to the database file"""
    SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(SCRIPT_DIR, db_name)

def initialize_database(db_file=None):
    """Initialize the SQLite database with required tables"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create shop_mapping table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS shop_mapping (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marketplace TEXT NOT NULL,
            client TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            client_id TEXT
        )
        """)
        
        # Create setup_request_analytics table for storing processed data
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS setup_request_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT NOT NULL,
            client TEXT NOT NULL,
            marketplace TEXT NOT NULL,
            gift_type TEXT NOT NULL,
            process_type TEXT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            shop_id TEXT,
            client_id TEXT
        )
        """)
        
        conn.commit()
        conn.close()
        logging.info("Database initialized successfully")
        return True
    except Exception as e:
        logging.error(f"Error initializing database: {str(e)}")
        return False

def add_shop_mapping(marketplace, client, shop_id, client_id=None, db_file=None):
    """Add or update shop mapping in database"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Check if mapping already exists
        cursor.execute(
            "SELECT id FROM shop_mapping WHERE marketplace = ? AND client = ?", 
            (marketplace, client)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing mapping
            cursor.execute(
                "UPDATE shop_mapping SET shop_id = ?, client_id = ? WHERE id = ?",
                (shop_id, client_id, existing[0])
            )
            logging.info(f"Updated mapping for {marketplace}/{client} to shop_id {shop_id}")
        else:
            # Insert new mapping
            cursor.execute(
                "INSERT INTO shop_mapping (marketplace, client, shop_id, client_id) VALUES (?, ?, ?, ?)",
                (marketplace, client, shop_id, client_id)
            )
            logging.info(f"Added new mapping for {marketplace}/{client} with shop_id {shop_id}")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logging.error(f"Error adding shop mapping: {str(e)}")
        return False

def get_all_shop_mappings(db_file=None):
    """Get all shop mappings from database"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, marketplace, client, shop_id, client_id FROM shop_mapping")
        mappings = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return mappings
    except Exception as e:
        logging.error(f"Error getting shop mappings: {str(e)}")
        return []

def delete_shop_mapping(mapping_id, db_file=None):
    """Delete shop mapping from database"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM shop_mapping WHERE id = ?", (mapping_id,))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logging.error(f"Error deleting shop mapping: {str(e)}")
        return False

def save_setup_request_analytics(request_id, client, marketplace, gift_type, process_type, created_by, shop_id=None, client_id=None, db_file=None):
    """Save setup request analytics data"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO setup_request_analytics 
        (request_id, client, marketplace, gift_type, process_type, created_by, shop_id, client_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (request_id, client, marketplace, gift_type, process_type, created_by, shop_id, client_id))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logging.error(f"Error saving setup request analytics: {str(e)}")
        return False

def get_setup_request_analytics(db_file=None):
    """Get all setup request analytics data"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT id, request_id, client, marketplace, gift_type, process_type, 
               created_by, created_at, shop_id, client_id 
        FROM setup_request_analytics 
        ORDER BY created_at DESC
        """)
        
        analytics = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return analytics
    except Exception as e:
        logging.error(f"Error getting setup request analytics: {str(e)}")
        return []

def get_setup_request_analytics_summary(db_file=None):
    """Get summary statistics for setup request analytics"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get total unique clients
        cursor.execute("SELECT COUNT(DISTINCT client) as total_clients FROM setup_request_analytics")
        total_clients = cursor.fetchone()['total_clients']
        
        # Get client with most requests
        cursor.execute("""
        SELECT client, COUNT(*) as request_count 
        FROM setup_request_analytics 
        GROUP BY client 
        ORDER BY request_count DESC 
        LIMIT 1
        """)
        top_client_result = cursor.fetchone()
        top_client_count = top_client_result['request_count'] if top_client_result else 0
        
        # Get gift type counts
        cursor.execute("""
        SELECT gift_type, COUNT(*) as count 
        FROM setup_request_analytics 
        GROUP BY gift_type
        """)
        gift_type_counts = {row['gift_type']: row['count'] for row in cursor.fetchall()}
        
        # Get total unique users
        cursor.execute("SELECT COUNT(DISTINCT created_by) as total_users FROM setup_request_analytics")
        total_users = cursor.fetchone()['total_users']
        
        # Get client distribution
        cursor.execute("""
        SELECT client, COUNT(*) as count 
        FROM setup_request_analytics 
        GROUP BY client 
        ORDER BY count DESC
        """)
        client_distribution = [{'name': row['client'], 'value': row['count']} for row in cursor.fetchall()]
        
        # Get marketplace distribution
        cursor.execute("""
        SELECT marketplace, COUNT(*) as count 
        FROM setup_request_analytics 
        GROUP BY marketplace 
        ORDER BY count DESC
        """)
        marketplace_distribution = [{'name': row['marketplace'], 'value': row['count']} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'totalRequestClient': total_clients,
            'topClientRequest': top_client_count,
            'giftType2Count': gift_type_counts.get('2', 0),
            'giftType3Count': gift_type_counts.get('3', 0),
            'totalSetup': total_users,
            'distribusiBrand': client_distribution,
            'totalRequestByType': marketplace_distribution
        }
        
    except Exception as e:
        logging.error(f"Error getting setup request analytics summary: {str(e)}")
        return {
            'totalRequestClient': 0,
            'topClientRequest': 0,
            'giftType2Count': 0,
            'giftType3Count': 0,
            'totalSetup': 0,
            'distribusiBrand': [],
            'totalRequestByType': []
        }

def import_mappings_from_csv(csv_file, db_file=None):
    """Import shop mappings from CSV file"""
    import pandas as pd
    
    if db_file is None:
        db_file = get_db_path()
    
    try:
        # Read CSV file
        df = pd.read_csv(csv_file)
        
        # Ensure required columns exist
        required_columns = ['marketplace', 'client', 'shop_id']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Kolom '{col}' tidak ditemukan di file CSV")
        
        # Add client_id column if it doesn't exist
        if 'client_id' not in df.columns:
            df['client_id'] = None
        
        # Connect to database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Import each row
        success_count = 0
        for _, row in df.iterrows():
            try:
                add_shop_mapping(
                    marketplace=row['marketplace'],
                    client=row['client'],
                    shop_id=row['shop_id'],
                    client_id=row['client_id']
                )
                success_count += 1
            except Exception as e:
                logging.error(f"Error importing row {row}: {str(e)}")
        
        conn.close()
        logging.info(f"Imported {success_count} mappings from CSV")
        return True, success_count
    except Exception as e:
        logging.error(f"Error importing mappings from CSV: {str(e)}")
        return False, 0

def get_setup_request_statistics(period='week', db_file=None):
    """Get comprehensive setup request statistics with unique request counts"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build date filter based on period - WIB timezone (+7 hours)
        date_filter = ""
        if period == 'today':
            date_filter = "AND date(datetime(created_at, '+7 hours')) = date('now', '+7 hours')"
        elif period == 'week':
            date_filter = "AND datetime(created_at, '+7 hours') >= datetime('now', '+7 hours', '-6 days')"
        elif period == 'month':
            date_filter = "AND datetime(created_at, '+7 hours') >= datetime('now', '+7 hours', 'start of month')"
        
        # Get unique process type counts (count distinct request_ids per process type)
        cursor.execute(f"""
        SELECT process_type, COUNT(DISTINCT request_id) as count 
        FROM setup_request_analytics 
        WHERE process_type IS NOT NULL AND process_type != '' {date_filter}
        GROUP BY process_type
        """)
        process_type_counts = {row['process_type']: row['count'] for row in cursor.fetchall()}
        
        # Build subquery date filter
        subquery_date_filter = ""
        if period == 'today':
            subquery_date_filter = "AND date(datetime(s2.created_at, '+7 hours')) = date('now', '+7 hours')"
        elif period == 'week':
            subquery_date_filter = "AND datetime(s2.created_at, '+7 hours') >= datetime('now', '+7 hours', '-6 days')"
        elif period == 'month':
            subquery_date_filter = "AND datetime(s2.created_at, '+7 hours') >= datetime('now', '+7 hours', 'start of month')"
        
        # Get top clients with process_type and status
        cursor.execute(f"""
        SELECT 
            client,
            COUNT(DISTINCT request_id) as count,
            COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN request_id END) as recent_count,
            MAX(created_at) as last_activity,
            (
                SELECT process_type 
                FROM setup_request_analytics s2 
                WHERE s2.client = s1.client 
                    AND s2.process_type IS NOT NULL 
                    AND s2.process_type != '' 
                    {subquery_date_filter}
                GROUP BY process_type 
                ORDER BY COUNT(*) DESC 
                LIMIT 1
            ) as process_type,
            (
                SELECT gift_type 
                FROM setup_request_analytics s2 
                WHERE s2.client = s1.client 
                    AND s2.gift_type IS NOT NULL 
                    AND s2.gift_type != '' 
                    {subquery_date_filter}
                GROUP BY gift_type 
                ORDER BY COUNT(*) DESC 
                LIMIT 1
            ) as gift_type
        FROM setup_request_analytics s1
        WHERE client IS NOT NULL AND client != '' {date_filter}
        GROUP BY client 
        ORDER BY count DESC
        LIMIT 10
        """)
        top_clients = []
        for row in cursor.fetchall():
            # Calculate trend (comparing recent vs total)
            trend = 0
            if row['count'] > 0:
                trend = round((row['recent_count'] / row['count']) * 100)
            
            # Determine status based on last activity
            last_activity = row['last_activity']
            if last_activity:
                # Check if last activity was within 7 days
                cursor.execute("""
                SELECT CASE 
                    WHEN julianday('now') - julianday(?) <= 7 THEN 'Active'
                    WHEN julianday('now') - julianday(?) <= 30 THEN 'Recent'
                    ELSE 'Inactive'
                END as status
                """, (last_activity, last_activity))
                status_result = cursor.fetchone()
                status = status_result['status'] if status_result else 'Active'
            else:
                status = 'Active'
            
            # Get the process_type, default to 'Bundle' if not available
            process_type = row['process_type'] if row['process_type'] else 'Bundle'
            gift_type = row['gift_type'] if row['gift_type'] else None
            
            top_clients.append({
                'name': row['client'], 
                'count': row['count'],
                'process_type': process_type,
                'gift_type': gift_type,
                'trend': trend,
                'status': status
            })
        
        # Get unique gift type counts (count distinct request_ids per gift type)
        cursor.execute(f"""
        SELECT gift_type, COUNT(DISTINCT request_id) as count 
        FROM setup_request_analytics 
        WHERE gift_type IS NOT NULL AND gift_type != '' {date_filter}
        GROUP BY gift_type
        """)
        gift_type_counts = {row['gift_type']: row['count'] for row in cursor.fetchall()}
        
        # Get setup counts by PIC with completion rate and avg time
        cursor.execute(f"""
        SELECT 
            created_by,
            COUNT(DISTINCT request_id) as count,
            COUNT(DISTINCT CASE WHEN process_type IS NOT NULL AND process_type != '' THEN request_id END) as completed_requests,
            AVG(CAST((julianday('now') - julianday(created_at)) * 24 AS REAL)) as avg_hours
        FROM setup_request_analytics 
        WHERE created_by IS NOT NULL AND created_by != '' {date_filter}
        GROUP BY created_by 
        ORDER BY count DESC
        """)
        setup_by_pic = []
        for row in cursor.fetchall():
            completion_rate = 0
            if row['count'] > 0:
                completion_rate = round((row['completed_requests'] / row['count']) * 100)
            
            avg_time = row['avg_hours'] or 0
            if avg_time > 0:
                avg_time = round(avg_time, 1)
            else:
                avg_time = 2.5  # Default value if no time data
            
            setup_by_pic.append({
                'username': row['created_by'], 
                'count': row['count'],
                'completion_rate': completion_rate,
                'avg_time': avg_time
            })
        
        # Get total unique requests
        cursor.execute(f"""
        SELECT COUNT(DISTINCT request_id) as total_requests
        FROM setup_request_analytics
        WHERE 1=1 {date_filter}
        """)
        total_requests = cursor.fetchone()['total_requests']
        
        # Get total unique clients
        cursor.execute(f"""
        SELECT COUNT(DISTINCT client) as total_clients
        FROM setup_request_analytics
        WHERE client IS NOT NULL AND client != '' {date_filter}
        """)
        total_clients = cursor.fetchone()['total_clients']
        
        # Get total unique PICs
        cursor.execute(f"""
        SELECT COUNT(DISTINCT created_by) as total_pics
        FROM setup_request_analytics
        WHERE created_by IS NOT NULL AND created_by != '' {date_filter}
        """)
        total_pics = cursor.fetchone()['total_pics']
        
        # Get total rows processed (for comparison)
        cursor.execute(f"""
        SELECT COUNT(*) as total_rows
        FROM setup_request_analytics
        WHERE 1=1 {date_filter}
        """)
        total_rows = cursor.fetchone()['total_rows']
        
        # Get trend data for different time periods
        trend_data = {}
        
        # Today's data (by hour) - WIB timezone (+7 hours) - per 1 jam
        cursor.execute("""
        SELECT strftime('%H', datetime(created_at, '+7 hours')) as hour, COUNT(DISTINCT request_id) as count
        FROM setup_request_analytics 
        WHERE date(datetime(created_at, '+7 hours')) = date('now', '+7 hours')
        GROUP BY strftime('%H', datetime(created_at, '+7 hours'))
        ORDER BY hour
        """)
        today_data = cursor.fetchall()
        
        # Generate labels for 24 hours (00:00 to 23:00)
        today_labels = [f'{str(h).zfill(2)}:00' for h in range(24)]
        today_counts = [0] * 24
        
        # Map query results to hourly counts
        for row in today_data:
            hour = int(row['hour'])
            if 0 <= hour < 24:
                today_counts[hour] = row['count']
        
        trend_data['today'] = {
            'labels': today_labels,
            'data': today_counts
        }
        
        # This week's data (by day) - WIB timezone (+7 hours)
        cursor.execute("""
        SELECT strftime('%w', datetime(created_at, '+7 hours')) as day, COUNT(DISTINCT request_id) as count
        FROM setup_request_analytics 
        WHERE datetime(created_at, '+7 hours') >= datetime('now', '+7 hours', '-6 days')
        GROUP BY strftime('%w', datetime(created_at, '+7 hours'))
        ORDER BY day
        """)
        week_data = cursor.fetchall()
        week_labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
        week_counts = [0] * 7
        for row in week_data:
            day = int(row['day'])
            week_counts[day] = row['count']
        
        trend_data['week'] = {
            'labels': week_labels,
            'data': week_counts
        }
        
        # This month's data (by week) - WIB timezone (+7 hours)
        cursor.execute("""
        SELECT strftime('%W', datetime(created_at, '+7 hours')) as week, COUNT(DISTINCT request_id) as count
        FROM setup_request_analytics 
        WHERE datetime(created_at, '+7 hours') >= datetime('now', '+7 hours', 'start of month')
        GROUP BY strftime('%W', datetime(created_at, '+7 hours'))
        ORDER BY week
        """)
        month_data = cursor.fetchall()
        month_labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4']
        month_counts = [0] * 4
        for i, row in enumerate(month_data[:4]):
            month_counts[i] = row['count']
        
        trend_data['month'] = {
            'labels': month_labels,
            'data': month_counts
        }
        
        conn.close()
        
        return {
            'process_types': {
                'bundle': process_type_counts.get('Bundle', 0),
                'supplementary': process_type_counts.get('Supplementary', 0),
                'gift': process_type_counts.get('Gift', 0),
                'gift_type_2': gift_type_counts.get('2', 0),
                'gift_type_3': gift_type_counts.get('3', 0)
            },
            'top_clients': top_clients,
            'gift_types': {
                'type_2': gift_type_counts.get('2', 0),
                'type_3': gift_type_counts.get('3', 0)
            },
            'setup_by_pic': setup_by_pic,
            'summary': {
                'total_requests': total_requests,
                'total_clients': total_clients,
                'total_pics': total_pics,
                'total_rows': total_rows
            },
            'trend_data': trend_data
        }
        
    except Exception as e:
        logging.error(f"Error getting setup request statistics: {str(e)}")
        return {
            'process_types': {
                'bundle': 0,
                'supplementary': 0,
                'gift': 0
            },
            'top_clients': [],
            'gift_types': {
                'type_2': 0,
                'type_3': 0
            },
            'setup_by_pic': [],
            'summary': {
                'total_requests': 0,
                'total_clients': 0,
                'total_pics': 0,
                'total_rows': 0
            },
            'trend_data': {
                'today': {'labels': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], 'data': [0, 0, 0, 0, 0, 0, 0]},
                'week': {'labels': ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], 'data': [0, 0, 0, 0, 0, 0, 0]},
                'month': {'labels': ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'], 'data': [0, 0, 0, 0]}
            }
        } 