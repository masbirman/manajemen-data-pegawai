# Aplikasi Perbandingan Data Pegawai

Aplikasi web untuk membandingkan data pegawai bulanan menggunakan React, FastAPI, dan PostgreSQL.

## Teknologi

- **Backend**: FastAPI + Pandas + SQLAlchemy
- **Frontend**: React + AG Grid
- **Database**: PostgreSQL
- **Container**: Docker + Docker Compose

## Setup dan Menjalankan

### Prasyarat

- Docker Desktop terinstall
- Docker Compose terinstall

### Menjalankan Aplikasi

1. Build dan jalankan semua container:

```bash
docker-compose up --build
```

2. Akses aplikasi:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Menghentikan Aplikasi

```bash
docker-compose down
```

### Menghapus Data Database

```bash
docker-compose down -v
```

## Struktur Proyek

```
.
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── models/       # Database models
│   │   ├── database.py   # Database configuration
│   │   └── main.py       # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api/          # API client
│   │   └── App.jsx       # Main component
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Fitur

- **Download Template Excel** - Download template CSV untuk format data yang benar
- **Upload file Excel** - Upload data pegawai dalam format .xlsx atau .csv
- **Perbandingan Otomatis** - Sistem otomatis membandingkan dengan bulan sebelumnya
- **Identifikasi Pegawai Baru** - Status Masuk untuk pegawai yang baru muncul
- **Identifikasi Pegawai Keluar** - Status Keluar untuk pegawai yang tidak ada lagi
- **Deteksi Perubahan Rekening** - Status Rekening Berbeda untuk perubahan nomor rekening
- **Tampilan Tabel Interaktif** - Menggunakan AG Grid dengan sorting dan filtering
- **Riwayat Data** - Semua data tersimpan di PostgreSQL untuk tracking historis
