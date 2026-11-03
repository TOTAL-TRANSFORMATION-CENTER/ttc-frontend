"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { BannerAlert } from "@/components/ui/banner-alert";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategories,
  useCategoryValues,
  useCreateCategory,
  useCreateCategoryValue,
  useDeleteCategory,
  useDeleteCategoryValue,
  useUpdateCategory,
  useUpdateCategoryValue,
} from "@/hooks/use-categories";
import type { CategoryItem, CategoryValueItem } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown10,
  CheckCircle2,
  Edit2,
  FileText,
  FolderPlus,
  Layers,
  ListFilter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Type,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export default function DropdownSettingsPage() {
  const { theme } = useTheme();

  // ─── THEME HELPER ───
  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  // ─── STATE ───
  const queryClient = useQueryClient();
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string | null>(null);
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── AUTO-HIDE NOTIFICATIONS (AFTER 4 SECONDS) ───
  useEffect(() => {
    if (bannerSuccess) {
      const timer = setTimeout(() => {
        setBannerSuccess("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [bannerSuccess]);

  useEffect(() => {
    if (bannerError) {
      const timer = setTimeout(() => {
        setBannerError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bannerError]);

  // Modals
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [isDeleteCatOpen, setIsDeleteCatOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const [isCreateValOpen, setIsCreateValOpen] = useState(false);
  const [isEditValOpen, setIsEditValOpen] = useState(false);
  const [isDeleteValOpen, setIsDeleteValOpen] = useState(false);
  const [valueToEdit, setValueToEdit] = useState<CategoryValueItem | null>(null);
  const [valueToDelete, setValueToDelete] = useState<CategoryValueItem | null>(null);

  // Form states
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catFormError, setCatFormError] = useState("");

  const [valLabel, setValLabel] = useState("");
  const [valCode, setValCode] = useState("");
  const [valSort, setValSort] = useState<number>(0);
  const [valActive, setValActive] = useState(true);
  const [valFormError, setValFormError] = useState("");

  // Loading toggles for individual value switches
  const [togglingValueId, setTogglingValueId] = useState<number | string | null>(null);

  // ─── QUERIES ───
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useCategories(searchCategory);

  // Active selected category (defaults to first category seamlessly without effect setState)
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;

  const selectedCategory = useMemo(() => {
    if (!activeCategoryId) return null;
    return categories.find((c) => String(c.id) === String(activeCategoryId)) || null;
  }, [categories, activeCategoryId]);

  const {
    data: categoryValues = [],
    isLoading: isLoadingValues,
    refetch: refetchValues,
  } = useCategoryValues(activeCategoryId, activeOnlyFilter);

  // ─── MUTATIONS ───
  const createCategoryMut = useCreateCategory();
  const updateCategoryMut = useUpdateCategory();
  const deleteCategoryMut = useDeleteCategory();

  const createValueMut = useCreateCategoryValue();
  const updateValueMut = useUpdateCategoryValue();
  const deleteValueMut = useDeleteCategoryValue();

  // ─── HANDLER: REFRESH ALL CATEGORIES & VALUES ───
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["category"] }),
        queryClient.invalidateQueries({ queryKey: ["category-values"] }),
      ]);
      await Promise.all([refetchCategories(), refetchValues()]);
      setBannerSuccess("Dropdown categories and options refreshed successfully.");
    } catch {
      setBannerError("Failed to refresh categories.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ─── HANDLERS: CATEGORIES ───
  const openCreateCategory = () => {
    setCatName("");
    setCatCode("");
    setCatDesc("");
    setCatFormError("");
    setIsCreateCatOpen(true);
  };

  const handleSaveCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatFormError("Category Name is required.");
      return;
    }
    if (!catCode.trim()) {
      setCatFormError("System Code is required.");
      return;
    }

    try {
      const created = await createCategoryMut.mutateAsync({
        name: catName.trim(),
        code: catCode.trim(),
        description: catDesc.trim() || undefined,
      });
      setIsCreateCatOpen(false);
      setSelectedCategoryId(created.id);
      setBannerSuccess(`Category "${created.name}" created successfully.`);
    } catch (err: unknown) {
      setCatFormError(err instanceof Error ? err.message : "Failed to create category.");
    }
  };

  const openEditCategory = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || "");
    setCatFormError("");
    setIsEditCatOpen(true);
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit) return;
    if (!catName.trim()) {
      setCatFormError("Category Name is required.");
      return;
    }

    try {
      await updateCategoryMut.mutateAsync({
        id: categoryToEdit.id,
        payload: {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        },
      });
      setIsEditCatOpen(false);
      setBannerSuccess(`Category "${catName.trim()}" updated successfully.`);
    } catch (err: unknown) {
      setCatFormError(err instanceof Error ? err.message : "Failed to update category.");
    }
  };

  const openDeleteCategory = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setIsDeleteCatOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryMut.mutateAsync(categoryToDelete.id);
      setIsDeleteCatOpen(false);
      if (String(selectedCategoryId) === String(categoryToDelete.id)) {
        setSelectedCategoryId(null);
      }
      setBannerSuccess(`Category "${categoryToDelete.name}" deleted successfully.`);
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to delete category.");
    }
  };

  // ─── HANDLERS: CATEGORY VALUES ───
  const openCreateValue = () => {
    setValLabel("");
    setValCode("");
    // Default sort order to next highest in list
    const maxSort = categoryValues.reduce(
      (max, v) => (v.sortOrder > max ? v.sortOrder : max),
      0
    );
    setValSort(maxSort + 1);
    setValActive(true);
    setValFormError("");
    setIsCreateValOpen(true);
  };

  const handleSaveCreateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId) {
      setValFormError("No category selected.");
      return;
    }
    if (!valLabel.trim()) {
      setValFormError("Display Label is required.");
      return;
    }
    if (!valCode.trim()) {
      setValFormError("Stored Value Code is required.");
      return;
    }

    try {
      await createValueMut.mutateAsync({
        categoryId: activeCategoryId,
        payload: {
          label: valLabel.trim(),
          code: valCode.trim(),
          sortOrder: Number(valSort) || 0,
          isActive: valActive,
        },
      });
      setIsCreateValOpen(false);
      setBannerSuccess(`Option "${valLabel.trim()}" added to category.`);
    } catch (err: unknown) {
      setValFormError(err instanceof Error ? err.message : "Failed to add option.");
    }
  };

  const openEditValue = (val: CategoryValueItem) => {
    setValueToEdit(val);
    setValLabel(val.label);
    setValCode(val.code);
    setValSort(val.sortOrder);
    setValActive(val.isActive);
    setValFormError("");
    setIsEditValOpen(true);
  };

  const handleSaveEditValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valueToEdit || !activeCategoryId) return;
    if (!valLabel.trim()) {
      setValFormError("Display Label is required.");
      return;
    }
    if (!valCode.trim()) {
      setValFormError("Stored Value Code is required.");
      return;
    }

    try {
      await updateValueMut.mutateAsync({
        id: valueToEdit.id,
        categoryId: activeCategoryId,
        payload: {
          label: valLabel.trim(),
          code: valCode.trim(),
          sortOrder: Number(valSort) || 0,
          isActive: valActive,
        },
      });
      setIsEditValOpen(false);
      setBannerSuccess(`Option "${valLabel.trim()}" updated successfully.`);
    } catch (err: unknown) {
      setValFormError(err instanceof Error ? err.message : "Failed to update option.");
    }
  };

  const handleToggleActive = async (val: CategoryValueItem) => {
    if (!activeCategoryId) return;
    setTogglingValueId(val.id);
    try {
      await updateValueMut.mutateAsync({
        id: val.id,
        categoryId: activeCategoryId,
        payload: {
          isActive: !val.isActive,
        },
      });
      setBannerSuccess(
        `"${val.label}" is now ${!val.isActive ? "Active" : "Inactive"}.`
      );
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to change active status.");
    } finally {
      setTogglingValueId(null);
    }
  };

  const openDeleteValue = (val: CategoryValueItem) => {
    setValueToDelete(val);
    setIsDeleteValOpen(true);
  };

  const handleConfirmDeleteValue = async () => {
    if (!valueToDelete || !activeCategoryId) return;
    try {
      await deleteValueMut.mutateAsync({
        id: valueToDelete.id,
        categoryId: activeCategoryId,
      });
      setIsDeleteValOpen(false);
      setBannerSuccess(`Option "${valueToDelete.label}" deleted.`);
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : "Failed to delete option.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER / HERO BANNER ─── */}
      <div
        className={`rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${t(
          "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/80",
          "bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/30",
          "bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/20"
        )}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-amber-500" /> Master Data Settings
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-amber-500" />
            Dropdown Settings
          </h2>
          <p className={`text-xs sm:text-sm ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Configure live dropdown categories and options across registration forms, roles, and church records without modifying code.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={openCreateCategory}
            className="h-9 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            New Category
          </Button>
        </div>
      </div>

      {/* ─── NOTIFICATION BANNERS (BELOW HEADER SECTION, AUTO-HIDES) ─── */}
      {(bannerSuccess || bannerError) && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
          {bannerSuccess && (
            <BannerAlert
              variant="success"
              message={bannerSuccess}
              onClose={() => setBannerSuccess("")}
            />
          )}
          {bannerError && (
            <BannerAlert
              variant="error"
              message={bannerError}
              onClose={() => setBannerError("")}
            />
          )}
        </div>
      )}

      {/* ─── TWO-PANEL MASTER-DETAIL LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── LEFT PANEL: CATEGORIES (4 COLS) ─── */}
        <div
          className={`lg:col-span-4 rounded-2xl border p-5 shadow-sm space-y-4 transition-colors ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          <div className="border-b pb-3 flex items-center justify-between border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="font-semibold text-sm font-sans flex items-center gap-1.5">
                Categories
              </h3>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] font-bold"
              >
                {categories.length}
              </Badge>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingCategories}
              title="Refresh categories"
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-500" : ""}`}
              />
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Categories List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {isLoadingCategories ? (
              // Loading Skeleton
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border animate-pulse space-y-2 ${t(
                      "bg-zinc-100/60 border-zinc-200",
                      "bg-slate-800/40 border-slate-800",
                      "bg-zinc-800/40 border-zinc-800"
                    )}`}
                  >
                    <div className="h-4 bg-zinc-300/60 dark:bg-zinc-700/60 rounded w-2/3" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <Layers className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
                <p className={`text-xs ${t("text-zinc-500", "text-slate-400", "text-zinc-500")}`}>
                  {searchCategory ? "No categories matching search." : "No categories configured yet."}
                </p>
                <Button
                  onClick={openCreateCategory}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add First Category
                </Button>
              </div>
            ) : (
              categories.map((cat) => {
                const isSelected = String(cat.id) === String(activeCategoryId);
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer text-left ${isSelected
                      ? t(
                        "bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400/50",
                        "bg-amber-500/15 border-amber-500/60 shadow-sm ring-1 ring-amber-500/40",
                        "bg-amber-500/15 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30"
                      )
                      : t(
                        "bg-zinc-50/60 hover:bg-zinc-100/80 border-zinc-200/80",
                        "bg-slate-800/40 hover:bg-slate-800/80 border-slate-800",
                        "bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-800"
                      )
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm truncate">{cat.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${t(
                              "bg-zinc-100 text-zinc-700 border-zinc-200",
                              "bg-slate-800 text-slate-300 border-slate-700",
                              "bg-zinc-800 text-zinc-300 border-zinc-700"
                            )}`}
                          >
                            {cat.code}
                          </span>
                        </div>
                        {cat.description && (
                          <p
                            className={`text-xs mt-1 line-clamp-1 ${t(
                              "text-zinc-500",
                              "text-slate-400",
                              "text-zinc-400"
                            )}`}
                          >
                            {cat.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected
                            ? "bg-amber-500 text-zinc-950"
                            : t(
                              "bg-zinc-200 text-zinc-800",
                              "bg-slate-700 text-slate-200",
                              "bg-zinc-700 text-zinc-200"
                            )
                            }`}
                        >
                          {cat.valuesCount ?? 0}
                        </span>

                        {/* Action buttons on hover */}
                        <div className="hidden group-hover:flex items-center ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCategory(cat);
                            }}
                            title="Edit Category"
                            className="p-1 hover:text-amber-500 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteCategory(cat);
                            }}
                            title="Delete Category"
                            className="p-1 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: CATEGORY VALUES / OPTIONS (8 COLS) ─── */}
        <div
          className={`lg:col-span-8 rounded-2xl border p-6 sm:p-7 shadow-sm space-y-5 transition-colors ${t(
            "bg-white border-zinc-200",
            "bg-slate-900 border-slate-800",
            "bg-zinc-950 border-zinc-800"
          )}`}
        >
          {selectedCategory ? (
            <>
              {/* Active Category Header */}
              <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <h3 className="text-lg font-bold font-serif">{selectedCategory.name}</h3>
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-600 border-amber-300 font-mono text-[11px]"
                    >
                      {selectedCategory.code}
                    </Badge>
                    <button
                      onClick={() => openEditCategory(selectedCategory)}
                      className="text-xs text-zinc-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                      title="Edit Category Details"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <p className={`text-xs ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                    {selectedCategory.description || "No description provided for this category."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveOnlyFilter(!activeOnlyFilter)}
                    className={`h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeOnlyFilter
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                        : ""
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    {activeOnlyFilter ? "Active Only" : "All Options"}
                  </Button>

                  <Button
                    onClick={openCreateValue}
                    size="sm"
                    className="h-9 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </Button>
                </div>
              </div>

              {/* Options Table */}
              {isLoadingValues ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className={`text-xs ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                    Loading category options...
                  </p>
                </div>
              ) : categoryValues.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <SlidersHorizontal className="w-10 h-10 text-zinc-400 mx-auto opacity-40" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">No Dropdown Options Found</h4>
                    <p className={`text-xs max-w-sm mx-auto ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                      {activeOnlyFilter
                        ? "No active options match this filter."
                        : `"${selectedCategory.name}" has no dropdown choices yet. Add choices like Senior Pastor, Youth Leader, etc.`}
                    </p>
                  </div>
                  <Button
                    onClick={openCreateValue}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Option
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`uppercase text-[10px] tracking-wider font-bold border-b ${t(
                        "bg-zinc-50 border-zinc-200 text-zinc-600",
                        "bg-slate-800/80 border-slate-700 text-slate-300",
                        "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      )}`}
                    >
                      <tr>
                        <th className="py-3 px-3 w-14 text-center">Order</th>
                        <th className="py-3 px-3">Display Label</th>
                        <th className="py-3 px-3">Saved Code</th>
                        <th className="py-3 px-3 w-28 text-center">Status</th>
                        <th className="py-3 px-3 w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                      {categoryValues.map((val) => {
                        const isToggling = togglingValueId === val.id;
                        return (
                          <tr
                            key={val.id}
                            className={`transition-colors ${t(
                              "hover:bg-zinc-50/80",
                              "hover:bg-slate-800/40",
                              "hover:bg-zinc-800/40"
                            )}`}
                          >
                            {/* Sort Order */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 rounded ${t(
                                  "bg-zinc-100 text-zinc-700",
                                  "bg-slate-800 text-slate-300",
                                  "bg-zinc-800 text-zinc-300"
                                )}`}
                              >
                                {val.sortOrder}
                              </span>
                            </td>

                            {/* Label */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-sm block">{val.label}</span>
                            </td>

                            {/* Code */}
                            <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                                {val.code}
                              </span>
                            </td>

                            {/* Active Toggle */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleActive(val)}
                                disabled={isToggling}
                                title={val.isActive ? "Click to deactivate" : "Click to activate"}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform active:scale-95 ${val.isActive
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700"
                                  }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                ) : val.isActive ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <X className="w-3 h-3 text-zinc-400" />
                                )}
                                {val.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditValue(val)}
                                  title="Edit Option"
                                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-500 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openDeleteValue(val)}
                                  title="Delete Option"
                                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 px-4 space-y-3">
              <Layers className="w-12 h-12 text-zinc-400 mx-auto opacity-30" />
              <div className="space-y-1">
                <h4 className="font-bold text-base">No Category Selected</h4>
                <p className={`text-xs max-w-sm mx-auto ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                  Select a category from the left sidebar to view, add, or edit its options.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: CREATE CATEGORY ─── */}
      <Dialog open={isCreateCatOpen} onOpenChange={setIsCreateCatOpen}>
        <DialogContent
          className={`w-[96vw] max-w-xl max-h-[90vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-amber-500" />
              Create New Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a dynamic category group (e.g., Church Roles, Regions, Matrimony Preferences).
            </DialogDescription>
          </DialogHeader>

          {catFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{catFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveCreateCategory} noValidate className="space-y-4 py-2">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                <span>Category Name <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!catCode) {
                    setCatCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]+/g, "_")
                        .replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Church Roles"
                required
              />
              <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                Human-friendly label displayed in navigation and dropdown forms
              </span>
            </div>

            {/* System Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <span>System Code <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={catCode}
                onChange={(e) =>
                  setCatCode(
                    e.target.value.toUpperCase().replace(/\s+/g, "_")
                  )
                }
                placeholder="e.g. CHURCH_ROLE"
                className="font-mono uppercase"
                required
              />
              <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                Unique token used by the system to fetch these dropdown options
              </span>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span>
                  Description{" "}
                  <span className={`text-[10px] font-normal ${t("text-zinc-400", "text-slate-500", "text-zinc-500")}`}>
                    (Optional)
                  </span>
                </span>
              </label>
              <Textarea
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Briefly explain what this category is used for..."
                className="min-h-[80px] rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateCatOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createCategoryMut.isPending}
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs"
              >
                {createCategoryMut.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EDIT CATEGORY ─── */}
      <Dialog open={isEditCatOpen} onOpenChange={setIsEditCatOpen}>
        <DialogContent
          className={`w-[96vw] max-w-xl max-h-[90vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" />
              Edit Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update category name and description for {categoryToEdit?.code}.
            </DialogDescription>
          </DialogHeader>

          {catFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{catFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEditCategory} noValidate className="space-y-4 py-2">
            {/* System Code (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <span>System Code</span>
              </label>
              <Input
                value={categoryToEdit?.code || ""}
                readOnly
                className="bg-zinc-50 dark:bg-zinc-800/50 cursor-not-allowed font-mono text-zinc-500 dark:text-zinc-400"
              />
              <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                System token cannot be changed once created (read-only)
              </span>
            </div>

            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FolderPlus className="h-3.5 w-3.5 text-amber-500" />
                <span>Category Name <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Church Roles"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span>Description</span>
              </label>
              <Textarea
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Briefly explain what this category is used for..."
                className="min-h-[80px] rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditCatOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateCategoryMut.isPending}
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs"
              >
                {updateCategoryMut.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: DELETE CATEGORY ─── */}
      <Dialog open={isDeleteCatOpen} onOpenChange={setIsDeleteCatOpen}>
        <DialogContent
          className={`w-[96vw] max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2 text-rose-500">
              <Trash2 className="h-5 w-5" />
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete category{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                &ldquo;{categoryToDelete?.name}&rdquo;
              </strong>{" "}
              ({categoryToDelete?.code})?
            </DialogDescription>
          </DialogHeader>

          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${t(
              "bg-rose-50 border-rose-200 text-rose-800",
              "bg-rose-950/40 border-rose-900/60 text-rose-300",
              "bg-rose-950/30 border-rose-900/60 text-rose-300"
            )}`}
          >
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              Permanent Deletion Warning
            </p>
            <p className="text-[11px] leading-relaxed">
              This will permanently delete this category and all of its associated dropdown options. This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteCatOpen(false)}
              className="h-9 px-4 rounded-full text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteCategoryMut.isPending}
              onClick={handleConfirmDeleteCategory}
              className="h-9 px-5 py-2 rounded-full font-bold text-xs shadow-xs"
            >
              {deleteCategoryMut.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: ADD OPTION ─── */}
      <Dialog open={isCreateValOpen} onOpenChange={setIsCreateValOpen}>
        <DialogContent
          className={`w-[96vw] max-w-xl max-h-[90vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              Add Dropdown Option
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a new selectable choice to &ldquo;{selectedCategory?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          {valFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{valFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveCreateValue} noValidate className="space-y-4 py-2">
            {/* Display Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-amber-500" />
                <span>Display Label <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={valLabel}
                onChange={(e) => {
                  setValLabel(e.target.value);
                  if (!valCode) {
                    setValCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]+/g, "_")
                        .replace(/^_+|_+$/g, "")
                    );
                  }
                }}
                placeholder="e.g. Senior Pastor"
                required
              />
              <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                The readable option label visible in forms and dropdown menus
              </span>
            </div>

            {/* Stored Value Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <span>Stored Value Code <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={valCode}
                onChange={(e) =>
                  setValCode(
                    e.target.value.toUpperCase().replace(/\s+/g, "_")
                  )
                }
                placeholder="e.g. PASTOR"
                className="font-mono uppercase"
                required
              />
              <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                Unique uppercase token saved in database records
              </span>
            </div>

            {/* Row: Sort Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ArrowDown10 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Sort Order</span>
                </label>
                <Input
                  type="number"
                  value={valSort}
                  onChange={(e) => setValSort(parseInt(e.target.value, 10) || 0)}
                />
                <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                  Display order in dropdown lists (e.g. 1, 2, 3)
                </span>
              </div>

              {/* Status Pill matching Family Module */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 opacity-0 select-none hidden sm:flex">
                  <span>Status</span>
                </label>
                <label
                  className={`h-9 flex items-center gap-2.5 px-3 rounded-xl border cursor-pointer select-none transition-colors ${
                    valActive
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : t(
                          "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700",
                          "border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-300",
                          "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300"
                        )
                  }`}
                >
                  <Checkbox
                    checked={valActive}
                    onCheckedChange={(checked) => setValActive(Boolean(checked))}
                  />
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    Active in dropdowns
                  </span>
                </label>
                <span className={`text-[11px] block ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                  Inactive options are hidden from new form entries
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateValOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createValueMut.isPending}
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs"
              >
                {createValueMut.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Adding...
                  </>
                ) : (
                  "Add Option"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EDIT OPTION ─── */}
      <Dialog open={isEditValOpen} onOpenChange={setIsEditValOpen}>
        <DialogContent
          className={`w-[96vw] max-w-xl max-h-[90vh] overflow-y-auto ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" />
              Edit Dropdown Option
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update label, code, sort position, or active state.
            </DialogDescription>
          </DialogHeader>

          {valFormError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{valFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEditValue} noValidate className="space-y-4 py-2">
            {/* Display Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-amber-500" />
                <span>Display Label <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={valLabel}
                onChange={(e) => setValLabel(e.target.value)}
                placeholder="e.g. Senior Pastor"
                required
              />
            </div>

            {/* Stored Value Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <span>Stored Value Code <span className="text-red-500">*</span></span>
              </label>
              <Input
                value={valCode}
                onChange={(e) =>
                  setValCode(
                    e.target.value.toUpperCase().replace(/\s+/g, "_")
                  )
                }
                className="font-mono uppercase"
                required
              />
            </div>

            {/* Row: Sort Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ArrowDown10 className="h-3.5 w-3.5 text-amber-500" />
                  <span>Sort Order</span>
                </label>
                <Input
                  type="number"
                  value={valSort}
                  onChange={(e) => setValSort(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 opacity-0 select-none hidden sm:flex">
                  <span>Status</span>
                </label>
                <label
                  className={`h-9 flex items-center gap-2.5 px-3 rounded-xl border cursor-pointer select-none transition-colors ${
                    valActive
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : t(
                          "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700",
                          "border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-300",
                          "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300"
                        )
                  }`}
                >
                  <Checkbox
                    checked={valActive}
                    onCheckedChange={(checked) => setValActive(Boolean(checked))}
                  />
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    Active in dropdowns
                  </span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditValOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateValueMut.isPending}
                className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xs"
              >
                {updateValueMut.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: DELETE OPTION ─── */}
      <Dialog open={isDeleteValOpen} onOpenChange={setIsDeleteValOpen}>
        <DialogContent
          className={`w-[96vw] max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2 text-rose-500">
              <Trash2 className="h-5 w-5" />
              Delete Option
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete option{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                &ldquo;{valueToDelete?.label}&rdquo;
              </strong>{" "}
              ({valueToDelete?.code})?
            </DialogDescription>
          </DialogHeader>

          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${t(
              "bg-rose-50 border-rose-200 text-rose-800",
              "bg-rose-950/40 border-rose-900/60 text-rose-300",
              "bg-rose-950/30 border-rose-900/60 text-rose-300"
            )}`}
          >
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              Option Removal
            </p>
            <p className="text-[11px] leading-relaxed">
              This choice will no longer be available in form dropdowns. Past records with this value will keep their value stored as text.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteValOpen(false)}
              className="h-9 px-4 rounded-full text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteValueMut.isPending}
              onClick={handleConfirmDeleteValue}
              className="h-9 px-5 py-2 rounded-full font-bold text-xs shadow-xs"
            >
              {deleteValueMut.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Option"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}