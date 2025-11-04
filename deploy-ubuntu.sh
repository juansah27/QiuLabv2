#!/bin/bash

# Script deployment untuk Ubuntu dengan fix pyodbc
# Penggunaan: ./deploy-ubuntu.sh [dev|prod]

MODE=${1:-dev}

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

check_result() {
  if [ $? -eq 0 ]; then
    print_success "$1"
  else
    print_error "$2"
    exit 1
  fi
}

print_message "🚀 Starting QiuLab Deployment for Ubuntu..."

# Install system dependencies
print_message "Installing system dependencies..."
sudo apt update
sudo apt install -y python3-venv python3-full python3-dev build-essential unixodbc-dev

# Install tmux if not available
if ! command -v tmux &> /dev/null; then
  print_message "Installing tmux..."
  sudo apt install -y tmux
fi

# Pastikan di direktori yang benar
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  print_error "Script harus dijalankan dari direktori root project"
  exit 1
fi

# Setup Backend
print_message "Setting up backend..."
cd backend

# Hapus venv lama
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

# Install dependencies satu per satu untuk debugging
print_message "Installing Flask and core dependencies..."
pip install Flask==2.3.3 Flask-CORS==4.0.0 Flask-JWT-Extended==4.5.3 python-dotenv==1.0.0 Werkzeug==2.3.7

print_message "Installing numpy..."
pip install numpy==1.26.4

# Coba install pyodbc dengan fallback
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

# Setup Frontend
print_message "Setting up frontend..."
cd frontend

# Install Node.js if not available
if ! command -v npm &> /dev/null; then
  print_message "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install dependencies
npm install

# Build if production
if [ "$MODE" == "prod" ]; then
  print_message "Building frontend for production..."
  npm run build
fi

cd ..

# Start with tmux
print_message "Starting application with tmux..."

# Kill existing sessions
tmux kill-session -t qiulab-backend 2>/dev/null
tmux kill-session -t qiulab-frontend 2>/dev/null

if [ "$MODE" == "dev" ]; then
  # Development mode
  print_message "Starting development mode..."
  
  # Backend
  tmux new-session -d -s qiulab-backend
  tmux send-keys -t qiulab-backend "cd /home/flexofast/QiuLab/backend" Enter
  tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
  tmux send-keys -t qiulab-backend "python run_dev.py" Enter
  
  sleep 3
  
  # Frontend
  tmux new-session -d -s qiulab-frontend
  tmux send-keys -t qiulab-frontend "cd /home/flexofast/QiuLab/frontend" Enter
  tmux send-keys -t qiulab-frontend "npm run dev:network" Enter
  
  print_success "Development mode started!"
  print_message "Frontend: http://$(hostname -I | awk '{print $1}'):3000"
  print_message "Backend: http://$(hostname -I | awk '{print $1}'):5000"
  
else
  # Production mode
  print_message "Starting production mode..."
  
  # Backend
  tmux new-session -d -s qiulab-backend
  tmux send-keys -t qiulab-backend "cd /home/flexofast/QiuLab/backend" Enter
  tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
  tmux send-keys -t qiulab-backend "python run_prod.py" Enter
  
  sleep 3
  
  # Frontend
  tmux new-session -d -s qiulab-frontend
  tmux send-keys -t qiulab-frontend "cd /home/flexofast/QiuLab/frontend" Enter
  tmux send-keys -t qiulab-frontend "npm run preview:network" Enter
  
  print_success "Production mode started!"
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

print_success "🎉 QiuLab deployment completed successfully!"

