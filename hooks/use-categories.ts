import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CategoryItem,
  CategoryValueItem,
  CreateCategoryDto,
  UpdateCategoryMutationParams,
  CreateCategoryValueMutationParams,
  UpdateCategoryValueMutationParams,
  DeleteCategoryValueMutationParams,
} from "@/types";

/**
 * Fetch all categories with optional search and values
 */
export async function fetchCategories(
  search = "",
  includeValues = false
): Promise<CategoryItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (includeValues) params.set("includeValues", "true");

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiClient(`/api/categories${query}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch categories.");
  }
  return json.data || [];
}

/**
 * Fetch single category by ID or code
 */
export async function fetchCategory(idOrCode: string | number): Promise<CategoryItem> {
  const res = await apiClient(`/api/categories/${encodeURIComponent(String(idOrCode))}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch category details.");
  }
  return json.data;
}

/**
 * Fetch values for a category (can filter active only)
 */
export async function fetchCategoryValues(
  idOrCode: string | number,
  activeOnly = false
): Promise<CategoryValueItem[]> {
  if (!idOrCode) return [];
  const query = activeOnly ? "?activeOnly=true" : "";
  const res = await apiClient(
      `/api/categories/${encodeURIComponent(String(idOrCode))}/values${query}`,
    {
      cache: "no-store",
    }
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch category options.");
  }
  return json.data || [];
}

// ─── QUERY HOOKS ───

export function useCategories(search = "", includeValues = false) {
  return useQuery({
    queryKey: ["categories", { search, includeValues }],
    queryFn: () => fetchCategories(search, includeValues),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCategory(idOrCode: string | number | null) {
  return useQuery({
    queryKey: ["category", idOrCode],
    queryFn: () => (idOrCode ? fetchCategory(idOrCode) : Promise.reject("No ID provided")),
    enabled: Boolean(idOrCode),
    staleTime: 0,
  });
}

export function useCategoryValues(idOrCode: string | number | null, activeOnly = false) {
  return useQuery({
    queryKey: ["category-values", idOrCode, { activeOnly }],
    queryFn: () => (idOrCode ? fetchCategoryValues(idOrCode, activeOnly) : Promise.resolve([])),
    enabled: Boolean(idOrCode),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// ─── MUTATION HOOKS ───

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategoryDto): Promise<CategoryItem> => {
      const res = await apiClient("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create category.");
      }
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: UpdateCategoryMutationParams): Promise<CategoryItem> => {
      const res = await apiClient(`/api/categories/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update category.");
      }
      return json.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number): Promise<void> => {
      const res = await apiClient(`/api/categories/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete category.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-values"] });
    },
  });
}

export function useCreateCategoryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      payload,
    }: CreateCategoryValueMutationParams): Promise<CategoryValueItem> => {
      const res = await apiClient(
        `/api/categories/${encodeURIComponent(String(categoryId))}/values`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add category option.");
      }
      return json.data;
    },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["category"] });
        queryClient.invalidateQueries({ queryKey: ["category-values"] });
      },
  });
}

export function useUpdateCategoryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: UpdateCategoryValueMutationParams): Promise<CategoryValueItem> => {
      const res = await apiClient(`/api/categories/values/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update category option.");
      }
      return json.data;
    },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["category"] });
        queryClient.invalidateQueries({ queryKey: ["category-values"] });
      },
  });
}

export function useDeleteCategoryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
    }: DeleteCategoryValueMutationParams): Promise<void> => {
      const res = await apiClient(`/api/categories/values/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete category option.");
      }
    },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["category"] });
        queryClient.invalidateQueries({ queryKey: ["category-values"] });
      },
  });
}

