#!/bin/bash

# Script untuk menjalankan aplikasi dengan Docker
# Penggunaan: ./run-docker.sh [up|down|build|logs|restart|prune|status|help]

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
  echo -e "${CYAN}=== $1 ===${NC}"
}

# Fungsi bantuan
show_help() {
  print_header "QiuLab Docker Helper"
  echo "Penggunaan: ./run-docker.sh [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  up        Menjalankan container"
  echo "  down      Menghentikan container"
  echo "  build     Membangun image"
  echo "  logs      Menampilkan log"
  echo "  restart   Me-restart container"
  echo "  prune     Membersihkan resource Docker yang tidak digunakan"
  echo "  status    Melihat status container"
  echo "  help      Menampilkan bantuan ini"
}

# Verifikasi argumen
if [ $# -eq 0 ]; then
  print_error "Tidak ada argumen yang diberikan"
  show_help
  exit 1
fi

COMMAND=$1

# Verifikasi Docker
if ! command -v docker &> /dev/null; then
  print_error "Docker tidak ditemukan. Pastikan Docker terinstal dan dapat dijalankan."
  exit 1
fi

# Verifikasi Docker Compose
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
else
  print_error "Docker Compose tidak ditemukan. Pastikan Docker Compose terinstal."
  exit 1
fi

# Jalankan perintah sesuai argumen
case $COMMAND in
  "up")
    print_message "Menjalankan container..."
    $COMPOSE_CMD up -d
    if [ $? -eq 0 ]; then
      print_success "Container berhasil dijalankan"
      
      # Dapatkan IP address
      if command -v ip &> /dev/null; then
        IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d/ -f1 | head -n 1)
        if [ -n "$IP" ]; then
          print_message "Aplikasi dapat diakses di: http://$IP"
        fi
      fi
      
      print_message "Aplikasi dapat diakses di: http://localhost"
      print_message "Untuk melihat log, jalankan: ./run-docker.sh logs"
      print_message "Untuk melihat status, jalankan: ./run-docker.sh status"
    else
      print_error "Gagal menjalankan container"
    fi
    ;;
    
  "down")
    print_message "Menghentikan container..."
    $COMPOSE_CMD down
    if [ $? -eq 0 ]; then
      print_success "Container berhasil dihentikan"
    else
      print_error "Gagal menghentikan container"
    fi
    ;;
    
  "build")
    print_message "Membangun image..."
    $COMPOSE_CMD build --no-cache
    if [ $? -eq 0 ]; then
      print_success "Image berhasil dibangun"
      print_message "Untuk menjalankan container, jalankan: ./run-docker.sh up"
    else
      print_error "Gagal membangun image"
    fi
    ;;
    
  "logs")
    if [ $# -eq 2 ]; then
      SERVICE=$2
      print_message "Menampilkan log untuk service $SERVICE..."
      $COMPOSE_CMD logs -f $SERVICE
    else
      print_message "Menampilkan log untuk semua service..."
      $COMPOSE_CMD logs -f
    fi
    ;;
    
  "restart")
    if [ $# -eq 2 ]; then
      SERVICE=$2
      print_message "Me-restart service $SERVICE..."
      $COMPOSE_CMD restart $SERVICE
      if [ $? -eq 0 ]; then
        print_success "Service $SERVICE berhasil di-restart"
      else
        print_error "Gagal me-restart service $SERVICE"
      fi
    else
      print_message "Me-restart semua container..."
      $COMPOSE_CMD restart
      if [ $? -eq 0 ]; then
        print_success "Container berhasil di-restart"
      else
        print_error "Gagal me-restart container"
      fi
    fi
    ;;
    
  "prune")
    print_warning "Membersihkan resource Docker yang tidak digunakan..."
    read -p "Lanjutkan? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker system prune --volumes -f
      print_success "Pembersihan selesai"
    else
      print_message "Pembersihan dibatalkan"
    fi
    ;;
    
  "status")
    print_header "Status Container"
    $COMPOSE_CMD ps
    
    print_header "Health Check"
    for service in backend frontend; do
      container_id=$(docker ps -q -f name=qiulab-$service)
      if [ -n "$container_id" ]; then
        health=$(docker inspect --format "{{.State.Health.Status}}" $container_id 2>/dev/null)
        if [ -n "$health" ]; then
          if [ "$health" == "healthy" ]; then
            echo -e "$service: ${GREEN}$health${NC}"
          else
            echo -e "$service: ${YELLOW}$health${NC}"
          fi
        else
          echo -e "$service: ${YELLOW}no health check${NC}"
        fi
      else
        echo -e "$service: ${RED}tidak berjalan${NC}"
      fi
    done
    ;;
    
  "help")
    show_help
    ;;
    
  *)
    print_error "Perintah tidak dikenal: $COMMAND"
    show_help
    exit 1
    ;;
esac

exit 0 