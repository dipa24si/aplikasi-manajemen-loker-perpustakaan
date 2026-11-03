import React, { useState, useEffect } from 'react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { lokerApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Wrench,
  CheckCircle2
} from 'lucide-react';

export default function LokerManagePage() {
  const { isAdmin } = useAuth();
  const [lokers, setLokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoker, setEditingLoker] = useState(null);
  const [formData, setFormData] = useState({
    nomor: '',
    lokasi: '',
    ukuran: 'sedang',
    catatan: ''
  });
  const [modalError, setModalError] = useState('');

  const fetchLokers = async () => {
    setLoading(true);
    try {
      const res = await lokerApi.getAll({ search });
      if (res.data) setLokers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLokers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingLoker(null);
    setFormData({ nomor: '', lokasi: '', ukuran: 'sedang', catatan: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loker) => {
    setEditingLoker(loker);
    setFormData({
      nomor: loker.nomor,
      lokasi: loker.lokasi || '',
      ukuran: loker.ukuran,
      catatan: loker.catatan || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      if (editingLoker) {
        await lokerApi.update(editingLoker.id, formData);
      } else {
        await lokerApi.create(formData);
      }
      setIsModalOpen(false);
      fetchLokers();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data loker.');
    }
  };

  const handleDelete = async (id, nomor) => {
    if (!window.confirm(`Yakin ingin menghapus loker "${nomor}"?`)) return;
    try {
      await lokerApi.delete(id);
      fetchLokers();
    } catch (err) {
      alert(err.message || 'Gagal menghapus loker.');
    }
  };

  const handleToggleStatus = async (loker) => {
    const nextStatus = loker.status === 'rusak' ? 'kosong' : 'rusak';
    try {
      await lokerApi.updateStatus(loker.id, { status: nextStatus });
      fetchLokers();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Master Data Loker
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah nomor loker baru, atur ukuran, lokasi denah, dan pemeliharaan status rusak.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Loker Baru</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor loker, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Nomor Loker</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Lokasi Penempatan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Memuat daftar loker...
                  </td>
                </tr>
              ) : lokers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Belum ada data loker. Silakan tambahkan loker baru.
                  </td>
                </tr>
              ) : (
                lokers.map((loker) => (
                  <tr key={loker.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 text-sm">
                      {loker.nomor}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {loker.ukuran}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {loker.lokasi || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={loker.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {loker.catatan || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Status (Perbaikan vs Siap) */}
                        {loker.status !== 'terpakai' && (
                          <button
                            onClick={() => handleToggleStatus(loker)}
                            title={loker.status === 'rusak' ? 'Tandai Siap' : 'Tandai Rusak'}
                            className={`p-1.5 rounded-lg border text-xs ${
                              loker.status === 'rusak'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {loker.status === 'rusak' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(loker)}
                              title="Edit Loker"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={loker.status === 'terpakai'}
                              onClick={() => handleDelete(loker.id, loker.nomor)}
                              title={loker.status === 'terpakai' ? 'Loker sedang dipinjam' : 'Hapus Loker'}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLoker ? `Edit Loker ${editingLoker.nomor}` : 'Tambah Loker Baru'}
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
              Nomor / Kode Loker
            </label>
            <input
              type="text"
              required
              placeholder="Misal: A-01, B-12"
              value={formData.nomor}
              onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ukuran Loker
            </label>
            <select
              value={formData.ukuran}
              onChange={(e) => setFormData({ ...formData, ukuran: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800"
            >
              <option value="kecil">Kecil (Tas selempang / Laptop)</option>
              <option value="sedang">Sedang (Ransel standar)</option>
              <option value="besar">Besar (Koper mini / Tas carrier)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Lokasi Penempatan
            </label>
            <input
              type="text"
              placeholder="Misal: Lantai 1, Dekat Pintu Masuk"
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Catatan
            </label>
            <input
              type="text"
              placeholder="Catatan kondisi kunci..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
            >
              {editingLoker ? 'Simpan Perubahan' : 'Tambahkan Loker'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

