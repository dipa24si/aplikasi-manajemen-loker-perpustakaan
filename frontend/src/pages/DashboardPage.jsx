import React, { useState, useEffect } from 'react';
import StatCard from '../components/common/StatCard';
import LockerGrid from '../components/loker/LockerGrid';
import LockerDetailModal from '../components/loker/LockerDetailModal';
import QuickPinjamModal from '../components/transaksi/QuickPinjamModal';
import QuickKembaliModal from '../components/transaksi/QuickKembaliModal';
import Badge from '../components/common/Badge';
import { dashboardApi, lokerApi } from '../api';
import { formatDate } from '../utils/formatters';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  History,
  RotateCcw
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [lokers, setLokers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedLoker, setSelectedLoker] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPinjamOpen, setIsPinjamOpen] = useState(false);
  const [isKembaliOpen, setIsKembaliOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, lokersRes] = await Promise.all([
        dashboardApi.getStats(),
        lokerApi.getAll()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (lokersRes.data) setLokers(lokersRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLoker = (loker) => {
    setSelectedLoker(loker);
    setIsDetailOpen(true);
  };

  const handleOpenPinjamFromLoker = (loker) => {
    setSelectedLoker(loker);
    setIsPinjamOpen(true);
  };

  const handleOpenKembaliFromLoker = (loker) => {
    setSelectedLoker(loker);
    setIsKembaliOpen(true);
  };

  const handleUpdateStatus = async (id, status) => {
    await lokerApi.updateStatus(id, { status });
    fetchData();
  };

  const availableLokers = lokers.filter((l) => l.status === 'kosong');

  return (
    <div className="space-y-6">
      {/* 1. Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[#031633] tracking-tight">
            Dashboard Sirkulasi Loker
          </h2>
          <p className="text-xs text-[#75777e] mt-0.5">
            Pantau ketersediaan loker, transaksi aktif, dan status pengembalian secara real-time.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedLoker(null);
              setIsPinjamOpen(true);
            }}
            disabled={availableLokers.length === 0}
            className="flex items-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="text-[#ffdcc0] font-bold text-sm">+</span>
            <span>Pinjamkan Loker</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Loker"
          value={stats?.lokers?.total || lokers.length || 0}
          subtitle="Kapasitas loker perpus"
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Loker Available"
          value={stats?.lokers?.kosong || availableLokers.length || 0}
          subtitle="Siap untuk dipinjamkan"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Loker Not Available"
          value={(stats?.lokers?.terpakai || 0) + (stats?.lokers?.rusak || 0)}
          subtitle={`${stats?.lokers?.terpakai || 0} dipinjam, ${stats?.lokers?.rusak || 0} perbaikan`}
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Kunci Belum Kembali"
          value={stats?.peminjaman?.aktif || 0}
          subtitle={`${stats?.peminjaman?.kunci_hilang || 0} kunci hilang dilaporkan`}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* 3. Main Locker Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-editorial text-lg font-bold text-[#031633]">
            Denah & Status Loker
          </h3>
          <span className="text-xs text-[#75777e]">
            Klik salah satu kotak loker untuk melihat data peminjam atau proses transaksi
          </span>
        </div>

        <LockerGrid
          lokers={lokers}
          onSelectLoker={handleSelectLoker}
          onRefresh={fetchData}
          loading={loading}
        />
      </div>

      {/* 4. Recent Activities Feed */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e3e2e0] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#8b500b]" />
              <h3 className="font-editorial text-base font-bold text-[#031633]">
                Aktivitas Peminjaman Terbaru
              </h3>
            </div>
            <span className="text-xs text-[#75777e]">8 transaksi terakhir</span>
          </div>

          <div className="divide-y divide-[#efeeeb]">
            {stats.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#031633] bg-[#f4f3f0] px-2 py-1 rounded-md border border-[#e3e2e0]">
                    {act.nomor_loker}
                  </span>
                  <div>
                    <p className="font-bold text-[#031633]">{act.nama_anggota}</p>
                    <p className="text-[#75777e] text-[11px]">
                      ID: {act.member_id} • Dilayani oleh: {act.nama_petugas_pinjam || 'Petugas'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-[#1a1c1a]">{formatDate(act.tanggal_pinjam)}</p>
                    <p className="text-[11px] text-[#75777e]">
                      {act.tanggal_kembali ? `Kembali: ${formatDate(act.tanggal_kembali)}` : 'Belum kembali'}
                    </p>
                  </div>
                  <Badge status={act.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {isDetailOpen && selectedLoker && (
        <LockerDetailModal
          loker={selectedLoker}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onOpenPinjam={handleOpenPinjamFromLoker}
          onOpenKembali={handleOpenKembaliFromLoker}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {isPinjamOpen && (
        <QuickPinjamModal
          loker={selectedLoker}
          availableLokers={availableLokers}
          isOpen={isPinjamOpen}
          onClose={() => setIsPinjamOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {isKembaliOpen && selectedLoker && (
        <QuickKembaliModal
          loker={selectedLoker}
          isOpen={isKembaliOpen}
          onClose={() => setIsKembaliOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

