# Panduan Implementasi Dark Mode

Dokumen ini memberikan panduan dan standar untuk implementasi dark mode yang konsisten di aplikasi QiuLab.

## Prinsip Utama

1. **Konsistensi**: Semua komponen harus mendukung dark mode
2. **Transisi**: Gunakan transisi halus saat beralih antara light dan dark mode
3. **Keterbacaan**: Pastikan kontras yang cukup di kedua mode untuk keterbacaan

## Implementasi Kelas Tailwind

### Warna Latar

| Elemen | Light Mode | Dark Mode |
|--------|------------|-----------|
| Latar belakang utama | `bg-white` | `dark:bg-gray-900` |
| Kartu/panel | `bg-white` | `dark:bg-gray-800` |
| Navbar/sidebar | `bg-gray-100` | `dark:bg-gray-800` |
| Header tabel | `bg-gray-50` | `dark:bg-gray-700` |
| Hover pada elemen | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |

### Teks

| Tipe Teks | Light Mode | Dark Mode |
|-----------|------------|-----------|
| Teks utama | `text-gray-800` | `dark:text-white` |
| Teks sekunder | `text-gray-600` | `dark:text-gray-300` |
| Teks tertier | `text-gray-500` | `dark:text-gray-400` |
| Teks tombol | `text-white` (pada latar berwarna) | `dark:text-white` |
| Link | `text-primary-600` | `dark:text-primary-400` |

### Border dan Divider

| Elemen | Light Mode | Dark Mode |
|--------|------------|-----------|
| Border kartu | `border-gray-200` | `dark:border-gray-700` |
| Border input | `border-gray-300` | `dark:border-gray-600` |
| Divider | `divide-gray-200` | `dark:divide-gray-700` |

### Interaksi

| Interaksi | Light Mode | Dark Mode |
|-----------|------------|-----------|
| Hover link | `hover:text-primary-800` | `dark:hover:text-primary-300` |
| Focus input | `focus:ring-primary-500` | (sama di dark mode) |

## Contoh Penggunaan Komponen

### Kartu/Card

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Judul Kartu</h2>
  <p className="mt-2 text-gray-600 dark:text-gray-300">Konten kartu...</p>
</div>
```

### Input

```jsx
<input 
  type="text" 
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-300" 
  placeholder="Masukkan nilai..."
/>
```

### Tombol

```jsx
<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-md transition-colors duration-300">
  Tombol Utama
</button>
```

### Tabel

```jsx
<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
  <thead className="bg-gray-50 dark:bg-gray-700">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Kolom 1
      </th>
      <!-- ... kolom lainnya ... -->
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
        Data 1
      </td>
      <!-- ... data lainnya ... -->
    </tr>
    <!-- ... baris lainnya ... -->
  </tbody>
</table>
```

## Gunakan Utilitas Tema

Untuk konsistensi yang lebih baik, gunakan utilitas tema dari `src/utils/themeUtils.js`:

```jsx
import { getColorClasses, COMPONENT_CLASSES, THEME_TRANSITIONS } from '../utils/themeUtils';

function MyComponent() {
  return (
    <div className={`${COMPONENT_CLASSES.card} p-4`}>
      <h2 className={getColorClasses('text')}>Judul Komponen</h2>
      <p className={getColorClasses('text', 'secondary')}>Konten komponen...</p>
      <button className={`${COMPONENT_CLASSES.button.primary} px-4 py-2 rounded-md mt-4`}>
        Tombol
      </button>
    </div>
  );
}
``` 