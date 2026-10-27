"use client";

import { useTheme, type ThemeMode } from "@/components/ttc/theme-provider";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface CustomSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  options?: (string | CustomSelectOption)[];
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  error?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

function getOptionSearchText(opt: CustomSelectOption): string {
  if (typeof opt.label === "string" || typeof opt.label === "number") {
    return String(opt.label);
  }
  return String(opt.value);
}

export function CustomSelect({
  value,
  defaultValue,
  onChange,
  onValueChange,
  options,
  children,
  placeholder = "Select an option...",
  className,
  disabled = false,
  name,
  id,
  error = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  isLoading = false,
  emptyMessage = "No matching options found",
}: CustomSelectProps) {
  let theme: ThemeMode = "light";
  try {
    const themeContext = useTheme();
    if (themeContext) {
      theme = themeContext.theme;
    }
  } catch {
    theme = "light";
  }

  // Parse options from either `options` prop or `<option>` children
  const parsedOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [];
    if (options && options.length > 0) {
      options.forEach((opt) => {
        if (typeof opt === "string") {
          list.push({ value: opt, label: opt });
        } else {
          list.push(opt);
        }
      });
    } else if (children) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as {
            value?: string | number;
            children?: React.ReactNode;
            disabled?: boolean;
          };
          const val = childProps.value !== undefined ? String(childProps.value) : childProps.children?.toString() || "";
          const lbl = childProps.children !== undefined ? childProps.children : val;
          list.push({
            value: val,
            label: lbl,
            disabled: childProps.disabled,
          });
        }
      });
    }
    return list;
  }, [options, children]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue !== undefined ? defaultValue : parsedOptions[0]?.value || ""
  );
  const currentValue = isControlled ? value : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Handle search input changes with debounce for onSearch API callback
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(0);

    if (onSearch) {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
      searchDebounceTimer.current = setTimeout(() => {
        onSearch(query);
      }, 250);
    }
  };

  // Filtered options (instant client-side filtering + compatible with remote API results)
  const filteredOptions = useMemo(() => {
    const list = parsedOptions.filter((opt) => !(opt.value === "" && opt.disabled));
    if (!searchable || !searchQuery.trim()) {
      return list;
    }
    const q = searchQuery.toLowerCase().trim();
    return list.filter((opt) => {
      const text = getOptionSearchText(opt).toLowerCase();
      const val = opt.value.toLowerCase();
      return text.includes(q) || val.includes(q);
    });
  }, [parsedOptions, searchable, searchQuery]);

  // Position state for portal & auto-flip
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);

  // Calculate position and auto-flip direction
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const searchBarHeight = searchable ? 48 : 0;
      const estimatedMenuHeight = Math.min(280, filteredOptions.length * 36 + searchBarHeight + 16);

      // If space below is not enough and space above is greater, flip UPWARDS
      const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

      setMenuPosition({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        left: rect.left,
        width: rect.width,
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
  }, [isOpen, filteredOptions.length, searchable]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        closeDropdown();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        closeDropdown();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Keyboard navigation for search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next < filteredOptions.length ? next : 0;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const prevIdx = prev - 1;
        return prevIdx >= 0 ? prevIdx : filteredOptions.length - 1;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const selected = filteredOptions[highlightedIndex];
        if (!selected.disabled) {
          handleSelect(selected.value);
        }
      }
    }
  };

  const placeholderOption = parsedOptions.find((o) => o.value === "");
  const effectivePlaceholder =
    placeholder !== "Select an option..."
      ? placeholder
      : (placeholderOption ? placeholderOption.label : placeholder);

  const selectedOption = parsedOptions.find((o) => o.value === currentValue && o.value !== "");

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (!isControlled) {
      setInternalValue(val);
    }
    closeDropdown();

    if (onChange) {
      onChange({
        target: { value: val, name: name || "" },
      });
    }
    if (onValueChange) {
      onValueChange(val);
    }
  };

  // Styling tailored to match ThemeSwitcher
  const triggerThemeStyles: Record<ThemeMode, string> = {
    light:
      "bg-white border-zinc-200/90 text-zinc-800 hover:bg-zinc-50/80 focus:border-amber-500 shadow-xs",
    solarised:
      "bg-slate-900/90 border-slate-700/80 text-slate-200 hover:bg-slate-800 focus:border-amber-500 shadow-xs",
    dark:
      "bg-zinc-900/90 border-zinc-800 text-zinc-200 hover:bg-zinc-800 focus:border-amber-500 shadow-xs",
  };

  const menuThemeStyles: Record<ThemeMode, string> = {
    light:
      "bg-white text-zinc-900 border border-zinc-200/90 shadow-2xl shadow-black/15",
    solarised:
      "bg-[#0f172a] text-slate-100 border border-slate-700/80 shadow-2xl",
    dark:
      "bg-[#121214] text-zinc-100 border border-zinc-800 shadow-2xl",
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Hidden native input for form compatibility */}
      <input type="hidden" name={name} id={id} value={currentValue} />

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && (isOpen ? closeDropdown() : setIsOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full h-9 flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm border font-medium outline-none transition-all duration-150 cursor-pointer select-none",
          "focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-500 ring-2 ring-red-500/20",
          triggerThemeStyles[theme],
          className
        )}
      >
        <span
          className={cn(
            "truncate block",
            !selectedOption && "text-muted-foreground text-xs"
          )}
        >
          {selectedOption ? selectedOption.label : effectivePlaceholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200 opacity-60",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Floating Dropdown Menu rendered in portal above all modals with auto-flipping */}
      {isOpen && mounted && menuPosition && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: "fixed",
            top: menuPosition.top !== undefined ? `${menuPosition.top}px` : "auto",
            bottom: menuPosition.bottom !== undefined ? `${menuPosition.bottom}px` : "auto",
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
            zIndex: 99999,
          }}
          className={cn(
            "rounded-2xl p-1.5 duration-150 outline-none max-h-72 flex flex-col shadow-2xl animate-in fade-in zoom-in-95",
            menuThemeStyles[theme]
          )}
        >
          {/* Search Box Header (Shown when searchable flag is enabled) */}
          {searchable && (
            <div className="p-1 pb-1.5 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && !isLoading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-amber-500" />
                )}
              </div>
            </div>
          )}

          {/* Scrollable Options List */}
          <div className="flex-1 overflow-y-auto mt-1 flex flex-col gap-0.5">
            {isLoading && filteredOptions.length === 0 ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching members...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentValue;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-normal cursor-pointer select-none transition-colors outline-none",
                      opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none",
                      theme === "light" && [
                        isSelected
                          ? "bg-zinc-100/90 text-zinc-900 font-semibold"
                          : isHighlighted
                          ? "bg-zinc-100/70 text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900 focus:bg-zinc-100/70 focus:text-zinc-900",
                      ],
                      theme === "solarised" && [
                        isSelected
                          ? "bg-slate-800/90 text-white font-semibold"
                          : isHighlighted
                          ? "bg-slate-800/60 text-white"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white focus:bg-slate-800/60 focus:text-white",
                      ],
                      theme === "dark" && [
                        isSelected
                          ? "bg-zinc-800/90 text-white font-semibold"
                          : isHighlighted
                          ? "bg-zinc-800/60 text-white"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white focus:bg-zinc-800/60 focus:text-white",
                      ]
                    )}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
