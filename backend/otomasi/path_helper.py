"""
Path Helper for Cross-Platform Otomasi Scripts
Supports Windows, Linux, macOS with environment variable override
"""
import os
import platform


def get_marketplace_base_path(marketplace: str, env_var: str, default_subpath: str) -> str:
    """
    Get base path for marketplace with OS detection and env var override
    
    Args:
        marketplace: Name of marketplace (e.g., 'SHOPEE', 'TIKTOK')
        env_var: Environment variable name (e.g., 'SHOPEE_BASE_PATH')
        default_subpath: Default subpath after share (e.g., 'SHOPEE/ShopeeManualPerShopV2 ( BRAND )')
    
    Returns:
        Resolved base path
    """
    # 1. Check environment variable first (highest priority)
    env_path = os.getenv(env_var)
    if env_path and os.path.exists(env_path):
        print(f"[OK] Using {marketplace} path from env: {env_path}")
        return env_path
    
    # 2. OS-specific paths
    system = platform.system()
    
    if system == "Windows":
        # Windows: Try mapped drive, UNC paths
        win_subpath = default_subpath.replace('/', '\\')
        base_paths = [
            f"\\\\10.6.12.146\\Manual\\{win_subpath}",  # Custom server
            f"Z:\\{win_subpath}",  # Mapped drive Z:
            f"\\\\10.6.0.6\\share2\\{win_subpath}",  # Old UNC with IP
            f"\\\\server\\share2\\{win_subpath}"  # UNC with hostname
        ]
    elif system == "Linux":
        # Linux/WSL: Try common mount points
        base_paths = [
            f"/mnt/share2/{default_subpath}",  # WSL default
            f"/media/share2/{default_subpath}",  # Linux standard
            f"/mnt/nas/{default_subpath}"  # Alternative mount
        ]
    elif system == "Darwin":  # macOS
        base_paths = [
            f"/Volumes/share2/{default_subpath}"
        ]
    else:
        base_paths = []
    
    # 3. Find first existing path
    for path in base_paths:
        if os.path.exists(path):
            print(f"[OK] Auto-detected {marketplace} path: {path}")
            return path
    
    # 4. Fallback (will likely fail but shows error)
    fallback = f"/mnt/share2/{default_subpath}"
    print(f"[!] Warning: No valid {marketplace} path found, using fallback: {fallback}")
    print(f"[*] Tip: Set environment variable {env_var} to custom path")
    return fallback


def get_shopee_path():
    return get_marketplace_base_path(
        "SHOPEE",
        "SHOPEE_BASE_PATH",
        "SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
    )


def get_tiktok_path():
    return get_marketplace_base_path(
        "TIKTOK",
        "TIKTOK_BASE_PATH",
        "TIKTOK/GetOrderTiktok"
    )


def get_lazada_path():
    return get_marketplace_base_path(
        "LAZADA",
        "LAZADA_BASE_PATH",
        "LAZADA/LazadaGetOrder"
    )


def get_desty_path():
    return get_marketplace_base_path(
        "DESTY",
        "DESTY_BASE_PATH",
        "DESTY/DestyGetOrder"
    )


def get_ginee_path():
    return get_marketplace_base_path(
        "GINEE",
        "GINEE_BASE_PATH",
        "GINEE"
    )


def get_jubelio_path():
    # Jubelio uses different server: 10.6.12.174
    env_path = os.getenv("JUBELIO_BASE_PATH")
    if env_path and os.path.exists(env_path):
        print(f"[OK] Using JUBELIO path from env: {env_path}")
        return env_path
    
    system = platform.system()
    
    if system == "Windows":
        base_paths = [
            r"\\10.6.12.174\JubelioJob\JubelioManual",  # Correct Jubelio server
            r"\\10.6.12.146\System Support\Manual",  # Fallback old path
            "Z:\\",
            r"\\10.6.0.6\share1"
        ]
    elif system == "Linux":
        base_paths = [
            "/mnt/jubelio",  # Custom mount point for Jubelio
            "/mnt/share1",
            "/media/share1"
        ]
    elif system == "Darwin":
        base_paths = [
            "/Volumes/JubelioJob/JubelioManual",
            "/Volumes/share1"
        ]
    else:
        base_paths = []
    
    for path in base_paths:
        if os.path.exists(path):
            print(f"[OK] Auto-detected JUBELIO path: {path}")
            return path
    
    fallback = r"\\10.6.12.174\JubelioJob\JubelioManual"
    print(f"[!] Warning: No valid JUBELIO path found, using fallback: {fallback}")
    print(f"[*] Tip: Set environment variable JUBELIO_BASE_PATH to custom path")
    return fallback

