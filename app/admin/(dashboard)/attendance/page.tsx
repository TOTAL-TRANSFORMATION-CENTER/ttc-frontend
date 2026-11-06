"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { BannerAlert } from "@/components/ui/banner-alert";
import { AttendanceCalendarView } from "@/components/attendance/attendance-calendar-view";
import { AttendanceListView } from "@/components/attendance/attendance-list-view";
import type {
  AttendanceFamilyResult,
  AttendanceServiceOption,
} from "@/types";

type FamilyResult = AttendanceFamilyResult;
type ServiceOption = AttendanceServiceOption;

export default function AdminAttendancePage() {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "dark") return dark;
    if (theme === "solarised") return solarised;
    return light;
  };

  // ─── Active Tab & Views ───
  const [activeTab, setActiveTab] = useState<"enter" | "view">("enter");
  const [viewSubMode, setViewSubMode] = useState<"calendar" | "list">("calendar");

  // Services list
  const [services, setServices] = useState<ServiceOption[]>([
    { code: "SERVICE_1", label: "1st Service (07:00 AM - 09:00 AM)", shortLabel: "1st Service" },
    { code: "SERVICE_2", label: "2nd Service (09:00 AM - 11:00 AM)", shortLabel: "2nd Service" },
    { code: "SERVICE_3", label: "3rd Service (11:00 AM - 01:00 PM)", shortLabel: "3rd Service" },
  ]);

  // Notifications
  const [banner, setBanner] = useState<{
    variant: "success" | "error" | "info" | "warning";
    title?: string;
    message: string;
  } | null>(null);

  // ─── TAB 1: Enter Attendance State ───
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FamilyResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [selectedFamily, setSelectedFamily] = useState<FamilyResult | null>(null);
  const [applySameService, setApplySameService] = useState(true);
  const [sharedService, setSharedService] = useState("SERVICE_1");
  const [memberServices, setMemberServices] = useState<Record<string, string>>({});
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // Load dynamic services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/attendance/status");
        const json = await res.json();
        if (json.success && json.data?.services?.length > 0) {
          setServices(json.data.services);
          if (json.data.defaultService) {
            setSharedService(json.data.defaultService);
          }
        }
      } catch (err) {
        console.warn("Could not fetch dynamic services:", err);
      }
    };

    const timer = setTimeout(fetchServices, 0);
    return () => clearTimeout(timer);
  }, []);

  // ─── Debounced Family Search ───
  useEffect(() => {
    if (activeTab !== "enter") return;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(searchQuery.trim());
        const d = encodeURIComponent(entryDate);
        const res = await fetch(`/api/attendance/search?q=${q}&date=${d}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Family search error:", err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, entryDate, activeTab]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelectFamily = (fam: FamilyResult) => {
    setSelectedFamily(fam);
    setIsDropdownOpen(false);
    setSearchQuery("");

    const initialServices: Record<string, string> = {};
    const initialSelected = new Set<string>();

    for (const m of fam.members) {
      initialServices[m.id] = sharedService;
      if (!m.alreadyAttended) {
        initialSelected.add(m.id);
      }
    }

    setMemberServices(initialServices);
    setSelectedMemberIds(initialSelected);
  };

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

  const handleSelectAllUnattended = () => {
    if (!selectedFamily) return;
    const all = new Set<string>();
    for (const m of selectedFamily.members) {
      if (!m.alreadyAttended) all.add(m.id);
    }
    setSelectedMemberIds(all);
  };

  // Submit manual attendance
  const handleSubmitManualAttendance = async () => {
    if (!selectedFamily || selectedMemberIds.size === 0) {
      setBanner({
        variant: "error",
        message: "Please select at least one member to mark present.",
      });
      return;
    }

    setSubmittingEntry(true);
    setBanner(null);

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
          attendanceDate: entryDate,
          submissions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBanner({
          variant: "success",
          title: "Attendance Recorded",
          message: `Successfully marked ${json.recordedCount} member(s) present for ${selectedFamily.familyName}.${
            json.skippedCount > 0
              ? ` (${json.skippedCount} member(s) were already recorded earlier).`
              : ""
          }`,
        });
        setSelectedFamily(null);
        setSelectedMemberIds(new Set());
      } else if (json.isAlreadySubmitted || res.status === 409) {
        setBanner({
          variant: "warning",
          title: "Attendance Already Recorded",
          message: `${json.message || "All selected members have already checked in today."} To modify their service or view details, use the View Attendance tab or call +91 63798 71925.`,
        });
      } else {
        setBanner({
          variant: "error",
          title: "Entry Failed",
          message: json.message || "Failed to record attendance.",
        });
      }
    } catch (err) {
      console.error("Entry error:", err);
      setBanner({
        variant: "error",
        message: "Failed to submit attendance. Please try again.",
      });
    } finally {
      setSubmittingEntry(false);
    }
  };

  const getServiceLabel = (code: string) => {
    const s = services.find((opt) => opt.code === code);
    return s?.shortLabel || s?.label || code;
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Banner Alert ─── */}
      {banner && (
        <BannerAlert
          variant={banner.variant}
          title={banner.title}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {/* ─── Standard TTC Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-amber-500" />
            Attendance
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Record service check-ins, track family attendance, and analyze Sunday participation.
          </p>
        </div>

        {/* Main Tabs Navigation */}
        <div
          className={`flex items-center p-1 rounded-xl border self-start sm:self-auto ${t(
            "bg-zinc-100 border-zinc-200",
            "bg-slate-900 border-slate-700",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("enter")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "enter"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Enter Attendance
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("view")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "view"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-slate-400 hover:text-zinc-900"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-500" /> View Attendance
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ENTER ATTENDANCE ─── */}
      {activeTab === "enter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Date & Family Search */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`rounded-2xl border p-5 shadow-xs space-y-4 ${t(
                "bg-white border-zinc-200",
                "bg-slate-800/80 border-slate-700",
                "bg-zinc-900/80 border-zinc-800"
              )}`}
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
                1. Select Date & Search Family
              </h2>

              {/* Service Date Selector with Reusable DatePicker */}
              <div>
                <Label className="text-xs mb-1">Attendance Date:</Label>
                <DatePicker
                  value={entryDate}
                  onChange={(val) => {
                    if (val) setEntryDate(val);
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Search Box with Reusable Input */}
              <div ref={searchBoxRef} className="relative">
                <Label htmlFor="familyAdminSearch" className="text-xs mb-1">
                  Search Family Head or Member:
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <Input
                    id="familyAdminSearch"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search by name, phone, or email..."
                    className="pl-9 pr-8 h-9 text-xs"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 animate-spin" />
                  )}
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div
                    className={`absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl border max-h-72 overflow-y-auto shadow-xl ${t(
                      "bg-white border-zinc-200 divide-y divide-zinc-100",
                      "bg-slate-800 border-slate-700 divide-y divide-slate-700/60",
                      "bg-zinc-900 border-zinc-800 divide-y divide-zinc-800/60"
                    )}`}
                  >
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-400">
                        {searching ? "Searching..." : "No matching families found."}
                      </div>
                    ) : (
                      searchResults.map((fam) => (
                        <button
                          key={fam.familyId}
                          type="button"
                          onClick={() => handleSelectFamily(fam)}
                          className={`w-full text-left p-3 flex items-center justify-between text-xs transition cursor-pointer ${t(
                            "hover:bg-amber-50/60",
                            "hover:bg-slate-700/60",
                            "hover:bg-zinc-800/60"
                          )}`}
                        >
                          <div>
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {fam.familyName}
                            </p>
                            <p className="text-zinc-500 text-[11px]">
                              {fam.headName} • {fam.totalMembersCount} Members
                              {fam.region ? ` • ${fam.region}` : ""}
                            </p>
                          </div>
                          {fam.alreadyAttendedCount > 0 && (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              {fam.alreadyAttendedCount}/{fam.totalMembersCount} Attended
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected Family Checklist Card */}
          <div className="lg:col-span-7">
            {selectedFamily ? (
              <div
                className={`rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${t(
                  "bg-white border-zinc-200",
                  "bg-slate-800/80 border-slate-700",
                  "bg-zinc-900/80 border-zinc-800"
                )}`}
              >
                {/* Family Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Family Selected
                    </span>
                    <h3 className="text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100">
                      {selectedFamily.familyName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Head: {selectedFamily.headName} • {selectedFamily.totalMembersCount} Members
                      {selectedFamily.region ? ` • ${selectedFamily.region}` : ""}
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
                    Change
                  </Button>
                </div>

                {/* Notice if entire family has already attended */}
                {selectedFamily.alreadyAttendedCount === selectedFamily.totalMembersCount && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${t(
                      "bg-amber-50/80 border-amber-300 text-amber-900",
                      "bg-amber-950/40 border-amber-800 text-amber-200",
                      "bg-zinc-900/90 border-amber-700/60 text-amber-200"
                    )}`}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">All family members are already marked present for this date.</p>
                      <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                        To edit service, remove attendance, or modify records, switch to the <strong>View Attendance</strong> tab above or call <strong>+91 63798 71925</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Service Control Toggle using Reusable Checkbox and NativeSelect */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${t(
                    "bg-zinc-50 border-zinc-200",
                    "bg-slate-900/60 border-slate-700",
                    "bg-zinc-950/60 border-zinc-800"
                  )}`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none">
                    <Checkbox
                      checked={applySameService}
                      onCheckedChange={(checked) => setApplySameService(Boolean(checked))}
                    />
                    <span>Apply same service to all members</span>
                  </label>

                  {applySameService && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sharedServiceAdmin" className="text-xs text-zinc-500 shrink-0">
                        Service:
                      </Label>
                      <NativeSelect
                        id="sharedServiceAdmin"
                        value={sharedService}
                        onChange={(e) => setSharedService(e.target.value)}
                        className="text-xs h-8"
                      >
                        {services.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold uppercase tracking-wider text-zinc-500">
                    Check Present Members:
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
                      onClick={() => setSelectedMemberIds(new Set())}
                      className="text-zinc-400 hover:text-zinc-600 font-medium hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Member Roster Items */}
                <div className="space-y-2">
                  {selectedFamily.members.map((m) => {
                    const isSelected = selectedMemberIds.has(m.id);
                    const already = m.alreadyAttended;

                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          already
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 opacity-80"
                            : isSelected
                            ? "bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700"
                            : t(
                                "bg-white border-zinc-200 hover:border-zinc-300",
                                "bg-slate-800/60 border-slate-700 hover:border-slate-600",
                                "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                              )
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Checkbox
                            disabled={already}
                            checked={already || isSelected}
                            onCheckedChange={() => handleToggleMember(m.id)}
                          />
                          <div
                            onClick={() => !already && handleToggleMember(m.id)}
                            className={`min-w-0 ${already ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-semibold text-sm ${
                                  already ? "line-through text-zinc-500" : "text-zinc-900 dark:text-zinc-100"
                                }`}
                              >
                                {m.name}
                              </span>
                              {m.isHead && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                  Head
                                </Badge>
                              )}
                            </div>
                            <p className="text-zinc-500 text-[11px]">
                              {m.gender || "Member"} {m.age ? `• Age ${m.age}` : ""} {m.churchRole ? `• ${m.churchRole}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Status or Service override */}
                        <div className="shrink-0 text-right">
                          {already ? (
                            <div>
                              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                                ✓ Attended ({getServiceLabel(m.attendedService || "")})
                              </Badge>
                              {m.attendedAtFormatted && (
                                <span className="block text-[10px] text-zinc-400 mt-0.5">
                                  At {m.attendedAtFormatted}
                                </span>
                              )}
                            </div>
                          ) : (
                            !applySameService &&
                            isSelected && (
                              <NativeSelect
                                value={memberServices[m.id] || sharedService}
                                onChange={(e) =>
                                  setMemberServices((prev) => ({ ...prev, [m.id]: e.target.value }))
                                }
                                className="text-xs h-7 w-32"
                              >
                                {services.map((s) => (
                                  <option key={s.code} value={s.code}>
                                    {s.shortLabel}
                                  </option>
                                ))}
                              </NativeSelect>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    <strong className="text-amber-600 dark:text-amber-400">
                      {selectedMemberIds.size}
                    </strong>{" "}
                    member(s) to mark present.
                  </span>

                  <Button
                    disabled={submittingEntry || selectedMemberIds.size === 0}
                    onClick={handleSubmitManualAttendance}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-4 py-2 font-semibold shadow-xs"
                  >
                    {submittingEntry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Submit Attendance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-2xl border border-dashed p-10 text-center flex flex-col items-center justify-center ${t(
                  "bg-zinc-50/50 border-zinc-300 text-zinc-500",
                  "bg-slate-900/30 border-slate-700 text-slate-400",
                  "bg-zinc-950/30 border-zinc-800 text-zinc-400"
                )}`}
              >
                <Users className="w-10 h-10 mb-3 opacity-40 text-amber-500" />
                <h3 className="font-semibold text-sm mb-1 text-zinc-800 dark:text-zinc-200">
                  No Family Selected
                </h3>
                <p className="text-xs max-w-sm">
                  Search and select a family from the left panel to review and check in family members.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: VIEW ATTENDANCE (Common Components) ─── */}
      {activeTab === "view" && (
        <div className="space-y-4">
          {/* Sub-view Switcher Bar */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-fit">
            <button
              type="button"
              onClick={() => setViewSubMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewSubMode === "calendar"
                  ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Calendar View
            </button>

            <button
              type="button"
              onClick={() => setViewSubMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewSubMode === "list"
                  ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Analytics & List View
            </button>
          </div>

          {/* Sub-View A: Common Calendar Component */}
          {viewSubMode === "calendar" && (
            <AttendanceCalendarView services={services} />
          )}

          {/* Sub-View B: Common List & Analytics Component */}
          {viewSubMode === "list" && (
            <AttendanceListView services={services} />
          )}
        </div>
      )}
    </div>
  );
}
