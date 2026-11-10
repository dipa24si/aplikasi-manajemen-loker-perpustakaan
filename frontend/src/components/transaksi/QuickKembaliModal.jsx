import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { peminjamanApi, lokerApi } from '../../api';
import { formatDate, formatRupiah, isOverdue, hitungDenda } from '../../utils/formatters';
import { RotateCcw, AlertTriangle, Key, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function QuickKembaliModal({ isOpen, onClose, loker, onSuccess }) {
  const [isKeyLost, setIsKeyLost] = useState(false);
  const [denda, setDenda] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Periksa apakah loker sedang dalam status kunci hilang sebelumnya
  const isAlreadyLost = Boolean(
    loker && (
      loker.loan_status === 'kunci_hilang' || 
      (loker.status === 'rusak' && loker.catatan && loker.catatan.toLowerCase().includes('kunci'))
    )
  );

  // Periksa apakah loker memiliki catatan peminjaman aktif
  const hasActiveLoan = Boolean(loker && (loker.member_id || loker.member_name || loker.tanggal_pinjam));

  // Hitung denda jika loker ada
  const overdue = loker ? isOverdue(loker.batas_kembali, loker.status) : false;
  const infoDenda = loker ? hitungDenda(loker.batas_kembali) : { hariTerlambat: 0, totalDenda: 0 };

  useEffect(() => {
    if (isOpen && loker) {
      if (isAlreadyLost) {
        setCatatan('Kondisi aman (kunci telah dikembalikan)');
        setDenda(0);
      } else if (isKeyLost) {
        setCatatan('Kunci hilang dilaporkan mahasiswa.');
      } else {
        setDenda('');
        setCatatan('');
      }
    }
  }, [isOpen, loker, isKeyLost, isAlreadyLost]);

  if (!isOpen || !loker) return null;

  const handleKeyLostToggle = (e) => {
    const checked = e.target.checked;
    setIsKeyLost(checked);
    if (checked) {
      setDenda(''); // Input manual oleh petugas
      setCatatan('Kunci hilang dilaporkan mahasiswa.');
    } else {
      setDenda('');
      setCatatan('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isAlreadyLost) {
        // Pulihkan kunci yang sebelumnya hilang: jadikan loker kosong dan kunci aman
        await peminjamanApi.pulihkanKunci({
          loker_id: loker.id,
          nomor_loker: loker.nomor,
          catatan: catatan.trim() || 'Kondisi aman (kunci telah dikembalikan)'
        });
      } else if (!hasActiveLoan) {
        // Loker tidak memiliki pinjaman aktif, reset status menjadi kosong
        await lokerApi.updateStatus(loker.id, { status: 'kosong' });
      } else {
        await peminjamanApi.kembali({
          loker_id: loker.id,
          status: isKeyLost ? 'kunci_hilang' : 'selesai',
          denda: denda !== '' ? (parseFloat(denda) || 0) : 0,
          catatan: catatan.trim() || null
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses pengembalian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAlreadyLost ? `Penerimaan Kunci Hilang - Loker ${loker.nomor}` : `Pengembalian Loker ${loker.nomor}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-hanken">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Peminjaman */}
        <div className="bg-[#faf9f6] border border-[#e3e2e0] rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#75777e]">Nomor Loker</span>
            <span className="font-mono font-bold text-[#031633] text-sm">{loker.nomor}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#75777e]">Peminjam {isAlreadyLost ? 'Terakhir' : ''}</span>
            <span className="font-bold text-[#031633]">
              {loker.member_name || loker.member_id || '(Tidak ada data aktif)'}
            </span>
          </div>
          {loker.tanggal_pinjam && (
            <div className="flex justify-between items-center">
              <span className="text-[#75777e]">Waktu Pinjam</span>
              <span className="text-[#44474e] font-medium">
                {formatDate(loker.tanggal_pinjam)}
              </span>
            </div>
          )}
          {isAlreadyLost && loker.catatan && (
            <div className="flex justify-between items-center pt-1 border-t border-[#efeeeb]">
              <span className="text-amber-800 font-semibold">Catatan Sistem</span>
              <span className="text-amber-900 font-medium italic text-right">{loker.catatan}</span>
            </div>
          )}
        </div>

        {isAlreadyLost ? (
          /* Kasus Kunci Hilang Sebelumnya yang Sekarang Dikembalikan */
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Kunci Hilang Ditemukan & Dikembalikan</span>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Anak kunci fisik telah diterima oleh petugas perpustakaan. Sistem akan otomatis memperbarui status loker menjadi <b>Available</b> dan mencatat keterangan bahwa <b>kunci sudah aman</b>.
              </p>
            </div>

            {/* Input Keterangan Pemulihan */}
            <div>
              <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
                Keterangan Kunci Loker
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Kondisi aman (kunci telah dikembalikan)"
                className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Keterangan ini otomatis tersimpan sebagai status fisik kunci loker.
              </p>
            </div>
          </div>
        ) : !hasActiveLoan ? (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs p-3.5 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Status Loker Perlu Sinkronisasi</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Loker ini ditandai terpakai tetapi tidak memiliki catatan peminjaman aktif. Klik tombol di bawah untuk langsung me-reset loker ke status <b>Available (Siap Dipinjam)</b>.
            </p>
          </div>
        ) : (
          <>
            {/* Info Denda: Hanya Jika Kunci Hilang */}
            {isKeyLost ? (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Status: Kunci Hilang Dilaporkan</span>
                </div>
                <p className="text-rose-700 text-[11px] leading-relaxed">
                  Mahasiswa melaporkan anak kunci loker hilang. Denda penggantian kunci dapat disesuaikan di bawah.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium">Kunci lengkap dikembalikan ke petugas (Bebas Denda).</span>
              </div>
            )}

            {/* Checkbox Kunci Hilang */}
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKeyLost}
                  onChange={handleKeyLostToggle}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-[#c5c6ce] cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <Key className="w-4 h-4 text-rose-500" />
                  <span>Mahasiswa Melaporkan Kunci Hilang</span>
                </div>
              </label>
            </div>

            {/* Input Denda */}
            <div>
              <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
                Total Denda yang Dikenakan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={denda}
                onChange={(e) => setDenda(e.target.value)}
                className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
                Catatan Tambahan
              </label>
              <input
                type="text"
                placeholder="Catatan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2 text-sm text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs disabled:opacity-50 cursor-pointer ${
              isAlreadyLost
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-[#031633] hover:bg-[#1a2b49]'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#ffdcc0]" />
            ) : isAlreadyLost ? (
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
            ) : (
              <RotateCcw className="w-4 h-4 text-[#ffdcc0]" />
            )}
            {loading
              ? 'Memproses...'
              : isAlreadyLost
              ? 'Konfirmasi Kunci Sudah Dikembalikan (Kunci Aman)'
              : !hasActiveLoan
              ? 'Reset Loker ke Available'
              : 'Konfirmasi Pengembalian'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
