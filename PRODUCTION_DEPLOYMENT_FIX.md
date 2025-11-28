# Production Deployment Fix - Mixed Content & CORS Issues

## Masalah yang Diperbaiki

1. **Mixed Content Error** - HTTPS site mencoba load HTTP resources
2. **CORS Error** - Frontend production pointing ke localhost:8000
3. **502 Bad Gateway** - Frontend container crash
4. **Database Authentication** - Password mismatch antara backend dan database

## Solusi yang Diterapkan

### 1. Nginx Reverse Proxy Configuration

File: `/etc/nginx/sites-enabled/pegawai`

```nginx
server {
    listen 80;
    server_name pegawai.keudisdiksulteng.web.id;

    # API endpoint - proxy ke backend container
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Static uploads - proxy ke backend container
    location /uploads/ {
        proxy_pass http://localhost:8000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend - proxy ke frontend container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 2. Frontend Dockerfile - Production Build

File: `frontend/Dockerfile`

- Menggunakan multi-stage build (node:16 untuk build, nginx:alpine untuk serve)
- Environment variable `REACT_APP_API_URL` di-embed saat build time
- Nginx serve static files dari build output
- Listen di port 3000 untuk konsistensi dengan docker-compose

### 3. Environment Configuration

File: `.env` di server production

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=Fr3aks16121899
POSTGRES_DB=pegawai_db
DATABASE_URL=postgresql://user:Fr3aks16121899@db:5432/pegawai_db
SECRET_KEY=your-secret-key-change-this-in-production-Fr3aks16121899
REACT_APP_API_URL=https://pegawai.keudisdiksulteng.web.id/api
```

### 4. Database Avatar URL Migration

Update avatar URLs dari absolute ke relative path:

```sql
UPDATE users
SET avatar_url = REPLACE(avatar_url, 'http://145.79.8.90:8000', '')
WHERE avatar_url LIKE 'http://%';
```

### 5. Database Password Fix

Update password user di database untuk match dengan environment:

```sql
ALTER USER "user" WITH PASSWORD 'Fr3aks16121899';
```

## Deployment Steps

### 1. Update Nginx Configuration

```bash
cat > /etc/nginx/sites-enabled/pegawai << 'EOF'
[paste nginx config di atas]
EOF

nginx -t && systemctl reload nginx
```

### 2. Update .env di Server

```bash
cd /opt/apps/manajemen-data-pegawai
nano .env
# Set REACT_APP_API_URL=https://pegawai.keudisdiksulteng.web.id/api
```

### 3. Rebuild dan Deploy

```bash
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

### 4. Fix Database (jika perlu)

```bash
# Update avatar URLs
docker compose exec db psql -U user -d pegawai_db -c "UPDATE users SET avatar_url = REPLACE(avatar_url, 'http://145.79.8.90:8000', '') WHERE avatar_url LIKE 'http://%';"

# Update password (jika ada mismatch)
docker compose exec db psql -U user -d pegawai_db -c "ALTER USER \"user\" WITH PASSWORD 'Fr3aks16121899';"
```

### 5. Verify

```bash
# Test API endpoint
curl -s https://pegawai.keudisdiksulteng.web.id/api/maintenance/status

# Test uploads endpoint
curl -I https://pegawai.keudisdiksulteng.web.id/uploads/

# Check container status
docker compose ps

# Check logs
docker compose logs backend --tail=20
docker compose logs frontend --tail=20
```

## Arsitektur Production

```
Cloudflare (HTTPS)
    ↓
Nginx (Port 80) - Server Host
    ├─ /api/*      → http://localhost:8000 (Backend Container)
    ├─ /uploads/*  → http://localhost:8000/uploads (Backend Container)
    └─ /*          → http://localhost:3000 (Frontend Container)
```

## Troubleshooting

### Mixed Content Warning

- Pastikan semua URL di frontend menggunakan relative path atau HTTPS
- Cek nginx config sudah route `/uploads` ke backend
- Clear browser cache dan localStorage

### 502 Bad Gateway

- Cek container status: `docker compose ps`
- Cek logs: `docker compose logs backend frontend`
- Pastikan port 3000 dan 8000 tidak dipakai proses lain

### Database Connection Error

- Cek password di `.env` match dengan database
- Restart backend: `docker compose restart backend`
- Cek database accessible: `docker compose exec db psql -U user -d pegawai_db -c "SELECT 1"`

## Notes

- Frontend build menggunakan `REACT_APP_API_URL` dari environment variable
- Backend sudah menggunakan relative path untuk avatar URLs (`/uploads/avatars/`)
- Nginx di host server handle SSL termination dari Cloudflare
- Docker containers berkomunikasi via internal network
