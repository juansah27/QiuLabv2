import os
import subprocess
from pathlib import Path

from path_helper import get_ginee_path

BASE_PATH = get_ginee_path()
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
            if not (token_upper.startswith('GN-') or token_upper.startswith('GN')):
                continue
            clean_order = full_order.strip()
            if clean_order.upper().startswith('GN-'):
                clean_order = clean_order[3:].strip()
            elif clean_order.upper().startswith('GN'):
                clean_order = clean_order[2:].strip()
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
    exe_path = Path(brand_folder) / "Ginee.sync.exe"
    if not exe_path.exists():
        print(f"[X] ERROR: Ginee.sync.exe tidak ditemukan di: {exe_path}")
        return
    print(f"[*] INFO: Menjalankan .exe di: {brand_folder}")
    print(f"[*] Command: Ginee.sync.exe")
    
    # Windows UNC path workaround: use pushd to map temporary drive
    cmd = f'pushd "{brand_folder}" && Ginee.sync.exe && popd'
    
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


