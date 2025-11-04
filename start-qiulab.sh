#!/bin/bash

# QiuLab Startup Script dengan tmux
# Author: Handiyan Juansah

PROJECT_DIR="/home/flexofast/QiuLab"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Starting QiuLab Application..."

# Kill existing sessions if they exist
tmux kill-session -t qiulab-backend 2>/dev/null
tmux kill-session -t qiulab-frontend 2>/dev/null

# Start Backend
echo "📦 Setting up Backend..."
tmux new-session -d -s qiulab-backend
tmux send-keys -t qiulab-backend "cd $BACKEND_DIR" Enter
tmux send-keys -t qiulab-backend "source venv/bin/activate" Enter
tmux send-keys -t qiulab-backend "python run_dev.py" Enter

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "🎨 Setting up Frontend..."
tmux new-session -d -s qiulab-frontend
tmux send-keys -t qiulab-frontend "cd $FRONTEND_DIR" Enter
tmux send-keys -t qiulab-frontend "npm run dev:network" Enter

echo "✅ QiuLab is starting up!"
echo ""
echo "📋 Available tmux sessions:"
echo "  - qiulab-backend  (Backend Flask server)"
echo "  - qiulab-frontend (Frontend React server)"
echo ""
echo "🔧 Commands to manage sessions:"
echo "  tmux attach -t qiulab-backend   # Attach to backend"
echo "  tmux attach -t qiulab-frontend  # Attach to frontend"
echo "  tmux list-sessions              # List all sessions"
echo "  tmux kill-session -t qiulab-backend   # Stop backend"
echo "  tmux kill-session -t qiulab-frontend  # Stop frontend"
echo ""
echo "🌐 Application will be available at:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):5000"