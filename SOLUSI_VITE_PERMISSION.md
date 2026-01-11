# Solusi Vite Permission Denied

## Masalah
```
sh: 1: vite: Permission denied
```

## Penyebab
1. **node_modules belum terinstall** - Vite tidak ditemukan
2. **Permission issue** - node_modules/.bin/vite tidak executable
3. **npm install belum dijalankan** setelah pull

## Solusi

### 1. Install Dependencies (Paling Umum)

```bash
cd /home/flexofast/QiuLabv2/frontend
npm install
```

### 2. Fix Permission (Jika masih error)

```bash
# Fix permission pada node_modules
chmod +x node_modules/.bin/vite
chmod -R +x node_modules/.bin/

# Atau reinstall dengan clean
rm -rf node_modules package-lock.json
npm install
```

### 3. Gunakan npx (Alternatif)

```bash
# Gunakan npx untuk bypass permission issue
npx vite --host 0.0.0.0 --mode development
```

### 4. Check Node & NPM Version

```bash
# Pastikan Node.js terinstall
node --version
npm --version

# Jika belum, install Node.js
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Langkah Lengkap

```bash
# 1. Masuk ke direktori frontend
cd /home/flexofast/QiuLabv2/frontend

# 2. Install dependencies
npm install

# 3. Fix permission jika perlu
chmod +x node_modules/.bin/*

# 4. Jalankan dev server
VITE_USE_NETWORK_IP=true npm run dev:network
```

## Troubleshooting

### Jika npm install error:
```bash
# Clear npm cache
npm cache clean --force

# Install ulang
rm -rf node_modules package-lock.json
npm install
```

### Jika masih permission denied:
```bash
# Check ownership
ls -la node_modules/.bin/vite

# Fix ownership jika perlu
sudo chown -R flexofast:flexofast node_modules
chmod +x node_modules/.bin/*
```

### Alternative: Gunakan yarn
```bash
# Install yarn jika belum ada
npm install -g yarn

# Install dependencies dengan yarn
yarn install

# Run dengan yarn
yarn dev:network
```


