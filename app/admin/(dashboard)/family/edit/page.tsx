"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import { BannerAlert } from "@/components/ui/banner-alert";
import { calculateYears, cn } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Droplet,
  Edit2,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState, useMemo } from "react";
import { type MemberFormData, emptyMemberForm, type Status } from "@/types";
import { useFamily, useUpdateFamily } from "@/hooks/use-families";
import { AgeBadge } from "@/components/ttc/age-badge";
import { StatusBadge } from "@/components/ttc/status-badge";
import {
  BLOOD_GROUPS,
  CHURCH_ROLES,
  GENDERS,
  MARITAL_STATUSES,
  STATUS_OPTIONS,
} from "@/constants";

function EditFamilyContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = searchParams.get("id") || "";

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // ─── TanStack Query: Live query for family details ───
  const {
    data: familyData,
    isLoading,
    isError,
    error,
  } = useFamily(familyId);

  // ─── TanStack Mutation: Update family & sync members ───
  const updateMutation = useUpdateFamily();

  const [familyName, setFamilyName] = useState("");
  const [familyStatus, setFamilyStatus] = useState<Status>("ACTIVE");
  const [familyInactiveReason, setFamilyInactiveReason] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("Karamadai");
  const [address, setAddress] = useState("");
  const [members, setMembers] = useState<MemberFormData[]>([]);

