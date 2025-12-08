import pandas as pd
import os
import re
import logging
import sqlite3
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import PatternFill

# ====================== [DATABASE FUNCTIONS] ======================
def get_db_path(db_name="shop_mapping.db"):
    """Get the full path to the database file"""
    SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(SCRIPT_DIR, db_name)

def load_shop_id_mapping_from_db(db_file=None):
    """Load shop ID mapping from database"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("SELECT marketplace, client, shop_id FROM shop_mapping")
        mapping = {f"{row[0].lower()}_{row[1].lower()}": row[2] for row in cursor.fetchall()}
        conn.close()
        return mapping
    except Exception as e:
        logging.error(f"Error loading shop ID mapping: {str(e)}")
        return {}

def get_client_id(shop_id, db_file=None):
    """Get client ID from database based on shop ID"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("SELECT client_id FROM shop_mapping WHERE shop_id = ?", (shop_id,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        logging.error(f"Error getting client_id: {str(e)}")
        return None

def load_client_id_mapping_from_db(db_file=None):
    """Load client ID mapping from database (shop_id -> client_id) - optimized batch loading"""
    if db_file is None:
        db_file = get_db_path()
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        cursor.execute("SELECT shop_id, client_id FROM shop_mapping")
        mapping = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        return mapping
    except Exception as e:
        logging.error(f"Error loading client ID mapping: {str(e)}")
        return {}

# ====================== [UTILITY FUNCTIONS] ======================
def assign_shop_id(marketplace, client):
    """Assign shop ID based on marketplace and client"""
    # Ensure marketplace and client are strings
    if isinstance(marketplace, tuple):
        marketplace = ' '.join(marketplace).strip()
    if isinstance(client, tuple):
        client = ' '.join(client).strip()

    # Handle marketplace aliases
    marketplace_mapping = {
        'tokped': 'tokopedia',
        # Add more mappings if needed
    }
    
    # Convert marketplace to standard form
    marketplace = marketplace_mapping.get(marketplace.lower().strip(), marketplace.lower().strip())

    key = f"{marketplace}_{client.lower().strip()}"
    logging.info(f"Generated key: {key}")
    
    shop_id_mapping = load_shop_id_mapping_from_db()
    shop_id = shop_id_mapping.get(key, "Unknown")
    
    if shop_id == "Unknown":
        logging.warning(f"ShopId not found for key: {key}")
    else:
        logging.info(f"Assigned ShopId: {shop_id}")
        
    return shop_id

def assign_shop_id_optimized(marketplace, client, shop_id_mapping):
    """Optimized version of assign_shop_id that uses pre-loaded mapping"""
    # Ensure marketplace and client are strings
    if isinstance(marketplace, tuple):
        marketplace = ' '.join(marketplace).strip()
    if isinstance(client, tuple):
        client = ' '.join(client).strip()

    # Handle marketplace aliases
    marketplace_mapping_dict = {
        'tokped': 'tokopedia',
        # Add more mappings if needed
    }
    
    # Convert marketplace to standard form
    marketplace = marketplace_mapping_dict.get(marketplace.lower().strip(), marketplace.lower().strip())

    key = f"{marketplace}_{client.lower().strip()}"
    shop_id = shop_id_mapping.get(key, "Unknown")
    
    return shop_id

def get_client_id_optimized(shop_id, client_id_mapping):
    """Optimized version of get_client_id that uses pre-loaded mapping"""
    return client_id_mapping.get(shop_id, None)

def convert_date_format(date_value, is_end_date=False):
    """Convert date string to standard format"""
    if pd.isna(date_value) or date_value == "":
        return "Format Tanggal Salah"
    
    # Remove parentheses but keep time
    date_value = re.sub(r'\((\d{2}:\d{2})\)', r'\1:00', date_value).strip()
    
    possible_formats = [
        "%d/%m/%Y %H.%M", "%d/%m/%Y %H.%M.%S", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", 
        "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%Y-%m-%d %H:%M:%S", 
        "%Y-%m-%d %H:%M", "%d-%m-%Y %H:%M:%S", "%d-%m-%Y %H:%M",
        "%m-%d-%Y %H:%M:%S", "%m-%d-%Y %H:%M", "%d/%m/%Y", 
        "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y", 
        "%A, %B %d, %Y"
    ]
    
    for fmt in possible_formats:
        try:
            parsed_date = datetime.strptime(date_value, fmt)
            if is_end_date and parsed_date.time() == datetime.min.time():
                # Set time to 23:59:59 if only date is provided or time is 00:00:00 or 00:00
                parsed_date = parsed_date.replace(hour=23, minute=59, second=59)
            return parsed_date.strftime("%m/%d/%Y %H:%M:%S")
        except ValueError:
            continue
    
    return "Format Tanggal Salah"

