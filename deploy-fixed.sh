#!/bin/bash

# Script deployment untuk aplikasi (Fixed Version)
# Penggunaan: ./deploy-fixed.sh [dev|prod]

# Default ke mode development jika tidak ada argumen
MODE=${1:-dev}

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk menampilkan pesan dengan warna
print_message() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Fungsi untuk mengecek apakah command berhasil
check_result() {
  if [ $? -eq 0 ]; then
    print_success "$1"
  else
    print_error "$2"
    exit 1
  fi
}

# Verifikasi argumen
if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
  print_error "Mode tidak valid. Gunakan 'dev' atau 'prod'"
  echo "Penggunaan: ./deploy-fixed.sh [dev|prod]"
  exit 1
fi

print_message "Memulai deployment aplikasi dalam mode $MODE..."

# Pastikan kita berada di direktori yang benar (root project)
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  print_error "Script harus dijalankan dari direktori root project yang berisi folder backend dan frontend"
  exit 1
fi

# 1. Setup Backend
print_message "Memulai setup backend..."

cd backend

# Verifikasi Python tersedia
if ! command -v python3 &> /dev/null; then
  print_error "Python3 tidak ditemukan. Pastikan Python 3 terinstal."
  exit 1
fi

# Install python3-venv jika belum ada
print_message "Memastikan python3-venv terinstal..."
sudo apt update && sudo apt install -y python3-venv python3-full

# Hapus virtual environment lama jika ada
if [ -d "venv" ]; then
  print_message "Menghapus virtual environment lama..."
  rm -rf venv
fi

# Buat virtual environment baru
print_message "Membuat virtual environment baru..."
python3 -m venv venv
check_result "Virtual environment berhasil dibuat" "Gagal membuat virtual environment"

# Aktifkan virtual environment
print_message "Mengaktifkan virtual environment..."
source venv/bin/activate
check_result "Virtual environment berhasil diaktifkan" "Gagal mengaktifkan virtual environment"

# Upgrade pip
print_message "Upgrading pip..."
pip install --upgrade pip

# Install dependensi
print_message "Menginstal dependensi backend..."
pip install -r requirements.txt
check_result "Dependensi backend berhasil diinstal" "Gagal menginstal dependensi backend"

# Install dependensi tambahan untuk deployment production
if [ "$MODE" == "prod" ]; then
  print_message "Menginstal dependensi tambahan untuk production..."
  pip install waitress gunicorn
  check_result "Dependensi tambahan untuk production berhasil diinstal" "Gagal menginstal dependensi tambahan"
fi

# Kembali ke direktori root
cd ..

# 2. Setup Frontend
print_message "Memulai setup frontend..."

cd frontend

# Verifikasi Node.js tersedia
if ! command -v npm &> /dev/null; then
  print_error "Node.js/npm tidak ditemukan. Pastikan Node.js terinstal."
  exit 1
fi

# Install dependensi frontend
print_message "Menginstal dependensi frontend..."
npm install
check_result "Dependensi frontend berhasil diinstal" "Gagal menginstal dependensi frontend"

# Build frontend jika mode production
if [ "$MODE" == "prod" ]; then
  print_message "Building frontend untuk production..."
  npm run build
  check_result "Frontend berhasil di-build untuk production" "Gagal build frontend"
fi

# Kembali ke direktori root
cd ..

# 3. Jalankan aplikasi dengan tmux
print_message "Memulai aplikasi dengan tmux..."

# Kill existing sessions if they exist
tmux kill-session -t qiulab-backend 2>/dev/null
tmux kill-session -t qiulab-frontend 2>/dev/null

if [ "$MODE" == "dev" ]; then
  # Mode Development
  print_message "Memulai aplikasi dalam mode DEVELOPMENT dengan tmux..."
  
  # Start Backend
  print_message "Memulai backend di tmux session..."
  tmux new-session -d -s qiulab-backend
  tmux send-keys -t qiulab-backend "cd /home/flexofast/QiuLab/backend" Enter
  tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
  tmux send-keys -t qiulab-backend "python run_dev.py" Enter
  
  # Wait a moment for backend to start
  sleep 3
  
  # Start Frontend
  print_message "Memulai frontend di tmux session..."
  tmux new-session -d -s qiulab-frontend
  tmux send-keys -t qiulab-frontend "cd /home/flexofast/QiuLab/frontend" Enter
  tmux send-keys -t qiulab-frontend "npm run dev:network" Enter
  
  print_success "Mode development dijalankan dengan tmux!"
  print_message "Frontend: http://$(hostname -I | awk '{print $1}'):3000"
  print_message "Backend: http://$(hostname -I | awk '{print $1}'):5000"
  
else
  # Mode Production
  print_message "Memulai aplikasi dalam mode PRODUCTION dengan tmux..."
  
  # Start Backend
  print_message "Memulai backend production di tmux session..."
  tmux new-session -d -s qiulab-backend
  tmux send-keys -t qiulab-backend "cd /home/flexofast/QiuLab/backend" Enter
  tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
  tmux send-keys -t qiulab-backend "python run_prod.py" Enter
  
  # Wait a moment for backend to start
  sleep 3
  
  # Start Frontend
  print_message "Memulai frontend production di tmux session..."
  tmux new-session -d -s qiulab-frontend
  tmux send-keys -t qiulab-frontend "cd /home/flexofast/QiuLab/frontend" Enter
  tmux send-keys -t qiulab-frontend "npm run preview:network" Enter
  
  print_success "Mode production dijalankan dengan tmux!"
  print_message "Frontend: http://$(hostname -I | awk '{print $1}'):4173"
  print_message "Backend: http://$(hostname -I | awk '{print $1}'):5000"
fi

echo ""
echo "📋 Available tmux sessions:"
echo "  - qiulab-backend  (Backend server)"
echo "  - qiulab-frontend (Frontend server)"
echo ""
echo "🔧 Commands to manage sessions:"
echo "  tmux attach -t qiulab-backend   # Attach to backend"
echo "  tmux attach -t qiulab-frontend  # Attach to frontend"
echo "  tmux list-sessions              # List all sessions"
echo "  tmux kill-session -t qiulab-backend   # Stop backend"
echo "  tmux kill-session -t qiulab-frontend  # Stop frontend"

print_success "Setup deployment selesai!"
print_message "Aplikasi berjalan di background dengan tmux sessions."

