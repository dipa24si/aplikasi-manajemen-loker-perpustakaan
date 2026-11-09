import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-[#031633]/5',
      icon: 'text-[#031633]',
      border: 'border-[#031633]/15'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      border: 'border-emerald-200'
    },
    amber: {
      bg: 'bg-[#ffdcc0]',
      icon: 'text-[#6b3b00]',
      border: 'border-[#ffdcc0]'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-700',
      border: 'border-rose-200'
    },
    indigo: {
      bg: 'bg-[#031633]/5',
      icon: 'text-[#031633]',
      border: 'border-[#031633]/15'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl border border-[#e3e2e0] p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all font-hanken">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#75777e] truncate">{title}</p>
          <p className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-mono font-black tracking-tight text-[#031633]">{value}</p>
          {subtitle && (
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#44474e] flex items-center gap-1 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 sm:p-3 rounded-xl border shrink-0 ${scheme.bg} ${scheme.border} ${scheme.icon} shadow-2xs`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