def create_gift_id(row):
    """Create formatted GIFT ID"""
    # Check value_start for special conditions
    value_start = str(row['Value_Start']).replace(',', '').replace('.', '') if pd.notna(row.get('Value_Start')) else ""
    if value_start == "0" or value_start == "":
        value_prefix = "ANY"
    else:
        value_prefix = value_start[:3].zfill(3) + "K"
    
    # Get day from Start_Date and full format from End_Date
    try:
        start_date = datetime.strptime(row['Start_Date'], "%m/%d/%Y %H:%M:%S")
        end_date = datetime.strptime(row['End_Date'], "%m/%d/%Y %H:%M:%S")
        
        # Get only day from start_date
        start_day = f"{start_date.day:02d}"
        # Full DDMMYY format for end_date
        end_date_format = f"{end_date.day:02d}{end_date.month:02d}{str(end_date.year)[-2:]}"
    except Exception as e:
        logging.warning(f"Error processing dates for GIFT ID: {str(e)}")
        start_day = "00"
        end_date_format = "000000"
    
    # Process client prefix
    # Split string based on spaces, underscores, dots, or dashes
    client_words = re.split(r'[ _.-]', str(row['Client']).strip())
    client_words = [word for word in client_words if word]  # Remove empty strings
    
    if len(client_words) >= 3:
        # If there are 3 or more words, take the first letter of each word
        client_prefix = (client_words[0][0] + client_words[1][0] + client_words[2][0]).upper()
    elif len(client_words) == 2:
        # If there are 2 words, take the first 3 letters of the first word
        # and the first letter of the second word
        client_prefix = (client_words[0][:min(3, len(client_words[0]))] + client_words[1][0]).upper()
    else:
        # If there's only 1 word, take the first 3 letters
        client_prefix = client_words[0][:min(3, len(client_words[0]))].upper()
    
    # Get marketplace field based on either 'MarketPlace' or 'Marketplace' key
    marketplace = row.get('MarketPlace', row.get('Marketplace', ''))
    
    # Get appropriate marketplace code
    market_prefix = get_marketplace_code(marketplace)
    
    # Get MARKET_COUNTER with default value of 1 if not present
    market_counter = row.get('MARKET_COUNTER', 1)
    
    # Create GIFT ID format with counter at the end
    gift_id = f"TIER{value_prefix}-{start_day}{end_date_format}-{client_prefix}-{market_prefix}{market_counter}"
    
    return gift_id

def get_marketplace_code(marketplace):
    """Get marketplace code for GIFT ID"""
    marketplace_codes = {
        'shopee': 'SHP',
        'tiktok': 'TTS',
        'tokopedia': 'TKP',
        'lazada': 'LZD',
        'blibli': 'BLI',
        'zalora': 'ZAL',
        'jubelio': 'JBL',
        'desty': 'DST'
    }
    marketplace = str(marketplace).lower().strip()
    return marketplace_codes.get(marketplace, marketplace[:3].upper())

def determine_gift_type(main_sku):
    """Determine gift type based on main SKU"""
    return "2" if pd.notna(main_sku) and str(main_sku).strip() != "" else "3"

def validate_file(file_path):
    """Validate input file"""
    # Basic validation - check if file exists and is Excel
    if not os.path.exists(file_path):
        return False, "File tidak ditemukan."
    
    if not file_path.lower().endswith(('.xlsx', '.xls')):
        return False, "File bukan file Excel yang valid."
    
    return True, "File valid."

def validate_sku_product(df):
    """Validate SKU Product has unique Name Product"""
    # Check if required columns exist
    if 'SKU Product' not in df.columns or 'Name Product' not in df.columns:
        return False, "Kolom 'SKU Product' atau 'Name Product' tidak ditemukan."
    
    # Group by SKU Product and count unique Name Product values
    grouped = df.groupby('SKU Product')['Name Product'].nunique()
    
    # Check if any group has more than one unique Name Product
    if (grouped > 1).any():
        invalid_skus = grouped[grouped > 1].index.tolist()
        return False, f"SKU Product dengan lebih dari satu Name Product: {invalid_skus}"
    
    return True, "Semua SKU Product memiliki satu Name Product yang unik." 