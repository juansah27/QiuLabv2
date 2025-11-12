import os
import re
import subprocess
from pathlib import Path
import pyodbc
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Warna terminal ANSI
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

# Path utama folder brand
from path_helper import get_desty_path

BASE_PATH = get_desty_path()

# File input list order
ORDER_INPUT = "input_orders.txt"

# Database configuration - try to load from database_config.py first
try:
    from database_config import DB_SERVER, DB_NAME, DB_USERNAME, DB_PASSWORD, ODBC_DRIVER
except ImportError:
    # Fallback to environment variables
    DB_SERVER = os.getenv('DB_SERVER')
    DB_NAME = os.getenv('DB_NAME', 'Flexo_Db')
    DB_USERNAME = os.getenv('DB_USERNAME')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    ODBC_DRIVER = os.getenv('ODBC_DRIVER', 'ODBC Driver 17 for SQL Server')

processes = []

# Control external EXE behavior via environment variables
DESTY_SKIP_EXE = os.getenv("DESTY_SKIP_EXE", "0").strip() in ("1", "true", "True")
DESTY_EXE_TIMEOUT_SEC = int(os.getenv("DESTY_EXE_TIMEOUT_SEC", "600"))  # default 10 minutes

# Simple in-memory cache for EntityId lookups
_entity_id_cache = {}


def get_database_connection():
    """Create connection to SQL Server database with timeout"""
    try:
        if not all([DB_SERVER, DB_USERNAME, DB_PASSWORD]):
            print(f"{RED}❌ Database configuration missing. Please check database_config.py or environment variables.{RESET}")
            return None

        connection_string = f'DRIVER={{{ODBC_DRIVER}}};SERVER={DB_SERVER};DATABASE={DB_NAME};UID={DB_USERNAME};PWD={DB_PASSWORD};Connection Timeout=10'
        conn = pyodbc.connect(connection_string, timeout=10)
        print(f"{GREEN}✅ Connected to database successfully{RESET}")
        return conn
    except Exception as e:
        print(f"{RED}❌ Database connection failed: {e}{RESET}")
        return None


def clear_entity_id_cache():
    """Clear the EntityId cache"""
    global _entity_id_cache
    _entity_id_cache.clear()
    print(f"{CYAN}🗑️  EntityId cache cleared{RESET}")


def get_cache_stats():
    """Get cache statistics"""
    return {
        'cache_size': len(_entity_id_cache),
        'cached_ids': list(_entity_id_cache.keys()),
    }


def get_entity_ids_from_system_ref_ids(system_ref_ids):
    """Query EntityId from SystemRefId using database - Optimized version with caching"""
    if not system_ref_ids:
        return {}

    # Check cache first
    cached_results = {}
    uncached_ids = []

    for ref_id in system_ref_ids:
        if ref_id in _entity_id_cache:
            cached_results[ref_id] = _entity_id_cache[ref_id]
        else:
            uncached_ids.append(ref_id)

    # If all results are cached, return immediately
    if not uncached_ids:
        print(f"{GREEN}✅ All {len(system_ref_ids)} EntityIds found in cache{RESET}")
        return cached_results

    # Query database only for uncached IDs
    if uncached_ids:
        conn = get_database_connection()
        if not conn:
            print(f"{YELLOW}⚠️  Cannot connect to database. Using SystemRefId as EntityId.{RESET}")
            # Return cached results + fallback for uncached
            for ref_id in uncached_ids:
                cached_results[ref_id] = ref_id
            return cached_results

        try:
            cursor = conn.cursor()

            # Create placeholders for IN clause
            placeholders = ','.join(['?' for _ in uncached_ids])
            query = f"SELECT SystemRefId, EntityId FROM Flexo_Db.dbo.SalesOrder WHERE SystemRefId IN ({placeholders})"

            print(f"{CYAN}🔍 Querying EntityId for {len(uncached_ids)} uncached SystemRefIds...{RESET}")
            cursor.execute(query, uncached_ids)

            results = cursor.fetchall()

            # Process results and update cache
            for row in results:
                system_ref_id, entity_id = row
                cached_results[system_ref_id] = entity_id
                _entity_id_cache[system_ref_id] = entity_id  # Cache for future use

            # Check for missing mappings
            missing_ref_ids = set(uncached_ids) - set(cached_results.keys())
            if missing_ref_ids:
                print(f"{YELLOW}⚠️  No EntityId found for {len(missing_ref_ids)} SystemRefIds (using fallback){RESET}")
                # Use SystemRefId as fallback for missing EntityIds
                for ref_id in missing_ref_ids:
                    cached_results[ref_id] = ref_id
                    _entity_id_cache[ref_id] = ref_id  # Cache fallback too

            # Summary instead of individual logging
            found_count = len(cached_results) - len(missing_ref_ids)
            print(
                f"{GREEN}✅ Found EntityId for {found_count}/{len(system_ref_ids)} SystemRefIds (cached: {len(system_ref_ids) - len(uncached_ids)}){RESET}"
            )

            cursor.close()
            conn.close()

        except Exception as e:
            print(f"{RED}❌ Database query failed: {e}{RESET}")
            conn.close()
            # Fallback: use SystemRefId as EntityId for uncached
            for ref_id in uncached_ids:
                cached_results[ref_id] = ref_id

    return cached_results


