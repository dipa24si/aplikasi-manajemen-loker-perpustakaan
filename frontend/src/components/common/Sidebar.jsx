import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutGrid, 
  QrCode, 
  History, 
  Package, 
  Users, 
  Monitor,
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, collapsed, toggleSidebar }) {
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

  const handleItemClick = (id) => {
    setActiveTab(id);
    // Jika di layar mobile (< 768px), otomatis tutup sidebar drawer
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !collapsed) {
      if (toggleSidebar) toggleSidebar();
    }
  };

  return (
    <>
      {/* Backdrop overlay di layar mobile saat drawer terbuka */}
      {!collapsed && (
        <div 
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Element: Mentok Sampai Bawah (h-full) */}
      <aside
        className={`bg-white border-r border-[#e9e8e5] flex flex-col shrink-0 font-hanken transition-all duration-300 ease-in-out h-full ${
          collapsed
            ? 'hidden md:flex md:w-16'
            : 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl md:static md:w-64 md:shadow-none'
        }`}
      >
        {/* Header Mobile Drawer (< md) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo UNRI" className="w-7 h-7 object-contain" />
            <div>
              <h3 className="font-editorial font-bold text-sm text-[#031633] leading-tight">
                Perpustakaan <span className="text-[#8b500b]">UNRI</span>
              </h3>
              <p className="text-[10px] text-[#75777e] font-medium leading-none mt-0.5">
                Menu Navigasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigasi Menu Items Langsung (Header & Footer bawah telah dihapus sesuai permintaan) */}
        <div className={`flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 ${collapsed ? 'px-1.5' : ''}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`w-full flex items-center transition-all cursor-pointer rounded-xl ${
                  collapsed
                    ? 'justify-center py-3 px-0 text-center relative group'
                    : 'gap-3 px-3 py-2.5 text-left'
                } ${
                  isActive
                    ? 'bg-[#031633] text-white shadow-md shadow-[#031633]/20'
                    : 'text-[#44474e] hover:bg-[#faf9f6] hover:text-[#031633]'
                }`}
              >
                <Icon
                  className={`shrink-0 transition-transform ${
                    collapsed ? 'w-5 h-5' : 'w-5 h-5'
                  } ${isActive ? 'text-[#ffdcc0]' : 'text-[#75777e]'}`}
                />

                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="leading-tight font-bold text-xs truncate">{item.label}</p>
                    <p className={`text-[10.5px] font-normal truncate mt-0.5 ${isActive ? 'text-[#ffdcc0]/80' : 'text-[#75777e]'}`}>
                      {item.desc}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
