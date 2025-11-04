# Frontend React Application

Ini adalah aplikasi frontend yang menggunakan React, Vite, dan TailwindCSS untuk menyediakan antarmuka pengguna untuk manajemen dan analisis data Excel serta query SQL.

## Fitur

- Autentikasi pengguna dengan JWT
- Pengelolaan file Excel
- Pengelolaan query SQL
- Dashboard visualisasi data menggunakan Chart.js
- Pengelolaan database melalui antarmuka CRUD
- Tema dinamis (mode gelap & terang)
- UI responsif untuk desktop dan mobile

## Persiapan Pengembangan

1. Pastikan Node.js versi 14+ telah terpasang pada sistem Anda

2. Install dependencies:
```
npm install
```

3. Jalankan aplikasi dalam mode development:
```
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000 dan akan secara otomatis proxy request API ke backend pada http://localhost:5000

## Struktur Direktori

- `/src`: Source code utama
  - `/components`: Komponen React yang dapat digunakan kembali
  - `/pages`: Halaman-halaman aplikasi
  - `/hooks`: Custom React hooks
  - `/context`: React Context untuk state management
  - `/utils`: Utilitas dan helper functions
  - `/assets`: Aset statis (gambar, ikon, dll.)

## Build untuk Production

Untuk membuat build produksi:

```
npm run build
```

Hasil build akan tersedia di direktori `dist` yang kemudian dapat di-deploy ke web server atau layanan hosting statis.

## Teknologi Utama

- React 18
- React Router v6
- TailwindCSS
- Chart.js / React-Chartjs-2
- Axios
- JWT Authentication

## Halaman dengan Tailwind CSS

Halaman `SetupRequestTailwind.jsx` adalah contoh implementasi UI yang menggunakan Tailwind CSS sebagai alternatif dari MUI (Material-UI). Halaman ini menunjukkan bagaimana komponen-komponen yang awalnya menggunakan MUI dapat diimplementasikan ulang menggunakan classes dari Tailwind.

Keuntungan menggunakan Tailwind:
- Tidak perlu mengimpor banyak komponen dari MUI
- Ukuran bundle lebih kecil
- Kustomisasi lebih fleksibel dengan utility classes
- Konsistensi visual yang lebih baik dengan halaman lain yang menggunakan Tailwind

Untuk menggunakan pendekatan Tailwind pada halaman lain, lihat `SetupRequestTailwind.jsx` sebagai referensi.

## Halaman Utama

- `/login` & `/register`: Autentikasi pengguna
- `/dashboard`: Tampilan ringkasan
- `/excel`: Pengelolaan file Excel
- `/queries`: Pengelolaan query SQL
- `/database`: Browser dan editor database
- `/profile`: Pengaturan profil pengguna
- `/future`: Fitur yang akan datang 