def load_orders(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
        lines = file.readlines()

    orders = []
    system_ref_ids = []

    # First pass: collect all SystemRefIds
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if '\t' in line:
            brand, full_order = line.split('\t', 1)
        else:
            m = re.match(r'(.+?)\s+(\S+)$', line)
            if not m:
                continue
            brand, full_order = m.group(1), m.group(2)

        token_upper = full_order.strip().upper()
        if not (
            token_upper.startswith('DST-')
            or token_upper.startswith('1954')
            or token_upper.startswith('1955')
            or token_upper.startswith('1956')
        ):
            continue

        clean_order = full_order.strip()
        system_ref_ids.append(clean_order)
        orders.append((brand.strip(), clean_order))

    print(f"{CYAN}🔄 Processing {len(system_ref_ids)} Desty orders...{RESET}")
    entity_id_mapping = get_entity_ids_from_system_ref_ids(system_ref_ids)

    # Second pass: replace SystemRefId with EntityId
    final_orders = []
    for brand, system_ref_id in orders:
        entity_id = entity_id_mapping.get(system_ref_id, system_ref_id)
        final_orders.append((brand, entity_id))

    print(f"{GREEN}✅ Processed {len(final_orders)} orders with EntityId lookup{RESET}")
    return final_orders


def clean_brand_name(brand_name):
    name = re.sub(r"\s+", " ", brand_name.strip()).upper()
    custom_rename = {
    "HISTOIRE NATURELLE ID": "HISTOIRE",
    "HISTOIRE NATURELLE INDONESIA": "HISTOIRE",
    "HISTOIRE NATURELLE OFFICIAL STORE": "HISTOIRE",
    "HISTOIRE NATURELLE STORE": "HISTOIRE",
    "LUXCRIME ID": "LUXCRIME",
    "LUXCRIME OFFICIAL STORE": "LUXCRIME",
    "LUXCRIME OFFICIAL SHOP": "LUXCRIME",
    "LUXCRIME_ID": "LUXCRIME",
    "SKIN GAME": "SKINGAME",
    "SKIN GAME OFFICIAL": "SKINGAME",
    "SKIN GAME OFFICIAL SHOP": "SKINGAME",
    "SOMBONG MENS CARE": "SOMBONG",
    "SOMBONG OFFICIAL STORE": "SOMBONG",
    "SOMBONG.ID": "SOMBONG",
    "DOMMA": "DOMMA",
    "WITH DOMMA": "DOMMA"
}
    mapped = custom_rename.get(name)
    if mapped:
        return mapped
    if name.startswith("OFFICIAL STORE "):
        name = name[len("OFFICIAL STORE ") :].strip()
    suffixes = (
        " ID",
        " OFFICIAL STORE",
        " OFFICIAL SHOP",
        " OFFICIAL",
        " SHOP",
        " STORE",
        " INDONESIA",
        " MENS CARE",
    )
    changed = True
    while changed:
        changed = False
        for suf in suffixes:
            if name.endswith(suf):
                name = name[: -len(suf)].strip()
                changed = True
                break
    name = re.sub(r"\s+", " ", name).strip()
    return name


def get_best_matching_folder(base_path, brand_name):
    cleaned_brand = clean_brand_name(brand_name).lower()
    best_match = None
    for folder in os.listdir(base_path):
        folder_path = Path(base_path) / folder
        if folder_path.is_dir():
            if cleaned_brand in folder.lower():
                best_match = folder_path
                break
    if not best_match:
        print(
            f"❌ Tidak ada folder cocok untuk brand: {brand_name} (dibersihkan: {cleaned_brand})"
        )
    return best_match


def run_exe_parallel(brand_folder):
    if DESTY_SKIP_EXE:
        print(f"[!] WARNING: Skip menjalankan EXE untuk folder: {brand_folder} (DESTY_SKIP_EXE=1)")
        return
    exe_path = Path(brand_folder) / "Desty.Console.exe"
    if not exe_path.exists():
        print(f"[X] ERROR: Desty.Console.exe tidak ditemukan di: {exe_path}")
        return
    print(f"[*] INFO: Menjalankan .exe di: {brand_folder}")
    print(f"[*] Command: Desty.Console.exe")
    
    # Windows UNC path workaround: use pushd to map temporary drive
    # pushd automatically maps UNC to temp drive letter, popd unmaps it
    cmd = f'pushd "{brand_folder}" && Desty.Console.exe && popd'
    
    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace',
        shell=True
    )
    processes.append((p, brand_folder.name))


