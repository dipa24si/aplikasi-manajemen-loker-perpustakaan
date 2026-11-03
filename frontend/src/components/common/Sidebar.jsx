import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutGrid, 
  CreditCard,
  QrCode, 
  History, 
  Package, 
  Users, 
  Sparkles,
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & Grid',
      icon: LayoutGrid,
      desc: 'Denah loker & statistik'
    },
    {
      id: 'kiosk',
      label: 'Anjungan Mandiri (Kiosk)',
      icon: CreditCard,
      desc: 'Layar Tap KTM Mahasiswa'
    },
    {
      id: 'transaksi',
      label: 'Sirkulasi Kunci',
      icon: QrCode,
      desc: 'Scan QR kunci pengembalian'
    },
    {
      id: 'history',
      label: 'Riwayat & Laporan',
      icon: History,
      desc: 'History & export data'
    },
    {
      id: 'lokers',
      label: 'Kelola Loker',
      icon: Package,
      desc: 'Master nomor & lokasi'
    },
    ...(isAdmin ? [
      {
        id: 'petugas',
        label: 'Kelola Petugas',
        icon: Users,
        desc: 'Akun staf & hak akses'
      }
    ] : [])
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e9e8e5] flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] font-hanken">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold text-[#75777e] uppercase tracking-wider">
          Menu Operasional
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#031633] text-white shadow-md shadow-[#031633]/20'
                  : 'text-[#44474e] hover:bg-[#faf9f6] hover:text-[#031633]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#ffdcc0]' : 'text-[#75777e]'}`} />
              <div>
                <p className="leading-tight font-bold">{item.label}</p>
                <p className={`text-[11px] font-normal ${isActive ? 'text-[#ffdcc0]/90' : 'text-[#75777e]'}`}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* SLiMS Integration Status Box */}
      <div className="p-4 m-3 bg-[#f4f3f0] rounded-2xl border border-[#e3e2e0] text-xs">
        <div className="flex items-center gap-2 text-[#031633] font-bold mb-1">
          <Database className="w-4 h-4 text-[#8b500b]" />
          <span>Integrasi SLiMS 9</span>
        </div>
        <p className="text-[#44474e] text-[11px] leading-relaxed">
          Membaca data keanggotaan mahasiswa langsung dari server perpustakaan.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#6b3b00] font-bold bg-[#ffdcc0] border border-[#ffdcc0] px-2 py-0.5 rounded-full w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          Available / Not Available Mode
        </div>
      </div>
    </aside>
  );
}
