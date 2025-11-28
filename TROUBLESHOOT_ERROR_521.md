# 🔧 Troubleshooting Error 521 - Web Server Down

## Error yang Terjadi:

- **Error Code**: 521
- **Arti**: Cloudflare tidak bisa terhubung ke origin server
- **URL**: pegawai.keudisdiksulieng.web.id
- **Waktu**: 2025-11-28 08:06:56 UTC

## 🔍 Langkah Troubleshooting:

### 1. Cek Apakah VPS Masih Hidup

```bash
# Dari komputer lokal, ping VPS
ping 145.79.8.90

# Atau coba SSH
ssh root@145.79.8.90
```

**Jika tidak bisa SSH atau ping:**

- VPS mungkin mati atau restart
- Login ke panel VPS provider (Cloudflare/DigitalOcean/dll)
- Restart VPS dari panel

---

### 2. Cek Status Docker Container (Setelah Berhasil SSH)

```bash
# Cek semua container
docker ps -a

# Cek status docker-compose
cd /opt/apps/manajemen-data-pegawai
docker-compose ps
```

**Yang harus terlihat:**

- `frontend` - Status: Up
- `backend` - Status: Up
- `postgres` - Status: Up

---

### 3. Jika Container Tidak Berjalan

```bash
# Masuk ke direktori project
cd /opt/apps/manajemen-data-pegawai

# Start semua container
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

---

### 4. Jika Container Crash/Error

```bash
# Cek logs untuk error
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Restart semua container
docker-compose restart

# Atau rebuild jika perlu
docker-compose down
docker-compose up -d --build
```

---

### 5. Cek Port dan Firewall

```bash
# Cek apakah port 80 terbuka
netstat -tulpn | grep :80

# Atau
ss -tulpn | grep :80

# Cek firewall (jika pakai ufw)
ufw status

# Pastikan port 80 dan 443 terbuka
ufw allow 80/tcp
ufw allow 443/tcp
```

---

### 6. Cek Nginx/Reverse Proxy (Jika Ada)

```bash
# Jika pakai nginx
systemctl status nginx

# Restart nginx jika perlu
systemctl restart nginx

# Cek konfigurasi nginx
nginx -t
```

---

### 7. Cek Resource VPS

```bash
# Cek disk space
df -h

# Cek memory
free -h

# Cek CPU
top

# Jika disk penuh, bersihkan:
docker system prune -a
```

---

### 8. Restart Lengkap (Nuclear Option)

```bash
# Stop semua
docker-compose down

# Bersihkan
docker system prune -f

# Start lagi
docker-compose up -d --build

# Monitor
docker-compose logs -f
```

---

## 🚨 Quick Fix Commands (Copy-Paste):

```bash
# SSH ke VPS
ssh root@145.79.8.90

# Masuk ke direktori
cd /opt/apps/manajemen-data-pegawai

# Restart semua
docker-compose down && docker-compose up -d

# Cek status
docker-compose ps

# Cek logs
docker-compose logs -f frontend
```

---

## ✅ Verifikasi Setelah Fix:

1. **Cek di browser**: http://145.79.8.90 (langsung ke IP)
2. **Cek domain**: https://pegawai.keudisdiksulieng.web.id
3. **Cek logs**: Tidak ada error merah
4. **Cek container**: Semua status "Up"

---

## 📞 Jika Masih Bermasalah:

### Cek Cloudflare Settings:

1. Login ke Cloudflare dashboard
2. Pilih domain: keudisdiksulieng.web.id
3. Cek DNS settings:
   - Pastikan A record `pegawai` mengarah ke `145.79.8.90`
   - Pastikan proxy (orange cloud) aktif
4. Cek SSL/TLS settings:
   - Mode: Full atau Full (strict)
5. Temporary: Matikan proxy (abu-abu cloud) untuk test langsung ke server

---

## 🔄 Kemungkinan Penyebab:

1. ✅ **VPS restart** - Container tidak auto-start
2. ✅ **Docker crash** - Memory/disk penuh
3. ✅ **Port tertutup** - Firewall block
4. ✅ **Nginx down** - Reverse proxy error
5. ✅ **Cloudflare issue** - DNS/SSL problem

---

## 💡 Pencegahan ke Depan:

### Auto-restart Docker Container:

Edit `docker-compose.yml`, tambahkan restart policy:

```yaml
services:
  frontend:
    restart: always
    # ... config lainnya

  backend:
    restart: always
    # ... config lainnya

  postgres:
    restart: always
    # ... config lainnya
```

Lalu apply:

```bash
docker-compose down
docker-compose up -d
```

---

**CATATAN**: Simpan file ini untuk referensi troubleshooting di masa depan!
