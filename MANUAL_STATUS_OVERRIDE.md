# Manual Status Override - Dokumentasi

## Fitur Baru: Perlindungan Status yang Diubah Manual

### Masalah yang Diselesaikan

Sebelumnya, ketika user mengubah status pegawai secara manual (misalnya dari "Keluar" menjadi "Pensiun"), perubahan tersebut akan hilang ketika comparison dijalankan ulang karena sistem akan overwrite semua status berdasarkan hasil perbandingan otomatis.

### Solusi

Sistem sekarang memiliki fitur **Manual Override** yang melindungi status yang sudah diubah manual dari overwrite otomatis.

## Cara Kerja

### 1. Mengubah Status Manual

#### A. Untuk Pegawai yang Ada di Bulan Saat Ini

- Buka menu **Perbandingan** atau **Arsip**
- Klik pada kolom **Status** pegawai yang ingin diubah
- Pilih status baru dari dropdown
- Status akan langsung tersimpan ke database **di bulan yang sama**
- Notifikasi sukses akan muncul

#### B. Untuk Pegawai yang Keluar (Departed Employees)

- Pegawai yang keluar ditandai dengan **icon kalender (📅)** dan **border orange**
- Ketika status diubah (misalnya dari "Keluar" menjadi "Pensiun"):
  - Sistem akan **membuat record baru di bulan saat ini** (bukan mengubah bulan sebelumnya)
  - Contoh: Pegawai aktif di November, keluar di Desember
    - November: Status tetap "Aktif" (tidak berubah)
    - Desember: Record baru dibuat dengan status "Pensiun"
- Notifikasi akan menunjukkan bulan dimana status tersimpan

### 2. Indikator Visual

#### Status Manual Override

- **Icon pensil (✏️)** di sebelah status
- **Border biru** di sekitar cell status
- Tooltip "Status diubah manual" saat hover

#### Departed Employee (dari bulan sebelumnya)

- **Icon kalender (📅)** di sebelah status
- **Border orange** di sekitar cell status
- Tooltip "Data dari bulan sebelumnya (akan tersimpan di bulan tersebut)" saat hover

### 3. Perlindungan dari Overwrite

- Status dengan flag `manual_override = 1` **tidak akan di-overwrite** saat comparison dijalankan ulang
- Perubahan manual akan tetap tersimpan meskipun comparison dilakukan berkali-kali
- Data tetap konsisten di Dashboard dan semua view

### 4. Melihat Perubahan di Dashboard

- Buka menu **Dashboard**
- Klik tombol **🔄 Refresh** untuk melihat data terbaru
- Status yang diubah manual akan muncul di breakdown status

## Technical Details

### Database Schema

Kolom baru ditambahkan ke tabel `pegawai`:

```sql
manual_override INTEGER DEFAULT 0 NOT NULL
```

- `0` = Status dari hasil comparison otomatis (bisa di-overwrite)
- `1` = Status diubah manual (dilindungi dari overwrite)

### API Endpoints

#### 1. Update Status untuk Pegawai yang Ada

**PUT /update/status**

Request:

```json
{
  "id": 123,
  "status": "Pensiun"
}
```

Response:

```json
{
  "status": "success",
  "message": "Status updated from Keluar to Pensiun",
  "employee": { ... }
}
```

#### 2. Update Status untuk Departed Employee

**POST /update/departed-status**

Request:

```json
{
  "nip": "123456789",
  "month": 12,
  "year": 2024,
  "unit": "Dinas",
  "status": "Pensiun"
}
```

Response:

```json
{
  "status": "success",
  "message": "Created new record with status Pensiun for departed employee",
  "employee": { ... }
}
```

Endpoint ini akan:

- Membuat record baru di bulan target jika belum ada
- Update record yang sudah ada jika sudah dibuat sebelumnya
- Mengambil data pegawai dari bulan sebelumnya sebagai template

### Backend Logic

File yang dimodifikasi:

- `backend/app/models/pegawai.py` - Tambah field `manual_override`
- `backend/app/routers/update.py` - Set flag saat update manual + endpoint untuk departed employee
- `backend/app/routers/compare.py` - Skip update jika `manual_override = 1`

### Frontend Components

File yang dimodifikasi:

- `frontend/src/components/DataTable.jsx` - Visual indicator, notifikasi, dan logic untuk departed employee
- `frontend/src/components/Dashboard.jsx` - Tombol refresh
- `frontend/src/api/api.js` - Tambah function `updateDepartedEmployeeStatus`

## Migration

Script migration sudah dijalankan untuk menambahkan kolom `manual_override`:

```bash
docker-compose exec backend python add_manual_override.py
```

Semua data existing otomatis set ke `manual_override = 0`.

## Best Practices

### Kapan Mengubah Status Manual?

- Ketika hasil comparison otomatis tidak akurat
- Ketika ada informasi tambahan yang tidak terdeteksi sistem
- Untuk koreksi data yang salah

### Kapan Tidak Mengubah Manual?

- Jika hasil comparison sudah benar
- Untuk perubahan yang akan di-handle oleh upload data baru
- Jika tidak yakin dengan perubahan yang akan dilakukan

## Troubleshooting

### Status tidak berubah setelah edit

1. Cek notifikasi - apakah muncul pesan sukses?
2. Refresh halaman (F5)
3. Cek Dashboard dengan klik tombol Refresh

### Perubahan hilang setelah comparison

- Ini tidak akan terjadi lagi dengan fitur manual override
- Jika masih terjadi, cek apakah icon ✏️ muncul setelah edit
- Jika tidak muncul, berarti flag manual_override tidak ter-set

### Dashboard tidak update

- Klik tombol **🔄 Refresh** di Dashboard
- Atau reload halaman browser (F5)

## Changelog

### Version 1.2.0 (2024-11-25)

- ✅ **FIX LOGIC**: Status override untuk departed employee sekarang tersimpan di bulan yang benar
- ✅ Tambah endpoint `/update/departed-status` untuk membuat record baru di bulan target
- ✅ Frontend otomatis deteksi departed employee dan gunakan endpoint yang sesuai
- ✅ Update dokumentasi dengan penjelasan logic yang benar

### Version 1.1.0 (2024-11-25)

- ✅ Tambah field `manual_override` ke database
- ✅ Update API endpoint untuk set flag manual override
- ✅ Update comparison logic untuk skip overwrite
- ✅ Tambah visual indicator (icon ✏️ dan border biru)
- ✅ Tambah tombol refresh di Dashboard
- ✅ Tambah notifikasi yang lebih informatif
- ✅ Tambah legend untuk manual override indicator

## Support

Jika ada pertanyaan atau masalah, silakan hubungi tim development.
