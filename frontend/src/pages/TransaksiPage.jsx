import React, { useState, useEffect, useRef, useMemo } from 'react';
import BarcodeScannerInput from '../components/transaksi/BarcodeScannerInput';
import Modal from '../components/common/Modal';
import { peminjamanApi, lokerApi } from '../api';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah, isOverdue, hitungDenda } from '../utils/formatters';
import { 
  ScanLine, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  Printer, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Search
} from 'lucide-react';

export default function TransaksiPage() {
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal Cetak Label QR Kunci
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [allLokers, setAllLokers] = useState([]);
  const [printLocationFilter, setPrintLocationFilter] = useState('semua');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [selectedLokerIds, setSelectedLokerIds] = useState(new Set());

  const inputRef = useRef(null);

  const fetchLokers = async () => {
    try {
      const res = await lokerApi.getAll();
      if (res.data) setAllLokers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLokers();
  }, []);

  const uniqueLocations = useMemo(() => {
    const locs = allLokers.map((l) => l.lokasi).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [allLokers]);

  // Loker yang tampil di daftar pemilihan modal (filter zona & pencarian nomor)
  const modalFilteredLokers = useMemo(() => {
    return allLokers.filter((l) => {
      if (printLocationFilter !== 'semua' && l.lokasi !== printLocationFilter) {
        return false;
      }
      if (labelSearchQuery.trim()) {
        const q = labelSearchQuery.toLowerCase().trim();
        const match =
          l.nomor.toLowerCase().includes(q) ||
          (l.lokasi && l.lokasi.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allLokers, printLocationFilter, labelSearchQuery]);

  // Loker yang DIPILIH untuk dicetak
  const lockersToPrint = useMemo(() => {
    return allLokers.filter((l) => selectedLokerIds.has(l.id));
  }, [allLokers, selectedLokerIds]);

  const handleToggleLokerSelect = (id) => {
    setSelectedLokerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedLokerIds((prev) => {
      const next = new Set(prev);
      modalFilteredLokers.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedLokerIds(new Set());
  };

  const handlePrintSelected = () => {
    if (selectedLokerIds.size === 0) {
      alert('Pilih minimal 1 stiker loker yang ingin dicetak.');
      return;
    }
    window.print();
  };

  // Saat Petugas Scan QR Code yang Ada di Kunci Loker
  const handleScanKeyQR = async (scannedText) => {
    if (!scannedText) return;

    setErrorMessage('');
    setSuccessInfo(null);
    setLoading(true);

    try {
      const res = await peminjamanApi.kembali({
        qr_code: scannedText.trim(),
        status: 'selesai'
      });

      if (res.data) {
        setSuccessInfo(res.data);
        setBarcodeQuery('');
        fetchLokers();
      }
    } catch (err) {
      setErrorMessage(err.message || `Gagal memproses QR kunci "${scannedText}".`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-hanken">
      {/* Header Sirkulasi Petugas */}
      <div className="bg-gradient-to-r from-[#031633] via-[#1a2b49] to-[#031633] text-white rounded-3xl p-7 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#ffdcc0] text-xs font-bold mb-2 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Meja Sirkulasi Pengembalian Kunci</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold">Scan QR Gantungan Kunci Loker</h2>
            <p className="text-xs text-[#d7e2ff] mt-1 max-w-lg">
              Bebas batas waktu pinjam. Denda hanya berlaku jika kunci hilang (laporkan ke petugas perpustakaan).
            </p>
          </div>

          <button
            onClick={() => setIsPrintLabelsOpen(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[#ffdcc0] border border-white/20 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#ffb876]" />
            <span>Cetak Stiker QR Kunci</span>
          </button>
        </div>

        {/* Input Barcode Scanner */}
        <div className="mt-6">
          <BarcodeScannerInput
            value={barcodeQuery}
            onChange={setBarcodeQuery}
            onSubmit={handleScanKeyQR}
            placeholder="Arahkan scanner ke QR Code gantungan kunci loker (misal: A-01)..."
            disabled={loading}
          />
        </div>
      </div>

      {/* NOTIFIKASI SUKSES PENGEMBALIAN */}
      {successInfo && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-emerald-950 shadow-sm animate-in fade-in zoom-in-95 duration-150 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                PENGEMBALIAN BERHASIL
              </span>
              <h3 className="text-xl font-black text-emerald-900">
                Kunci Loker {successInfo.nomor_loker} Diterima
              </h3>
            </div>
          </div>

          <div className="bg-white/80 rounded-2xl p-4 border border-emerald-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Peminjam:</span>
              <p className="font-bold text-slate-800 text-sm">{successInfo.member_name}</p>
            </div>
            <div>
              <span className="text-slate-400">Status Loker Sekarang:</span>
              <p className="font-bold text-emerald-700 text-sm flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                AVAILABLE (Siap Dipinjam)
              </p>
            </div>
            <div>
              <span className="text-slate-400">Denda Kunci Hilang:</span>
              {successInfo.denda > 0 ? (
                <p className="font-bold text-rose-600 text-sm">
                  {formatRupiah(successInfo.denda)} (Ganti Rugi Kunci Hilang)
                </p>
              ) : (
                <p className="font-semibold text-emerald-700 text-sm">Bebas Denda</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFIKASI ERROR */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium text-sm">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* DAFTAR LOKER YANG SEDANG DIGUNAKAN (MENUNGGU PENGEMBALIAN KUNCI) */}
      <div className="bg-white rounded-3xl border border-[#e3e2e0] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#efeeeb] pb-3">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#031633]">
              Loker Sedang Terpakai (Menunggu Kunci Kembali)
            </h3>
            <p className="text-xs text-[#75777e]">
              Bebas batas waktu pinjam. Denda hanya dikenakan apabila kunci loker hilang (lapor ke petugas).
            </p>
          </div>
          <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            {allLokers.filter((l) => l.status !== 'kosong').length} Kunci di Luar
          </span>
        </div>

        {allLokers.filter((l) => l.peminjaman_aktif_id || (l.status === 'terpakai' && l.member_id)).length === 0 ? (
          <div className="py-8 text-center text-[#75777e] text-xs">
            🎉 Semua kunci telah dikembalikan! Semua loker saat ini berstatus <b>Available</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {allLokers
              .filter((l) => l.peminjaman_aktif_id || (l.status === 'terpakai' && l.member_id))
              .map((loker) => {
                const late = isOverdue(loker.batas_kembali, loker.status);
                const infoDenda = hitungDenda(loker.batas_kembali);

                return (
                  <div
                    key={loker.id}
                    className={`border rounded-2xl p-4 flex items-center justify-between transition-colors ${
                      late
                        ? 'bg-rose-50/60 border-rose-300 hover:border-rose-400'
                        : 'bg-[#faf9f6] border-[#e3e2e0] hover:border-[#c5c6ce]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-[#031633]">
                          {loker.nomor}
                        </span>
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100/80 border border-rose-300 px-2 py-0.5 rounded-full">
                          Not Available
                        </span>
                      </div>
                      <p className="text-xs text-[#44474e] font-medium">
                        Peminjam: <b className="text-[#031633]">{loker.member_name || loker.member_id || 'Mahasiswa'}</b>
                      </p>
                      <p className="text-[11px] text-[#75777e] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8b500b]" />
                        {loker.lokasi}
                      </p>

                      {late && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            Telat {infoDenda.hariTerlambat} hari • Denda: {formatRupiah(infoDenda.totalDenda)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Terima Kunci Langsung */}
                    <button
                      onClick={() => handleScanKeyQR(loker.nomor)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#031633] hover:bg-[#1a2b49] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#ffdcc0]" />
                      <span>Terima Kunci</span>
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* MODAL CETAK STIKER QR KUNCI UNTUK DITEMPEL KE GANTUNGAN KUNCI FISIK */}
      <Modal
        isOpen={isPrintLabelsOpen}
        onClose={() => setIsPrintLabelsOpen(false)}
        title="Cetak Stiker QR Code Gantungan Kunci Loker"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4 font-hanken">
          <p className="text-xs text-[#75777e]">
            Pilih 1 atau beberapa loker di bawah untuk mencetak stiker gantungan kunci fisik (misal jika stiker lama tergores/rusak saat dipegang mahasiswa).
          </p>

          {/* Control Bar: Pencarian, Filter Zona, Status Pilihan & Tombol Cetak */}
          <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-[#e3e2e0] space-y-3 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Cari Nomor Loker */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#75777e]" />
                <input
                  type="text"
                  placeholder="Cari nomor loker (misal: A-01, B-12)..."
                  value={labelSearchQuery}
                  onChange={(e) => setLabelSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b]"
                />
              </div>

              {/* Filter Lokasi Zona */}
              <select
                value={printLocationFilter}
                onChange={(e) => setPrintLocationFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-[#c5c6ce] rounded-xl px-3 py-2 text-[#031633] focus:outline-hidden cursor-pointer"
              >
                <option value="semua">Semua Zona ({allLokers.length} Loker)</option>
                {uniqueLocations.map((loc) => {
                  const countInLoc = allLokers.filter((l) => l.lokasi === loc).length;
                  return (
                    <option key={loc} value={loc}>
                      {loc} ({countInLoc} Loker)
                    </option>
                  );
                })}
              </select>

              {/* Tombol Cetak Terpilih */}
              <button
                onClick={handlePrintSelected}
                disabled={selectedLokerIds.size === 0}
                className="px-4 py-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 text-[#ffdcc0]" />
                <span>
                  {selectedLokerIds.size > 0 
                    ? `Cetak ${selectedLokerIds.size} Stiker Terpilih` 
                    : 'Pilih Stiker Terlebih Dahulu'}
                </span>
              </button>
            </div>

            {/* Sub-bar: Status Pemilihan & Tombol Cepat */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#efeeeb] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#031633]">
                  Terpilih: <b className="text-emerald-700 font-bold">{selectedLokerIds.size}</b> dari {modalFilteredLokers.length} loker
                </span>
                {selectedLokerIds.size > 0 && (
                  <span className="text-[11px] text-[#75777e]">
                    (Klik loker lagi untuk membatalkan)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#c5c6ce] text-[#031633] hover:bg-[#efeeeb] transition-colors cursor-pointer"
                >
                  ✓ Pilih Semua ({modalFilteredLokers.length})
                </button>
                {selectedLokerIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#c5c6ce] text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    ✕ Kosongkan Pilihan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Selection Grid (Tampil di Layar Modal - Model Kartu ATM) */}
          <div className="print:hidden">
            {modalFilteredLokers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75777e] bg-[#faf9f6] rounded-2xl border border-[#e3e2e0]">
                Tidak ada nomor loker yang sesuai dengan pencarian atau filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[55vh] overflow-y-auto p-1.5">
                {modalFilteredLokers.map((loker) => {
                  const isSelected = selectedLokerIds.has(loker.id);
                  return (
                    <div
                      key={loker.id}
                      onClick={() => handleToggleLokerSelect(loker.id)}
                      className={`relative rounded-2xl p-3.5 transition-all cursor-pointer select-none border-2 flex flex-col justify-between min-h-[148px] ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-md ring-2 ring-emerald-600/30'
                          : 'bg-white border-[#c5c6ce] hover:border-[#031633] hover:shadow-2xs opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox Indicator di pojok kanan atas */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/90 border border-neutral-300 text-neutral-600">
                          Kartu Kunci
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border-2 border-[#c5c6ce] bg-white'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </div>

                      {/* Header Kartu: Logo UNRI & Nama Kampus */}
                      <div className="flex items-center gap-2 border-b border-neutral-200 pb-1.5 pr-20">
                        <img 
                          src="/logo.png" 
                          alt="Logo UNRI" 
                          className="w-7 h-7 object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-black text-[11px] uppercase tracking-wider text-[#031633] leading-none truncate">
                            UNIVERSITAS RIAU
                          </h4>
                          <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5 leading-none">
                            UPT PERPUSTAKAAN
                          </p>
                        </div>
                      </div>

                      {/* Body Kartu: Nomor Loker di Kiri, QR Code di Kanan */}
                      <div className="flex items-center justify-between gap-2 py-1.5">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block">
                            NOMOR LOKER
                          </span>
                          <div className="text-3xl font-black font-mono text-[#031633] tracking-tight leading-none">
                            {loker.nomor}
                          </div>
                          <div className="text-[10px] font-semibold text-neutral-700 truncate pt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#8b500b] shrink-0" />
                            <span className="truncate">{loker.lokasi || 'Perpustakaan'}</span>
                          </div>
                        </div>

                        {/* Indikator Lubang Ring Gantungan */}
                        <div 
                          className="w-4 h-4 rounded-full border border-dashed border-neutral-400 flex items-center justify-center text-[8px] text-neutral-400 shrink-0"
                          title="Posisi lubang ring gantungan kunci"
                        >
                          ○
                        </div>

                        <div className="flex flex-col items-center justify-center shrink-0 pl-1.5 border-l border-dashed border-neutral-300">
                          <div className="bg-white p-1 rounded-md border border-neutral-200">
                            <QRCodeSVG value={`LOKER:${loker.nomor}`} size={56} level="M" />
                          </div>
                          <span className="text-[8px] text-neutral-500 font-mono font-bold mt-0.5">
                            LOKER:{loker.nomor}
                          </span>
                        </div>
                      </div>

                      {/* Footer Kartu */}
                      <div className="border-t border-neutral-200 pt-1 flex justify-between items-center text-[8px] text-neutral-500">
                        <span>Bebas batas waktu pinjam</span>
                        <span>Milik Perpustakaan UNRI</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================
              AREA KHUSUS CETAK (BENTUK KARTU ATM UNRI - HANYA TERPILIH)
              ======================================================== */}
          {lockersToPrint.length > 0 && (
            <div id="qr-labels-sheet" className="hidden print:grid">
              {lockersToPrint.map((loker) => (
                <div key={loker.id} className="atm-key-card">
                  {/* Header Kartu: Logo UNRI & Nama Kampus */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-1">
                    <div className="flex items-center gap-1.5">
                      <img 
                        src="/logo.png" 
                        alt="Logo UNRI" 
                        className="w-6 h-6 object-contain shrink-0"
                      />
                      <div>
                        <h4 className="font-black text-[9.5px] uppercase tracking-wider text-black leading-tight">
                          UNIVERSITAS RIAU
                        </h4>
                        <p className="text-[7.5px] font-bold text-neutral-800 uppercase tracking-widest leading-none">
                          UPT PERPUSTAKAAN
                        </p>
                      </div>
                    </div>
                    
                    <span className="px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider border border-black bg-white">
                      KARTU KUNCI LOKER
                    </span>
                  </div>

                  {/* Body Kartu: Nomor Loker & QR Code */}
                  <div className="flex items-center justify-between gap-2 my-auto py-1">
                    {/* Kiri: Nomor Loker & Lokasi */}
                    <div className="flex-1 space-y-0.5">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-600 block">
                        NOMOR LOKER
                      </span>
                      <div className="text-3xl font-black font-mono text-black leading-none tracking-tight">
                        {loker.nomor}
                      </div>
                      <div className="text-[8.5px] font-bold text-black truncate pt-0.5">
                        📍 {loker.lokasi || 'Perpustakaan'}
                      </div>
                      <div className="text-[7px] text-neutral-800 leading-tight pt-0.5 font-medium">
                        • Bebas batas waktu pinjam<br />
                        • Denda hanya jika kunci hilang
                      </div>
                    </div>

                    {/* Indikator Lubang Ring Gantungan */}
                    <div 
                      className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-500 flex items-center justify-center text-[6px] text-neutral-500 shrink-0 mx-0.5"
                      title="Posisi lubang ring gantungan kunci"
                    >
                      ○
                    </div>

                    {/* Kanan: QR Code */}
                    <div className="flex flex-col items-center justify-center shrink-0 pl-1.5 border-l border-dashed border-black">
                      <div className="p-0.5 bg-white">
                        <QRCodeSVG value={`LOKER:${loker.nomor}`} size={62} level="M" />
                      </div>
                      <span className="text-[7.5px] font-mono font-black text-black mt-0.5">
                        LOKER:{loker.nomor}
                      </span>
                      <span className="text-[6.5px] text-neutral-700 font-sans">
                        Scan saat kembali
                      </span>
                    </div>
                  </div>

                  {/* Footer Kartu */}
                  <div className="border-t border-black pt-0.5 flex justify-between items-center text-[6.5px] text-neutral-800 font-medium">
                    <span>Milik Perpustakaan UNRI</span>
                    <span>Kampus Bina Widya Km 12.5 Pekanbaru</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
