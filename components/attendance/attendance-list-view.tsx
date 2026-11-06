"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
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
import { DatePicker } from "@/components/ui/date-picker";
import type {
  AttendanceServiceOption,
  AttendanceRosterMember,
  AttendanceAnalyticsData,
} from "@/types";

export type ServiceOption = AttendanceServiceOption;
export type AttendanceItem = AttendanceRosterMember;

interface AttendanceListViewProps {
  services: AttendanceServiceOption[];
  onDataChanged?: () => void;
}

export function AttendanceListView({
  services,
  onDataChanged,
}: AttendanceListViewProps) {
  const { theme } = useTheme();

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "dark") return dark;
    if (theme === "solarised") return solarised;
    return light;
  };

  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [service, setService] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [analyticsData, setAnalyticsData] = useState<AttendanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit Service Modal State
  const [editingItem, setEditingItem] = useState<AttendanceItem | null>(null);
  const [editTargetService, setEditTargetService] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Action State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Fetch Analytics Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const s = encodeURIComponent(search.trim());
      const res = await fetch(
        `/api/admin/attendance?view=analytics&date=${date}&service=${service}&search=${s}&page=${page}&limit=25`
      );
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json);
      }
    } catch (err) {
      console.error("List view fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [date, service, search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // 2. Edit Action
  const handleOpenEdit = (item: AttendanceItem) => {
    setEditingItem(item);
    setEditTargetService(item.service);
    setEditNotes(item.notes || "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: editingItem.id,
          service: editTargetService,
          notes: editNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditingItem(null);
        fetchData();
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

  // 3. Delete Action
  const handleDeleteAttendance = async (attendanceId: string) => {
    if (!confirm("Are you sure you want to remove this member attendance record?")) return;
    setDeletingId(attendanceId);

    try {
      const res = await fetch(`/api/admin/attendance?id=${attendanceId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
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

  // 4. CSV Export
  const handleExportCSV = () => {
    if (!analyticsData || analyticsData.data.length === 0) {
      alert("No attendance data to export for this selection.");
      return;
    }

    const headers = [
      "Attendance Date",
      "Member Name",
      "Family Head / Family",
      "Service",
      "Phone",
      "Gender",
      "Age",
      "Church Role",
      "Region",
      "Check-in Channel",
      "Check-in Timestamp",
    ];

    const rows = analyticsData.data.map((row) => [
      analyticsData.date,
      `"${row.memberName.replace(/"/g, '""')}"`,
      `"${row.familyName.replace(/"/g, '""')}"`,
      row.service,
      row.phone || "",
      row.gender || "",
      row.age || "",
      `"${(row.churchRole || "").replace(/"/g, '""')}"`,
      row.region || "",
      row.submittedVia,
      row.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TTC_Attendance_${analyticsData.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getServiceLabel = (code: string) => {
    const s = services.find((opt) => opt.code === code);
    return s?.shortLabel || s?.label || code;
  };

  return (
    <div className="space-y-5">
      {/* ─── Filter Toolbar ─── */}
      <div
        className={`p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${t(
          "bg-white border-zinc-200",
          "bg-slate-800/80 border-slate-700",
          "bg-zinc-900/80 border-zinc-800"
        )}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-3xl">
          {/* Reusable DatePicker */}
          <div>
            <Label className="text-xs mb-1">Attendance Date:</Label>
            <DatePicker
              value={date}
              onChange={(val) => {
                if (val) setDate(val);
              }}
              className="h-9 text-xs"
            />
          </div>

          {/* Reusable NativeSelect */}
          <div>
            <Label className="text-xs mb-1">Service Filter:</Label>
            <NativeSelect
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Services</option>
              {services.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* Reusable Search Input */}
          <div>
            <Label className="text-xs mb-1">Search Attendee:</Label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, family..."
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          disabled={!analyticsData || analyticsData.data.length === 0}
          className="text-xs h-9 self-end md:self-end shrink-0"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* ─── KPI Metric Cards ─── */}
      {analyticsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className={`p-4 rounded-xl border shadow-xs ${t(
              "bg-white border-zinc-200",
              "bg-slate-800/80 border-slate-700",
              "bg-zinc-900/80 border-zinc-800"
            )}`}
          >
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              Total Present
            </span>
            <p className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-1">
              {analyticsData.stats.totalPresent}
            </p>
            <span className="text-[11px] text-zinc-400">
              from {analyticsData.stats.uniqueFamilies} families
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-xs ${t(
              "bg-white border-zinc-200",
              "bg-slate-800/80 border-slate-700",
              "bg-zinc-900/80 border-zinc-800"
            )}`}
          >
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              1st Service
            </span>
            <p className="text-2xl font-bold font-serif mt-1 text-zinc-900 dark:text-zinc-100">
              {analyticsData.stats.services["SERVICE_1"] || 0}
            </p>
            <span className="text-[11px] text-zinc-400">
              {analyticsData.stats.totalPresent > 0
                ? `${Math.round(
                    ((analyticsData.stats.services["SERVICE_1"] || 0) /
                      analyticsData.stats.totalPresent) *
                      100
                  )}% of attendance`
                : "0%"}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-xs ${t(
              "bg-white border-zinc-200",
              "bg-slate-800/80 border-slate-700",
              "bg-zinc-900/80 border-zinc-800"
            )}`}
          >
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              2nd Service
            </span>
            <p className="text-2xl font-bold font-serif mt-1 text-zinc-900 dark:text-zinc-100">
              {analyticsData.stats.services["SERVICE_2"] || 0}
            </p>
            <span className="text-[11px] text-zinc-400">
              {analyticsData.stats.totalPresent > 0
                ? `${Math.round(
                    ((analyticsData.stats.services["SERVICE_2"] || 0) /
                      analyticsData.stats.totalPresent) *
                      100
                  )}% of attendance`
                : "0%"}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-xs ${t(
              "bg-white border-zinc-200",
              "bg-slate-800/80 border-slate-700",
              "bg-zinc-900/80 border-zinc-800"
            )}`}
          >
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              Demographics
            </span>
            <div className="text-[11px] space-y-1 mt-1 text-zinc-700 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>Men / Women:</span>
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {analyticsData.stats.demographics.male} / {analyticsData.stats.demographics.female}
                </strong>
              </div>
              <div className="flex justify-between text-zinc-400 text-[10px]">
                <span>Youth / Kids:</span>
                <span>
                  {analyticsData.stats.demographics.youth} / {analyticsData.stats.demographics.children}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Searchable Attendees Table ─── */}
      <div
        className={`rounded-2xl border shadow-xs overflow-hidden ${t(
          "bg-white border-zinc-200",
          "bg-slate-800/80 border-slate-700",
          "bg-zinc-900/80 border-zinc-800"
        )}`}
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Attendance Records ({analyticsData?.pagination.total || 0})
          </h3>
          <span className="text-xs text-zinc-500">Date: {date}</span>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : !analyticsData || analyticsData.data.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No attendance entries found for the selected date and filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-900/70 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Attendee Name</th>
                  <th className="p-3">Family Head</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Demographics</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Check-in Time</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {analyticsData.data.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
                    <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.memberName}
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-300">{row.familyName}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {getServiceLabel(row.service)}
                      </Badge>
                    </td>
                    <td className="p-3 text-zinc-500">
                      {row.gender || "—"} {row.age ? `• ${row.age} yrs` : ""}
                    </td>
                    <td className="p-3 text-zinc-500">{row.region || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          row.submittedVia === "QR_PUBLIC"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {row.submittedVia === "QR_PUBLIC" ? "QR Portal" : "Admin Staff"}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500 text-[11px]">
                      {new Date(row.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          className="text-zinc-500 hover:text-amber-600 p-1.5 rounded transition cursor-pointer"
                          title="Edit service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          onClick={() => handleDeleteAttendance(row.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded transition cursor-pointer"
                          title="Remove attendance"
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {analyticsData && analyticsData.pagination.totalPages > 1 && (
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Page {analyticsData.pagination.page} of {analyticsData.pagination.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={analyticsData.pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="h-7 text-xs px-2"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={analyticsData.pagination.page >= analyticsData.pagination.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="h-7 text-xs px-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── EDIT ATTENDANCE SERVICE MODAL ─── */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Member Attendance</DialogTitle>
            <DialogDescription>
              Change the church service or update notes for this member&apos;s attendance.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              {editError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {editError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border text-xs">
                <span className="font-bold text-sm block">{editingItem.memberName}</span>
                <span className="text-zinc-500">
                  {editingItem.familyName} • Date: {date}
                </span>
              </div>

              <div>
                <Label htmlFor="editListServiceSelect" className="text-xs mb-1">
                  Change Service:
                </Label>
                <NativeSelect
                  id="editListServiceSelect"
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
                <Label htmlFor="editListNotesInput" className="text-xs mb-1">
                  Notes (Optional):
                </Label>
                <Input
                  id="editListNotesInput"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Moved from 1st to 2nd service..."
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
              onClick={() => setEditingItem(null)}
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
