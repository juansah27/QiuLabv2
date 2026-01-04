# Logika Bisnis Setup-Request - Penjelasan Detail

## 📋 Ringkasan Eksekutif

**Setup-Request** adalah sistem untuk memproses file Excel yang berisi data konfigurasi produk e-commerce (Bundle, Supplementary, Gift) dan mengkonversinya ke format yang siap digunakan untuk setup di marketplace seperti Tokopedia, Shopee, Lazada, dll.

---

## 🎯 Tujuan Bisnis

1. **Otomasi Konversi Data**: Mengkonversi data Excel mentah menjadi format standar yang bisa langsung digunakan untuk setup di marketplace
2. **Validasi Data**: Memastikan data yang diinput valid sebelum diproses
3. **Mapping Otomatis**: Menggunakan mapping database untuk mengisi ShopId dan ClientId secara otomatis
4. **Tracking & Analytics**: Mencatat semua proses untuk analisis dan pelacakan

---

## 🏗️ Arsitektur Sistem

### Komponen Utama

1. **Frontend (React)**
   - Upload file Excel
   - Input parameter pemrosesan
   - Tampilkan log proses
   - Download hasil

2. **Backend (Flask)**
   - API endpoints untuk upload & proses
   - Processor untuk konversi data
   - Database untuk mapping ShopId/ClientId
   - Analytics tracking

3. **Database (SQLite)**
   - `shop_mapping`: Mapping marketplace+client → shop_id+client_id
   - `setup_request_analytics`: Tracking semua proses yang dilakukan

---

## 📊 Tiga Tipe Proses

### 1. **BUNDLE** (Produk Bundle/Paket)

**Tujuan**: Membuat produk bundle yang terdiri dari beberapa produk komponen

**Input Required**:
- `Marketplace`: Nama marketplace (Tokopedia, Shopee, dll)
- `Client`: Nama client/brand
- `ShopId`: ID toko di marketplace (atau akan di-mapping otomatis)
- `SKU Bundle`: Kode SKU untuk produk bundle
- `SKU Product`: Kode SKU untuk produk komponen
- `Qty`: Jumlah produk komponen dalam bundle
- `Start_Date`: Tanggal mulai berlaku bundle
- `End_Date`: Tanggal berakhir bundle

**Proses**:
1. Validasi kolom wajib tidak kosong
2. Mapping ShopId dari database berdasarkan Marketplace + Client
3. Konversi format tanggal ke standar `MM/DD/YYYY HH:MM:SS`
4. Validasi range tanggal (End_Date > Start_Date)
5. Generate output dengan format:
   - Kolom: Marketplace, Client, ShopId, ClientId, SKU Bundle, SKU Product, Qty, Start_Date, End_Date

**Output Format**:
```
Marketplace | Client | ShopId | ClientId | SKU Bundle | SKU Product | Qty | Start_Date | End_Date
Tokopedia   | BrandA | 12345  | CL001    | BUNDLE001  | PROD001     | 2   | 01/01/2024 | 31/12/2024
```

**Use Case**: 
- Brand ingin membuat paket bundling (contoh: Beli 2 Gratis 1)
- Bundle produk A + B dengan harga khusus

---

### 2. **SUPPLEMENTARY** (Produk Tambahan/Hadiah)

**Tujuan**: Menambahkan produk hadiah/tambahan untuk produk utama tertentu

**Input Required**:
- `Marketplace`: Nama marketplace
- `Client`: Nama client/brand
- `Main SKU`: Kode SKU produk utama
- `Gift SKU`: Kode SKU produk hadiah/tambahan
- `Gift Qty`: Jumlah produk hadiah
- `Start_Date`: Tanggal mulai promosi
- `End_Date`: Tanggal berakhir promosi

