#!/bin/bash

# Script untuk test koneksi SQL Server dengan named instance
# Handle: 10.6.13.33\newjda

echo "=========================================="
echo "  SQL SERVER CONNECTION TEST"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Cek .env
ENV_FILE=""
if [ -f "backend/.env" ]; then
    ENV_FILE="backend/.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -z "$ENV_FILE" ]; then
    echo -e "${RED}✗ File .env tidak ditemukan${NC}"
    exit 1
fi

echo "✓ Menggunakan .env: $ENV_FILE"
echo ""

# Extract DB config
DB_SERVER=$(grep "^DB_SERVER=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_USERNAME=$(grep "^DB_USERNAME=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'" | head -1)

if [ -z "$DB_SERVER" ]; then
    echo -e "${RED}✗ DB_SERVER tidak ditemukan di .env${NC}"
    exit 1
fi

echo "Database Configuration:"
echo "  Server: $DB_SERVER"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo ""

# Cek apakah named instance (ada backslash)
if [[ "$DB_SERVER" == *"\\"* ]]; then
    INSTANCE_NAME=$(echo "$DB_SERVER" | cut -d'\' -f2)
    SERVER_IP=$(echo "$DB_SERVER" | cut -d'\' -f1)
    echo -e "${YELLOW}⚠️  Named instance terdeteksi: $INSTANCE_NAME${NC}"
    echo "  Server IP: $SERVER_IP"
    echo "  Instance: $INSTANCE_NAME"
    echo ""
    echo "Note: Named instance menggunakan dynamic port, bukan 1433"
    echo "      pyodbc akan otomatis resolve port yang benar"
    echo ""
else
    SERVER_IP="$DB_SERVER"
    echo "Standard instance (port 1433)"
    echo ""
fi

# Test network connectivity
echo -e "${GREEN}[1] Network Connectivity Test${NC}"
echo "-------------------"
echo "Ping test:"
if ping -c 3 "$SERVER_IP" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Ping berhasil ke $SERVER_IP"
    ping -c 3 "$SERVER_IP" | tail -1
else
    echo -e "  ${RED}✗${NC} Ping gagal ke $SERVER_IP"
fi
echo ""

# Test port (untuk named instance, coba beberapa port umum)
echo "Port test:"
if [[ "$DB_SERVER" == *"\\"* ]]; then
    echo "  Named instance - pyodbc akan auto-resolve port"
    echo "  Testing beberapa port umum SQL Server:"
    for port in 1433 1434 14330 14331; do
        if timeout 2 bash -c "echo > /dev/tcp/$SERVER_IP/$port" 2>/dev/null; then
            echo -e "    ${GREEN}✓${NC} Port $port accessible"
        else
            echo -e "    - Port $port tidak accessible (normal untuk named instance)"
        fi
    done
else
    if timeout 2 bash -c "echo > /dev/tcp/$SERVER_IP/1433" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Port 1433 accessible"
    else
        echo -e "  ${RED}✗${NC} Port 1433 tidak accessible"
    fi
fi
echo ""

# Cek virtual environment
echo -e "${GREEN}[2] Virtual Environment Check${NC}"
echo "-------------------"
VENV_PATHS=(
    "/opt/venv"
    "./backend/venv"
    "./venv"
    "$HOME/venv"
)

VENV_FOUND=""
for venv_path in "${VENV_PATHS[@]}"; do
    if [ -d "$venv_path" ] && [ -f "$venv_path/bin/python" ]; then
        echo "✓ Virtual env ditemukan: $venv_path"
        VENV_FOUND="$venv_path"
        echo "  Python: $($venv_path/bin/python --version 2>&1)"
        
        # Cek pyodbc
        if "$venv_path/bin/pip" show pyodbc &>/dev/null; then
            PYODBC_VERSION=$("$venv_path/bin/pip" show pyodbc | grep Version | awk '{print $2}')
            echo -e "  ${GREEN}✓${NC} pyodbc: $PYODBC_VERSION"
        else
            echo -e "  ${RED}✗${NC} pyodbc tidak terinstall"
        fi
        break
    fi
done

if [ -z "$VENV_FOUND" ]; then
    echo -e "${YELLOW}⚠️  Virtual env tidak ditemukan di lokasi standar${NC}"
    echo "  Process uvicorn menggunakan: /opt/venv/bin/python"
    echo "  Cek apakah path benar atau ada permission issue"
    VENV_FOUND="/opt/venv"  # Assume path dari process
fi
echo ""

# Test connection dengan Python
echo -e "${GREEN}[3] Database Connection Test${NC}"
echo "-------------------"

if [ -z "$VENV_FOUND" ] || [ ! -f "$VENV_FOUND/bin/python" ]; then
    echo -e "${RED}✗ Python tidak ditemukan di virtual env${NC}"
    echo "  Menggunakan system Python..."
    PYTHON_CMD="python3"
else
    PYTHON_CMD="$VENV_FOUND/bin/python"
fi

# Test connection
"$PYTHON_CMD" << PYTHON_EOF
import os
import sys
import time
from datetime import datetime, timedelta

try:
    from dotenv import load_dotenv
    load_dotenv('$ENV_FILE')
except:
    print("  ⚠️  python-dotenv tidak terinstall")
    # Try manual load
    import re
    with open('$ENV_FILE', 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip().strip('"').strip("'")

server = os.getenv('DB_SERVER', '$DB_SERVER')
database = os.getenv('DB_NAME', '$DB_NAME')
username = os.getenv('DB_USERNAME', '$DB_USERNAME')
password = os.getenv('DB_PASSWORD', '$DB_PASSWORD')

print(f"  Connecting to: {server}")
print(f"  Database: {database}")
print(f"  Username: {username}")

try:
    import pyodbc
    import platform
    
    system = platform.system()
    timeout = 90 if system == "Linux" else 55
    
    print(f"  Platform: {system}")
    print(f"  pyodbc version: {pyodbc.version}")
    print(f"  Timeout: {timeout}s")
    print("")
    
    # Build connection string
    # Untuk named instance, pyodbc akan otomatis resolve port
    conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT={timeout};Mars_Connection=yes'
    
    if system == "Linux":
        conn_str += ';Packet Size=4096;TDS_Version=7.4'
    
    print("  Attempting connection...")
    start = time.time()
    
    try:
        conn = pyodbc.connect(conn_str, timeout=timeout)
        conn_time = time.time() - start
        print(f"  ✅ Connection successful! ({conn_time:.2f}s)")
        print("")
        
        cursor = conn.cursor()
        
        # Test simple query
        print("  Testing simple query...")
        start = time.time()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        query_time = time.time() - start
        print(f"  ✅ Simple query OK ({query_time:.3f}s)")
        print(f"  SQL Server: {version[:60]}...")
        print("")
        
        # Test monitoring query COUNT
        print("  Testing monitoring-order COUNT query...")
        yesterday = datetime.now() - timedelta(days=1)
        start_date = yesterday.replace(hour=17, minute=0, second=0)
        end_date = datetime.now()
        
        count_query = """
        SELECT COUNT(DISTINCT so.SystemRefId) as total_count
        FROM Flexo_Db.dbo.SalesOrder AS so WITH (NOLOCK)
        WHERE so.OrderDate >= ? AND so.OrderDate <= ?
        AND LOWER(ISNULL(so.OrderStatus, '')) NOT IN ('cancelled', 'cancellations', 'canceled', 'confirmed', 'to_confirm_receive', 'to_return', 'returned', 'cancel', 'unpaid', 'matched', 'pending_payment','pending','expired')
        AND so.FulfilledByFlexo <> '0'
        """
        
        start = time.time()
        cursor.execute(count_query, (start_date.strftime('%Y-%m-%d %H:%M:%S'), end_date.strftime('%Y-%m-%d %H:%M:%S')))
        result = cursor.fetchone()
        count_time = time.time() - start
        
        print(f"  ✅ COUNT query completed!")
        print(f"  Total records: {result[0]:,}")
        print(f"  Query time: {count_time:.2f}s")
        print("")
        
        if count_time > 60:
            print(f"  ❌ CRITICAL: Query sangat lambat! (>60s)")
            print(f"     Perlu optimasi query atau index database")
        elif count_time > 30:
            print(f"  ⚠️  WARNING: Query lambat (>30s)")
            print(f"     Pertimbangkan optimasi")
        elif count_time > 10:
            print(f"  ⚠️  Query agak lambat (>10s)")
        else:
            print(f"  ✅ Query performance OK")
        
        conn.close()
        print("")
        print("  ✅ All tests passed!")
        
    except pyodbc.Error as e:
        print(f"  ❌ Connection/Query error: {e}")
        print("")
        print("  Error details:")
        print(f"    {str(e)}")
        if "named instance" in str(e).lower() or "server" in str(e).lower():
            print("")
            print("  Troubleshooting:")
            print("    1. Pastikan SQL Server Browser service running di server")
            print("    2. Pastikan firewall allow SQL Server ports")
            print("    3. Cek apakah instance name benar: $server")
        
except ImportError as e:
    print(f"  ❌ Import error: {e}")
    print("  Install pyodbc: pip install pyodbc")
except Exception as e:
    print(f"  ❌ Error: {e}")
    import traceback
    print(f"  Details: {traceback.format_exc()}")

PYTHON_EOF

echo ""
echo "=========================================="
echo -e "${GREEN}TEST SELESAI${NC}"
echo "=========================================="


