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
  AlertTriangle
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

  const printableLokers = useMemo(() => {
    if (printLocationFilter === 'semua') return allLokers;
    return allLokers.filter((l) => l.lokasi === printLocationFilter);
  }, [allLokers, printLocationFilter]);

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
              Batas pengembalian harian pukul <b>16:00 WIB</b>. Keterlambatan dikenakan denda otomatis <b>Rp 5.000 / hari</b>.
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
              <span className="text-slate-400">Denda Keterlambatan:</span>
              {successInfo.denda > 0 ? (
                <p className="font-bold text-rose-600 text-sm">
                  {formatRupiah(successInfo.denda)} ({successInfo.hari_terlambat} hari telat)
                </p>
              ) : (
                <p className="font-semibold text-emerald-700 text-sm">Bebas Denda (Tepat Waktu)</p>
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
              Kunci wajib dikembalikan sebelum jam 16:00 WIB. Denda bertambah jika lewat beberapa hari.
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
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 font-hanken">
          <p className="text-xs text-[#75777e]">
            Cetak lembar stiker QR code ini untuk ditempelkan pada gantungan kunci fisik. Petugas cukup scan QR ini dengan barcode scanner USB / webcam saat menerima kunci kembali.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden bg-[#faf9f6] p-3 rounded-xl border border-[#e3e2e0]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#44474e]">Pilih Zona / Lantai:</span>
              <select
                value={printLocationFilter}
                onChange={(e) => setPrintLocationFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-[#c5c6ce] rounded-lg px-3 py-1.5 text-[#031633] focus:outline-hidden cursor-pointer"
              >
                <option value="semua">Semua Lokasi ({allLokers.length} Kunci)</option>
                {uniqueLocations.map((loc) => {
                  const countInLoc = allLokers.filter((l) => l.lokasi === loc).length;
                  return (
                    <option key={loc} value={loc}>
                      {loc} ({countInLoc} Kunci)
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[#ffdcc0]" />
              <span>Cetak {printableLokers.length} Label Sekarang</span>
            </button>
          </div>

          {/* Grid Stiker QR Code Kunci */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5 p-4 bg-[#faf9f6] border border-[#e3e2e0] rounded-2xl max-h-[60vh] overflow-y-auto">
            {printableLokers.map((loker) => (
              <div
                key={loker.id}
                className="bg-white border-2 border-[#c5c6ce] rounded-xl p-3 text-center space-y-1.5 shadow-2xs hover:border-[#031633] transition-colors"
              >
                <div className="font-mono font-black text-base text-[#031633]">
                  {loker.nomor}
                </div>
                <div className="flex justify-center p-1 bg-white">
                  <QRCodeSVG value={`LOKER:${loker.nomor}`} size={75} level="M" />
                </div>
                <div className="text-[10px] text-[#75777e] font-mono">
                  LOKER:{loker.nomor}
                </div>
                <div className="text-[9px] text-[#44474e] truncate font-medium" title={loker.lokasi}>
                  {loker.lokasi || 'Perpus'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
