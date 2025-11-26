# Deploy ke VPS - Able Pro UI Update

## Langkah Deploy:

```bash
# 1. SSH ke VPS
ssh root@145.79.8.90

# 2. Masuk ke direktori project
cd /opt/apps/manajemen-data-pegawai

# 3. Pull perubahan terbaru
git pull origin master

# 4. Stop container
docker-compose down

# 5. Rebuild dan start ulang
docker-compose up -d --build

# 6. Cek logs
docker-compose logs -f frontend

# 7. Test di browser
# Buka: http://145.79.8.90
```

## Jika Ada Error:

```bash
# Cek status container
docker-compose ps

# Cek logs backend
docker-compose logs backend

# Cek logs frontend
docker-compose logs frontend

# Restart jika perlu
docker-compose restart frontend
```

## Rollback Jika Gagal:

```bash
# Kembali ke versi sebelumnya
git checkout v1.2-before-able-pro

# Rebuild
docker-compose down
docker-compose up -d --build
```
