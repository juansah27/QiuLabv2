import os
import platform
import subprocess
from pathlib import Path

RED = '\\033[91m'
GREEN = '\\033[92m'
YELLOW = '\\033[93m'
CYAN = '\\033[96m'
RESET = '\\033[0m'

from path_helper import get_jubelio_path

BASE_PATH = get_jubelio_path()
ORDER_INPUT = "input_orders.txt"

processes = []


def load_orders(filepath):
    with open(filepath, 'r') as file:
        lines = file.readlines()
    orders = []
    for line in lines:
        parts = line.strip().split('\t')
        if len(parts) == 2:
            brand, full_order = parts
            token_upper = full_order.strip().upper()
            brand_upper = brand.strip().upper()
            if brand_upper == 'FINALLY FOUND YOU':
                if (
                    token_upper.startswith('SHOPEE')
                    or token_upper.startswith('25')
                    or token_upper.startswith('TTS')
                    or token_upper.startswith('579')
                ):
                    continue
            if not (
                token_upper.startswith('SP-')
                or token_upper.startswith('TT-')
                or token_upper.startswith('TP-')
                or token_upper.startswith('LZ-')
            ):
                continue
            clean_order = full_order.strip()
            orders.append((brand.strip(), clean_order))
    return orders


def clean_brand_name(brand_name):
    name = brand_name.upper()
    if name.startswith("EBLO-"):
        name = name[5:]
    if name.endswith("-TTS"):
        name = name[:-4]
    return name.strip()


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
        print(f"❌ Tidak ada folder cocok untuk brand: {brand_name} (dibersihkan: {cleaned_brand})")
    return best_match


def run_exe_parallel(brand_folder):
    exe_path = Path(brand_folder) / "Jubelio_project.exe"
    if not exe_path.exists():
        print(f"[X] ERROR: Jubelio_project.exe tidak ditemukan di: {exe_path}")
        return
    # Check OS and handle .exe execution accordingly
    system = platform.system()
    
    if system == "Linux":
        # On Linux, .exe files are Windows executables - need Wine
        wine_check = subprocess.run(['which', 'wine'], capture_output=True, text=True)
        if wine_check.returncode == 0:
            exe_command = "wine Jubelio_project.exe"
            print(f"[*] INFO: Menjalankan .exe dengan Wine di: {brand_folder}")
        else:
            print(f"[!] INFO: Wine tidak ditemukan. Skip menjalankan .exe di Linux.")
            print(f"[!] orderlist.txt sudah di-update. Jalankan .exe secara manual di Windows server jika diperlukan.")
            print(f"[!] Install Wine untuk auto-execute: sudo apt install -y wine")
            return
    else:
        # Windows: run directly
        exe_command = "Jubelio_project.exe"
        print(f"[*] INFO: Menjalankan .exe di: {brand_folder}")
    
    print(f"[*] Command: {exe_command}")
    
    # Windows UNC path workaround: use pushd to map temporary drive
    # Use bash for Linux compatibility (pushd is bash builtin, not available in /bin/sh)
    cmd = f'pushd "{brand_folder}" && {exe_command} && popd'
    
    # Use bash if available (for Linux), otherwise use default shell (Windows)
    executable = '/bin/bash' if os.path.exists('/bin/bash') else None
    
    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace',
        shell=True,
        executable=executable
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
        new_content = '\n'.join(order_numbers) + '\n'
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
    
    # Wait and capture output from all processes
    print(f"\n[*] Menunggu semua proses .exe selesai...")
    for p, brand_name in processes:
        print(f"\n[*] Output dari {brand_name}:")
        print("-" * 60)
        
        if p.stdout:
            for line in p.stdout:
                print(f"[{brand_name}] {line.rstrip()}")
        
        return_code = p.wait()
        
        if return_code == 0:
            print(f"[OK] {brand_name}: Selesai dengan sukses")
        else:
            print(f"[X] {brand_name}: Selesai dengan error (exit code: {return_code})")
        print("-" * 60)

    print(f"\n[OK] DONE: Semua proses selesai dijalankan.")


if __name__ == "__main__":
    main()


