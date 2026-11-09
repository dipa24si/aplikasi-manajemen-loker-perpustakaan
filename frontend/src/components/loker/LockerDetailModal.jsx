import React, { useState } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { formatDate, formatTime, isOverdue } from '../../utils/formatters';
import { 
  KeyRound, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ArrowRightCircle,
  RotateCcw
} from 'lucide-react';

export default function LockerDetailModal({ 
  loker, 
  isOpen, 
  onClose, 
  onOpenPinjam, 
  onOpenKembali, 
  onUpdateStatus 
}) {
  const [statusLoading, setStatusLoading] = useState(false);

  if (!isOpen || !loker) return null;

  const overdue = isOverdue(loker.batas_kembali, loker.status);

  const handleToggleStatus = async (targetStatus) => {
    try {
      setStatusLoading(true);
      await onUpdateStatus(loker.id, targetStatus);
      onClose();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Loker ${loker.nomor}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-5 font-hanken">
        {/* Top Header Card */}
        <div className="bg-[#f4f3f0] border border-[#e3e2e0] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#75777e] font-semibold uppercase tracking-wider">Nomor Loker</span>
            <h2 className="text-2xl font-black font-mono text-[#031633]">{loker.nomor}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#44474e]">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#8b500b]" />
                {loker.lokasi || 'Tidak ada lokasi khusus'}
              </span>
            </div>
          </div>
          <div>
            <Badge status={loker.status} />
          </div>
        </div>

        {/* Status Alert if Overdue */}
        {overdue && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Peminjaman Melebihi Batas Waktu 16:00 WIB!</p>
              <p className="text-rose-700 mt-0.5">
                Batas pengembalian telah lewat pada {formatDate(loker.batas_kembali)}. Harap hubungi peminjam jika perpustakaan segera tutup.
              </p>
            </div>
          </div>
        )}

        {/* Borrower Section if Occupied */}
        {loker.status === 'terpakai' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#75777e] uppercase tracking-wider">
              Data Peminjam Aktif
            </h4>
            <div className="bg-white border border-[#e3e2e0] rounded-xl p-3.5 space-y-2.5 text-xs text-[#44474e]">
              <div className="flex items-center justify-between">
                <span className="text-[#75777e]">Nama Lengkap</span>
                <span className="font-bold text-[#031633] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8b500b]" />
                  {loker.member_name || 'Anggota Perpustakaan'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#75777e]">ID / NIM</span>
                <span className="font-mono font-bold text-[#031633]">{loker.member_id}</span>
              </div>
              {loker.fakultas && (
                <div className="flex items-center justify-between">
                  <span className="text-[#75777e]">Fakultas</span>
                  <span className="font-semibold text-[#031633]">{loker.fakultas}</span>
                </div>
              )}
              {loker.prodi && (
                <div className="flex items-center justify-between">
                  <span className="text-[#75777e]">Program Studi</span>
                  <span className="font-semibold text-[#031633]">{loker.prodi}</span>
                </div>
              )}
              {loker.member_type_id && (
                <div className="flex items-center justify-between">
                  <span className="text-[#75777e]">Jenis Anggota</span>
                  <span className="font-semibold text-[#031633]">{loker.member_type_id}</span>
                </div>
              )}
              {loker.member_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-[#75777e]">No. WhatsApp/HP</span>
                  <a
                    href={`https://wa.me/${loker.member_phone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#8b500b] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    {loker.member_phone}
                  </a>
                </div>
              )}
              <div className="border-t border-[#efeeeb] pt-2 flex items-center justify-between">
                <span className="text-[#75777e]">Waktu Pinjam</span>
                <span className="font-medium text-[#1a1c1a]">{formatDate(loker.tanggal_pinjam)}</span>
              </div>
              {loker.batas_kembali && (
                <div className="flex items-center justify-between">
                  <span className="text-[#75777e]">Batas Pengembalian</span>
                  <span className={`font-bold ${overdue ? 'text-rose-700' : 'text-[#1a1c1a]'}`}>
                    {formatDate(loker.batas_kembali)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          {loker.status === 'kosong' && (
            <button
              onClick={() => {
                onClose();
                onOpenPinjam(loker);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#ffdcc0]" />
              Pinjamkan Loker Ini
            </button>
          )}

          {loker.status === 'terpakai' && (
            <button
              onClick={() => {
                onClose();
                onOpenKembali(loker);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#ffdcc0]" />
              {(!loker.member_id && !loker.tanggal_pinjam) ? 'Reset Loker ke Available' : 'Proses Pengembalian Kunci'}
            </button>
          )}

          {/* Status Switch (Kosong vs Maintenance/Rusak) */}
          {loker.status !== 'terpakai' && (
            <div className="flex gap-2">
              {loker.status === 'kosong' ? (
                <button
                  disabled={statusLoading}
                  onClick={() => handleToggleStatus('rusak')}
                  className="w-full py-2.5 px-3 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tandai Maintenance (Perbaikan)
                </button>
              ) : (
                <button
                  disabled={statusLoading}
                  onClick={() => handleToggleStatus('kosong')}
                  className="w-full py-2.5 px-3 border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tandai Available (Selesai Maintenance)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

