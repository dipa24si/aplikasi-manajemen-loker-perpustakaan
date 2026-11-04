-- =====================================================================
-- DATABASE: SISTEM MANAJEMEN PEMINJAMAN LOKER PERPUSTAKAAN
-- Support: Standalone Mode & SLiMS 9 Integration Ready
-- Target: MySQL 8.x / MariaDB 10.5+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS loker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE loker_db;

-- ---------------------------------------------------------------------
-- 1. TABEL PETUGAS (Pengguna Sistem Loker)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS petugas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama          VARCHAR(100) NOT NULL,
  role          ENUM('admin','petugas') NOT NULL DEFAULT 'petugas',
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_petugas_username (username)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. TABEL LOKERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lokers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nomor       VARCHAR(20)  NOT NULL,
  lokasi      VARCHAR(100) NULL,
  ukuran      ENUM('kecil','sedang','besar') NOT NULL DEFAULT 'sedang',
  status      ENUM('kosong','terpakai','rusak') NOT NULL DEFAULT 'kosong',
  catatan     VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lokers_nomor (nomor),
  KEY idx_lokers_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. TABEL ANGGOTA (Mode Standalone / Demo)
-- Catatan: Jika database SLiMS sudah aktif, tabel ini bisa digantikan
-- oleh VIEW `v_anggota` yang mengarah ke `slims_db.member`.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anggota (
  member_id      VARCHAR(20)  NOT NULL,
  member_name    VARCHAR(100) NOT NULL,
  member_type_id VARCHAR(50)  NOT NULL DEFAULT 'Reguler',
  member_email   VARCHAR(100) NULL,
  member_phone   VARCHAR(50)  NULL,
  expire_date    DATE         NOT NULL,
  is_pending     TINYINT(1)   NOT NULL DEFAULT 0,
  aktif          TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. VIEW v_anggota
-- Default membaca dari tabel anggota lokal.
-- Jika sudah connect ke SLiMS, cukup ubah query ini menjadi:
--   SELECT ... FROM slims_db.member;
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_anggota AS
SELECT
  member_id,
  member_name,
  member_type_id,
  member_email,
  member_phone,
  expire_date,
  is_pending,
  aktif
FROM anggota;

-- ---------------------------------------------------------------------
-- 5. TABEL PEMINJAMAN
-- Menyimpan transaksi peminjaman loker.
-- Menggunakan STORED GENERATED COLUMN + UNIQUE KEY untuk mencegah
-- double booking pada loker atau peminjaman ganda oleh satu anggota.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS peminjaman (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loker_id            INT UNSIGNED NOT NULL,
  member_id           VARCHAR(20)  NOT NULL,
  tanggal_pinjam      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  batas_kembali       DATETIME     NULL,
  tanggal_kembali     DATETIME     NULL,
  status              ENUM('aktif','selesai','kunci_hilang') NOT NULL DEFAULT 'aktif',
  denda               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  catatan             VARCHAR(255) NULL,
  petugas_pinjam_id   INT UNSIGNED NULL,
  petugas_kembali_id  INT UNSIGNED NULL,

  -- Pengaman level database
  loker_aktif  INT UNSIGNED
    GENERATED ALWAYS AS (IF(status = 'aktif', loker_id, NULL)) STORED,
  member_aktif VARCHAR(20)
    GENERATED ALWAYS AS (IF(status = 'aktif', member_id, NULL)) STORED,

  PRIMARY KEY (id),
  UNIQUE KEY uq_loker_aktif  (loker_aktif),
  UNIQUE KEY uq_member_aktif (member_aktif),
  KEY idx_pinjam_member (member_id),
  KEY idx_pinjam_status (status),
  CONSTRAINT fk_pinjam_loker    FOREIGN KEY (loker_id)           REFERENCES lokers (id) ON DELETE CASCADE,
  CONSTRAINT fk_pinjam_petugas1 FOREIGN KEY (petugas_pinjam_id)  REFERENCES petugas (id) ON DELETE SET NULL,
  CONSTRAINT fk_pinjam_petugas2 FOREIGN KEY (petugas_kembali_id) REFERENCES petugas (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. SEED DATA AWAL (Akun Default, Loker Contoh, Anggota Contoh)
-- ---------------------------------------------------------------------

-- Akun Petugas:
-- admin   : password 'admin123'
-- petugas : password 'petugas123'
INSERT INTO petugas (username, password_hash, nama, role, aktif) VALUES
  ('admin', '$2b$10$xcxs8OTmhnxH04YpciWITupa2h52ZZTMqeEM3gWF03OIJfkWaHGUS', 'Administrator Perpustakaan', 'admin', 1),
  ('petugas', '$2b$10$1dmYxGpOJRXLqydgQdkFVuvKhJGKWlq1RmI2zfac9OjjdDZi5EJQi', 'Petugas Sirkulasi 1', 'petugas', 1)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- Data 200 Loker Perpustakaan (4 Zona x 50 Loker)
INSERT INTO lokers (nomor, lokasi, ukuran, status, catatan) VALUES
  ('A-01', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-02', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-03', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-04', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-05', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-06', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-07', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-08', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-09', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-10', 'Lantai 1 - Sayap Kiri', 'besar', 'kosong', 'Kondisi baik'),
  ('A-11', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-12', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-13', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-14', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-15', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-16', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-17', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-18', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-19', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-20', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-21', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-22', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-23', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-24', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-25', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-26', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-27', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-28', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-29', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-30', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-31', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-32', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-33', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-34', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-35', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-36', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-37', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-38', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-39', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-40', 'Lantai 1 - Sayap Kiri', 'sedang', 'kosong', 'Kondisi baik'),
  ('A-41', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-42', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-43', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-44', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-45', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-46', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-47', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-48', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-49', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('A-50', 'Lantai 1 - Sayap Kiri', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-01', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-02', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-03', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-04', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-05', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-06', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-07', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-08', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-09', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-10', 'Lantai 1 - Sayap Kanan', 'besar', 'kosong', 'Kondisi baik'),
  ('B-11', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-12', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-13', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-14', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-15', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-16', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-17', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-18', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-19', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-20', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-21', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-22', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-23', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-24', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-25', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-26', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-27', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-28', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-29', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-30', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-31', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-32', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-33', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-34', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-35', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-36', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-37', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-38', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-39', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-40', 'Lantai 1 - Sayap Kanan', 'sedang', 'kosong', 'Kondisi baik'),
  ('B-41', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-42', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-43', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-44', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-45', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-46', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-47', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-48', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-49', 'Lantai 1 - Sayap Kanan', 'kecil', 'kosong', 'Kondisi baik'),
  ('B-50', 'Lantai 1 - Sayap Kanan', 'kecil', 'rusak', 'Dalam perbaikan pemeliharaan'),
  ('C-01', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-02', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-03', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-04', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-05', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-06', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-07', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-08', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-09', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-10', 'Lantai 2 - Ruang Baca & Referensi', 'besar', 'kosong', 'Kondisi baik'),
  ('C-11', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-12', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-13', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-14', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-15', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-16', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-17', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-18', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-19', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-20', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-21', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-22', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-23', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-24', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-25', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-26', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-27', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-28', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-29', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-30', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-31', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-32', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-33', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-34', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-35', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-36', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-37', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-38', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-39', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-40', 'Lantai 2 - Ruang Baca & Referensi', 'sedang', 'kosong', 'Kondisi baik'),
  ('C-41', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-42', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-43', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-44', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-45', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-46', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-47', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-48', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-49', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('C-50', 'Lantai 2 - Ruang Baca & Referensi', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-01', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-02', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-03', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-04', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-05', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-06', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-07', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-08', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-09', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-10', 'Lantai 2 - Ruang Digital & Tandon', 'besar', 'kosong', 'Kondisi baik'),
  ('D-11', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-12', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-13', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-14', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-15', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-16', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-17', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-18', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-19', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-20', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-21', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-22', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-23', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-24', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-25', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-26', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-27', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-28', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-29', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-30', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-31', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-32', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-33', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-34', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-35', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-36', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-37', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-38', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-39', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-40', 'Lantai 2 - Ruang Digital & Tandon', 'sedang', 'kosong', 'Kondisi baik'),
  ('D-41', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-42', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-43', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-44', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-45', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-46', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-47', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-48', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-49', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'kosong', 'Kondisi baik'),
  ('D-50', 'Lantai 2 - Ruang Digital & Tandon', 'kecil', 'rusak', 'Dalam perbaikan pemeliharaan')
ON DUPLICATE KEY UPDATE lokasi = VALUES(lokasi), ukuran = VALUES(ukuran);

-- Data Anggota Demo (Struktur SLiMS)
INSERT INTO anggota (member_id, member_name, member_type_id, member_email, member_phone, expire_date, is_pending, aktif) VALUES
  ('M001', 'Ahmad Fauzi', 'Mahasiswa', 'ahmad.fauzi@kampus.ac.id', '081234567801', '2028-12-31', 0, 1),
  ('M002', 'Siti Nurhaliza', 'Mahasiswa', 'siti.nur@kampus.ac.id', '081234567802', '2028-12-31', 0, 1),
  ('M003', 'Budi Santoso', 'Dosen', 'budi.santoso@kampus.ac.id', '081234567803', '2030-12-31', 0, 1),
  ('M004', 'Dewi Lestari', 'Mahasiswa', 'dewi.lestari@kampus.ac.id', '081234567804', '2027-10-15', 0, 1),
  ('M005', 'Rian Hidayat', 'Umum', 'rian.h@gmail.com', '081234567805', '2027-06-30', 0, 1)
ON DUPLICATE KEY UPDATE member_name = VALUES(member_name);

-- Contoh 1 Peminjaman Aktif untuk data awal testing
-- (Loker A-02 dipinjam oleh M001)
INSERT INTO peminjaman (loker_id, member_id, tanggal_pinjam, batas_kembali, status, petugas_pinjam_id)
SELECT id, 'M001', NOW(), DATE_ADD(CURDATE(), INTERVAL 17 HOUR), 'aktif', 1
FROM lokers WHERE nomor = 'A-02'
LIMIT 1;

UPDATE lokers SET status = 'terpakai' WHERE nomor = 'A-02';

