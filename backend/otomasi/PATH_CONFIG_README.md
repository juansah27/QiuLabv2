# Cross-Platform Path Configuration

## 🎯 Problem
File `.exe` otomasi berada di network share dengan path yang berbeda per OS:
- **Linux/WSL:** `/mnt/share2/`
- **Windows:** `Z:\` atau `\\server\share2\`
- **macOS:** `/Volumes/share2/`

## ✅ Solution

### 1. **Auto-Detection (Default)**
System otomatis detect OS dan coba path yang sesuai:

**Windows:**
```
Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
\\10.6.0.6\share2\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
\\server\share2\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
```

**Linux/WSL:**
```
/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
/media/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
```

**macOS:**
```
/Volumes/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
```

### 2. **Environment Variables (Recommended)**

Set custom path via environment variables:

**Windows (PowerShell):**
```powershell
$env:SHOPEE_BASE_PATH = "Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )"
$env:TIKTOK_BASE_PATH = "Z:\TIKTOK\GetOrderTiktok"
$env:LAZADA_BASE_PATH = "Z:\LAZADA\LazadaGetOrder"
$env:DESTY_BASE_PATH = "Z:\DESTY\DestyGetOrder"
$env:GINEE_BASE_PATH = "Z:\GINEE"
$env:JUBELIO_BASE_PATH = "Z:\"
```

**Windows (CMD):**
```cmd
set SHOPEE_BASE_PATH=Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
set TIKTOK_BASE_PATH=Z:\TIKTOK\GetOrderTiktok
```

**Linux/macOS (Bash):**
```bash
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
export TIKTOK_BASE_PATH="/mnt/share2/TIKTOK/GetOrderTiktok"
export LAZADA_BASE_PATH="/mnt/share2/LAZADA/LazadaGetOrder"
export DESTY_BASE_PATH="/mnt/share2/DESTY/DestyGetOrder"
export GINEE_BASE_PATH="/mnt/share2/GINEE"
export JUBELIO_BASE_PATH="/mnt/share1"
```

### 3. **Permanent Configuration**

**Windows - System Environment Variables:**
1. Right-click "This PC" → Properties
2. Advanced System Settings → Environment Variables
3. Add new User/System variable:
   - Name: `SHOPEE_BASE_PATH`
   - Value: `Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )`

**Linux/macOS - .bashrc or .zshrc:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
export TIKTOK_BASE_PATH="/mnt/share2/TIKTOK/GetOrderTiktok"
# ... etc
```

**Using .env file (Flask app):**
Create `backend/.env`:
```env
SHOPEE_BASE_PATH=Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
TIKTOK_BASE_PATH=Z:\TIKTOK\GetOrderTiktok
LAZADA_BASE_PATH=Z:\LAZADA\LazadaGetOrder
DESTY_BASE_PATH=Z:\DESTY\DestyGetOrder
GINEE_BASE_PATH=Z:\GINEE
JUBELIO_BASE_PATH=Z:\
```

## 📋 Available Environment Variables

| Variable | Default Linux | Default Windows | Marketplace |
|----------|--------------|-----------------|-------------|
| `SHOPEE_BASE_PATH` | `/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )` | `Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )` | Shopee |
| `TIKTOK_BASE_PATH` | `/mnt/share2/TIKTOK/GetOrderTiktok` | `Z:\TIKTOK\GetOrderTiktok` | Tiktok |
| `LAZADA_BASE_PATH` | `/mnt/share2/LAZADA/LazadaGetOrder` | `Z:\LAZADA\LazadaGetOrder` | Lazada |
| `DESTY_BASE_PATH` | `/mnt/share2/DESTY/DestyGetOrder` | `Z:\DESTY\DestyGetOrder` | Desty |
| `GINEE_BASE_PATH` | `/mnt/share2/GINEE` | `Z:\GINEE` | Ginee |
| `JUBELIO_BASE_PATH` | `/mnt/share1` | `Z:\` | Jubelio |

## 🔍 Troubleshooting

**Issue:** Script can't find .exe files

**Solution:**
1. Check if network share is mounted/mapped
2. Verify path exists: `ls $SHOPEE_BASE_PATH` (Linux) or `dir %SHOPEE_BASE_PATH%` (Windows)
3. Set environment variable with correct path
4. Check script output for path detection message

**Script Output Examples:**
```
✅ Using SHOPEE path from env: Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )
✅ Auto-detected SHOPEE path: /mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )
⚠️ Warning: No valid SHOPEE path found, using fallback: /mnt/share2/SHOPEE/...
💡 Tip: Set environment variable SHOPEE_BASE_PATH to custom path
```

## 🚀 Quick Setup Per OS

### Windows (with mapped drive Z:)
```powershell
# Map network drive
net use Z: \\10.6.0.6\share2

# Set env vars (add to system env for permanent)
$env:SHOPEE_BASE_PATH = "Z:\SHOPEE\ShopeeManualPerShopV2 ( BRAND )"
$env:TIKTOK_BASE_PATH = "Z:\TIKTOK\GetOrderTiktok"
```

### WSL (Windows Subsystem for Linux)
```bash
# Mount should auto-exist at /mnt/share2
# If not, mount manually:
sudo mount -t drvfs '\\10.6.0.6\share2' /mnt/share2

# Add to ~/.bashrc for permanent
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
```

### Linux
```bash
# Mount network share
sudo mount -t cifs //10.6.0.6/share2 /mnt/share2 -o username=user,password=pass

# Add to ~/.bashrc
export SHOPEE_BASE_PATH="/mnt/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
```

### macOS
```bash
# Mount via Finder: Cmd+K → smb://10.6.0.6/share2
# Or terminal:
mount_smbfs //user@10.6.0.6/share2 /Volumes/share2

# Add to ~/.zshrc
export SHOPEE_BASE_PATH="/Volumes/share2/SHOPEE/ShopeeManualPerShopV2 ( BRAND )"
```