def main():
    orders = load_orders(ORDER_INPUT)

    brand_to_orders = {}
    for brand, order_number in orders:
        brand_to_orders.setdefault(brand.strip(), []).append(order_number.strip())

    updated_folders = set()
    for brand, order_numbers in brand_to_orders.items():
        brand_folder = get_best_matching_folder(BASE_PATH, brand)
        if not brand_folder:
            continue
        if not brand_folder.exists():
            print(f"❌ Folder tidak ditemukan: {brand_folder}")
            continue
        orderlist_path = Path(brand_folder) / "orderlist.txt"
        new_content = "\n".join(order_numbers) + "\n"
        old_content = None
        if orderlist_path.exists():
            try:
                old_content = orderlist_path.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                old_content = None
        if old_content != new_content:
            with open(orderlist_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
        updated_folders.add(brand_folder)

    for folder in updated_folders:
        run_exe_parallel(folder)

    # Wait and capture output from all processes with timeout
    print(f"\n[*] Menunggu semua proses .exe selesai (timeout: {DESTY_EXE_TIMEOUT_SEC}s)...")
    for p, brand_name in processes:
        print(f"\n[*] Output dari {brand_name}:")
        print("-" * 60)
        
        try:
            # Read output line by line
            if p.stdout:
                for line in p.stdout:
                    print(f"[{brand_name}] {line.rstrip()}")
            
            # Wait with timeout
            return_code = p.wait(timeout=DESTY_EXE_TIMEOUT_SEC)
            
            if return_code == 0:
                print(f"[OK] {brand_name}: Selesai dengan sukses")
            else:
                print(f"[X] {brand_name}: Selesai dengan error (exit code: {return_code})")
                
        except subprocess.TimeoutExpired:
            print(f"[!] WARNING: {brand_name} melebihi timeout {DESTY_EXE_TIMEOUT_SEC}s. Mencoba terminate...")
            try:
                p.terminate()
                p.wait(timeout=15)
                print(f"[OK] {brand_name}: Process terminated")
            except Exception:
                print(f"[!] WARNING: Terminate gagal. Memaksa kill...")
                try:
                    p.kill()
                    print(f"[X] {brand_name}: Process killed")
                except Exception:
                    pass
        
        print("-" * 60)

    print(f"\n[OK] DONE: Semua proses selesai dijalankan.")


if __name__ == "__main__":
    main()


