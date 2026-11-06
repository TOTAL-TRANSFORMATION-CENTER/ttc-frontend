"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import type {
  AttendanceServiceOption,
  AttendanceRosterMember,
  AttendanceCalendarMonthData,
} from "@/types";

export type ServiceOption = AttendanceServiceOption;
export type RosterMember = AttendanceRosterMember;
export type CalendarMonthData = AttendanceCalendarMonthData;

interface AttendanceCalendarViewProps {
  services: AttendanceServiceOption[];
  onDataChanged?: () => void;
}

export function AttendanceCalendarView({
  services,
  onDataChanged,
}: AttendanceCalendarViewProps) {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "dark") return dark;
    if (theme === "solarised") return solarised;
    return light;
  };

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null);
  const [loading, setLoading] = useState(false);

  // Roster Drilldown Modal
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterDate, setRosterDate] = useState("");
  const [rosterService, setRosterService] = useState("ALL");
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterList, setRosterList] = useState<RosterMember[]>([]);
  const [rosterSearch, setRosterSearch] = useState("");

  // Edit Service Modal
  const [editingMember, setEditingMember] = useState<RosterMember | null>(null);
  const [editTargetService, setEditTargetService] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Action
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Fetch Month Data
  const fetchMonthData = async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendance?view=calendar&month=${monthStr}`);
      const json = await res.json();
      if (json.success) {
        setCalendarData(json);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMonthData(currentMonth);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(y, m - 2, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(y, m, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  // 2. Open Roster
  const handleOpenRoster = async (dateStr: string, srv = "ALL") => {
    setRosterDate(dateStr);
    setRosterService(srv);
    setRosterSearch("");
    setRosterOpen(true);
    setRosterLoading(true);

    try {
      const res = await fetch(
        `/api/admin/attendance?view=roster&date=${dateStr}&service=${srv}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.roster)) {
        setRosterList(json.roster);
      }
    } catch (err) {
      console.error("Roster fetch error:", err);
    } finally {
      setRosterLoading(false);
    }
  };

  // 3. Edit Service Handler
  const handleOpenEdit = (item: RosterMember) => {
    setEditingMember(item);
    setEditTargetService(item.service);
    setEditNotes(item.notes || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: editingMember.id,
          service: editTargetService,
          notes: editNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Update local roster list
        setRosterList((prev) =>
          prev.map((r) =>
            r.id === editingMember.id
              ? { ...r, service: editTargetService, notes: editNotes }
              : r
          )
        );
        setEditingMember(null);
        fetchMonthData(currentMonth);
        if (onDataChanged) onDataChanged();
      } else {
        setEditError(json.message || "Failed to update attendance service.");
      }
    } catch (err) {
      console.error("Edit error:", err);
      setEditError("Failed to connect to server.");
    } finally {
      setSavingEdit(false);
    }
  };

  // 4. Delete Handler
  const handleDeleteAttendance = async (attendanceId: string) => {
    if (!confirm("Are you sure you want to remove this member attendance record?")) return;
    setDeletingId(attendanceId);

    try {
      const res = await fetch(`/api/admin/attendance?id=${attendanceId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setRosterList((prev) => prev.filter((r) => r.id !== attendanceId));
        fetchMonthData(currentMonth);
        if (onDataChanged) onDataChanged();
      } else {
        alert(json.message || "Failed to delete attendance record.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete attendance record.");
    } finally {
      setDeletingId(null);
    }
  };

  const getServiceLabel = (code: string) => {
    const s = services.find((opt) => opt.code === code);
    return s?.shortLabel || s?.label || code;
  };

  // Build Calendar Days Grid
  const calendarDays = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isSunday: boolean;
      isCurrentMonth: boolean;
      data?: { total: number; uniqueFamilies: number; services: Record<string, number> };
    }> = [];

    const startDayOfWeek = firstDay.getDay();

    // Previous month padding
    const prevMonthLastDate = new Date(y, m - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDate - i;
      const prevMonth = m - 1 === 0 ? 12 : m - 1;
      const prevYear = m - 1 === 0 ? y - 1 : y;
      const dStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      days.push({
        dateStr: dStr,
        dayNumber: dNum,
        isSunday: false,
        isCurrentMonth: false,
      });
    }

    // Current month days
    const totalDays = lastDay.getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayDate = new Date(y, m - 1, d);
      const isSunday = dayDate.getDay() === 0;
      const data = calendarData?.dates?.[dStr];

      days.push({
        dateStr: dStr,
        dayNumber: d,
        isSunday,
        isCurrentMonth: true,
        data,
      });
    }

    // Trailing padding to make full 7-col grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      const dStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isSunday: false,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, calendarData]);

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonth]);

  return (
    <div className="space-y-4">
      {/* ─── Calendar Controls Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-500" />
          <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900 dark:text-zinc-100">
            {monthLabel}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button size="sm" variant="outline" onClick={handleCurrentMonth} className="text-xs h-8 px-2.5">
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrevMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ─── Calendar Month Grid Card ─── */}
      <div
        className={`rounded-2xl border p-3 sm:p-5 shadow-xs transition-all overflow-hidden ${t(
          "bg-white border-zinc-200",
          "bg-slate-800/80 border-slate-700",
          "bg-zinc-900/80 border-zinc-800"
        )}`}
      >
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
          <div className="text-amber-600 dark:text-amber-400">Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
            {calendarDays.map((cell, idx) => {
              const hasAttendance = Boolean(cell.data && cell.data.total > 0);

              return (
                <div
                  key={idx}
                  className={`min-h-[72px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    !cell.isCurrentMonth
                      ? "opacity-25 bg-zinc-50/20 dark:bg-zinc-900/20 border-transparent pointer-events-none"
                      : cell.isSunday
                      ? t(
                          "bg-amber-50/30 border-amber-200/60 hover:border-amber-400",
                          "bg-amber-950/20 border-amber-900/40 hover:border-amber-700",
                          "bg-amber-950/20 border-amber-900/40 hover:border-amber-700"
                        )
                      : t(
                          "bg-white border-zinc-200/80 hover:border-zinc-300",
                          "bg-slate-800/50 border-slate-700/60 hover:border-slate-600",
                          "bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700"
                        )
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        cell.isSunday
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hasAttendance && (
                      <span
                        onClick={() => handleOpenRoster(cell.dateStr, "ALL")}
                        className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white cursor-pointer hover:bg-amber-600 transition shadow-xs"
                        title="Click to view full roster"
                      >
                        {cell.data?.total}
                      </span>
                    )}
                  </div>

                  {/* Services inside Day */}
                  {hasAttendance && cell.data?.services && (
                    <div className="space-y-1 mt-1">
                      {Object.entries(cell.data.services).map(([srvCode, count]) => (
                        <button
                          key={srvCode}
                          type="button"
                          onClick={() => handleOpenRoster(cell.dateStr, srvCode)}
                          className={`w-full text-[9px] sm:text-[10px] px-1 py-0.5 rounded font-medium flex items-center justify-between transition cursor-pointer ${t(
                            "bg-white border border-zinc-200 hover:bg-amber-50 text-zinc-700",
                            "bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200",
                            "bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                          )}`}
                        >
                          <span className="truncate">{getServiceLabel(srvCode)}</span>
                          <span className="font-bold ml-1">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasAttendance && cell.isSunday && cell.isCurrentMonth && (
                    <div className="text-[10px] text-zinc-400 italic hidden sm:block">No entries</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL 1: ROSTER DRILLDOWN MODAL ─── */}
      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>
                Present Members: {rosterDate} {rosterService !== "ALL" ? `(${getServiceLabel(rosterService)})` : ""}
              </span>
              <Badge variant="secondary" className="mr-6 font-bold">
                {rosterList.length} Present
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Verified attendance records for church service on {rosterDate}.
            </DialogDescription>
          </DialogHeader>

          {/* Search box within roster */}
          <div className="py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <Input
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Filter roster by member name, phone, or family..."
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          {/* Roster list */}
          <div className="flex-1 overflow-y-auto border rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800">
            {rosterLoading ? (
              <div className="h-44 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : rosterList.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No attendance entries recorded for this service.
              </div>
            ) : (
              rosterList
                .filter(
                  (item) =>
                    !rosterSearch ||
                    item.memberName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                    item.familyName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                    (item.phone && item.phone.includes(rosterSearch))
                )
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {m.memberName}
                      </p>
                      <p className="text-zinc-500 text-[11px]">
                        {m.familyName} {m.region ? `• ${m.region}` : ""} {m.phone ? `• ${m.phone}` : ""}
                      </p>
                      {m.notes && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                          Note: {m.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px]">
                          {getServiceLabel(m.service)}
                        </Badge>
                        <span className="block text-[10px] text-zinc-400 mt-0.5">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="text-zinc-500 hover:text-amber-600 p-1.5 rounded transition cursor-pointer"
                        title="Edit attendance service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        disabled={deletingId === m.id}
                        onClick={() => handleDeleteAttendance(m.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded transition cursor-pointer"
                        title="Remove member check-in"
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setRosterOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: EDIT ATTENDANCE SERVICE MODAL ─── */}
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Member Attendance</DialogTitle>
            <DialogDescription>
              Change the church service or update notes for this member&apos;s attendance.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <div className="space-y-4 py-2">
              {editError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {editError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border text-xs">
                <span className="font-bold text-sm block">{editingMember.memberName}</span>
                <span className="text-zinc-500">
                  {editingMember.familyName} • Date: {rosterDate}
                </span>
              </div>

              <div>
                <Label htmlFor="editServiceSelect" className="text-xs mb-1">
                  Change Service:
                </Label>
                <NativeSelect
                  id="editServiceSelect"
                  value={editTargetService}
                  onChange={(e) => setEditTargetService(e.target.value)}
                  className="text-xs h-9"
                >
                  {services.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div>
                <Label htmlFor="editNotesInput" className="text-xs mb-1">
                  Notes (Optional):
                </Label>
                <Input
                  id="editNotesInput"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Attended 2nd service with youth choir..."
                  className="text-xs h-9"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              size="sm"
              variant="outline"
              disabled={savingEdit}
              onClick={() => setEditingMember(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={savingEdit}
              onClick={handleSaveEdit}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
