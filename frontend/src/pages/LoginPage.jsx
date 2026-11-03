import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Silakan masukkan username dan password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa kembali akun Anda.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#faf9f6] flex items-center justify-center p-4 relative antialiased selection:bg-[#ffb066] selection:text-[#031633] font-hanken">
      {/* Background ambient warm decorative glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#ffdcc0]/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#031633]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 sm:p-8 border border-[#e3e2e0] relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Logo Universitas Riau"
            className="w-18 h-18 object-contain mx-auto mb-2.5 drop-shadow-md"
          />
          <h2 className="font-editorial text-2xl font-bold text-[#031633] tracking-tight">
            Perpustakaan <span className="text-[#8b500b]">Universitas Riau</span>
          </h2>
          <p className="text-xs text-[#44474e] mt-1 font-medium">
            Sistem Manajemen Peminjaman Loker Mahasiswa
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-2.5 bg-[#ffdcc0]/80 text-[#6b3b00] text-[10px] font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Portal Masuk Petugas & Admin</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1a1c1a] uppercase tracking-wider mb-1">
              Username / NIP
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 absolute left-3.5 text-[#75777e] pointer-events-none" />
              <input
                type="text"
                placeholder="Masukkan username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#faf9f6] border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] font-medium text-[#1a1c1a] placeholder:text-[#75777e]/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1a1c1a] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-[#75777e] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#faf9f6] border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] font-medium text-[#1a1c1a] placeholder:text-[#75777e]/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Tampilkan sandi"
                className="absolute right-3 text-[#75777e] hover:text-[#1a1c1a] transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#031633] hover:bg-[#1a2b49] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#031633]/20 transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>{loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}</span>
            <ArrowRight className="w-4 h-4 text-[#ffdcc0]" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[#e9e8e5]">
          <p className="text-[10px] font-bold text-[#75777e] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8b500b]" />
            <span>Akun Cepat (Uji Coba Demo):</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount('admin', 'admin123')}
              className="py-2 px-3 text-xs font-semibold text-[#031633] bg-[#f4f3f0] hover:bg-[#ffdcc0]/60 hover:border-[#8b500b]/40 border border-[#e3e2e0] rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>👑</span>
              <span>Login Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('petugas', 'petugas123')}
              className="py-2 px-3 text-xs font-semibold text-[#031633] bg-[#f4f3f0] hover:bg-[#ffdcc0]/60 hover:border-[#8b500b]/40 border border-[#e3e2e0] rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>💼</span>
              <span>Login Petugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="absolute bottom-3 text-center text-xs text-[#75777e] pointer-events-none">
        <p>© 2026 UPT Perpustakaan Universitas Riau • Kampus Bina Widya Km. 12,5</p>
      </div>
    </div>
  );
}
