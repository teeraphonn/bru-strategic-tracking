import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';

/**
 * CustomSelect — High-performance searchable dropdown for large data sets
 * Features:
 *   - Uses React Portal to document.body: completely immune to parent overflow/clipping
 *   - Auto-search filter when list has > 6 items
 *   - Smart direction detection (opens downwards or upwards based on viewport space)
 *   - Auto-scroll to selected option on open
 *   - Dark & Light theme support
 */
const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'กรุณาเลือก...',
  dark = false,
  icon = null,
  className = '',
  disabled = false,
  multiline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUpwards: false,
    maxHeight: 320,
  });

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedItemRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const hasValue = !!selectedOption;

  // Filtered options based on search query
  const filteredOptions = options.filter(opt =>
    (opt.label || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUp = spaceBelow < 280 && spaceAbove > spaceBelow;

    const calculatedMaxHeight = shouldOpenUp
      ? Math.min(380, Math.max(220, spaceAbove - 20))
      : Math.min(380, Math.max(220, spaceBelow - 20));

    const optimalWidth = Math.max(300, rect.width);
    const optimalLeft = Math.max(8, Math.min(rect.left, window.innerWidth - optimalWidth - 8));

    setDropdownPos({
      top: shouldOpenUp ? rect.top - 6 : rect.bottom + 6,
      left: optimalLeft,
      width: optimalWidth,
      openUpwards: shouldOpenUp,
      maxHeight: calculatedMaxHeight,
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Position update & Auto-focus search input & auto-scroll to selected item when opened
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setSearchQuery('');

      if (options.length > 6) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
      if (selectedItemRef.current) {
        setTimeout(() => {
          selectedItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 80);
      }

      // Handle window resize or scrolling (even inside modals)
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, options.length, updatePosition]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // ── Trigger styles ──────────────────────────────────────────
  const triggerBase = `
    w-full flex items-center justify-between gap-2
    px-3.5 py-2.5 rounded-xl text-xs font-semibold
    transition-all duration-200 focus:outline-none select-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const triggerLight = `
    bg-white border border-slate-200 hover:border-primary/60
    text-slate-700 shadow-xs
    focus:ring-2 focus:ring-primary/20 focus:border-primary
    ${isOpen ? 'border-primary ring-2 ring-primary/20 shadow-md' : ''}
  `;

  const triggerDark = `
    bg-white/10 hover:bg-white/15 backdrop-blur-md
    border border-white/15 text-white
    ${isOpen ? 'border-white/30 bg-white/20 ring-2 ring-white/20' : ''}
  `;

  // ── Dropdown panel styles ───────────────────────────────────
  const panelLight = `
    bg-white border border-slate-200/95 shadow-2xl
    divide-y divide-slate-100/80 text-slate-800
  `;
  const panelDark = `
    bg-slate-900 border border-slate-700/90 shadow-2xl
    divide-y divide-slate-800/80 text-white
  `;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`${triggerBase} ${dark ? triggerDark : triggerLight}`}
      >
        <span className="flex items-start gap-2 min-w-0 flex-1 py-0.5 text-left">
          {icon && (
            <span className={`shrink-0 mt-0.5 ${dark ? 'text-white/60' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          {selectedOption?.icon && !icon && (
            <span className={`shrink-0 mt-0.5 ${dark ? 'text-white/60' : 'text-slate-400'}`}>
              {selectedOption.icon}
            </span>
          )}
          {selectedOption?.badge && (
            <span className="shrink-0 font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md bg-purple-50 text-primary border border-purple-200/70 mt-0.5">
              {selectedOption.badge}
            </span>
          )}
          <span className={`leading-snug ${multiline ? 'line-clamp-2 break-words text-xs' : 'truncate'} ${hasValue ? (dark ? 'text-white font-bold' : 'text-slate-800 font-bold') : dark ? 'text-white/40' : 'text-slate-400'}`}>
            {displayLabel}
          </span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 shrink-0 mt-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          } ${dark ? 'text-white/50' : 'text-slate-400'}`}
        />
      </button>

      {/* ── Dropdown Panel (Portal to document.body so it NEVER gets clipped by parent overflows) ── */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999]">
          {/* Backdrop with subtle dim to focus on the popped-up menu */}
          <div
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-[0.5px] transition-opacity duration-150 animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />

          <div
            style={{
              position: 'fixed',
              left: `${dropdownPos.left}px`,
              top: dropdownPos.openUpwards ? 'auto' : `${dropdownPos.top}px`,
              bottom: dropdownPos.openUpwards ? `${window.innerHeight - dropdownPos.top}px` : 'auto',
              width: `${dropdownPos.width}px`,
              maxHeight: `${dropdownPos.maxHeight}px`,
              zIndex: 100000,
            }}
            className={`
              rounded-2xl overflow-hidden shadow-2xl flex flex-col
              transition-all duration-150 transform scale-100 ease-out border ring-1 ring-black/10
              ${dropdownPos.openUpwards ? 'origin-bottom' : 'origin-top'}
              ${dark ? panelDark : panelLight}
            `}
          >
            {/* Quick Search bar when list has > 6 items */}
            {options.length > 6 && (
              <div className={`p-2.5 border-b shrink-0 ${dark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-100 bg-slate-50/95'}`}>
                <div className="relative flex items-center">
                  <FiSearch className={`w-3.5 h-3.5 absolute left-3 ${dark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`พิมพ์เพื่อค้นหา (${options.length} รายการ)...`}
                    className={`
                      w-full pl-8 pr-7 py-2 rounded-lg text-xs font-medium focus:outline-none
                      ${dark 
                        ? 'bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700 focus:border-purple-400' 
                        : 'bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-primary'}
                    `}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Items Container */}
            <div 
              className="overflow-y-auto flex-1 scroll-smooth"
              style={{
                maxHeight: `${Math.max(140, dropdownPos.maxHeight - (options.length > 6 ? 56 : 0))}px`,
                scrollbarWidth: 'thin'
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className={`px-4 py-6 text-center text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
                  ไม่พบรายการที่ค้นหา "{searchQuery}"
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      ref={isSelected ? selectedItemRef : null}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full px-4 py-3 text-left text-xs font-semibold
                        flex items-center justify-between gap-3
                        transition-colors duration-150 cursor-pointer border-b last:border-b-0
                        ${dark ? 'border-slate-800/40' : 'border-slate-50'}
                        ${isSelected
                          ? dark
                            ? 'bg-purple-600/30 text-white font-bold'
                            : 'bg-primary/10 text-primary font-bold'
                          : dark
                            ? 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                            : 'text-slate-700 hover:bg-slate-50/90 hover:text-slate-900'}
                      `}
                    >
                      <span className="flex items-start gap-2.5 min-w-0 flex-1">
                        {opt.icon && (
                          <span className={`shrink-0 mt-0.5 ${isSelected
                            ? dark ? 'text-white' : 'text-primary'
                            : dark ? 'text-white/40' : 'text-slate-400'}`}>
                            {opt.icon}
                          </span>
                        )}
                        {opt.badge && (
                          <span className={`shrink-0 font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md mt-0.5 border ${
                            isSelected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                        <span className="leading-snug break-words">{opt.label}</span>
                      </span>
                      {isSelected && (
                        <FiCheck className={`w-4 h-4 shrink-0 ${dark ? 'text-purple-300' : 'text-primary'}`} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
