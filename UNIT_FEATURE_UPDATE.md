# Update: Fitur Unit Kerja

## 📋 Ringkasan Perubahan

Aplikasi Perbandingan Data Pegawai telah diupdate untuk mendukung **8 Unit Kerja**:

1. Dinas
2. Cabdis Wil. 1
3. Cabdis Wil. 2
4. Cabdis Wil. 3
5. Cabdis Wil. 4
6. Cabdis Wil. 5
7. Cabdis Wil. 6
8. PPPK

## 🔄 Perubahan Backend

### 1. Database Schema

- **Kolom baru**: `unit` (String, indexed)
- **Unique constraint**: `(nip, month, year, unit)` - setiap pegawai unik per bulan/tahun/unit
- **Index baru**: `idx_month_year_unit` untuk performa query

### 2. API Endpoints Updated

- **POST /upload**: Tambah parameter `unit` (required)
- **POST /compare**: Tambah parameter `unit` (required)
- **GET /archive/data**: Tambah parameter `unit` (optional filter)
- **DELETE /admin/data**: Tambah parameter `unit` (required)
- **GET /admin/months**: Response include field `unit`

### 3. Services Updated

- `month_utils.py`: Fungsi `get_comparison_month_data()` dan `get_most_recent_comparison_month()` sekarang filter by unit

## 🎨 Perubahan Frontend

### 1. FileUpload Component

- **Dropdown Unit** ditambahkan di form upload
- Posisi: sebelum dropdown Bulan dan Tahun
- Default value: "Dinas"

### 2. DataTable Component

- **Tab Navigation** untuk switch antar unit
- 8 tab horizontal dengan badge count
- Active tab highlighted dengan warna biru
- Data di-filter berdasarkan unit yang aktif
- Search tetap berfungsi per unit

### 3. AdminPanel Component

- Kolom "Unit" ditambahkan di tabel
- Delete function sekarang per unit
- List data diurutkan berdasarkan year, month, dan unit

### 4. State Management (App.jsx)

- State baru: `uploadedUnit`
- LocalStorage: save/load `uploadedUnit`
- Comparison function include parameter `unit`

## 🚀 Cara Menggunakan

### Setup Database (PENTING!)

Karena ada perubahan schema, database perlu di-recreate:

```bash
cd backend
python recreate_db.py
```

⚠️ **Warning**: Script ini akan menghapus semua data existing!

### Menjalankan Aplikasi

**Backend:**

```bash
cd backend
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm start
```

### Upload Data

1. Pilih **Unit** dari dropdown (contoh: "Dinas")
2. Pilih **Bulan** dan **Tahun**
3. Upload file Excel/CSV
4. Data akan tersimpan dengan unit yang dipilih

### Melihat Data

- Klik **tab unit** di atas tabel untuk switch antar unit
- Setiap tab menampilkan jumlah records dalam kurung
- Search berfungsi per unit yang aktif

### Comparison

- Comparison dilakukan per unit
- Dinas bulan ini dibandingkan dengan Dinas bulan lalu
- Tidak ada cross-unit comparison

## 📝 Catatan Teknis

### Validasi Unit

Backend memvalidasi unit harus salah satu dari 8 unit yang valid. Jika tidak valid, akan return error 400.

### Upload Behavior

- Satu file Excel = satu unit
- Jika upload ulang untuk unit/bulan/tahun yang sama, data lama akan di-replace
- Tidak ada kolom "Unit" di file Excel - unit dipilih saat upload

### Tab Navigation Design

- Horizontal scrollable untuk mobile
- Active state: blue background + blue border bottom
- Hover effect: light gray background
- Badge count menampilkan jumlah records per unit

## 🎯 Testing Checklist

- [ ] Upload data untuk berbagai unit
- [ ] Switch antar tab unit
- [ ] Search data per unit
- [ ] Comparison per unit
- [ ] Delete data per unit
- [ ] Archive viewer dengan filter unit
- [ ] Admin panel menampilkan unit

## 📦 Files Modified

**Backend (10 files):**

- `backend/app/models/pegawai.py`
- `backend/app/routers/upload.py`
- `backend/app/routers/compare.py`
- `backend/app/routers/archive.py`
- `backend/app/routers/admin.py`
- `backend/app/services/month_utils.py`
- `backend/recreate_db.py` (new)

**Frontend (6 files):**

- `frontend/src/components/FileUpload.jsx`
- `frontend/src/components/DataTable.jsx`
- `frontend/src/components/DataTable.css`
- `frontend/src/components/AdminPanel.jsx`
- `frontend/src/api/api.js`
- `frontend/src/App.jsx`

## 🐛 Known Issues

Tidak ada known issues saat ini.

## 📞 Support

Jika ada pertanyaan atau issue, silakan hubungi developer.
