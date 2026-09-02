import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

/**
 * CustomSelect — Premium dropdown replacement for native <select>
 * Props:
 *   value       — current value (string|number)
 *   onChange    — (value) => void
 *   options     — [{ value, label, icon? }]
 *   placeholder — string shown when no option selected
 *   dark        — bool: use dark/glass theme (for dark backgrounds)
 *   icon        — ReactNode: icon shown on the left of trigger button
 *   className   — wrapper div className
 *   disabled    — bool
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const hasValue = !!selectedOption;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  // ── Trigger styles ──────────────────────────────────────────
  const triggerBase = `
    w-full flex items-center justify-between gap-2
    px-3.5 py-2.5 rounded-xl text-xs font-semibold
    transition-all duration-200 focus:outline-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const triggerLight = `
    bg-white border border-slate-200 hover:border-primary/50
    text-slate-700 shadow-sm
    focus:ring-2 focus:ring-primary/20 focus:border-primary
    ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
  `;

  const triggerDark = `
    bg-white/10 hover:bg-white/15 backdrop-blur-md
    border border-white/15 text-white
    ${isOpen ? 'border-white/30 bg-white/15' : ''}
  `;

  // ── Dropdown panel styles ───────────────────────────────────
  const panelLight = `
    bg-white border border-slate-100 shadow-xl
    divide-y divide-slate-50/80
  `;
  const panelDark = `
    bg-slate-900/95 backdrop-blur-md border border-white/15 shadow-xl
  `;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${triggerBase} ${dark ? triggerDark : triggerLight}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {/* Left icon (optional) */}
          {icon && (
            <span className={`shrink-0 ${dark ? 'text-white/60' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          {/* Selected option's icon (optional) */}
          {selectedOption?.icon && !icon && (
            <span className={`shrink-0 ${dark ? 'text-white/60' : 'text-slate-400'}`}>
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${hasValue ? '' : dark ? 'text-white/40' : 'text-slate-400'}`}>
            {displayLabel}
          </span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${dark ? 'text-white/50' : 'text-slate-400'}`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {isOpen && (
        <>
          {/* Invisible backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div
            className={`
              absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[160px]
              rounded-2xl overflow-hidden
              animate-fadeIn origin-top
              ${dark ? panelDark : panelLight}
            `}
            style={{ maxHeight: '240px', overflowY: 'auto' }}
          >
            {options.length === 0 ? (
              <div className={`px-4 py-3 text-xs ${dark ? 'text-white/40' : 'text-slate-400'}`}>
                ไม่มีตัวเลือก
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full px-4 py-2.5 text-left text-xs font-semibold
                      flex items-center justify-between gap-3
                      transition-colors duration-150 cursor-pointer
                      ${isSelected
                        ? dark
                          ? 'bg-white/15 text-white font-bold'
                          : 'bg-primary/8 text-primary font-bold'
                        : dark
                          ? 'text-white/70 hover:bg-white/8 hover:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                    `}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected
                          ? dark ? 'text-white' : 'text-primary'
                          : dark ? 'text-white/40' : 'text-slate-400'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <span className="leading-relaxed">{opt.label}</span>
                    </span>
                    {isSelected && (
                      <FiCheck className={`w-3.5 h-3.5 shrink-0 ${dark ? 'text-white' : 'text-primary'}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;
