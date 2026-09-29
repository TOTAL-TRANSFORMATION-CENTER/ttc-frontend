"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AuthCard from "@/components/ttc/auth-card";

type ThemeMode = "light" | "solarised" | "dark";

export default function LoginPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  const bgStyles = {
    light: "from-indigo-50 via-purple-50 to-amber-50/50 text-zinc-900",
    solarised: "from-slate-800 via-slate-900 to-indigo-950 text-slate-100",
    dark: "from-zinc-950 via-zinc-900 to-black text-zinc-50",
  };

  const getToggleItemClass = (mode: ThemeMode) => {
    const isSelected = theme === mode;
    if (isSelected) {
      if (theme === "light") return "bg-white text-zinc-950 shadow-sm";
      if (theme === "solarised") return "bg-slate-800 text-indigo-300 shadow-sm";
      return "bg-zinc-800 text-zinc-50 shadow-sm";
    }
    if (theme === "light") return "text-zinc-600 hover:text-zinc-900";
    if (theme === "solarised") return "text-slate-400 hover:text-slate-200";
    return "text-zinc-500 hover:text-zinc-200";
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center p-4 pt-36 pb-24 sm:pt-4 sm:pb-4 transition-all duration-500 bg-gradient-to-br ${bgStyles[theme]}`}
    >
      {/* Brand logo — links back to home */}
      <div className="absolute top-6 left-4 sm:left-6 md:left-8">
        <Link href="/">
          <Image
            src="/assets/TTC Logo PNG.png"
            alt="Total Transformation Center Logo"
            width={48}
            height={48}
            unoptimized
            className="h-10 w-auto sm:h-12 object-contain drop-shadow-md"
          />
        </Link>
      </div>

      {/* Brand text at center top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-max max-w-[calc(100vw-120px)] sm:max-w-none text-center">
        <span
          className={`text-lg md:text-xl font-bold tracking-tight ${
            theme === "light"
              ? "text-indigo-950"
              : theme === "solarised"
                ? "text-slate-100"
                : "text-zinc-50"
          }`}
        >
          Total Transformation Center
        </span>
      </div>

      {/* Premium Floating Theme Switcher */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:absolute md:top-6 md:right-6 md:bottom-auto md:left-auto md:translate-x-0 flex items-center gap-1 p-1 rounded-full border transition-all duration-300 backdrop-blur-md z-50 ${
          theme === "light"
            ? "bg-zinc-200/50 border-zinc-300/30"
            : theme === "solarised"
              ? "bg-slate-950/50 border-slate-700/30"
              : "bg-zinc-900/50 border-zinc-850/30"
        }`}
      >
        {(["light", "solarised", "dark"] as ThemeMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-300 ${getToggleItemClass(mode)}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Centered Member Auth Card */}
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <AuthCard theme={theme} mode="member" />
      </div>
    </main>
  );
}
