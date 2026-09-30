"use client";

import React from "react";
import { Sun, Moon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeMode } from "./theme-provider";
import { cn } from "@/lib/utils";

/**
 * Custom Solarised icon matching the design with a crescent moon
 * on the bottom-left and sun rays radiating outward from the upper-right.
 */
export function SolarisedIcon({
  className = "h-4 w-4",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Crescent moon in bottom-left */}
      <path d="M11 4.5a5.5 5.5 0 0 0 7.5 7.5 7.5 7.5 0 1 1-7.5-7.5Z" />
      {/* Sun rays radiating from upper right */}
      <line x1="16" y1="2.5" x2="16.5" y2="1.5" />
      <line x1="19" y1="5" x2="20.5" y2="4" />
      <line x1="20.5" y1="8.5" x2="22" y2="8.5" />
      <line x1="19.5" y1="12" x2="21" y2="13" />
    </svg>
  );
}

interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const themeOptions: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "solarised", label: "Solarised", icon: SolarisedIcon },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Pixel-accurate theme switcher dropdown matching the design spec:
 * - Icon-only trigger reflecting the current active theme
 * - Rounded popup card (rounded-2xl) with clean borders & drop shadow
 * - Exact icons: Sun (Light), SolarisedIcon (Solarised), Moon (Dark)
 * - Active item indicator with checkmark (✓) on the right
 * - Subtle rounded hover highlight on items
 * - Fully reactive theme switching with persistent storage
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const currentOption =
    themeOptions.find((o) => o.value === theme) || themeOptions[0];
  const ActiveIcon = currentOption.icon;

  // Trigger button styling tailored per theme
  const triggerStyles: Record<ThemeMode, string> = {
    light:
      "bg-white/90 border-zinc-200/90 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm",
    solarised:
      "bg-slate-800/90 border-slate-700/80 text-slate-200 hover:bg-slate-700/90 hover:text-white shadow-sm",
    dark:
      "bg-zinc-900/90 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white shadow-sm",
  };

  // Popup card container styling per theme
  const contentStyles: Record<ThemeMode, string> = {
    light:
      "bg-white text-zinc-900 border border-zinc-200/90 shadow-xl shadow-black/5 ring-0",
    solarised:
      "bg-[#0f172a] text-slate-100 border border-slate-700/80 shadow-2xl ring-0",
    dark:
      "bg-[#121214] text-zinc-100 border border-zinc-800 shadow-2xl ring-0",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-full h-8 w-8 backdrop-blur-md border outline-none transition-all duration-300 cursor-pointer",
          triggerStyles[theme]
        )}
        aria-label="Select theme"
      >
        <ActiveIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "min-w-[155px] rounded-2xl p-1.5 duration-150 outline-none",
          contentStyles[theme]
        )}
      >
        <div className="flex flex-col gap-0.5">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.value;
            const ItemIcon = opt.icon;

            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-[14px] font-normal cursor-pointer select-none transition-colors outline-none",
                  theme === "light" && [
                    isSelected
                      ? "bg-zinc-100/90 text-zinc-900 font-medium"
                      : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900 focus:bg-zinc-100/70 focus:text-zinc-900",
                  ],
                  theme === "solarised" && [
                    isSelected
                      ? "bg-slate-800/90 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white focus:bg-slate-800/60 focus:text-white",
                  ],
                  theme === "dark" && [
                    isSelected
                      ? "bg-zinc-800/90 text-white font-medium"
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white focus:bg-zinc-800/60 focus:text-white",
                  ]
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span>{opt.label}</span>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 ml-auto" strokeWidth={2.2} />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
