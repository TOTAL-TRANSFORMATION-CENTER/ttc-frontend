import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

/**
 * Next.js Edge Middleware for Route Protection, Token Verification,
 * and Role-Based Access Control (RBAC).
 */

const JWT_SECRET =
  process.env.AUTH_SECRET_KEY ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev_local_secret_key_only_do_not_use_in_production_32chars"
    : "");

const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);
const ACCESS_TOKEN_COOKIE = "ttc_access_token";

// ─── Public routes that should bypass auth ───
const PUBLIC_PATHS = [
  "/admin", // Admin Login Page
  "/login", // Member Login Page
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/favicon.ico",
  "/_next",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets and Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // e.g. favicon.ico, images
  ) {
    return NextResponse.next();
  }

  // 2. Check if current path is explicitly public
  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api/auth/")) ||
    pathname === "/" ||
    pathname === "/admin";

  // 3. Extract access token from HTTP-only cookie or Authorization header
  let token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;

  if (!token) {
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 4. Verify token if present
  let verifiedPayload: (jose.JWTPayload & { isActive?: boolean; role?: string }) | null = null;
  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES, {
        algorithms: ["HS256"],
      });
      verifiedPayload = payload as jose.JWTPayload & { isActive?: boolean; role?: string };
    } catch {
      verifiedPayload = null;
    }
  }

  // If user visits /admin (login page) and already has a valid active admin token, redirect to dashboard
  if (pathname === "/admin" && verifiedPayload?.isActive) {
    const roleUpper = (verifiedPayload.role || "").toUpperCase();
    if (roleUpper.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // If public route, allow through
  if (isPublicPath) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const isAdminDashboardRoute = pathname.startsWith("/admin/") && pathname !== "/admin";

  // 5. If token is missing or invalid: Reject Unauthorized
  if (!verifiedPayload) {
    if (isApiRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Missing, expired, or invalid authentication token. Please login.",
          error: "UNAUTHORIZED",
          code: 401,
        },
        { status: 401 }
      );
    }

    // For Page routes, redirect to appropriate login page
    const loginTarget = isAdminDashboardRoute ? "/admin" : "/login";
    const redirectUrl = new URL(loginTarget, request.url);
    redirectUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Check if account is active
  if (verifiedPayload.isActive === false || String(verifiedPayload.isActive) === "false") {
    if (isApiRoute) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Your administrator account has been deactivated. Please contact church leadership.",
          error: "ACCOUNT_DEACTIVATED",
          code: 403,
        },
        { status: 403 }
      );
    }

    const redirectUrl = new URL("/admin", request.url);
    redirectUrl.searchParams.set("error", "account_deactivated");
    return NextResponse.redirect(redirectUrl);
  }

  // 7. Role-Based Access Control (RBAC)
  const roleUpper = (verifiedPayload.role || "").toUpperCase();
  const isAdminUser = roleUpper.includes("ADMIN") || roleUpper === "SUPER ADMIN";

  // Admin-only API routes and Admin Management
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin/admin-management")) {
    if (!isAdminUser) {
      if (isApiRoute) {
        return NextResponse.json(
          {
            success: false,
            message: "Forbidden: You do not possess administrator rights to access this resource.",
            error: "FORBIDDEN",
            code: 403,
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 8. Inject verified user context headers into the request for downstream API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(verifiedPayload.id || ""));
  requestHeaders.set("x-user-member-id", String(verifiedPayload.memberId || ""));
  requestHeaders.set("x-user-role", String(verifiedPayload.role || ""));
  requestHeaders.set("x-user-name", String(verifiedPayload.name || ""));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// ─── Route Matcher ───
export const config = {
  matcher: [
    /*
     * Match all protected API endpoints:
     * - /api/admin/:path*
     * - /api/families/:path*
     * - /api/members/:path*
     * Match all protected UI pages:
     * - /admin/:path*
     * - /dashboard/:path*
     */
    "/api/admin/:path*",
    "/api/families/:path*",
    "/api/members/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
