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
import { verifyPassword, hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const token = extractTokenFromRequest(request);
    let payload = token ? await verifyAuthToken(token) : null;

    if (!payload || !payload.id) {
      const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
      if (refreshToken) {
        const refreshPayload = await verifyAuthToken(refreshToken);
        if (refreshPayload && refreshPayload.type === "refresh" && refreshPayload.id) {
          payload = refreshPayload;
        }
      }
    }

    if (!payload || !payload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Please log in to change your password.",
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } =
      (body as {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      }) || {};

    if (!currentPassword || !currentPassword.trim()) {
      return NextResponse.json(
        { success: false, message: "Please enter your current password." },
        { status: 400 }
      );
    }

    if (!newPassword || !newPassword.trim()) {
      return NextResponse.json(
        { success: false, message: "Please enter a new password." },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      return NextResponse.json(
        { success: false, message: "Please confirm your new password." },
        { status: 400 }
      );
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "New password and confirmation password do not match.",
        },
        { status: 400 }
      );
    }

    if (newPassword.trim() === currentPassword.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as your current password.",
        },
        { status: 400 }
      );
    }

    // 3. Find current admin record
    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
      include: {
        members: true,
      },
    });

    if (!admin || !admin.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Administrator account not found or is inactive.",
        },
        { status: 403 }
      );
    }

    // 4. Verify current password
    const { isValid } = await verifyPassword(
      currentPassword.trim(),
      admin.password
    );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "The current password you entered is incorrect.",
        },
        { status: 400 }
      );
    }

    // 5. Hash new password and set is_reset to false
    const newHashedPassword = await hashPassword(newPassword.trim());

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: newHashedPassword,
        is_reset: false, // Password reset requirement fulfilled!
        last_modified: new Date(),
      },
      include: {
        members: true,
      },
    });

    const updatedUserPayload = {
      id: updatedAdmin.id,
      memberId: updatedAdmin.member_id,
      name: updatedAdmin.members.name,
      role: updatedAdmin.role || "ADMIN",
      churchRole: updatedAdmin.members.church_role,
      email: updatedAdmin.members.email,
      phone: updatedAdmin.members.phone,
      isActive: updatedAdmin.is_active,
      isReset: false,
    };

    // 6. Issue fresh tokens and set cookies
    const newAccessToken = signAccessToken(updatedUserPayload);
    const newRefreshToken = signRefreshToken(updatedUserPayload);

    const response = NextResponse.json({
      success: true,
      message: "Your password has been changed successfully.",
      user: updatedUserPayload,
    });

    return setAuthCookies(response, newAccessToken, newRefreshToken);
  } catch (error) {
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while changing your password.",
      },
      { status: 500 }
    );
  }
}
