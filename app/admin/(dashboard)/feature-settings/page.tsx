"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Heart,
  Loader2,
  MessageSquare,
  QrCode,
  Shield,
  Smartphone,
  Sparkles,
  ToggleRight,
  UserCheck,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BannerAlert } from "@/components/ui/banner-alert";
import type {
  AttendancePortalStatus,
  AttendancePortalMode,
  FeatureTabKey,
} from "@/types";

type PortalStatus = AttendancePortalStatus;

export default function FeatureSettingsPage() {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "dark") return dark;
    if (theme === "solarised") return solarised;
    return light;
  };

  // ─── Active Tab inside Feature Settings ───
  const [activeTab, setActiveTab] = useState<FeatureTabKey>("attendance");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [selectedMode, setSelectedMode] = useState<AttendancePortalMode>("AUTOMATIC");

  const [banner, setBanner] = useState<{
    variant: "success" | "error" | "info" | "warning";
    title?: string;
    message: string;
  } | null>(null);

  // 1. Fetch live status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/attendance/status");
      const json = await res.json();
      if (json.success && json.data) {
        setPortalStatus(json.data);
        setSelectedMode(json.data.mode);
      }
    } catch (err) {
      console.error("Fetch status error:", err);
      setBanner({
        variant: "error",
        title: "Connection Failed",
        message: "Could not fetch current portal status.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 2. Save portal mode
  const handleSaveMode = async () => {
    try {
      setSaving(true);
      setBanner(null);

      const res = await fetch("/api/attendance/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });

      const json = await res.json();
      if (json.success) {
        setPortalStatus(json.data);
        setBanner({
          variant: "success",
          title: "Settings Updated",
          message: `Attendance portal mode successfully changed to ${json.data.mode}.`,
        });
      } else {
        setBanner({
          variant: "error",
          title: "Update Failed",
          message: json.message || "Failed to save settings.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setBanner({
        variant: "error",
        title: "Network Error",
        message: "Failed to update system settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Top Banner ─── */}
      {banner && (
        <BannerAlert
          variant={banner.variant}
          title={banner.title}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ─── Standard TTC Page Header (Matching existing admin pages) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <ToggleRight className="h-6 w-6 text-amber-500" />
            Feature Settings
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Manage system features, self-service portals, and runtime configuration flags.
          </p>
        </div>
      </div>

      {/* ─── Feature Settings Tabs at the Top ─── */}
      <div
        className={`flex items-center gap-1 p-1 rounded-xl border flex-wrap ${t(
          "bg-zinc-100 border-zinc-200",
          "bg-slate-900 border-slate-700",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "attendance"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-amber-500" />
          Attendance Settings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portals")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "portals"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-amber-500" />
          Self-Service Portals
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("giving")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "giving"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          Giving &amp; Treasury
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("communications")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === "communications"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
          Notifications &amp; Alerts
        </button>
      </div>

      {/* ─── TAB 1: ATTENDANCE SETTINGS ─── */}
      {activeTab === "attendance" && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${t(
            "bg-white border-zinc-200",
            "bg-slate-800/80 border-slate-700",
            "bg-zinc-900/80 border-zinc-800"
          )}`}
        >
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100">
                    Sunday QR Attendance Portal Settings
                  </h2>
                  {portalStatus && (
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-semibold ${
                        portalStatus.isOpen
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      }`}
                    >
                      ● {portalStatus.isOpen ? "PORTAL OPEN" : "PORTAL CLOSED"}
                    </Badge>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                  Configure the runtime operating mode for the public Sunday QR code check-in portal (<code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]">/attendance</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/attendance"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${t(
                  "border-zinc-200 hover:bg-zinc-100 text-zinc-700",
                  "border-slate-700 hover:bg-slate-700 text-slate-300",
                  "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                )}`}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview Portal
              </Link>
            </div>
          </div>

          {/* Live IST Details */}
          {portalStatus && (
            <div
              className={`my-4 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${t(
                "bg-zinc-50 border-zinc-200 text-zinc-600",
                "bg-slate-900/60 border-slate-700 text-slate-300",
                "bg-zinc-950/60 border-zinc-800 text-zinc-300"
              )}`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Server Time (IST): <strong>{portalStatus.currentTimeIST}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Active Service Date: <strong>{portalStatus.serviceDate}</strong>
                </span>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                {portalStatus.isSunday ? "Today is Sunday" : "Non-Sunday Service Day"}
              </Badge>
            </div>
          )}

          {/* Mode Selection Options */}
          <div className="space-y-3 mt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 block mb-2">
              Select Portal Operating Mode:
            </label>

            {/* Option 1: Automatic */}
            <div
              onClick={() => setSelectedMode("AUTOMATIC")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedMode === "AUTOMATIC"
                  ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20"
                  : t(
                      "border-zinc-200 bg-white hover:border-zinc-300",
                      "border-slate-700 bg-slate-800/40 hover:border-slate-600",
                      "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    )
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="portalMode"
                  value="AUTOMATIC"
                  checked={selectedMode === "AUTOMATIC"}
                  onChange={() => setSelectedMode("AUTOMATIC")}
                  className="w-4 h-4 mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm block text-zinc-900 dark:text-zinc-100">
                      Automatic (Sundays 7:00 AM – 12:00 AM Midnight IST)
                    </span>
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-zinc-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    The portal opens automatically on Sundays from 7:00 AM in the morning until 12:00 AM midnight (IST). Outside these hours, visitors are shown a polite closed card with service timings and welcome desk details.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Force Open */}
            <div
              onClick={() => setSelectedMode("FORCE_OPEN")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedMode === "FORCE_OPEN"
                  ? "border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20"
                  : t(
                      "border-zinc-200 bg-white hover:border-zinc-300",
                      "border-slate-700 bg-slate-800/40 hover:border-slate-600",
                      "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    )
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="portalMode"
                  value="FORCE_OPEN"
                  checked={selectedMode === "FORCE_OPEN"}
                  onChange={() => setSelectedMode("FORCE_OPEN")}
                  className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-sm block text-emerald-600 dark:text-emerald-400">
                    Force Open (Always Open Anytime)
                  </span>
                  <p className="text-zinc-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Overrides the Sunday schedule and opens the public QR portal immediately. Use this for weekday special services, fasting prayers, night vigils, or staff testing.
                  </p>
                </div>
              </div>
            </div>

            {/* Option 3: Force Closed */}
            <div
              onClick={() => setSelectedMode("FORCE_CLOSED")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedMode === "FORCE_CLOSED"
                  ? "border-red-500 ring-1 ring-red-500/30 bg-red-50/20 dark:bg-red-950/20"
                  : t(
                      "border-zinc-200 bg-white hover:border-zinc-300",
                      "border-slate-700 bg-slate-800/40 hover:border-slate-600",
                      "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    )
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="portalMode"
                  value="FORCE_CLOSED"
                  checked={selectedMode === "FORCE_CLOSED"}
                  onChange={() => setSelectedMode("FORCE_CLOSED")}
                  className="w-4 h-4 mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-sm block text-red-600 dark:text-red-400">
                    Force Closed (Disable Public Check-in)
                  </span>
                  <p className="text-zinc-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Immediately locks the public portal for all visitors, even if it is currently Sunday morning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-slate-400">
              Changes take effect immediately across all devices.
            </span>
            <Button
              disabled={saving || loading || selectedMode === portalStatus?.mode}
              onClick={handleSaveMode}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 font-semibold shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SELF-SERVICE PORTALS ─── */}
      {activeTab === "portals" && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${t(
            "bg-white border-zinc-200",
            "bg-slate-800/80 border-slate-700",
            "bg-zinc-900/80 border-zinc-800"
          )}`}
        >
          <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-500" /> Self-Service Public Portals
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Manage public guest check-in links, online registrations, and member self-service gateways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Newcomer Self-Registration
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Public QR form allowing first-time guests to register contact details and prayer requests upon arriving at service.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-4 h-4 text-pink-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Matrimonial Alliance Portal
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Secure matrimonial portal enabling registered unmarried members to browse and connect for marriage alliances.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Member Profile Self-Service
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Allow church members to update phone numbers, addresses, and family demographics directly through OTP login.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: GIVING & TREASURY ─── */}
      {activeTab === "giving" && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${t(
            "bg-white border-zinc-200",
            "bg-slate-800/80 border-slate-700",
            "bg-zinc-900/80 border-zinc-800"
          )}`}
        >
          <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" /> Giving &amp; Payment Gateways
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Digital payment integrations for tithes, offerings, thanksgiving gifts, and mission funds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                UPI &amp; Razorpay Gateway
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Online payment gateway integration enabling members to transfer tithes and donations via Google Pay, PhonePe, and NetBanking.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Sunday Giving Kiosk Mode
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Dedicated tablet / kiosk mode for collecting offerings with dynamic QR codes generated per giving category.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Automated 80G Receipts
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Automatic generation of PDF tax exemption receipts sent via email following each successful Sunday donation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: NOTIFICATIONS & ALERTS ─── */}
      {activeTab === "communications" && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${t(
            "bg-white border-zinc-200",
            "bg-slate-800/80 border-slate-700",
            "bg-zinc-900/80 border-zinc-800"
          )}`}
        >
          <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Notifications &amp; Alerts
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Automated WhatsApp broadcasts, SMS reminders, and pastoral follow-up alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                WhatsApp Service Broadcasts
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Automated Sunday service attendance confirmations, order of worship handouts, and sermon notes dispatched to family heads.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                Pastoral Care Follow-up Alerts
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Automated notifications to pastoral teams when a registered family has been absent from Sunday service for 3 consecutive weeks.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border opacity-85 ${t(
                "bg-zinc-50/60 border-zinc-200",
                "bg-slate-900/40 border-slate-700",
                "bg-zinc-950/40 border-zinc-800"
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                <Badge variant="outline" className="text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 font-serif">
                SMS Urgent Announcements
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Direct SMS broadcast channel for time-sensitive announcements such as emergency weather alerts or schedule revisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
