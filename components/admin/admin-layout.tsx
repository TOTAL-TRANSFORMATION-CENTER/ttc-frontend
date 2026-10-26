"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import ThemeSwitcher from "@/components/ttc/theme-switcher";
import {
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/families", label: "Families", icon: Users, badge: "1,420" },
  { href: "/admin/offerings", label: "Offerings", icon: HeartHandshake },
  { href: "/admin/accounts", label: "Accounts", icon: Wallet },
  { href: "/admin/new-commers", label: "New commers", icon: UserPlus, badge: "8 New" },
  { href: "/admin/admin-management", label: "Admin management", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const isActive = (href: string) => {
    if (href === "/admin/families") {
      return pathname === href || pathname.startsWith("/admin/family");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const activeLabel = sidebarItems.find((item) => isActive(item.href))?.label ?? "Admin";

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 font-sans ${t(
        "bg-zinc-100 text-zinc-900",
        "bg-slate-950 text-slate-100",
        "bg-black text-zinc-100"
      )}`}
    >
      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex flex-col justify-between border-r transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${t(
            "bg-white border-zinc-200/80 shadow-xl lg:shadow-none",
            "bg-slate-900 border-slate-800 shadow-xl lg:shadow-none",
            "bg-zinc-950 border-zinc-800 shadow-xl lg:shadow-none"
          )}`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div
            className={`p-6 border-b flex items-center justify-between ${t(
              "border-zinc-200/70",
              "border-slate-800/80",
              "border-zinc-800/80"
            )}`}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/assets/TTC Logo PNG.png"
                alt="Total Transformation Center Logo"
                width={38}
                height={38}
                unoptimized
                className={`h-9 w-auto object-contain transition-transform group-hover:scale-105 ${theme === "light" ? "" : "brightness-0 invert"
                  }`}
              />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight font-serif">
                  TTC Admin
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-amber-500 uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Master Portal
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-1.5 flex-1">
            <span
              className={`px-3 text-[11px] font-bold uppercase tracking-wider block mb-2 ${t(
                "text-zinc-500",
                "text-slate-400",
                "text-zinc-400"
              )}`}
            >
              Management Suite
            </span>

            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                      ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                      : t(
                        "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                        "text-slate-300 hover:bg-slate-800/70 hover:text-white",
                        "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      )
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-zinc-950" : "text-amber-500"}`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${active
                          ? "bg-zinc-950 text-amber-400"
                          : t(
                            "bg-zinc-200 text-zinc-700",
                            "bg-slate-800 text-slate-300",
                            "bg-zinc-800 text-zinc-300"
                          )
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div
            className={`p-4 border-t space-y-3 ${t(
              "border-zinc-200/70",
              "border-slate-800/80",
              "border-zinc-800/80"
            )}`}
          >
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${t(
                "bg-zinc-50 border-zinc-200/80",
                "bg-slate-950 border-slate-800",
                "bg-zinc-900 border-zinc-800"
              )}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-xs">
                  SA
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">Administrator</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Session
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${t(
                  "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100",
                  "border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700",
                  "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                )}`}
              >
                <User className="h-3.5 w-3.5" />
                Member View
              </Link>

              <Link
                href="/"
                className={`flex items-center justify-center p-2 rounded-xl border text-zinc-400 hover:text-red-500 transition-colors ${t(
                  "border-zinc-200 bg-white hover:bg-zinc-100",
                  "border-slate-800 bg-slate-800 hover:bg-slate-700",
                  "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                )}`}
                title="Exit to Church Home"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header
          className={`sticky top-0 z-30 h-16 border-b backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors ${t(
            "bg-white/85 border-zinc-200/80 shadow-sm",
            "bg-slate-900/85 border-slate-800",
            "bg-zinc-950/85 border-zinc-800"
          )}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl border transition-colors ${t(
                "border-zinc-200 text-zinc-600 hover:bg-zinc-100",
                "border-slate-800 text-slate-300 hover:bg-slate-800",
                "border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              )}`}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight capitalize">
                {activeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
