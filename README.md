# 📚 LockerPerpus — Sistem Manajemen Peminjaman Loker Perpustakaan

Aplikasi manajemen peminjaman loker perpustakaan modern berbasis **React.js (Vite + Tailwind CSS)** dan **Node.js (Express + MySQL)** yang siap diintegrasikan langsung dengan **SLiMS 9 (Senayan Library Management System)** maupun berjalan secara mandiri (*Standalone*).

---

## 📁 Struktur Folder Proyek yang Modular

Struktur folder dipisahkan secara rapi per tanggung jawabnya agar kode tidak menumpuk dalam satu file panjang:

```text
manajemen-peminjaman-loker/
├── database/
│   └── schema.sql                  # Skema database MySQL lengkap + dummy data awal
│
├── backend/
│   ├── .env                        # Konfigurasi port, DB MySQL, & JWT secret
│   ├── server.js                   # Entry point server backend
│   └── src/
│       ├── app.js                  # Konfigurasi Express & middleware
│       ├── config/
│       │   └── db.js               # Pool koneksi MySQL2
│       ├── controllers/            # Logika bisnis terpisah per modul
│       │   ├── authController.js       # Login & verifikasi token
│       │   ├── dashboardController.js  # Ringkasan statistik & aktivitas
│       │   ├── lokerController.js      # CRUD & status loker
│       │   ├── peminjamanController.js # Transaksi pinjam & kembali
│       │   ├── historyController.js    # Riwayat filter & export
│       │   ├── anggotaController.js    # Cari/daftar anggota (NIM / Nama)
│       │   └── petugasController.js    # Kelola akun staf & admin
│       ├── middlewares/
│       │   ├── auth.js             # Verifikasi JWT & Role Admin/Petugas
│       │   └── errorHandler.js     # Penanganan error terpusat
│       ├── routes/                 # Routing API terpisah per endpoint
│       │   ├── authRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── lokerRoutes.js
│       │   ├── peminjamanRoutes.js
│       │   ├── historyRoutes.js
│       │   ├── anggotaRoutes.js
│       │   ├── petugasRoutes.js
│       │   └── index.js
│       └── utils/
│           └── response.js         # Format response JSON seragam
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.js           # Axios instance + interceptor JWT
    │   │   └── index.js            # Fungsi pemanggil API backend
    │   ├── components/
    │   │   ├── common/             # Navbar, Sidebar, Modal, Badge, StatCard
    │   │   ├── loker/              # LockerCard, LockerGrid, LockerDetailModal
    │   │   └── transaksi/          # BarcodeScannerInput, PinjamModal, KembaliModal
    │   ├── context/
    │   │   └── AuthContext.jsx     # State autentikasi global
    │   ├── pages/                  # Halaman aplikasi
    │   │   ├── LoginPage.jsx       # Login staf dengan tombol demo
    │   │   ├── DashboardPage.jsx   # Grid loker visual interaktif + statistik
    │   │   ├── TransaksiPage.jsx   # Meja sirkulasi cepat (Barcode Ready)
    │   │   ├── HistoryPage.jsx     # Riwayat lengkap + cetak & export CSV
    │   │   ├── LokerManagePage.jsx # Kelola master data loker
    │   │   └── PetugasPage.jsx     # Kelola akun staf (Khusus Admin)
    │   ├── utils/
    │   │   └── formatters.js       # Format Rupiah & tanggal Indonesia
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Persiapan Database MySQL
1. Buka **XAMPP Control Panel** dan klik **Start** pada modul **MySQL**.
2. Buka phpMyAdmin (`http://localhost/phpmyadmin`) atau gunakan terminal MySQL.
3. Import file database:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
   ```
   *(Atau buat database `loker_db` lalu import isi file `database/schema.sql` lewat phpMyAdmin)*.

### 2. Jalankan Aplikasi
Cukup jalankan perintah berikut di folder utama:
```bash
npm run dev
```
Perintah ini akan menyalakan:
* **Backend API:** `http://localhost:5000`
* **Frontend React:** `http://localhost:3000`

Buka browser Anda di `http://localhost:3000`.

---

## 🔑 Kredensial Login Bawaan

| Role | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses penuh (CRUD Loker & Manajemen Akun Petugas) |
| **Petugas** | `petugas` | `petugas123` | Akses operasional sirkulasi pinjam & kembali |

*(Pada halaman login sudah tersedia tombol **Quick Login** untuk testing instan).*

---

## 🔗 Integrasi dengan SLiMS 9

Saat database SLiMS 9 (`slims_db`) Anda sudah siap di server yang sama, Anda cukup menjalankan query berikut di MySQL:

```sql
USE loker_db;

CREATE OR REPLACE VIEW v_anggota AS
SELECT
  m.member_id,
  m.member_name,
  m.member_type_id,
  m.member_email,
  m.member_phone,
  m.expire_date,
  m.is_pending,
  CASE
    WHEN m.is_pending = 0 AND m.expire_date >= CURDATE() THEN 1
    ELSE 0
  END AS aktif
FROM slims_db.member AS m;
```
Aplikasi secara otomatis membaca data seluruh anggota SLiMS tanpa perlu mengubah kode React atau backend sama sekali.

