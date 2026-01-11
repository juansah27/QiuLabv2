# 📋 Setup Request - Dokumentasi

> **Dokumentasi Setup Request - QiuLab v2**  
> *Last Updated: 6 Januari 2026*

---

## 📑 Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Tipe Proses](#tipe-proses)
- [Format File Input](#format-file-input)
- [Format File Output](#format-file-output)
- [Business Rules & Validasi](#business-rules--validasi)
- [Contoh Lengkap](#contoh-lengkap)
- [FAQ](#faq)

---

## Gambaran Umum

### Apa itu Setup Request?

**Setup Request** memproses file Excel dari marketplace (TikTok, Shopee, dll) menjadi format yang siap import ke WMS (Warehouse Management System).

### Fungsi Utama

```
Input: Excel dari Marketplace
  ↓
Processing: Validasi + Mapping + Transform
  ↓
Output: Excel/CSV siap import ke WMS
```

### Database: PostgreSQL

**Tabel Utama:**
- `cmsclientshop` - Mapping marketplace & client ke shop_id

---

## Tipe Proses

### 1. Bundle
Transform file bundle dari marketplace ke format WMS bundle

**Contoh Use Case:**
```
Bundle "Starter Pack" berisi:
- 2x Product A
- 1x Product B
- 1x Product C
```

### 2. Supplementary
Transform file supplementary (item bonus/promo)

**Contoh Use Case:**
```
Beli Product A → Gratis Product B (qty 1)
```

### 3. Gift
Transform file gift dengan 2 tipe:
- **Gift Type 2**: Gift per produk tertentu
- **Gift Type 3**: Gift berdasarkan total belanja

---

## Format File Input

### Bundle Input

**Kolom Wajib:**

| Kolom | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `Marketplace` | Text | "TikTok" atau "TikTok, Shopee" | Bisa multiple (pisah koma) |
| `Client` | Text | "AMAN MAJU NUSANTARA" | Nama client |
| `SKU Bundle` | Text | "BDL-001" | Kode bundle |
| `SKU Product` | Text | "PROD-123" | Kode komponen |
| `Qty` | Number | 2 | Jumlah komponen |
| `Start_Date` | Date | "01/01/2026" | Tanggal mulai |
| `End_Date` | Date | "31/12/2026" | Tanggal selesai |

**Kolom Opsional:**
- `Name Bundle` - Nama bundle
- `Name Product` - Nama produk

**Contoh Excel:**

```
┌─────────────┬─────────────────────┬────────────┬─────────────┬─────┬────────────┬────────────┐
│ Marketplace │ Client              │ SKU Bundle │ SKU Product │ Qty │ Start_Date │ End_Date   │
├─────────────┼─────────────────────┼────────────┼─────────────┼─────┼────────────┼────────────┤
│ TikTok      │ AMAN MAJU NUSANTARA │ BDL-001    │ PROD-123    │ 2   │ 01/01/2026 │ 31/12/2026 │
│ TikTok      │ AMAN MAJU NUSANTARA │ BDL-001    │ PROD-456    │ 1   │ 01/01/2026 │ 31/12/2026 │
└─────────────┴─────────────────────┴────────────┴─────────────┴─────┴────────────┴────────────┘
```

### Supplementary Input

**Kolom Wajib:**

| Kolom | Tipe | Contoh |
|-------|------|--------|
| `Marketplace` | Text | "Shopee" |
| `Client` | Text | "AMAN MAJU NUSANTARA" |
| `Main SKU` | Text | "MAIN-001" |
| `Gift SKU` | Text | "GIFT-001" |
| `Gift Qty` | Number | 1 |
| `Start_Date` | Date | "01/01/2026" |
| `End_Date` | Date | "31/03/2026" |

### Gift Input

**Kolom Wajib:**

| Kolom | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `Marketplace` | Text | "TikTok" | |
| `Client` | Text | "AMAN MAJU NUSANTARA" | |
| `Gift SKU` | Text | "GIFT-001" | SKU hadiah |
| `Gift Qty` | Number | 1 | Qty hadiah |
| `Value_Start` | Number | 100000 | Min. pembelian |
| `Value_End` | Number | 500000 | Max. pembelian |
| `Start_Date` | Date | "01/01/2026" | |
| `End_Date` | Date | "31/03/2026" | |

**Kolom Opsional:**
- `Main SKU` - Jika diisi = Gift Type 2, Jika kosong = Gift Type 3
- `Limit Qty` - Batas kuota gift (Isi angka atau "No Limit")

---

## Format File Output

### Bundle & Supplementary Output

**14 Kolom Output:**

| Kolom | Sumber | Contoh | Keterangan |
|-------|--------|--------|------------|
| `MainSKU` | SKU Bundle | "BDL-001" | Bundle SKU |
| `BOMSKU` | SKU Product | "PROD-123" | Component SKU |
| `BOMQty` | Qty | 2 | Quantity |
| `IsActive` | System | True | Auto: True |
| `ShopId` | Database | "SH680AFFCF5F..." | Dari shop_mapping |
| `CreatedDate` | System | "01/06/2026 13:45:30" | Timestamp saat proses |
| `CreatedBy` | User Input | "juan" | Username |
| `UpdatedDate` | System | "NULL" | Auto: NULL |
| `UpdatedBy` | System | "NULL" | Auto: NULL |
| `SingleSKU` | System | False | Auto: False |
| `IsHadiah` | System | False | Auto: False |
| `StartDate` | Start_Date | "01/01/2026" | Converted format |
| `EndDate` | End_Date | "31/12/2026" | Converted format |
| `Multiply` | System | True | Auto: True |

**Contoh Output:**

```csv
MainSKU,BOMSKU,BOMQty,IsActive,ShopId,CreatedDate,CreatedBy,UpdatedDate,UpdatedBy,SingleSKU,IsHadiah,StartDate,EndDate,Multiply
BDL-001,PROD-123,2,True,SH680AFFCF5F1503000192BFEF,01/06/2026 13:45:30,juan,NULL,NULL,False,False,01/01/2026,31/12/2026,True
BDL-001,PROD-456,1,True,SH680AFFCF5F1503000192BFEF,01/06/2026 13:45:30,juan,NULL,NULL,False,False,01/01/2026,31/12/2026,True
```

### Gift Output

**2 Sheet:**

**Sheet 1: Header**

| Kolom | Sumber | Keterangan |
|-------|--------|------------|
| `GIFTID` | Generated | Auto-generated ID |
| `SHOPID` | Database | Dari shop_mapping |
| `MARKETPLACE_CODE` | Marketplace | "TT" untuk TikTok, "SP" untuk Shopee |
| `VALUE_START` | Value_Start | Min purchase |
| `VALUE_END` | Value_End | Max purchase |
| `STARTDATE` | Start_Date | Converted |
| `ENDDATE` | End_Date | Converted |
| `GIFT_TYPE` | Calculated | 2 atau 3 |

**Sheet 2: Line**

| Kolom | Sumber |
|-------|--------|
| `GIFTID` | Reference ke Header |
| `MAINSKU` | Main SKU (gift type 2) |
| `GIFTSKU` | Gift SKU |
| `GIFTQTY` | Gift Qty |

---

## Business Rules & Validasi

### 1. Validasi File

```
✓ File .xlsx atau .xls
✓ Maksimal 10 MB
✓ Semua kolom wajib ada
✓ Tidak ada data kosong di kolom wajib
```

### 2. Validasi SKU (Bundle Only)

**Rule 1: SKU Bundle ≠ SKU Product**
```
❌ SALAH:
SKU Bundle = "BDL-001"
SKU Product = "BDL-001"  → Error!

✓ BENAR:
SKU Bundle = "BDL-001"
SKU Product = "PROD-123"
```

**Rule 2: SKU Bundle tidak boleh jadi SKU Product**
```
❌ SALAH:
Baris 1: SKU Bundle = "BDL-001", SKU Product = "PROD-123"
Baris 2: SKU Bundle = "X", SKU Product = "BDL-001"  → Error!

Penjelasan: BDL-001 sudah jadi bundle, tidak boleh jadi component
```

**Rule 3: Tidak boleh duplikat komponen**
```
❌ SALAH (dalam bundle yang sama):
SKU Bundle = "BDL-001", SKU Product = "PROD-123"
SKU Bundle = "BDL-001", SKU Product = "PROD-123"  → Duplikat!

✓ BENAR:
SKU Bundle = "BDL-001", SKU Product = "PROD-123"
SKU Bundle = "BDL-001", SKU Product = "PROD-456"
```

**Rule 4: Satu SKU Product = Satu Nama**
```
❌ SALAH:
SKU = "PROD-123", Name = "Product A"
SKU = "PROD-123", Name = "Product B"  → Nama berbeda!

✓ BENAR:
SKU = "PROD-123", Name = "Product A"
SKU = "PROD-123", Name = "Product A"  → Nama sama
```

### 3. Validasi Tanggal

**Format yang Diterima:**
```
✓ "DD/MM/YYYY" → "25/12/2025"
✓ "MM/DD/YYYY" → "12/25/2025"
✓ "YYYY-MM-DD" → "2025-12-25"
✓ Excel date number → Auto convert
```

**Rule Tanggal:**
```
End_Date harus >= Start_Date

❌ SALAH:
Start_Date = "31/12/2026"
End_Date = "01/01/2026"  → End lebih awal!

✓ BENAR:
Start_Date = "01/01/2026"
End_Date = "31/12/2026"
```

### 4. Shop Mapping

**Cara Kerja:**
```sql
-- System akan cari di database:
SELECT shop_id, client_id 
FROM shop_mapping 
WHERE marketplace = 'TikTok' 
  AND client = 'AMAN MAJU NUSANTARA'
```

**Jika Ditemukan:**
```
✓ Output: ShopId = "SH680AFFCF5F1503000192BFEF"
```

**Jika TIDAK Ditemukan:**
```
❌ Error: "Marketplace 'TikTok' + Client 'AMAN MAJU NUSANTARA' 
           tidak ditemukan di database"

Solusi: Tambah mapping di tab "Shop Mappings"
```

### 5. Multiple Marketplace

Jika Marketplace berisi multiple values (pisah koma):

**Input:**
```
Marketplace = "TikTok, Shopee"
```

**Output:** 
```
2 row dibuat:
Row 1: Marketplace = "TikTok"   → ShopId dari TikTok
Row 2: Marketplace = "Shopee"   → ShopId dari Shopee
```

---

## Contoh Lengkap

### Input Excel (Bundle)

```csv
Marketplace,Client,SKU Bundle,SKU Product,Qty,Start_Date,End_Date
TikTok,AMAN MAJU NUSANTARA,BDL-START-001,PROD-A-001,2,01/01/2026,31/12/2026
TikTok,AMAN MAJU NUSANTARA,BDL-START-001,PROD-B-002,1,01/01/2026,31/12/2026
Shopee,AMAN MAJU NUSANTARA,BDL-PREM-002,PROD-X-100,5,15/01/2026,15/06/2026
```

### Proses Transformasi

**Step 1: Mapping Shop ID**
```
TikTok + AMAN MAJU NUSANTARA → SH680AFFCF5F1503000192BFEF
Shopee + AMAN MAJU NUSANTARA → SH680AFFA3CFF47E0001ABE2F8
```

**Step 2: Transform ke Format WMS**
```
Input Row 1:
  SKU Bundle = "BDL-START-001"
  SKU Product = "PROD-A-001"
  Qty = 2

Output Row 1:
  MainSKU = "BDL-START-001"
  BOMSKU = "PROD-A-001"
  BOMQty = 2
  ShopId = "SH680AFFCF5F1503000192BFEF"
  IsActive = True
  ... (kolom lainnya)
```

**Step 3: Sort by Marketplace**
```
Priority: Shopee (1) > TikTok (2)
Result: Shopee row duluan, baru TikTok
```

### Output Excel (WMS Ready)

```csv
MainSKU,BOMSKU,BOMQty,IsActive,ShopId,CreatedDate,CreatedBy,UpdatedDate,UpdatedBy,SingleSKU,IsHadiah,StartDate,EndDate,Multiply
BDL-PREM-002,PROD-X-100,5,True,SH680AFFA3CFF47E0001ABE2F8,01/06/2026 13:45:30,juan,NULL,NULL,False,False,15/01/2026,15/06/2026,True
BDL-START-001,PROD-A-001,2,True,SH680AFFCF5F1503000192BFEF,01/06/2026 13:45:30,juan,NULL,NULL,False,False,01/01/2026,31/12/2026,True
BDL-START-001,PROD-B-002,1,True,SH680AFFCF5F1503000192BFEF,01/06/2026 13:45:30,juan,NULL,NULL,False,False,01/01/2026,31/12/2026,True
```

---

## FAQ

### Q1: Apa bedanya Bundle, Supplementary, dan Gift?

**Bundle**: 
- Paket produk yang dijual sebagai 1 bundle
- Contoh: "Starter Pack" berisi 3 produk

**Supplementary**: 
- Item bonus yang didapat saat beli produk tertentu
- Contoh: Beli Product A → Gratis Product B

**Gift**: 
- Hadiah berdasarkan total belanja atau produk tertentu
- Gift Type 2: Per produk (beli X dapat gift Y)
- Gift Type 3: Per nilai belanja (belanja >100rb dapat gift)

### Q2: Kenapa muncul error "ShopId Unknown"?

**Penyebab:** 
Kombinasi Marketplace + Client tidak ada di database `shop_mapping`

**Solusi:**
1. Buka tab "Shop Mappings"
2. Tambah mapping baru:
   - Marketplace: (sesuai di Excel)
   - Client: (sesuai di Excel)
   - Shop ID: (dari marketplace)
3. Save dan coba upload lagi

### Q3: Format tanggal apa yang diterima?

Semua format ini diterima:
- `01/01/2026` (DD/MM/YYYY)
- `12/25/2025` (MM/DD/YYYY)
- `2026-01-01` (YYYY-MM-DD)
- Excel date serial number

Output selalu: `MM/DD/YYYY`

### Q4: Bisa upload file dengan multiple client?

**Ya bisa!** Tapi harus di sheet berbeda atau file berbeda.

Jika 1 sheet berisi multiple client:
- Processing tetap jalan
- Output file naming pakai client pertama
- Semua client tetap ter-mapping

### Q5: File output nama-nya apa?

Format: `{Client}-{ProcessType}-{Date}.{format}`

Contoh:
- `AMAN MAJU NUSANTARA-Bundle-06012026.xlsx`
- `MOTHER OF PEARL-Gift-31122026.csv`

### Q6: Maksimal ukuran file berapa?

**10 MB** per file

Jika lebih besar:
- Split file menjadi beberapa bagian
- Atau hapus kolom/data yang tidak perlu

### Q7: Apakah Name Bundle dan Name Product wajib?

**Tidak wajib**, tapi disarankan ada untuk dokumentasi.

Yang wajib cuma:
- Bundle: SKU Bundle, SKU Product, Qty, Marketplace, Client, Start_Date, End_Date
- Supplementary: Main SKU, Gift SKU, Gift Qty, Marketplace, Client, Start_Date, End_Date
- Gift: Gift SKU, Gift Qty, Value_Start, Value_End, Start_Date, End_Date, Marketplace, Client

### Q8: Bagaimana cara handle multiple marketplace dalam 1 row?

**Input:**
```
Marketplace = "TikTok, Shopee, Lazada"
```

**System otomatis split jadi 3 row:**
```
Row 1: Marketplace = "TikTok"
Row 2: Marketplace = "Shopee"
Row 3: Marketplace = "Lazada"
```

Masing-masing dapat ShopId sendiri dari mapping.

### Q9: Apa yang terjadi jika SKU Bundle sama dengan SKU Product?

**Error!** System akan reject dan tampilkan:
```
Error: SKU Bundle tidak boleh sama dengan SKU Product
Daftar SKU bermasalah: BDL-001
```

Solusi: Pastikan SKU Bundle dan SKU Product berbeda.

### Q10: Bagaimana mengetahui Gift Type 2 atau 3?

**Ditentukan dari kolom Main SKU:**

```
Main SKU ada isi → Gift Type 2 (per produk)
Main SKU kosong  → Gift Type 3 (per nilai belanja)
```

### Q11: Bagaimana cara mengisi limit untuk Gift?

Gunakan kolom `Limit Qty`:
- Isi dengan angka (contoh: `100`) untuk set batas.
- Isi dengan "No Limit" jika tidak ada batas.

**Perilaku Limit:**
- **Gift Type 2** (Main SKU terisi): Limit masuk ke Header (`LIMIT SUMMARY`).
- **Gift Type 3** (Main SKU kosong): Limit masuk ke Line (`ITEMLIMIT`).