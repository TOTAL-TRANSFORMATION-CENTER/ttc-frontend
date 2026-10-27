import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AdminItem, CreateAdminDto, MemberOption, UpdateAdminDto } from "@/types";

/**
 * Fetch all admins from GET /api/admin
 */
export async function fetchAdmins(): Promise<AdminItem[]> {
  const res = await apiClient("/api/admin");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch administrator accounts.");
  }
  return json.data || [];
}

/**
 * Fetch all members for dropdown selection from GET /api/members
 */
export async function fetchMembers(search = ""): Promise<MemberOption[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await apiClient(`/api/members${query}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch church members.");
  }
  return json.data || [];
}

/**
 * Fetch a single member's complete details from GET /api/members/[id]
 */
export async function fetchMemberById(id: string) {
  if (!id) return null;
  const res = await apiClient(`/api/members/${encodeURIComponent(id)}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to fetch member details.");
  }
  return json.data;
}

/**
 * TanStack Query Hook: Fetch admins list
 */
export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: fetchAdmins,
  });
}

/**
 * TanStack Query Hook: Fetch members for dropdown
 */
export function useMembersList(search = "") {
  return useQuery({
    queryKey: ["members", search],
    queryFn: () => fetchMembers(search),
  });
}

/**
 * TanStack Query Hook: Fetch single member details
 */
export function useMemberDetails(id: string) {
  return useQuery({
    queryKey: ["member", id],
    queryFn: () => fetchMemberById(id),
    enabled: Boolean(id),
  });
}

/**
 * TanStack Query Mutation: Create Admin (POST /api/admin)
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAdminDto) => {
      const res = await apiClient("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create administrator account.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * TanStack Query Mutation: Update Admin (PUT /api/admin/[id])
 */
export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAdminDto;
    }) => {
      const res = await apiClient(`/api/admin/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update administrator account.");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

/**
 * TanStack Query Mutation: Delete / Revoke Admin (DELETE /api/admin/[id])
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/admin/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to revoke administrator account.");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
