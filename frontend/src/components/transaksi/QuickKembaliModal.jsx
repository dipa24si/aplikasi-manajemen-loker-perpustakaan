import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { peminjamanApi } from '../../api';
import { formatDate, formatRupiah, isOverdue, hitungDenda } from '../../utils/formatters';
import { RotateCcw, AlertTriangle, Key, AlertCircle } from 'lucide-react';

export default function QuickKembaliModal({ isOpen, onClose, loker, onSuccess }) {
  const [isKeyLost, setIsKeyLost] = useState(false);
  const [denda, setDenda] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hitung denda jika loker ada
  const overdue = loker ? isOverdue(loker.batas_kembali, loker.status) : false;
  const infoDenda = loker ? hitungDenda(loker.batas_kembali) : { hariTerlambat: 0, totalDenda: 0 };

  useEffect(() => {
    if (isOpen && loker) {
      let initialDenda = infoDenda.totalDenda;
      if (isKeyLost) initialDenda += 25000;
      setDenda(initialDenda);
      if (overdue) {
        setCatatan(`Terlambat ${infoDenda.hariTerlambat} hari melewati jam 16:00.`);
      } else {
        setCatatan('');
      }
    }
  }, [isOpen, loker, isKeyLost]);

  if (!isOpen || !loker) return null;

  const handleKeyLostToggle = (e) => {
    const checked = e.target.checked;
    setIsKeyLost(checked);
    const baseDenda = infoDenda.totalDenda;
    if (checked) {
      setDenda(baseDenda + 25000);
      setCatatan('Kunci hilang dilaporkan.');
    } else {
      setDenda(baseDenda);
      setCatatan(overdue ? `Terlambat ${infoDenda.hariTerlambat} hari melewati jam 16:00.` : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await peminjamanApi.kembali({
        loker_id: loker.id,
        status: isKeyLost ? 'kunci_hilang' : 'selesai',
        denda: parseFloat(denda) || 0,
        catatan: catatan.trim() || null
      });

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
      title={`Pengembalian Loker ${loker.nomor}`}
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
            <span className="text-[#75777e]">Peminjam</span>
            <span className="font-bold text-[#031633]">{loker.member_name || loker.member_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#75777e]">Waktu Pinjam</span>
            <span className="text-[#44474e] font-medium">{formatDate(loker.tanggal_pinjam)}</span>
          </div>
        </div>

        {/* Warning Overdue & Denda Otomatis */}
        {overdue ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Terlambat Melewati Jam Tutup (16:00 WIB)</span>
            </div>
            <p className="text-rose-700 text-[11px] leading-relaxed">
              Mahasiswa telat <b>{infoDenda.hariTerlambat} hari</b>. Denda otomatis bertambah <b>Rp 5.000 / hari</b>.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium">Dikembalikan tepat waktu sebelum jam 16:00 (Bebas Denda).</span>
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
              <span>Laporkan Kunci Hilang (+ Rp 25.000)</span>
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

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#ffdcc0]" />
            {loading ? 'Menyimpan...' : 'Konfirmasi Pengembalian'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
