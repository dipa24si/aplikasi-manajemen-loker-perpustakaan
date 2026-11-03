import React, { useState, useMemo } from 'react';
import LockerCard from './LockerCard';
import { Search, MapPin, RefreshCw, Layers, LayoutGrid } from 'lucide-react';

export default function LockerGrid({ lokers = [], onSelectLoker, onRefresh, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua'); // 'semua' | 'available' | 'not_available'
  const [locationFilter, setLocationFilter] = useState('semua');
  const [groupByLocation, setGroupByLocation] = useState(true);

  // Ambil daftar lokasi unik secara dinamis
  const uniqueLocations = useMemo(() => {
    const locs = lokers.map((l) => l.lokasi).filter(Boolean);
    return Array.from(new Set(locs)).sort();
  }, [lokers]);

  // Filter loker
  const filteredLokers = useMemo(() => {
    return lokers.filter((loker) => {
      // 1. Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        loker.nomor.toLowerCase().includes(searchLower) ||
        (loker.member_name && loker.member_name.toLowerCase().includes(searchLower)) ||
        (loker.member_id && loker.member_id.toLowerCase().includes(searchLower)) ||
        (loker.lokasi && loker.lokasi.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      // 2. Status: Available (kosong) vs Not Available (terpakai / rusak)
      if (statusFilter === 'available' && loker.status !== 'kosong') return false;
      if (statusFilter === 'not_available' && loker.status === 'kosong') return false;

      // 3. Lokasi
      if (locationFilter !== 'semua' && loker.lokasi !== locationFilter) return false;

      return true;
    });
  }, [lokers, searchTerm, statusFilter, locationFilter]);

  // Hitung jumlah Available vs Not Available
  const counts = useMemo(() => {
    return {
      total: lokers.length,
      available: lokers.filter((l) => l.status === 'kosong').length,
      not_available: lokers.filter((l) => l.status !== 'kosong').length
    };
  }, [lokers]);

  // Kelompokkan berdasarkan Lokasi jika mode grouping aktif
  const groupedLokers = useMemo(() => {
    if (!groupByLocation) return null;

    const groups = {};
    filteredLokers.forEach((loker) => {
      const loc = loker.lokasi || 'Area Umum';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(loker);
    });

    return groups;
  }, [filteredLokers, groupByLocation]);

  return (
    <div className="space-y-4 font-hanken">
      {/* Control Bar: Search & Filter Lokasi & Status */}
      <div className="bg-white p-4 rounded-2xl border border-[#e3e2e0] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#75777e]" />
          <input
            type="text"
            placeholder="Cari nomor loker, lokasi, peminjam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#faf9f6] border border-[#c5c6ce] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 focus:border-[#8b500b] transition-all"
          />
        </div>

        {/* Status Filter: HANYA Available & Not Available */}
        <div className="flex items-center gap-1 bg-[#efeeeb] p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('semua')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'semua' ? 'bg-[#031633] text-white shadow-xs' : 'text-[#44474e] hover:text-[#031633]'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'available' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#44474e] hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Available ({counts.available})
          </button>
          <button
            onClick={() => setStatusFilter('not_available')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'not_available' ? 'bg-rose-700 text-white shadow-xs' : 'text-[#44474e] hover:text-rose-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Not Available ({counts.not_available})
          </button>
        </div>

        {/* Dropdown Filter Lokasi */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-xs font-semibold bg-[#faf9f6] border border-[#c5c6ce] rounded-xl px-3 py-2 text-[#031633] focus:outline-hidden focus:ring-2 focus:ring-[#8b500b]/30 cursor-pointer"
            >
              <option value="semua">📍 Semua Lokasi Lantai</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Grouping per Lokasi */}
          <button
            onClick={() => setGroupByLocation(!groupByLocation)}
            title={groupByLocation ? 'Beralih ke tampilan grid biasa' : 'Kelompokkan berdasarkan lokasi'}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              groupByLocation
                ? 'bg-[#031633] text-white border-[#031633]'
                : 'bg-white text-[#44474e] border-[#c5c6ce] hover:bg-[#faf9f6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Per Lokasi</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Status Loker"
            className="p-2 text-[#75777e] hover:text-[#031633] hover:bg-[#faf9f6] rounded-xl border border-[#c5c6ce] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Konten Loker: Kosong */}
      {filteredLokers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e3e2e0] p-12 text-center">
          <Layers className="w-12 h-12 text-[#c5c6ce] mx-auto mb-3" />
          <h3 className="font-editorial text-lg font-bold text-[#031633]">Tidak ada loker ditemukan</h3>
          <p className="text-xs text-[#75777e] mt-1">Coba sesuaikan kata kunci pencarian atau filter lokasi.</p>
        </div>
      ) : groupByLocation && groupedLokers ? (
        /* TAMPILAN BERDASARKAN KELOMPOK LOKASI */
        <div className="space-y-6">
          {Object.entries(groupedLokers).map(([locName, lokersInLoc]) => (
            <div key={locName} className="bg-white rounded-2xl border border-[#e3e2e0] p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#efeeeb] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#ffdcc0] text-[#6b3b00]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="font-editorial text-base font-bold text-[#031633]">{locName}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {lokersInLoc.filter((l) => l.status === 'kosong').length} Available
                  </span>
                  <span className="text-rose-800 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    {lokersInLoc.filter((l) => l.status !== 'kosong').length} Not Available
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {lokersInLoc.map((loker) => (
                  <LockerCard key={loker.id} loker={loker} onSelect={onSelectLoker} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAMPILAN GRID BIASA */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredLokers.map((loker) => (
            <LockerCard key={loker.id} loker={loker} onSelect={onSelectLoker} />
          ))}
        </div>
      )}
    </div>
  );
}
