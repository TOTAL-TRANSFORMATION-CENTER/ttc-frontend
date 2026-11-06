"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Check,
  Phone,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import ThemeSwitcher from "@/components/ttc/theme-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/select";
import type {
  AttendancePortalStatus,
  AttendanceFamilyResult,
  AlreadySubmittedAttendanceData,
} from "@/types";

type PortalStatus = AttendancePortalStatus;
type FamilyResult = AttendanceFamilyResult;
type AlreadySubmittedData = AlreadySubmittedAttendanceData;

export default function AttendancePublicPage() {
  const { theme } = useTheme();

  // ─── State ───
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [status, setStatus] = useState<PortalStatus | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FamilyResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Selected Family state
  const [selectedFamily, setSelectedFamily] = useState<FamilyResult | null>(null);
  const [applySameService, setApplySameService] = useState(true);
  const [sharedService, setSharedService] = useState<string>("SERVICE_1");
  const [memberServices, setMemberServices] = useState<Record<string, string>>({});
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    recordedCount: number;
    skippedCount: number;
    recordedMembers: Array<{ id: string; name: string; service: string }>;
  } | null>(null);
  const [alreadySubmittedData, setAlreadySubmittedData] = useState<AlreadySubmittedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Theme helper ───
  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "dark") return dark;
    if (theme === "solarised") return solarised;
    return light;
  };

  // 1. Fetch portal status
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      setErrorMessage(null);
      const urlParams = new URLSearchParams(window.location.search);
      const isPreview = urlParams.get("preview") === "true";

      const res = await fetch(`/api/attendance/status${isPreview ? "?preview=true" : ""}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStatus(data.data);
        if (data.data.defaultService) {
          setSharedService(data.data.defaultService);
        }
      } else {
        setErrorMessage(data.message || "Could not connect to attendance service.");
      }
    } catch (err) {
      console.error("Status fetch error:", err);
      setErrorMessage("Failed to load attendance portal. Please check your internet connection.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 2. Debounced Family Search
  useEffect(() => {
    if (!status?.isOpen) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const queryParam = encodeURIComponent(searchQuery.trim());
        const dateParam = encodeURIComponent(status.serviceDate || "");
        const res = await fetch(`/api/attendance/search?q=${queryParam}&date=${dateParam}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, status?.isOpen, status?.serviceDate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Select Family handler
  const handleSelectFamily = (family: FamilyResult) => {
    setSelectedFamily(family);
    setIsDropdownOpen(false);
    setSearchQuery("");
    setErrorMessage(null);

    const initialServices: Record<string, string> = {};
    const initialSelected = new Set<string>();

    for (const m of family.members) {
      initialServices[m.id] = sharedService;
      if (!m.alreadyAttended) {
        initialSelected.add(m.id);
      }
    }

    setMemberServices(initialServices);
    setSelectedMemberIds(initialSelected);
  };

  // Toggle member check
  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  // Select all unattended
  const handleSelectAllUnattended = () => {
    if (!selectedFamily) return;
    const all = new Set<string>();
    for (const m of selectedFamily.members) {
      if (!m.alreadyAttended) {
        all.add(m.id);
      }
    }
    setSelectedMemberIds(all);
  };

  // Clear selections
  const handleClearAll = () => {
    setSelectedMemberIds(new Set());
  };

  // 4. Submit Attendance
  const handleSubmitAttendance = async () => {
    if (!selectedFamily || selectedMemberIds.size === 0) {
      setErrorMessage("Please select at least one present family member.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const submissions = Array.from(selectedMemberIds).map((memberId) => ({
        memberId,
        service: applySameService ? sharedService : memberServices[memberId] || sharedService,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: selectedFamily.familyId,
          attendanceDate: status?.serviceDate,
          submissions,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isAlreadySubmitted || res.status === 409) {
          setAlreadySubmittedData({
            message: data.message || "Attendance has already been recorded for today.",
            skippedMembers: data.skippedMembers || [],
            contactPhone: data.contactPhone || "+91 63798 71925",
            contactHelp: data.contactHelp,
          });
          setSubmissionSuccess(null);
          setErrorMessage(null);
        } else {
          setErrorMessage(data.message || "Failed to record attendance. Please try again.");
          setAlreadySubmittedData(null);
        }
      } else {
        // If recordedCount is 0 but request was successful, treat as already submitted
        if (data.recordedCount === 0 && (data.skippedCount > 0 || data.isAlreadySubmitted)) {
          setAlreadySubmittedData({
            message: data.message || "Attendance has already been recorded for today.",
            skippedMembers: data.skippedMembers || [],
            contactPhone: data.contactPhone || "+91 63798 71925",
            contactHelp: data.contactHelp,
          });
          setSubmissionSuccess(null);
          setErrorMessage(null);
        } else {
          setSubmissionSuccess({
            recordedCount: data.recordedCount ?? submissions.length,
            skippedCount: data.skippedCount ?? 0,
            recordedMembers: data.recordedMembers || [],
          });
          setAlreadySubmittedData(null);
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Network error while submitting attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnotherFamily = () => {
    setSelectedFamily(null);
    setSubmissionSuccess(null);
    setAlreadySubmittedData(null);
    setSelectedMemberIds(new Set());
    setErrorMessage(null);
    setSearchQuery("");
  };

  const getServiceLabel = (code: string) => {
    const s = status?.services?.find((opt) => opt.code === code);
    return s?.shortLabel || s?.label || code;
  };

  // ─── Loading Screen ───
  if (loadingStatus) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${t(
          "bg-zinc-50 text-zinc-800",
          "bg-slate-900 text-slate-100",
          "bg-zinc-950 text-zinc-100"
        )}`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16 animate-pulse">
            <Image
              src="/assets/TTC Logo PNG.png"
              alt="TTC Logo"
              width={64}
              height={64}
              unoptimized
              className={`object-contain ${theme !== "light" ? "brightness-0 invert" : ""}`}
            />
          </div>
          <p className="text-xs font-semibold tracking-wide text-zinc-500 animate-pulse">
            Connecting to Total Transformation Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${t(
        "bg-gradient-to-b from-amber-50/40 via-zinc-50 to-white text-zinc-900",
        "bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-100",
        "bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100"
      )}`}
    >
      {/* ─── Top Header Bar ─── */}
      <header
        className={`w-full sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 sm:px-6 transition-colors ${t(
          "bg-white/85 border-zinc-200/80 shadow-xs",
          "bg-slate-900/85 border-slate-800",
          "bg-zinc-950/85 border-zinc-800"
        )}`}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/assets/TTC Logo PNG.png"
              alt="Total Transformation Center Logo"
              width={38}
              height={38}
              unoptimized
              className={`h-9 w-auto object-contain drop-shadow-xs ${
                theme !== "light" ? "brightness-0 invert" : ""
              }`}
            />
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight leading-none font-serif text-zinc-900 dark:text-zinc-100">
                Total Transformation Center
              </h1>
              <p className="text-xs mt-0.5 font-medium text-zinc-500 dark:text-slate-400">
                Sunday Service Check-in
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* ─── Main Container ─── */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* ─── SCENARIO 1: CLOSED PORTAL ─── */}
        {!status?.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 sm:p-8 text-center shadow-xs transition-all ${t(
              "bg-white border-amber-200 shadow-amber-500/5",
              "bg-slate-800/90 border-amber-500/30",
              "bg-zinc-900/90 border-amber-500/30"
            )}`}
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-5 ring-8 ring-amber-500/5">
              <Clock className="w-8 h-8" />
            </div>

            <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-300 mb-3 text-xs">
              PORTAL CURRENTLY CLOSED
            </Badge>

            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight mb-3 text-zinc-900 dark:text-zinc-100">
              Sunday Check-in Opens Soon
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed max-w-lg mx-auto mb-6 text-zinc-600 dark:text-slate-300">
              {status?.politeMessage ||
                "Total Transformation Center self check-in opens on Sundays between 7:00 AM and 12:00 AM midnight (IST)."}
            </p>

            {/* Sunday Worship Timings */}
            <div
              className={`rounded-xl border p-4 sm:p-5 text-left mb-6 ${t(
                "bg-zinc-50 border-zinc-200",
                "bg-slate-900/60 border-slate-700/60",
                "bg-zinc-950/60 border-zinc-800"
              )}`}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Sunday Worship Services
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">1st Service</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    07:00 AM – 09:00 AM
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">2nd Service</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    09:00 AM – 11:00 AM
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">3rd Service</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    11:00 AM – 01:00 PM
                  </span>
                </div>
              </div>
            </div>

            {/* Welcome Desk Note */}
            <div
              className={`flex items-start gap-3 p-3.5 rounded-xl text-xs sm:text-sm text-left mb-6 ${t(
                "bg-amber-50/70 text-amber-900 border border-amber-200",
                "bg-amber-950/40 text-amber-200 border border-amber-800/50",
                "bg-amber-950/40 text-amber-200 border border-amber-800/50"
              )}`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Need immediate assistance?</p>
                <p className="opacity-90 mt-0.5">
                  If you are attending a special fellowship or need manual check-in right now, our welcome team at the foyer desk will gladly assist you.
                </p>
              </div>
            </div>

            <Button
              onClick={fetchStatus}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Check Again
            </Button>
          </motion.div>
        )}

        {/* ─── SCENARIO 2: SUCCESS VIEW ─── */}
        {status?.isOpen && submissionSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border p-6 sm:p-8 text-center shadow-xs transition-all ${t(
              "bg-white border-emerald-200 shadow-emerald-500/5",
              "bg-slate-800/90 border-emerald-500/30",
              "bg-zinc-900/90 border-emerald-500/30"
            )}`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-5 ring-8 ring-emerald-500/5 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 mb-3 text-xs">
              ATTENDANCE RECORDED
            </Badge>

            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
              Welcome to Church!
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 text-zinc-600 dark:text-slate-300">
              Thank you for attending today! Attendance has been recorded for{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {submissionSuccess.recordedCount} member(s)
              </strong>
              . Have a blessed and joyful service.
            </p>

            {/* List of checked in members */}
            {submissionSuccess.recordedMembers.length > 0 && (
              <div
                className={`rounded-xl border p-4 text-left mb-6 max-h-56 overflow-y-auto ${t(
                  "bg-zinc-50 border-zinc-200",
                  "bg-slate-900/60 border-slate-700/60",
                  "bg-zinc-950/60 border-zinc-800"
                )}`}
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Members Checked In:
                </h4>
                <div className="space-y-2">
                  {submissionSuccess.recordedMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                    >
                      <span className="font-medium flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        {m.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {getServiceLabel(m.service)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleResetForAnotherFamily}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-6 py-2.5 font-semibold"
            >
              Check In Another Family <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>
        )}

        {/* ─── SCENARIO 3: ALREADY SUBMITTED WARNING SCREEN ─── */}
        {alreadySubmittedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border p-6 sm:p-8 text-center shadow-xs transition-all ${t(
              "bg-white border-amber-300 shadow-amber-500/10",
              "bg-slate-800/95 border-amber-500/40",
              "bg-zinc-900/95 border-amber-500/40"
            )}`}
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-5 ring-8 ring-amber-500/5">
              <Clock className="w-9 h-9" />
            </div>

            <Badge
              variant="outline"
              className="text-amber-700 dark:text-amber-300 border-amber-400 mb-3 text-xs font-semibold px-2.5 py-0.5 uppercase tracking-wide"
            >
              ATTENDANCE ALREADY RECORDED
            </Badge>

            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
              Already Checked In For Today
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6 text-zinc-600 dark:text-slate-300">
              {alreadySubmittedData.message ||
                "Our records show that attendance for your selected member(s) has already been submitted today. No duplicate record was created."}
            </p>

            {/* Breakdown of previously submitted members with their time */}
            {alreadySubmittedData.skippedMembers.length > 0 && (
              <div
                className={`rounded-xl border p-4 text-left mb-6 ${t(
                  "bg-amber-50/40 border-amber-200/80",
                  "bg-slate-900/70 border-slate-700/80",
                  "bg-zinc-950/70 border-zinc-800"
                )}`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Recorded Submission Details:
                </h4>
                <div className="space-y-2">
                  {alreadySubmittedData.skippedMembers.map((m) => (
                    <div
                      key={m.memberId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-amber-200/40 dark:border-zinc-800 last:border-0 gap-1 sm:gap-2"
                    >
                      <div>
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {m.name}
                        </span>
                        <span className="block text-[11px] text-zinc-500 dark:text-slate-400">
                          Service: <strong>{getServiceLabel(m.service)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-mono text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-md self-start sm:self-auto">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Submitted at {m.submittedAtFormatted || "Today"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Church Office Contact & Query Box */}
            <div
              className={`rounded-xl border p-4 sm:p-5 text-left mb-6 transition-all ${t(
                "bg-zinc-50 border-zinc-200",
                "bg-slate-900/60 border-slate-700/60",
                "bg-zinc-950/60 border-zinc-800"
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Need to Modify Service or Have Queries?
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-slate-300 leading-relaxed mb-3">
                    If you have any queries or need any modification on anything (e.g. changing service or correcting details), please inform church administration or call below:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="tel:+916379871925"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call +91 63798 71925
                    </a>
                    <a
                      href="https://wa.me/916379871925?text=Hello%20TTC%20Admin%2C%20I%20have%20a%20query%20regarding%20my%20Sunday%20attendance."
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${t(
                        "border-zinc-300 hover:bg-zinc-100 text-zinc-800",
                        "border-slate-700 hover:bg-slate-800 text-slate-200",
                        "border-zinc-700 hover:bg-zinc-800 text-zinc-200"
                      )}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp +91 63798 71925
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleResetForAnotherFamily}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs px-6 py-2.5 shadow-xs"
            >
              Back to Family Search <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>
        )}

        {/* ─── SCENARIO 4: OPEN PORTAL (SEARCH & CHECKLIST) ─── */}
        {status?.isOpen && !submissionSuccess && !alreadySubmittedData && (
          <div className="space-y-6">
            {/* Header info badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Welcome to Sunday Worship
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400">
                  Quickly check in your family for today&apos;s service
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${t(
                  "bg-amber-50/80 border-amber-200 text-amber-700",
                  "bg-amber-950/60 border-amber-800 text-amber-300",
                  "bg-amber-950/60 border-amber-800 text-amber-300"
                )}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{status.serviceDate}</span>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${t(
                  "bg-red-50 border-red-200 text-red-800",
                  "bg-red-950/50 border-red-800/60 text-red-300",
                  "bg-red-950/50 border-red-800/60 text-red-300"
                )}`}
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </motion.div>
            )}

            {/* ─── STEP 1: FAMILY SEARCH BAR WITH DROPDOWN ─── */}
            <div ref={searchContainerRef} className="relative">
              <Label htmlFor="publicFamilySearch" className="text-xs mb-1.5 uppercase font-semibold text-zinc-500">
                1. Search Your Family:
              </Label>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <Input
                  id="publicFamilySearch"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Enter Head of Family, your name, phone, or email..."
                  autoComplete="off"
                  className="pl-10 pr-9 h-11 text-sm rounded-xl"
                />
                {searching && (
                  <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border max-h-72 overflow-y-auto shadow-xl transition-all ${t(
                      "bg-white border-zinc-200 divide-y divide-zinc-100",
                      "bg-slate-800 border-slate-700 divide-y divide-slate-700/60",
                      "bg-zinc-900 border-zinc-800 divide-y divide-zinc-800/60"
                    )}`}
                  >
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        {searching
                          ? "Searching families..."
                          : searchQuery
                          ? `No families found matching "${searchQuery}".`
                          : "Type a name or phone number to find your family."}
                      </div>
                    ) : (
                      searchResults.map((fam) => (
                        <button
                          key={fam.familyId}
                          type="button"
                          onClick={() => handleSelectFamily(fam)}
                          className={`w-full text-left p-3.5 sm:p-4 transition-colors flex items-center justify-between gap-3 cursor-pointer ${t(
                            "hover:bg-amber-50/60",
                            "hover:bg-slate-700/60",
                            "hover:bg-zinc-800/60"
                          )}`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {fam.headName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-100">
                                {fam.familyName}
                              </p>
                              <p className="text-xs truncate text-zinc-500 dark:text-slate-400">
                                Head: {fam.headName} • {fam.totalMembersCount} Members
                                {fam.region ? ` • ${fam.region}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {fam.alreadyAttendedCount > 0 ? (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                {fam.alreadyAttendedCount === fam.totalMembersCount
                                  ? "All Attended"
                                  : `${fam.alreadyAttendedCount}/${fam.totalMembersCount} Attended`}
                              </Badge>
                            ) : (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                Select <ArrowRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── STEP 2: SELECTED FAMILY CHECKLIST CARD ─── */}
            {selectedFamily && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${t(
                  "bg-white border-zinc-200",
                  "bg-slate-800/80 border-slate-700",
                  "bg-zinc-900/80 border-zinc-800"
                )}`}
              >
                {/* Family Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Family Attendance
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {selectedFamily.familyName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {selectedFamily.totalMembersCount} Family Members
                      {selectedFamily.region ? ` • Region: ${selectedFamily.region}` : ""}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFamily(null);
                      setIsDropdownOpen(true);
                    }}
                    className="text-xs"
                  >
                    Change Family
                  </Button>
                </div>

                {/* Notice if entire family has already attended */}
                {selectedFamily.alreadyAttendedCount === selectedFamily.totalMembersCount && (
                  <div
                    className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${t(
                      "bg-amber-50/80 border-amber-300 text-amber-900",
                      "bg-amber-950/40 border-amber-800 text-amber-200",
                      "bg-zinc-900/90 border-amber-700/60 text-amber-200"
                    )}`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">All family members are already marked present for today.</p>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                        If you need any changes, service modifications, or have questions, please inform the church administration desk or call{" "}
                        <a href="tel:+916379871925" className="font-bold underline hover:text-amber-400">
                          +91 63798 71925
                        </a>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Shared Service vs Individual Service Controls */}
                <div
                  className={`mt-4 p-4 rounded-xl border transition-colors ${t(
                    "bg-zinc-50 border-zinc-200",
                    "bg-slate-900/50 border-slate-700/60",
                    "bg-zinc-950/50 border-zinc-800/60"
                  )}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold select-none">
                      <Checkbox
                        checked={applySameService}
                        onCheckedChange={(checked) => setApplySameService(Boolean(checked))}
                      />
                      <span>Apply same service to all members</span>
                    </label>

                    {applySameService && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="publicSharedService" className="text-xs text-zinc-500 shrink-0">
                          Service:
                        </Label>
                        <NativeSelect
                          id="publicSharedService"
                          value={sharedService}
                          onChange={(e) => setSharedService(e.target.value)}
                          className="text-xs h-8"
                        >
                          {(status.services || []).map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.label}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    )}
                  </div>

                  {!applySameService && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                      Individual mode: Select which service each present member is attending below.
                    </p>
                  )}
                </div>

                {/* Quick Selection Actions */}
                <div className="flex items-center justify-between mt-5 mb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-zinc-500">
                    Select Present Members:
                  </span>
                  <div className="space-x-3">
                    <button
                      type="button"
                      onClick={handleSelectAllUnattended}
                      className="text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-zinc-400 hover:text-zinc-600 font-medium hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Family Members Checklist with Reusable Checkbox */}
                <div className="space-y-2.5">
                  {selectedFamily.members.map((member) => {
                    const isSelected = selectedMemberIds.has(member.id);
                    const already = member.alreadyAttended;

                    return (
                      <div
                        key={member.id}
                        className={`rounded-xl border p-3.5 transition-all ${
                          already
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800 opacity-80"
                            : isSelected
                            ? "bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                            : t(
                                "bg-white border-zinc-200 hover:border-zinc-300",
                                "bg-slate-800/60 border-slate-700 hover:border-slate-600",
                                "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                              )
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                              disabled={already}
                              checked={already || isSelected}
                              onCheckedChange={() => handleToggleMember(member.id)}
                            />
                            <div
                              onClick={() => !already && handleToggleMember(member.id)}
                              className={`min-w-0 ${already ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    already ? "line-through text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
                                  }`}
                                >
                                  {member.name}
                                </span>
                                {member.isHead && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Head
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-slate-400">
                                {member.gender || "Member"}
                                {member.age ? ` • Age ${member.age}` : ""}
                                {member.churchRole ? ` • ${member.churchRole}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Status / Individual Service Selector */}
                          <div className="shrink-0 text-right">
                            {already ? (
                              <div>
                                <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                                  ✓ Attended ({getServiceLabel(member.attendedService || "")})
                                </Badge>
                                {member.attendedAtFormatted && (
                                  <span className="block text-[10px] text-zinc-400 mt-0.5">
                                    At {member.attendedAtFormatted}
                                  </span>
                                )}
                              </div>
                            ) : (
                              !applySameService &&
                              isSelected && (
                                <NativeSelect
                                  value={memberServices[member.id] || sharedService}
                                  onChange={(e) =>
                                    setMemberServices((prev) => ({
                                       ...prev,
                                      [member.id]: e.target.value,
                                    }))
                                  }
                                  className="text-xs h-7 w-32"
                                >
                                  {(status.services || []).map((s) => (
                                    <option key={s.code} value={s.code}>
                                      {s.shortLabel}
                                    </option>
                                  ))}
                                </NativeSelect>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Action Button */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-zinc-500">
                    <strong className="text-amber-600 dark:text-amber-400">
                      {selectedMemberIds.size} of {selectedFamily.totalMembersCount} members
                    </strong>{" "}
                    selected to mark present.
                  </div>

                  <Button
                    type="button"
                    disabled={submitting || selectedMemberIds.size === 0}
                    onClick={handleSubmitAttendance}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-6 py-2.5 shadow-xs"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Recording Attendance...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm & Submit Attendance
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer
        className={`w-full text-center py-4 border-t text-xs transition-colors ${t(
          "bg-white/50 border-zinc-200/80 text-zinc-500",
          "bg-slate-900/50 border-slate-800 text-slate-500",
          "bg-zinc-950/50 border-zinc-800 text-zinc-500"
        )}`}
      >
        <p>Total Transformation Center • Sunday Attendance Portal</p>
      </footer>
    </div>
  );
}
