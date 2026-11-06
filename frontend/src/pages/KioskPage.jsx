import React, { useState, useEffect, useMemo, useRef } from 'react';
import PrintTicketModal from '../components/transaksi/PrintTicketModal';
import { peminjamanApi, lokerApi, kioskApi } from '../api';
import { 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Sparkles,
  MonitorOff,
  RefreshCw,
  Home,
  Loader2
} from 'lucide-react';

export default function KioskPage({ standalone = true, tempatSlug = '' }) {
  const [nimInput, setNimInput] = useState('');
  const [allLokers, setAllLokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const inputRef = useRef(null);

  // Data kiosk dari database
  const [kioskData, setKioskData] = useState(null);
  const [kioskLoading, setKioskLoading] = useState(true);
  const [kioskNotFound, setKioskNotFound] = useState(false);

  // Ambil slug tempat dari prop atau langsung dari window.location.pathname
  const currentSlug = useMemo(() => {
    if (tempatSlug) return tempatSlug;
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const parts = path.split('/');
    if (parts[0] === 'kiosk') return parts[1] || '';
    return parts[0] || '';
  }, [tempatSlug]);

  // Ambil data anjungan kiosk dari database berdasarkan slug
  useEffect(() => {
    let isMounted = true;

    async function loadKiosk() {
      setKioskLoading(true);
      setKioskNotFound(false);

      try {
        if (!currentSlug || currentSlug === 'kiosk') {
          // Jika tanpa slug spesifik, ambil anjungan pertama yang aktif di database
          const resAll = await kioskApi.getAll();
          if (resAll.data && resAll.data.length > 0) {
            if (isMounted) setKioskData(resAll.data[0]);
          } else {
            if (isMounted) setKioskNotFound(true);
          }
        } else {
          // Ambil langsung anjungan dari database berdasarkan slug URL
          const res = await kioskApi.getBySlug(currentSlug);
          if (res.data) {
            if (isMounted) setKioskData(res.data);
          } else {
            if (isMounted) setKioskNotFound(true);
          }
        }
      } catch (err) {
        console.error('Error fetching kiosk by slug:', err);
        if (isMounted) setKioskNotFound(true);
      } finally {
        if (isMounted) setKioskLoading(false);
      }
    }

    loadKiosk();
    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  // Target lokasi dan judul anjungan dari data database
  const targetLocation = useMemo(() => {
    if (kioskData && kioskData.lokasi) {
      return kioskData.lokasi;
    }
    return '';
  }, [kioskData]);

  const kioskTitle = useMemo(() => {
    if (kioskData && kioskData.nama) {
      return kioskData.nama;
    }
    return 'Anjungan Peminjaman Loker';
  }, [kioskData]);

  const fetchLokers = async () => {
    try {
      const res = await lokerApi.getAll();
      if (res.data) {
        setAllLokers(res.data);
      }
    } catch (err) {
      console.error('Error fetching lokers for kiosk:', err);
    }
  };

  useEffect(() => {
    fetchLokers();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Hitung jumlah loker Available khusus di lokasi anjungan ini
  const areaLockerStats = useMemo(() => {
    if (!targetLocation) {
      return { total: 0, available: 0 };
    }
    const cleanTarget = targetLocation.toLowerCase();
    const lokersInArea = allLokers.filter((l) => {
      const loc = (l.lokasi || '').toLowerCase();
      return loc === cleanTarget || loc.includes(cleanTarget) || cleanTarget.includes(loc);
    });

    const total = lokersInArea.length;
    const available = lokersInArea.filter((l) => l.status === 'kosong').length;

    return { total, available };
  }, [allLokers, targetLocation]);

  const handleTapKTM = async (e) => {
    if (e) e.preventDefault();
    if (!nimInput || !nimInput.trim() || !targetLocation) return;

    setError('');
    setLoading(true);

    try {
      // Otomatis pinjamkan loker sesuai lokasi anjungan
      const res = await peminjamanApi.mandiriPinjam({
        member_id: nimInput.trim(),
        lokasi: targetLocation
      });

      if (res.data) {
        setTicketData(res.data);
        setIsTicketOpen(true);
        setNimInput('');
        fetchLokers();
      }
    } catch (err) {
      setError(err.message || 'Gagal memproses peminjaman mandiri.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleTicketClose = () => {
    setIsTicketOpen(false);
    setTicketData(null);
    setError('');
    inputRef.current?.focus();
  };

  // 1. Tampilan saat data anjungan sedang dimuat
  if (kioskLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#124b88] via-[#1a5ea4] to-[#2573c0] text-white flex flex-col items-center justify-center p-6 font-hanken">
        <div className="bg-[#0e4277]/80 backdrop-blur-2xl border border-sky-300/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-4 max-w-md w-full">
          <Loader2 className="w-10 h-10 text-cyan-300 animate-spin mx-auto" />
          <h2 className="text-xl font-bold">Menghubungkan ke Anjungan...</h2>
          <p className="text-xs sm:text-sm text-sky-100/80">
            Memverifikasi data lokasi anjungan dari server perpustakaan.
          </p>
        </div>
      </div>
    );
  }

  // 2. Tampilan jika anjungan tidak ditemukan / sudah dihapus (404)
  if (kioskNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#124b88] via-[#1a5ea4] to-[#2573c0] text-white flex flex-col justify-between p-6 sm:p-10 font-hanken relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-xl mx-auto w-full my-auto z-10">
          <div className="bg-[#0e4277]/90 backdrop-blur-2xl border-2 border-rose-400/40 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-400/40 flex items-center justify-center text-rose-300 shadow-inner">
              <MonitorOff className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-bold tracking-wider uppercase">
                404 • Tidak Ditemukan
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Anjungan Kiosk Tidak Ditemukan
              </h1>
              <p className="text-xs sm:text-sm text-sky-100/80 max-w-md mx-auto leading-relaxed">
                Alamat URL <code className="px-2 py-0.5 rounded-lg bg-black/30 text-cyan-300 font-mono text-xs">/{currentSlug || 'kiosk'}</code> tidak terdaftar di sistem atau sudah dihapus dari database.
              </p>
            </div>

            <div className="bg-[#08284c]/70 border border-sky-300/20 rounded-2xl p-4 text-xs text-sky-100/80 text-left space-y-2">
              <p className="font-bold text-sky-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>Petunjuk untuk Petugas / Admin:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-sky-200/80">
                <li>Buka menu <b>Kelola Kiosk</b> di Dashboard Admin untuk melihat daftar URL anjungan yang aktif.</li>
                <li>Jika anjungan ini baru saja dihapus, layar ini otomatis dinonaktifkan untuk peminjaman mandiri.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-sky-400/20 hover:bg-sky-400/30 border border-sky-300/40 text-sky-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
              <a
                href="/login"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 text-[#031633] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <Home className="w-4 h-4 text-[#031633]" />
                <span>Ke Beranda / Login Admin</span>
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-sky-200/60 z-10 pt-4">
          <span>Sistem Manajemen Loker Perpustakaan</span>
        </div>
      </div>
    );
  }

  // 3. Tampilan Anjungan Mandiri yang Aktif dan Terdaftar
  return (
    <div
      className={
        standalone
          ? 'min-h-screen bg-gradient-to-br from-[#124b88] via-[#1a5ea4] to-[#2573c0] text-white flex flex-col justify-between p-6 sm:p-10 font-hanken relative overflow-hidden select-none'
          : 'max-w-4xl mx-auto space-y-6 font-hanken'
      }
    >
      {/* Background Ambient Glows Kebiruan */}
      {standalone && (
        <>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      {/* Helper Bar untuk Admin (jika dibuka dari menu Dashboard) */}
      {!standalone && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="font-bold flex items-center gap-1.5 text-sky-950">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Mode Preview Kiosk di Dashboard Admin</span>
            </p>
            <p className="text-sky-700 mt-0.5">
              Untuk membuka layar anjungan mandiri layar penuh khusus per tempat, gunakan URL masing-masing anjungan di menu Kelola Kiosk.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          KONTEN UTAMA ANJUNGAN MANDIRI (TEMA KEBIRUAN SEGAR & ELEGAN)
          ======================================================== */}
      <div className="max-w-2xl mx-auto w-full my-auto z-10 space-y-6">
        {/* Card Header & Input Scanner */}
        <div
          className={
            standalone
              ? 'bg-[#0e4277]/85 backdrop-blur-2xl border border-sky-300/35 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-blue-950/30 text-center space-y-6 relative'
              : 'bg-gradient-to-br from-[#124b88] via-[#1a5ea4] to-[#2573c0] text-white rounded-3xl p-8 shadow-xl text-center space-y-6 relative'
          }
        >
          {/* Badge Lokasi Anjungan (Membaca persis lokasi dari data database) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-400/20 border border-sky-300/40 text-sky-100 text-xs font-bold tracking-wider uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping"></span>
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>ANJUNGAN LOKER — AREA {targetLocation.toUpperCase()}</span>
          </div>

          {/* Heading Nama Kiosk Persis Sesuai yang Ditambahkan */}
          <div className="space-y-2">
            <h1 className="font-newsreader text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {kioskTitle}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/90 max-w-md mx-auto leading-relaxed">
              Tempelkan (Tap) Kartu Tanda Mahasiswa (KTM) atau scan barcode NIM Anda untuk mendapatkan nomor loker otomatis.
            </p>
          </div>

          {/* Status Kapasitas Loker di Area Ini */}
          <div className="flex items-center justify-center gap-3">
            {areaLockerStats.available > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-400/20 text-emerald-200 border border-emerald-400/35 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>{areaLockerStats.available} Loker Siap Digunakan di Area Ini</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/25 text-rose-200 border border-rose-400/35 text-xs font-bold shadow-xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                <span>Loker di Area Ini Sedang Penuh</span>
              </span>
            )}
          </div>

          {/* FORM SCANNER / INPUT TAP KARTU KTM (TIDAK MEMUTIH SAAT FOKUS / DIKETIK) */}
          <form onSubmit={handleTapKTM} className="max-w-lg mx-auto pt-2">
            <div className="relative flex items-center shadow-xl rounded-2xl">
              <div className="absolute left-4.5 text-cyan-300 pointer-events-none">
                <CreditCard className="w-6 h-6 animate-pulse" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={nimInput}
                onChange={(e) => setNimInput(e.target.value)}
                placeholder="TAP KARTU KTM / SCAN NIM..."
                disabled={loading || areaLockerStats.available === 0}
                autoFocus
                className="w-full pl-14 pr-32 py-5 bg-[#0a3562]/90 hover:bg-[#0c3c6e] focus:bg-[#0c3c6e] text-white rounded-2xl text-base sm:text-lg font-mono font-bold placeholder:font-sans placeholder:font-medium placeholder:text-sky-200/60 border-2 border-sky-300/50 focus:border-cyan-300 focus:outline-hidden focus:ring-4 focus:ring-cyan-400/30 transition-all duration-200 backdrop-blur-md caret-cyan-300"
              />

              <button
                type="submit"
                disabled={loading || !nimInput.trim() || areaLockerStats.available === 0}
                className="absolute right-2.5 px-6 py-3.5 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 text-[#031633] rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md active:scale-95"
              >
                <span>{loading ? 'Memproses...' : 'Pinjam'}</span>
                <ArrowRight className="w-4 h-4 text-[#031633] font-bold" />
              </button>
            </div>

            <p className="text-[11px] text-sky-200/75 mt-2.5 font-mono">
              Sistem otomatis memilih loker kosong di area <b>{targetLocation}</b> dan mencetak struk.
            </p>
          </form>

          {/* Notifikasi Error / Warning */}
          {error && (
            <div className="bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 p-4 rounded-2xl flex items-start gap-3 text-left text-xs animate-in fade-in duration-200 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-300">Pemberitahuan</p>
                <p className="text-rose-200 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* 3 Langkah Alur Penggunaan Anjungan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          <div className="bg-[#0e4277]/65 border border-sky-300/25 backdrop-blur-md p-4 rounded-2xl flex items-start gap-3 hover:bg-[#0e4277]/80 transition-colors shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/25 text-cyan-200 font-bold flex items-center justify-center shrink-0 border border-cyan-300/40">
              1
            </div>
            <div>
              <p className="font-bold text-white text-sm">Tap Kartu Mahasiswa</p>
              <p className="text-sky-100/75 text-[11px] mt-0.5 leading-relaxed">
                Tempelkan kartu KTM atau scan barcode kartu pada pemindai.
              </p>
            </div>
          </div>

          <div className="bg-[#0e4277]/65 border border-sky-300/25 backdrop-blur-md p-4 rounded-2xl flex items-start gap-3 hover:bg-[#0e4277]/80 transition-colors shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/25 text-cyan-200 font-bold flex items-center justify-center shrink-0 border border-cyan-300/40">
              2
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ambil Struk Bill</p>
              <p className="text-sky-100/75 text-[11px] mt-0.5 leading-relaxed">
                Struk nomor loker dan bukti pinjam otomatis dicetak printer thermal.
              </p>
            </div>
          </div>

          <div className="bg-[#0e4277]/65 border border-sky-300/25 backdrop-blur-md p-4 rounded-2xl flex items-start gap-3 hover:bg-[#0e4277]/80 transition-colors shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/25 text-cyan-200 font-bold flex items-center justify-center shrink-0 border border-cyan-300/40">
              3
            </div>
            <div>
              <p className="font-bold text-white text-sm">Tunjukkan ke Petugas</p>
              <p className="text-sky-100/75 text-[11px] mt-0.5 leading-relaxed">
                Perlihatkan struk ke petugas sirkulasi untuk mengambil anak kunci.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Minimalis */}
      {standalone && (
        <div className="text-center text-[11px] text-sky-200/60 z-10 pt-4">
          <span>Anjungan Mandiri Loker • Terhubung ke Server Perpustakaan</span>
        </div>
      )}

      {/* Modal Cetak Struk Tiket Bill Thermal (Black & White) */}
      <PrintTicketModal
        isOpen={isTicketOpen}
        onClose={handleTicketClose}
        ticketData={ticketData}
      />
    </div>
  );
}