"use client";

import { useTheme, type ThemeMode } from "@/components/ttc/theme-provider";
import { cn, parseDateString } from "@/lib/utils";
import { Calendar as CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface DatePickerProps {
  value?: string; // Expected in YYYY-MM-DD format (or DD-MM-YYYY)
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  maxDate?: string | Date; // e.g. "today" or specific date
  minDate?: string | Date;
  id?: string;
  name?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatToDisplay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${d}-${m}-${y}`;
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "DD-MM-YYYY",
  className,
  disabled = false,
  required = false,
  maxDate,
  minDate,
  id,
  name,
}: DatePickerProps) {
  let theme: ThemeMode = "light";
  try {
    const themeContext = useTheme();
    if (themeContext) {
      theme = themeContext.theme;
    }
  } catch {
    theme = "light";
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Month & Year custom dropdown open states (matching ThemeSwitcher design)
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  // Track previous value to adjust state during render (React 19 pattern)
  const [prevValue, setPrevValue] = useState<string>(value);
  const [typedValue, setTypedValue] = useState<string | null>(null);

  // Parse currently selected date
  const selectedDate = value ? parseDateString(value) : null;

  // View state for the calendar (currently displayed month and year)
  const initialDate = selectedDate || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // If external value prop changes, reset typed value and sync view
  if (prevValue !== value) {
    setPrevValue(value);
    setTypedValue(null);
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }

  // Display value for the input field
  const inputValue = typedValue !== null ? typedValue : (selectedDate ? formatToDisplay(selectedDate) : "");

  // Max and Min dates
  const maxDateObj = maxDate ? (maxDate instanceof Date ? maxDate : parseDateString(maxDate)) : null;
  const minDateObj = minDate ? (minDate instanceof Date ? minDate : parseDateString(minDate)) : null;

  // Year range options (1920 to next year)
  const currentYear = new Date().getFullYear();
  const maxYear = maxDateObj ? maxDateObj.getFullYear() : currentYear + 5;
  const minYear = minDateObj ? minDateObj.getFullYear() : 1920;

  const yearOptions: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearOptions.push(y);
  }

  // Position state for portal & auto-flipping
  const [popoverPos, setPopoverPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  // Calculate popover position (detects if space below is limited and flips UPWARDS)
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const calendarHeight = 350;
      const calendarWidth = 290;

      // If not enough space below, flip UPWARDS
      const openUp = spaceBelow < calendarHeight && spaceAbove > spaceBelow;

      // Clamp left position so calendar never goes offscreen
      let left = rect.left;
      if (left + calendarWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - calendarWidth - 16);
      }

      setPopoverPos({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        left,
        openUp,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  // Auto-scroll Month dropdown to selected month when opened
  useEffect(() => {
    if (!isMonthOpen) return;
    const scroll = () => {
      const container = monthListRef.current;
      if (!container) return;
      const selectedEl = container.querySelector('[aria-selected="true"]') as HTMLElement | null;
      if (selectedEl) {
        let offsetTop = 0;
        let curr: HTMLElement | null = selectedEl;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        const targetScroll = offsetTop - (container.clientHeight / 2) + (selectedEl.clientHeight / 2);
        container.scrollTop = Math.max(0, targetScroll);
      }
    };
    scroll();
    const id = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(id);
  }, [isMonthOpen]);

  // Auto-scroll Year dropdown to selected year when opened
  useEffect(() => {
    if (!isYearOpen) return;
    const scroll = () => {
      const container = yearListRef.current;
      if (!container) return;
      const selectedEl = container.querySelector('[aria-selected="true"]') as HTMLElement | null;
      if (selectedEl) {
        let offsetTop = 0;
        let curr: HTMLElement | null = selectedEl;
        while (curr && curr !== container) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        const targetScroll = offsetTop - (container.clientHeight / 2) + (selectedEl.clientHeight / 2);
        container.scrollTop = Math.max(0, targetScroll);
      }
    };
    scroll();
    const id = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(id);
  }, [isYearOpen]);

  // Handle outside click to close popover or dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close Month dropdown if clicked outside of Month dropdown container
      if (
        isMonthOpen &&
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(target)
      ) {
        setIsMonthOpen(false);
      }

      // Close Year dropdown if clicked outside of Year dropdown container
      if (
        isYearOpen &&
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(target)
      ) {
        setIsYearOpen(false);
      }

      // Close datepicker popover if clicked outside container and popover
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMonthOpen, isYearOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isMonthOpen || isYearOpen) {
          setIsMonthOpen(false);
          setIsYearOpen(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMonthOpen, isYearOpen]);

  // Generate calendar days for current viewMonth & viewYear
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDateDisabled = (year: number, month: number, day: number): boolean => {
    const target = new Date(year, month, day, 23, 59, 59);
    if (maxDateObj && target.getTime() > maxDateObj.getTime()) return true;
    const targetStart = new Date(year, month, day, 0, 0, 0);
    if (minDateObj && targetStart.getTime() < minDateObj.getTime()) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const isoString = formatToISO(date);
    setTypedValue(null);
    onChange?.(isoString);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedValue(val);

    // If completely empty, clear
    if (!val.trim()) {
      onChange?.("");
      return;
    }

    // Try parsing
    const parsed = parseDateString(val);
    if (parsed) {
      // Validate bounds
      if (maxDateObj && parsed.getTime() > maxDateObj.getTime()) {
        return; // Don't propagate out of range
      }
      if (minDateObj && parsed.getTime() < minDateObj.getTime()) {
        return;
      }
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      onChange?.(formatToISO(parsed));
    }
  };

  const handleQuickToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const today = new Date();
    if (maxDateObj && today.getTime() > maxDateObj.getTime()) {
      handleSelectDay(maxDateObj.getDate());
      return;
    }
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    handleSelectDay(today.getDate());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTypedValue("");
    onChange?.("");
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  // Theme helper
  const t = (light: string, slate: string, zinc: string) => {
    if (theme === "dark") return zinc;
    if (theme === "solarised") return slate;
    return light;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "h-9 w-full min-w-0 rounded-xl border border-input bg-background pl-3 pr-9 py-2 text-xs font-mono transition-colors outline-none placeholder:text-muted-foreground placeholder:text-xs focus-visible:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-zinc-900/80 dark:border-zinc-800",
            className
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`absolute right-2.5 p-1 rounded-md transition-colors cursor-pointer text-zinc-400 hover:text-amber-500 ${
            isOpen ? "text-amber-500" : ""
          }`}
          title="Open calendar"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Dropdown Popover (rendered in portal ABOVE all dialogs and modals with auto-flipping) */}
      {isOpen && mounted && popoverPos && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: popoverPos.top !== undefined ? `${popoverPos.top}px` : "auto",
            bottom: popoverPos.bottom !== undefined ? `${popoverPos.bottom}px` : "auto",
            left: `${popoverPos.left}px`,
            width: "290px",
            zIndex: 99999,
          }}
          className={cn(
            "rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none",
            t(
              "bg-white/98 border-zinc-200 text-zinc-900 shadow-black/15",
              "bg-slate-900/98 border-slate-700 text-slate-100 shadow-2xl",
              "bg-zinc-950/98 border-zinc-800 text-zinc-100 shadow-2xl"
            )
          )}
        >
          {/* Header: Month & Year Selectors with Navigation */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${t(
                "hover:bg-zinc-100 text-zinc-600",
                "hover:bg-slate-800 text-slate-300",
                "hover:bg-zinc-850 text-zinc-300"
              )}`}
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month & Year Dropdowns (Matching Theme Selector Design with perfect widths) */}
            <div className="flex items-center gap-2">
              {/* Month Dropdown Trigger */}
              <div ref={monthDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMonthOpen(!isMonthOpen);
                    setIsYearOpen(false);
                  }}
                  className={cn(
                    "inline-flex items-center justify-between w-[104px] h-7 px-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all duration-150 outline-none select-none",
                    t(
                      "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800",
                      "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200",
                      "bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 text-zinc-200"
                    ),
                    isMonthOpen && "border-amber-500 ring-2 ring-amber-500/25"
                  )}
                  title="Select month"
                >
                  <span className="truncate">{MONTH_NAMES[viewMonth]}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-200 shrink-0 ml-1",
                      isMonthOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Month Floating Menu (Flush w-[104px] width — fresh DOM element on each open resets scroll) */}
                {isMonthOpen && (
                  <div
                    ref={monthListRef}
                    className={cn(
                      "absolute top-full left-0 mt-1.5 z-[100] w-[104px] rounded-2xl p-1 shadow-2xl border backdrop-blur-md max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150",
                      t(
                        "bg-white text-zinc-900 border-zinc-200 shadow-xl shadow-black/10",
                        "bg-[#0f172a] text-slate-100 border-slate-700 shadow-2xl",
                        "bg-[#121214] text-zinc-100 border-zinc-800 shadow-2xl"
                      )
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      {MONTH_NAMES.map((m, idx) => {
                        const isSel = idx === viewMonth;
                        return (
                          <div
                            key={m}
                            data-month={idx}
                            role="option"
                            aria-selected={isSel}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewMonth(idx);
                              setIsMonthOpen(false);
                            }}
                            className={cn(
                              "relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors outline-none",
                              isSel
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                                : t(
                                    "text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900",
                                    "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                                    "text-zinc-300 hover:bg-zinc-850 hover:text-white"
                                  )
                            )}
                          >
                            <span className="truncate">{m}</span>
                            {isSel && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Year Dropdown Trigger */}
              <div ref={yearDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsYearOpen(!isYearOpen);
                    setIsMonthOpen(false);
                  }}
                  className={cn(
                    "inline-flex items-center justify-between w-[76px] h-7 px-2.5 rounded-xl text-xs font-mono font-semibold cursor-pointer border transition-all duration-150 outline-none select-none",
                    t(
                      "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800",
                      "bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-200",
                      "bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 text-zinc-200"
                    ),
                    isYearOpen && "border-amber-500 ring-2 ring-amber-500/25"
                  )}
                  title="Select year"
                >
                  <span>{viewYear}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-200 shrink-0 ml-1",
                      isYearOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Year Floating Menu (Flush w-[76px] width — fresh DOM element on each open resets scroll) */}
                {isYearOpen && (
                  <div
                    ref={yearListRef}
                    className={cn(
                      "absolute top-full left-0 mt-1.5 z-[100] w-[76px] rounded-2xl p-1 shadow-2xl border backdrop-blur-md max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150",
                      t(
                        "bg-white text-zinc-900 border-zinc-200 shadow-xl shadow-black/10",
                        "bg-[#0f172a] text-slate-100 border-slate-700 shadow-2xl",
                        "bg-[#121214] text-zinc-100 border-zinc-800 shadow-2xl"
                      )
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      {yearOptions.map((y) => {
                        const isSel = y === viewYear;
                        return (
                          <div
                            key={y}
                            data-year={y}
                            role="option"
                            aria-selected={isSel}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewYear(y);
                              setIsYearOpen(false);
                            }}
                            className={cn(
                              "relative flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-mono font-medium cursor-pointer transition-colors outline-none",
                              isSel
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                                : t(
                                    "text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900",
                                    "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                                    "text-zinc-300 hover:bg-zinc-850 hover:text-white"
                                  )
                            )}
                          >
                            <span>{y}</span>
                            {isSel && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${t(
                "hover:bg-zinc-100 text-zinc-600",
                "hover:bg-slate-800 text-slate-300",
                "hover:bg-zinc-850 text-zinc-300"
              )}`}
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Previous month padding days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <span
                  key={`prev-${idx}`}
                  className="h-7 flex items-center justify-center text-[11px] text-zinc-400/40 select-none"
                >
                  {prevDay}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const disabledDay = isDateDisabled(viewYear, viewMonth, day);
              const selected = isSelected(day);
              const current = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-7 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
                    disabledDay && "opacity-25 cursor-not-allowed hover:bg-transparent",
                    !disabledDay && !selected && t(
                      "hover:bg-amber-50 hover:text-amber-700 text-zinc-700",
                      "hover:bg-slate-800 hover:text-amber-400 text-slate-300",
                      "hover:bg-zinc-850 hover:text-amber-400 text-zinc-300"
                    ),
                    current && !selected && "font-bold border border-amber-500/50 text-amber-600 dark:text-amber-400",
                    selected && "bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/30 hover:bg-amber-400"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer: Today & Clear */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={handleQuickToday}
              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
