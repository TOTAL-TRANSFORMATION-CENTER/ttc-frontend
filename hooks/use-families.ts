import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { calculateYears } from "@/lib/utils";
import type {
  CreateFamilyDto,
  FamilyDirectoryItem as Family,
  PaginationMeta,
  Status,
  UpdateFamilyDto,
} from "@/types";

export interface FetchFamiliesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  status?: string;
}

interface RawMember {
  id: string;
  name: string;
  is_head?: boolean;
  age?: number | null;
  dob?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  blood_group?: string | null;
  status?: string | null;
  marital_status?: string | null;
  dom?: string | null;
  is_looking_for_alliance?: boolean;
  occupation?: string | null;
  church_role?: string | null;
  role?: string | null;
}

interface RawFamily {
  id: string;
  status?: string | null;
  location?: string | null;
  region?: string | null;
  address?: string | null;
  members?: RawMember[];
}

export interface FetchFamiliesResponse {
  families: Family[];
  pagination: PaginationMeta;
}

/**
 * Fetch list of families with pagination & search filtering
 */
export async function fetchFamilies(
  params: FetchFamiliesParams = {}
): Promise<FetchFamiliesResponse> {
  const { page = 1, limit = 10, search = "", region = "", status = "" } = params;

  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) searchParams.set("search", search.trim());
  if (region.trim()) searchParams.set("region", region.trim());
  if (status.trim()) searchParams.set("status", status.trim());

  const res = await apiClient(`/api/families?${searchParams.toString()}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch families");
  }

  const rawList: RawFamily[] = Array.isArray(json.data) ? json.data : [];
  const families: Family[] = rawList.map((f: RawFamily) => {
    const head = f.members?.find((m: RawMember) => m.is_head) || f.members?.[0];
    return {
      id: f.id,
      name: head?.name ? `${head.name} Family` : `Family #${f.id?.slice(0, 8) ?? ""}`,
      status: (f.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as Status,
      location: f.location || "",
      region: f.region || "",
      address: f.address || "",
      memberCount: f.members?.length || 0,
      members: (f.members || []).map((m: RawMember) => ({
        id: m.id,
        name: m.name,
        isHead: !!m.is_head,
        age: typeof m.age === "number" ? m.age : (m.dob ? Number(calculateYears(m.dob)) || 0 : 0),
        gender: m.gender || "MALE",
        phone: m.phone || "",
        email: m.email || "",
        bloodGroup: m.blood_group || "",
        dob: m.dob ? new Date(m.dob).toLocaleDateString("en-GB") : "",
        status: (m.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as Status,
        maritalStatus: m.marital_status || "UNMARRIED",
        dateOfMarriage: m.dom ? new Date(m.dom).toLocaleDateString("en-GB") : undefined,
        isLookingForAlliance: !!m.is_looking_for_alliance,
        occupation: m.occupation || "",
        role: m.church_role || m.role || "Member",
        address: f.address || "",
      })),
    };
  });

  return {
    families,
    pagination: json.pagination || {
      page,
      limit,
      total: families.length,
      totalPages: 1,
    },
  };
}

/**
 * Fetch a single family by its ID
 */
export async function fetchFamilyById(id: string) {
  if (!id) throw new Error("Family ID is required");

  const res = await apiClient(`/api/families/${encodeURIComponent(id)}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch family record");
  }

  return json.data;
}

/**
 * Hook to fetch families list with TanStack Query
 */
export function useFamilies(params: FetchFamiliesParams = {}) {
  return useQuery({
    queryKey: ["families", params],
    queryFn: () => fetchFamilies(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single family record by ID
 */
export function useFamily(id: string) {
  return useQuery({
    queryKey: ["family", id],
    queryFn: () => fetchFamilyById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to create a family via POST /api/families
 */
export function useCreateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFamilyDto) => {
      const res = await apiClient("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create family");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
  });
}

/**
 * Hook to update a family via PUT /api/families/[id]
 */
export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFamilyDto;
    }) => {
      const res = await apiClient(`/api/families/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update family");
      }
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["family", id] });
    },
  });
}

/**
 * Hook to soft delete a family via DELETE /api/families/[id]
 */
export function useDeleteFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/families/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete family");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] });
    },
  });
}

/**
 * Hook to fetch live total count of registered families
 */
export function useFamilyCount() {
  return useQuery({
    queryKey: ["families", "count"],
    queryFn: async () => {
      const res = await apiClient("/api/families?limit=1");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch family count");
      }
      return (json.pagination?.total ?? 0) as number;
    },
    staleTime: 30 * 1000,
  });
}
