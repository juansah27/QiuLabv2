@echo off
setlocal enabledelayedexpansion

:: Script deployment untuk aplikasi QiuLab di Windows
:: Penggunaan: deploy.bat [dev|prod]
:: Author: Handiyan Juansah

echo ========================================
echo   QiuLab Deployment Script
echo   Version: 2.0
echo ========================================
echo.

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

:: 1. Setup Backend
echo [INFO] Memulai setup backend...

cd backend

:: Verifikasi Python tersedia
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python tidak ditemukan. Pastikan Python terinstal dan ada di PATH.
    exit /b 1
)

:: Setup virtual environment jika belum ada
if not exist "venv" (
    echo [INFO] Membuat virtual environment...
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal membuat virtual environment
        exit /b 1
    )
    echo [SUCCESS] Virtual environment berhasil dibuat
)

:: Aktifkan virtual environment
echo [INFO] Mengaktifkan virtual environment...
call venv\Scripts\activate

:: Install dependensi
echo [INFO] Menginstal dependensi backend...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstal dependensi backend
    exit /b 1
)
echo [SUCCESS] Dependensi backend berhasil diinstal

:: Verifikasi dependensi penting sudah terinstall
echo [INFO] Memverifikasi dependensi penting...
pip show waitress >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Waitress tidak ditemukan, menginstal...
    pip install waitress
)
pip show pyodbc >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] pyodbc tidak ditemukan, menginstal...
    pip install pyodbc
)
echo [SUCCESS] Verifikasi dependensi selesai

:: Kembali ke direktori root
cd ..

:: 2. Setup Frontend
echo [INFO] Memulai setup frontend...

cd frontend

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
cd ..

:: 3. Jalankan aplikasi sesuai mode
if "%MODE%"=="dev" (
    :: Mode Development: Jalankan backend dan frontend dalam console terpisah
    echo [INFO] Memulai aplikasi dalam mode DEVELOPMENT...
    echo.
    
    :: Jalankan backend dalam console terpisah
    echo [INFO] Memulai backend development server...
    echo [INFO] Backend akan berjalan di http://localhost:5000
    start "Backend Server (Dev)" cmd /k "cd backend && call venv\Scripts\activate && python run_dev.py"
    
    :: Tunggu sebentar agar backend sempat start
    timeout /t 3 /nobreak >nul
    
    :: Jalankan frontend dalam console terpisah
    echo [INFO] Memulai frontend development server...
    echo [INFO] Frontend akan berjalan di http://localhost:3000
    start "Frontend Server (Dev)" cmd /k "cd frontend && npm run dev:network"
    
    echo.
    echo [SUCCESS] Mode development dijalankan!
    echo [INFO] Backend: http://localhost:5000
    echo [INFO] Frontend: http://localhost:3000
    echo [INFO] Tekan Ctrl+C pada masing-masing console untuk menghentikan server
    echo.
    
) else (
    :: Mode Production: Jalankan backend dan hasil build frontend
    echo [INFO] Memulai aplikasi dalam mode PRODUCTION...
    echo.
    
    :: Jalankan backend dalam console terpisah
    echo [INFO] Memulai backend production server...
    echo [INFO] Backend akan berjalan di http://localhost:5000
    start "Production Backend" cmd /k "cd backend && call venv\Scripts\activate && python run_prod.py"
    
    :: Tunggu sebentar agar backend sempat start
    timeout /t 3 /nobreak >nul
    
    :: Jalankan frontend (hasil build) dalam console terpisah
    echo [INFO] Memulai frontend production server...
    echo [INFO] Frontend akan berjalan di http://localhost:4173
    start "Production Frontend" cmd /k "cd frontend && npm run preview:network"
    
    echo.
    echo [SUCCESS] Mode production dijalankan!
    echo [INFO] Backend: http://localhost:5000
    echo [INFO] Frontend: http://localhost:4173
    echo [INFO] Tekan Ctrl+C pada masing-masing console untuk menghentikan server
    echo.
)

echo.
echo ========================================
echo   Deployment Setup Selesai!
echo ========================================
echo [INFO] Gunakan alamat IP jaringan lokal untuk mengakses dari perangkat lain.
echo [INFO] Pastikan firewall mengizinkan port 3000 (dev) atau 4173 (prod) untuk frontend
echo [INFO] Pastikan firewall mengizinkan port 5000 untuk backend
echo.
echo [TIP] Untuk menghentikan server, tutup window console yang sesuai
echo.

endlocal 