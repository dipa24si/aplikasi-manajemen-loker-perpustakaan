import React from 'react';

export default function Badge({ status, text, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = text || status;

  switch (status?.toLowerCase()) {
    // 1. Status Loker Utama: Available (Kosong / Siap)
    case 'available':
    case 'kosong':
    case 'selesai':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (!text) label = 'Available';
      break;

    // 2. Status Loker Utama: Not Available (Terpakai / Rusak)
    case 'not_available':
    case 'terpakai':
    case 'aktif':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      if (!text) label = 'Not Available';
      break;

    case 'rusak':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      if (!text) label = 'Not Available';
      break;

    case 'kunci_hilang':
      colorClasses = 'bg-red-50 text-red-700 border-red-200 font-bold';
      if (!text) label = 'Kunci Hilang';
      break;

    case 'terlambat':
      colorClasses = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
      if (!text) label = 'Overdue';
      break;

    case 'admin':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Admin';
      break;

    case 'petugas':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Petugas';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80"></span>
      {label}
    </span>
  );
}
