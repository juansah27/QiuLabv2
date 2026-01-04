#!/bin/bash

# Test FULL query performance (bukan hanya COUNT)
# Ini yang sebenarnya dipanggil oleh monitoring-order API

echo "=========================================="
echo "  FULL QUERY PERFORMANCE TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Cek .env
ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ File .env tidak ditemukan${NC}"
    exit 1
fi

# Extract DB config
DB_SERVER=$(grep "^DB_SERVER=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_USERNAME=$(grep "^DB_USERNAME=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

# Find venv
VENV_PATH=""
if [ -d "./backend/venv" ]; then
    VENV_PATH="./backend/venv"
elif [ -d "/opt/venv" ]; then
    VENV_PATH="/opt/venv"
elif [ -d "./venv" ]; then
    VENV_PATH="./venv"
fi

if [ -z "$VENV_PATH" ] || [ ! -f "$VENV_PATH/bin/python" ]; then
    echo -e "${RED}✗ Virtual environment tidak ditemukan${NC}"
    exit 1
fi

echo "Using venv: $VENV_PATH"
echo ""

# Test FULL query
"$VENV_PATH/bin/python" << PYTHON_EOF
import os
import sys
import time
from datetime import datetime, timedelta

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv('$ENV_FILE')
except:
    # Manual load
    with open('$ENV_FILE', 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip().strip('"').strip("'")

server = os.getenv('DB_SERVER', '$DB_SERVER')
database = os.getenv('DB_NAME', '$DB_NAME')
username = os.getenv('DB_USERNAME', '$DB_USERNAME')
password = os.getenv('DB_PASSWORD', '$DB_PASSWORD')

print(f"Server: {server}")
print(f"Database: {database}")
print("")

try:
    import pyodbc
    import platform
    
    system = platform.system()
    timeout = 90 if system == "Linux" else 55
    
    # Connection string
    conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT={timeout};Mars_Connection=yes'
    
    if system == "Linux":
        conn_str += ';Packet Size=4096;TDS_Version=7.4'
    
    print("Connecting...")
    start = time.time()
    conn = pyodbc.connect(conn_str, timeout=timeout)
    conn_time = time.time() - start
    print(f"✅ Connected ({conn_time:.3f}s)")
    print("")
    
    cursor = conn.cursor()
    
    # Date range (same as default in frontend)
    yesterday = datetime.now() - timedelta(days=1)
    start_date = yesterday.replace(hour=17, minute=0, second=0)
    end_date = datetime.now()
    
    print(f"Date range: {start_date.strftime('%Y-%m-%d %H:%M:%S')} to {end_date.strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    # FULL monitoring query (sama seperti di backend)
    full_query = """
    SELECT
        CASE 
            WHEN so.SystemId ='MPSH' THEN 'Shopee'
            WHEN so.SystemId ='MSTP' THEN 'Tokopedia'
            WHEN so.SystemId = 'GCOOP' THEN 'GCOOP'
            WHEN so.SystemId = 'Jubelio' THEN 'Jubelio'
            WHEN so.SystemId = 'MPJD' THEN 'JD.ID'
            WHEN so.SystemId = 'MPLZ' THEN 'Lazada'
            WHEN so.SystemId = 'Other' THEN 'Other'
            WHEN so.SystemId = 'SS' THEN 'Sistersel'
            WHEN so.SystemId = 'MPBI' THEN 'Blibli'
            WHEN so.SystemId = 'GDTech' THEN 'GDTech'
            WHEN so.SystemId = 'MPTS' THEN 'Tiktok'
            WHEN so.SystemId = 'SHPY' THEN 'Shopify'
            WHEN so.SystemId = 'MPZR' THEN 'ZALORA'
            WHEN so.SystemId = 'MPUP' THEN 'CMS FLEXO'
            WHEN so.SystemId = 'MPGN' THEN 'GINEE'
            WHEN so.SystemId = 'MPDS' THEN 'DESTY'
            ELSE 'New Channel'
        END AS MARKETPLACE,
        CASE 
            WHEN so.MerchantName = 'FACETOLOGY' THEN 'FACETOLOGY'
            WHEN so.MerchantName = 'OSF' THEN 'OSF'
            WHEN so.MerchantName = 'SOMEBYMI' THEN 'SOMEBYMI'
            -- ... (truncated, using simplified version)
            ELSE so.MerchantName
        END AS Brand,
        so.SystemRefId,
        so.OrderDate,
        CASE 
            WHEN so.SystemId = 'MPSH'
             AND so.OrderedById = 'LOGISTICS_NOT_START'
             AND so.OrderStatus = 'READY_TO_SHIP'
            THEN 'PENDING VERIFIKASI'
            ELSE so.OrderStatus
        END AS [ORDER STATUS],
        CASE 
            WHEN ol.ordnum IS NOT NULL THEN 'Yes'
            ELSE 'No'
        END AS [Status_Interfaced],
        CASE 
            WHEN so.OrderDate < DATEADD(MINUTE, -59, GETDATE())
            THEN 'Lebih Dari 1 jam'
            ELSE 'Kurang Dari 1 jam'
        END AS [Status_Durasi]
    FROM Flexo_Db.dbo.SalesOrder so WITH (NOLOCK)
    LEFT JOIN (
        SELECT DISTINCT ordnum
        FROM WMSPROD.dbo.ord_line WITH (NOLOCK)
    ) ol
        ON ol.ordnum = so.SystemRefId
    WHERE so.OrderDate >= ? AND so.OrderDate <= ?
      AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN ('cancelled', 'cancellations', 'canceled', 'confirmed', 'to_confirm_receive', 'to_return', 'returned', 'cancel', 'unpaid', 'matched', 'pending_payment','pending','expired')
      AND so.FulfilledByFlexo <> '0'
    ORDER BY so.OrderDate DESC
    """
    
    print("Executing FULL query (fetching all data)...")
    print("This is the actual query used by monitoring-order API")
    print("")
    
    # Execute query
    start = time.time()
    cursor.execute(full_query, (start_date.strftime('%Y-%m-%d %H:%M:%S'), end_date.strftime('%Y-%m-%d %H:%M:%S')))
    query_exec_time = time.time() - start
    print(f"✅ Query executed ({query_exec_time:.3f}s)")
    print("")
    
    # Fetch data
    print("Fetching rows...")
    start = time.time()
    rows = cursor.fetchall()
    fetch_time = time.time() - start
    print(f"✅ Fetched {len(rows):,} rows ({fetch_time:.3f}s)")
    print("")
    
    # Get column names
    columns = [column[0] for column in cursor.description]
    print(f"Columns: {len(columns)}")
    print(f"  {', '.join(columns[:5])}...")
    print("")
    
    # Convert to dict (simulate backend processing)
    print("Converting to dictionaries (simulating backend processing)...")
    start = time.time()
    results = []
    for i, row in enumerate(rows):
        row_dict = {}
        for j, value in enumerate(row):
            # Simulate datetime conversion
            if hasattr(value, 'strftime'):
                value = value.strftime('%Y-%m-%d %H:%M:%S')
            row_dict[columns[j]] = value
        results.append(row_dict)
        
        # Progress indicator
        if (i + 1) % 5000 == 0:
            print(f"  Processed {i + 1:,} rows...")
    
    process_time = time.time() - start
    print(f"✅ Processed {len(results):,} records ({process_time:.3f}s)")
    print("")
    
    # Calculate total time
    total_time = query_exec_time + fetch_time + process_time
    
    print("=" * 50)
    print("PERFORMANCE SUMMARY")
    print("=" * 50)
    print(f"Query execution:  {query_exec_time:>8.3f}s")
    print(f"Data fetch:        {fetch_time:>8.3f}s")
    print(f"Data processing:   {process_time:>8.3f}s")
    print(f"{'─' * 50}")
    print(f"TOTAL TIME:        {total_time:>8.3f}s")
    print(f"Records:           {len(results):,}")
    print(f"Avg per record:    {(total_time/len(results)*1000):>8.2f}ms")
    print("")
    
    # Performance analysis
    if total_time > 60:
        print("❌ CRITICAL: Query sangat lambat! (>60s)")
        print("   Perlu optimasi query atau implementasi pagination")
    elif total_time > 30:
        print("⚠️  WARNING: Query lambat (>30s)")
        print("   Pertimbangkan:")
        print("   - Implementasi pagination")
        print("   - Optimasi query")
        print("   - Caching untuk data yang tidak sering berubah")
    elif total_time > 10:
        print("⚠️  Query agak lambat (>10s)")
        print("   Bisa dioptimasi dengan pagination")
    else:
        print("✅ Query performance acceptable")
    
    print("")
    
    # Breakdown analysis
    if fetch_time > query_exec_time * 2:
        print("⚠️  Data fetch lebih lambat dari query execution")
        print("   Kemungkinan:")
        print("   - Network latency tinggi")
        print("   - Data size besar")
        print("   - Packet size perlu dioptimasi")
    
    if process_time > query_exec_time:
        print("⚠️  Data processing lebih lambat dari query")
        print("   Pertimbangkan:")
        print("   - Optimasi data conversion")
        print("   - Stream processing instead of loading all")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

PYTHON_EOF

echo ""
echo "=========================================="
echo "TEST SELESAI"
echo "=========================================="

