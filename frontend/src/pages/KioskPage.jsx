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
  Loader2,
  Clock,
  X,
  ShieldCheck
} from 'lucide-react';

export default function KioskPage({ standalone = true, tempatSlug = '' }) {
  const [nimInput, setNimInput] = useState('');
  const [allLokers, setAllLokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef(null);

  // Data kiosk dari database
  const [kioskData, setKioskData] = useState(null);
  const [kioskLoading, setKioskLoading] = useState(true);
  const [kioskNotFound, setKioskNotFound] = useState(false);

  // Jam real-time untuk header kiosk
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Auto-clear pesan error otomatis setelah 7 detik agar layar kembali bersih
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear input NIM jika tidak disubmit selama 30 detik (idle reset)
  useEffect(() => {
    if (nimInput) {
      const timer = setTimeout(() => setNimInput(''), 30000);
      return () => clearTimeout(timer);
    }
  }, [nimInput]);

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

  // Pemutar suara keberhasilan dari file lokal (/sounds/success.wav)
  const playSuccessSound = () => {
    try {
      const audio = new Audio('/sounds/success.wav');
      audio.volume = 0.9;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Fallback otomatis ke Web Audio synthesizer jika file lokal terhalang policy browser
          console.warn('Audio local file fallback:', err?.message);
          playSynthesizedChime();
        });
      }
    } catch (e) {
      playSynthesizedChime();
    }
  };

  // Synthesizer nada chime merdu cadangan
  const playSynthesizedChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      const now = ctx.currentTime;
      playTone(1046.5, now, 0.22);         // Nada C6 (Ting)
      playTone(1567.98, now + 0.12, 0.45); // Nada G6 (Tong)
    } catch (e) {
      // Audio silent fallback
    }
  };

  // Pemutar suara kegagalan / error dari file lokal (/sounds/error.wav)
  const playErrorSound = () => {
    try {
      const audio = new Audio('/sounds/error.wav');
      audio.volume = 0.9;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Fallback otomatis ke Web Audio synthesizer jika file lokal terhalang policy browser
          console.warn('Audio local error file fallback:', err?.message);
          playSynthesizedErrorBeep();
        });
      }
    } catch (e) {
      playSynthesizedErrorBeep();
    }
  };

  // Synthesizer nada error / buzzer cadangan (nada peringatan dua ketukan)
  const playSynthesizedErrorBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      const now = ctx.currentTime;
      playTone(370, now, 0.18);          // Nada peringatan 1
      playTone(260, now + 0.22, 0.26);   // Nada peringatan 2
    } catch (e) {
      // Audio silent fallback
    }
  };

  // Submit scan KTM / NIM dengan AUTO-CLEAR & EFEK SUARA
  const handleTapKTM = async (e) => {
    if (e) e.preventDefault();
    const cleanNim = nimInput.trim();
    if (!cleanNim || !targetLocation) return;

    setError('');
    setLoading(true);
    // 1. Auto-clear nilai input NIM langsung saat submit
    setNimInput('');

    try {
      // Otomatis pinjamkan loker sesuai lokasi anjungan
      const res = await peminjamanApi.mandiriPinjam({
        member_id: cleanNim,
        lokasi: targetLocation
      });

      if (res.data) {
        // Bunyikan suara berhasil dari file audio lokal
        playSuccessSound();

        setTicketData(res.data);
        setIsTicketOpen(true);
        fetchLokers();
      }
    } catch (err) {
      // Bunyikan suara peringatan / error jika member tidak terdaftar, nonaktif, dll.
      playErrorSound();
      setError(err.message || 'Gagal memproses peminjaman mandiri.');
    } finally {
      setLoading(false);
      // 2. Pastikan input selalu bersih (auto-clear) dan fokus kembali
      setNimInput('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleTicketClose = () => {
    setIsTicketOpen(false);
    setTicketData(null);
    setError('');
    setNimInput(''); // Auto-clear saat struk selesai
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setNimInput('');
      setError('');
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // 1. Tampilan saat data anjungan sedang dimuat (Latar Putih Bersih)
  if (kioskLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col items-center justify-center p-6 font-hanken">
        <div className="bg-gradient-to-br from-[#0c3968] via-[#124d8f] to-[#1c65b1] text-white border border-sky-400/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-4 max-w-md w-full">
          <Loader2 className="w-10 h-10 text-cyan-300 animate-spin mx-auto" />
          <h2 className="text-xl font-bold">Menghubungkan ke Anjungan...</h2>
          <p className="text-xs sm:text-sm text-sky-100/80">
            Memverifikasi data lokasi anjungan dari server perpustakaan.
          </p>
        </div>
      </div>
    );
  }

  // 2. Tampilan jika anjungan tidak ditemukan / sudah dihapus (404 pada Latar Putih)
  if (kioskNotFound) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col justify-between font-hanken select-none">
        {/* Top Header Biru */}
        <header className="bg-gradient-to-r from-[#072b54] via-[#0d4177] to-[#165a9e] text-white px-6 py-3.5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo UNRI" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-editorial text-sm sm:text-base font-bold leading-tight">Perpustakaan Universitas Riau</h1>
              <p className="text-[10px] text-sky-200">Sistem Anjungan Mandiri Loker</p>
            </div>
          </div>
          <div className="text-right text-xs text-sky-100 hidden sm:block">
            <span className="font-mono font-semibold">{formattedTime}</span>
            <span className="mx-2">•</span>
            <span>{formattedDate}</span>
          </div>
        </header>

        <div className="max-w-xl mx-auto w-full my-auto z-10 p-6">
          <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
              <MonitorOff className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold tracking-wider uppercase">
                404 • Tidak Ditemukan
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#072b54]">
                Anjungan Kiosk Tidak Ditemukan
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Alamat URL <code className="px-2 py-0.5 rounded-lg bg-slate-100 text-[#0d4177] font-mono text-xs font-bold">/{currentSlug || 'kiosk'}</code> tidak terdaftar di sistem atau sudah dihapus dari database.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 text-left space-y-2">
              <p className="font-bold text-[#072b54] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Petunjuk untuk Petugas / Admin:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                <li>Buka menu <b>Kelola Kiosk</b> di Dashboard Admin untuk melihat daftar URL anjungan yang aktif.</li>
                <li>Jika anjungan ini baru saja dihapus, layar ini otomatis dinonaktifkan untuk peminjaman mandiri.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang</span>
              </button>
              <a
                href="/login"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#0d4177] to-[#165a9e] hover:from-[#0a335e] hover:to-[#124a82] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                <Home className="w-4 h-4 text-cyan-300" />
                <span>Ke Beranda / Login Admin</span>
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 py-4">
          <span>UPA Perpustakaan Universitas Riau • Layar Anjungan Mandiri</span>
        </div>
      </div>
    );
  }

  // 3. Tampilan Utama Anjungan (Latar Belakang Putih Bersih, Header & Card Bernuansa Biru Elegan)
  return (
    <div
      className={
        standalone
          ? 'min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col justify-between font-hanken select-none relative overflow-x-hidden'
          : 'max-w-4xl mx-auto space-y-6 font-hanken'
      }
    >
      {/* ========================================================
          1. HEADER ATAS (WARNA BIRU ELEGAN KHAS KAMPUS)
          ======================================================== */}
      {standalone && (
        <header className="bg-gradient-to-r from-[#072b54] via-[#0d4177] to-[#165a9e] text-white px-6 sm:px-10 py-3.5 shadow-md flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Universitas Riau"
              className="w-9 h-9 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="font-editorial text-base sm:text-lg font-bold leading-tight tracking-tight">
                Perpustakaan <span className="text-sky-200">Universitas Riau</span>
              </h1>
              <p className="text-[11px] text-sky-100/90 font-medium">
                Sistem Peminjaman Loker Mandiri (Self-Service Kiosk)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Lokasi Badge di Header (Sesuai Foto 3) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-400/20 border border-sky-300/40 text-sky-100 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
              <MapPin className="w-3.5 h-3.5 text-cyan-300" />
              <span>{targetLocation || 'AREA KIOSK'}</span>
            </div>

            {/* Jam Real-time */}
            <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl text-xs text-sky-100 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-mono font-bold">{formattedTime}</span>
            </div>
          </div>
        </header>
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
          2. KONTEN UTAMA: BESAR, LEGA, TANPA KOTAK CARD BIRU
          ======================================================== */}
      <div className="max-w-4xl mx-auto w-full my-auto px-6 py-8 sm:py-12 z-10 text-center space-y-7">

        {/* Heading Nama Kiosk Persis dari Database (Besar & Megah) */}
        <div className="space-y-3">
          <h1 className="font-newsreader text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#072b54] drop-shadow-xs">
            {kioskTitle}
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Tempelkan (Tap) Kartu Tanda Mahasiswa (KTM) atau scan barcode NIM Anda untuk mendapatkan nomor loker otomatis.
          </p>
        </div>

        {/* Status Kapasitas Loker di Area Ini */}
        <div className="flex items-center justify-center gap-3">
          {areaLockerStats.available > 0 ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border-2 border-emerald-200 text-sm font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{areaLockerStats.available} Loker Siap Digunakan di Area Ini</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-800 border-2 border-rose-200 text-sm font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Loker di Area Ini Sedang Penuh</span>
            </span>
          )}
        </div>

        {/* FORM SCANNER / INPUT TAP KARTU KTM (BESAR, LEGA, TOUCHSCREEN-READY) */}
        <form onSubmit={handleTapKTM} className="max-w-xl mx-auto pt-2">
          <div className="relative flex items-center shadow-xl rounded-2xl bg-white border-2 border-slate-300 focus-within:border-[#0d4177] focus-within:ring-4 focus-within:ring-sky-100 transition-all">
            <div className="absolute left-5 text-[#0d4177] pointer-events-none">
              <CreditCard className="w-7 h-7 animate-pulse" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={nimInput}
              onChange={(e) => setNimInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="TAP KARTU KTM / SCAN NIM..."
              disabled={loading || areaLockerStats.available === 0}
              autoFocus
              className="w-full pl-16 pr-48 py-6 bg-transparent text-slate-900 rounded-2xl text-xl sm:text-2xl font-mono font-extrabold placeholder:font-sans placeholder:font-medium placeholder:text-slate-400 focus:outline-hidden caret-[#0d4177]"
            />

            {/* Tombol Clear NIM Cepat (digeser lebih ke kiri dari tombol Pinjam) */}
            {nimInput && !loading && (
              <button
                type="button"
                onClick={() => {
                  setNimInput('');
                  inputRef.current?.focus();
                }}
                className="absolute right-36 sm:right-40 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                title="Hapus / Reset NIM"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !nimInput.trim() || areaLockerStats.available === 0}
              className="absolute right-3 px-8 py-4 bg-gradient-to-r from-[#072b54] via-[#0d4177] to-[#165a9e] hover:from-[#05203f] hover:to-[#0d4177] text-white rounded-xl font-bold text-base transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-md active:scale-95"
            >
              <span>{loading ? 'Memproses...' : 'Pinjam'}</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 font-mono">
            Sistem otomatis memilih loker kosong di area <b>{targetLocation}</b> dan mencetak struk.
          </p>
        </form>

        {/* Notifikasi Error / Warning (Auto-clear setelah 7 detik) */}
        {error && (
          <div className="max-w-xl mx-auto bg-rose-50 border-2 border-rose-300 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-left text-xs sm:text-sm animate-in fade-in duration-200 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">Pemberitahuan</p>
              <p className="text-rose-800 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* 3 Langkah Alur Penggunaan Anjungan (Besar, Rapi, & Elegan) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm max-w-3xl mx-auto w-full pt-4">
          <div className="bg-white border-2 border-sky-100 hover:border-sky-300 p-5 rounded-2xl flex items-start gap-4 shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d4177] to-[#165a9e] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div>
              <p className="font-bold text-[#072b54] text-sm sm:text-base">Tap Kartu Mahasiswa</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                Tempelkan kartu KTM atau scan barcode kartu pada pemindai.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-sky-100 hover:border-sky-300 p-5 rounded-2xl flex items-start gap-4 shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d4177] to-[#165a9e] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div>
              <p className="font-bold text-[#072b54] text-sm sm:text-base">Ambil Struk Bill</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                Struk nomor loker dan bukti pinjam otomatis dicetak printer thermal.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-sky-100 hover:border-sky-300 p-5 rounded-2xl flex items-start gap-4 shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d4177] to-[#165a9e] text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div>
              <p className="font-bold text-[#072b54] text-sm sm:text-base">Tunjukkan ke Petugas</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                Perlihatkan struk ke petugas sirkulasi untuk mengambil anak kunci.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. FOOTER MINIMALIS PADA LATAR PUTIH
          ======================================================== */}
      {standalone && (
        <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/80 bg-white/60">
          <span>UPA Perpustakaan Universitas Riau • Layar Anjungan Peminjaman Mandiri • Kampus Bina Widya</span>
        </footer>
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