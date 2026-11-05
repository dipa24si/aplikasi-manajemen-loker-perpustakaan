import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import { LogOut, User, Clock, Library } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e9e8e5] px-6 py-3 shadow-[0_1px_8px_rgba(3,22,51,0.03)] font-hanken">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo Universitas Riau" 
            className="w-9 h-9 object-contain drop-shadow-xs"
          />
          <div>
            <h1 className="font-editorial text-lg font-bold text-[#031633] leading-tight">
              Perpustakaan <span className="text-[#8b500b]">UNRI</span>
            </h1>
            <p className="text-[11px] text-[#75777e] font-medium">Sistem Manajemen Loker Mahasiswa</p>
          </div>
        </div>

        {/* Live Clock & Info */}
        <div className="hidden md:flex items-center gap-4 bg-white border border-[#e3e2e0] px-4 py-1.5 rounded-xl text-xs text-[#44474e] shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#8b500b]" />
            <span className="font-mono font-semibold text-[#031633]">{formattedTime}</span>
          </div>
          <span className="text-[#c5c6ce]">|</span>
          <span className="text-[#75777e]">{formattedDate}</span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-full bg-[#031633] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.nama ? user.nama.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#031633] leading-tight">{user?.nama}</p>
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.2 bg-[#ffdcc0] text-[#6b3b00] text-[9px] font-bold rounded-full uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Super Admin' : 'Petugas Sirkulasi'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar dari sistem"
            className="p-2 ml-1 text-[#75777e] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

