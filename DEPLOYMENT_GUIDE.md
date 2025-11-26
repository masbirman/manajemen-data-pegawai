# Panduan Deployment ke VPS dengan Komodo

## Deploy via Komodo Panel

### 1. Buat Stack Baru di Komodo

1. **Login ke Komodo Panel** (http://103.150.227.79:120)
2. **Klik menu "Stacks"** di sidebar kiri
3. **Klik tombol "Create Stack"** atau tombol "+"
4. **Isi form:**
   - **Name:** `manajemen-pegawai` (atau nama lain)
   - **Git Repository:** `https://github.com/masbirman/manajemen-data-pegawai.git`
   - **Branch:** `master` (atau `dev` untuk testing)
   - **Compose File:** `docker-compose.prod.yml`

### 2. Setup Environment Variables

Di Komodo Stack settings, tambahkan environment variables:

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=ganti_password_aman_disini
POSTGRES_DB=pegawai_db
DATABASE_URL=postgresql://user:ganti_password_aman_disini@db:5432/pegawai_db
SECRET_KEY=ganti_dengan_secret_key_minimal_32_karakter_random
REACT_APP_API_URL=http://your-domain.com:8000
```

**PENTING:** Ganti semua password dan secret key!

### 3. Deploy Stack

1. **Klik tombol "Deploy"** atau "Start Stack"
2. Komodo akan:
   - Clone repository dari GitHub
   - Build image untuk backend dan frontend
   - Start semua container (db, backend, frontend)
3. **Tunggu proses selesai** (bisa 5-10 menit untuk build pertama kali)

### 4. Setup Domain & Reverse Proxy

#### Untuk Frontend (Port 3000):

1. Klik menu **"Deployments"** di Komodo
2. **Create New Deployment:**
   - **Type:** Server / Reverse Proxy
   - **Name:** `pegawai-frontend`
   - **Target:** `localhost:3000` atau `container_name:3000`
   - **Domain:** `pegawai.yourdomain.com`
   - **Enable SSL:** Yes (Let's Encrypt)

#### Untuk Backend API (Port 8000):

1. **Create New Deployment:**
   - **Type:** Server / Reverse Proxy
   - **Name:** `pegawai-backend`
   - **Target:** `localhost:8000` atau `container_name:8000`
   - **Domain:** `api-pegawai.yourdomain.com`
   - **Enable SSL:** Yes (Let's Encrypt)

### 5. Verifikasi Deployment

Cek di Komodo:

- **Stacks** → Status harus "Running" (hijau)
- **Containers** → Semua container (db, backend, frontend) harus "Running"
- **Deployments** → Domain sudah aktif dengan SSL

Akses aplikasi:

- Frontend: `https://pegawai.yourdomain.com`
- Backend API: `https://api-pegawai.yourdomain.com/docs`

## Update Aplikasi (Setelah Push ke GitHub)

### Via Komodo Panel:

1. Buka **Stacks** → Pilih stack `manajemen-pegawai`
2. Klik tombol **"Pull & Redeploy"** atau **"Update"**
3. Komodo akan:
   - Pull update terbaru dari GitHub
   - Rebuild image yang berubah
   - Restart container

### Manual via SSH (jika perlu):

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Masuk ke direktori project (cek di Komodo dimana lokasi clone-nya)
cd /path/to/komodo/stacks/manajemen-pegawai

# Pull update
git pull origin master

# Rebuild dan restart via Komodo atau manual
docker-compose -f docker-compose.prod.yml up -d --build
```

## Backup Database

### Via Komodo:

Jika Komodo punya fitur backup, gunakan itu.

### Manual via SSH:

```bash
# Backup
docker exec pegawai_db_prod pg_dump -U user pegawai_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i pegawai_db_prod psql -U user pegawai_db < backup_file.sql
```

## Monitoring

### Via Komodo Dashboard:

- Lihat status container (Running/Stopped)
- Monitor resource usage (CPU, RAM)
- Lihat logs real-time

### Manual:

```bash
# Lihat logs
docker logs pegawai_backend_prod -f
docker logs pegawai_frontend_prod -f

# Cek resource
docker stats
```

## Troubleshooting

### Container tidak start:

1. Cek logs di Komodo atau via SSH: `docker logs container_name`
2. Cek environment variables sudah benar
3. Pastikan port tidak bentrok dengan aplikasi lain

### Database connection error:

1. Cek container `db` sudah running
2. Verifikasi DATABASE_URL di environment variables
3. Cek network antar container

### Frontend tidak bisa akses backend:

1. Update REACT_APP_API_URL dengan domain backend yang benar
2. Rebuild frontend container
3. Cek CORS settings di backend

## Security Checklist

- [ ] Ganti semua password default
- [ ] Generate SECRET_KEY yang kuat (min 32 karakter random)
- [ ] Setup SSL/HTTPS via Komodo
- [ ] Batasi akses database (jangan expose port 5432 ke public)
- [ ] Setup backup otomatis
- [ ] Monitor logs secara berkala
- [ ] Update sistem dan image Docker secara berkala

## Tips Komodo

1. **Auto Deploy:** Setup webhook GitHub → Komodo untuk auto deploy saat push
2. **Health Checks:** Enable health check untuk auto restart jika container down
3. **Alerts:** Setup notifikasi jika ada container yang down
4. **Backup Schedule:** Gunakan fitur scheduled backup di Komodo (jika ada)
