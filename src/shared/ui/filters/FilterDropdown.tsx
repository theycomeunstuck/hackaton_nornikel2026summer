import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export type FilterOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Выберите значение",
  disabled = false,
  className = "",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label ? <span className="sr-only">{label}</span> : null}
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleButtonKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm font-medium shadow-sm outline-none transition ${
          isOpen
            ? "border-ice-400 bg-white text-slate-900 ring-4 ring-ice-100"
            : "border-slate-200/90 bg-white/92 text-slate-800 hover:border-ice-200"
        } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
        <span
          className={`shrink-0 text-xs font-semibold text-ice-600 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-ice-200 bg-[#f8fbfd] shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
          <div
            role="listbox"
            aria-label={label}
            className="max-h-72 overflow-y-auto p-1.5"
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-ice-500 text-white shadow-sm"
                      : "text-slate-800 hover:bg-ice-50 hover:text-ice-700"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected ? <span className="text-xs font-semibold">выбрано</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
