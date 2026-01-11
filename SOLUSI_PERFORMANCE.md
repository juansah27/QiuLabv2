# Solusi Performance - Monitoring Order Lambat

## 📊 Analisis Hasil Test

Dari `test_full_query_performance.sh`:

### Breakdown Waktu:
- **Query execution**: 0.420s ✅ (sangat cepat!)
- **Data fetch**: 10.329s ⚠️ **INI BOTTLENECK!**
- **Data processing**: 0.706s ✅ (OK)
- **Total**: 11.455s

### Masalah:
1. **Data fetch 10.3 detik** untuk 34,962 records
2. Frontend **TIDAK mengirim `per_page`** parameter
3. Backend fetch **SEMUA data** (34,962 records) setiap request

## 🎯 Solusi

### Solusi 1: Enable Pagination (RECOMMENDED)

**Masalah**: Frontend tidak mengirim `per_page`, jadi backend fetch semua data.

**Solusi**: Tambahkan `per_page` parameter di frontend untuk limit data.

**File**: `frontend/src/pages/MonitoringOrder/MonitoringOrder.jsx`

**Perubahan**:
```javascript
// SEBELUM (line 1145-1147):
const params = new URLSearchParams({
  page: '1'
});

// SESUDAH:
const params = new URLSearchParams({
  page: '1',
  per_page: '5000'  // Limit 5000 records per request
});
```

**Impact**:
- Data fetch: 10.3s → ~1.5s (untuk 5000 records)
- Total time: 11.5s → ~2.5s
- **Improvement: 78% lebih cepat!**

### Solusi 2: Optimasi Packet Size

**Masalah**: Packet size 4096 mungkin masih kecil untuk data besar.

**File**: `backend/routes/query.py` (line 70)

**Perubahan**:
```python
# SEBELUM:
connection_string += ';Packet Size=4096'

# SESUDAH:
connection_string += ';Packet Size=8192'  # Double packet size
```

**Impact**:
- Data fetch: 10.3s → ~7-8s (estimated)
- **Improvement: 20-30% lebih cepat**

### Solusi 3: Implementasi Chunked Loading

**Masalah**: Load semua data sekaligus.

**Solusi**: Load data per chunk (misal 5000 records per chunk).

**File**: `frontend/src/pages/MonitoringOrder/MonitoringOrder.jsx`

**Perubahan**: Load data secara bertahap:
1. Load 5000 records pertama (untuk cards)
2. Load sisa data di background (untuk charts)

### Solusi 4: Caching

**Masalah**: Data di-fetch setiap kali user akses.

**Solusi**: Cache hasil query untuk 2-5 menit.

**File**: `backend/routes/query.py`

**Perubahan**: Tambahkan caching layer (Redis atau in-memory).

## 🚀 Implementasi Cepat

### Option A: Quick Fix (Pagination)

Tambahkan `per_page` di 2 tempat:

1. **fetchCardsData** (line ~1145):
```javascript
const params = new URLSearchParams({
  page: '1',
  per_page: '5000'  // Limit untuk cards
});
```

2. **fetchChartsData** (line ~1212):
```javascript
const params = new URLSearchParams({
  page: '1',
  per_page: '10000'  // Limit untuk charts (lebih besar karena perlu data lengkap)
});
```

**Note**: 
- Cards hanya perlu summary, bisa pakai 5000
- Charts perlu data lebih lengkap, bisa pakai 10000
- Jika perlu semua data, bisa multiple requests dengan pagination

### Option B: Optimasi Packet Size

Ubah di `backend/routes/query.py` line 70:
```python
connection_string += ';Packet Size=8192'  # Dari 4096 ke 8192
```

## 📊 Expected Results

Setelah implementasi:

### Dengan Pagination (5000 records):
- Query execution: 0.4s
- Data fetch: ~1.5s
- Data processing: 0.1s
- **Total: ~2s** ✅

### Dengan Packet Size 8192:
- Query execution: 0.4s
- Data fetch: ~7-8s (masih lambat)
- Data processing: 0.7s
- **Total: ~8-9s** ⚠️

**Kesimpulan**: Pagination lebih efektif!

## 🔧 Langkah Implementasi

1. **Edit frontend** untuk tambah `per_page`
2. **Test** dengan jumlah records lebih kecil
3. **Monitor** performance improvement
4. **Adjust** `per_page` value sesuai kebutuhan

## 📝 Checklist

- [ ] Tambahkan `per_page` di `fetchCardsData`
- [ ] Tambahkan `per_page` di `fetchChartsData`
- [ ] Test dengan 5000 records
- [ ] Monitor query execution time
- [ ] Adjust `per_page` jika perlu
- [ ] (Optional) Optimasi packet size ke 8192

## 🎯 Rekomendasi

**Prioritas 1**: Implementasi pagination (per_page)
- Impact: 78% improvement
- Effort: Low (1 file, 2 lines)
- Risk: Low

**Prioritas 2**: Optimasi packet size
- Impact: 20-30% improvement
- Effort: Low (1 file, 1 line)
- Risk: Low

**Prioritas 3**: Chunked loading
- Impact: Better UX
- Effort: Medium
- Risk: Medium


