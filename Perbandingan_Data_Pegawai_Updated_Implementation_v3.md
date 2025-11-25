
# Implementasi Aplikasi Perbandingan Data Pegawai
**Stack: React + FastAPI + PostgreSQL + Docker Desktop**

## 1. Tujuan Aplikasi

Aplikasi ini memungkinkan pengguna untuk:
- Mengupload satu file Excel yang berisi data pegawai bulan ini (misalnya Desember 2025).
- Sistem otomatis mengambil data bulan pembanding (November 2025) dan melakukan perbandingan berdasarkan NIP dan Nomor Rekening.
- Menampilkan status perubahan:
  - **Masuk**: Pegawai baru
  - **Keluar**: Pegawai yang tidak ada di bulan ini
  - **Rekening Berbeda**: Pegawai yang ada di kedua data namun nomor rekeningnya berubah

Semua data disimpan di database PostgreSQL untuk riwayat bulan-bulan mendatang.

## 2. Arsitektur Aplikasi

```
┌────────────────────────┐        ┌──────────────────────────┐
│      React (Frontend)  │ <----> │     FastAPI (Backend)    │
│ - Upload file Excel    │        │ - Proses Excel dg Pandas │
│ - Tabel hasil comparison│        │ - Bandingkan 2 dataset   │
└────────────────────────┘        └──────────────────────────┘
                                          │
                                          ▼
                                  PostgreSQL Database
                                      └───────┘
                                    Data pegawai
```

## 3. Stack Teknologi

### Backend (FastAPI)  
- **FastAPI**: Framework Python untuk API yang cepat dan asinkron.
- **Pandas**: Untuk memproses file Excel dan melakukan perbandingan data pegawai.
- **SQLAlchemy**: ORM untuk interaksi dengan PostgreSQL.

### Frontend (React + AG Grid)  
- **React**: Untuk membangun UI yang dinamis dan interaktif.
- **AG Grid**: Grid tabel interaktif untuk menampilkan hasil perbandingan data.

### Database  
- **PostgreSQL**: Database yang akan menyimpan data pegawai, termasuk histori perbandingan gaji setiap bulan.

### Dev Environment  
- **Docker Desktop**: Digunakan untuk menjaga konsistensi environment antara local development dan production.
- **docker-compose**: Untuk menjalankan frontend, backend, dan database secara bersamaan di lingkungan Docker.

## 4. Struktur Folder Proyek

### Backend (FastAPI)

```
backend/
│── app/
│   │── routers/
│   │     ├── upload.py          # Endpoint untuk upload file
│   │     ├── compare.py         # Endpoint untuk membandingkan data
│   │── services/
│   │     ├── excel_parser.py    # Parsing file Excel dengan Pandas
│   │     ├── comparator.py      # Logika perbandingan data
│   │── models/
│   │     ├── pegawai.py         # Model untuk data pegawai
│   │── database.py              # Konfigurasi database
│   │── main.py                  # Main application entry point
│── requirements.txt             # Daftar dependency Python
```

### Frontend (React)

```
frontend/
│── src/
│   │── components/
│   │     ├── FileUpload.jsx     # Komponen upload file
│   │     ├── DataTable.jsx      # Komponen tabel hasil perbandingan
│   │── api/
│   │     ├── api.js             # Fungsi untuk berkomunikasi dengan backend
│   │── App.jsx                  # Main React component
│── package.json                 # Daftar dependency frontend
```

### Docker Compose

```
docker-compose.yml              # Konfigurasi untuk menjalankan semua container
```

## 5. Alur Penggunaan Aplikasi

### 5.1. Upload File
1. **User mengupload file Excel** yang berisi data pegawai bulan ini (misal: Desember 2025).
2. Sistem akan memproses file tersebut dan menyimpannya di database PostgreSQL.
3. Sistem **otomatis mencari bulan pembanding** berdasarkan data bulan yang dipilih oleh user (misal: November 2025).

### 5.2. Perbandingan Data
1. **Backend (FastAPI)** akan membaca data dari file bulan ini dan bulan pembanding.
2. Data dibandingkan berdasarkan **NIP** dan **Nomor Rekening**:
   - **Masuk**: Pegawai baru muncul di bulan ini
   - **Keluar**: Pegawai tidak ada di bulan ini
   - **Rekening Berbeda**: Nomor rekening berubah
3. Hasil perbandingan disimpan ke dalam database dan ditampilkan di frontend.

### 5.3. Tampilan Hasil
1. **Frontend (React)** akan menampilkan hasil perbandingan dalam bentuk tabel menggunakan **AG Grid**.
2. Tabel akan menampilkan status **Masuk**, **Keluar**, atau **Rekening Berbeda**.

## 6. Docker Setup

### 6.1. Backend (FastAPI)

**Dockerfile** untuk backend FastAPI:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 6.2. Frontend (React)

**Dockerfile** untuk frontend React:
```dockerfile
FROM node:16

WORKDIR /app

COPY package.json /app/
RUN npm install

COPY . /app/

CMD ["npm", "start"]
```

### 6.3. Docker Compose

**docker-compose.yml** untuk menjalankan semuanya:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pegawai_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

## 7. Setup dan Menjalankan Aplikasi

### Langkah 1: Build Docker Containers

1. Pastikan Anda sudah menginstall **Docker Desktop** dan **Docker Compose**.
2. Di folder root proyek, jalankan perintah berikut untuk build dan menjalankan containers:

```bash
docker-compose up --build
```

### Langkah 2: Akses Aplikasi
1. **Frontend (React)** akan bisa diakses di `http://localhost:3000`
2. **Backend (FastAPI)** akan berjalan di `http://localhost:8000`

### Langkah 3: Upload Data
1. Masuk ke UI React dan upload file Excel data pegawai bulan ini.
2. Sistem akan melakukan perbandingan otomatis dengan bulan sebelumnya dan menampilkan hasil di tabel.

## 8. API Spesifikasi (FastAPI)

### 8.1. Endpoint untuk Upload File

**POST** `/upload`

- **Body**: 
  - File Excel (format `.xlsx` atau `.csv`)
- **Response**:  
  - Status `200 OK`
  - Pesan: `File successfully uploaded and processed`

### 8.2. Endpoint untuk Perbandingan

**POST** `/compare`

- **Body**:
  - Tahun: 2025
  - Bulan: 12 (Desember)
- **Response**:  
  - Data status perbandingan pegawai

## 9. Penyimpanan Data di Database (PostgreSQL)

Tabel `pegawai` untuk menyimpan data pegawai:

```sql
CREATE TABLE pegawai (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(20),
    nama VARCHAR(255),
    nik VARCHAR(20),
    npwp VARCHAR(20),
    tgl_lahir DATE,
    kode_bank VARCHAR(3),
    nama_bank VARCHAR(50),
    nomor_rekening VARCHAR(20),
    status ENUM('Aktif', 'Keluar', 'Masuk', 'Rekening Berbeda') DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 10. Pengembangan Lebih Lanjut

### 10.1. Fitur Tambahan
- **Role-based Access Control (RBAC)** untuk admin dan pengguna.
- **Pencarian dan Filter** dalam tabel.
- **Export Data** ke Excel.

### 10.2. Deployment
Aplikasi ini dapat dengan mudah di-deploy ke server atau VPS menggunakan Docker dan Docker Compose.
