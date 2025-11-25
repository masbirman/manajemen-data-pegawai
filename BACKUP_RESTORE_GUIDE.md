# 📦 Panduan Backup & Restore Database

## ⚠️ PENTING: Data Persistence

Data di PostgreSQL **SUDAH PERSISTEN** menggunakan Docker volume `project_pgdata`.
Data **TIDAK AKAN HILANG** saat Docker Desktop dimatikan/restart.

## 🔍 Penyebab Data Hilang

Data hanya akan hilang jika:

1. ❌ Menjalankan `recreate_db.py` (DROP semua tabel)
2. ❌ Menghapus Docker volume: `docker volume rm project_pgdata`
3. ❌ Menjalankan `docker-compose down -v` (flag -v menghapus volume)

## ✅ Cara Aman Restart Docker

```bash
# AMAN - Data tetap ada
docker-compose down
docker-compose up

# AMAN - Restart service
docker-compose restart

# BAHAYA - Akan hapus volume dan data!
docker-compose down -v  # ❌ JANGAN GUNAKAN INI!
```

## 💾 Cara Backup Database

### Manual Backup (Recommended)

```bash
# Backup database ke file SQL
docker-compose exec db pg_dump -U user pegawai_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau gunakan script Python
docker-compose exec backend python backup_db.py
```

### Automatic Backup (Scheduled)

Tambahkan cron job atau Windows Task Scheduler untuk backup otomatis setiap hari.

## 📥 Cara Restore Database

```bash
# Restore dari file backup
docker-compose exec -T db psql -U user pegawai_db < backup_20241125_120000.sql

# Atau restore dengan docker cp
docker cp backup.sql project-db-1:/tmp/backup.sql
docker-compose exec db psql -U user pegawai_db -f /tmp/backup.sql
```

## 🔄 Cara Migrasi Database (Saat Update Schema)

Jika ada perubahan schema (kolom baru, dll):

### Option 1: Backup → Recreate → Restore (RECOMMENDED)

```bash
# 1. Backup data dulu
docker-compose exec db pg_dump -U user pegawai_db > backup_before_migration.sql

# 2. Recreate database dengan schema baru
docker-compose exec backend python recreate_db.py

# 3. Restore data (jika compatible)
docker-compose exec -T db psql -U user pegawai_db < backup_before_migration.sql
```

### Option 2: Manual Migration (Lebih Aman)

```bash
# Tambah kolom baru tanpa drop table
docker-compose exec db psql -U user pegawai_db -c "
ALTER TABLE landing_page_settings
ADD COLUMN IF NOT EXISTS image_width INTEGER DEFAULT 100;
"
```

## 📊 Cek Status Data

```bash
# Cek jumlah data di setiap tabel
docker-compose exec db psql -U user -d pegawai_db -c "
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT
  'pegawai' as table_name, COUNT(*) as count FROM pegawai
UNION ALL
SELECT
  'landing_page_settings' as table_name, COUNT(*) as count FROM landing_page_settings;
"

# Cek volume Docker
docker volume ls | grep project_pgdata

# Cek ukuran volume
docker system df -v | grep project_pgdata
```

## 🛡️ Best Practices

1. **Selalu backup sebelum recreate database**
2. **Jangan gunakan `docker-compose down -v`** kecuali ingin hapus semua data
3. **Gunakan migration script** untuk perubahan schema, bukan recreate
4. **Setup automatic backup** untuk production
5. **Test restore process** secara berkala

## 📝 Catatan Penting

- Volume `project_pgdata` menyimpan data di:
  - Windows: `\\wsl$\docker-desktop-data\data\docker\volumes\project_pgdata`
  - Linux: `/var/lib/docker/volumes/project_pgdata`
- Data di volume **PERSISTEN** dan tidak hilang saat:
  - Docker Desktop restart
  - Container restart
  - Host computer restart
- Data **HANYA HILANG** jika:
  - Volume dihapus manual
  - Menjalankan `recreate_db.py`
  - Menjalankan `docker-compose down -v`

## 🚨 Recovery Jika Data Hilang

Jika data sudah hilang dan tidak ada backup:

1. **Cek apakah volume masih ada**: `docker volume ls`
2. **Cek apakah tabel masih ada**: `docker-compose exec db psql -U user -d pegawai_db -c "\dt"`
3. **Jika tabel kosong**: Upload ulang data dari file Excel
4. **Jika volume hilang**: Tidak bisa recovery, harus upload ulang

## 📞 Troubleshooting

**Q: Data hilang setelah restart Docker Desktop**
A: Kemungkinan besar ada yang menjalankan `recreate_db.py` atau `docker-compose down -v`. Volume seharusnya persisten.

**Q: Bagaimana cara memastikan data persisten?**
A: Cek `docker-compose.yml` ada section `volumes: - pgdata:/var/lib/postgresql/data`

**Q: Apakah perlu backup manual setiap hari?**
A: Untuk production, sangat disarankan. Untuk development, backup sebelum perubahan besar saja.
