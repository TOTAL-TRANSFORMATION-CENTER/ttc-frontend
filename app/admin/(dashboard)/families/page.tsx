"use client";

import { AgeBadge } from "@/components/ttc/age-badge";
import { StatusBadge } from "@/components/ttc/status-badge";
import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { BannerAlert } from "@/components/ui/banner-alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteFamily, useFamilies } from "@/hooks/use-families";
import { calculateYears } from "@/lib/utils";
import type {
  FamilyDirectoryItem as Family,
  FamilyMemberItem,
  PaginationMeta
} from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

/* ──────── Families Page ──────── */
export default function FamiliesPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // ─── TanStack Query: Live query with cache and auto-refetch ───
  const { data, isLoading } = useFamilies({
    page,
    limit,
    search: debouncedSearch,
  });

  const families = data?.families ?? [];
  const pagination: PaginationMeta = data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  // ─── TanStack Mutation: Soft delete family & cascade members ───
  const deleteMutation = useDeleteFamily();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on new search
  };

  const confirmDeleteFamily = async () => {
    if (!familyToDelete) return;
    try {
      const name = familyToDelete.name;
      await deleteMutation.mutateAsync(familyToDelete.id);
      if (selectedFamily?.id === familyToDelete.id) {
        setSelectedFamily(null);
      }
      setFamilyToDelete(null);
      setPageSuccess(`Family "${name}" and all associated members removed successfully.`);
      setTimeout(() => setPageSuccess(""), 4000);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to delete family. Please try again."
      );
    }
  };

  const familyColumns: ColumnDef<Family>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Family Name",
        headerClassName: "font-bold text-xs",
        className: "font-semibold text-sm",
        cell: (family) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-xs shrink-0">
              {family.name.charAt(0)}
            </div>
            {family.name}
          </div>
        ),
      },
      {
        accessorKey: "memberCount",
        header: "Members",
        headerClassName: "font-bold text-xs",
        cell: (family) => (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t(
              "bg-zinc-100 text-zinc-700",
              "bg-slate-800 text-slate-300",
              "bg-zinc-800 text-zinc-300"
            )}`}
          >
            {family.memberCount} members
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        headerClassName: "font-bold text-xs",
        cell: (family) => <StatusBadge status={family.status} className="text-[11px]" />,
      },
      {
        accessorKey: "region",
        header: "Region",
        headerClassName: "font-bold text-xs hidden md:table-cell",
        className: "hidden md:table-cell",
        cell: (family) => (
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300/30">
            {family.region || "Karamadai"}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        headerClassName: "font-bold text-xs hidden lg:table-cell",
        className: `text-xs hidden lg:table-cell max-w-[200px] truncate ${t(
          "text-zinc-600",
          "text-slate-400",
          "text-zinc-400"
        )}`,
        cell: (family) => family.address,
      },
      {
        accessorKey: "location",
        header: "Location",
        headerClassName: "font-bold text-xs hidden xl:table-cell",
        className: "hidden xl:table-cell",
        cell: (family) =>
          family.location ? (
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
            <span
              className={`text-xs ${t(
                "text-zinc-400",
                "text-slate-500",
                "text-zinc-500"
              )}`}
            >
              —
            </span>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        headerClassName: "font-bold text-xs text-right",
        className: "text-right",
        cell: (family) => (
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFamilyToDelete(family);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-red-500 ${t(
                "hover:bg-red-50 hover:text-red-700",
                "hover:bg-red-950/50 hover:text-red-400",
                "hover:bg-red-950/50 hover:text-red-400"
              )}`}
              title="Delete family"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, theme]
  );

  const detailMemberColumns: ColumnDef<FamilyMemberItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[130px] py-2",
        className: "font-semibold text-sm whitespace-nowrap py-2",
        cell: (member) => (
          <div className="flex items-center gap-1.5">
            <span>{member.name}</span>
            {member.isHead && (
              <Badge className="bg-amber-500 text-zinc-950 text-[10px] font-bold hover:bg-amber-400 py-0 px-1.5">
                Head
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[110px] py-2",
        className: "text-xs whitespace-nowrap py-2",
        cell: (member) => (
          <span
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${t(
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
        header: "Age & Category",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[110px] py-2",
        className: "whitespace-nowrap py-2",
        cell: (member) => (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-semibold">{member.age}</span>
            <AgeBadge age={member.age} />
          </div>
        ),
      },
      {
        accessorKey: "gender",
        header: "Gender",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[70px] py-2",
        className: "text-xs whitespace-nowrap capitalize py-2",
        cell: (member) => member.gender.toLowerCase(),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[105px] py-2",
        className: "text-xs whitespace-nowrap font-mono py-2",
        cell: (member) =>
          member.phone || (
            <span className={t("text-zinc-400", "text-slate-500", "text-zinc-500")}>
              —
            </span>
          ),
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Group",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[85px] py-2",
        className: "text-xs whitespace-nowrap font-mono text-red-600 dark:text-red-400 font-semibold py-2",
        cell: (member) => member.bloodGroup || "—",
      },
      {
        accessorKey: "maritalStatus",
        header: "Marital Status",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[95px] py-2",
        className: "text-xs whitespace-nowrap py-2",
        cell: (member) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
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
        accessorKey: "occupation",
        header: "Occupation",
        headerClassName: "text-xs font-bold whitespace-nowrap min-w-[105px] py-2",
        className: "text-xs whitespace-nowrap py-2",
        cell: (member) =>
          member.occupation || (
            <span className={t("text-zinc-400", "text-slate-500", "text-zinc-500")}>
              —
            </span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        headerClassName: "text-xs font-bold whitespace-nowrap text-left min-w-[80px] py-2",
        className: "text-left whitespace-nowrap py-2",
        cell: (member) => (
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
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
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

      {/* ─── Feedback Banner Alerts ─── */}
      {pageError && (
        <BannerAlert
          variant="error"
          title="Operation Failed"
          message={pageError}
          onClose={() => setPageError("")}
        />
      )}

      {pageSuccess && (
        <BannerAlert
          variant="success"
          title="Success"
          message={pageSuccess}
          onClose={() => setPageSuccess("")}
        />
      )}

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search families by name, address, or region..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={`w-full h-9 text-sm pl-10 pr-4 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${t(
            "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400",
            "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500",
            "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500"
          )}`}
        />
      </div>

      {/* Family Count Summary (Above Table) */}
      <div className={`text-xs font-medium ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
        {pagination.total === 0 ? (
          "0 families found"
        ) : (() => {
          const start = (pagination.page - 1) * pagination.limit + 1;
          const end = Math.min(pagination.page * pagination.limit, pagination.total);
          if (pagination.total === 1) {
            return (
              <>
                Showing{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">1</span> of{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">1</span> family
              </>
            );
          }
          if (start === end) {
            return (
              <>
                Showing family{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{start}</span> of{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pagination.total}</span> families
              </>
            );
          }
          return (
            <>
              Showing{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{start}</span> to{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{end}</span> of{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pagination.total}</span> families
            </>
          );
        })()}
      </div>
      <div className="space-y-4">
        <DataTable
          data={families}
          columns={familyColumns}
          isLoading={isLoading}
          loadingMessage="Loading families please wait..."
          onRowClick={(family) => setSelectedFamily(family)}
          emptyMessage={
            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold">No families found</p>
                <p
                  className={`text-xs mt-1 ${t(
                    "text-zinc-500",
                    "text-slate-400",
                    "text-zinc-400"
                  )}`}
                >
                  {searchQuery
                    ? `No registered families match "${searchQuery}". Try a different keyword.`
                    : "No families have been added to the church directory yet."}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => router.push("/admin/family/add")}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add First Family
                </Button>
              )}
            </div>
          }
        />

        {/* ─── Pagination Controls ─── */}
        <div className="flex items-center justify-end gap-1.5 pt-1 px-1">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || isLoading || pagination.total === 0}
              className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.max(1, pagination.totalPages) }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === Math.max(1, pagination.totalPages)) return true;
                  return Math.abs(p - pagination.page) <= 1;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const isEllipsis = prev && p - prev > 1;
                  const isActive = p === pagination.page && pagination.total > 0;

                  return (
                    <React.Fragment key={p}>
                      {isEllipsis && (
                        <span className="px-1 text-xs text-zinc-400 select-none">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        disabled={isLoading || pagination.total === 0}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${isActive
                          ? "bg-amber-600 text-white font-semibold shadow-xs"
                          : t(
                            "hover:bg-zinc-100 text-zinc-700",
                            "hover:bg-slate-800 text-slate-300",
                            "hover:bg-zinc-800 text-zinc-300"
                          )
                          }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(Math.max(1, pagination.totalPages), p + 1))}
              disabled={pagination.page >= pagination.totalPages || isLoading || pagination.total === 0}
              className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
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
                      {selectedFamily.members.length} {" "}members
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
                <DataTable
                  data={selectedFamily.members}
                  columns={detailMemberColumns}
                  className="rounded-xl shadow-xs"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!familyToDelete} onOpenChange={(open) => !open && setFamilyToDelete(null)}>
        <DialogContent
          className={`sm:max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Family
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{familyToDelete?.name}</strong>?
              This will permanently remove the family record and all its associated members from the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFamilyToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteFamily}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...
                </>
              ) : (
                "Delete Family & Members"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
