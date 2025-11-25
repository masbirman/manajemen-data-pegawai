# Panduan Mematikan Docker dengan Aman

## ⚠️ PENTING

Jangan langsung menutup Docker Desktop tanpa menghentikan containers terlebih dahulu. Hal ini dapat menyebabkan data hilang atau corrupt.

---

## Cara Mematikan Docker (Urutan yang Benar)

### 1. Backup Database (Opsional tapi Disarankan)

```bash
docker-compose exec -T db pg_dump -U user pegawai_db > backup.sql
```

### 2. Stop Semua Containers

```bash
docker-compose down
```

Tunggu sampai muncul pesan semua containers sudah stopped.

### 3. Tutup Docker Desktop

Setelah containers stopped, baru aman untuk menutup Docker Desktop.

---

## Cara Menjalankan Kembali

### 1. Buka Docker Desktop

Tunggu sampai Docker Desktop fully started (icon hijau).

### 2. Jalankan Containers

```bash
docker-compose up -d
```

### 3. Cek Status

```bash
docker-compose ps
```

Pastikan semua services (backend, frontend, db) statusnya "Up".

---

## Restore Database dari Backup

Jika data hilang dan Anda punya file backup:

```bash
# Pastikan containers sudah running
docker-compose up -d

# Restore dari backup
docker-compose exec -T db psql -U user pegawai_db < backup.sql
```

---

## ❌ Yang TIDAK Boleh Dilakukan

| Jangan                                   | Alasan                            |
| ---------------------------------------- | --------------------------------- |
| `docker-compose down -v`                 | Flag `-v` menghapus volume (data) |
| Force quit Docker Desktop                | Data bisa corrupt                 |
| Shutdown laptop saat containers running  | Data bisa corrupt                 |
| Reset Docker Desktop ke factory defaults | Menghapus semua data              |

---

## Tips Backup Rutin

Buat backup sebelum istirahat/mematikan laptop:

```bash
# Backup dengan timestamp
docker-compose exec -T db pg_dump -U user pegawai_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

Untuk Windows PowerShell:

```powershell
docker-compose exec -T db pg_dump -U user pegawai_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

---

## Checklist Sebelum Istirahat

- [ ] Backup database (opsional)
- [ ] Jalankan `docker-compose down`
- [ ] Tunggu semua containers stopped
- [ ] Tutup Docker Desktop
- [ ] Shutdown/sleep laptop

---

## Quick Commands

```bash
# Backup + Shutdown
docker-compose exec -T db pg_dump -U user pegawai_db > backup.sql && docker-compose down

# Start
docker-compose up -d

# Cek status
docker-compose ps

# Lihat logs
docker-compose logs -f
```
