/**
 * Fungsi untuk ekspor data ke file Excel/CSV
 */

/**
 * Konversi array objek menjadi CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Column headers
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers) => {
  if (!data || !data.length) return '';
  
  // Membuat header CSV
  const csvHeaders = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',');
  
  // Membuat baris-baris CSV
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Ambil data sesuai dengan header
      const value = row[header] === null || row[header] === undefined ? '' : row[header];
      // Escape double quotes dan wrap nilai dengan quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  // Menggabungkan header dan baris
  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Unduh string CSV sebagai file
 * @param {string} csvString - CSV string yang akan diunduh
 * @param {string} filename - Nama file (tanpa ekstensi)
 */
export const downloadCSV = (csvString, filename = 'data') => {
  // Buat blob dari string CSV
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Buat URL untuk blob
  const url = URL.createObjectURL(blob);
  
  // Buat link untuk download dan klik secara otomatis
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Convert data ke Excel dan unduh
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Nama file (tanpa ekstensi)
 * @param {string} sheetName - Nama sheet Excel
 */
export const exportToExcel = (data, filename = 'data', sheetName = 'Sheet1') => {
  // Polyfill untuk Blob jika tidak tersedia
  if (typeof Blob === 'undefined') {
    console.error('Browser tidak mendukung Blob API yang diperlukan untuk ekspor Excel');
    return;
  }
  
  try {
    // Convert data ke CSV string
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const csvString = convertToCSV(data, headers);
    
    // Untuk Excel, tambahkan BOM agar karakter UTF-8 ditampilkan dengan benar
    const excelString = '\uFEFF' + csvString;
    
    // Buat blob untuk file Excel
    const blob = new Blob([excelString], { type: 'application/vnd.ms-excel;charset=utf-8' });
    
    // Download blob sebagai file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error saat ekspor ke Excel:', error);
  }
};

/**
 * Ekspor data ke format XLSX dengan menggunakan library xlsx
 * Catatan: Diperlukan library xlsx (npm install xlsx)
 * @param {Array} data - Data yang akan diekspor
 * @param {string} filename - Nama file (tanpa ekstensi)
 * @param {string} sheetName - Nama sheet Excel
 */
export const exportToXLSX = async (data, filename = 'data', sheetName = 'Sheet1') => {
  try {
    // Coba import xlsx library secara dinamis
    const XLSX = await import('xlsx');
    
    // Buat worksheet dari data
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Buat workbook dan tambahkan worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Tulis ke file dan download
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error saat ekspor ke XLSX (coba gunakan exportToExcel instead):', error);
    
    // Fallback ke exportToExcel jika xlsx library tidak tersedia
    exportToExcel(data, filename);
  }
}; 