import { NextRequest, NextResponse } from "next/server";
import {
  extractTokenFromRequest,
  verifyAuthToken,
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: Return currently authenticated user profile ───
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    let payload = token ? await verifyAuthToken(token) : null;
    let shouldRotateTokens = false;

    // Fallback: If access token is missing or expired, check refresh token
    if (!payload || !payload.id) {
      const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
      if (refreshToken) {
        const refreshPayload = await verifyAuthToken(refreshToken);
        if (refreshPayload && refreshPayload.type === "refresh" && refreshPayload.id) {
          payload = refreshPayload;
          shouldRotateTokens = true;
        }
      }
    }

    if (!payload || !payload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: No active authentication session found.",
          code: 401,
        },
        { status: 401 }
      );
    }

    // Fetch latest active state from DB
    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            church_role: true,
          },
        },
      },
    });

    if (!admin || !admin.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Account has been deactivated.",
          code: 403,
        },
        { status: 403 }
      );
    }

    const userData = {
      id: admin.id,
      memberId: admin.member_id,
      name: admin.members.name,
      role: admin.role || "ADMIN",
      churchRole: admin.members.church_role,
      email: admin.members.email,
      phone: admin.members.phone,
      isActive: admin.is_active,
      isReset: admin.is_reset,
    };

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // If auto-refreshed via refresh token, issue fresh cookies immediately
    if (shouldRotateTokens) {
      const newAccessToken = signAccessToken(userData);
      const newRefreshToken = signRefreshToken(userData);
      setAuthCookies(response, newAccessToken, newRefreshToken);
    }

    return response;
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify session.",
        code: 500,
      },
      { status: 500 }
    );
  }
}
