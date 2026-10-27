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
    credentials: "same-origin", // Guarantees cookies are sent
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized and not already calling auth endpoints
  if (response.status === 401 && !url.includes("/api/auth/")) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
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
