import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import { 
  LogOut, 
  User, 
  Clock, 
  Library, 
  Database,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { healthApi } from '../../api';

export default function Navbar({ sidebarCollapsed, toggleSidebar }) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const [sqlStatus, setSqlStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cek status koneksi Database SQL secara berkala
  const checkDatabaseConnection = async () => {
    try {
      const res = await healthApi.check();
      // Axios interceptor otomatis mengembalikan data langsung
      const isConnected = Boolean(
        res?.db === 'connected' || 
        res?.status === 'ok' || 
        res?.data?.db === 'connected'
      );
      if (isConnected) {
        setSqlStatus('connected');
      } else {
        setSqlStatus('disconnected');
      }
    } catch (err) {
      setSqlStatus('disconnected');
    }
  };

  useEffect(() => {
    checkDatabaseConnection();
    const interval = setInterval(checkDatabaseConnection, 15000); // periksa setiap 15 detik
    return () => clearInterval(interval);
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
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e9e8e5] px-3 sm:px-6 py-2.5 sm:py-3 shadow-[0_1px_8px_rgba(3,22,51,0.03)] font-hanken">
      <div className="flex items-center justify-between">
        {/* Brand & Tombol Sembunyikan Sidebar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-[#031633] hover:bg-stone-200/60 active:bg-stone-200 transition-colors cursor-pointer"
            title={sidebarCollapsed ? "Tampilkan Menu Lengkap" : "Sembunyikan Menu (Hanya Tampil Logo/Icon)"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#8b500b]" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-[#031633]" />
            )}
          </button>

          <img 
            src="/logo.png" 
            alt="Logo Universitas Riau" 
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs shrink-0"
          />

          {/* Teks Brand: Pada mobile atau saat sembunyi, hanya logo yang tampil */}
          <div className="hidden sm:block">
            <h1 className="font-editorial text-base sm:text-lg font-bold text-[#031633] leading-tight">
              Perpustakaan <span className="text-[#8b500b]">UNRI</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#75777e] font-medium leading-none">
              Sistem Manajemen Loker Mahasiswa
            </p>
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

        {/* User Info & Actions & SQL Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Koneksi SQL Database */}
          {sqlStatus === 'connected' && (
            <button
              type="button"
              onClick={checkDatabaseConnection}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 text-emerald-700 text-xs font-semibold shadow-2xs select-none transition-colors cursor-pointer"
              title="Database MySQL/MariaDB Terhubung Sempurna. Klik untuk periksa ulang."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-[11px] tracking-wide hidden sm:inline">SQL Terhubung</span>
            </button>
          )}

          {sqlStatus === 'disconnected' && (
            <button
              type="button"
              onClick={checkDatabaseConnection}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold shadow-2xs select-none animate-pulse transition-colors cursor-pointer"
              title="Koneksi ke Database MySQL Terputus! Klik untuk periksa ulang."
            >
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              <Database className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="font-bold text-[11px] tracking-wide hidden sm:inline">SQL Terputus</span>
            </button>
          )}

          {sqlStatus === 'checking' && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 text-xs font-medium shadow-2xs select-none"
            >
              <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse"></span>
              <Database className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px]">Memeriksa SQL...</span>
            </div>
          )}

          <div className="h-6 w-px bg-[#e9e8e5] hidden sm:block"></div>

          <div className="flex items-center gap-2.5 pl-1">
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

