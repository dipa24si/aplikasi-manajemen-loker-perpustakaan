import React from 'react';
import { formatTime, isOverdue } from '../../utils/formatters';
import { User, Clock, MapPin, KeyRound, Lock, Wrench } from 'lucide-react';

export default function LockerCard({ loker, onSelect }) {
  const isAvailable = loker.status === 'kosong';
  const isMaintenance = loker.status === 'rusak';
  const isLockerOverdue = isOverdue(loker.batas_kembali, loker.status);

  let cardStyle = 'bg-rose-50/50 border-rose-300/80 hover:border-rose-500 hover:shadow-rose-600/10';
  if (isAvailable) {
    cardStyle = 'bg-emerald-50/50 border-emerald-300/80 hover:border-emerald-500 hover:shadow-emerald-600/10';
  } else if (isMaintenance) {
    cardStyle = 'bg-amber-50/60 border-amber-300/80 hover:border-amber-500 hover:shadow-amber-600/10';
  }

  return (
    <div
      onClick={() => onSelect(loker)}
      className={`group relative flex flex-col justify-between rounded-xl border p-3 sm:p-3.5 transition-all cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 font-hanken ${cardStyle}`}
    >
      {/* Top Header: Locker Number */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-base sm:text-lg font-black tracking-tight text-[#031633] group-hover:text-[#8b500b] transition-colors">
          {loker.nomor}
        </span>
      </div>

      {/* Lokasi Loker */}
      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#44474e]">
        <MapPin className="w-3 h-3 text-[#8b500b] shrink-0" />
        <span className="truncate">{loker.lokasi || 'Area Umum'}</span>
      </div>

      {/* Middle Body: Peminjam Info / Siap Dipinjam / Maintenance */}
      <div className="my-2 min-h-[36px] flex flex-col justify-center">
        {isMaintenance ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold">
            <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">Maintenance (Perbaikan)</span>
          </div>
        ) : !isAvailable ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs font-bold text-[#031633] truncate" title={loker.member_name || loker.member_id}>
              <User className="w-3 h-3 text-rose-600 shrink-0" />
              <span className="truncate">{loker.member_name || loker.member_id || 'Terpakai'}</span>
            </div>
            {loker.tanggal_pinjam && (
              <div className="flex items-center gap-1 text-[10px] text-[#75777e]">
                <Clock className="w-2.5 h-2.5 text-[#8b500b] shrink-0" />
                <span>{formatTime(loker.tanggal_pinjam)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-emerald-800 font-bold">
            <KeyRound className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">Siap di Petugas</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Badge Status */}
      <div className="pt-2 border-t border-[#e3e2e0]/80 flex items-center justify-between gap-1">
        <span
          className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border whitespace-nowrap ${
            isAvailable
              ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300'
              : isMaintenance
              ? 'bg-amber-100/90 text-amber-900 border-amber-300'
              : 'bg-rose-100/90 text-rose-900 border-rose-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isAvailable ? 'bg-emerald-600' : isMaintenance ? 'bg-amber-600' : 'bg-rose-600'
            }`}
          ></span>
          <span className="truncate">{isAvailable ? 'Available' : isMaintenance ? 'Maintenance' : 'Not Available'}</span>
        </span>

        {isLockerOverdue && (
          <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded-sm animate-pulse border border-red-300 shrink-0">
            Telat
          </span>
        )}
      </div>
    </div>
  );
}
