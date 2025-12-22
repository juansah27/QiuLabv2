@echo off
setlocal enabledelayedexpansion

:: Script deployment untuk aplikasi di Windows
:: Penggunaan: deploy.bat [dev|prod]

:: Default ke mode development jika tidak ada argumen
set MODE=dev
if not "%~1"=="" set MODE=%~1

:: Verifikasi argumen
if not "%MODE%"=="dev" if not "%MODE%"=="prod" (
    echo [ERROR] Mode tidak valid. Gunakan 'dev' atau 'prod'
    echo Penggunaan: deploy.bat [dev|prod]
    exit /b 1
)

echo [INFO] Memulai deployment aplikasi dalam mode %MODE%...

:: Pastikan kita berada di direktori yang benar (root project)
if not exist "backend" (
    echo [ERROR] Script harus dijalankan dari direktori root project yang berisi folder backend dan frontend
    exit /b 1
)
if not exist "frontend" (
    echo [ERROR] Script harus dijalankan dari direktori root project yang berisi folder backend dan frontend
    exit /b 1
)

:: Simpan path root project (mengantisipasi path dengan spasi)
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

:: 1. Setup Backend
echo [INFO] Memulai setup backend...

cd /d "%ROOT_DIR%\backend"

:: Verifikasi Python tersedia
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python tidak ditemukan. Pastikan Python terinstal dan ada di PATH.
    exit /b 1
)

:: Setup virtual environment jika belum ada
if not exist "venv" (
    echo [INFO] Membuat virtual environment...
    python -m venv "venv"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal membuat virtual environment
        exit /b 1
    )
    echo [SUCCESS] Virtual environment berhasil dibuat
)

:: Aktifkan virtual environment
echo [INFO] Mengaktifkan virtual environment...
call "venv\Scripts\activate.bat"

:: Install dependensi
echo [INFO] Menginstal dependensi backend...
pip install -r "requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstal dependensi backend
    exit /b 1
)
echo [SUCCESS] Dependensi backend berhasil diinstal

:: Install dependensi tambahan untuk deployment production
if "%MODE%"=="prod" (
    echo [INFO] Menginstal dependensi tambahan untuk production...
    pip install waitress
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal menginstal dependensi tambahan
        exit /b 1
    )
    echo [SUCCESS] Dependensi tambahan untuk production berhasil diinstal
)

:: Kembali ke direktori root
cd /d "%ROOT_DIR%"

:: 2. Setup Frontend
echo [INFO] Memulai setup frontend...

cd /d "%ROOT_DIR%\frontend"

:: Verifikasi Node.js tersedia
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js/npm tidak ditemukan. Pastikan Node.js terinstal dan ada di PATH.
    exit /b 1
)

:: Install dependensi frontend
echo [INFO] Menginstal dependensi frontend...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstal dependensi frontend
    exit /b 1
)
echo [SUCCESS] Dependensi frontend berhasil diinstal

:: Build frontend jika mode production
if "%MODE%"=="prod" (
    echo [INFO] Building frontend untuk production...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal build frontend
        exit /b 1
    )
    echo [SUCCESS] Frontend berhasil di-build untuk production
)

:: Kembali ke direktori root
cd /d "%ROOT_DIR%"

:: 3. Jalankan aplikasi sesuai mode
if "%MODE%"=="dev" (
    :: Mode Development: Jalankan backend dan frontend dalam console terpisah
    echo [INFO] Memulai aplikasi dalam mode DEVELOPMENT...
    
    :: Jalankan backend dalam console terpisah
    echo [INFO] Memulai backend di http://localhost:5000...
    set "BACKEND_CMD=cd /d \"!ROOT_DIR!\backend\" && call \"venv\Scripts\activate.bat\" && python run_dev.py"
    start "Backend Server" cmd /k "!BACKEND_CMD!"
    
    :: Jalankan frontend dalam console terpisah
    echo [INFO] Memulai frontend di http://localhost:3000...
    set "FRONTEND_CMD=cd /d \"!ROOT_DIR!\frontend\" && npm run dev:network"
    start "Frontend Server" cmd /k "!FRONTEND_CMD!"
    
    echo [SUCCESS] Mode development dijalankan. Buka browser di http://localhost:3000
    echo [INFO] Tekan Ctrl+C pada masing-masing console untuk menghentikan server
    
) else (
    :: Mode Production: Jalankan backend dan hasil build frontend
    echo [INFO] Memulai aplikasi dalam mode PRODUCTION...
    
    :: Jalankan backend dalam console terpisah
    echo [INFO] Memulai backend production server...
    set "BACKEND_CMD=cd /d \"!ROOT_DIR!\backend\" && call \"venv\Scripts\activate.bat\" && python run_prod.py"
    start "Production Backend" cmd /k "!BACKEND_CMD!"
    
    :: Jalankan frontend (hasil build) dalam console terpisah
    echo [INFO] Memulai frontend production server...
    set "FRONTEND_CMD=cd /d \"!ROOT_DIR!\frontend\" && npm run preview:network"
    start "Production Frontend" cmd /k "!FRONTEND_CMD!"
    
    echo [SUCCESS] Mode production dijalankan. Buka browser di http://localhost:4173
    echo [INFO] Tekan Ctrl+C pada masing-masing console untuk menghentikan server
)

echo [SUCCESS] Setup deployment selesai!
echo [INFO] Gunakan alamat IP jaringan lokal untuk mengakses dari perangkat lain.

endlocal 