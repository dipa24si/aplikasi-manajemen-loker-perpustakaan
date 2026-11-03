/**
 * Format tanggal Indonesia (misal: 03 Nov 2026, 14:30)
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Format hanya jam:menit
 */
export function formatTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Format mata uang Rupiah
 */
export function formatRupiah(amount) {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

/**
 * Cek apakah peminjaman sudah melewati batas jam 16:00
 */
export function isOverdue(batasKembali, status) {
  if (status !== 'aktif' || !batasKembali) return false;
  return new Date(batasKembali).getTime() < new Date().getTime();
}

/**
 * Hitung Denda Keterlambatan Otomatis (Rp 5.000 / hari jika lewat jam 16:00)
 */
export function hitungDenda(batasKembali, tarifPerHari = 5000) {
  if (!batasKembali) return { hariTerlambat: 0, totalDenda: 0 };
  const batas = new Date(batasKembali);
  const now = new Date();

  if (now <= batas) {
    return { hariTerlambat: 0, totalDenda: 0 };
  }

  const selisihMs = now.getTime() - batas.getTime();
  const satuHariMs = 24 * 60 * 60 * 1000;
  const hariTerlambat = Math.max(1, Math.ceil(selisihMs / satuHariMs));

  return {
    hariTerlambat,
    totalDenda: hariTerlambat * tarifPerHari
  };
}
