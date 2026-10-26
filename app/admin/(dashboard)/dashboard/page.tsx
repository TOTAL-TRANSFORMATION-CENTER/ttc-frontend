"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import {
  CheckCircle2,
  Clock,
  HeartHandshake,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div
        className={`rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${t(
          "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/80",
          "bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/30",
          "bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/20"
        )}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[11px] uppercase tracking-wider">
              Live Admin Console
            </span>
            <span className={`text-xs ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
              Total Transformation Ministries
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            Welcome to the Pastor &amp; Administrative Dashboard
          </h2>
          <p className={`text-xs sm:text-sm ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Oversee congregation members, track Sunday collections, review church accounts, and coordinate newcomer follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/offerings"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-transform hover:scale-105"
          >
            View Sunday Offerings
          </Link>
          <Link
            href="/admin/new-commers"
            className={`px-4 py-2 rounded-xl border text-xs font-semibold ${t(
              "border-zinc-300 bg-white/50 hover:bg-white",
              "border-slate-700 bg-slate-800/50 hover:bg-slate-800",
              "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
            )}`}
          >
            8 New Comers
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Congregation",
            value: "1,420",
            sub: "+48 members this month",
            icon: Users,
            iconColor: "bg-indigo-500/10 text-indigo-500",
            subIcon: TrendingUp,
            subColor: "text-emerald-700 dark:text-emerald-400",
          },
          {
            label: "Sunday Collections",
            value: "₹2,48,900",
            sub: "+12.4% vs last Sunday",
            icon: HeartHandshake,
            iconColor: "bg-amber-500/10 text-amber-500",
            subIcon: TrendingUp,
            subColor: "text-emerald-700 dark:text-emerald-400",
          },
          {
            label: "New Comers",
            value: "48",
            sub: "8 awaiting pastoral call",
            icon: UserPlus,
            iconColor: "bg-pink-500/10 text-pink-500",
            subIcon: Clock,
            subColor: "text-amber-700 dark:text-amber-400",
          },
          {
            label: "Church Treasury",
            value: "₹18,42,850",
            sub: "Accounts balanced",
            icon: Wallet,
            iconColor: "bg-emerald-500/10 text-emerald-500",
            subIcon: CheckCircle2,
            subColor: "text-emerald-700 dark:text-emerald-400",
          },
        ].map((card) => {
          const Icon = card.icon;
          const SubIcon = card.subIcon;
          return (
            <div
              key={card.label}
              className={`p-5 rounded-2xl border shadow-sm space-y-3 ${t(
                "bg-white border-zinc-200",
                "bg-slate-900 border-slate-800",
                "bg-zinc-950 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold font-serif">{card.value}</span>
                <div className={`flex items-center gap-1 text-[11px] ${card.subColor} font-semibold mt-1`}>
                  <SubIcon className="h-3 w-3" />
                  <span>{card.sub}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sunday Attendance */}
        <div
          className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-4 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif">
                Sunday Services Attendance &amp; Offerings
              </h3>
              <p className={`text-xs ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                Breakdown across the 3 Sunday morning services
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${t("bg-zinc-100 text-zinc-600", "bg-slate-800 text-slate-400", "bg-zinc-800 text-zinc-400")}`}>
              Last Sunday (19 Oct)
            </span>
          </div>

          <div className="space-y-3">
            {[
              { num: "1st", time: "07:00 AM - 09:00 AM", count: "340", amount: "₹64,200", color: "bg-amber-500/10 text-amber-500" },
              { num: "2nd", time: "09:00 AM - 11:00 AM", count: "580 (Main Service)", amount: "₹1,12,500", color: "bg-indigo-500/10 text-indigo-500" },
              { num: "3rd", time: "11:00 AM - 01:00 PM", count: "410", amount: "₹72,200", color: "bg-purple-500/10 text-purple-500" },
            ].map((s) => (
              <div
                key={s.num}
                className={`p-4 rounded-xl border flex items-center justify-between ${t("border-zinc-200/80", "border-slate-800", "border-zinc-800")}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg ${s.color} flex items-center justify-center font-bold text-xs`}>
                    {s.num}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{s.num} Morning Service ({s.time})</h4>
                    <span className={`text-[11px] ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>{s.count} In-Person Attendees</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs font-mono block">{s.amount}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div
          className={`p-6 rounded-2xl border shadow-sm space-y-4 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <h3 className="text-base font-bold font-serif">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: "/admin/family/add", icon: UserPlus, label: "Register New Family" },
              { href: "/admin/offerings", icon: HeartHandshake, label: "Record Sunday Offering" },
              { href: "/admin/new-commers", icon: Sparkles, label: "Add First-Time Visitor" },
            ].map((action) => {
              const AIcon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left group ${t(
                    "border-zinc-200/80 hover:border-amber-500",
                    "border-slate-800 hover:border-amber-500",
                    "border-zinc-800 hover:border-amber-500"
                  )}`}
                >
                  <div className="flex items-center gap-2.5">
                    <AIcon className="h-4 w-4 text-amber-500" />
                    <span>{action.label}</span>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-500" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
