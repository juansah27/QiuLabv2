# Panduan Docker untuk Aplikasi QiuLab

Dokumen ini berisi panduan untuk menjalankan aplikasi QiuLab menggunakan Docker yang telah dioptimasi.

## Daftar Isi
- [Panduan Docker untuk Aplikasi QiuLab](#panduan-docker-untuk-aplikasi-qiulab)
  - [Daftar Isi](#daftar-isi)
  - [Persiapan](#persiapan)
  - [Menjalankan Aplikasi](#menjalankan-aplikasi)
  - [Penjelasan Optimasi](#penjelasan-optimasi)
  - [Konfigurasi Lanjutan](#konfigurasi-lanjutan)
  - [Troubleshooting](#troubleshooting)

## Persiapan

Sebelum menjalankan aplikasi, pastikan sistem Anda memiliki:

1. **Docker**: Versi 19.03.0 atau lebih baru
   - [Instalasi Docker](https://docs.docker.com/get-docker/)
2. **Docker Compose**: Versi 1.27.0 atau lebih baru (biasanya sudah termasuk dalam instalasi Docker Desktop)
   - [Instalasi Docker Compose](https://docs.docker.com/compose/install/)

## Menjalankan Aplikasi

Aplikasi ini dapat dijalankan dengan mudah menggunakan script yang telah disediakan:

### Di Windows:
```
run-docker.bat build  # Membangun image
run-docker.bat up     # Menjalankan container
```

### Di Linux/macOS:
```bash
chmod +x run-docker.sh  # Berikan izin eksekusi pada script
./run-docker.sh build   # Membangun image
./run-docker.sh up      # Menjalankan container
```

### Alternatif Manual:
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

Setelah container berjalan, aplikasi dapat diakses di:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:80/api
- **Health Check**: http://localhost:80/health

## Penjelasan Optimasi

Konfigurasi Docker ini telah dioptimasi untuk:

1. **Multi-stage build**: Memisahkan proses instalasi dependencies, build, dan runtime untuk menghasilkan image yang lebih kecil.

2. **Keamanan**:
   - Menggunakan user non-root
   - Flag `no-new-privileges` untuk membatasi eskalasi hak akses
   - Health check untuk memastikan aplikasi berjalan dengan baik

3. **Performa**:
   - Limit resource CPU dan Memory per container
   - Dependency caching untuk mempercepat build
   - Menggunakan Alpine Linux untuk image yang lebih ringan

4. **Kestabilan**:
   - Health check pada semua service
   - Kondisi `service_healthy` untuk dependency antar service
   - Volume yang tepat untuk data persisten

## Konfigurasi Lanjutan

### Mengubah Port
Jika ingin mengubah port yang diexpose ke host, edit file `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Ubah 80 pertama ke port yang diinginkan
```

### Mengubah Limit Resource
Untuk menyesuaikan penggunaan CPU dan memori:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'     # Ubah sesuai kebutuhan (dalam core)
      memory: 1024M   # Ubah sesuai kebutuhan (dalam MB)
```

### Mengubah Volume Path
Untuk menyimpan data di lokasi tertentu pada host:

```yaml
volumes:
  backend-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/host/data
```

## Troubleshooting

### Container Tidak Berjalan
```bash
# Periksa status container
docker-compose ps

# Periksa log detail
docker-compose logs
```

### Port Conflict
```bash
# Jika ada error "port is already allocated"
# Cek port yang digunakan
netstat -tulpn | grep 80   # Linux
netstat -ano | findstr :80 # Windows

# Ubah port di docker-compose.yml
```

### Health Check Gagal
```bash
# Periksa log health check
docker inspect --format "{{json .State.Health }}" qiulab-backend
docker inspect --format "{{json .State.Health }}" qiulab-frontend
``` 