import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest, verifyAuthToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: Return currently authenticated user profile ───
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: No active authentication session found.",
          code: 401,
        },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);

    if (!payload || !payload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Authentication session has expired or is invalid.",
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

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        memberId: admin.member_id,
        name: admin.members.name,
        role: admin.role || "ADMIN",
        churchRole: admin.members.church_role,
        email: admin.members.email,
        phone: admin.members.phone,
        isActive: admin.is_active,
      },
    });
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
