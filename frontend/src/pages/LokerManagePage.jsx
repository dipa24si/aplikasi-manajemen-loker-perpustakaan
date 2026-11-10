import React, { useState, useEffect, useMemo } from 'react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { lokerApi, kioskApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Wrench,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Layers,
  MapPin,
  Sparkles
} from 'lucide-react';

/**
 * Helper untuk mendeteksi nomor loker terakhir dan merekomendasikan nomor berikutnya
 * Contoh: ['A-01', 'A-02', 'A-50'] -> { last: 'A-50', next: 'A-51' }
 */
function parseLockerNomor(nomorList) {
  if (!nomorList || nomorList.length === 0) return { last: null, next: '' };

  const sorted = [...nomorList].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const last = sorted[sorted.length - 1];

  const match = last.match(/^([A-Za-z]+)([-_ ]?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const sep = match[2] || '-';
    const numStr = match[3];
    const nextNum = parseInt(numStr, 10) + 1;
    const padded = String(nextNum).padStart(numStr.length, '0');
    return { last, next: `${prefix}${sep}${padded}` };
  }

  const numMatch = last.match(/^(\d+)$/);
  if (numMatch) {
    const nextNum = parseInt(numMatch[1], 10) + 1;
    const padded = String(nextNum).padStart(numMatch[1].length, '0');
    return { last, next: padded };
  }

  return { last, next: '' };
}

export default function LokerManagePage() {
  const { isAdmin } = useAuth();
  const [lokers, setLokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [kiosks, setKiosks] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoker, setEditingLoker] = useState(null);
  const [formData, setFormData] = useState({
    nomor: '',
    lokasi: 'Lantai 1 - Sayap Kiri',
    ukuran: 'sedang',
    catatan: ''
  });
  const [modalError, setModalError] = useState('');

  const fetchLokers = async () => {
    setLoading(true);
    try {
      const [res, kioskRes] = await Promise.allSettled([
        lokerApi.getAll(),
        kioskApi.getAll()
      ]);
      if (res.status === 'fulfilled' && res.value.data) {
        setLokers(res.value.data);
      }
      if (kioskRes.status === 'fulfilled' && kioskRes.value.data) {
        setKiosks(kioskRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLokers();
  }, []);

  // Seluruh lokasi dinamis: gabungan dari loker yang ada, anjungan kiosk, serta standar lantai 1-3
  const allLocations = useMemo(() => {
    const fromLokers = lokers.map((l) => l.lokasi).filter(Boolean);
    const fromKiosks = kiosks.map((k) => k.lokasi).filter(Boolean);
    const defaultList = [
      'Lantai 1 - Sayap Kiri',
      'Lantai 1 - Sayap Kanan',
      'Lantai 2 - Ruang Baca & Referensi',
      'Lantai 2 - Ruang Digital & Tandon',
      'Lantai 3 - Sirkulasi'
    ];
    return Array.from(new Set([...fromLokers, ...fromKiosks, ...defaultList])).sort();
  }, [lokers, kiosks]);

  // Nomor loker terakhir & rekomendasi berikutnya berdasarkan lokasi yang dipilih di modal
  const locationSuggestion = useMemo(() => {
    const targetLoc = formData.lokasi || allLocations[0] || 'Lantai 1 - Sayap Kiri';
    const nomorsInLoc = lokers
      .filter((l) => l.lokasi === targetLoc)
      .map((l) => l.nomor);

    const parsed = parseLockerNomor(nomorsInLoc);

    if (!parsed.next) {
      let defaultPrefix = 'E';
      if (targetLoc.toLowerCase().includes('kiri')) defaultPrefix = 'A';
      else if (targetLoc.toLowerCase().includes('kanan')) defaultPrefix = 'B';
      else if (targetLoc.toLowerCase().includes('lantai 2')) defaultPrefix = 'C';
      else if (targetLoc.toLowerCase().includes('lantai 3')) defaultPrefix = 'E';
      return { last: null, next: `${defaultPrefix}-01` };
    }
    return parsed;
  }, [lokers, formData.lokasi, allLocations]);

  // Nomor loker terakhir secara global di seluruh sistem
  const globalSuggestion = useMemo(() => {
    return parseLockerNomor(lokers.map((l) => l.nomor));
  }, [lokers]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedLocation, selectedStatus, pageSize]);

  // Unique locations for filter
  const uniqueLocations = useMemo(() => {
    return allLocations;
  }, [allLocations]);

  // Filtered Lokers
  const filteredLokers = useMemo(() => {
    return lokers.filter((loker) => {
      // 1. Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          loker.nomor.toLowerCase().includes(q) ||
          (loker.lokasi && loker.lokasi.toLowerCase().includes(q)) ||
          (loker.catatan && loker.catatan.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Location
      if (selectedLocation !== 'semua' && loker.lokasi !== selectedLocation) {
        return false;
      }

      // 3. Status
      if (selectedStatus === 'available' && loker.status !== 'kosong') return false;
      if (selectedStatus === 'not_available' && loker.status === 'kosong') return false;
      if (selectedStatus === 'rusak' && loker.status !== 'rusak') return false;
      if (selectedStatus === 'terpakai' && loker.status !== 'terpakai') return false;

      return true;
    });
  }, [lokers, search, selectedLocation, selectedStatus]);

  // Pagination calculation
  const totalItems = filteredLokers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentLokers = filteredLokers.slice(startIndex, startIndex + pageSize);

  const handleOpenAdd = () => {
    setEditingLoker(null);
    setFormData({
      nomor: '',
      lokasi: allLocations[0] || 'Lantai 1 - Sayap Kiri',
      ukuran: 'sedang',
      catatan: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loker) => {
    setEditingLoker(loker);
    setFormData({
      nomor: loker.nomor,
      lokasi: loker.lokasi || allLocations[0] || 'Lantai 1 - Sayap Kiri',
      ukuran: loker.ukuran,
      catatan: loker.catatan || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      if (editingLoker) {
        await lokerApi.update(editingLoker.id, formData);
      } else {
        await lokerApi.create(formData);
      }
      setIsModalOpen(false);
      fetchLokers();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data loker.');
    }
  };

  const handleDelete = async (id, nomor) => {
    if (!window.confirm(`Yakin ingin menghapus loker "${nomor}"?`)) return;
    try {
      await lokerApi.delete(id);
      fetchLokers();
    } catch (err) {
      alert(err.message || 'Gagal menghapus loker.');
    }
  };

  const handleToggleStatus = async (loker) => {
    const nextStatus = loker.status === 'rusak' ? 'kosong' : 'rusak';
    try {
      await lokerApi.updateStatus(loker.id, { status: nextStatus });
      fetchLokers();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-5 font-hanken">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[#031633] tracking-tight">
            Master Data Loker
          </h2>
          <p className="text-xs text-[#75777e] mt-0.5">
            Total {lokers.length} loker terdaftar dalam sistem (Skala Kampus Universitas Riau).
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#ffdcc0]" />
            <span>Tambah Loker Baru</span>
          </button>
        )}
      </div>

      {/* Control Bar: Search & Filter Lokasi & Filter Status */}
      <div className="bg-white rounded-2xl border border-[#e3e2e0] p-3.5 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-auto flex-1 min-w-[160px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#75777e]" />
          <input
            type="text"
            placeholder="Cari nomor loker, lokasi, catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf9f6] border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Dropdown Filter Lokasi */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-semibold bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-2.5 sm:px-3 py-2 text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 cursor-pointer"
          >
            <option value="semua">📍 Semua Lokasi</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                📍 {loc}
              </option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-semibold bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-2.5 sm:px-3 py-2 text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="available">🟢 Available (Siap)</option>
            <option value="not_available">🔴 Not Available</option>
            <option value="terpakai">⏳ Terpakai (Dipinjam)</option>
            <option value="rusak">🔧 Perbaikan (Rusak)</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-xs font-semibold bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-2.5 py-2 text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 cursor-pointer shrink-0"
            title="Jumlah baris per halaman"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e3e2e0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#faf9f6] text-[#44474e] border-b border-[#e3e2e0] uppercase font-bold text-[11px] tracking-wider">
                <th className="py-3 px-4">Nomor Loker</th>
                <th className="py-3 px-4">Lokasi Penempatan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efeeeb] text-[#1a1c1a]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#75777e]">
                    Memuat daftar loker...
                  </td>
                </tr>
              ) : currentLokers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#75777e]">
                    Tidak ada loker yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                currentLokers.map((loker) => (
                  <tr key={loker.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#031633] text-sm">
                      {loker.nomor}
                    </td>
                    <td className="py-3 px-4 text-[#44474e] font-medium">
                      {loker.lokasi || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={loker.status} />
                    </td>
                    <td className="py-3 px-4 text-[#75777e]">
                      {loker.catatan || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Status (Perbaikan vs Siap) */}
                        {loker.status !== 'terpakai' && (
                          <button
                            onClick={() => handleToggleStatus(loker)}
                            title={
                              loker.status === 'rusak'
                                ? (loker.catatan && loker.catatan.toLowerCase().includes('kunci'))
                                  ? 'Kunci Sudah Dikembalikan (Kunci Aman & Loker Siap)'
                                  : 'Tandai Siap (Selesai Perbaikan)'
                                : 'Tandai Perbaikan / Rusak'
                            }
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              loker.status === 'rusak'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-[#ffdcc0]/50 text-[#6b3b00] border-[#ffdcc0] hover:bg-[#ffdcc0]'
                            }`}
                          >
                            {loker.status === 'rusak' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(loker)}
                              title="Edit Loker"
                              className="p-1.5 text-[#44474e] hover:text-[#031633] hover:bg-[#f4f3f0] rounded-lg border border-[#c5c6ce] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={loker.status === 'terpakai'}
                              onClick={() => handleDelete(loker.id, loker.nomor)}
                              title={loker.status === 'terpakai' ? 'Loker sedang dipinjam' : 'Hapus Loker'}
                              className="p-1.5 text-[#44474e] hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-[#c5c6ce] transition-colors disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-[#faf9f6] border-t border-[#e3e2e0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#75777e]">
          <div>
            Menampilkan <span className="font-bold text-[#031633]">{totalItems > 0 ? startIndex + 1 : 0}</span> sampai{' '}
            <span className="font-bold text-[#031633]">{Math.min(startIndex + pageSize, totalItems)}</span> dari{' '}
            <span className="font-bold text-[#031633]">{totalItems}</span> loker
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#c5c6ce] bg-white text-[#031633] hover:bg-[#efeeeb] transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and surrounding pages
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#031633] text-white shadow-2xs'
                          : 'bg-white border border-[#c5c6ce] text-[#44474e] hover:bg-[#efeeeb]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-1 text-[#75777e]">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#c5c6ce] bg-white text-[#031633] hover:bg-[#efeeeb] transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLoker ? `Edit Loker ${editingLoker.nomor}` : 'Tambah Loker Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* 1. Lokasi Penempatan (Dropdown 2 Area) */}
          <div>
            <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1">
              Lokasi Penempatan
            </label>
            <div className="relative">
              <select
                required
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] cursor-pointer appearance-none"
              >
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#75777e]">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-[#75777e] mt-1">
              Pilih area lantai/sayap penempatan loker di perpustakaan.
            </p>
          </div>

          {/* 2. Nomor / Kode Loker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider">
                Nomor / Kode Loker
              </label>
              {!editingLoker && locationSuggestion.next && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, nomor: locationSuggestion.next }))}
                  className="text-[11px] text-[#8b500b] hover:text-[#6b3b00] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#8b500b]" />
                  <span>Gunakan {locationSuggestion.next}</span>
                </button>
              )}
            </div>

            <input
              type="text"
              required
              placeholder={
                locationSuggestion.last
                  ? `Terakhir: ${locationSuggestion.last} (Contoh: ${locationSuggestion.next})`
                  : globalSuggestion.last
                  ? `Terakhir: ${globalSuggestion.last} (Contoh: ${globalSuggestion.next})`
                  : 'Misal: A-01, B-01'
              }
              value={formData.nomor}
              onChange={(e) => setFormData({ ...formData, nomor: e.target.value.toUpperCase() })}
              className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#031633] placeholder:text-[#8b8d96] placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
            />

            {!editingLoker && (
              <div className="mt-1.5 space-y-1 text-xs">
                {locationSuggestion.last ? (
                  <p className="text-[#5f6368] flex items-center gap-1.5 flex-wrap">
                    <span>Loker terakhir di <strong>{formData.lokasi}</strong>:</span>
                    <span className="font-mono font-bold text-[#031633] bg-[#efeeeb] px-1.5 py-0.5 rounded border border-[#e3e2e0]">
                      {locationSuggestion.last}
                    </span>
                    <span className="text-[#8b500b] font-medium">
                      (Rekomendasi berikutnya: <strong className="font-mono">{locationSuggestion.next}</strong>)
                    </span>
                  </p>
                ) : (
                  <p className="text-[#5f6368]">
                    Belum ada loker di area ini. Rekomendasi awal: <strong className="font-mono text-[#031633]">{locationSuggestion.next}</strong>
                  </p>
                )}
                {globalSuggestion.last && globalSuggestion.last !== locationSuggestion.last && (
                  <p className="text-[11px] text-[#75777e]">
                    Info sistem: Loker nomor tertinggi keseluruhan yang terdaftar adalah <strong className="font-mono text-[#44474e]">{globalSuggestion.last}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44474e] uppercase tracking-wider mb-1">
              Catatan
            </label>
            <input
              type="text"
              placeholder="Catatan kondisi kunci..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3.5 py-2 text-sm text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              {editingLoker ? 'Simpan Perubahan' : 'Tambahkan Loker'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
