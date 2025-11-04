# 🎯 Konfigurasi Status Grouping

## Cara Menambah Grouping Baru

**Hanya edit file `statusGroups.js` saja!** Tidak perlu edit file lain.

### 📝 Langkah-langkah:

1. **Buka file:** `frontend/src/config/statusGroups.js`

2. **Tambah grouping baru di `STATUS_GROUPS`:**
```javascript
'Processing': {
  patterns: ['processing', 'proses', 'sedang diproses'],
  color: '#10b981',
  priority: 5
},
```

3. **Selesai!** Sistem akan otomatis:
   - Mengelompokkan status yang mengandung kata-kata tersebut
   - Menampilkan warna yang sesuai di chart
   - Mengurutkan berdasarkan prioritas
   - Menghitung statistik dengan benar

### 🔧 Format Konfigurasi:

```javascript
'nama_grouping': {
  patterns: ['kata1', 'kata2', 'kata3'], // kata-kata yang akan di-match
  color: '#hexcolor',                    // warna untuk chart
  priority: 1                           // urutan (1 = tertinggi)
}
```

### 📋 Contoh Lengkap:

```javascript
'Pending Verifikasi': {
  patterns: ['pending verifikasi', 'pending verfikasi'],
  color: '#0ea5e9',
  priority: 1
},

'Cancel': {
  patterns: ['cancel'],
  color: '#8b5cf6', 
  priority: 2
},

'Processing': {
  patterns: ['processing', 'proses', 'sedang diproses'],
  color: '#10b981',
  priority: 3
},

'Failed': {
  patterns: ['failed', 'gagal', 'error'],
  color: '#ef4444', 
  priority: 4
}
```

### ✅ Keuntungan:

- **Satu tempat edit** - tidak perlu edit banyak file
- **Otomatis** - semua chart dan statistik update otomatis
- **Flexible** - bisa handle berbagai variasi nama status
- **Consistent** - semua komponen menggunakan konfigurasi yang sama

### 🎨 Tips Warna:

- Biru: `#0ea5e9`, `#3b82f6`, `#1d4ed8`
- Hijau: `#10b981`, `#059669`, `#047857`
- Merah: `#ef4444`, `#dc2626`, `#b91c1c`
- Kuning: `#f59e0b`, `#d97706`, `#b45309`
- Ungu: `#8b5cf6`, `#7c3aed`, `#6d28d9`
