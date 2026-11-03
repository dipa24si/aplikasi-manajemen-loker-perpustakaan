-- =====================================================================
-- Skema database aplikasi manajemen loker perpustakaan
-- Target: MySQL 8.x, satu server dengan database SLiMS 9
--
-- SEBELUM MENJALANKAN:
--   1. Ganti `slims_db` dengan nama database SLiMS kamu (cari semua).
--   2. Ganti 'GANTI_PASSWORD' dengan password kuat.
--   3. Jalankan sebagai user admin MySQL (mis. root).
--   4. Cek kolom tabel SLiMS: DESCRIBE slims_db.member;
-- =====================================================================

CREATE DATABASE IF NOT EXISTS loker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE loker_db;

-- ---------------------------------------------------------------------
-- 1. Petugas (login aplikasi loker, terpisah dari login SLiMS)
-- ---------------------------------------------------------------------
CREATE TABLE petugas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- simpan hash (bcrypt/argon2), JANGAN teks biasa
  nama          VARCHAR(100) NOT NULL,
  role          ENUM('admin','petugas') NOT NULL DEFAULT 'petugas',
  aktif         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_petugas_username (username)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Loker
-- ---------------------------------------------------------------------
CREATE TABLE lokers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nomor       VARCHAR(20)  NOT NULL,             -- mis. "A-01"
  lokasi      VARCHAR(100) NULL,                 -- mis. "Lantai 1, dekat pintu masuk"
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
-- 3. Peminjaman
--    member_id = member_id dari SLiMS (VARCHAR(20)). Sengaja TANPA foreign key
--    ke database SLiMS supaya kedua aplikasi tetap independen.
-- ---------------------------------------------------------------------
CREATE TABLE peminjaman (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loker_id         INT UNSIGNED NOT NULL,
  member_id        VARCHAR(20)  NOT NULL,
  tanggal_pinjam   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_kembali  DATETIME     NULL,
  status           ENUM('aktif','selesai','kunci_hilang') NOT NULL DEFAULT 'aktif',
  catatan          VARCHAR(255) NULL,
  petugas_pinjam_id   INT UNSIGNED NULL,
  petugas_kembali_id  INT UNSIGNED NULL,

  -- Pengaman di level database: satu loker hanya boleh punya SATU peminjaman aktif,
  -- dan satu anggota hanya boleh memegang SATU loker aktif.
  -- (Hapus baris uq_member_aktif + kolom member_aktif jika satu anggota boleh >1 loker.)
  loker_aktif  INT UNSIGNED
    GENERATED ALWAYS AS (IF(status = 'aktif', loker_id, NULL)) STORED,
  member_aktif VARCHAR(20)
    GENERATED ALWAYS AS (IF(status = 'aktif', member_id, NULL)) STORED,

  PRIMARY KEY (id),
  UNIQUE KEY uq_loker_aktif  (loker_aktif),
  UNIQUE KEY uq_member_aktif (member_aktif),
  KEY idx_pinjam_member (member_id),
  KEY idx_pinjam_status (status),
  CONSTRAINT fk_pinjam_loker   FOREIGN KEY (loker_id)           REFERENCES lokers (id),
  CONSTRAINT fk_pinjam_petugas1 FOREIGN KEY (petugas_pinjam_id)  REFERENCES petugas (id),
  CONSTRAINT fk_pinjam_petugas2 FOREIGN KEY (petugas_kembali_id) REFERENCES petugas (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. VIEW anggota: membaca LANGSUNG dari SLiMS (selalu sinkron, tanpa impor)
--    Kolom `aktif` = 1 jika tidak ditangguhkan dan belum kedaluwarsa.
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. User MySQL khusus aplikasi
--    View memakai SQL SECURITY DEFINER (bawaan): user aplikasi cukup punya akses
--    ke loker_db saja, TIDAK perlu akses apa pun ke database SLiMS.
--    Hanya bisa membaca data anggota lewat view, dan tidak bisa menulis ke SLiMS.
-- ---------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'loker_app'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD';

-- Hak penuh pada tabel aplikasi (tanpa DROP/ALTER, cukup untuk operasional)
GRANT SELECT, INSERT, UPDATE, DELETE ON loker_db.lokers      TO 'loker_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON loker_db.petugas     TO 'loker_app'@'localhost';
GRANT SELECT, INSERT, UPDATE         ON loker_db.peminjaman  TO 'loker_app'@'localhost';
GRANT SELECT                         ON loker_db.v_anggota   TO 'loker_app'@'localhost';

FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------
-- 6. Contoh data awal (opsional, hapus jika tidak perlu)
-- ---------------------------------------------------------------------
INSERT INTO lokers (nomor, lokasi, ukuran) VALUES
  ('A-01', 'Lantai 1', 'sedang'),
  ('A-02', 'Lantai 1', 'sedang'),
  ('A-03', 'Lantai 1', 'besar');

-- Contoh query yang akan dipakai aplikasi:
--   Daftar peminjaman aktif beserta nama anggota:
--   SELECT p.id, l.nomor, a.member_name, p.tanggal_pinjam
--   FROM peminjaman p
--   JOIN lokers l     ON l.id = p.loker_id
--   JOIN v_anggota a  ON a.member_id = p.member_id COLLATE utf8mb4_unicode_ci
--   WHERE p.status = 'aktif';
