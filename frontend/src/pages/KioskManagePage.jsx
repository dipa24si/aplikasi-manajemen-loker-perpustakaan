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
  Printer,
  Minus,
  MinusCircle
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

  // Kurangi Loker (Koreksi Typo) State
  const [isReduceModalOpen, setIsReduceModalOpen] = useState(false);
  const [reducingKiosk, setReducingKiosk] = useState(null);
  const [reduceCount, setReduceCount] = useState(1);
  const [reduceLoading, setReduceLoading] = useState(false);

  // Tambah Loker Lanjutan State
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [addMoreKiosk, setAddMoreKiosk] = useState(null);
  const [addMoreCount, setAddMoreCount] = useState(10);
  const [addMoreLoading, setAddMoreLoading] = useState(false);

  // Floating Alert Toast State
  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (type, title, message) => {
    setAlertInfo({ type, title, message });
    setTimeout(() => {
      setAlertInfo((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

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
          'Lantai 2 - Ruang Digital & Tandon',
          'Lantai 3 - Sirkulasi'
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
      showAlert('error', 'Form Belum Lengkap', 'Nama anjungan, URL slug, dan lokasi wajib diisi.');
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
        showAlert('success', 'Anjungan Diperbarui!', `Perubahan anjungan "${formData.nama}" berhasil disimpan.`);
      } else {
        const res = await kioskApi.create(payload);
        const generatedCount = res.data?.generated_lokers;
        showAlert(
          'success',
          'Anjungan Berhasil Dibuat!',
          generatedCount > 0
            ? `Anjungan "${formData.nama}" dibuat dan terhubung otomatis dengan ${generatedCount} unit loker.`
            : `Anjungan "${formData.nama}" berhasil dibuat.`
        );
      }
      setIsModalOpen(false);
      fetchKiosks();
      fetchLocations();
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Menyimpan Anjungan', err.message || 'Gagal menyimpan anjungan kiosk');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateLokers = async (kiosk) => {
    openAddMoreModal(kiosk);
  };

  const openReduceModal = (kiosk) => {
    setReducingKiosk(kiosk);
    setReduceCount(1);
    setIsReduceModalOpen(true);
  };

  const handleReduceSubmit = async (e) => {
    e.preventDefault();
    if (!reducingKiosk) return;

    const countNum = parseInt(reduceCount, 10);
    if (!countNum || countNum < 1) {
      showAlert('error', 'Jumlah Tidak Valid', 'Masukkan jumlah loker yang valid minimal 1 unit.');
      return;
    }

    if (countNum > (reducingKiosk.available_lokers || 0)) {
      showAlert('error', 'Kapasitas Kurang', `Jumlah pengurangan (${countNum}) melebihi loker kosong (${reducingKiosk.available_lokers || 0}). Loker yang sedang dipinjam mahasiswa tidak dapat dihapus.`);
      return;
    }

    const kioskNama = reducingKiosk.nama;
    try {
      setReduceLoading(true);
      const res = await kioskApi.reduceLokers(reducingKiosk.id, { count: countNum });
      setIsReduceModalOpen(false);
      setReducingKiosk(null);
      await fetchKiosks();
      await fetchLocations();
      showAlert('success', 'Berhasil Dikurangi!', res.message || `Berhasil mengurangi ${countNum} unit loker dari anjungan ${kioskNama}.`);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Mengurangi Loker', err.message || 'Gagal mengurangi jumlah loker');
    } finally {
      setReduceLoading(false);
    }
  };

  const openAddMoreModal = (kiosk) => {
    setAddMoreKiosk(kiosk);
    setAddMoreCount(kiosk.total_lokers === 0 ? 50 : 10);
    setIsAddMoreModalOpen(true);
  };

  const handleAddMoreSubmit = async (e) => {
    e.preventDefault();
    if (!addMoreKiosk) return;

    const countNum = parseInt(addMoreCount, 10);
    if (!countNum || countNum < 1) {
      showAlert('error', 'Jumlah Tidak Valid', 'Masukkan jumlah loker yang valid minimal 1 unit.');
      return;
    }

    const kioskNama = addMoreKiosk.nama;
    try {
      setAddMoreLoading(true);
      const res = await kioskApi.generateLokers(addMoreKiosk.id, { jumlah_loker: countNum });
      setIsAddMoreModalOpen(false);
      setAddMoreKiosk(null);
      await fetchKiosks();
      await fetchLocations();
      showAlert('success', 'Berhasil Ditambah!', res.message || `Berhasil menambahkan ${countNum} unit loker untuk anjungan ${kioskNama}.`);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Menambah Loker', err.message || 'Gagal membuat loker');
    } finally {
      setAddMoreLoading(false);
    }
  };

  const handleDelete = async (kiosk) => {
    if (!window.confirm(`Yakin ingin menghapus anjungan "${kiosk.nama}"? Layar /${kiosk.slug} tidak akan dapat diakses lagi.`)) {
      return;
    }

    try {
      await kioskApi.delete(kiosk.id);
      fetchKiosks();
      showAlert('success', 'Anjungan Dihapus!', `Anjungan "${kiosk.nama}" berhasil dihapus.`);
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Menghapus Anjungan', err.message || 'Gagal menghapus anjungan');
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
      {/* FLOATING ALERT NOTIFICATION BANNER */}
      {alertInfo && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[92%] sm:w-full animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3.5 backdrop-blur-md transition-all ${
              alertInfo.type === 'success'
                ? 'bg-[#031633] text-white border-emerald-500/40 shadow-[#031633]/30'
                : 'bg-rose-950 text-white border-rose-500/40 shadow-rose-950/40'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                alertInfo.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {alertInfo.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  {alertInfo.title}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    alertInfo.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {alertInfo.type === 'success' ? 'Sukses' : 'Peringatan'}
                </span>
              </div>
              <p className="text-xs text-stone-200 mt-1 leading-relaxed">
                {alertInfo.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAlertInfo(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-xs"
              title="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

                    {/* Kelola Kapasitas Loker: Tambah & Kurang */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60 text-[11px]">
                      <span className="text-stone-500 font-semibold">Kapasitas:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAddMoreModal(kiosk)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs text-xs"
                          title="Tambah kapasitas loker di lokasi ini"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tambah</span>
                        </button>

                        {kiosk.total_lokers > 0 && (
                          <button
                            type="button"
                            onClick={() => openReduceModal(kiosk)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs text-xs"
                            title="Kurangi kapasitas loker di lokasi ini"
                          >
                            <Minus className="w-3.5 h-3.5 text-amber-600" />
                            <span>Kurang</span>
                          </button>
                        )}
                      </div>
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
                        onClick={() => openAddMoreModal(kiosk)}
                        className="px-3 py-1.5 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        + Buat Loker
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-stone-100 space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h3 className="font-newsreader text-lg sm:text-xl font-bold text-[#031633]">
                  {editingKiosk ? 'Edit Data Anjungan Kiosk' : 'Tambah Anjungan Kiosk Baru'}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tentukan URL path dan lokasi loker yang dialokasikan layar ini.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL Path / Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-2.5 py-2 bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl text-stone-500 text-[11px] font-mono shrink-0">
                    {window.location.origin}/
                  </span>
                  <input
                    type="text"
                    placeholder="sirkulasi"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
                    required
                    className="w-full px-3 py-2 rounded-r-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
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
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    {isCustomLocation ? '← Pilih Lokasi yang Ada' : '+ Tulis Lokasi Sendiri'}
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
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs sm:text-sm bg-white font-medium text-stone-800"
                    >
                      {selectableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900">
                      <p className="font-bold">Semua lokasi sudah memiliki anjungan.</p>
                      <p className="mt-0.5 text-amber-700 text-[11px]">
                        Klik <strong>"+ Tulis Lokasi Sendiri"</strong> untuk lokasi baru.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs bg-white font-medium"
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
                          placeholder="Contoh: Sayap Kiri / Sirkulasi"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200">
                      <span className="text-stone-500 font-medium">Hasil:</span>
                      <span className="font-bold text-[#031633] font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                        {`Lantai ${customLantai} - ${customNamaArea.trim() || '...'}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Monitor layar sentuh sebelah pintu utama"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#031633] text-xs sm:text-sm"
                />
              </div>

              {!editingKiosk && (
                <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="initLokers"
                      checked={initLokers}
                      onChange={(e) => setInitLokers(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="initLokers" className="text-xs font-bold text-[#031633] cursor-pointer">
                      Otomatis Buat Loker Terhubung ({jumlahLoker || 0} Unit)
                    </label>
                  </div>

                  {initLokers && (
                    <div className="pt-2 border-t border-blue-200/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="customJumlahLoker" className="font-semibold text-xs text-[#031633]">
                          Jumlah Loker Dibuat:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            id="customJumlahLoker"
                            min="1"
                            max="500"
                            value={jumlahLoker}
                            onChange={(e) => {
                              const val = e.target.value;
                              setJumlahLoker(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                            }}
                            placeholder="50"
                            className="w-20 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-center text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-xs text-stone-500">Unit</span>
                        </div>
                      </div>

                      {/* Tombol Cepat (Preset) */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Pilihan Cepat:</span>
                        <div className="flex items-center gap-1">
                          {[10, 20, 30, 40, 50, 100].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => setJumlahLoker(num)}
                              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer text-[10px] ${
                                Number(jumlahLoker) === num
                                  ? 'bg-[#031633] text-white shadow-2xs'
                                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {editingKiosk && (
                <div className="flex items-center gap-2 pt-1">
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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? 'Menyimpan...' : editingKiosk ? 'Simpan' : 'Tambah Anjungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kurang Loker */}
      {isReduceModalOpen && reducingKiosk && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 font-hanken">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Minus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#031633]">
                    Kurang Kapasitas Loker
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-[200px]">
                    {reducingKiosk.nama} ({reducingKiosk.lokasi})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReduceModalOpen(false);
                  setReducingKiosk(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReduceSubmit} className="space-y-3 pt-3">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Total Kapasitas:</span>
                  <span className="font-mono font-bold text-stone-800">{reducingKiosk.total_lokers} Unit</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Loker Kosong:</span>
                  <span className="font-mono font-bold text-emerald-700">{reducingKiosk.available_lokers || 0} Unit</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#031633] mb-1">
                  Jumlah Loker yang Dikurangi:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={reducingKiosk.available_lokers || 1}
                    value={reduceCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReduceCount(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                    }}
                    required
                    className="w-full bg-[#faf9f6] border border-stone-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono font-bold text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <span className="font-bold text-xs text-stone-500 shrink-0">Unit</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 5, 10, 20].map((num) => (
                    num <= (reducingKiosk.available_lokers || 0) && (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setReduceCount(num)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition-colors ${
                          Number(reduceCount) === num
                            ? 'bg-amber-800 text-white border-amber-800'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        -{num}
                      </button>
                    )
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                Menghapus <b>{reduceCount || 0} unit loker kosong</b> nomor paling akhir di lokasi {reducingKiosk.lokasi}.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsReduceModalOpen(false);
                    setReducingKiosk(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reduceLoading || !reduceCount || reduceCount < 1}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {reduceLoading ? 'Memproses...' : `Kurang ${reduceCount || 0} Loker`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Loker */}
      {isAddMoreModalOpen && addMoreKiosk && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 font-hanken">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#031633]">
                    Tambah Kapasitas Loker
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-[200px]">
                    {addMoreKiosk.nama} ({addMoreKiosk.lokasi})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddMoreModalOpen(false);
                  setAddMoreKiosk(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMoreSubmit} className="space-y-3 pt-3">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs flex justify-between items-center">
                <span className="text-stone-500">Kapasitas Saat Ini:</span>
                <span className="font-mono font-bold text-stone-800">{addMoreKiosk.total_lokers} Unit</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#031633] mb-1">
                  Jumlah Loker yang Ditambahkan:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={addMoreCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddMoreCount(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                    }}
                    required
                    className="w-full bg-[#faf9f6] border border-stone-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono font-bold text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="font-bold text-xs text-stone-500 shrink-0">Unit</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {[10, 20, 30, 50].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setAddMoreCount(num)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition-colors ${
                        Number(addMoreCount) === num
                          ? 'bg-[#031633] text-white border-[#031633]'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-900 leading-relaxed">
                Nomor loker otomatis melanjutkan nomor urut terakhir di lokasi ini.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMoreModalOpen(false);
                    setAddMoreKiosk(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addMoreLoading || !addMoreCount || addMoreCount < 1}
                  className="px-4 py-1.5 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {addMoreLoading ? 'Menambahkan...' : `Tambah ${addMoreCount || 0} Loker`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
