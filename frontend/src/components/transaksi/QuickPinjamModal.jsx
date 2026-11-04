import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import { anggotaApi, peminjamanApi } from '../../api';
import { Search, UserCheck, AlertCircle, KeyRound, Clock, ShieldAlert } from 'lucide-react';

export default function QuickPinjamModal({ 
  isOpen, 
  onClose, 
  loker, 
  availableLokers = [], 
  onSuccess 
}) {
  const [selectedLokerId, setSelectedLokerId] = useState(loker?.id || '');
  const [memberQuery, setMemberQuery] = useState('');
  const [member, setMember] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [catatan, setCatatan] = useState('');

  // Group available lokers by location
  const groupedAvailableLokers = useMemo(() => {
    const groups = {};
    availableLokers.forEach((lok) => {
      const loc = lok.lokasi || 'Area Umum';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(lok);
    });
    return groups;
  }, [availableLokers]);

  useEffect(() => {
    if (loker) {
      setSelectedLokerId(loker.id);
    } else if (availableLokers.length > 0) {
      setSelectedLokerId(availableLokers[0].id);
    }
  }, [loker, availableLokers]);

  useEffect(() => {
    if (!isOpen) {
      setMemberQuery('');
      setMember(null);
      setError('');
      setCatatan('');
    }
  }, [isOpen]);

  const handleSearchMember = async (queryToSearch) => {
    const q = queryToSearch || memberQuery;
    if (!q.trim()) return;

    setError('');
    setSearching(true);
    try {
      const res = await anggotaApi.search(q.trim());
      if (res.data && res.data.length > 0) {
        const found = res.data[0];
        if (!found.aktif) {
          setError(`Anggota ${found.member_name} tidak aktif atau masa berlaku habis.`);
          setMember(null);
        } else if (found.active_loan_id) {
          setError(`Anggota ${found.member_name} saat ini sedang meminjam loker ${found.active_loker_nomor}.`);
          setMember(null);
        } else {
          setMember(found);
        }
      } else {
        setError(`Anggota dengan kata kunci "${q}" tidak ditemukan.`);
        setMember(null);
      }
    } catch (err) {
      setError(err.message || 'Gagal mencari data anggota.');
      setMember(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member) {
      setError('Pilih atau scan kartu anggota terlebih dahulu.');
      return;
    }
    if (!selectedLokerId) {
      setError('Pilih loker yang akan dipinjam.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await peminjamanApi.pinjam({
        loker_id: selectedLokerId,
        member_id: member.member_id,
        catatan: catatan.trim() || null
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal memproses peminjaman.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Peminjaman Kunci Loker"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-hanken">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Pilih Loker */}
        <div>
          <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
            Pilih Loker
          </label>
          <select
            value={selectedLokerId}
            onChange={(e) => setSelectedLokerId(e.target.value)}
            className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] cursor-pointer"
          >
            {loker ? (
              <option value={loker.id}>
                Loker {loker.nomor} - {loker.lokasi || 'Umum'}
              </option>
            ) : (
              Object.entries(groupedAvailableLokers).map(([locName, list]) => (
                <optgroup key={locName} label={`📍 ${locName} (${list.length} Available)`}>
                  {list.map((lok) => (
                    <option key={lok.id} value={lok.id}>
                      Loker {lok.nomor}
                    </option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
        </div>

        {/* 2. Cari Anggota (NIM / Nama / Scan Barcode) */}
        <div>
          <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
            Cari / Scan Kartu Anggota (NIM / ID SLiMS)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#75777e]" />
              <input
                type="text"
                placeholder="Scan kartu anggota atau ketik NIM/Nama..."
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchMember();
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#faf9f6] border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
              />
            </div>
            <button
              type="button"
              disabled={searching}
              onClick={() => handleSearchMember()}
              className="px-4 py-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {searching ? 'Cek...' : 'Cari'}
            </button>
          </div>
        </div>

        {/* Info Anggota Terpilih */}
        {member && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-emerald-900">{member.member_name}</p>
              <p className="text-emerald-800">ID / NIM: <span className="font-mono font-medium">{member.member_id}</span> ({member.member_type_id})</p>
              {member.member_phone && <p className="text-emerald-700">No. HP: {member.member_phone}</p>}
            </div>
          </div>
        )}

        {/* 3. Info Batas Waktu Otomatis (Jam 16:00 Tutup Perpus) */}
        <div className="bg-[#ffdcc0]/40 border border-[#ffdcc0] rounded-xl p-3 flex items-start gap-2.5 text-[#2d1600] text-xs">
          <Clock className="w-4 h-4 text-[#8b500b] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[#6b3b00]">Batas Pengembalian: Hari Ini Pukul 16:00 WIB</p>
            <p className="text-[#8b500b] leading-relaxed text-[11px]">
              Perpustakaan tutup jam 4 sore. Kunci wajib dikembalikan sebelum jam 16:00 WIB. Keterlambatan dikenakan denda bertambah per hari (Rp 5.000 / hari).
            </p>
          </div>
        </div>

        {/* 4. Catatan Opsional */}
        <div>
          <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            placeholder="Misal: Titip helm, ransel kuliah..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2 text-sm text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !member}
            className="w-full flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#ffdcc0]" />
            {loading ? 'Memproses Peminjaman...' : 'Konfirmasi Pinjam Loker'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
