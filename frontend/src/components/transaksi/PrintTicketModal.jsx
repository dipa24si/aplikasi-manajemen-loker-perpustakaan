import React from 'react';
import Modal from '../common/Modal';
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
      maxWidth="max-w-md"
    >
      <div className="space-y-4 font-hanken">
        {/* Banner Berhasil (hanya tampil di layar) */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2.5 text-xs print:hidden">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Loker Berhasil Dialokasikan!</p>
            <p className="text-emerald-700">Silakan cetak struk bill dan tunjukkan kepada petugas untuk mengambil anak kunci fisik.</p>
          </div>
        </div>

        {/* ========================================================
            AREA STRUK TIKET CETAK (STRUK THERMAL BILL BLACK & WHITE)
            ======================================================== */}
        <div className="flex justify-center">
          <div 
            id="thermal-receipt" 
            className="w-full max-w-[340px] bg-white border-2 border-black rounded-xl p-4 text-black shadow-sm print:border print:border-black print:p-3 print:shadow-none print:w-[78mm]"
          >
            {/* Header Struk Perpustakaan */}
            <div className="text-center pb-2 border-b border-dashed border-black">
              <img 
                src="/logo.png" 
                alt="Logo UNRI" 
                className="w-9 h-9 object-contain mx-auto filter grayscale contrast-200"
              />
              <h3 className="font-black text-xs uppercase tracking-wider text-black mt-1 leading-tight font-sans">
                PERPUSTAKAAN UNIVERSITAS RIAU
              </h3>
              <p className="text-[10px] text-neutral-800 font-sans font-medium">
                Struk Peminjaman Loker Mandiri
              </p>
            </div>

            {/* Kotak Nomor Loker & Lokasi (Persis seperti di foto) */}
            <div className="border border-black rounded-lg p-3 my-2.5 bg-white text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black block font-sans">
                NOMOR LOKER ANDA
              </span>
              <div className="text-4xl font-black text-black tracking-tight font-mono my-0.5 leading-none">
                {ticketData.nomor_loker}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-black font-sans font-semibold mt-1">
                <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{ticketData.lokasi_loker}</span>
              </div>
            </div>

            {/* Data Peminjam & Waktu Pinjam (Persis seperti di foto) */}
            <div className="text-xs font-sans space-y-1.5 text-black py-1">
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Peminjam:</span>
                <span className="font-bold text-black text-right">
                  {ticketData.member_name || ticketData.member_id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">NIM / ID:</span>
                <span className="font-mono font-bold text-black text-right">{ticketData.member_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Waktu Pinjam:</span>
                <span className="text-black text-right">{formatDate(ticketData.tanggal_pinjam)}</span>
              </div>
              
              <div className="border-t border-dashed border-black pt-1.5 mt-1.5 flex justify-between items-center font-bold">
                <span className="text-black">Batas Kembali:</span>
                <span className="text-black font-bold">Bebas (Tidak ada batas waktu)</span>
              </div>
            </div>

            {/* Peraturan Kunci Hilang */}
            <div className="mt-2.5 border border-black rounded-lg p-2 bg-white text-[10px] text-black font-sans font-semibold leading-tight">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-black shrink-0" />
                <span>Jika kunci hilang harap lapor ke petugas. Denda hanya berlaku jika kunci hilang.</span>
              </div>
            </div>

            {/* Footer Struk Bill */}
            <div className="text-center pt-2 mt-2 border-t border-dashed border-black text-[9px] text-neutral-800 font-sans space-y-0.5">
              <p>Tunjukkan struk ini ke petugas sirkulasi untuk mengambil anak kunci fisik.</p>
              <p className="font-mono text-black">*** TERIMA KASIH ***</p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-2 pt-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-3 px-4 rounded-xl shadow-xs text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#ffdcc0]" />
            <span>Cetak Struk (Bill)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 bg-[#f4f3f0] hover:bg-[#e3e2e0] text-[#031633] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#c5c6ce]"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
}
