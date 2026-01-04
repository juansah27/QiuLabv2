#!/bin/bash

# Script Diagnostik Monitoring Order untuk Linux Ubuntu VM
# Jalankan dengan: bash check_monitoring_order.sh

echo "=========================================="
echo "  DIAGNOSTIK MONITORING ORDER - LINUX"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. System Information
echo -e "${GREEN}[1] System Information${NC}"
echo "-------------------"
echo "OS: $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')"
echo ""

# 2. Python Environment
echo -e "${GREEN}[2] Python Environment${NC}"
echo "-------------------"
if command -v python3 &> /dev/null; then
    echo "Python Version: $(python3 --version)"
    echo "Python Path: $(which python3)"
else
    echo -e "${RED}Python3 tidak ditemukan!${NC}"
fi
echo ""

# 3. ODBC Driver Check
echo -e "${GREEN}[3] ODBC Driver Check${NC}"
echo "-------------------"
if command -v odbcinst &> /dev/null; then
    echo "ODBC Drivers terinstall:"
    odbcinst -q -d 2>/dev/null || echo "Tidak ada driver terdeteksi"
    echo ""
    if [ -f /etc/odbcinst.ini ]; then
        echo "ODBC Config (/etc/odbcinst.ini):"
        cat /etc/odbcinst.ini | grep -A 5 "\[ODBC Driver" || echo "Tidak ada konfigurasi driver"
    fi
else
    echo -e "${RED}odbcinst tidak ditemukan. Install unixodbc-dev${NC}"
fi
echo ""

# 4. Python Packages
echo -e "${GREEN}[4] Python Packages${NC}"
echo "-------------------"
if command -v pip3 &> /dev/null; then
    echo "Checking required packages:"
    for pkg in pyodbc flask python-dotenv; do
        if pip3 show $pkg &> /dev/null; then
            version=$(pip3 show $pkg | grep Version | awk '{print $2}')
            echo -e "  ${GREEN}✓${NC} $pkg: $version"
        else
            echo -e "  ${RED}✗${NC} $pkg: TIDAK TERINSTALL"
        fi
    done
else
    echo -e "${RED}pip3 tidak ditemukan${NC}"
fi
echo ""

# 5. Resource Usage
echo -e "${GREEN}[5] Resource Usage${NC}"
echo "-------------------"
echo "CPU Load Average:"
echo "  $(uptime | awk -F'load average:' '{print $2}')"
echo ""
echo "Memory Usage:"
free -h | grep -E "Mem|Swap"
echo ""
echo "Disk Usage:"
df -h | grep -E "Filesystem|/$|/var|/tmp" | head -4
echo ""

# 6. Network Connectivity
echo -e "${GREEN}[6] Network Connectivity${NC}"
echo "-------------------"
echo "IP Address:"
hostname -I | awk '{print $1}'
echo ""
echo "Default Gateway:"
ip route | grep default | awk '{print $3}' | head -1
echo ""
echo -e "${YELLOW}Note: Untuk test koneksi ke SQL Server, jalankan:${NC}"
echo "  ping -c 5 YOUR_SQL_SERVER_IP"
echo "  telnet YOUR_SQL_SERVER_IP 1433"
echo ""

# 7. Process Check
echo -e "${GREEN}[7] Running Processes${NC}"
echo "-------------------"
echo "Python processes:"
ps aux | grep -E "python|flask|gunicorn|uvicorn" | grep -v grep | head -5 || echo "Tidak ada Python process running"
echo ""

# 8. Port Check
echo -e "${GREEN}[8] Port Check${NC}"
echo "-------------------"
echo "Listening ports (Python/Flask):"
netstat -tlnp 2>/dev/null | grep -E "python|flask|:5000|:8000" || ss -tlnp 2>/dev/null | grep -E "python|flask|:5000|:8000" || echo "Tidak ada port terdeteksi"
echo ""

