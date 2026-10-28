/**
 * Enterprise API Client with Automatic Silent Token Refresh
 * Intercepts 401 Unauthorized responses and silently refreshes the access token
 * via /api/auth/refresh before retrying the original request.
 */

export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const config: RequestInit = {
    ...options,
    headers: defaultHeaders,
    credentials: "include", // Guarantees cookies are sent
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, automatically try to refresh token except on login/refresh/logout
  const isAuthActionEndpoint =
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout");

  if (response.status === 401 && !isAuthActionEndpoint) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        // Silent refresh succeeded: retry the original request with new cookie
        response = await fetch(url, config);
      }
    } catch {
      // Refresh failed; propagate original 401
    }
  }

  return response;
}
