"use client";

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
import { NativeSelect } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { BannerAlert } from "@/components/ui/banner-alert";
import {
  Calendar,
  Check,
  Copy,
  Crown,
  Edit2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import type { AdminItem } from "@/types";
import { ADMIN_MANAGEMENT_ROLES } from "@/constants";
import { generateStrongPassword } from "@/lib/password";
import {
  useAdmins,
  useMembersList,
  useMemberDetails,
  useCreateAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
} from "@/hooks/use-admins";

export default function AdminManagementPage() {
  const { theme } = useTheme();

  // ─── THEME HELPER ───
  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // ─── TANSTACK QUERIES & MUTATIONS ───
  const {
    data: admins = [],
    isLoading: isLoadingAdmins,
  } = useAdmins();

  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useMembersList(memberSearchQuery);

  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();
  const deleteAdminMutation = useDeleteAdmin();

  // ─── FILTER & SEARCH STATE ───
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // ─── CREATE ADMIN DIALOG STATE ───
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [pageError, setPageError] = useState("");

  // Hook to fetch selected member's live details from members table
  const {
    data: memberDetails,
    isLoading: isLoadingMemberDetails,
  } = useMemberDetails(selectedMemberId);

  // When selected member's data is fetched from members table, populate the Role field with role from member's data
  useEffect(() => {
    if (memberDetails && selectedMemberId) {
      const rawRole = (memberDetails.role || "").trim().toUpperCase();
      let matched = "ADMIN";

      if (rawRole.includes("SUPER")) {
        matched = "SUPER ADMIN";
      } else if (rawRole === "ADMIN") {
        matched = "ADMIN";
      } else if (rawRole === "MEMBER") {
        matched = "MEMBER";
      } else if (
        ADMIN_MANAGEMENT_ROLES.includes(rawRole as (typeof ADMIN_MANAGEMENT_ROLES)[number])
      ) {
        matched = rawRole;
      }

      const timer = setTimeout(() => {
        setSelectedRole(matched);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!selectedMemberId) {
      const timer = setTimeout(() => {
        setSelectedRole("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [memberDetails, selectedMemberId]);

  // ─── EDIT ADMIN DIALOG STATE ───
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);
  const [editRole, setEditRole] = useState("ADMIN");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editPassword, setEditPassword] = useState("");
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editCopied, setEditCopied] = useState(false);
  const [editError, setEditError] = useState("");

  // ─── DELETE CONFIRMATION STATE ───
  const [adminToDelete, setAdminToDelete] = useState<AdminItem | null>(null);

  // Auto-generate strong password whenever create modal is opened
  const handleOpenCreateDialog = () => {
    setSelectedMemberId("");
    setMemberSearchQuery("");
    setSelectedRole("");
    setPassword(generateStrongPassword());
    setShowPassword(true);
    setCopied(false);
    setFormError("");
    setIsCreateOpen(true);
  };

  // Regenerate password on demand
  const handleRegeneratePassword = () => {
    setPassword(generateStrongPassword());
    setCopied(false);
  };

  const handleRegenerateEditPassword = () => {
    setEditPassword(generateStrongPassword());
    setEditCopied(false);
    setEditShowPassword(true);
  };

  // Copy password helper with clipboard API fallback
  const handleCopyPassword = async (passText: string, isForEdit = false) => {
    if (!passText) return;
    try {
      await navigator.clipboard.writeText(passText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = passText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (isForEdit) {
      setEditCopied(true);
      setTimeout(() => setEditCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle Create Admin Submission
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedMemberId) {
      setFormError("Please select a church member from the dropdown.");
      return;
    }

    if (!selectedRole) {
      setFormError("Please select an administrative role.");
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await createAdminMutation.mutateAsync({
        memberId: selectedMemberId,
        role: selectedRole,
        password: password.trim(),
      });

      setIsCreateOpen(false);
      setActionSuccessMsg(`Admin account provisioned for ${memberDetails?.name || "member"}!`);
      setTimeout(() => setActionSuccessMsg(""), 4000);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create administrator account."
      );
    }
  };

  // Open Edit Dialog
  const handleOpenEditDialog = (admin: AdminItem) => {
    setEditingAdmin(admin);
    const upper = (admin.role || "").toUpperCase();
    setEditRole(upper.includes("SUPER") ? "SUPER ADMIN" : upper === "MEMBER" ? "MEMBER" : "ADMIN");
    setEditIsActive(admin.isActive);
    setEditPassword("");
    setEditShowPassword(false);
    setEditCopied(false);
    setEditError("");
    setIsEditOpen(true);
  };

  // Handle Edit Admin Submission
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditError("");

    try {
      await updateAdminMutation.mutateAsync({
        id: editingAdmin.id,
        data: {
          role: editRole,
          isActive: editIsActive,
          password: editPassword.trim() ? editPassword.trim() : undefined,
        },
      });

      setIsEditOpen(false);
      setActionSuccessMsg(`Updated account details for ${editingAdmin.name}.`);
      setTimeout(() => setActionSuccessMsg(""), 4000);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update administrator account."
      );
    }
  };

  // Handle Delete / Revoke Admin (Deactivate: is_active = false)
  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;
    try {
      const name = adminToDelete.name;
      await deleteAdminMutation.mutateAsync(adminToDelete.id);
      setAdminToDelete(null);
      setActionSuccessMsg(
        `Revoked administrator access for ${name}. Account marked as Inactive and now visible under 'Inactive Only'.`
      );
      setTimeout(() => setActionSuccessMsg(""), 5000);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to revoke administrator account."
      );
    }
  };

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((adm) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        adm.name.toLowerCase().includes(q) ||
        (adm.phone && adm.phone.toLowerCase().includes(q)) ||
        (adm.email && adm.email.toLowerCase().includes(q)) ||
        adm.role.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "ALL" ||
        (() => {
          const r = (adm.role || "").trim().toUpperCase();
          if (roleFilter === "SUPER ADMIN") {
            return r === "SUPER ADMIN" || r.includes("SUPER");
          }
          if (roleFilter === "ADMIN") {
            return r === "ADMIN" && !r.includes("SUPER");
          }
          if (roleFilter === "MEMBER") {
            return r === "MEMBER";
          }
          return r === roleFilter;
        })();

      const isActiveBool = adm.isActive === true || String(adm.isActive) === "true";
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActiveBool) ||
        (statusFilter === "INACTIVE" && !isActiveBool);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  // Compute available role options including member's own role if not standard
  const roleDropdownOptions = useMemo(() => {
    const list: string[] = [...ADMIN_MANAGEMENT_ROLES];
    if (selectedRole && !list.includes(selectedRole)) {
      list.push(selectedRole);
    }
    return list;
  }, [selectedRole]);

  // Define Table Columns
  const adminColumns: ColumnDef<AdminItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Administrator",
        headerClassName: "font-bold text-xs min-w-[180px]",
        className: "font-semibold text-sm",
        cell: (adm) => (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-amber-500/30">
              {adm.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{adm.name}</span>
                {(adm.role || "").toUpperCase() === "SUPER ADMIN" && (
                  <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500/30" />
                )}
              </div>
              {adm.churchRole && (
                <span
                  className={`text-[11px] block mt-0.5 ${t(
                    "text-zinc-500",
                    "text-slate-400",
                    "text-zinc-400"
                  )}`}
                >
                  {adm.churchRole}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        headerClassName: "font-bold text-xs",
        cell: (adm) => {
          const roleUpper = (adm.role || "").toUpperCase();
          let badgeStyles = "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300";
          if (roleUpper === "SUPER ADMIN") {
            badgeStyles = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40";
          } else if (roleUpper === "ADMIN") {
            badgeStyles = "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40";
          } else if (roleUpper === "MEMBER") {
            badgeStyles = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40";
          }

          return (
            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 tracking-wider ${badgeStyles}`}>
              {roleUpper || "MEMBER"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Contact",
        headerClassName: "font-bold text-xs min-w-[150px]",
        className: "text-xs",
        cell: (adm) => (
          <div>
            <span className="block font-mono text-xs">{adm.phone || "—"}</span>
            {adm.email && (
              <span
                className={`text-[11px] block truncate max-w-[180px] ${t(
                  "text-zinc-500",
                  "text-slate-400",
                  "text-zinc-400"
                )}`}
              >
                {adm.email}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        headerClassName: "font-bold text-xs",
        cell: (adm) => (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant="outline"
              className={
                adm.isActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 text-[10px] font-semibold"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/30 text-[10px] font-semibold"
              }
            >
              {adm.isActive ? "Active" : "Inactive"}
            </Badge>
            {adm.isReset ? (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Reset Pending
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <Check className="h-2.5 w-2.5 text-emerald-500" />
                Password Set
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Provisioned On",
        headerClassName: "font-bold text-xs hidden lg:table-cell",
        className: "text-xs hidden lg:table-cell font-mono",
        cell: (adm) => {
          if (!adm.createdAt) return "—";
          try {
            return new Date(adm.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          } catch {
            return "—";
          }
        },
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        headerClassName: "font-bold text-xs text-right",
        className: "text-right",
        cell: (adm) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditDialog(adm)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${t(
                "hover:bg-zinc-100 text-zinc-600",
                "hover:bg-slate-800 text-slate-300",
                "hover:bg-zinc-800 text-zinc-300"
              )}`}
              title="Edit Role or Active Status"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            {adm.isActive ? (
              <button
                type="button"
                onClick={() => setAdminToDelete(adm)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Revoke Admin Access (Deactivate)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenEditDialog(adm)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                title="Account is Inactive. Click to edit & reactivate"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            Admin Management &amp; Access Control
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Provision credentials, manage administrative roles, and activate or deactivate system access.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateDialog}
          size="xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Admin
        </Button>
      </div>

      {/* ─── Feedback Banner Alerts ─── */}
      {pageError && (
        <BannerAlert
          variant="error"
          title="Operation Error"
          message={pageError}
          onClose={() => setPageError("")}
        />
      )}

      {actionSuccessMsg && (
        <BannerAlert
          variant="success"
          title="Success"
          message={actionSuccessMsg}
          onClose={() => setActionSuccessMsg("")}
        />
      )}

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Total Admin Accounts
            </span>
            <Shield className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-500">{admins.length}</div>
          <span className="text-[11px] text-zinc-500">Provisioned church staff</span>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Super Administrators
            </span>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif">
            {admins.filter((a) => (a.role || "").toUpperCase() === "SUPER ADMIN" && a.isActive).length}
          </div>
          <span className="text-[11px] text-zinc-500">Unrestricted full access</span>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Active Administrators
            </span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400">
            {admins.filter((a) => a.isActive).length}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Can authenticate &amp; login
          </span>
        </div>

        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Deactivated / Inactive
            </span>
            <UserX className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-red-600 dark:text-red-400">
            {admins.filter((a) => !a.isActive).length}
          </div>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
            Login blocked immediately
          </span>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search admins by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <NativeSelect
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-10"
            >
              <option value="ALL">All Roles</option>
              {ADMIN_MANAGEMENT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="w-full sm:w-36">
            <NativeSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-10"
            >
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="ALL">All Status</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* ─── Admins Table ─── */}
      <DataTable
        data={filteredAdmins}
        columns={adminColumns}
        isLoading={isLoadingAdmins}
        emptyMessage={
          statusFilter === "INACTIVE"
            ? "No inactive administrator accounts found."
            : statusFilter === "ACTIVE"
              ? "No active administrator accounts found."
              : "No administrator accounts found. Click 'Create New Admin' to provision credentials for a church member."
        }
      />

      {/* ─── CREATE ADMIN DIALOG ─── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          className={`w-[96vw] max-w-lg max-h-[92vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Create New Administrator
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a church member from the members table, verify their profile, and assign administrative credentials.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <BannerAlert
              variant="error"
              title="Validation Error"
              message={formError}
              onClose={() => setFormError("")}
            />
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4 py-2">
            {/* Step 1: Member Selection Dropdown (All members from members table) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-500" />
                Select Member <span className="text-red-500">*</span>
              </label>
              <NativeSelect
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  setFormError("");
                }}
                searchable
                searchPlaceholder="Search member by name..."
                onSearch={(q) => setMemberSearchQuery(q)}
                isLoading={isLoadingMembers}
                emptyMessage="No church members found"
                required
              >
                <option value="" disabled>
                  {isLoadingMembers ? "Loading church members..." : "— Choose a church member —"}
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            {/* Step 2: Member Details Preview Card (Fetched directly from members table) */}
            {isLoadingMemberDetails && selectedMemberId && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs flex items-center justify-center gap-2 text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching member profile from members table...</span>
              </div>
            )}

            {memberDetails && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-3 animate-in fade-in duration-200 ${t(
                  "border-zinc-200 bg-zinc-50/90 text-zinc-800",
                  "border-slate-800 bg-slate-800/50 text-slate-200",
                  "border-zinc-800 bg-zinc-900/50 text-zinc-200"
                )}`}
              >
                {/* Header: Member Name */}
                <div className="flex items-center justify-between border-b pb-2.5 border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-amber-500/30">
                      {memberDetails.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm">{memberDetails.name}</span>
                  </div>
                  {memberDetails.isHead && (
                    <Badge className="bg-amber-500 text-zinc-950 text-[10px] font-bold py-0.5 px-1.5 flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Head
                    </Badge>
                  )}
                </div>

                {/* Just the 5 requested fields: Church Role, Phone, Email, DOB, Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* 1. Church Role */}
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>
                      Church Role:{" "}
                      <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {memberDetails.churchRole || memberDetails.role || "—"}
                      </strong>
                    </span>
                  </div>

                  {/* 2. Phone */}
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{memberDetails.phone || "—"}</span>
                  </div>

                  {/* 3. Email */}
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{memberDetails.email || "—"}</span>
                  </div>

                  {/* 4. DOB */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>
                      DOB:{" "}
                      <strong className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        {memberDetails.dob || "—"}
                      </strong>
                    </span>
                  </div>
                </div>

                {memberDetails.hasAdminAccount && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>
                      Currently has an admin account (Role: {memberDetails.adminRole || "Admin"}). Submitting will update credentials.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Role Selection Dropdown (Disabled until choosing a church member) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Role <span className="text-red-500">*</span>
              </label>
              <NativeSelect
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={!selectedMemberId}
                placeholder={!selectedMemberId ? "— Choose a church member first —" : "Select Role"}
                required
              >
                {!selectedRole && (
                  <option value="" disabled>
                    {!selectedMemberId ? "— Choose a church member first —" : "Select Role"}
                  </option>
                )}
                {roleDropdownOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </NativeSelect>
              {!selectedMemberId && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Select a church member above to enable and assign an administrative role.
                </p>
              )}
            </div>

            {/* Step 4: Strong Password Generator & Copy Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  New Password <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Strong &amp; Auto-Generated
                </span>
              </div>

              <div className="relative flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCopied(false);
                    }}
                    placeholder="Enter or generate password"
                    className="font-mono text-sm tracking-wider pr-10 h-10 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyPassword(password, false)}
                  className="h-10 w-10 shrink-0 rounded-xl"
                  title="Copy password to clipboard"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegeneratePassword}
                  className="h-10 w-10 shrink-0 rounded-xl"
                  title="Generate new strong password"
                >
                  <RefreshCw className="h-4 w-4 text-amber-500" />
                </Button>
              </div>

              {copied && (
                <p className="text-[11px] text-emerald-600 font-semibold animate-in fade-in duration-150">
                  Password copied to clipboard! Share it securely with the administrator.
                </p>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-9 px-5 py-2 rounded-full text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAdminMutation.isPending || !selectedMemberId}
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs"
              >
                {createAdminMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT ADMIN DIALOG (Includes Inactive field) ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent
          className={`w-[96vw] max-w-lg max-h-[92vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" />
              Edit Administrator Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update role permission levels, activate/deactivate account access, or reset password.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <BannerAlert
              variant="error"
              title="Update Error"
              message={editError}
              onClose={() => setEditError("")}
            />
          )}

          {editingAdmin && (
            <form onSubmit={handleUpdateAdmin} className="space-y-4 py-2">
              {/* Member Card */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${t(
                  "border-zinc-200 bg-zinc-50/80 text-zinc-800",
                  "border-slate-800 bg-slate-800/40 text-slate-200",
                  "border-zinc-800 bg-zinc-900/40 text-zinc-200"
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{editingAdmin.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {editingAdmin.churchRole || "Church Member"}
                  </Badge>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {editingAdmin.phone} {editingAdmin.email ? `• ${editingAdmin.email}` : ""}
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Role
                </label>
                <NativeSelect
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                >
                  {ADMIN_MANAGEMENT_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              {/* Status Field: Make User Inactive during Edit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-amber-500" />
                    Account Access Status
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      editIsActive
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px]"
                        : "bg-red-500/10 text-red-600 border-red-300 text-[10px]"
                    }
                  >
                    {editIsActive ? "Active" : "Inactive"}
                  </Badge>
                </label>

                <NativeSelect
                  value={editIsActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setEditIsActive(e.target.value === "ACTIVE")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </NativeSelect>

                {!editIsActive && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    When inactive, this user cannot log in. An error message will notify them that their account has been deactivated.
                  </p>
                )}
              </div>

              {/* Optional Reset Password Field */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    Reset Password (Optional)
                  </span>
                  <span className="text-[10px] text-zinc-400 lowercase">(leave blank to keep current)</span>
                </label>

                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Input
                      type={editShowPassword ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => {
                        setEditPassword(e.target.value);
                        setEditCopied(false);
                      }}
                      placeholder="Enter new password to reset"
                      className="font-mono text-sm tracking-wider pr-10 h-10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPassword(!editShowPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {editShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPassword(editPassword, true)}
                    disabled={!editPassword}
                    className="h-10 w-10 shrink-0 rounded-xl"
                    title="Copy new password"
                  >
                    {editCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerateEditPassword}
                    className="h-10 w-10 shrink-0 rounded-xl"
                    title="Generate new password"
                  >
                    <RefreshCw className="h-4 w-4 text-amber-500" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-9 px-5 py-2 rounded-full text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateAdminMutation.isPending}
                  className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs"
                >
                  {updateAdminMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── REVOKE / DELETE CONFIRMATION DIALOG ─── */}
      <Dialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <DialogContent
          className={`max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Revoke Administrator Access
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to revoke administrative rights for{" "}
              <strong>{adminToDelete?.name}</strong>? Their account status will be set to{" "}
              <strong>Inactive (is_active = false)</strong>. They will no longer be able to log in to the admin portal and will only appear under the &quot;Inactive Only&quot; filter.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdminToDelete(null)}
              className="h-9 px-5 py-2 rounded-full text-sm font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteAdminMutation.isPending}
              className="h-9 px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xs"
            >
              {deleteAdminMutation.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