# 9. Environment Variables Check
echo -e "${GREEN}[9] Environment Variables${NC}"
echo "-------------------"
if [ -f .env ]; then
    echo "File .env ditemukan"
    echo "DB_SERVER: $(grep DB_SERVER .env | cut -d'=' -f2 | head -1 || echo 'Tidak ditemukan')"
    echo "DB_NAME: $(grep DB_NAME .env | cut -d'=' -f2 | head -1 || echo 'Tidak ditemukan')"
    echo "DB_USERNAME: $(grep DB_USERNAME .env | cut -d'=' -f2 | head -1 || echo 'Tidak ditemukan')"
    echo "DB_PASSWORD: $(grep DB_PASSWORD .env | cut -d'=' -f2 | head -1 | sed 's/./*/g' || echo 'Tidak ditemukan')"
else
    echo -e "${YELLOW}File .env tidak ditemukan di direktori saat ini${NC}"
    echo "Cari di: find . -name '.env' -type f 2>/dev/null"
fi
echo ""

# 10. Log Files Check
echo -e "${GREEN}[10] Log Files Check${NC}"
echo "-------------------"
echo "Mencari log files:"
find . -name "*.log" -type f 2>/dev/null | head -5 || echo "Tidak ada log files ditemukan"
echo ""
echo "Recent log entries (jika ada):"
if [ -f app.log ]; then
    echo "Last 5 lines dari app.log:"
    tail -5 app.log
elif [ -f /var/log/app.log ]; then
    echo "Last 5 lines dari /var/log/app.log:"
    tail -5 /var/log/app.log
else
    echo "Tidak ada log file ditemukan"
fi
echo ""

# 11. Firewall Check
echo -e "${GREEN}[11] Firewall Check${NC}"
echo "-------------------"
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    sudo ufw status 2>/dev/null || echo "Perlu sudo untuk cek firewall"
else
    echo "UFW tidak terinstall"
fi
echo ""

# 12. Timezone Check
echo -e "${GREEN}[12] Timezone Check${NC}"
echo "-------------------"
echo "Current timezone: $(timedatectl show -p Timezone --value 2>/dev/null || date +%Z)"
echo "Current time: $(date)"
echo ""

# 13. Quick Test Connection (if .env exists)
echo -e "${GREEN}[13] Quick Connection Test${NC}"
echo "-------------------"
if [ -f .env ] && command -v python3 &> /dev/null; then
    echo "Testing Python connection to SQL Server..."
    python3 << 'PYTHON_EOF'
import os
import sys
from dotenv import load_dotenv

try:
    load_dotenv()
    server = os.getenv('DB_SERVER')
    database = os.getenv('DB_NAME')
    username = os.getenv('DB_USERNAME')
    password = os.getenv('DB_PASSWORD')
    
    if not all([server, database, username, password]):
        print("  ⚠️  Environment variables tidak lengkap")
        sys.exit(0)
    
    print(f"  Server: {server}")
    print(f"  Database: {database}")
    print(f"  Username: {username}")
    
    try:
        import pyodbc
        print(f"  pyodbc version: {pyodbc.version}")
        
        # Test connection
        import platform
        system = platform.system()
        timeout = 90 if system == "Linux" else 55
        
        conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TIMEOUT={timeout};Mars_Connection=yes'
        
        if system == "Linux":
            conn_str += ';Packet Size=4096;TDS_Version=7.4'
        
        print(f"  Platform: {system}")
        print(f"  Connection timeout: {timeout}s")
        print("  Attempting connection...")
        
        import time
        start = time.time()
        conn = pyodbc.connect(conn_str, timeout=timeout)
        elapsed = time.time() - start
        
        print(f"  ✅ Connection successful! ({elapsed:.2f}s)")
        
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"  SQL Server version: {version[:50]}...")
        
        conn.close()
        
    except ImportError:
        print("  ❌ pyodbc tidak terinstall")
    except Exception as e:
        print(f"  ❌ Connection failed: {str(e)}")
        
except Exception as e:
    print(f"  ❌ Error: {str(e)}")
PYTHON_EOF
else
    echo -e "${YELLOW}Skip: .env atau python3 tidak ditemukan${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}DIAGNOSTIK SELESAI${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Cek log aplikasi untuk query execution time"
echo "2. Test koneksi network ke SQL Server"
echo "3. Cek resource usage saat aplikasi running"
echo "4. Review hasil di atas dan kirimkan untuk analisis lebih lanjut"
echo ""

