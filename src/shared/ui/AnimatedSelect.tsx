import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type AnimatedSelectOption = {
  value: string;
  label: string;
};

type AnimatedSelectProps = {
  value: string;
  options: AnimatedSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

const exitAnimationMs = 900;

function getNextIndex(currentIndex: number, optionsLength: number): number {
  if (optionsLength === 0) {
    return -1;
  }

  return currentIndex < optionsLength - 1 ? currentIndex + 1 : 0;
}

function getPreviousIndex(currentIndex: number, optionsLength: number): number {
  if (optionsLength === 0) {
    return -1;
  }

  return currentIndex > 0 ? currentIndex - 1 : optionsLength - 1;
}

export function AnimatedSelect({
  value,
  options,
  onChange,
  placeholder = "Выберите значение",
  label,
  disabled = false,
  className = "",
}: AnimatedSelectProps) {
  const selectId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false);
    }, exitAnimationMs);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, selectedIndex]);

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
        event.preventDefault();
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
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((currentIndex) => getNextIndex(currentIndex, options.length));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setActiveIndex((currentIndex) => getPreviousIndex(currentIndex, options.length));
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (activeOption) {
        handleSelect(activeOption.value);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label ? (
        <label
          id={`${selectId}-label`}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
        >
          {label}
        </label>
      ) : null}

      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label ${selectId}` : undefined}
        aria-activedescendant={isOpen && activeOption ? `${listboxId}-${activeOption.value}` : undefined}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={handleButtonKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm font-medium shadow-sm outline-none motion-ui-transition ${
          isOpen
            ? "border-ice-400 bg-white text-slate-900 ring-4 ring-ice-100"
            : "border-slate-200/90 bg-white/92 text-slate-800 hover:border-ice-200 hover:bg-white"
        } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
        <span
          className="motion-chevron block h-2 w-2 shrink-0 border-b-2 border-r-2 border-ice-600"
          style={{ transform: isOpen ? "rotate(-135deg)" : "rotate(45deg)" }}
          aria-hidden="true"
        />
      </button>

      {isRendered ? (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-ice-200 bg-[#f8fbfd] shadow-[0_18px_44px_rgba(15,23,42,0.18)] ${
            isOpen ? "motion-dropdown-enter" : "motion-dropdown-exit"
          }`}
        >
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className="max-h-72 overflow-y-auto p-1.5"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  id={`${listboxId}-${option.value}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm motion-ui-transition ${
                    isSelected
                      ? "bg-ice-500 text-white shadow-sm"
                      : isActive
                        ? "bg-ice-50 text-ice-700"
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
