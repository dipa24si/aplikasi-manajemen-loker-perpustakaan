# Panduan Menjalankan Aplikasi Menggunakan Docker

Sistem Manajemen Peminjaman Loker Perpustakaan Universitas Riau telah dilengkapi dengan arsitektur **Docker Compose** lengkap yang mencakup:
1. **Database (`loker-db`):** MySQL 8.0 dengan volume persisten & auto-init data 200 loker.
2. **Backend API (`loker-backend`):** Node.js Express API.
3. **Frontend (`loker-frontend`):** React SPA yang dibundle dan di-serve menggunakan **Nginx Alpine** (termasuk reverse proxy otomatis untuk endpoint `/api/` sehingga bebas kendala CORS).

---

## 1. Prasyarat
Pastikan di komputer/server Anda telah terinstall:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) atau Docker Engine + Docker Compose (Linux).

---

## 2. Cara Menjalankan (Satu Perintah)

Buka terminal (PowerShell / Command Prompt / Bash) di direktori utama proyek, lalu jalankan:

```bash
docker compose up -d --build
```

> **Catatan:**
> - Parameter `--build` memastikan image frontend & backend dikompilasi terbaru.
> - Parameter `-d` menjalankan container di latar belakang (*detached mode*).
> - Database MySQL akan otomatis terisi dengan skema database, akun petugas default, dan 200 data loker.

---

## 3. Mengakses Aplikasi

Setelah container aktif:
- **Aplikasi Web (Frontend):** Buka browser di [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Database MySQL:** Port `3306` (Host: `localhost`, User: `root`, Password: `rootpassword`, Database: `loker_db`)

### Akun Login Default:
- **Admin:** `admin` / Password: `admin123`
- **Petugas:** `petugas` / Password: `petugas123`

---

## 4. Perintah Berguna Lainnya

### Melihat Status Container:
```bash
docker compose ps
```

### Melihat Log Real-time:
```bash
# Log seluruh container
docker compose logs -f

# Log backend saja
docker compose logs -f backend

# Log frontend (Nginx) saja
docker compose logs -f frontend

# Log database saja
docker compose logs -f mysql
```

### Menghentikan Aplikasi:
```bash
docker compose down
```

### Menghentikan & Mereset Ulang Database (Menghapus Volume Data):
```bash
docker compose down -v
```

### Membangun Ulang Setelah Perubahan Kode:
```bash
docker compose up -d --build
```

