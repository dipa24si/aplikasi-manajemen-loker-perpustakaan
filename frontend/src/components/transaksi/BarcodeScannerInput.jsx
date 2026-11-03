import React, { useRef, useEffect } from 'react';
import { ScanLine, X } from 'lucide-react';

export default function BarcodeScannerInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = 'Scan barcode atau ketik lalu tekan Enter...', 
  autoFocus = true,
  disabled = false
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value && value.trim()) {
        onSubmit(value.trim());
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
        <ScanLine className="w-5 h-5 text-indigo-500 animate-pulse" />
      </div>

      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 text-sm bg-white border-2 border-slate-200 rounded-xl font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs transition-all disabled:bg-slate-100"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

