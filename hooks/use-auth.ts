import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CurrentUser } from "@/types";

const STORAGE_KEY = "ttc_user";

/**
 * Extracts 2-letter initials from a user's full name
 * Examples:
 * - "Stephen Raj" -> "SR"
 * - "Super Admin" -> "SA"
 * - "Administrator" -> "AD"
 * - "John" -> "JO"
 * - "" / null -> "SA"
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2
      ? single.substring(0, 2).toUpperCase()
      : single.substring(0, 1).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Read cached user from browser localStorage
 */
function getCachedUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as CurrentUser;
    if (user && user.id && user.name && user.name.trim()) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save user to browser localStorage
 */
export function setCachedUser(user: CurrentUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota/permission issues
  }
}

/**
 * Fetch authenticated user profile from /api/auth/me
 */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await apiClient("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setCachedUser(null);
      }
      return null;
    }
    const data = await res.json();
    if (data.success && data.user) {
      setCachedUser(data.user);
      return data.user as CurrentUser;
    }
    return null;
  } catch (error) {
    console.error("fetchCurrentUser error:", error);
    return getCachedUser();
  }
}

/**
 * React Query Hook: Current Authenticated User
 * Fetches and revalidates against /api/auth/me.
 */
export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    placeholderData: () => getCachedUser() ?? undefined,
    staleTime: 10 * 1000, // 10 seconds fresh
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to invalidate and clear user session
 */
export function useAuthActions() {
  const queryClient = useQueryClient();

  const clearSession = () => {
    setCachedUser(null);
    queryClient.setQueryData(["currentUser"], null);
  };

  return { clearSession };
}
