import React, { useState, useEffect, useMemo } from 'react';
import { kioskApi, lokerApi } from '../api';
import { 
  Monitor, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  MapPin, 
  Layers, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info,
  Printer
} from 'lucide-react';

export default function KioskManagePage({ setActiveTab }) {
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);
  
  // Custom Location & Floor State (Lantai 1 - 3 Perpustakaan)
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLantai, setCustomLantai] = useState('1');
  const [customNamaArea, setCustomNamaArea] = useState('');

  // Loker Generator State
  const [initLokers, setInitLokers] = useState(true);
  const [jumlahLoker, setJumlahLoker] = useState(50);
  const [generatingKioskId, setGeneratingKioskId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    slug: '',
    lokasi: 'Lantai 1 - Sayap Kiri',
    keterangan: '',
    aktif: 1
  });

  const fetchKiosks = async () => {
    try {
      setLoading(true);
      const res = await kioskApi.getAll();
      setKiosks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await lokerApi.getAll();
      if (res.data) {
        const locs = Array.from(new Set(res.data.map(l => l.lokasi).filter(Boolean)));
        setAvailableLocations(locs.length > 0 ? locs : [
          'Lantai 1 - Sayap Kiri',
          'Lantai 1 - Sayap Kanan',
          'Lantai 2 - Ruang Baca & Referensi',
          'Lantai 2 - Ruang Digital & Tandon'
        ]);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Filter lokasi: Lokasi yang SUDAH memiliki anjungan TIDAK BOLEH muncul lagi di dropdown
  const selectableLocations = useMemo(() => {
    const assigned = new Set(
      kiosks
        .filter((k) => !editingKiosk || k.id !== editingKiosk.id)
        .map((k) => (k.lokasi || '').trim().toLowerCase())
    );

    const available = availableLocations.filter((loc) => !assigned.has(loc.trim().toLowerCase()));

    // Jika sedang edit, pastikan lokasi kiosk saat ini tetap ada dalam daftar pilihan
    if (editingKiosk && editingKiosk.lokasi && !available.includes(editingKiosk.lokasi)) {
      return [editingKiosk.lokasi, ...available];
    }

    return available;
  }, [availableLocations, kiosks, editingKiosk]);

  useEffect(() => {
    fetchKiosks();
    fetchLocations();
  }, []);

  // Helper untuk mengekstrak nama area murni tanpa prefix "Lantai X - "
  const extractAreaName = (loc) => {
    if (!loc) return '';
    const match = loc.match(/Lantai\s*\d+\s*[-–—:]\s*(.*)/i);
    if (match && match[1]) return match[1].trim();
    return loc.trim();
  };

  const openAddModal = () => {
    setEditingKiosk(null);
    const assigned = new Set(kiosks.map((k) => (k.lokasi || '').trim().toLowerCase()));
    const unassigned = availableLocations.filter((loc) => !assigned.has(loc.trim().toLowerCase()));

    setInitLokers(true);
    setJumlahLoker(50);
    if (unassigned.length > 0) {
      const initLoc = unassigned[0];
      const areaName = extractAreaName(initLoc);
      const initNama = areaName ? `Peminjaman Loker ${areaName}` : 'Peminjaman Loker';
      setIsCustomLocation(false);
      setCustomLantai('1');
      setCustomNamaArea('');
      setFormData({
        nama: initNama,
        slug: handleSlugAuto(areaName || initNama),
        lokasi: initLoc,
        keterangan: '',
        aktif: 1
      });
    } else {
      // Jika semua lokasi sudah terpakai oleh anjungan lain, otomatis ke mode input sendiri
      setIsCustomLocation(true);
      setCustomLantai('3');
      setCustomNamaArea('Sirkulasi');
      setFormData({
        nama: 'Peminjaman Loker Sirkulasi',
        slug: 'sirkulasi-lantai-3',
        lokasi: 'Lantai 3 - Sirkulasi',
        keterangan: '',
        aktif: 1
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (kiosk) => {
    setEditingKiosk(kiosk);
    const loc = kiosk.lokasi || '';
    const match = loc.match(/Lantai\s*(\d+)\s*[-–—]?\s*(.*)/i);
    if (match) {
      setCustomLantai(match[1]);
      setCustomNamaArea(match[2].trim());
    } else {
      setCustomLantai('1');
      setCustomNamaArea(loc);
    }
    const isKnown = availableLocations.includes(loc);
    setIsCustomLocation(!isKnown && loc !== '');
    setFormData({
      nama: kiosk.nama || '',
      slug: kiosk.slug || '',
      lokasi: loc || availableLocations[0] || 'Lantai 1 - Sayap Kiri',
      keterangan: kiosk.keterangan || '',
      aktif: kiosk.aktif !== undefined ? kiosk.aktif : 1
    });
    setIsModalOpen(true);
  };

  const handleSlugAuto = (namaValue) => {
    if (!namaValue) return '';
    const slug = namaValue
      .toLowerCase()
      .replace(/^peminjaman\s+loker\s+/i, '')
      .replace(/^anjungan\s+/i, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalLokasi = formData.lokasi;
    if (isCustomLocation) {
      if (!customNamaArea.trim()) {
        alert('Silakan masukkan nama area / ruangan.');
        return;
      }
      finalLokasi = `Lantai ${customLantai} - ${customNamaArea.trim()}`;
    }

    // Validasi lokasi unik: tidak boleh ada 2 anjungan yang menggunakan lokasi yang sama
    const alreadyTaken = kiosks.some(
      (k) => (!editingKiosk || k.id !== editingKiosk.id) &&
             (k.lokasi || '').trim().toLowerCase() === finalLokasi.trim().toLowerCase()
    );

    if (alreadyTaken) {
      alert(`Lokasi "${finalLokasi}" sudah digunakan oleh anjungan lain. Setiap lokasi hanya boleh memiliki 1 anjungan kiosk.`);
      return;
    }

    if (!formData.nama.trim() || !formData.slug.trim() || !finalLokasi.trim()) {
      alert('Nama anjungan, URL slug, dan lokasi wajib diisi.');
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        ...formData,
        lokasi: finalLokasi,
        init_lokers: !editingKiosk && initLokers,
        jumlah_loker: parseInt(jumlahLoker, 10) || 50
      };
      if (editingKiosk) {
        await kioskApi.update(editingKiosk.id, payload);
      } else {
        const res = await kioskApi.create(payload);
        if (res.data && res.data.generated_lokers > 0) {
          alert(`Berhasil! Anjungan dibuat dan otomatis terhubung dengan ${res.data.generated_lokers} loker (${res.data.prefix_loker}-01 s/d ${res.data.prefix_loker}-${String(res.data.generated_lokers).padStart(2, '0')}). Kuncinya kini siap dicetak di menu Sirkulasi Kunci.`);
        }
      }
      setIsModalOpen(false);
      fetchKiosks();
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal menyimpan anjungan kiosk');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateLokers = async (kiosk) => {
    if (!window.confirm(`Buat otomatis 50 unit loker baru untuk anjungan "${kiosk.nama}" di lokasi "${kiosk.lokasi}"?\n\nLoker ini akan langsung terhubung ke anjungan dan siap dicetak di menu Sirkulasi Kunci.`)) {
      return;
    }

    try {
      setGeneratingKioskId(kiosk.id);
      const res = await kioskApi.generateLokers(kiosk.id, { jumlah_loker: 50 });
      await fetchKiosks();
      await fetchLocations();
      alert(res.message || `Berhasil membuat 50 loker baru untuk anjungan ${kiosk.nama}!`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal membuat loker');
    } finally {
      setGeneratingKioskId(null);
    }
  };

  const handleDelete = async (kiosk) => {
    if (!window.confirm(`Yakin ingin menghapus anjungan "${kiosk.nama}"? Layar /${kiosk.slug} tidak akan dapat diakses lagi.`)) {
      return;
    }

    try {
      await kioskApi.delete(kiosk.id);
      fetchKiosks();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal menghapus anjungan');
    }
  };

  const handleCopyUrl = (slug, id) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Monitor className="w-3.5 h-3.5" />
            <span>Manajemen Layar Anjungan Mahasiswa</span>
          </div>
          <h1 className="font-newsreader text-2xl sm:text-3xl font-bold text-[#031633] tracking-tight">
            Kelola Anjungan Kiosk Mandiri
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-2xl">
            Atur dan tambahkan anjungan layar sentuh mandiri mahasiswa per lokasi/lantai. Mahasiswa dapat langsung tap KTM dan loker akan dialokasikan khusus sesuai lokasi penempatan anjungan tersebut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={fetchKiosks}
            className="p-2.5 sm:p-3 border border-stone-200 rounded-2xl hover:bg-stone-50 text-stone-600 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffdcc0]" />
            <span>Tambah Anjungan Baru</span>
          </button>
        </div>
      </div>

      {/* Grid Daftar Kiosk */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm font-semibold text-stone-500">Memuat data anjungan kiosk...</p>
        </div>
      ) : kiosks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
          <Monitor className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-700 text-lg">Belum ada anjungan kiosk</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
            Klik tombol di bawah untuk membuat stasiun anjungan mandiri pertama Anda.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-[#031633] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1a2b49]"
          >
            + Tambah Anjungan Kiosk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kiosks.map((kiosk) => {
            const fullUrl = `${window.location.origin}/${kiosk.slug}`;
            const isCopied = copiedId === kiosk.id;
            const availablePercent = kiosk.total_lokers > 0 
              ? Math.round((kiosk.available_lokers / kiosk.total_lokers) * 100)
              : 0;

            return (
              <div
                key={kiosk.id}
                className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Aksen Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500"></div>

                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-2xs group-hover:scale-105 transition-transform">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#031633] leading-snug">
                          {kiosk.nama}
                        </h3>
                        <p className="text-xs text-stone-400">
                          ID Anjungan: #{kiosk.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        kiosk.aktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {kiosk.aktif ? '● Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Lokasi Loker yang Dibaca */}
                  <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/60 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        Lokasi Loker:
                      </span>
                      <span className="font-bold text-[#031633]">
                        {kiosk.lokasi}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                      <span className="text-stone-500 flex items-center gap-1.5 font-medium">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        Kapasitas Terkait:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-600">
                          {kiosk.available_lokers || 0} Tersedia
                        </span>
                        <span className="text-stone-300">/</span>
                        <span className="font-mono text-stone-500">
                          {kiosk.total_lokers || 0} Total
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Kapasitas */}
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full transition-all duration-500 ${
                          availablePercent > 20 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${availablePercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Keterangan */}
                  {kiosk.keterangan && (
                    <p className="text-xs text-stone-500 italic mb-4">
                      "{kiosk.keterangan}"
                    </p>
                  )}

                  {/* Banner Peringatan jika belum ada loker di lokasi anjungan ini */}
                  {kiosk.total_lokers === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-800 font-medium">
                          Belum ada loker terhubung di lokasi ini.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateLokers(kiosk)}
                        disabled={generatingKioskId === kiosk.id}
                        className="px-3 py-1.5 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {generatingKioskId === kiosk.id ? 'Membuat...' : '+ Buat 50 Loker'}
                      </button>
                    </div>
                  )}

                  {/* URL Box */}
                  <div className="bg-blue-50/60 border border-blue-200/70 rounded-xl p-3 mb-5 flex items-center justify-between gap-2">
                    <div className="truncate font-mono text-xs text-blue-900">
                      <span className="text-blue-400 select-none">URL: </span>
                      <span className="font-bold">/{kiosk.slug}</span>
                    </div>
                    <button
                      onClick={() => handleCopyUrl(kiosk.slug, kiosk.id)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 flex items-center gap-1 transition-colors shadow-2xs shrink-0"
                      title="Salin Link Lengkap"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(kiosk)}
                      className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                      title="Edit Anjungan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kiosk)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Anjungan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.__targetPrintLocation = kiosk.lokasi;
                        if (setActiveTab) {
                          setActiveTab('transaksi');
                        }
                      }}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-[#031633] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                      title="Buka Sirkulasi Kunci & Cetak Stiker/Kartu Kunci Loker Ini"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#8b500b]" />
                      <span>Cetak Kunci</span>
                    </button>

                    <a
                      href={`/${kiosk.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer"
                    >
                      <span>Buka Layar Kiosk</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#ffdcc0]" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KIOSK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-100 space-y-6">
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-newsreader text-2xl font-bold text-[#031633]">
                  {editingKiosk ? 'Edit Data Anjungan Kiosk' : 'Tambah Anjungan Kiosk Baru'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tentukan URL path dan lokasi loker yang akan dialokasikan oleh layar ini.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nama Anjungan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Peminjaman Loker Sirkulasi"
                  value={formData.nama}
                  onChange={(e) => {
                    const namaVal = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      nama: namaVal,
                      slug: !editingKiosk && (!prev.slug || prev.slug === handleSlugAuto(prev.nama))
                        ? handleSlugAuto(namaVal)
                        : prev.slug
                    }));
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  URL Path / Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl text-stone-500 text-xs font-mono">
                    {window.location.origin}/
                  </span>
                  <input
                    type="text"
                    placeholder="sirkulasi"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
                    required
                    className="w-full px-4 py-2.5 rounded-r-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  URL ini yang akan diketikkan di browser layar monitor kiosk.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Lokasi Loker yang Dibaca <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCustomLocation;
                      setIsCustomLocation(next);
                      if (next) {
                        const areaTrim = customNamaArea.trim();
                        setFormData(prev => ({
                          ...prev,
                          lokasi: `Lantai ${customLantai} - ${areaTrim}`,
                          nama: !editingKiosk && areaTrim ? `Peminjaman Loker ${areaTrim}` : (!editingKiosk ? '' : prev.nama),
                          slug: !editingKiosk && areaTrim ? handleSlugAuto(areaTrim) : (!editingKiosk ? '' : prev.slug)
                        }));
                      } else {
                        const fallbackLoc = availableLocations[0] || 'Lantai 1 - Sayap Kiri';
                        const area = extractAreaName(fallbackLoc);
                        setFormData(prev => ({
                          ...prev,
                          lokasi: fallbackLoc,
                          nama: !editingKiosk ? `Peminjaman Loker ${area}` : prev.nama,
                          slug: !editingKiosk ? handleSlugAuto(area) : prev.slug
                        }));
                      }
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    {isCustomLocation ? '← Pilih dari Lokasi yang Ada' : '+ Tulis Nama & Lantai Sendiri'}
                  </button>
                </div>

                {!isCustomLocation ? (
                  selectableLocations.length > 0 ? (
                    <select
                      value={formData.lokasi}
                      onChange={(e) => {
                        const nextLoc = e.target.value;
                        const area = extractAreaName(nextLoc);
                        const newNama = area ? `Peminjaman Loker ${area}` : 'Peminjaman Loker';
                        setFormData(prev => ({
                          ...prev,
                          lokasi: nextLoc,
                          nama: !editingKiosk && (!prev.nama || prev.nama.startsWith('Peminjaman Loker') || prev.nama.startsWith('Anjungan'))
                            ? newNama
                            : prev.nama,
                          slug: !editingKiosk && (!prev.slug || prev.slug === handleSlugAuto(prev.nama))
                            ? handleSlugAuto(area || newNama)
                            : prev.slug
                        }));
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm bg-white font-medium text-stone-800"
                    >
                      {selectableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                      <p className="font-bold">Semua lokasi yang ada sudah memiliki anjungan kiosk.</p>
                      <p className="mt-0.5 text-amber-700">
                        Klik tombol <strong>"+ Tulis Nama & Lantai Sendiri"</strong> di atas untuk menambahkan lokasi baru.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Lantai <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={customLantai}
                          onChange={(e) => {
                            const l = e.target.value;
                            setCustomLantai(l);
                            if (customNamaArea.trim()) {
                              setFormData(prev => ({ ...prev, lokasi: `Lantai ${l} - ${customNamaArea.trim()}` }));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm bg-white font-medium"
                        >
                          <option value="1">Lantai 1</option>
                          <option value="2">Lantai 2</option>
                          <option value="3">Lantai 3</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Nama Area / Ruangan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Sayap Kiri / Sirkulasi / Ruang Baca"
                          value={customNamaArea}
                          onChange={(e) => {
                            const area = e.target.value;
                            setCustomNamaArea(area);
                            const areaTrim = area.trim();
                            const newNama = areaTrim ? `Peminjaman Loker ${areaTrim}` : '';
                            setFormData(prev => ({
                              ...prev,
                              lokasi: `Lantai ${customLantai} - ${areaTrim}`,
                              nama: !editingKiosk && (!prev.nama || prev.nama.startsWith('Peminjaman Loker') || prev.nama.startsWith('Anjungan'))
                                ? newNama
                                : prev.nama,
                              slug: !editingKiosk && (!prev.slug || prev.slug.startsWith('lantai-') || prev.slug.startsWith('peminjaman-') || prev.slug === handleSlugAuto(prev.nama))
                                ? handleSlugAuto(areaTrim || newNama)
                                : prev.slug
                            }));
                          }}
                          required={isCustomLocation}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                      <span className="text-stone-500 font-medium">Hasil Format Lokasi:</span>
                      <span className="font-bold text-[#031633] font-mono bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                        {`Lantai ${customLantai} - ${customNamaArea.trim() || '...'}`}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-stone-400 mt-1.5">
                  Mahasiswa yang memesan di anjungan ini otomatis hanya akan diberi kunci loker di lantai dan area ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Monitor layar sentuh sebelah pintu utama"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-sm"
                />
              </div>

              {!editingKiosk && (
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="initLokers"
                      checked={initLokers}
                      onChange={(e) => setInitLokers(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <label htmlFor="initLokers" className="text-xs font-bold text-[#031633] block cursor-pointer">
                        Otomatis Buat Loker Terhubung ({jumlahLoker} Unit)
                      </label>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Loker baru akan otomatis dibuat di lokasi anjungan ini sehingga siap digunakan mahasiswa dan kuncinya langsung terhubung untuk dicetak di menu Sirkulasi Kunci.
                      </p>
                    </div>
                  </div>

                  {initLokers && (
                    <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-stone-600">Kapasitas Loker Awal:</span>
                      <div className="flex items-center gap-1.5">
                        {[20, 30, 50].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setJumlahLoker(num)}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                              jumlahLoker === num
                                ? 'bg-[#031633] text-white shadow-2xs'
                                : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            {num} Unit
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingKiosk && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="aktif"
                    checked={formData.aktif === 1 || formData.aktif === true}
                    onChange={(e) => setFormData({ ...formData, aktif: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300"
                  />
                  <label htmlFor="aktif" className="text-xs font-bold text-stone-700">
                    Status Anjungan Aktif
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#031633] hover:bg-[#1a2b49] text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {modalLoading ? 'Menyimpan...' : editingKiosk ? 'Simpan Perubahan' : 'Tambah Anjungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
