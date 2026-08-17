import React, { useRef, useEffect } from 'react';
import { Delete, RotateCcw, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../services/sound';

interface DigitalKeypadProps {
  value: string;
  onChange: (newValue: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const DigitalKeypad: React.FC<DigitalKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Auto focus input whenever enabled on desktop devices only
  useEffect(() => {
    if (!disabled && inputRef.current && !isTouchDevice) {
      inputRef.current.focus();
    }
  }, [disabled, isTouchDevice]);

  // Global keydown handler for physical desktop keyboard support
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on input, let input's native events handle standard text typing
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (value !== '' && value !== '-') {
            soundFx.playClick();
            onSubmit();
          }
        }
        return;
      }

      // If focus is off the input element (e.g. clicked button):
      if (e.key >= '0' && e.key <= '9') {
        soundFx.playClick();
        if (value === '0') {
          onChange(e.key);
        } else {
          onChange(value + e.key);
        }
      } else if (e.key === '-' || e.key === 'Subtract') {
        soundFx.playClick();
        if (value.startsWith('-')) {
          onChange(value.substring(1));
        } else {
          if (value === '' || value === '0') {
            onChange('-');
          } else {
            onChange('-' + value);
          }
        }
      } else if (e.key === 'Backspace') {
        soundFx.playClick();
        if (value.length <= 1) {
          onChange('');
        } else {
          onChange(value.slice(0, -1));
        }
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        soundFx.playClick();
        onChange('');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (value !== '' && value !== '-') {
          soundFx.playClick();
          onSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, disabled, onChange, onSubmit]);

  const handleNumClick = (num: string) => {
    if (disabled) return;
    soundFx.playClick();
    if (value === '0') {
      onChange(num);
    } else {
      onChange(value + num);
    }
    if (!isTouchDevice) {
      inputRef.current?.focus();
    }
  };

  const handleToggleSign = () => {
    if (disabled) return;
    soundFx.playClick();
    if (value.startsWith('-')) {
      onChange(value.substring(1));
    } else {
      if (value === '' || value === '0') {
        onChange('-');
      } else {
        onChange('-' + value);
      }
    }
    if (!isTouchDevice) {
      inputRef.current?.focus();
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    soundFx.playClick();
    if (value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
    if (!isTouchDevice) {
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    if (disabled) return;
    soundFx.playClick();
    onChange('');
    if (!isTouchDevice) {
      inputRef.current?.focus();
    }
  };

  const handlePressSubmit = () => {
    if (disabled) return;
    soundFx.playClick();
    onSubmit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, single minus, or integer digits (with optional leading minus)
    if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto p-3 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-inner select-none">
      {/* Interactive Input Display Screen */}
      <div className="mb-3">
        {isTouchDevice ? (
          /* Mobile / Smart Phone: Read-only display without triggering native OS on-screen keyboard */
          <div
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-right text-2xl font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 min-h-[52px] flex items-center justify-end shadow-sm select-none"
          >
            {value ? (
              <span>{value}</span>
            ) : (
              <span className="text-slate-300 dark:text-slate-600 text-sm font-sans font-normal">
                กดปุ่มตัวเลขด้านล่าง...
              </span>
            )}
          </div>
        ) : (
          /* Desktop PC: Native input field supporting keyboard typing & Enter */
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoFocus
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            placeholder="พิมพ์คำตอบ หรือใช้ปุ่มตัวเลข..."
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 text-right text-2xl font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 min-h-[52px] focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder:font-sans placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:text-sm placeholder:font-normal"
          />
        )}
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleNumClick('7')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('8')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('9')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          9
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          title="ล้างทั้งหมด"
          className="keypad-btn h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 font-bold text-sm shadow-sm border border-rose-200 dark:border-rose-800/50 flex items-center justify-center transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => handleNumClick('4')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('5')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('6')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          6
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          title="ลบทีละตัว"
          className="keypad-btn h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-400 font-bold text-sm shadow-sm border border-amber-200 dark:border-amber-800/50 flex items-center justify-center transition"
        >
          <Delete className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => handleNumClick('1')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('2')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleNumClick('3')}
          disabled={disabled}
          className="keypad-btn h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          3
        </button>
        <button
          type="button"
          onClick={handleToggleSign}
          disabled={disabled}
          title="เครื่องหมายบวก/ลบ"
          className="keypad-btn h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-lg shadow-sm border border-indigo-200 dark:border-indigo-800 flex items-center justify-center transition"
        >
          + / -
        </button>

        {/* Bottom row */}
        <button
          type="button"
          onClick={() => handleNumClick('0')}
          disabled={disabled}
          className="keypad-btn col-span-2 h-12 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-600 active:bg-indigo-50 transition"
        >
          0
        </button>
        <button
          type="button"
          onClick={handlePressSubmit}
          disabled={disabled || value === '' || value === '-'}
          className="keypad-btn col-span-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-md flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-5 h-5" />
          ส่งคำตอบ
        </button>
      </div>
    </div>
  );
};
