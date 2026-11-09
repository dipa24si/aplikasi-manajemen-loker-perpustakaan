import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KioskPage from './pages/KioskPage';
import TransaksiPage from './pages/TransaksiPage';
import HistoryPage from './pages/HistoryPage';
import LokerManagePage from './pages/LokerManagePage';
import PetugasPage from './pages/PetugasPage';
import KioskManagePage from './pages/KioskManagePage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // State sidebar sembunyi (collapsed: hanya tampil icon/logo saja)
  // Otomatis sembunyi di layar ponsel (< 768px) agar halaman lega
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  // Deteksi apakah rute adalah halaman Kiosk Mandiri (misal: /sirkulasi, /sayap-kiri, /sayap-kanan, /kiosk)
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const segments = path.split('/');
  const firstSegment = segments[0] || '';
  const secondSegment = segments[1] || '';

  const ADMIN_ROUTES = ['login', 'dashboard', 'admin', 'transaksi', 'history', 'lokers', 'petugas', 'kiosks'];

  // Jika URL adalah /kiosk atau rute tempat kustom seperti /sirkulasi, /sayap-kiri, dll.
  const isKioskRoute =
    firstSegment === 'kiosk' ||
    (firstSegment !== '' && !ADMIN_ROUTES.includes(firstSegment));

  const kioskSlug = firstSegment === 'kiosk' ? secondSegment : firstSegment;

  // Halaman Kiosk Mandiri Standalone (tidak perlu login admin, layar penuh kebiruan)
  if (isKioskRoute) {
    return <KioskPage standalone={true} tempatSlug={kioskSlug} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm text-slate-400">Memuat LockerPerpus...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#faf9f6] text-[#1a1c1a] font-hanken overflow-hidden">
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 min-w-0 h-full">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'transaksi' && <TransaksiPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'lokers' && <LokerManagePage />}
          {activeTab === 'kiosks' && isAdmin && <KioskManagePage setActiveTab={setActiveTab} />}
          {activeTab === 'petugas' && isAdmin && <PetugasPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
