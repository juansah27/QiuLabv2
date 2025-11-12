#!/bin/bash

# Script deployment untuk Ubuntu dengan eksekusi background
# Penggunaan: ./deploy.sh [dev|prod] [silent]
# silent: jika ditambahkan, script akan berjalan di background tanpa output interaktif

MODE=${1:-dev}
SILENT_MODE=${2:-false}

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Log file untuk silent mode
LOG_FILE="deploy_$(date +%Y%m%d_%H%M%S).log"

print_message() {
  if [ "$SILENT_MODE" == "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"
  else
    echo -e "${BLUE}[INFO]${NC} $1"
  fi
}

print_success() {
  if [ "$SILENT_MODE" == "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "$LOG_FILE"
  else
    echo -e "${GREEN}[SUCCESS]${NC} $1"
  fi
}

print_warning() {
  if [ "$SILENT_MODE" == "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $1" >> "$LOG_FILE"
  else
    echo -e "${YELLOW}[WARNING]${NC} $1"
  fi
}

print_error() {
  if [ "$SILENT_MODE" == "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
  else
    echo -e "${RED}[ERROR]${NC} $1"
  fi
}

check_result() {
  if [ $? -eq 0 ]; then
    print_success "$1"
  else
    print_error "$2"
    if [ "$SILENT_MODE" == "true" ]; then
      echo "Deployment failed. Check log file: $LOG_FILE"
    fi
    exit 1
  fi
}

# Function untuk menjalankan command tanpa output jika silent mode
run_command() {
  if [ "$SILENT_MODE" == "true" ]; then
    $@ >> "$LOG_FILE" 2>&1
  else
    $@
  fi
}

# Function untuk install dependencies secara otomatis
install_dependencies() {
  print_message "Checking and installing system dependencies..."
  
  # Update package list
  run_command sudo apt update
  
  # Install essential packages
  run_command sudo apt install -y python3-venv python3-full python3-dev build-essential unixodbc-dev
  
  # Install tmux if not available
  if ! command -v tmux &> /dev/null; then
    print_message "Installing tmux..."
    run_command sudo apt install -y tmux
  fi
  
  # Install Node.js if not available
  if ! command -v npm &> /dev/null; then
    print_message "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    run_command sudo apt-get install -y nodejs
  fi
}

# Function untuk setup backend
setup_backend() {
  print_message "Setting up backend..."
  cd backend
  
  # Hapus venv lama jika ada
  if [ -d "venv" ]; then
    print_message "Removing old virtual environment..."
    rm -rf venv
  fi
  
  # Buat venv baru
  print_message "Creating new virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  
  # Upgrade pip
  pip install --upgrade pip
  
  # Install dependencies
  print_message "Installing Flask and core dependencies..."
  pip install Flask==2.3.3 Flask-CORS==4.0.0 Flask-JWT-Extended==4.5.3 flask-restful==0.3.10 flask-login==0.6.3 Flask-Compress==1.14 python-dotenv==1.0.0 Werkzeug==2.3.7 requests==2.32.3
  
  print_message "Installing data libraries..."
  pip install numpy==1.26.4 pandas==2.2.3 openpyxl==3.1.5 eventlet==0.33.3
  
  # Install pyodbc dengan fallback
  print_message "Installing pyodbc (with fallback)..."
  if pip install pyodbc==5.0.1; then
    print_success "pyodbc installed successfully"
  else
    print_warning "pyodbc installation failed, trying alternative..."
    if pip install pyodbc==4.0.39; then
      print_success "pyodbc 4.0.39 installed successfully"
    else
      print_warning "pyodbc installation failed, skipping..."
      print_message "You may need to install database drivers manually"
    fi
  fi
  
  # Install production dependencies if needed
  if [ "$MODE" == "prod" ]; then
    print_message "Installing production dependencies..."
    pip install waitress==2.1.2 gunicorn==21.2.0
  fi
  
  cd ..
}

# Function untuk setup frontend
setup_frontend() {
  print_message "Setting up frontend..."
  cd frontend
  
  # Install dependencies
  npm install
  
  # Build if production
  if [ "$MODE" == "prod" ]; then
    print_message "Building frontend for production..."
    if ! npm run build; then
      print_warning "npm run build failed, retrying with npx vite..."
      if ! npx --yes vite build --mode production; then
        print_error "Frontend build failed with npm and npx"
        exit 1
      fi
    fi
  fi
  
  cd ..
}

# Function untuk menjalankan aplikasi
start_application() {
  print_message "Starting application with tmux..."
  
  # Kill existing sessions
  tmux kill-session -t qiulab-backend 2>/dev/null
  tmux kill-session -t qiulab-frontend 2>/dev/null
  
  # Dapatkan path absolut dari direktori saat ini
  CURRENT_DIR=$(pwd)
  
  if [ "$MODE" == "dev" ]; then
    # Development mode
    print_message "Starting development mode..."
    
    # Backend
    tmux new-session -d -s qiulab-backend
    tmux send-keys -t qiulab-backend "cd $CURRENT_DIR/backend" Enter
    tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
    tmux send-keys -t qiulab-backend "python run_dev.py" Enter
    
    sleep 3
    
    # Frontend
    tmux new-session -d -s qiulab-frontend
    tmux send-keys -t qiulab-frontend "cd $CURRENT_DIR/frontend" Enter
    tmux send-keys -t qiulab-frontend "npm run dev:network" Enter
    
    print_success "Development mode started!"
    print_message "Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    print_message "Backend: http://$(hostname -I | awk '{print $1}'):5000"
    
  else
    # Production mode
    print_message "Starting production mode..."
    
    # Backend
    tmux new-session -d -s qiulab-backend
    tmux send-keys -t qiulab-backend "cd $CURRENT_DIR/backend" Enter
    tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
    tmux send-keys -t qiulab-backend "python run_prod.py" Enter
    
    sleep 3
    
    # Frontend
    tmux new-session -d -s qiulab-frontend
    tmux send-keys -t qiulab-frontend "cd $CURRENT_DIR/frontend" Enter
    tmux send-keys -t qiulab-frontend "npm run preview:network" Enter
    
    print_success "Production mode started!"
    print_message "Frontend: http://$(hostname -I | awk '{print $1}'):4173"
    print_message "Backend: http://$(hostname -I | awk '{print $1}'):5000"
  fi
}

# Function untuk menampilkan informasi sesi
show_session_info() {
  if [ "$SILENT_MODE" != "true" ]; then
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
  fi
}

# Main execution
main() {
  if [ "$SILENT_MODE" == "true" ]; then
    print_message "🚀 Starting QiuLab Deployment in SILENT mode..."
    print_message "Log file: $LOG_FILE"
  else
    print_message "🚀 Starting QiuLab Deployment for Ubuntu..."
  fi
  
  # Pastikan di direktori yang benar
  if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Script harus dijalankan dari direktori root project"
    exit 1
  fi
  
  # Install dependencies
  install_dependencies
  check_result "System dependencies installed" "Failed to install system dependencies"
  
  # Setup backend
  setup_backend
  check_result "Backend setup completed" "Backend setup failed"
  
  # Setup frontend
  setup_frontend
  check_result "Frontend setup completed" "Frontend setup failed"
  
  # Start application
  start_application
  check_result "Application started successfully" "Failed to start application"
  
  # Show session info
  show_session_info
  
  if [ "$SILENT_MODE" == "true" ]; then
    print_success "🎉 QiuLab deployment completed successfully in silent mode!"
    print_message "Check log file for details: $LOG_FILE"
  else
    print_success "🎉 QiuLab deployment completed successfully!"
  fi
}

# Handle Ctrl+C untuk graceful shutdown
trap 'print_warning "Deployment interrupted by user"; exit 1' INT

# Jalankan main function
main "$@"