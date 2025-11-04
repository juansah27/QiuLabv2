import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mendapatkan direktori saat ini
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direktori untuk menyimpan template
const templateDir = path.join(__dirname, 'public', 'templates');

// Fungsi untuk membuat file template XLSX dari CSV
async function createXlsxFromCsv(csvFile, xlsxFile) {
  console.log(`Membuat ${xlsxFile} dari ${csvFile}...`);
  
  // Membaca file CSV
  const csvContent = fs.readFileSync(path.join(templateDir, csvFile), 'utf-8');
  const rows = csvContent.split('\n').filter(line => line.trim());
  
  // Membuat workbook baru
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template');
  
  // Menambahkan header dan data ke worksheet
  rows.forEach(row => {
    const cells = row.split(',').map(cell => cell.trim());
    worksheet.addRow(cells);
  });
  
  // Menyesuaikan lebar kolom
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength + 2;
  });
  
  // Format header (baris pertama) dengan bold dan background color
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light Gray
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  
  // Menyimpan file XLSX
  await workbook.xlsx.writeFile(path.join(templateDir, xlsxFile));
  console.log(`File ${xlsxFile} berhasil dibuat!`);
}

// Membuat semua template XLSX
async function createAllTemplates() {
  try {
    // Memastikan direktori templates ada
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    
    // Membuat template bundle
    await createXlsxFromCsv('bundle_template.csv', 'bundle_template.xlsx');
    
    // Membuat template supplementary
    await createXlsxFromCsv('supplementary_template.csv', 'supplementary_template.xlsx');
    
    // Membuat template gift
    await createXlsxFromCsv('gift_template.csv', 'gift_template.xlsx');
    
    // Membuat template shop mapping
    await createXlsxFromCsv('shop_mapping_template.csv', 'shop_mapping_template.xlsx');
    
    console.log('Semua template XLSX berhasil dibuat!');
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Menjalankan pembuatan template
createAllTemplates(); 