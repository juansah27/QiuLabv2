#!/bin/bash

# Script Detail untuk Cek Monitoring Order Performance
# Jalankan dari direktori aplikasi

echo "=========================================="
echo "  DETAILED MONITORING ORDER CHECK"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Cek Virtual Environment
echo -e "${GREEN}[1] Virtual Environment Check${NC}"
echo "-------------------"
VENV_PATHS=("/opt/venv" "./backend/venv" "./venv")
VENV_FOUND=""

for venv_path in "${VENV_PATHS[@]}"; do
    if [ -d "$venv_path" ] && [ -f "$venv_path/bin/python" ]; then
        echo "✓ Virtual env ditemukan: $venv_path"
        echo "Python path: $($venv_path/bin/python --version 2>&1)"
        echo ""
        echo "Packages di venv:"
        $venv_path/bin/pip list 2>/dev/null | grep -E "(pyodbc|flask|uvicorn|fastapi)" || echo "Package tidak ditemukan"
        VENV_FOUND="$venv_path"
        break
    fi
done

if [ -z "$VENV_FOUND" ]; then
    echo -e "${YELLOW}⚠️  Virtual env tidak ditemukan di lokasi standar${NC}"
    echo "  Process uvicorn menggunakan: /opt/venv/bin/python"
    echo "  Kemungkinan:"
    echo "    - Path berbeda"
    echo "    - Permission issue"
    echo "    - Virtual env di lokasi lain"
    # Check dari process
    if ps aux | grep -q "uvicorn.*main:app"; then
        UvicornPath=$(ps aux | grep "uvicorn.*main:app" | grep -v grep | head -1 | awk '{print $11}')
        echo "  Process path: $UvicornPath"
        VENV_FOUND=$(dirname $(dirname "$UvicornPath"))
        echo "  Deduced venv path: $VENV_FOUND"
    fi
fi
echo ""

# 2. Cek Log Aplikasi untuk Query Performance
echo -e "${GREEN}[2] Log Analysis - Query Performance${NC}"
echo "-------------------"

LOG_FILES=(
    "./backend/logs/development.log"
    "./backend/logs/production.log"
    "/var/log/app.log"
    "/opt/app/logs/app.log"
)

FOUND_LOGS=0
for log_file in "${LOG_FILES[@]}"; do
    if [ -f "$log_file" ]; then
        echo "✓ Log file ditemukan: $log_file"
        FOUND_LOGS=1
        
        # Cek query execution time
        echo ""
        echo "Query execution times (10 terakhir):"
        grep -i "query execution time" "$log_file" 2>/dev/null | tail -10 || echo "  Tidak ada data query execution time"
        
        # Cek error terkait monitoring-order
        echo ""
        echo "Errors terkait monitoring-order (10 terakhir):"
        grep -i "monitoring.order\|monitoring-order\|query.*error\|timeout" "$log_file" 2>/dev/null | tail -10 || echo "  Tidak ada error ditemukan"
        
        # Cek platform dan timeout info
        echo ""
        echo "Platform & Timeout info:"
        grep -i "platform\|timeout\|connection.*timeout" "$log_file" 2>/dev/null | tail -5 || echo "  Tidak ada info timeout"
        
        break
    fi
done