**Proses**:
1. Validasi kolom wajib tidak kosong
2. Split Marketplace jika ada beberapa marketplace dipisahkan koma
3. Mapping ShopId dari database
4. Konversi format tanggal
5. Validasi range tanggal
6. Generate output dengan format:
   - Kolom: Marketplace, Client, ShopId, ClientId, Main SKU, Gift SKU, Gift Qty, Start_Date, End_Date

**Output Format**:
```
Marketplace | Client | ShopId | ClientId | Main SKU | Gift SKU | Gift Qty | Start_Date | End_Date
Tokopedia   | BrandA | 12345  | CL001    | PROD001  | GIFT001  | 1        | 01/01/2024 | 31/12/2024
Shopee      | BrandA | 12345  | CL001    | PROD001  | GIFT001  | 1        | 01/01/2024 | 31/12/2024
```

**Use Case**:
- Beli produk A dapat produk B gratis
- Promosi "Buy 1 Get 1"
- Hadiah untuk pembelian tertentu

---

### 3. **GIFT** (Gift berdasarkan Nilai Pembelian)

**Tujuan**: Memberikan hadiah berdasarkan nilai pembelian (Value-based Gift)

**Input Required**:
- `Marketplace`: Nama marketplace
- `Client`: Nama client/brand
- `Main SKU`: Kode SKU produk utama (opsional untuk Gift Type 3)
- `Gift SKU`: Kode SKU produk hadiah
- `Gift Qty`: Jumlah produk hadiah
- `Value_Start`: Nilai minimum pembelian (untuk Gift Type 2)
- `Value_End`: Nilai maksimum pembelian (untuk Gift Type 2)
- `Start_Date`: Tanggal mulai promosi
- `End_Date`: Tanggal berakhir promosi

**Proses**:
1. **Determine Gift Type**:
   - **Gift Type 2**: Ada Value_Start dan Value_End → Hadiah berdasarkan range nilai pembelian
   - **Gift Type 3**: Tidak ada Value_Start/Value_End atau Main SKU kosong → Hadiah untuk semua pembelian (ItemLimit)

2. Validasi kolom sesuai gift type:
   - Type 2: Value_Start, Value_End wajib
   - Type 3: Main SKU boleh kosong (menggunakan ItemLimit)

3. Mapping ShopId dari database
4. Konversi format tanggal
5. Validasi range tanggal
6. Generate output dengan format khusus:
   - **Header Table**: Informasi umum (Marketplace, Client, ShopId, ClientId, Start_Date, End_Date)
   - **Line Table**: Detail gift (Gift SKU, Gift Qty, Main SKU, Value_Start, Value_End, Gift Type)

**Output Format (2 Sheet)**:

**Sheet 1 - Header**:
```
Marketplace | Client | ShopId | ClientId | Start_Date | End_Date
Tokopedia   | BrandA | 12345  | CL001    | 01/01/2024 | 31/12/2024
```

**Sheet 2 - Line**:
```
Gift SKU | Gift Qty | Main SKU | Value_Start | Value_End | Gift Type
GIFT001  | 1        | PROD001  | 100000      | 500000     | 2
GIFT002  | 1        |          |             |            | 3
```

**Use Case**:
- **Type 2**: Beli minimal Rp 100.000 dapat hadiah X
- **Type 3**: Setiap pembelian dapat hadiah Y (tanpa batas nilai)

---

## 🔄 Flow Proses Lengkap

### Step 1: Upload File
```
User → Upload Excel File → Validasi Format (.xlsx/.xls) → Validasi Ukuran (max 10MB)
```

### Step 2: Input Parameter
```
User Input:
- Process Type: Bundle / Supplementary / Gift
- Created By: Nama user yang membuat request
- Combine Sheets: Opsi untuk menggabungkan semua sheet
- Output Format: xlsx / csv
```

### Step 3: Validasi File
```
1. Cek kolom wajib ada
2. Normalisasi nama kolom (handle berbagai variasi nama)
3. Validasi data tidak kosong di kolom wajib
4. Validasi format tanggal
5. Validasi range tanggal (End > Start)
```

