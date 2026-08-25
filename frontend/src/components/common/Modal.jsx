import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export { Button };

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', icon: Icon }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidth} bg-neutral-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 z-10 overflow-hidden transform transition-all animate-slide-up my-auto`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            {Icon && (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide truncate">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
