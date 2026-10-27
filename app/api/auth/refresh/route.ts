import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyAuthToken,
} from "@/lib/jwt";

// ─── POST: Refresh access token using HTTP-only refresh token ───
export async function POST(request: NextRequest) {
  try {
    // 1. Extract refresh token from cookie or body or header
    let refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value || null;

    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken || null;
      } catch {
        // Body is optional
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Refresh token is missing. Please login again.",
          code: 401,
        },
        { status: 401 }
      );
    }

    // 2. Verify refresh token
    const decoded = await verifyAuthToken(refreshToken);

    if (!decoded || decoded.type !== "refresh" || !decoded.id) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Invalid or expired refresh token. Please login again.",
          code: 401,
        },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    // 3. Verify admin account is still valid and active in database
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!admin || !admin.is_active) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Forbidden: Account has been deactivated or no longer exists.",
          code: 403,
        },
        { status: 403 }
      );
      return clearAuthCookies(response);
    }

    const normalizedRole = admin.role || admin.members.role || "ADMIN";

    const userPayload = {
      id: admin.id,
      memberId: admin.member_id,
      name: admin.members.name,
      role: normalizedRole,
      email: admin.members.email,
      phone: admin.members.phone,
      isActive: admin.is_active,
    };

    // 4. Issue new tokens (Access Token + Rotated Refresh Token)
    const newAccessToken = signAccessToken(userPayload);
    const newRefreshToken = signRefreshToken(userPayload);

    const response = NextResponse.json({
      success: true,
      message: "Authentication token refreshed successfully.",
      user: userPayload,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    return setAuthCookies(response, newAccessToken, newRefreshToken);
  } catch (error) {
    console.error("POST /api/auth/refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to refresh authentication token.",
        code: 500,
      },
      { status: 500 }
    );
  }
}
