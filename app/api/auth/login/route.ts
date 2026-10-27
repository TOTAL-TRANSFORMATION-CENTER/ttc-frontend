import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/password";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { identifier, phone, email, password } =
      (body as {
        identifier?: string;
        phone?: string;
        email?: string;
        password?: string;
      }) ?? {};

    const loginId = (identifier || phone || email || "").trim();

    if (!loginId || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your phone number or email and password.",
        },
        { status: 400 }
      );
    }

    // Clean phone number for resilient matching (ignoring formatting spaces, dashes, +91)
    const digitsOnly = loginId.replace(/\D/g, "");
    const phoneConditions: Array<Record<string, unknown>> = [
      { phone: { equals: loginId, mode: "insensitive" } },
      { phone: { contains: loginId, mode: "insensitive" } },
    ];

    if (digitsOnly.length >= 10) {
      phoneConditions.push({ phone: { contains: digitsOnly.slice(-10) } });
    }

    // Find member by phone or email (active/non-deleted only)
    const member = await prisma.members.findFirst({
      where: {
        is_deleted: false,
        OR: [
          { email: { equals: loginId, mode: "insensitive" } },
          ...phoneConditions,
        ],
      },
      include: {
        admin: true,
      },
    });


    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered admin found with this number or email.",
        },
        { status: 401 }
      );
    }

    // Check if member has an admin record
    if (!member.admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access restricted: This member account has not been provisioned with administrator access.",
        },
        { status: 403 }
      );
    }

    // Crucial requirement: Check if the admin is inactive
    if (!member.admin.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your administrator account has been deactivated. Please contact the senior administrator.",
        },
        { status: 403 }
      );
    }

    // Verify password tightly using bcrypt & secret key HMAC pepper
    const { isValid, needsRehash } = await verifyPassword(
      password.trim(),
      member.admin.password
    );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect password. Please verify your credentials and try again.",
        },
        { status: 401 }
      );
    }

    // If account had legacy plain-text or needs rehash, securely upgrade to protective bcrypt hash immediately
    if (needsRehash) {
      const secureHash = await hashPassword(password.trim());
      await prisma.admin.update({
        where: { id: member.admin.id },
        data: {
          password: secureHash,
          last_modified: new Date(),
        },
      });
    } else {
      // Update last_modified / login timestamp
      await prisma.admin.update({
        where: { id: member.admin.id },
        data: { last_modified: new Date() },
      });
    }

    const normalizedRole = member.admin.role || "ADMIN";

    const userPayload = {
      id: member.admin.id,
      memberId: member.id,
      name: member.name,
      role: normalizedRole,
      email: member.email,
      phone: member.phone,
      isActive: member.admin.is_active,
    };

    // Generate real-world enterprise standard access and refresh tokens
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    // Create JSON response
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: userPayload,
      accessToken,
      refreshToken,
    });

    // Automatically set secure HTTP-only cookies on the response
    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
