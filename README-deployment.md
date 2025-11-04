# Panduan Deployment Aplikasi

Dokumen ini berisi panduan untuk menjalankan aplikasi baik dengan metode tradisional maupun dengan Docker.

## Daftar Isi
- [Panduan Deployment Aplikasi](#panduan-deployment-aplikasi)
  - [Daftar Isi](#daftar-isi)
  - [Persiapan Awal](#persiapan-awal)
    - [Prasyarat](#prasyarat)
    - [Clone Repository](#clone-repository)
  - [Metode Deployment Tradisional](#metode-deployment-tradisional)
    - [Script Deployment](#script-deployment)
    - [Menjalankan Secara Manual](#menjalankan-secara-manual)
  - [Deployment dengan Docker](#deployment-dengan-docker)
    - [Persiapan Docker](#persiapan-docker)
    - [Script Docker](#script-docker)
    - [Menjalankan dengan Docker Compose](#menjalankan-dengan-docker-compose)
  - [Mode Development vs Production](#mode-development-vs-production)
    - [Mode Development](#mode-development)
    - [Mode Production](#mode-production)
  - [Troubleshooting](#troubleshooting)
    - [Masalah Koneksi](#masalah-koneksi)
    - [Masalah Port](#masalah-port)
    - [Masalah File](#masalah-file)
    - [Verifikasi Status](#verifikasi-status)

## Persiapan Awal

### Prasyarat
- Python 3.8 atau lebih baru
- Node.js 16 atau lebih baru
- (Opsional) Docker dan Docker Compose

### Clone Repository
```bash
git clone [URL_REPOSITORY]
cd [NAMA_DIREKTORI]
```

## Metode Deployment Tradisional

### Script Deployment

Aplikasi ini dilengkapi script deployment yang memudahkan instalasi dan menjalankan aplikasi.

**Di Linux/macOS:**
```bash
# Memberikan hak eksekusi
chmod +x deploy.sh

# Menjalankan dalam mode development
./deploy.sh dev

# Menjalankan dalam mode **production**
./deploy.sh prod
```

**Di Windows:**
```cmd
# Menjalankan dalam mode development
deploy.bat dev

# Menjalankan dalam mode production
deploy.bat prod
```

Script akan secara otomatis:
1. Menyiapkan lingkungan virtual Python
2. Menginstal semua dependensi backend dan frontend
3. Membuild frontend jika dalam mode production
4. Menjalankan aplikasi di mode yang sesuai

### Menjalankan Secara Manual

Jika Anda memilih untuk menjalankan aplikasi secara manual:

**Backend:**
```bash
# Di Linux/macOS
cd backend
python -m venv venv
source venv/bin/activate  # Di Windows: venv\Scripts\activate
pip install -r requirements.txt

# Mode development
python run_dev.py

# Mode production
pip install waitress gunicorn
python run_prod.py
```

**Frontend:**
```bash
cd frontend
npm install

# Mode development
npm run dev:network

# Mode production
npm run build
npm run preview:network
```

## Deployment dengan Docker

### Persiapan Docker

Pastikan Anda telah menginstal:
- Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- Docker Compose: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

### Script Docker

Aplikasi dilengkapi script untuk menjalankan kontainer Docker.

**Di Linux/macOS:**
```bash
# Memberikan hak eksekusi
chmod +x run-docker.sh

# Membangun image
./run-docker.sh build

# Menjalankan container
./run-docker.sh up

# Melihat log
./run-docker.sh logs

# Menghentikan container
./run-docker.sh down

# Restart container
./run-docker.sh restart
```

**Di Windows:**
```cmd
# Membangun image
run-docker.bat build

# Menjalankan container
run-docker.bat up

# Melihat log
run-docker.bat logs

# Menghentikan container
run-docker.bat down

# Restart container
run-docker.bat restart
```

### Menjalankan dengan Docker Compose

Jika ingin menjalankan secara manual tanpa script:

```bash
# Membangun image
docker-compose build

# Menjalankan container
docker-compose up -d

# Melihat log
docker-compose logs -f

# Menghentikan container
docker-compose down
```

## Mode Development vs Production

### Mode Development
- Server backend Flask dengan hot-reload
- Frontend Vite dengan hot-module replacement
- Logging detail
- Cocok untuk pengembangan lokal

### Mode Production
- Server backend Waitress/Gunicorn yang lebih cepat dan aman
- Frontend yang telah di-build dan dioptimasi
- Logging minimal
- Cocok untuk deployment ke lingkungan produksi

## Troubleshooting

### Masalah Koneksi
- **Backend tidak dapat diakses**: Pastikan server backend berjalan di port yang benar (5000)
- **Frontend tidak dapat mengakses backend**: Pastikan setting CORS dan URL API sudah benar
- **Koneksi antar Docker container**: Pastikan semua container berada di network yang sama

### Masalah Port
- **Port sudah digunakan**: Pastikan port 5000 (backend) dan 3000/4173 (frontend) tidak digunakan oleh aplikasi lain
- **Firewall**: Pastikan firewall tidak memblokir port yang digunakan

### Masalah File
- **Permission denied**: Pastikan file script (`deploy.sh`, `run-docker.sh`) memiliki izin eksekusi
- **Module not found**: Pastikan semua dependensi sudah terinstal dengan benar

### Verifikasi Status

Untuk memverifikasi status aplikasi:
- Backend: Buka `http://[IP_ADDRESS]:5000/api/health`
- Frontend dengan backend: Buka halaman `http://[IP_ADDRESS]:3000/connection-test` 