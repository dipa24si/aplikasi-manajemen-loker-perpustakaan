import React, { useState, useEffect } from 'react';
import Badge from '../components/common/Badge';
import { historyApi, peminjamanApi } from '../api';
import { formatDate, formatRupiah } from '../utils/formatters';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await historyApi.getHistory({
        page,
        limit: 15,
        status,
        search: search.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });

      if (res.data) {
        setItems(res.data.items || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [status, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handleRecoverLostKey = async (row) => {
    const confirm = window.confirm(
      `Konfirmasi penerimaan kunci loker ${row.nomor_loker} dari ${row.member_name || row.member_id}?\n\nStatus loker akan otomatis kembali AVAILABLE dan keterangannya menjadi 'Kondisi aman (kunci telah dikembalikan)'. Denda dibebaskan.`
    );
    if (!confirm) return;

    try {
      await peminjamanApi.pulihkanKunci({
        peminjaman_id: row.id,
        nomor_loker: row.nomor_loker,
        catatan: 'Kondisi aman (kunci telah dikembalikan)'
      });
      alert(`Kunci loker ${row.nomor_loker} berhasil diterima kembali! Status loker AVAILABLE dan kunci aman.`);
      fetchHistory(pagination.page);
    } catch (err) {
      alert(err.message || 'Gagal memulihkan status kunci');
    }
  };

  // Export langsung ke file Excel (.xlsx) dengan SheetJS
  const handleExportExcel = async () => {
    try {
      const res = await historyApi.getHistory({
        status,
        search: search.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_export: 'true'
      });

      const dataToExport = res.data?.items || [];
      if (dataToExport.length === 0) {
        alert('Tidak ada data riwayat untuk diekspor.');
        return;
      }

      // Format data untuk spreadsheet Excel
      const excelRows = dataToExport.map((row, index) => ({
        'No': index + 1,
        'Nama Mahasiswa': row.member_name || row.member_id,
        'NIM': row.member_id,
        'Fakultas': row.member_instansi || row.fakultas || '-',
        'Program Studi': row.inst_name || row.prodi || '-',
        'Nomor Loker': row.nomor_loker,
        'Lokasi Penempatan': row.lokasi_loker || '-',
        'Waktu Pinjam': row.tanggal_pinjam ? formatDate(row.tanggal_pinjam) : '-',
        'Waktu Kembali': row.tanggal_kembali ? formatDate(row.tanggal_kembali) : 'Sedang Dipinjam',
        'Status': row.status === 'selesai' ? 'Selesai' : row.status === 'kunci_hilang' ? 'Kunci Hilang' : 'Aktif',
        'Denda Kunci Hilang (Rp)': parseFloat(row.denda) || 0,
        'Petugas Pinjam': row.petugas_pinjam || '-',
        'Petugas Kembali': row.petugas_kembali || '-',
        'Catatan': row.catatan || '-'
      }));

      // Buat Worksheet & Workbook
      const worksheet = XLSX.utils.json_to_sheet(excelRows);

      // Atur lebar kolom (character width) agar dokumen rapi saat dibuka di Microsoft Excel
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 26 }, // Nama Mahasiswa
        { wch: 15 }, // NIM
        { wch: 18 }, // Fakultas
        { wch: 25 }, // Program Studi
        { wch: 14 }, // Nomor Loker
        { wch: 25 }, // Lokasi Penempatan
        { wch: 20 }, // Waktu Pinjam
        { wch: 20 }, // Waktu Kembali
        { wch: 15 }, // Status
        { wch: 22 }, // Denda Kunci Hilang
        { wch: 20 }, // Petugas Pinjam
        { wch: 20 }, // Petugas Kembali
        { wch: 25 }  // Catatan
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Peminjaman Loker');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Laporan_Peminjaman_Loker_UNRI_${dateStr}.xlsx`);
    } catch (err) {
      alert('Gagal mengekspor data ke Excel: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalDendaPage = items.reduce((sum, item) => sum + (parseFloat(item.denda) || 0), 0);

  return (
    <div id="history-report" className="space-y-5">
      {/* ========================================================
          KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT DOKUMEN)
          ======================================================== */}
      <div className="hidden print:flex items-center gap-4 border-b-2 border-slate-900 pb-3 mb-4">
        <img src="/logo.png" alt="Logo UNRI" className="w-16 h-16 object-contain shrink-0" />
        <div className="text-left font-serif">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
          </h3>
          <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
            UNIVERSITAS RIAU — UPA PERPUSTAKAAN
          </h2>
          <p className="text-[10px] text-slate-600">
            Kampus Bina Widya Km. 12,5 Simpang Baru, Pekanbaru 28293 | Laman: perpus.unri.ac.id
          </p>
        </div>
      </div>

      <div className="hidden print:block text-center border-b border-slate-300 pb-2 mb-3">
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 font-sans">
          LAPORAN RIWAYAT PEMINJAMAN LOKER PERPUSTAKAAN
        </h3>
        <p className="text-xs text-slate-500 font-sans">
          Dicetak pada: {formatDate(new Date())} | Total Data: {pagination.total} Transaksi | Total Denda: {formatRupiah(totalDendaPage)}
        </p>
      </div>

      {/* Header & Action Bar Web (Disembunyikan saat cetak) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden font-hanken">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[#031633] tracking-tight">
            Riwayat & Laporan Peminjaman
          </h2>
          <p className="text-xs text-[#75777e] mt-0.5">
            Laporan lengkap seluruh transaksi peminjaman, pengembalian, status kunci hilang, dan denda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3.5 sm:px-4 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white text-xs font-bold py-2.5 px-3.5 sm:px-4 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#ffdcc0]" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Card Web (Disembunyikan saat cetak) */}
      <div className="bg-white rounded-2xl border border-[#e3e2e0] p-3.5 sm:p-4 shadow-2xs print:hidden space-y-3 font-hanken">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="relative w-full sm:w-auto flex-1 min-w-[160px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor loker, nama, atau NIM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 sm:flex-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Sedang Dipinjam (Aktif)</option>
            <option value="selesai">Selesai Dikembalikan</option>
            <option value="kunci_hilang">Kunci Hilang</option>
          </select>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#031633] hover:bg-[#1a2b49] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Terapkan
          </button>
        </form>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 print:border-slate-400">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600 print:text-black" />
          <span>Total Transaksi: <b className="text-slate-800">{pagination.total}</b> baris</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="w-4 h-4 text-emerald-600 print:text-black" />
          <span>Total Denda di Halaman Ini: <b className="text-emerald-700 print:text-black font-bold">{formatRupiah(totalDendaPage)}</b></span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#e3e2e0] shadow-2xs overflow-hidden print:border-none print:shadow-none font-hanken">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse print:text-[10pt]">
            <thead>
              <tr className="bg-[#f4f3f0] text-[#031633] border-b border-[#e3e2e0] uppercase font-bold text-[10px] tracking-wider print:bg-slate-100 print:border-black">
                <th className="py-3 px-3 print:py-1.5 print:px-2">Loker</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Nama & NIM</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Fakultas / Prodi</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Waktu Pinjam</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Waktu Kembali</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Status</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Denda (Kunci Hilang)</th>
                <th className="py-3 px-3 print:py-1.5 print:px-2">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 print:divide-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    Memuat data riwayat...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    Tidak ada riwayat peminjaman yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors print:border-b print:border-slate-300">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 print:py-1.5 print:px-2">
                      {row.nomor_loker}
                      {row.lokasi_loker && (
                        <span className="block text-[10px] font-sans font-normal text-slate-400 uppercase print:text-slate-600">
                          {row.lokasi_loker}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2">
                      <p className="font-semibold text-slate-800">{row.member_name || row.member_id}</p>
                      <p className="text-slate-400 text-[11px] font-mono print:text-slate-600">
                        {row.member_id}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2">
                      <p className="font-semibold text-slate-800">{row.member_instansi || row.fakultas || '-'}</p>
                      <p className="text-slate-500 text-[11px]">{row.inst_name || row.prodi || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-slate-700">
                      {formatDate(row.tanggal_pinjam)}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-slate-700">
                      {row.tanggal_kembali ? (
                        formatDate(row.tanggal_kembali)
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                          Sedang Dipinjam
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge status={row.status} size="sm" />
                        {row.status === 'kunci_hilang' && (
                          <button
                            type="button"
                            onClick={() => handleRecoverLostKey(row)}
                            className="print:hidden text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Konfirmasi bahwa kunci fisik telah dikembalikan dan kondisi kunci sekarang aman"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Kunci Dikembalikan</span>
                          </button>
                        )}
                        {row.status === 'selesai' && row.catatan && (row.catatan.toLowerCase().includes('hilang') || row.catatan.toLowerCase().includes('pulih')) && (
                          <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Kunci Pulih (Aman)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 font-medium">
                      {parseFloat(row.denda) > 0 ? (
                        <span className="text-rose-600 print:text-black font-bold">{formatRupiah(row.denda)}</span>
                      ) : (
                        <span className="text-slate-400 print:text-slate-600">Rp 0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-slate-500 text-[11px] print:text-slate-700">
                      <p>Pinjam: {row.petugas_pinjam || '-'}</p>
                      <p>Kembali: {row.petugas_kembali || '-'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Cetak Laporan (Hanya Muncul Saat Print) */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-xs text-center border-t border-slate-300">
          <div>
            <p>Petugas Sirkulasi,</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( ............................................ )</p>
            <p className="text-[10px] text-slate-500">NIP / ID Petugas</p>
          </div>
          <div>
            <p>Pekanbaru, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala UPA Perpustakaan UNRI</p>
            <div className="h-12"></div>
            <p className="font-bold underline">( ............................................ )</p>
            <p className="text-[10px] text-slate-500">NIP.</p>
          </div>
        </div>

        {/* Pagination Controls Web (Disembunyikan saat cetak) */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            Halaman <b>{pagination.page}</b> dari <b>{pagination.totalPages}</b>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchHistory(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchHistory(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
