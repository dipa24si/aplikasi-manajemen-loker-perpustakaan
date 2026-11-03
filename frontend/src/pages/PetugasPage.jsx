import React, { useState, useEffect } from 'react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { petugasApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  Key, 
  AlertCircle 
} from 'lucide-react';

export default function PetugasPage() {
  const { user: currentUser } = useAuth();
  const [petugasList, setPetugasList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPetugas, setEditingPetugas] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'petugas',
    aktif: 1
  });
  const [modalError, setModalError] = useState('');

  const fetchPetugas = async () => {
    setLoading(true);
    try {
      const res = await petugasApi.getAll();
      if (res.data) setPetugasList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, []);

  const handleOpenAdd = () => {
    setEditingPetugas(null);
    setFormData({ username: '', password: '', nama: '', role: 'petugas', aktif: 1 });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPetugas(p);
    setFormData({
      username: p.username,
      password: '',
      nama: p.nama,
      role: p.role,
      aktif: p.aktif
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      if (editingPetugas) {
        await petugasApi.update(editingPetugas.id, formData);
      } else {
        await petugasApi.create(formData);
      }
      setIsModalOpen(false);
      fetchPetugas();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data petugas.');
    }
  };

  const handleDelete = async (id, nama) => {
    if (id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus akun petugas "${nama}"?`)) return;
    try {
      await petugasApi.delete(id);
      fetchPetugas();
    } catch (err) {
      alert(err.message || 'Gagal menghapus akun.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Manajemen Akun Petugas & Admin
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses staf perpustakaan untuk mengoperasikan sistem loker.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Hak Akses (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Memuat data petugas...
                  </td>
                </tr>
              ) : petugasList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Belum ada petugas terdaftar.
                  </td>
                </tr>
              ) : (
                petugasList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.nama}
                      {p.id === currentUser.id && (
                        <span className="ml-2 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-sm">
                          Akun Anda
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.username}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={p.role} />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Akun"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {p.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(p.id, p.nama)}
                            title="Hapus Akun"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Petugas */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPetugas ? `Edit Petugas: ${editingPetugas.nama}` : 'Tambah Petugas Baru'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              placeholder="Misal: Budi Pratama"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Username Login
            </label>
            <input
              type="text"
              required
              disabled={!!editingPetugas}
              placeholder="Username unik..."
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {editingPetugas ? 'Password Baru (Kosongkan jika tidak ingin ganti)' : 'Password'}
            </label>
            <input
              type="password"
              required={!editingPetugas}
              placeholder={editingPetugas ? 'Biarkan kosong untuk mempertahankan password lama' : 'Password...'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role (Hak Akses)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="petugas">Petugas Sirkulasi</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Akun
              </label>
              <select
                value={formData.aktif}
                onChange={(e) => setFormData({ ...formData, aktif: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value={1}>Aktif (Bisa Login)</option>
                <option value={0}>Nonaktif (Diblokir)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              {editingPetugas ? 'Simpan Perubahan' : 'Buat Akun Petugas'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

