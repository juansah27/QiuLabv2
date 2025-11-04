// Skrip sederhana untuk membersihkan cache
// Jalankan ini ketika ada masalah cache dengan aplikasi
// node clear-cache.js

const fs = require('fs');
const path = require('path');

// Tambahkan baris unik ke .env untuk memaksa reload
const envFile = path.join(__dirname, '.env');
const timestamp = new Date().toISOString();
const cacheBusterLine = `VITE_CACHE_BUSTER=${timestamp}`;

try {
  let content = fs.readFileSync(envFile, 'utf8');
  
  // Hapus baris VITE_CACHE_BUSTER yang lama jika ada
  if (content.includes('VITE_CACHE_BUSTER=')) {
    content = content.replace(/VITE_CACHE_BUSTER=.*\n/g, '');
  }
  
  // Tambahkan baris cache buster baru
  content += `\n${cacheBusterLine}\n`;
  
  fs.writeFileSync(envFile, content);
  console.log(`Cache buster diperbarui: ${cacheBusterLine}`);
  console.log('Silakan restart server frontend dengan "npm run dev" untuk menerapkan perubahan');
} catch (error) {
  console.error('Error:', error);
} 