### Step 4: Mapping Data
```
1. Load ShopId mapping dari database
   - Key: "marketplace_client" (lowercase)
   - Value: shop_id
   
2. Load ClientId mapping dari database
   - Key: shop_id
   - Value: client_id

3. Assign ShopId untuk setiap row:
   - Cari di mapping berdasarkan Marketplace + Client
   - Jika tidak ditemukan → "Unknown" (akan error)

4. Assign ClientId:
   - Cari di mapping berdasarkan ShopId
   - Jika tidak ditemukan → NULL
```

### Step 5: Proses Data
```
Berdasarkan Process Type:
- Bundle → process_bundle()
- Supplementary → process_supplementary()
- Gift → process_gift()
```

### Step 6: Generate Output
```
1. Format data sesuai output format (xlsx/csv)
2. Simpan ke file system
3. Generate request_id (timestamp)
4. Simpan metadata ke session file
```

### Step 7: Save Analytics
```
1. Extract analytics data dari hasil proses:
   - request_id
   - client
   - marketplace
   - gift_type (untuk Gift)
   - process_type
   - created_by
   - shop_id
   - client_id

2. Simpan ke database setup_request_analytics
```

### Step 8: Return Result
```
Response:
- status: success/error
- request_id: ID untuk download
- logs: Array log proses
- output_path: Path file hasil
```

---

## 🗄️ Database Schema

### Table: `shop_mapping`
**Tujuan**: Mapping antara Marketplace+Client dengan ShopId+ClientId

```sql
CREATE TABLE shop_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marketplace TEXT NOT NULL,      -- Tokopedia, Shopee, dll
    client TEXT NOT NULL,          -- Nama brand/client
    shop_id TEXT NOT NULL,         -- ID toko di marketplace
    client_id TEXT                 -- ID client di sistem
)
```

**Contoh Data**:
```
marketplace | client  | shop_id | client_id
Tokopedia   | BrandA  | 12345   | CL001
Shopee      | BrandA  | 67890   | CL001
Tokopedia   | BrandB  | 11111   | CL002
```

**Cara Kerja Mapping**:
- Key lookup: `f"{marketplace.lower()}_{client.lower()}"`
- Contoh: `"tokopedia_branda"` → `shop_id: "12345"`

---

### Table: `setup_request_analytics`
**Tujuan**: Tracking semua proses setup request untuk analytics

```sql
CREATE TABLE setup_request_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT NOT NULL,      -- ID unik setiap request
    client TEXT NOT NULL,          -- Nama client
    marketplace TEXT NOT NULL,     -- Nama marketplace
    gift_type TEXT NOT NULL,       -- 2 atau 3 (untuk Gift)
    process_type TEXT NOT NULL,    -- Bundle/Supplementary/Gift
    created_by TEXT NOT NULL,      -- Username yang membuat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shop_id TEXT,                  -- Shop ID yang digunakan
    client_id TEXT                 -- Client ID yang digunakan
)
```

**Use Case Analytics**:
- Total request per client
- Total request per marketplace
- Total request per process type
- Total request per gift type
- Tracking aktivitas user (created_by)
- Trend request per periode

---

## 🔍 Validasi & Error Handling

### Validasi File
1. **Format File**: Hanya `.xlsx` dan `.xls`
2. **Ukuran File**: Maksimal 10MB
3. **Kolom Wajib**: Harus ada sesuai process type
4. **Data Kosong**: Kolom wajib tidak boleh kosong
5. **Format Tanggal**: Harus bisa di-parse ke format standar
6. **Range Tanggal**: End_Date harus > Start_Date

### Validasi Mapping
1. **ShopId Mapping**: 
   - Jika tidak ditemukan → Error: "MARKETPLACE TIDAK DITEMUKAN DI DATABASE"
   - User harus menambahkan mapping di tab "Shop Mappings"

