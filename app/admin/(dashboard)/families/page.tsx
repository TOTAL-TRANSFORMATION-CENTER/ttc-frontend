"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Heart, MapPin, Plus, Search, Users } from "lucide-react";
import { calculateYears } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* ──────── Types ──────── */
interface Member {
  id: string;
  name: string;
  isHead: boolean;
  age: number;
  gender: "MALE" | "FEMALE";
  phone: string;
  email: string;
  bloodGroup: string;
  dob: string;
  status: "ACTIVE" | "INACTIVE";
  maritalStatus: "MARRIED" | "UNMARRIED";
  dateOfMarriage?: string;
  isLookingForAlliance?: boolean;
  occupation: string;
  role: string;
  address: string;
}

interface Family {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  location: string;
  region: string;
  address: string;
  memberCount: number;
  members: Member[];
}

/* ──────── Mock Data ──────── */
const mockFamilies: Family[] = [
  {
    id: "FAM-001",
    name: "Samuel Family",
    status: "ACTIVE",
    location: "https://maps.google.com/?q=13.0827,80.2707",
    region: "Karamadai",
    address: "12, Church Street, Tambaram, Chennai - 600045",
    memberCount: 4,
    members: [
      {
        id: "MEM-001",
        name: "David Samuel",
        isHead: true,
        age: 45,
        gender: "MALE",
        phone: "9876543210",
        email: "david.samuel@gmail.com",
        bloodGroup: "O+",
        dob: "15/03/1981",
        status: "ACTIVE",
        maritalStatus: "MARRIED",
        occupation: "Engineer",
        role: "Elder",
        address: "12, Church Street, Tambaram, Chennai - 600045",
      },
      {
        id: "MEM-002",
        name: "Ruth Samuel",
        isHead: false,
        age: 42,
        gender: "FEMALE",
        phone: "9876543211",
        email: "ruth.samuel@gmail.com",
        bloodGroup: "A+",
        dob: "22/07/1984",
        status: "ACTIVE",
        maritalStatus: "MARRIED",
        occupation: "Teacher",
        role: "Sunday School Teacher",
        address: "12, Church Street, Tambaram, Chennai - 600045",
      },
      {
        id: "MEM-003",
        name: "Joshua Samuel",
        isHead: false,
        age: 16,
        gender: "MALE",
        phone: "",
        email: "",
        bloodGroup: "O+",
        dob: "10/05/2010",
        status: "ACTIVE",
        maritalStatus: "UNMARRIED",
        occupation: "Student",
        role: "Youth Fellowship",
        address: "12, Church Street, Tambaram, Chennai - 600045",
      },
      {
        id: "MEM-004",
        name: "Abigail Samuel",
        isHead: false,
        age: 10,
        gender: "FEMALE",
        phone: "",
        email: "",
        bloodGroup: "A+",
        dob: "01/12/2016",
        status: "ACTIVE",
        maritalStatus: "UNMARRIED",
        occupation: "Student",
        role: "Children Ministry",
        address: "12, Church Street, Tambaram, Chennai - 600045",
      },
    ],
  },
  {
    id: "FAM-002",
    name: "Paul Family",
    status: "ACTIVE",
    location: "https://maps.google.com/?q=12.9716,77.5946",
    region: "Periyanaickenpalayam",
    address: "28, Grace Avenue, Chromepet, Chennai - 600044",
    memberCount: 3,
    members: [
      {
        id: "MEM-005",
        name: "Stephen Paul",
        isHead: true,
        age: 38,
        gender: "MALE",
        phone: "9514952672",
        email: "stephen.paul@outlook.com",
        bloodGroup: "B+",
        dob: "08/11/1988",
        status: "ACTIVE",
        maritalStatus: "MARRIED",
        occupation: "Software Developer",
        role: "Media & Audio/Visual",
        address: "28, Grace Avenue, Chromepet, Chennai - 600044",
      },
      {
        id: "MEM-006",
        name: "Grace Paul",
        isHead: false,
        age: 35,
        gender: "FEMALE",
        phone: "9876543222",
        email: "grace.paul@gmail.com",
        bloodGroup: "AB+",
        dob: "15/04/1991",
        status: "ACTIVE",
        maritalStatus: "MARRIED",
        occupation: "Nurse",
        role: "Hospitality Team",
        address: "28, Grace Avenue, Chromepet, Chennai - 600044",
      },
      {
        id: "MEM-007",
        name: "Elijah Paul",
        isHead: false,
        age: 8,
        gender: "MALE",
        phone: "",
        email: "",
        bloodGroup: "B+",
        dob: "20/06/2018",
        status: "ACTIVE",
        maritalStatus: "UNMARRIED",
        occupation: "Student",
        role: "Children Ministry",
        address: "28, Grace Avenue, Chromepet, Chennai - 600044",
      },
    ],
  },
  {
    id: "FAM-003",
    name: "Evangelin Family",
    status: "INACTIVE",
    location: "",
    region: "Mettupalayam",
    address: "5, Bethel Road, Pallavaram, Chennai - 600043",
    memberCount: 2,
    members: [
      {
        id: "MEM-008",
        name: "Merlin Evangelin",
        isHead: true,
        age: 55,
        gender: "FEMALE",
        phone: "9876543233",
        email: "",
        bloodGroup: "O-",
        dob: "03/01/1971",
        status: "INACTIVE",
        maritalStatus: "MARRIED",
        occupation: "Retired",
        role: "Prayer Coordinator",
        address: "5, Bethel Road, Pallavaram, Chennai - 600043",
      },
      {
        id: "MEM-009",
        name: "Daniel Evangelin",
        isHead: false,
        age: 28,
        gender: "MALE",
        phone: "9876543244",
        email: "daniel.e@gmail.com",
        bloodGroup: "O-",
        dob: "18/09/1998",
        status: "ACTIVE",
        maritalStatus: "UNMARRIED",
        occupation: "Accountant",
        role: "Worship Team",
        address: "5, Bethel Road, Pallavaram, Chennai - 600043",
      },
    ],
  },
];