if [ $FOUND_LOGS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Tidak ada log file ditemukan di lokasi standar${NC}"
    echo "Mencari log files..."
    find . -name "*.log" -type f 2>/dev/null | head -5
fi
echo ""

# 3. Cek Process dan Resource Usage
echo -e "${GREEN}[3] Process & Resource Usage${NC}"
echo "-------------------"
echo "Uvicorn processes:"
ps aux | grep -E "uvicorn|main:app" | grep -v grep
echo ""
echo "Resource saat ini:"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory:"
free -h | head -2
echo ""

# 4. Test Database Connection dari Venv
echo -e "${GREEN}[4] Database Connection Test${NC}"
echo "-------------------"

# Determine venv path
if [ -z "$VENV_FOUND" ]; then
    # Try to find from process
    if ps aux | grep -q "uvicorn.*main:app"; then
        UvicornPath=$(ps aux | grep "uvicorn.*main:app" | grep -v grep | head -1 | awk '{print $11}')
        VENV_FOUND=$(dirname $(dirname "$UvicornPath"))
    else
        VENV_FOUND="/opt/venv"  # Default assumption
    fi
fi

ENV_FILE=""
if [ -f "backend/.env" ]; then
    ENV_FILE="backend/.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -n "$VENV_FOUND" ] && [ -d "$VENV_FOUND" ] && [ -f "$VENV_FOUND/bin/python" ] && [ -n "$ENV_FILE" ]; then
    echo "Testing connection dari virtual environment..."
    $VENV_FOUND/bin/python3 << PYTHON_EOF
import os
import sys
import time
from pathlib import Path

    # Load .env
try:
    from dotenv import load_dotenv
    env_path = Path('$ENV_FILE')
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv('.env')
except:
    print("  ⚠️  python-dotenv tidak terinstall atau .env tidak ditemukan")
    sys.exit(0)

server = os.getenv('DB_SERVER')
database = os.getenv('DB_NAME')
username = os.getenv('DB_USERNAME')
password = os.getenv('DB_PASSWORD')

if not all([server, database, username, password]):
    print("  ⚠️  Environment variables tidak lengkap")
    print(f"  DB_SERVER: {'✓' if server else '✗'}")
    print(f"  DB_NAME: {'✓' if database else '✗'}")
    print(f"  DB_USERNAME: {'✓' if username else '✗'}")
    print(f"  DB_PASSWORD: {'✓' if password else '✗'}")
    sys.exit(0)

print(f"  Server: {server}")
print(f"  Database: {database}")
print(f"  Username: {username}")

try:
    import pyodbc
    import platform
    
    system = platform.system()
    timeout = 90 if system == "Linux" else 55
    
    print(f"  Platform: {system}")
    print(f"  pyodbc version: {pyodbc.version}")
    
    # Build connection string
    conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT={timeout};Mars_Connection=yes'
    
    if system == "Linux":
        conn_str += ';Packet Size=4096;TDS_Version=7.4'
    
    print(f"  Connection timeout: {timeout}s")
    print("  Connecting...")
    
    start = time.time()
    conn = pyodbc.connect(conn_str, timeout=timeout)
    conn_time = time.time() - start
    
    print(f"  ✅ Connected! ({conn_time:.2f}s)")
    
    cursor = conn.cursor()
    
    # Test simple query
    start = time.time()
    cursor.execute("SELECT @@VERSION")
    version = cursor.fetchone()[0]
    query_time = time.time() - start
    print(f"  Simple query time: {query_time:.3f}s")
    
    # Test monitoring query count (tanpa fetch data)
    from datetime import datetime, timedelta
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
    
    print("  Testing monitoring query (COUNT only)...")
    start = time.time()
    cursor.execute(count_query, (start_date.strftime('%Y-%m-%d %H:%M:%S'), end_date.strftime('%Y-%m-%d %H:%M:%S')))
    result = cursor.fetchone()
    count_time = time.time() - start
    
    print(f"  ✅ Count query completed!")
    print(f"  Total records: {result[0]}")
    print(f"  Count query time: {count_time:.2f}s")
    
    if count_time > 30:
        print(f"  ⚠️  WARNING: Query sangat lambat! (>30s)")
    elif count_time > 10:
        print(f"  ⚠️  Query agak lambat (>10s)")
    else:
        print(f"  ✓ Query performance OK")
    
    conn.close()
    
except ImportError as e:
    print(f"  ❌ Import error: {e}")
except Exception as e:
    print(f"  ❌ Connection/Query error: {e}")
    import traceback
    print(f"  Details: {traceback.format_exc()}")
PYTHON_EOF
else
    echo -e "${YELLOW}Skip: Virtual env atau .env tidak ditemukan${NC}"
    if [ -z "$VENV_FOUND" ]; then
        echo "  Virtual env: Tidak ditemukan"
    else
        echo "  Virtual env: $VENV_FOUND"
    fi
    if [ -z "$ENV_FILE" ]; then
        echo "  .env: Tidak ditemukan"
        echo "  Cek .env di:"
        find . -name ".env" -type f 2>/dev/null | head -3
    else
        echo "  .env: $ENV_FILE"
    fi
    echo ""
    echo "  Jalankan test_sql_connection.sh untuk test koneksi manual"
fi
echo ""

# 5. Cek Network Latency ke SQL Server
echo -e "${GREEN}[5] Network Latency Test${NC}"
echo "-------------------"
if [ -f "backend/.env" ] || [ -f ".env" ]; then
    # Extract DB_SERVER from .env
    DB_SERVER=$(grep DB_SERVER backend/.env 2>/dev/null | cut -d'=' -f2 | head -1 || grep DB_SERVER .env 2>/dev/null | cut -d'=' -f2 | head -1)
    
    if [ -n "$DB_SERVER" ]; then
        echo "Testing ping ke SQL Server: $DB_SERVER"
        ping -c 5 "$DB_SERVER" 2>/dev/null | tail -2 || echo "  Ping gagal atau server tidak merespon ICMP"
        
        echo ""
        echo "Testing port 1433:"
        timeout 5 bash -c "echo > /dev/tcp/$DB_SERVER/1433" 2>/dev/null && echo "  ✅ Port 1433 accessible" || echo "  ❌ Port 1433 tidak accessible"
    else
        echo -e "${YELLOW}DB_SERVER tidak ditemukan di .env${NC}"
    fi
else
    echo -e "${YELLOW}.env tidak ditemukan untuk test network${NC}"
fi
echo ""

# 6. Cek API Endpoint
echo -e "${GREEN}[6] API Endpoint Check${NC}"
echo "-------------------"
echo "Testing monitoring-order endpoint (jika aplikasi running)..."
echo ""

# Cek apakah ada service running di port 8001 atau 5000
if netstat -tlnp 2>/dev/null | grep -q ":8001\|:5000" || ss -tlnp 2>/dev/null | grep -q ":8001\|:5000"; then
    PORT=$(netstat -tlnp 2>/dev/null | grep -E ":8001|:5000" | head -1 | awk '{print $4}' | cut -d':' -f2 || ss -tlnp 2>/dev/null | grep -E ":8001|:5000" | head -1 | awk '{print $4}' | cut -d':' -f2)
    echo "  Aplikasi running di port: $PORT"
    echo ""
    echo "  Untuk test API, jalankan:"
    echo "  curl -X GET 'http://localhost:$PORT/api/query/monitoring-order?page=1' \\"
    echo "    -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "    -w '\\nTime: %{time_total}s\\n'"
else
    echo -e "${YELLOW}  Aplikasi tidak terdeteksi running${NC}"
fi
echo ""

# 7. Recommendations
echo "=========================================="
echo -e "${BLUE}RECOMMENDATIONS${NC}"
echo "=========================================="
echo ""

# Analyze results and give recommendations
if [ -f "backend/logs/development.log" ] || [ -f "backend/logs/production.log" ]; then
    echo "1. Review log files untuk query execution time"
    echo "   - Jika > 60s: Perlu optimasi query atau index database"
    echo "   - Jika 30-60s: Normal untuk Linux, tapi bisa dioptimasi"
    echo "   - Jika < 30s: Performance OK"
    echo ""
fi

echo "2. Jika query lambat, cek:"
echo "   - Index pada kolom OrderDate di database"
echo "   - Network latency ke SQL Server"
echo "   - Resource server (CPU/Memory)"
echo ""

echo "3. Untuk monitoring real-time:"
echo "   tail -f backend/logs/production.log | grep -i 'query\\|timeout\\|error'"
echo ""

echo "4. Test koneksi manual:"
echo "   /opt/venv/bin/python3 -c \"import pyodbc; print('OK')\""
echo ""

echo "=========================================="
echo -e "${GREEN}CHECK SELESAI${NC}"
echo "=========================================="