2. **ClientId Mapping**:
   - Jika tidak ditemukan → NULL (tidak error, hanya warning)

### Error Messages
Sistem memberikan error message yang detail dan actionable:
- ❌ Menjelaskan masalah spesifik
- 📋 Menampilkan detail error (baris, kolom, nilai)
- 💡 Memberikan solusi yang jelas

---

## 📈 Analytics & Reporting

### Metrics yang Dicatat

1. **Process Type Distribution**:
   - Total Bundle requests
   - Total Supplementary requests
   - Total Gift Type 2 requests
   - Total Gift Type 3 requests

2. **Client Analytics**:
   - Top clients by request count
   - Client activity status (Active/Recent/Inactive)
   - Trend per client

3. **User Analytics**:
   - Total unique PICs (Person In Charge)
   - Request count per user
   - Completion rate per user
   - Average processing time

4. **Time-based Analytics**:
   - Requests per hour (today)
   - Requests per day (this week)
   - Requests per week (this month)

### API Endpoint: `/api/setup-request/statistics`
Mengembalikan data analytics dengan filter periode:
- `period=today`: Data hari ini
- `period=week`: Data 7 hari terakhir
- `period=month`: Data bulan ini

---

## 🛠️ Fitur Tambahan

### 1. Shop Mappings Management
**Tujuan**: Mengelola mapping ShopId dan ClientId

**Fitur**:
- Tambah mapping manual (form input)
- Bulk upload mapping (Excel/CSV)
- Hapus mapping (admin only)
- Search & filter mappings

**Format Bulk Upload**:
```
marketplace,client,shop_id,client_id
Tokopedia,BrandA,12345,CL001
Shopee,BrandA,67890,CL001
```

### 2. Template Download
**Tujuan**: Memberikan template Excel untuk user

**Templates**:
- `bundle_template.xlsx` / `bundle_template.csv`
- `supplementary_template.xlsx` / `supplementary_template.csv`
- `gift_template.xlsx` / `gift_template.csv`
- `shop_mapping_template.xlsx` / `shop_mapping_template.csv`

### 3. Combine Sheets
**Opsi**: Menggabungkan semua sheet dalam satu file menjadi satu output

**Use Case**: 
- File Excel memiliki multiple sheets dengan data yang sama
- Ingin output dalam satu file saja

### 4. Output Format Options
- **Excel (.xlsx)**: Format standar dengan styling
- **CSV (.csv)**: Format sederhana untuk import ke sistem lain

---

## 🔐 Security & Permissions

### Authentication
- Semua endpoint memerlukan JWT token
- Token diambil dari localStorage frontend
- Token dikirim via Authorization header

### Authorization
- **Admin**: Bisa hapus shop mappings
- **User**: Bisa upload & proses file
- **Created By Field**: 
  - Admin bisa edit
  - User biasa auto-fill dari username login

---

## 📝 Logika Khusus

### 1. Normalisasi Kolom
Sistem mendukung berbagai variasi nama kolom:
- `Marketplace` = `Market Place` = `Marketplace Unnamed: 0_level_1`
- `SKU Bundle` = `SKU BUNDLING SKU Bundle` = `Form Bundle : SKU BUNDLE`
- `Start_Date` = `Tanggal Mulai` = `Tgl Mulai` = `Periode Start_Date`

**Cara Kerja**:
- Mapping dictionary dengan berbagai variasi nama
- Case-insensitive matching
- Auto-rename ke nama standar

### 2. Date Format Conversion
Mendukung berbagai format tanggal:
- `DD/MM/YYYY HH:MM:SS`
- `MM/DD/YYYY HH:MM:SS`
- `YYYY-MM-DD HH:MM:SS`
- `DD-MM-YYYY HH:MM:SS`
- Dan berbagai variasi lainnya

