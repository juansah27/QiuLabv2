import sqlite3
import uuid
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
import pyodbc

class Query:
    def __init__(self, id, name, query_text, description=None, user_id=None, created_at=None, updated_at=None):
        self.id = id
        self.name = name
        self.query_text = query_text
        self.description = description
        self.user_id = user_id
        self.created_at = created_at or datetime.now().isoformat()
        self.updated_at = updated_at or datetime.now().isoformat()

    @staticmethod
    def get_by_id(query_id):
        conn = sqlite3.connect('instance/app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM queries WHERE id = ?", (query_id,))
        query_data = cursor.fetchone()
        conn.close()
        
        if query_data:
            return Query(
                id=query_data['id'],
                name=query_data['name'],
                query_text=query_data['query_text'],
                description=query_data['description'],
                user_id=query_data['user_id'],
                created_at=query_data['created_at'],
                updated_at=query_data['updated_at']
            )
        return None

    @staticmethod
    def get_all(user_id=None):
        conn = sqlite3.connect('instance/app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute("SELECT * FROM queries WHERE user_id = ? OR user_id IS NULL ORDER BY name", (user_id,))
        else:
            cursor.execute("SELECT * FROM queries ORDER BY name")
            
        query_data_list = cursor.fetchall()
        conn.close()
        
        return [Query(
            id=data['id'],
            name=data['name'],
            query_text=data['query_text'],
            description=data['description'],
            user_id=data['user_id'],
            created_at=data['created_at'],
            updated_at=data['updated_at']
        ) for data in query_data_list]

    @staticmethod
    def create(name, query_text, description=None, user_id=None):
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        
        query_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        updated_at = created_at
        
        cursor.execute(
            "INSERT INTO queries (id, name, query_text, description, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (query_id, name, query_text, description, user_id, created_at, updated_at)
        )
        
        conn.commit()
        conn.close()
        
        return Query(query_id, name, query_text, description, user_id, created_at, updated_at)

    def update(self, name=None, query_text=None, description=None):
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        
        self.name = name if name is not None else self.name
        self.query_text = query_text if query_text is not None else self.query_text
        self.description = description if description is not None else self.description
        self.updated_at = datetime.now().isoformat()
        
        cursor.execute(
            "UPDATE queries SET name = ?, query_text = ?, description = ?, updated_at = ? WHERE id = ?",
            (self.name, self.query_text, self.description, self.updated_at, self.id)
        )
        
        conn.commit()
        conn.close()
        
        return self

    def delete(self):
        conn = sqlite3.connect('instance/app.db')
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM queries WHERE id = ?", (self.id,))
        
        conn.commit()
        conn.close()
        
        return True
        
    def execute(self):
        conn = sqlite3.connect('instance/app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute(self.query_text)
            result = cursor.fetchall()
            conn.close()
            
            # Convert the results to dictionaries
            return [dict(row) for row in result]
        except Exception as e:
            conn.close()
            raise Exception(f"Error executing query: {str(e)}")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'query_text': self.query_text,
            'description': self.description,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
        
    @staticmethod
    def execute_raw_query(query_text):
        """Execute a raw SQL query and return the results"""
        # Setup logging
        logger = logging.getLogger(__name__)
        
        # Load environment variables
        load_dotenv()
        
        # Get connection details from environment
        server = os.getenv('DB_SERVER')
        database = os.getenv('DB_NAME')
        username = os.getenv('DB_USERNAME')
        password = os.getenv('DB_PASSWORD')
        
        use_sqlite_for_testing = os.getenv('USE_SQLITE_FOR_TESTING', 'False').lower() == 'true'
        
        # Log connection attempt (tanpa password)
        logger.info(f"Attempting to connect to SQL Server: {server}, database: {database}, user: {username}")
        
        # Validasi konfigurasi
        if (not server or not database or not username or not password) and not use_sqlite_for_testing:
            error_msg = "Konfigurasi database tidak lengkap. Periksa file .env"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        try:
            # Gunakan SQLite untuk testing jika dikonfigurasi demikian
            if use_sqlite_for_testing:
                logger.info("Using SQLite for testing instead of SQL Server")
                return Query.execute_mock_query()
            
            # Create connection to SQL Server
            connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
            logger.info("Connecting to SQL Server...")
            conn = pyodbc.connect(connection_string)
            logger.info("Connected successfully to SQL Server")
            
            # Set row factory to return dictionaries
            cursor = conn.cursor()
            
            # Log that we're about to execute the query (but hide actual SQL for security)
            logger.info("Executing SQL query...")
            
            # Execute the query
            cursor.execute(query_text)
            logger.info("SQL query executed successfully")
            
            # Get column names
            columns = [column[0] for column in cursor.description]
            logger.info(f"Query returned {len(columns)} columns")
            
            # Fetch all rows
            rows = cursor.fetchall()
            logger.info(f"Query returned {len(rows)} rows")
            
            # Convert rows to dictionaries
            results = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    row_dict[columns[i]] = value
                results.append(row_dict)
                
            cursor.close()
            conn.close()
            logger.info("SQL connection closed")
            
            return results
            
        except pyodbc.Error as e:
            error_msg = f"Database error: {str(e)}"
            logger.error(error_msg)
            
            if use_sqlite_for_testing:
                logger.info("Using mock data due to SQL Server connection error")
                return Query.execute_mock_query()
            
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Error executing query: {str(e)}"
            logger.error(error_msg)
            
            if use_sqlite_for_testing:
                logger.info("Using mock data due to general error")
                return Query.execute_mock_query()
                
            raise Exception(error_msg)
    
    @staticmethod
    def execute_mock_query():
        """Return mock data for testing when SQL Server is not available"""
        import datetime
        
        # Create mock data
        results = []
        
        # Generate 20 mock records
        for i in range(1, 21):
            system_id = "SYS" + str(i % 3 + 1)
            merchant_name = f"Merchant {i % 5 + 1}"
            system_ref_id = f"REF{i:03d}"
            order_status = "COMPLETED" if i % 4 != 0 else ("CANCELLED" if i % 8 == 0 else "IN_CANCEL")
            if i % 7 == 0:
                order_status = "N/A"
            
            status_interfaced = "Yes" if i % 3 != 0 else "No"
            status_sc = "PENDING VERIFIKASI" if i % 5 == 0 else "CEK!"
            status_durasi = "Lebih Dari 1 jam" if i % 2 == 0 else "Kurang Dari 1 jam"
            
            # Create a datetime object for today minus i hours
            order_date = datetime.datetime.now() - datetime.timedelta(hours=i)
            
            record = {
                "SystemId": system_id,
                "MerchantName": merchant_name,
                "SystemRefId": system_ref_id,
                "OrderStatus": order_status,
                "Awb": f"AWB{i:05d}",
                "Status_Interfaced": status_interfaced, 
                "Status_SC": status_sc,
                "Status_Durasi": status_durasi,
                "ItemIds": f"ITEM{i:03d}, ITEM{i+100:03d}",
                "OrderDate": order_date,
                "DtmCrt": order_date - datetime.timedelta(minutes=30),
                "DeliveryMode": "EXPRESS" if i % 3 == 0 else "STANDARD",
                "importlog": "Imported",
                "FulfilledByFlexo": i % 2 == 0,
                "AddDate": order_date - datetime.timedelta(hours=2),
                "Origin": "Flexofast-TGR" if i % 2 == 0 else "Flexofast-SBY"
            }
            
            results.append(record)
        
        return results 