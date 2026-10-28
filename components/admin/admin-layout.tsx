"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import ThemeSwitcher from "@/components/ttc/theme-switcher";
import {
  HeartHandshake,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { useFamilyCount } from "@/hooks/use-families";
import { useCurrentUser, getInitials, useAuthActions } from "@/hooks/use-auth";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  hasActionDot?: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: familyCount } = useFamilyCount();
  const { data: currentUser, isLoading } = useCurrentUser();
  const { clearSession } = useAuthActions();

  // User details are loading until API query completes and returns a valid name
  const isUserLoading = isLoading || !currentUser?.name;
  const initials = getInitials(currentUser?.name);
  const displayName = currentUser?.name || "";
  const displayRole = currentUser?.role || "ADMIN";

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("ttc_dismiss_reset_banner") === "true";
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ttc_dismiss_reset_banner", "true");
    }
  };

  // Dynamic sidebar items with live database-driven family count and settings action dot
  const sidebarItems: SidebarItem[] = useMemo(() => [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/families",
      label: "Families",
      icon: Users,
      badge: familyCount !== undefined ? familyCount.toLocaleString() : undefined,
    },
    { href: "/admin/offerings", label: "Offerings", icon: HeartHandshake },
    { href: "/admin/accounts", label: "Accounts", icon: Wallet },
    { href: "/admin/new-commers", label: "New commers", icon: UserPlus, badge: "8 New" },
    { href: "/admin/admin-management", label: "Admin management", icon: ShieldCheck },
    {
      href: "/admin/settings",
      label: "Change password",
      icon: KeyRound,
      hasActionDot: Boolean(!isUserLoading && currentUser?.isReset),
    },
  ], [familyCount, isUserLoading, currentUser?.isReset]);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ttc_dismiss_reset_banner");
      }
      clearSession();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/admin");
    router.refresh();
  };

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const isActive = (href: string) => {
    if (href === "/admin/families") {
      return pathname === href || pathname.startsWith("/admin/family");
    }
    if (href === "/admin/settings") {
      return (
        pathname === "/admin/settings" ||
        pathname.startsWith("/admin/settings/") ||
        pathname === "/admin/change-password" ||
        pathname.startsWith("/admin/change-password/")
      );
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const activeLabel = sidebarItems.find((item) => isActive(item.href))?.label ?? "Admin";

  // Dynamic SEO friendly title based on the active admin screen
  useEffect(() => {
    const pageTitleMap: Record<string, string> = {
      "/admin/dashboard": "Dashboard | TTC Admin Portal",
      "/admin/families": "Family Directory | TTC Admin Portal",
      "/admin/family/add": "Add New Family | TTC Admin Portal",
      "/admin/family/edit": "Edit Family | TTC Admin Portal",
      "/admin/offerings": "Offerings & Collections | TTC Admin Portal",
      "/admin/accounts": "Accounts & Treasury | TTC Admin Portal",
      "/admin/new-commers": "New Comers & Visitors | TTC Admin Portal",
      "/admin/admin-management": "Admin Management & Access Control | TTC Admin Portal",
      "/admin/settings": "Change Password | TTC Admin Portal",
      "/admin/change-password": "Change Password | TTC Admin Portal",
    };

    const matched = Object.entries(pageTitleMap).find(([path]) => pathname.startsWith(path));
    const title = matched ? matched[1] : `${activeLabel} | TTC Admin Portal`;
    document.title = title;
  }, [pathname, activeLabel]);

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

                  <div className="flex items-center gap-2">
                    {item.hasActionDot && (
                      <span
                        className="relative flex h-2.5 w-2.5 shrink-0"
                        title="Action required: Password reset"
                        aria-label="Action required: Password reset"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            active ? "bg-zinc-950 ring-2 ring-amber-400" : "bg-amber-500"
                          }`}
                        />
                      </span>
                    )}

                    {item.badge && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          active
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
                  </div>
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
            {isUserLoading ? (
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-colors select-none ${t(
                  "bg-zinc-50 border-zinc-200/80",
                  "bg-slate-950 border-slate-800",
                  "bg-zinc-900 border-zinc-800"
                )}`}
                aria-busy="true"
                aria-label="Loading administrator profile"
              >
                {/* Glowing Loader Avatar with spinning indicator */}
                <div className="relative h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <div className="h-4 w-4 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                </div>

                {/* Shimmer Placeholder Content */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="h-3 w-28 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-tight animate-pulse truncate">
                      Loading profile...
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${t(
                  "bg-zinc-50 border-zinc-200/80",
                  "bg-slate-950 border-slate-800",
                  "bg-zinc-900 border-zinc-800"
                )}`}
                title={`${displayName}${currentUser?.email ? ` (${currentUser.email})` : ""}\nRole: ${displayRole}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-xs shrink-0 select-none shadow-sm">
                    {initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-xs font-bold leading-tight truncate text-zinc-900 dark:text-zinc-100"
                      title={displayName}
                    >
                      {displayName}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate">
                        {currentUser?.role ? `${currentUser.role} • Active` : "Active Session"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

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

              <button
                type="button"
                onClick={handleLogout}
                className={`flex items-center justify-center p-2 rounded-xl border text-zinc-400 hover:text-red-500 transition-colors cursor-pointer ${t(
                  "border-zinc-200 bg-white hover:bg-zinc-100",
                  "border-slate-800 bg-slate-800 hover:bg-slate-700",
                  "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                )}`}
                title="Logout & Clear Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
            {isUserLoading ? (
              <div
                className="hidden sm:flex items-center gap-2 pr-2 border-r border-zinc-200 dark:border-zinc-800 select-none"
                aria-busy="true"
                aria-label="Loading administrator profile"
              >
                <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                </div>
                <div className="flex flex-col gap-1 text-left min-w-[70px]">
                  <div className="h-2.5 w-18 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-2 w-12 rounded bg-zinc-200/60 dark:bg-zinc-850 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-zinc-200 dark:border-zinc-800">
                <div className="h-7 w-7 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-[11px] select-none shadow-sm">
                  {initials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-none truncate max-w-[130px]" title={displayName}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight">
                    {displayRole}
                  </span>
                </div>
              </div>
            )}
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ─── Mandatory Password Reset Reminder Banner (Dashboard Only & Dismissible) ─── */}
          {currentUser?.isReset && pathname === "/admin/dashboard" && !isBannerDismissed && (
            <div
              className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all animate-in fade-in duration-200 relative ${t(
                "bg-amber-50 border-amber-300 text-amber-950",
                "bg-amber-950/40 border-amber-500/40 text-amber-100",
                "bg-amber-950/30 border-amber-500/30 text-amber-200"
              )}`}
            >
              <div className="flex items-start gap-3.5 pr-8 sm:pr-0">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm leading-tight">
                    Action Required: Please Reset Your Password
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    You are currently signed in with a temporary generated password. Please update your password to secure your administrator account.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                <Link
                  href="/admin/settings"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5 shrink-0"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password Now
                </Link>

                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="absolute top-3.5 right-3.5 sm:static p-1.5 rounded-xl text-amber-800/70 dark:text-amber-200/70 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                  title="Dismiss reminder from dashboard"
                  aria-label="Dismiss reminder from dashboard"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
