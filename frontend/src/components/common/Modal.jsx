import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop (latar belakang gelap) */}
      <div 
        className="fixed inset-0 bg-slate-900/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Container: harus relative z-10 agar berada DI ATAS backdrop */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-2 sm:p-4 text-center pointer-events-none">
        <div 
          className={`w-full ${maxWidth} pointer-events-auto transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-100 max-h-[92vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-[#031633]">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
