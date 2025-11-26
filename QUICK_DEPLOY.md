# ⚡ QUICK DEPLOY GUIDE

## 🚀 Deploy ke VPS (Copy-Paste Commands)

```bash
# 1. SSH ke VPS
ssh root@145.79.8.90

# 2. Deploy
cd /opt/apps/manajemen-data-pegawai && \
git pull origin master && \
docker-compose down && \
docker-compose up -d --build

# 3. Monitor (Ctrl+C untuk keluar)
docker-compose logs -f frontend

# 4. Cek status
docker-compose ps
```

## ✅ Test Checklist

Buka browser: **http://145.79.8.90**

- [ ] Sidebar putih dengan ikon MUI (bukan emoji)
- [ ] Login berfungsi
- [ ] Dashboard tampil
- [ ] Upload data berfungsi
- [ ] Semua menu bisa diklik

## 🔙 Rollback (Jika Gagal)

```bash
ssh root@145.79.8.90
cd /opt/apps/manajemen-data-pegawai
git checkout v1.2-before-able-pro
docker-compose down
docker-compose up -d --build
```

## 📞 Troubleshooting

**Frontend tidak start?**

```bash
docker-compose logs frontend
docker-compose restart frontend
```

**Tampilan masih lama?**

- Hard refresh: Ctrl+F5
- Atau buka Incognito mode

**Error MUI?**

```bash
docker exec -it manajemen-data-pegawai-frontend-1 sh
npm install
exit
docker-compose restart frontend
```

---

**That's it!** Simple dan cepat. 🎉
