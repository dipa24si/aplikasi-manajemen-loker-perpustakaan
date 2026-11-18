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

  const formatPetugas = (name) => {
    if (!name || name === '-') return '-';
    if (name.toLowerCase().includes('administrator')) return 'Admin Perpus';
    return name;
  };

  const renderDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const formatted = formatDate(dateStr);
    if (!formatted || formatted === '-') return '-';
    const parts = formatted.split(', ');
    if (parts.length === 2) {
      return (
        <span className="leading-tight block">
          <span className="font-semibold text-black block">{parts[0]}</span>
          <span className="text-[7pt] text-slate-500 font-mono block">{parts[1]} WIB</span>
        </span>
      );
    }
    return <span className="text-black">{formatted}</span>;
  };

  const totalDendaPage = items.reduce((sum, item) => sum + (parseFloat(item.denda) || 0), 0);

  return (
    <div id="history-report" className="space-y-5">
      {/* ========================================================
          KOP SURAT RESMI CETAK (HANYA MUNCUL DI PRINT DOKUMEN)
          ======================================================== */}
      <div className="hidden print:flex items-center justify-between border-b-[2.5px] border-double border-black pb-2 mb-2 font-serif">
        <img src="/logo.png" alt="Logo UNRI" className="w-16 h-16 object-contain shrink-0" />
        <div className="flex-1 text-center px-2">
          <h4 className="text-[9.5pt] font-semibold uppercase tracking-wider text-black leading-tight">
            KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
          </h4>
          <h2 className="text-[13pt] font-black uppercase tracking-wider text-black leading-tight mt-0.5">
            UNIVERSITAS RIAU
          </h2>
          <h3 className="text-[10.5pt] font-bold uppercase tracking-wide text-black leading-tight mt-0.5">
            UNIT PENUNJANG AKADEMIK (UPA) PERPUSTAKAAN
          </h3>
          <p className="text-[7.5pt] text-slate-700 font-sans leading-tight mt-1">
            Kampus Bina Widya Km. 12,5 Simpang Baru, Pekanbaru 28293 | Laman: perpus.unri.ac.id
          </p>
          <p className="text-[7.5pt] text-slate-700 font-sans leading-tight">
            Surel: perpustakaan@unri.ac.id | Pos-el: pustaka@unri.ac.id
          </p>
        </div>
        <div className="w-16 shrink-0"></div>
      </div>

      <div className="hidden print:block text-center pb-2 mb-2 font-sans">
        <h3 className="text-[11pt] font-extrabold uppercase tracking-wide text-black">
          LAPORAN RIWAYAT TRANSAKSI PEMINJAMAN LOKER
        </h3>
        <p className="text-[8pt] text-slate-600 mt-0.5">
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
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Total Transaksi: <b className="text-slate-800">{pagination.total}</b> baris</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Total Denda di Halaman Ini: <b className="text-emerald-700 font-bold">{formatRupiah(totalDendaPage)}</b></span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#e3e2e0] shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none font-hanken">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse print:text-[7.5pt]">
            <thead className="print:table-header-group">
              <tr className="bg-[#f4f3f0] text-[#031633] border-b border-[#e3e2e0] uppercase font-bold text-[10px] tracking-wider print:bg-slate-100 print:border-black print:text-[7.5pt]">
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[10%] print:w-[10%]">Loker</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[18%] print:w-[18%]">Nama & NIM</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[16%] print:w-[16%]">Fakultas / Prodi</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[13%] print:w-[13%]">Waktu Pinjam</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[13%] print:w-[13%]">Waktu Kembali</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[10%] print:w-[10%]">Status</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[9%] print:w-[9%] print:text-right">Denda</th>
                <th className="py-3 px-3 print:py-1.5 print:px-1.5 w-[11%] print:w-[11%]">Petugas</th>
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
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5 font-mono font-bold text-slate-800 print:text-black">
                      <span className="block font-bold text-[8.5pt]">{row.nomor_loker}</span>
                      {row.lokasi_loker && (
                        <span className="block text-[6.5pt] font-sans font-normal text-slate-400 uppercase print:text-slate-600 leading-tight">
                          {row.lokasi_loker.replace(/Lantai\s*/i, 'Lt. ')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5">
                      <p className="font-semibold text-slate-800 print:text-black print:text-[8pt] leading-tight">
                        {row.member_name || row.member_id}
                      </p>
                      <p className="text-slate-400 text-[11px] font-mono print:text-slate-600 print:text-[7pt] mt-0.5">
                        {row.member_id}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5">
                      <p className="font-semibold text-slate-800 print:text-black print:text-[7.5pt] leading-tight">
                        {row.member_instansi || row.fakultas || '-'}
                      </p>
                      <p className="text-slate-500 text-[11px] print:text-slate-600 print:text-[7pt] leading-tight mt-0.5">
                        {row.inst_name || row.prodi || '-'}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-slate-700 print:text-black text-[7.5pt]">
                      <div className="print:hidden">{formatDate(row.tanggal_pinjam)}</div>
                      <div className="hidden print:block leading-tight">{renderDateTime(row.tanggal_pinjam)}</div>
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-slate-700 print:text-black text-[7.5pt]">
                      {row.tanggal_kembali ? (
                        <>
                          <div className="print:hidden">{formatDate(row.tanggal_kembali)}</div>
                          <div className="hidden print:block leading-tight">{renderDateTime(row.tanggal_kembali)}</div>
                        </>
                      ) : (
                        <>
                          <span className="print:hidden text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            Sedang Dipinjam
                          </span>
                          <span className="hidden print:inline-block font-semibold text-[7pt] text-amber-900 border border-amber-300 px-1 py-0.5 rounded bg-amber-50">
                            Dipinjam
                          </span>
                        </>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5">
                      <div className="flex flex-col gap-1 items-start print:hidden">
                        <Badge status={row.status} size="sm" />
                        {row.status === 'kunci_hilang' && (
                          <button
                            type="button"
                            onClick={() => handleRecoverLostKey(row)}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
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
                      {/* Tampilan Status Khusus Cetak Print */}
                      <div className="hidden print:block text-[7.5pt] leading-tight">
                        {row.status === 'selesai' ? (
                          <div>
                            <span className="font-semibold text-emerald-900">Selesai</span>
                            {row.catatan && (row.catatan.toLowerCase().includes('hilang') || row.catatan.toLowerCase().includes('pulih')) && (
                              <span className="block text-[6.5pt] text-slate-600 font-normal mt-0.5">
                                (Kunci Pulih)
                              </span>
                            )}
                          </div>
                        ) : row.status === 'kunci_hilang' ? (
                          <span className="font-bold text-red-700 uppercase text-[7pt]">Kunci Hilang</span>
                        ) : (
                          <span className="font-semibold text-blue-900">Aktif</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5 font-medium print:text-right">
                      {parseFloat(row.denda) > 0 ? (
                        <span className="text-rose-600 print:text-black font-bold text-[7.5pt]">{formatRupiah(row.denda)}</span>
                      ) : (
                        <span className="text-slate-400 print:text-slate-600 text-[7.5pt]">Rp 0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-slate-500 text-[11px] print:text-black print:text-[7pt] leading-tight">
                      <div className="print:hidden">
                        <p>Pinjam: {row.petugas_pinjam || '-'}</p>
                        <p>Kembali: {row.petugas_kembali || '-'}</p>
                      </div>
                      <div className="hidden print:block space-y-0.5">
                        <p><span className="text-slate-500 font-medium">P:</span> {formatPetugas(row.petugas_pinjam)}</p>
                        <p><span className="text-slate-500 font-medium">K:</span> {formatPetugas(row.petugas_kembali)}</p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Cetak Laporan (Hanya Muncul Saat Print) */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-6 mt-4 text-xs text-center border-t border-slate-300 break-inside-avoid page-break-inside-avoid">
          <div>
            <p className="text-[8pt] text-slate-700">Petugas Sirkulasi,</p>
            <div className="h-14"></div>
            <p className="font-bold underline text-[8.5pt] text-black">( ............................................ )</p>
            <p className="text-[7.5pt] text-slate-500">NIP / ID Petugas</p>
          </div>
          <div>
            <p className="text-[8pt] text-slate-700">Pekanbaru, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-[8pt] text-slate-700">Mengetahui,</p>
            <p className="font-bold text-[8.5pt] text-black">Kepala UPA Perpustakaan UNRI</p>
            <div className="h-12"></div>
            <p className="font-bold underline text-[8.5pt] text-black">( ............................................ )</p>
            <p className="text-[7.5pt] text-slate-500">NIP.</p>
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
