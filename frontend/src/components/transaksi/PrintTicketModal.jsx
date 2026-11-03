import React from 'react';
import Modal from '../common/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../../utils/formatters';
import { Printer, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';

export default function PrintTicketModal({ isOpen, onClose, ticketData }) {
  if (!ticketData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tiket Peminjaman Loker Mandiri"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Banner Berhasil */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2.5 text-xs print:hidden">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Loker Berhasil Dialokasikan!</p>
            <p className="text-emerald-700">Silakan cetak tiket dan tunjukkan kepada petugas untuk mengambil anak kunci fisik.</p>
          </div>
        </div>

        {/* ========================================================
            AREA STRUK TIKET CETAK (2 KOLOM: KIRI BARCODE, KANAN DESKRIPSI)
            ======================================================== */}
        <div 
          id="thermal-receipt" 
          className="bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-sm text-slate-900 print:border-2 print:border-slate-800 print:shadow-none print:p-4 print:w-full"
        >
          <div className="grid grid-cols-12 gap-5 items-stretch">
            {/* SEBELAH KIRI: BARCODE / QR CODE */}
            <div className="col-span-5 flex flex-col items-center justify-between border-r-2 border-dashed border-slate-300 pr-4 py-1 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans block mb-1">
                  SCAN QR KUNCI
                </span>
                <div className="bg-white p-2.5 rounded-2xl border-2 border-slate-900 shadow-2xs inline-block">
                  <QRCodeSVG
                    value={ticketData.qr_kunci || `LOKER:${ticketData.nomor_loker}`}
                    size={140}
                    level="M"
                  />
                </div>
              </div>

              <div className="mt-2 space-y-0.5">
                <span className="text-sm font-mono font-black text-slate-900 tracking-wider block">
                  {ticketData.qr_kunci || `LOKER:${ticketData.nomor_loker}`}
                </span>
                <p className="text-[10px] text-slate-500 font-sans leading-tight">
                  Arahkan QR ini saat mengembalikan kunci
                </p>
              </div>
            </div>

            {/* SEBELAH KANAN: DESKRIPSI LENGKAP */}
            <div className="col-span-7 flex flex-col justify-between space-y-3 text-left">
              {/* Header with UNRI Logo */}
              <div className="border-b border-slate-200 pb-2 flex items-center gap-2.5">
                <img 
                  src="/logo.png" 
                  alt="Logo UNRI" 
                  className="w-10 h-10 object-contain shrink-0"
                />
                <div>
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider font-sans leading-tight">
                    PERPUSTAKAAN UNIVERSITAS RIAU
                  </h3>
                  <p className="text-[10px] text-slate-500 font-sans font-medium">Tiket Peminjaman Loker Mandiri</p>
                </div>
              </div>

              {/* Kotak Nomor Loker & Lokasi */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold font-sans block">
                  NOMOR LOKER ANDA
                </span>
                <div className="text-3xl font-black text-indigo-700 tracking-tight font-mono my-0.5 leading-none">
                  {ticketData.nomor_loker}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-sans font-medium mt-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{ticketData.lokasi_loker}</span>
                </div>
              </div>

              {/* Data Peminjam & Waktu */}
              <div className="text-xs font-sans space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peminjam:</span>
                  <span className="font-bold text-slate-900">
                    {ticketData.member_name || ticketData.member_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NIM / ID:</span>
                  <span className="font-mono font-bold text-slate-800">{ticketData.member_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Pinjam:</span>
                  <span>{formatDate(ticketData.tanggal_pinjam)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-[11px]">
                  <span className="text-slate-600 font-bold">Batas Kembali:</span>
                  <span className="font-bold text-rose-600">Hari ini, Maks 16:00 WIB</span>
                </div>
              </div>

              {/* Peraturan Denda & Jam Tutup */}
              <div className="text-[9px] text-slate-600 font-sans leading-tight border-t border-dashed border-slate-200 pt-2 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Perpus tutup jam 16:00 WIB. Denda telat Rp 5.000 / hari.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-2 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 text-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Tiket / Struk</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
}
