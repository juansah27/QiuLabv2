# QiuLab Setup Script for Windows (PowerShell)
# Jalankan script ini dengan klik kanan > Run with PowerShell atau di terminal: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "=== QiuLab Otomatis Setup ===" -ForegroundColor Cyan

# 1. Cek Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "[!] Python belum terinstal. Silakan download dan install dari https://www.python.org/downloads/ lalu jalankan ulang script ini." -ForegroundColor Red
    exit 1
} else {
    $pyver = python --version
    Write-Host "[OK] Python ditemukan: $pyver" -ForegroundColor Green
}

# 2. Cek Git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "[!] Git belum terinstal. Silakan download dan install dari https://git-scm.com/download/win lalu jalankan ulang script ini." -ForegroundColor Red
    exit 1
} else {
    $gitver = git --version
    Write-Host "[OK] Git ditemukan: $gitver" -ForegroundColor Green
}

# 3. Cek Node.js & npm
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
    Write-Host "[!] Node.js/npm belum terinstal. Silakan download dan install dari https://nodejs.org/en/download/ lalu jalankan ulang script ini." -ForegroundColor Red
    exit 1
} else {
    $nodever = node --version
    $npmver = npm --version
    Write-Host "[OK] Node.js ditemukan: $nodever, npm: $npmver" -ForegroundColor Green
}

# 4. Setup Python Virtual Environment (Backend)
$backendPath = "backend"
$venvPath = "$backendPath\venv"
if (-Not (Test-Path $venvPath)) {
    Write-Host "[i] Membuat virtual environment Python..." -ForegroundColor Yellow
    python -m venv $venvPath
}

# 5. Aktifkan venv & install requirements
$activateScript = "$venvPath\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    Write-Host "[i] Mengaktifkan virtual environment..." -ForegroundColor Yellow
    & $activateScript
    if (Test-Path "$backendPath\requirements.txt") {
        Write-Host "[i] Menginstall dependency backend (pip install)..." -ForegroundColor Yellow
        pip install --upgrade pip
        pip install -r "$backendPath\requirements.txt"
    } else {
        Write-Host "[!] File requirements.txt tidak ditemukan di backend/. Pastikan dependency sudah terinstall manual." -ForegroundColor Red
    }
} else {
    Write-Host "[!] Gagal menemukan script aktivasi venv. Cek folder backend/venv/" -ForegroundColor Red
}

# 6. Install dependency frontend
$frontendPath = "frontend"
if (Test-Path "$frontendPath\package.json") {
    Write-Host "[i] Menginstall dependency frontend (npm install)..." -ForegroundColor Yellow
    Push-Location $frontendPath
    npm install
    Pop-Location
} else {
    Write-Host "[!] File package.json tidak ditemukan di frontend/. Lewati instalasi frontend." -ForegroundColor Red
}

Write-Host "\n=== SETUP SELESAI ===" -ForegroundColor Cyan
Write-Host "\nCara menjalankan aplikasi:" -ForegroundColor Yellow
Write-Host "1. Backend:"
Write-Host "   cd backend"
Write-Host "   .\\venv\\Scripts\\activate" -ForegroundColor Gray
Write-Host "   python app.py" -ForegroundColor Gray
Write-Host "2. Frontend:"
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host "\nJika ada error, cek kembali dependency dan environment variable yang dibutuhkan." -ForegroundColor Yellow 