interface ApiFamilyMember {
  id: string;
  name: string;
  is_head?: boolean;
  age?: number | null;
  dob?: string | null;
  dom?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  blood_group?: string | null;
  status?: string | null;
  inactive_reason?: string | null;
  marital_status?: string | null;
  is_looking_for_alliance?: boolean;
  occupation?: string | null;
  church_role?: string | null;
  role?: string | null;
}

  // Synchronize query data into editable form state
  useEffect(() => {
    if (!familyData) return;
    const timer = setTimeout(() => {
      const rawMembers = (familyData.members || []) as ApiFamilyMember[];
      const head = rawMembers.find((m) => m.is_head) || rawMembers[0];
      setFamilyName(head?.name ? head.name : `Family #${familyData.id}`);
      setFamilyStatus(familyData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
      setFamilyInactiveReason(familyData.inactive_reason || "");
      setLocation(familyData.location || "");
      setRegion(familyData.region || "Karamadai");
      setAddress(familyData.address || "");
      setMembers(
        rawMembers.map((m) => {
          const dobStr = m.dob ? m.dob.split("T")[0] : "";
          const domStr = m.dom ? m.dom.split("T")[0] : "";
          return {
            id: m.id,
            name: m.name,
            isHead: !!m.is_head,
            age: m.age ?? (dobStr ? calculateYears(dobStr) : ""),
            gender: m.gender || "",
            bloodGroup: m.blood_group || "",
            dob: dobStr,
            status: (m.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as Status,
            inactiveReason: m.inactive_reason || "",
            maritalStatus: m.marital_status || "",
            dateOfMarriage: domStr,
            yearsOfMarriage: domStr ? calculateYears(domStr) : "",
            isLookingForAlliance: !!m.is_looking_for_alliance,
            occupation: m.occupation || "",
            role: m.church_role || m.role || "",
            phone: m.phone || "",
            email: m.email || "",
          };
        })
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [familyData]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>(emptyMemberForm);
  const [memberFormError, setMemberFormError] = useState("");

  // Derived head member
  const headMember = members.find((m) => m.isHead);

  // Check if any OTHER member in the family is already designated as Head
  const otherMemberIsHead = members.some((m) => m.isHead && m.id !== editingMemberId);
  const showHeadCheckbox = !otherMemberIsHead;

  const [validationError, setValidationError] = useState("");

  const editMemberColumns: ColumnDef<MemberFormData>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Member Name",
        headerClassName: "font-bold text-xs",
        className: "font-semibold text-sm",
        cell: (member) => (
          <div>
            <div className="flex items-center gap-2">
              <span>{member.name}</span>
              {member.isHead && (
                <Badge className="bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 hover:bg-amber-400">
                  <Crown className="h-2.5 w-2.5" /> Head
                </Badge>
              )}
            </div>
            {member.phone && (
              <span
                className={`text-[11px] block mt-0.5 ${t(
                  "text-zinc-500",
                  "text-slate-400",
                  "text-zinc-400"
                )}`}
              >
                {member.phone}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        headerClassName: "font-bold text-xs",
        className: "text-xs",
        cell: (member) => (
          <span
            className={`px-2 py-0.5 rounded-md font-medium ${t(
              "bg-zinc-100 text-zinc-700",
              "bg-slate-800 text-slate-300",
              "bg-zinc-800 text-zinc-300"
            )}`}
          >
            {member.role || "Member"}
          </span>
        ),
      },
      {
        accessorKey: "age",
        header: "Age",
        headerClassName: "font-bold text-xs",
        cell: (member) => <AgeBadge age={member.age} showAge />,
      },
      {
        accessorKey: "gender",
        header: "Gender",
        headerClassName: "font-bold text-xs",
        className: "text-xs capitalize",
        cell: (member) => member.gender?.toLowerCase() || "—",
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Group",
        headerClassName: "font-bold text-xs hidden sm:table-cell",
        className: "text-xs hidden sm:table-cell font-mono text-red-600 dark:text-red-400",
        cell: (member) => member.bloodGroup || "—",
      },
      {
        accessorKey: "maritalStatus",
        header: "Marital Status",
        headerClassName: "font-bold text-xs hidden md:table-cell",
        className: "text-xs hidden md:table-cell",
        cell: (member) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="capitalize">
                {member.maritalStatus ? member.maritalStatus.toLowerCase() : "—"}
              </span>
              {member.maritalStatus === "UNMARRIED" && member.isLookingForAlliance && (
                <Badge
                  variant="outline"
                  title="Looking for matrimonial alliance"
                  className="text-[10px] font-semibold px-2 py-0.5 h-5 bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/40 inline-flex items-center gap-1 leading-none shadow-2xs"
                >
                  <Heart className="h-2.5 w-2.5 text-pink-500 fill-pink-500/30 shrink-0" />
                  Alliance
                </Badge>
              )}
            </div>
            {member.maritalStatus === "MARRIED" && member.dateOfMarriage && (
              <span
                className={`text-[10px] font-mono leading-none ${t(
                  "text-zinc-500",
                  "text-slate-400",
                  "text-zinc-400"
                )}`}
              >
                DOM: {member.dateOfMarriage}{" "}
                {calculateYears(member.dateOfMarriage) !== ""
                  ? `(${calculateYears(member.dateOfMarriage)} yrs)`
                  : ""}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        headerClassName: "font-bold text-xs",
        cell: (member) => <StatusBadge status={member.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        headerClassName: "font-bold text-xs text-right",
        className: "text-right",
        cell: (member) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditMember(member)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="Edit Member"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMember(member.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 cursor-pointer"
              title="Remove Member"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );
  const isSubmitting = updateMutation.isPending;
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleOpenAddMember = () => {
    setEditingMemberId(null);
    const hasHeadAlready = members.some((m) => m.isHead);
    setMemberForm({
      ...emptyMemberForm,
      id: `MEM-${Date.now()}`,
      status: "ACTIVE",
      gender: "",
      bloodGroup: "",
      maritalStatus: "",
      role: "",
      dateOfMarriage: "",
      yearsOfMarriage: "",
      isLookingForAlliance: false,
      isHead: !hasHeadAlready,
    });
    setMemberFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditMember = (member: MemberFormData) => {
    setEditingMemberId(member.id);
    const calculatedAge = member.dob ? calculateYears(member.dob) : member.age;
    const calculatedYearsOfMarriage = member.dateOfMarriage ? calculateYears(member.dateOfMarriage) : "";
    setMemberForm({
      ...member,
      age: calculatedAge !== "" ? calculatedAge : member.age,
      dateOfMarriage: member.dateOfMarriage || "",
      yearsOfMarriage: calculatedYearsOfMarriage,
      isLookingForAlliance: !!member.isLookingForAlliance,
    });
    setMemberFormError("");
    setIsModalOpen(true);
  };

  const handleDeleteMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    const head = updated.find((m) => m.isHead);
    setFamilyName(head ? head.name : "");
  };

  const handleDobChange = (dobValue: string) => {
    const calculatedAge = calculateYears(dobValue);
    setMemberForm((prev) => ({
      ...prev,
      dob: dobValue,
      age: calculatedAge,
    }));
  };

  const handleDomChange = (domValue: string) => {
    const calculatedYears = calculateYears(domValue);
    setMemberForm((prev) => ({
      ...prev,
      dateOfMarriage: domValue,
      yearsOfMarriage: calculatedYears,
    }));
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      setMemberFormError("Member name is required.");
      return;
    }
    if (!memberForm.dob || !memberForm.dob.trim()) {
      setMemberFormError("Date of Birth is required.");
      return;
    }
    if (!memberForm.gender) {
      setMemberFormError("Please select Gender.");
      return;
    }
    if (!memberForm.bloodGroup) {
      setMemberFormError("Please select Blood Group.");
      return;
    }
    if (!memberForm.maritalStatus) {
      setMemberFormError("Please select Marital Status.");
      return;
    }
    if (memberForm.maritalStatus === "MARRIED" && !memberForm.dateOfMarriage?.trim()) {
      setMemberFormError("Date of Marriage is required for married members.");
      return;
    }
    if (!memberForm.role || !memberForm.role.trim()) {
      setMemberFormError("Please select Ministry / Church Role.");
      return;
    }
    if (!memberForm.phone || !memberForm.phone.trim()) {
      setMemberFormError("Phone Number is required.");
      return;
    }
    if (memberForm.status === "INACTIVE" && !memberForm.inactiveReason.trim()) {
      setMemberFormError("Please provide an inactive reason.");
      return;
    }

    let updated = [...members];
    const calculatedYearsOfMarriage = memberForm.maritalStatus === "MARRIED" && memberForm.dateOfMarriage
      ? calculateYears(memberForm.dateOfMarriage)
      : "";

    // Newly added members are always ACTIVE by default (read-only)
    const memberToSave: MemberFormData = {
      ...memberForm,
      status: !editingMemberId ? "ACTIVE" : memberForm.status,
      isHead: showHeadCheckbox ? memberForm.isHead : false,
      dateOfMarriage: memberForm.maritalStatus === "MARRIED" ? memberForm.dateOfMarriage : "",
      yearsOfMarriage: calculatedYearsOfMarriage,
      isLookingForAlliance: memberForm.maritalStatus === "UNMARRIED" ? !!memberForm.isLookingForAlliance : false,
    };
    if (memberToSave.isHead) {
      updated = updated.map((m) =>
        m.id === editingMemberId ? m : { ...m, isHead: false }
      );
    }

    if (editingMemberId) {
      updated = updated.map((m) => (m.id === editingMemberId ? memberToSave : m));
    } else {
      updated.push(memberToSave);
    }

    setMembers(updated);
    const head = updated.find((m) => m.isHead);
    if (head) {
      setFamilyName(head.name);
    }

    setIsModalOpen(false);
    setMemberForm(emptyMemberForm);
    setEditingMemberId(null);
  };

  const handleUpdateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setValidationError("Residential Address is required.");
      return;
    }
    if (!region.trim()) {
      setValidationError("Please select a Region.");
      return;
    }
    if (members.length === 0) {
      setValidationError("At least one member is required.");
      return;
    }
    const head = members.find((m) => m.isHead);
    if (!head) {
      setValidationError("Please designate at least one member as the Family Head.");
      return;
    }
    setValidationError("");

    try {
      await updateMutation.mutateAsync({
        id: familyId,
        data: {
          location,
          region,
          address,
          status: familyStatus,
          inactiveReason: familyInactiveReason,
          members: members.map((m) => ({
            id: m.id && !m.id.startsWith("MEM-") ? m.id : undefined,
            name: m.name,
            isHead: m.isHead,
            age: m.age ? Number(m.age) : null,
            gender: m.gender || null,
            bloodGroup: m.bloodGroup || null,
            dob: m.dob || null,
            status: m.status,
            inactiveReason: m.inactiveReason || null,
            maritalStatus: m.maritalStatus || null,
            dateOfMarriage: m.dateOfMarriage || null,
            isLookingForAlliance: m.isLookingForAlliance ?? false,
            occupation: m.occupation || null,
            role: "MEMBER",
            churchRole: m.role || null,
            phone: m.phone || null,
            email: m.email || null,
          })),
        },
      });

      setShowSuccessModal(true);
    } catch (err) {
      console.error("Update error:", err);
      setValidationError(
        err instanceof Error ? err.message : "Network error while updating family."
      );
    }
  };

  if (!familyId || isError) {
    return (
      <div className="max-w-5xl mx-auto py-16 space-y-6">
        <Link
          href="/admin/families"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${t(
            "text-zinc-600 hover:text-zinc-950",
            "text-slate-400 hover:text-slate-100",
            "text-zinc-400 hover:text-zinc-100"
          )}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Church Members Directory
        </Link>
        <div
          className={`p-8 rounded-2xl border text-center space-y-4 ${t(
            "bg-white border-zinc-200",
            "bg-[#073642] border-[#094555]",
            "bg-zinc-900 border-zinc-800"
          )}`}
        >
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold">Unable to Load Family</h2>
          <p className={`text-sm ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            {error instanceof Error ? error.message : "No family record found for this ID."}
          </p>
          <Button onClick={() => router.push("/admin/families")}>
            Return to Directory
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className={`text-sm ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
          Loading family record...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/admin/families"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${t(
            "text-zinc-600 hover:text-zinc-950",
            "text-slate-400 hover:text-slate-100",
            "text-zinc-400 hover:text-zinc-100"
          )}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Church Members Directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight flex items-center gap-2.5">
              <Users className="h-7 w-7 text-amber-500" />
              Edit Family Record
            </h1>
            <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
              Update family info, add new household members, or modify member roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size={"sm"}
              variant={"outline"}
              onClick={() => router.push("/admin/families")}
            >
              Cancel
            </Button>
            <Button
              size={"sm"}
              disabled={isSubmitting}
              onClick={handleUpdateFamily}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {validationError && (
        <BannerAlert
          variant="error"
          title="Validation Error"
          message={validationError}
          onClose={() => setValidationError("")}
        />
      )}

      {/* ─── CARD 1: FAMILY COMMON DETAILS (TOP) ─── */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 ${t(
          "bg-white border-zinc-200",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <div className="border-b pb-4 flex items-center justify-between border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold font-sans flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              1. Family Primary Information
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Household identifiers and shared contacts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-500" />
              Family Name
            </label>
            <Input
              type="text"
              placeholder="Auto-filled once Family Head is designated"
              value={headMember ? headMember.name : (familyName || "")}
              readOnly
              className="bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed font-medium text-zinc-900 dark:text-zinc-100"
            />
            <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Automatically displays the Family Head&apos;s name (read-only)
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              Family Status
            </label>
            <NativeSelect
              value={familyStatus}
              onChange={(e) => setFamilyStatus(e.target.value as Status)}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </NativeSelect>
          </div>

          {familyStatus === "INACTIVE" && (
            <div className="md:col-span-2 space-y-1.5 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <label className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                Inactive Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={familyInactiveReason}
                onChange={(e) => setFamilyInactiveReason(e.target.value)}
                className="rounded-xl min-h-[70px] text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Location Link / GPS Coordinates
            </label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              <span>Region <span className="text-red-500">*</span></span>
            </label>
            <NativeSelect
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Select Region"
              required
            >
              <option value="" disabled>Select Region</option>
              <option value="Karamadai">Karamadai</option>
              <option value="Mettupalayam">Mettupalayam</option>
              <option value="Narasimanaickenpalayam">Narasimanaickenpalayam</option>
              <option value="Periyanaickenpalayam">Periyanaickenpalayam</option>
              <option value="Veerapandi">Veerapandi</option>
            </NativeSelect>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-amber-500" />
              <span>Residential Address <span className="text-red-500">*</span></span>
            </label>
            <Textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl min-h-[85px] text-sm"
            />
          </div>
        </div>
      </div>

      {/* ─── CARD 2: MEMBERS SECTION ─── */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 ${t(
          "bg-white border-zinc-200",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <div>
            <h2 className="text-base font-semibold font-sans flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              2. Family Members ({members.length})
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Click edit on any member or click Add Member to append new members.
            </p>
          </div>

          {members.length > 0 && (
            <Button
              size={"sm"}
              type="button"
              onClick={handleOpenAddMember}
            >
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        {/* Table */}
        <DataTable
          data={members}
          columns={editMemberColumns}
          className="rounded-xl shadow-xs"
        />

        {/* Bottom Save Action */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={() => router.push("/admin/families")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size={"sm"}
            disabled={isSubmitting || members.length === 0}
            onClick={handleUpdateFamily}
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSubmitting ? "Saving Changes..." : "Save Family Changes"}
          </Button>
        </div>
      </div>

      {/* Member Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className={`w-[130vw] max-w-4xl sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-500" />
              {editingMemberId ? "Edit Family Member" : "Add Family Member"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update member attributes, role, and details.
            </DialogDescription>
          </DialogHeader>

          {memberFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{memberFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveMember} noValidate className="space-y-4 py-2">
            {/* Row 1: Full Name, Membership Status & Family Head */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Full Name */}
              <div className={cn("space-y-1.5", showHeadCheckbox ? "sm:col-span-1" : "sm:col-span-2")}>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-500" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="e.g. David Samuel"
                  required
                />
              </div>

              {/* Membership Status (Read-only Active for newly added members) */}
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  Membership Status
                </label>
                {!editingMemberId ? (
                  <div className="h-9 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 flex items-center justify-between text-xs select-none">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[9px]">
                      Read-only
                    </Badge>
                  </div>
                ) : (
                  <NativeSelect
                    value={memberForm.status}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        status: e.target.value as Status,
                      })
                    }
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </div>

              {/* Is Head Checkbox (only visible if no other member is already designated as family head) */}
              {showHeadCheckbox && (
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 opacity-0 select-none hidden sm:flex">
                    <span>Household Head</span>
                  </label>
                  <label
                    className={`h-9 flex items-center gap-2.5 px-3 rounded-xl border cursor-pointer transition-colors ${memberForm.isHead
                      ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                      : t(
                        "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700",
                        "border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-300",
                        "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300"
                      )
                      }`}
                  >
                    <Checkbox
                      checked={memberForm.isHead}
                      onCheckedChange={(checked) =>
                        setMemberForm({ ...memberForm, isHead: !!checked })
                      }
                    />
                    <span className="text-xs font-bold select-none flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      Family Head
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Conditional Inactive Reason (Shown directly below Row 1 when status is INACTIVE) */}
            {memberForm.status === "INACTIVE" && (
              <div className="space-y-1.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 animate-in fade-in duration-200">
                <label className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  Inactive Reason <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Specify reason for inactive membership (e.g., relocated, transferred, deceased)..."
                  value={memberForm.inactiveReason}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, inactiveReason: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span>Date of Birth <span className="text-red-500">*</span></span>
                </label>
                <DatePicker
                  required
                  value={memberForm.dob}
                  maxDate={new Date()}
                  onChange={(val) => handleDobChange(val)}
                  placeholder="DD-MM-YYYY"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Age
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal lowercase">(auto calculated)</span>
                </label>
                <Input
                  type="text"
                  placeholder="Auto from DOB"
                  value={memberForm.age !== "" ? memberForm.age : ""}
                  readOnly
                  tabIndex={-1}
                  className="font-mono bg-zinc-100/60 dark:bg-zinc-800/40 cursor-not-allowed select-none font-semibold text-zinc-700 dark:text-zinc-300 h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-500" />
                  <span>Gender <span className="text-red-500">*</span></span>
                </label>
                <NativeSelect
                  required
                  placeholder="Select Gender"
                  value={memberForm.gender}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      gender: e.target.value as "MALE" | "FEMALE" | "OTHER",
                    })
                  }
                >
                  <option value="" disabled>Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-red-500" />
                  <span>Blood Group <span className="text-red-500">*</span></span>
                </label>
                <NativeSelect
                  required
                  placeholder="Select Blood Group"
                  value={memberForm.bloodGroup}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, bloodGroup: e.target.value })
                  }
                >
                  <option value="" disabled>Select Blood Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-pink-500" />
                  <span>Marital Status <span className="text-red-500">*</span></span>
                </label>
                <NativeSelect
                  required
                  placeholder="Select Marital Status"
                  value={memberForm.maritalStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as MemberFormData["maritalStatus"];
                    setMemberForm({
                      ...memberForm,
                      maritalStatus: newStatus,
                      dateOfMarriage: newStatus === "MARRIED" ? memberForm.dateOfMarriage : "",
                      isLookingForAlliance: newStatus === "UNMARRIED" ? memberForm.isLookingForAlliance : false,
                    });
                  }}
                >
                  <option value="" disabled>Select Marital Status</option>
                  {MARITAL_STATUSES.map((ms) => (
                    <option key={ms.value} value={ms.value}>
                      {ms.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                  <span>Ministry / Church Role <span className="text-red-500">*</span></span>
                </label>
                <NativeSelect
                  required
                  placeholder="Select Church Role"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                >
                  <option value="" disabled>Select Church Role</option>
                  {CHURCH_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Dynamic Field: Date of Marriage & Years of Marriage (Mandatory when Married) */}
            {memberForm.maritalStatus === "MARRIED" && (
              <div className="p-3.5 rounded-xl border border-pink-500/20 bg-pink-500/5 animate-in fade-in duration-200 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Date of Marriage */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-pink-500" />
                      Date of Marriage <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={memberForm.dateOfMarriage || ""}
                      maxDate={new Date()}
                      onChange={(val) => handleDomChange(val)}
                      required
                      placeholder="DD-MM-YYYY"
                    />
                  </div>

                  {/* Years of Marriage (Read-only, auto-calculated like Age) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-pink-500" />
                        Years of Marriage
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal lowercase">(auto from DOM)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Auto from DOM"
                      value={
                        memberForm.dateOfMarriage && calculateYears(memberForm.dateOfMarriage) !== ""
                          ? `${calculateYears(memberForm.dateOfMarriage)} ${calculateYears(memberForm.dateOfMarriage) === 1 ? "Year" : "Years"
                          }${calculateYears(memberForm.dateOfMarriage) === 0 ? " (Newly Married)" : ""}`
                          : ""
                      }
                      readOnly
                      tabIndex={-1}
                      className="font-mono bg-zinc-100/60 dark:bg-zinc-800/40 cursor-not-allowed select-none font-semibold text-zinc-700 dark:text-zinc-300 h-9 text-xs"
                    />
                  </div>
                </div>

                <p className={`text-[11px] ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                  Required field for married members for marriage registry and church wedding anniversaries.
                </p>
              </div>
            )}

            {/* Dynamic Field: Is looking for alliance (Optional when Unmarried / Single) */}
            {memberForm.maritalStatus === "UNMARRIED" && (
              <div className="p-3.5 rounded-xl border border-pink-500/20 bg-pink-500/5 animate-in fade-in duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-pink-500" />
                    Matrimonial Fellowship
                  </span>
                  <span className={`text-[11px] block mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                    Indicate if this single member is seeking a matrimonial alliance through church fellowship.
                  </span>
                </div>
                <label
                  className={`h-9 flex items-center gap-2.5 px-3 rounded-xl border cursor-pointer select-none transition-colors shrink-0 ${memberForm.isLookingForAlliance
                    ? "border-pink-500 bg-pink-500/10 text-pink-900 dark:text-pink-200"
                    : t(
                      "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
                      "border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300",
                      "border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300"
                    )
                    }`}
                >
                  <Checkbox
                    checked={!!memberForm.isLookingForAlliance}
                    onCheckedChange={(checked) =>
                      setMemberForm({
                        ...memberForm,
                        isLookingForAlliance: !!checked,
                      })
                    }
                  />
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    Is looking for alliance
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-amber-500" />
                  <span>Phone Number <span className="text-red-500">*</span></span>
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-amber-500" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="member@gmail.com"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                  Occupation
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Software Engineer, Teacher, Student"
                  value={memberForm.occupation}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, occupation: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button
                type="button"
                size={"sm"}
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size={"sm"}
              >
                {editingMemberId ? "Update Member" : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className={`max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold font-serif">
              Family Updated Successfully!
            </DialogTitle>
            <p className={`text-xs ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
              Changes to <strong>{familyName}</strong> and its members have been updated.
            </p>
            <Button
              onClick={() => router.push("/admin/families")}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md mt-4"
            >
              Back to Families Directory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EditFamilyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold">
          Loading family record...
        </div>
      }
    >
      <EditFamilyContent />
    </Suspense>
  );
}
