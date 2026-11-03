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
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#1a1c1a] font-hanken">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'kiosk' && <KioskPage />}
          {activeTab === 'transaksi' && <TransaksiPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'lokers' && <LokerManagePage />}
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
