import React, { useState, useEffect, useRef } from 'react';
import PrintTicketModal from '../components/transaksi/PrintTicketModal';
import { peminjamanApi, lokerApi } from '../api';
import { 
  CreditCard, 
  MapPin, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Printer,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function KioskPage() {
  const [nimInput, setNimInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('semua');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const inputRef = useRef(null);

  // Ambil daftar lokasi dan hitung loker yang Available
  const fetchLocations = async () => {
    try {
      const res = await lokerApi.getAll();
      if (res.data) {
        const countsByLoc = {};
        res.data.forEach((l) => {
          const loc = l.lokasi || 'Area Umum';
          if (!countsByLoc[loc]) {
            countsByLoc[loc] = { total: 0, available: 0 };
          }
          countsByLoc[loc].total += 1;
          if (l.status === 'kosong') {
            countsByLoc[loc].available += 1;
          }
        });

        const list = Object.entries(countsByLoc).map(([name, data]) => ({
          name,
          ...data
        }));
        setLocations(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLocations();
    // Auto focus ke input tap kartu
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleTapKTM = async (e) => {
    if (e) e.preventDefault();
    if (!nimInput || !nimInput.trim()) return;

    setError('');
    setLoading(true);

    try {
      const res = await peminjamanApi.mandiriPinjam({
        member_id: nimInput.trim(),
        lokasi: selectedLocation !== 'semua' ? selectedLocation : undefined
      });

      if (res.data) {
        setTicketData(res.data);
        setIsTicketOpen(true);
        setNimInput('');
        fetchLocations();
      }
    } catch (err) {
      setError(err.message || 'Gagal memproses peminjaman mandiri.');
    } finally {
      setLoading(false);
      // Auto re-focus
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleTicketClose = () => {
    setIsTicketOpen(false);
    setTicketData(null);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-hanken">
      {/* Header Banner Kiosk */}
      <div className="bg-gradient-to-br from-[#031633] via-[#1a2b49] to-[#031633] text-white rounded-3xl p-8 shadow-xl relative overflow-hidden text-center">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ffdcc0]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#8b500b]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/logo.png" 
              alt="Logo Universitas Riau" 
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#ffdcc0] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb876]" />
            <span>Perpustakaan Universitas Riau</span>
          </div>

          <h2 className="font-editorial text-3xl font-bold tracking-tight text-white">
            Anjungan Peminjaman Loker Mandiri
          </h2>

          <p className="text-sm text-[#d7e2ff] leading-relaxed">
            Tempelkan (Tap) Kartu Tanda Mahasiswa (KTM) atau scan barcode NIM Anda untuk mendapatkan nomor loker otomatis dan mencetak bukti struk.
          </p>
        </div>

        {/* INPUT BESAR TAP KARTU KTM */}
        <form onSubmit={handleTapKTM} className="mt-8 max-w-lg mx-auto relative z-10">
          <div className="relative flex items-center">
            <div className="absolute left-4.5 text-[#8b500b]">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={nimInput}
              onChange={(e) => setNimInput(e.target.value)}
              placeholder="TAP KARTU KTM / SCAN BARCODE NIM..."
              disabled={loading}
              className="w-full pl-14 pr-32 py-4.5 bg-white text-[#031633] rounded-2xl text-base font-mono font-bold placeholder:font-sans placeholder:font-normal placeholder:text-[#75777e] shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-[#8b500b]/30 transition-all border-2 border-[#e3e2e0]"
            />

            <button
              type="submit"
              disabled={loading || !nimInput.trim()}
              className="absolute right-2 px-5 py-3 bg-[#031633] hover:bg-[#1a2b49] text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-md"
            >
              <span>{loading ? 'Cek...' : 'Pinjam'}</span>
              <ArrowRight className="w-4 h-4 text-[#ffdcc0]" />
            </button>
          </div>
          <p className="text-[11px] text-[#d7e2ff] mt-2 font-mono">
            Contoh NIM demo: <b>M001</b>, <b>M002</b>, <b>M003</b>, <b>M004</b>, <b>M005</b>
          </p>
        </form>
      </div>

      {/* Alert Error / Warning */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Perhatian</p>
            <p className="text-rose-700 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* PILIH AREA / LOKASI LOKER YANG DIINGINKAN */}
      <div className="bg-white rounded-3xl border border-[#e3e2e0] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#efeeeb] pb-3">
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#031633]">
              Pilih Area Penempatan Loker
            </h3>
            <p className="text-xs text-[#75777e]">
              Pilih lantai atau area loker yang Anda inginkan (sistem otomatis memberikan loker Available di area tersebut).
            </p>
          </div>
          <span className="text-xs font-bold text-[#6b3b00] bg-[#ffdcc0] px-3 py-1 rounded-full border border-[#ffdcc0]">
            {locations.reduce((sum, l) => sum + l.available, 0)} Loker Available
          </span>
        </div>

        {/* Pilihan Lokasi Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Pilihan 1: Otomatis */}
          <div
            onClick={() => setSelectedLocation('semua')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedLocation === 'semua'
                ? 'bg-[#ffdcc0]/30 border-[#8b500b] text-[#031633] shadow-xs'
                : 'bg-[#faf9f6] border-[#e3e2e0] hover:border-[#c5c6ce] text-[#44474e]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777e]">Opsi Otomatis</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b500b]"></span>
            </div>
            <div className="my-2">
              <h4 className="font-editorial font-bold text-base text-[#031633]">Semua Lokasi</h4>
              <p className="text-xs text-[#75777e]">Berikan loker Available terdekat</p>
            </div>
            <span className="text-[11px] font-bold text-[#8b500b]">Rekomendasi Cepat</span>
          </div>

          {/* Lokasi-lokasi Spesifik */}
          {locations.map((loc) => {
            const isSelected = selectedLocation === loc.name;
            const isFull = loc.available === 0;

            return (
              <div
                key={loc.name}
                onClick={() => !isFull && setSelectedLocation(loc.name)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isFull
                    ? 'opacity-50 bg-[#f4f3f0] border-[#e3e2e0] cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#ffdcc0]/30 border-[#8b500b] text-[#031633] shadow-xs cursor-pointer'
                    : 'bg-[#faf9f6] border-[#e3e2e0] hover:border-[#c5c6ce] text-[#44474e] cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#44474e]">
                    <MapPin className="w-3.5 h-3.5 text-[#8b500b]" />
                    <span>Area Lantai</span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isFull ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  ></span>
                </div>

                <div className="my-2">
                  <h4 className="font-editorial font-bold text-sm text-[#031633]">{loc.name}</h4>
                  <p className="text-xs text-[#75777e]">{loc.total} total loker</p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isFull ? 'text-rose-700' : 'text-emerald-800'}>
                    {isFull ? 'Penuh (Not Available)' : `${loc.available} Available`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Petunjuk Alur Penggunaan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <p className="font-bold text-slate-800">Tap Kartu Mahasiswa</p>
            <p className="text-slate-500 mt-0.5">Tempelkan kartu KTM atau scan barcode kartu Anda pada alat pemindai.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <p className="font-bold text-slate-800">Ambil Struk Tiket Loker</p>
            <p className="text-slate-500 mt-0.5">Struk berisi nomor loker dan QR code akan otomatis dicetak printer thermal.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <p className="font-bold text-slate-800">Tunjukkan ke Petugas</p>
            <p className="text-slate-500 mt-0.5">Perlihatkan struk ke petugas sirkulasi untuk mengambil anak kunci loker fisik.</p>
          </div>
        </div>
      </div>

      {/* Modal Cetak Struk Tiket */}
      <PrintTicketModal
        isOpen={isTicketOpen}
        onClose={handleTicketClose}
        ticketData={ticketData}
      />
    </div>
  );
}

