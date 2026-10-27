import jwt from "jsonwebtoken";
import * as jose from "jose";
import { NextResponse } from "next/server";

/**
 * Real-World Application Standard JWT Security Utilities
 * Dual-compatible with Node.js API Route Handlers (jsonwebtoken)
 * and Next.js Edge Middleware runtime (jose).
 */

export interface AuthTokenPayload {
  id: string; // admin.id
  memberId: string;
  name: string;
  role: string; // "SUPER ADMIN" | "ADMIN" | "MEMBER"
  email: string | null;
  phone: string | null;
  isActive: boolean;
  type?: "access" | "refresh";
}

// ─── Environment Secret Key ───
const JWT_SECRET =
  process.env.AUTH_SECRET_KEY ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev_local_secret_key_only_do_not_use_in_production_32chars"
    : "");

const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

// ─── Token Lifespans ───
export const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 mins in seconds (900s)
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds (604,800s)

// ─── Cookie Names ───
export const ACCESS_TOKEN_COOKIE = "ttc_access_token";
export const REFRESH_TOKEN_COOKIE = "ttc_refresh_token";

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Creates a short-lived access token (15m) using jsonwebtoken
 */
export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Creates a long-lived refresh token (7d) using jsonwebtoken
 */
export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      memberId: payload.memberId,
      role: payload.role,
      type: "refresh",
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

/**
 * Edge-compatible token verification using jose (runs in Next.js Middleware & Node.js)
 */
export async function verifyTokenEdge(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES, {
      algorithms: ["HS256"],
    });
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Node.js-compatible token verification using jsonwebtoken (runs in Route Handlers)
 */
export function verifyTokenNode(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return decoded as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Universal token verification: works in any runtime
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  if (!token) return null;
  return verifyTokenEdge(token);
}

/**
 * Sets secure HTTP-only cookies for access and refresh tokens on a NextResponse
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: accessToken,
    ...COOKIE_CONFIG,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: refreshToken,
    ...COOKIE_CONFIG,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * Clears auth cookies on logout
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    ...COOKIE_CONFIG,
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    ...COOKIE_CONFIG,
    maxAge: 0,
  });

  return response;
}

/**
 * Extracts the access token from request cookies or Authorization header
 */
export function extractTokenFromRequest(
  request:
    | Request
    | {
        cookies?: { get?: (name: string) => { value?: string } | string | undefined };
        headers?: Headers | { get?: (name: string) => string | null };
      }
): string | null {
  // 1. Check cookies
  if ("cookies" in request && request.cookies) {
    if (typeof request.cookies.get === "function") {
      const cookieVal = request.cookies.get(ACCESS_TOKEN_COOKIE);
      if (cookieVal) {
        return typeof cookieVal === "string" ? cookieVal : (cookieVal.value ?? null);
      }
    }
  }

  // 2. Check Authorization header: Bearer <token>
  let authHeader: string | null = null;
  if ("headers" in request && request.headers) {
    if (typeof request.headers.get === "function") {
      authHeader = request.headers.get("authorization");
    }
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 3. Check Cookie header fallback
  if ("headers" in request && request.headers) {
    const rawCookie =
      typeof request.headers.get === "function"
        ? request.headers.get("cookie")
        : null;

    if (rawCookie && typeof rawCookie === "string") {
      const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}=([^;]+)`));
      if (match) return decodeURIComponent(match[1]);
    }
  }

  return null;
}
