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
  Monitor
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
        id: 'kiosks',
        label: 'Kelola Kiosk',
        icon: Monitor,
        desc: 'Setup anjungan mandiri'
      },
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
    </aside>
  );
}
