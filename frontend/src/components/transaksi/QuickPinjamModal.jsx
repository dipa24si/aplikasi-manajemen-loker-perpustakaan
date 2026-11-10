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
  const [candidateList, setCandidateList] = useState([]);
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
      setCandidateList([]);
      setError('');
      setCatatan('');
    }
  }, [isOpen]);

  const selectCandidate = (cand) => {
    if (!cand.aktif) {
      setError(`Anggota ${cand.member_name} tidak aktif atau masa berlaku habis.`);
      setMember(null);
      return;
    }
    if (cand.active_loan_id) {
      setError(`Anggota ${cand.member_name} saat ini sedang meminjam loker ${cand.active_loker_nomor}.`);
      setMember(null);
      return;
    }
    setMember(cand);
    setCandidateList([]);
    setError('');
  };

  const handleSearchMember = async (queryToSearch) => {
    const q = queryToSearch || memberQuery;
    if (!q.trim()) return;

    setError('');
    setMember(null);
    setCandidateList([]);
    setSearching(true);
    try {
      const res = await anggotaApi.search(q.trim());
      if (res.data && res.data.length > 0) {
        if (res.data.length === 1) {
          selectCandidate(res.data[0]);
        } else {
          // Jika ada beberapa hasil yang cocok, tampilkan daftar pilihan kepada petugas
          setCandidateList(res.data);
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

        {/* Daftar Hasil Pencarian (Jika ditemukan lebih dari 1 mahasiswa) */}
        {candidateList.length > 0 && !member && (
          <div className="bg-[#faf9f6] border border-[#c5c6ce] rounded-xl p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
            <p className="text-[11px] font-bold text-[#75777e] px-1">
              Ditemukan {candidateList.length} mahasiswa, klik untuk memilih:
            </p>
            {candidateList.map((cand) => (
              <div
                key={cand.member_id}
                onClick={() => selectCandidate(cand)}
                className="p-2 rounded-lg bg-white border border-[#e3e2e0] hover:border-[#031633] hover:bg-stone-50 cursor-pointer transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-[#031633]">{cand.member_name}</p>
                  <p className="text-[11px] text-[#75777e] font-mono">
                    NIM: {cand.member_id} {cand.member_instansi ? `• ${cand.member_instansi}` : ''}
                  </p>
                </div>
                {cand.active_loan_id ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Meminjam Loker {cand.active_loker_nomor}
                  </span>
                ) : !cand.aktif ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Tidak Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Pilih
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Anggota Terpilih */}
        {member && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-emerald-900 truncate">{member.member_name}</p>
                <button
                  type="button"
                  onClick={() => setMember(null)}
                  className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                >
                  Ganti
                </button>
              </div>
              <p className="text-emerald-800">
                ID / NIM: <span className="font-mono font-medium">{member.member_id}</span> ({member.member_type_id || 'Mahasiswa'})
              </p>
              {member.member_instansi && member.member_instansi !== '-' && (
                <p className="text-emerald-700">{member.member_instansi} {member.inst_name ? `• ${member.inst_name}` : ''}</p>
              )}
            </div>
          </div>
        )}

        {/* 3. Info Kebijakan Bebas Batas Waktu */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-900">Kebijakan: Bebas Batas Waktu Pinjam</p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Bebas biaya peminjaman dan bebas denda harian. Denda hanya berlaku jika anak kunci loker dilaporkan hilang.
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
