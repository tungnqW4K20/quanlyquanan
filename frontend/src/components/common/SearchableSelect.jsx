import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm nhanh...',
  disabled = false,
  className = '',
  renderOption,
  renderSelected,
  allowClear = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const label = (opt.label || opt.name || '').toLowerCase();
    const subLabel = (opt.subLabel || opt.category || opt.unit || '').toLowerCase();
    return label.includes(term) || subLabel.includes(term);
  });

  const handleSelect = (opt) => {
    onChange?.(opt.value, opt);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('', null);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
          disabled
            ? 'bg-neutral-800/40 border-neutral-800 text-neutral-500 cursor-not-allowed'
            : isOpen
            ? 'bg-neutral-900 border-amber-500 shadow-lg shadow-amber-500/10 text-white'
            : 'bg-neutral-900/90 border-neutral-700/80 hover:border-neutral-600 text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {selectedOption ? (
            renderSelected ? (
              renderSelected(selectedOption)
            ) : (
              <span className="font-medium text-amber-300 truncate">
                {selectedOption.label || selectedOption.name}
              </span>
            )
          ) : (
            <span className="text-neutral-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          {allowClear && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-neutral-900 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-neutral-800 bg-neutral-950/60">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-neutral-900 border border-neutral-700/80 focus:border-amber-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none transition"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-center text-neutral-500">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 font-medium'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {renderOption ? (
                        renderOption(opt, isSelected)
                      ) : (
                        <div className="truncate">
                          <div className="truncate">{opt.label || opt.name}</div>
                          {opt.subLabel && (
                            <div className="text-[11px] text-neutral-500">{opt.subLabel}</div>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