**Konversi**:
- Start_Date: Tetap waktu asli
- End_Date: Jika waktu 00:00:00 → diubah ke 23:59:59

### 3. Multi-Marketplace Support
Untuk Supplementary, satu row bisa menghasilkan multiple rows jika Marketplace dipisahkan koma:
```
Input: Marketplace = "Tokopedia, Shopee"
Output: 
- Row 1: Marketplace = "Tokopedia"
- Row 2: Marketplace = "Shopee"
```

### 4. Gift Type Determination
**Logic**:
```python
if Value_Start ada DAN Value_End ada:
    gift_type = "2"  # Value-based gift
else:
    gift_type = "3"  # ItemLimit (semua pembelian)
```

### 5. Optimized Mapping Lookup
**Problem**: Lookup database untuk setiap row lambat

**Solution**: 
- Load semua mapping ke memory sekali di awal
- Gunakan dictionary lookup (O(1))
- Batch processing untuk client_id lookup

---

## 🎯 Use Cases Real-World

### Use Case 1: Bundle Promosi Bulanan
**Scenario**: Brand ingin membuat bundle promosi setiap bulan

**Flow**:
1. Admin setup shop mapping untuk brand di berbagai marketplace
2. User upload Excel dengan data bundle bulanan
3. Sistem proses dan generate output
4. Output digunakan untuk setup di marketplace
5. Analytics tracking untuk monitoring

### Use Case 2: Gift Campaign
**Scenario**: Brand ingin memberikan hadiah untuk pembelian tertentu

**Flow**:
1. User pilih process type "Gift"
2. Upload Excel dengan data gift (Value_Start, Value_End)
3. Sistem determine gift type (2 atau 3)
4. Generate output dengan format Header + Line
5. Output digunakan untuk konfigurasi gift di marketplace

### Use Case 3: Bulk Setup Multiple Clients
**Scenario**: Agency perlu setup untuk banyak client sekaligus

**Flow**:
1. Admin bulk upload shop mappings untuk semua client
2. User upload Excel dengan data multiple clients
3. Sistem otomatis mapping ShopId untuk setiap client
4. Generate output terpisah atau combined
5. Download dan distribusi ke masing-masing client

---

## 🔄 Integration Points

### 1. Download Center Integration
Setelah proses selesai, file hasil otomatis ditambahkan ke Download Center untuk:
- Tracking file yang sudah diproses
- Easy access untuk download ulang
- History management

### 2. Dashboard Analytics Integration
Data analytics digunakan di Dashboard untuk:
- Menampilkan statistik setup request
- Chart distribusi process type
- Top clients visualization

### 3. Statistics Page Integration
Data analytics digunakan di Statistics page untuk:
- Detail analytics per periode
- Trend analysis
- User performance tracking

---

## 📊 Data Flow Diagram

```
[User Upload Excel]
        ↓
[Validasi File & Kolom]
        ↓
[Load Mapping dari DB]
        ↓
[Proses sesuai Type]
    ├─→ Bundle Process
    ├─→ Supplementary Process
    └─→ Gift Process
        ↓
[Generate Output File]
        ↓
[Save Analytics ke DB]
        ↓
[Add ke Download Center]
        ↓
[Return Result ke User]
```

---

## 🎓 Kesimpulan

**Setup-Request** adalah sistem yang:
1. **Otomatis**: Mengurangi manual work untuk konversi data
2. **Validasi**: Memastikan data valid sebelum diproses
3. **Mapping**: Otomatis mapping ShopId/ClientId dari database
4. **Tracking**: Mencatat semua aktivitas untuk analytics
5. **Flexible**: Mendukung berbagai format input dan output
6. **User-Friendly**: Error messages yang jelas dan actionable

Sistem ini sangat penting untuk operasional e-commerce karena:
- Menghemat waktu konversi data manual
- Mengurangi error human
- Memudahkan tracking dan monitoring
- Standardisasi format output














