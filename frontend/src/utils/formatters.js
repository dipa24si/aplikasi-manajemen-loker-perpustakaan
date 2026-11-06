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
 * Kebijakan Baru: Bebas Batas Waktu Pinjam & Denda Hanya Kunci Hilang
 */
export function isOverdue(batasKembali, status) {
  return false;
}

export function hitungDenda(batasKembali, tarifPerHari = 0) {
  return { hariTerlambat: 0, totalDenda: 0 };
}
