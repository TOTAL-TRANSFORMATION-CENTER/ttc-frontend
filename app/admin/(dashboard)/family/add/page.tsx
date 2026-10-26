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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
  Shield,
  Trash2,
  User,
  UserPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export interface MemberFormData {
  id: string;
  name: string;
  isHead: boolean;
  age: number | "";
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  bloodGroup: string;
  dob: string;
  status: "ACTIVE" | "INACTIVE";
  inactiveReason: string;
  maritalStatus: "MARRIED" | "UNMARRIED" | "DIVORCED" | "WIDOWED" | "";
  dateOfMarriage?: string;
  yearsOfMarriage?: number | "";
  isLookingForAlliance?: boolean;
  occupation: string;
  role: string;
  phone: string;
  email: string;
}

const emptyMemberForm: MemberFormData = {
  id: "",
  name: "",
  isHead: false,
  age: "",
  gender: "",
  bloodGroup: "",
  dob: "",
  status: "ACTIVE",
  inactiveReason: "",
  maritalStatus: "",
  dateOfMarriage: "",
  yearsOfMarriage: "",
  isLookingForAlliance: false,
  occupation: "",
  role: "",
  phone: "",
  email: "",
};

export default function AddFamilyPage() {
  const { theme } = useTheme();
  const router = useRouter();

  // ─── THEME HELPER ───
  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // ─── FAMILY FORM STATE ───
  const [familyName, setFamilyName] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");

  // ─── MEMBERS LIST STATE ───
  const [members, setMembers] = useState<MemberFormData[]>([]);

  // Derived head member
  const headMember = members.find((m) => m.isHead);

  // ─── MEMBER MODAL STATE ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>(emptyMemberForm);
  const [memberFormError, setMemberFormError] = useState("");

  // Check if any OTHER member in the family is already designated as Head
  const otherMemberIsHead = members.some((m) => m.isHead && m.id !== editingMemberId);
  const showHeadCheckbox = !otherMemberIsHead;

  // ─── PAGE VALIDATION & SUBMISSION ───
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Open modal for adding a new member
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
      // If no members or no head exists yet, default isHead to true, otherwise false
      isHead: !hasHeadAlready,
    });
    setMemberFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing an existing member
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

  // Delete member
  const handleDeleteMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    const head = updated.find((m) => m.isHead);
    setFamilyName(head ? head.name : "");
  };

  // Save member from modal
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

    let updatedMembers = [...members];

    const calculatedYearsOfMarriage = memberForm.maritalStatus === "MARRIED" && memberForm.dateOfMarriage
      ? calculateYears(memberForm.dateOfMarriage)
      : "";

    // If checkbox was hidden for this member, ensure isHead is false
    // Newly added members are always ACTIVE by default (read-only)
    const memberToSave: MemberFormData = {
      ...memberForm,
      status: !editingMemberId ? "ACTIVE" : memberForm.status,
      isHead: showHeadCheckbox ? memberForm.isHead : false,
      dateOfMarriage: memberForm.maritalStatus === "MARRIED" ? memberForm.dateOfMarriage : "",
      yearsOfMarriage: calculatedYearsOfMarriage,
      isLookingForAlliance: memberForm.maritalStatus === "UNMARRIED" ? !!memberForm.isLookingForAlliance : false,
    };

    // If this member is marked as Head, unmark any previous head
    if (memberToSave.isHead) {
      updatedMembers = updatedMembers.map((m) =>
        m.id === editingMemberId ? m : { ...m, isHead: false }
      );
    }

    if (editingMemberId) {
      // Edit mode
      updatedMembers = updatedMembers.map((m) =>
        m.id === editingMemberId ? memberToSave : m
      );
    } else {
      // Add mode
      updatedMembers.push(memberToSave);
    }

    setMembers(updatedMembers);
    const head = updatedMembers.find((m) => m.isHead);
    if (head) {
      setFamilyName(head.name);
    }

    setIsModalOpen(false);
    setMemberForm(emptyMemberForm);
    setEditingMemberId(null);
    setValidationError("");
  };

  // Handle Create Family
  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setValidationError("Permanent / Residential Address is required.");
      return;
    }
    if (!region.trim()) {
      setValidationError("Please select a Region.");
      return;
    }
    if (members.length === 0) {
      setValidationError("At least one member must be added before creating a family.");
      return;
    }
    const head = members.find((m) => m.isHead);
    if (!head) {
      setValidationError("Please designate at least one member as the Family Head.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 600);
  };

  // Auto calculate age from DOB
  const handleDobChange = (dobValue: string) => {
    const calculatedAge = calculateYears(dobValue);
    setMemberForm((prev) => ({
      ...prev,
      dob: dobValue,
      age: calculatedAge,
    }));
  };

  // Auto calculate years of marriage from DOM
  const handleDomChange = (domValue: string) => {
    const calculatedYears = calculateYears(domValue);
    setMemberForm((prev) => ({
      ...prev,
      dateOfMarriage: domValue,
      yearsOfMarriage: calculatedYears,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ─── Breadcrumb & Header ─── */}
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
              Register New Family
            </h1>
            <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
              Fill in the primary family details and add all individual household members.
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
              onClick={handleCreateFamily}
            >
              {isSubmitting ? "Saving..." : "Create Family"}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Validation Error Banner ─── */}
      {validationError && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ─── CARD 1: FAMILY COMMON DETAILS (TOP) ─── */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 transition-colors ${t(
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
              Enter common household identifying data
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 border-amber-300 text-[11px]"
          >
            Family Unit
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Family Name */}
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
              Automatically set to the Family Head&apos;s name (read-only)
            </span>
          </div>

          {/* Family Status (Read-only Active for new family) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              Family Status
            </label>
            <div className="h-9 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 flex items-center justify-between text-sm select-none">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]">
                Read-only
              </Badge>
            </div>
            <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              All newly registered families are Active by default (read-only)
            </span>
          </div>

          {/* Location URL / Map coordinates */}
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Location (Google Maps Link or Landmark)
            </label>
            <Input
              type="text"
              placeholder="https://maps.google.com/?q=... or Landmark"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Quick navigation for house visits
            </span>
          </div>

          {/* Region */}
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
            <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              Church fellowship zone
            </span>
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-amber-500" />
              <span>Permanent / Residential Address <span className="text-red-500">*</span></span>
            </label>
            <Textarea
              required
              placeholder="Door number, street name, locality, city and postal pincode..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-xl min-h-[85px] text-sm"
            />
          </div>
        </div>
      </div>

      {/* ─── CARD 2: MEMBERS SECTION (MIDDLE / BOTTOM) ─── */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-sm space-y-6 transition-colors ${t(
          "bg-white border-zinc-200",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <div>
            <h2 className="text-base font-semibold font-sans flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              2. Family Members
              <span className={`text-xs font-normal ml-2 px-2 py-0.5 rounded-full ${t("bg-zinc-100 text-zinc-700", "bg-slate-800 text-slate-300", "bg-zinc-800 text-zinc-300")}`}>
                {members.length} {members.length === 1 ? "member" : "members"} added
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
              At least one member is required to create a family.
            </p>
          </div>

          {/* Add member button - only shown after at least one member is added */}
          {members.length > 0 && (
            <Button
              type="button"
              onClick={handleOpenAddMember}
              size={"sm"}
            >
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        {/* ─── MEMBERS TABLE ─── */}
        {members.length === 0 ? (
          <div
            onClick={handleOpenAddMember}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${t(
              "border-zinc-300 hover:border-amber-500 bg-zinc-50/50 hover:bg-amber-50/30",
              "border-slate-800 hover:border-amber-500 bg-slate-950/40 hover:bg-slate-900",
              "border-zinc-800 hover:border-amber-500 bg-zinc-900/30 hover:bg-zinc-900/60"
            )}`}
          >
            <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
              <div className="p-3 rounded-full bg-amber-500/10 text-amber-500 mb-1">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold">No members added yet</h3>
              <p className={`text-xs ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                Click here or tap this area to add the first family member (Family Head).
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mt-2">
                <Plus className="h-3.5 w-3.5" /> Add First Member
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
                  <TableHead className="font-bold text-xs">Member Name</TableHead>
                  <TableHead className="font-bold text-xs">Role</TableHead>
                  <TableHead className="font-bold text-xs">Age / Category</TableHead>
                  <TableHead className="font-bold text-xs">Gender</TableHead>
                  <TableHead className="font-bold text-xs hidden sm:table-cell">Blood Group</TableHead>
                  <TableHead className="font-bold text-xs hidden md:table-cell">Marital Status</TableHead>
                  <TableHead className="font-bold text-xs hidden lg:table-cell">Occupation</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className={`transition-colors ${t(
                      "hover:bg-zinc-50/80",
                      "hover:bg-slate-800/40",
                      "hover:bg-zinc-900/40"
                    )}`}
                  >
                    {/* Name & Head Badge */}
                    <TableCell className="font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <span>{member.name}</span>
                        {member.isHead && (
                          <Badge className="bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 hover:bg-amber-400">
                            <Crown className="h-2.5 w-2.5" /> Head
                          </Badge>
                        )}
                      </div>
                      {member.phone && (
                        <span className={`text-[11px] block mt-0.5 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                          {member.phone}
                        </span>
                      )}
                    </TableCell>

                    {/* Church Role */}
                    <TableCell className="text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-medium ${t("bg-zinc-100 text-zinc-700", "bg-slate-800 text-slate-300", "bg-zinc-800 text-zinc-300")}`}>
                        {member.role || "Member"}
                      </span>
                    </TableCell>

                    {/* Age & Category Badge */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono">{member.age || "—"}</span>
                        {typeof member.age === "number" && (
                          <>
                            {member.age < 12 && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300 text-[10px]">Child</Badge>
                            )}
                            {member.age >= 12 && member.age < 18 && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-300 text-[10px]">Pre-Youth</Badge>
                            )}
                            {member.age >= 18 && member.age <= 30 && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-300 text-[10px]">Youth</Badge>
                            )}
                            {member.age > 30 && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300 text-[10px]">Adult</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Gender */}
                    <TableCell className="text-xs capitalize">
                      {member.gender.toLowerCase()}
                    </TableCell>

                    {/* Blood Group */}
                    <TableCell className="text-xs hidden sm:table-cell font-mono">
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Droplet className="h-3 w-3 fill-red-500/20" />
                        {member.bloodGroup}
                      </span>
                    </TableCell>

                    {/* Marital Status */}
                    <TableCell className="text-xs hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="capitalize">{member.maritalStatus ? member.maritalStatus.toLowerCase() : "—"}</span>
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
                          <span className={`text-[10px] font-mono leading-none ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                            DOM: {member.dateOfMarriage} {calculateYears(member.dateOfMarriage) !== "" ? `(${calculateYears(member.dateOfMarriage)} yrs)` : ""}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Occupation */}
                    <TableCell className={`text-xs hidden lg:table-cell ${!member.occupation ? (t("text-zinc-400", "text-slate-500", "text-zinc-500")) : ""}`}>
                      {member.occupation || "—"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          member.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px]"
                            : "bg-red-500/10 text-red-600 border-red-300 text-[10px]"
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(member)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${t(
                            "hover:bg-zinc-100 text-zinc-600",
                            "hover:bg-slate-800 text-slate-300",
                            "hover:bg-zinc-800 text-zinc-300"
                          )}`}
                          title="Edit Member"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-red-500 ${t(
                            "hover:bg-red-50",
                            "hover:bg-red-950/30",
                            "hover:bg-red-950/30"
                          )}`}
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ─── CREATE FAMILY BOTTOM ACTION ─── */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">
            {members.length === 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Add at least one member before creating family.
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Ready to register family ({members.length} members ready).
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => router.push("/admin/families")}
              size={"sm"}
              variant={"outline"}
            >
              Cancel
            </Button>

            <Button
              size={"sm"}
              onClick={handleCreateFamily}
              disabled={isSubmitting || members.length === 0}
            >
              <Users className="h-4 w-4 mr-1.5" />
              {isSubmitting ? "Creating Family..." : "Create Family"}
            </Button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          MEMBER FORM POPUP MODAL (Add / Edit Member)
         ═════════════════════════════════════════════════════════════════ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className={`w-[96vw] max-w-4xl sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto ${t(
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
              Enter all personal, demographic, and church details for this member.
            </DialogDescription>
          </DialogHeader>

          {memberFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
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
                  placeholder="e.g. David Samuel"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
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
                        status: e.target.value as "ACTIVE" | "INACTIVE",
                      })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
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
                  placeholder="Specify reason for inactive membership (e.g., relocated, membership transferred, deceased)..."
                  value={memberForm.inactiveReason}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, inactiveReason: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Row 2: Age, DOB, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* DOB */}
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

              {/* Age (Read Only, Auto-calculated from DOB) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Age
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal lowercase">(auto from DOB)</span>
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

              {/* Gender */}
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
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </NativeSelect>
              </div>
            </div>

            {/* Row 3: Blood Group, Marital Status, Role */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Blood Group */}
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
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              {/* Marital Status */}
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
                  <option value="MARRIED">Married</option>
                  <option value="UNMARRIED">Unmarried / Single</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </NativeSelect>
              </div>

              {/* Church Role */}
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
                  <option value="General Member">General Member</option>
                  <option value="Pastor">Pastor</option>
                  <option value="Elder">Elder</option>
                  <option value="Deacon">Deacon</option>
                  <option value="Worship Leader">Worship Leader</option>
                  <option value="Sunday School Teacher">Sunday School Teacher</option>
                  <option value="Youth Leader">Youth Leader</option>
                  <option value="Audio/Visual Team">Audio/Visual Team</option>
                  <option value="Hospitality Team">Hospitality Team</option>
                  <option value="Choir">Choir</option>
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
                          ? `${calculateYears(memberForm.dateOfMarriage)} ${
                              calculateYears(memberForm.dateOfMarriage) === 1 ? "Year" : "Years"
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
                  className={`h-9 flex items-center gap-2.5 px-3 rounded-xl border cursor-pointer select-none transition-colors shrink-0 ${
                    memberForm.isLookingForAlliance
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

            {/* Row 4: Phone, Email, Occupation */}
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
                  onChange={(e) => setMemberForm({ ...memberForm, occupation: e.target.value })}
                />
              </div>
            </div>



            <DialogFooter className="pt-4 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-5 py-2 rounded-full text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs"
              >
                {editingMemberId ? "Update Member" : "Submit Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════
          SUCCESS CONFIRMATION DIALOG
         ═════════════════════════════════════════════════════════════════ */}
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
              Family Successfully Registered!
            </DialogTitle>
            <p className={`text-xs ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
              <strong>{familyName}</strong> with {members.length} members has been saved to the Church Members Directory.
            </p>
            <Button
              onClick={() => router.push("/admin/families")}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md mt-4"
            >
              Go to Families Directory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