/* ──────── Age Badge ──────── */
function AgeBadge({ age }: { age: number }) {
  if (age < 12) return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-300 text-[10px]">Children</Badge>;
  if (age < 18) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-300 text-[10px]">Pre-Youth</Badge>;
  if (age <= 30) return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-300 text-[10px]">Youth</Badge>;
  return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300 text-[10px]">Adult</Badge>;
}

/* ──────── Families Page ──────── */
export default function FamiliesPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const filteredFamilies = mockFamilies.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.region && f.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif">Church Family Directory</h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Manage registered families, family heads, members, and demographic details
          </p>
        </div>
        <Button size={"sm"} onClick={() => router.push("/admin/family/add")}>
          <Plus className="h-4 w-4" />
          Add Family
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search families by name, address, or region..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full h-9 text-sm pl-10 pr-4 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${t(
            "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400",
            "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500",
            "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500"
          )}`}
        />
      </div>

      {/* Family Table */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${t(
          "bg-white border-zinc-200",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <Table>
          <TableHeader>
            <TableRow className={t("bg-zinc-50", "bg-slate-800/50", "bg-zinc-900/50")}>
              <TableHead className="font-bold text-xs">Family Name</TableHead>
              <TableHead className="font-bold text-xs">Members</TableHead>
              <TableHead className="font-bold text-xs">Status</TableHead>
              <TableHead className="font-bold text-xs hidden md:table-cell">Region</TableHead>
              <TableHead className="font-bold text-xs hidden lg:table-cell">Address</TableHead>
              <TableHead className="font-bold text-xs hidden xl:table-cell">Location</TableHead>
              <TableHead className="font-bold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFamilies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-zinc-400" />
                    <p className={`text-sm font-medium ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                      No families found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFamilies.map((family) => (
                <TableRow
                  key={family.id}
                  className={`cursor-pointer transition-colors ${t(
                    "hover:bg-zinc-50",
                    "hover:bg-slate-800/50",
                    "hover:bg-zinc-900/50"
                  )}`}
                  onClick={() => setSelectedFamily(family)}
                >
                  <TableCell className="font-semibold text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-xs shrink-0">
                        {family.name.charAt(0)}
                      </div>
                      {family.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t("bg-zinc-100 text-zinc-700", "bg-slate-800 text-slate-300", "bg-zinc-800 text-zinc-300")}`}>
                      {family.memberCount} members
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        family.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[11px]"
                          : "bg-red-500/10 text-red-600 border-red-300 text-[11px]"
                      }
                    >
                      {family.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/30">
                      {family.region || "Karamadai"}
                    </span>
                  </TableCell>
                  <TableCell className={`text-xs hidden lg:table-cell max-w-[200px] truncate ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                    {family.address}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {family.location ? (
                      <a
                        href={family.location}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-amber-600 hover:text-amber-500 underline inline-flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        View Map
                      </a>
                    ) : (
                      <span className={`text-xs ${t("text-zinc-400", "text-slate-500", "text-zinc-500")}`}>—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/family/edit?id=${family.id}`);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${t(
                          "hover:bg-zinc-100 text-zinc-500",
                          "hover:bg-slate-800 text-slate-400",
                          "hover:bg-zinc-800 text-zinc-400"
                        )}`}
                        title="Edit family"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Members Detail Dialog */}
      <Dialog open={!!selectedFamily} onOpenChange={(open) => !open && setSelectedFamily(null)}>
        <DialogContent
          className={`w-[96vw] max-w-5xl sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0 flex flex-col ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          {selectedFamily && (
            <>
              {/* ─── STICKY HEADER (Family Details Only) ─── */}
              <div
                className={`sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-3 border-b backdrop-blur-md shadow-xs space-y-2.5 ${t(
                  "bg-white/95 border-zinc-200/90",
                  "bg-slate-900/95 border-slate-800",
                  "bg-zinc-950/95 border-zinc-800"
                )}`}
              >
                {/* Title Row with Family ID and Status on the right */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="h-5 w-5 text-amber-500 shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold font-sans leading-tight">
                      {selectedFamily.name}
                    </h2>
                  </div>

                  {/* Family ID and Status aligned on right side */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="font-mono text-[10px] font-semibold">
                      {selectedFamily.id}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        selectedFamily.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px] font-bold"
                          : "bg-red-500/10 text-red-600 border-red-300 text-[10px] font-bold"
                      }
                    >
                      {selectedFamily.status}
                    </Badge>
                  </div>
                </div>

                {/* Compact Family Info Summary (Location, Region, Address) */}
                <div
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center ${t(
                    "bg-zinc-50/70 border-zinc-200/80",
                    "bg-slate-800/40 border-slate-700/70",
                    "bg-zinc-900/40 border-zinc-800/70"
                  )}`}
                >
                  {/* Location */}
                  <div className="sm:col-span-3 flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className={`font-semibold shrink-0 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Location:</span>
                    {selectedFamily.location ? (
                      <a
                        href={selectedFamily.location}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-600 hover:text-amber-500 underline font-medium truncate"
                      >
                        Open Maps
                      </a>
                    ) : (
                      <span className="text-zinc-400">Not provided</span>
                    )}
                  </div>

                  {/* Region (NEW text field placed right after location) */}
                  <div className="sm:col-span-3 flex items-center gap-1.5 min-w-0">
                    <span className={`font-semibold shrink-0 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Region:</span>
                    <span className="font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-300/30 truncate">
                      {selectedFamily.region || "Karamadai"}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-6 flex items-center gap-1.5 min-w-0">
                    <span className={`font-semibold shrink-0 ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Address:</span>
                    <span className="font-medium text-xs truncate" title={selectedFamily.address}>
                      {selectedFamily.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── SCROLLABLE MEMBERS SECTION (Compact Spacing) ─── */}
              <div className="px-4 sm:px-6 pb-3 space-y-2.5">
                {/* Household Members Header with member count on left and Edit Family Record button on right */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold font-sans">Household Members</h3>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${t(
                        "bg-zinc-100 text-zinc-700",
                        "bg-slate-800 text-slate-300",
                        "bg-zinc-800 text-zinc-300"
                      )}`}
                    >
                      {selectedFamily.members.length} members
                    </span>
                  </div>

                  {/* Edit Family Record button aligned on right side */}
                  <Button
                    size={"xs"}
                    onClick={() => router.push(`/admin/family/edit?id=${selectedFamily.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Family Record
                  </Button>
                </div>

                {/* Members Table */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-xs">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[130px] py-2">Name</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[110px] py-2">Role</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[110px] py-2">Age &amp; Category</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[70px] py-2">Gender</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[105px] py-2">Phone</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[85px] py-2">Blood Group</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[95px] py-2">Marital Status</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap min-w-[105px] py-2">Occupation</TableHead>
                        <TableHead className="text-xs font-bold whitespace-nowrap text-left min-w-[80px] py-2">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFamily.members.map((member) => (
                        <TableRow
                          key={member.id}
                          className={`transition-colors ${t(
                            "hover:bg-zinc-50/80",
                            "hover:bg-slate-800/40",
                            "hover:bg-zinc-900/40"
                          )}`}
                        >
                          {/* Name with Head tag */}
                          <TableCell className="font-semibold text-sm whitespace-nowrap py-2">
                            <div className="flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.isHead && (
                                <Badge className="bg-amber-500 text-zinc-950 text-[10px] font-bold hover:bg-amber-400 py-0 px-1.5">
                                  Head
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Church Role - Never show Family Head here */}
                          <TableCell className="text-xs whitespace-nowrap py-2">
                            <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${t("bg-zinc-100 text-zinc-700", "bg-slate-800 text-slate-300", "bg-zinc-800 text-zinc-300")}`}>
                              {member.role || "Member"}
                            </span>
                          </TableCell>

                          {/* Age & Category Badge */}
                          <TableCell className="whitespace-nowrap py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-semibold">{member.age}</span>
                              <AgeBadge age={member.age} />
                            </div>
                          </TableCell>

                          {/* Gender */}
                          <TableCell className="text-xs whitespace-nowrap capitalize py-2">
                            {member.gender.toLowerCase()}
                          </TableCell>

                          {/* Phone */}
                          <TableCell className={`text-xs whitespace-nowrap font-mono py-2 ${!member.phone ? t("text-zinc-400", "text-slate-500", "text-zinc-500") : ""}`}>
                            {member.phone || "—"}
                          </TableCell>

                          {/* Blood Group */}
                          <TableCell className="text-xs whitespace-nowrap font-mono text-red-600 dark:text-red-400 font-semibold py-2">
                            {member.bloodGroup || "—"}
                          </TableCell>

                          {/* Marital Status */}
                          <TableCell className="text-xs whitespace-nowrap py-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
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
                          <TableCell className={`text-xs whitespace-nowrap py-2 ${!member.occupation ? t("text-zinc-400", "text-slate-500", "text-zinc-500") : ""}`}>
                            {member.occupation || "—"}
                          </TableCell>

                          {/* Status - Left Aligned */}
                          <TableCell className="text-left whitespace-nowrap py-2">
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
