import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAttendancePortalStatus } from "@/lib/attendance-window";
import { ATTENDANCE_SERVICES } from "@/constants";
import { extractTokenFromRequest, verifyTokenNode } from "@/lib/jwt";
import type { AttendancePortalMode, AttendanceServiceOption } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "true";

    const status = await getAttendancePortalStatus(preview);

    // Fetch dynamic services from categories DB, or fallback to constants
    let services: AttendanceServiceOption[] = [
      ...ATTENDANCE_SERVICES,
    ];

    try {
      const serviceCategory = await prisma.categories.findUnique({
        where: { code: "SERVICE" },
        include: {
          category_values: {
            where: { is_active: true },
            orderBy: { sort_order: "asc" },
          },
        },
      });

      if (serviceCategory && serviceCategory.category_values.length > 0) {
        services = serviceCategory.category_values.map((v) => ({
          code: v.code,
          label: v.label,
          shortLabel: v.label.split("(")[0]?.trim() || v.label,
        }));
      }
    } catch (catErr) {
      console.warn("Could not load dynamic SERVICE category, using defaults:", catErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        services,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance portal status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance portal status",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Auth check: must be logged-in admin
    const token = extractTokenFromRequest(request);
    const payload = token ? verifyTokenNode(token) : null;

    if (!payload || !payload.isActive) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const roleUpper = (payload.role || "").toUpperCase();
    if (!roleUpper.includes("ADMIN") && roleUpper !== "SUPER ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const mode = String(body.mode || "").toUpperCase() as AttendancePortalMode;

    if (!["AUTOMATIC", "FORCE_OPEN", "FORCE_CLOSED"].includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mode. Allowed values: AUTOMATIC, FORCE_OPEN, FORCE_CLOSED.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.system_settings.upsert({
      where: { key: "attendance_portal_mode" },
      update: {
        value: mode,
        updated_at: new Date(),
        updated_by: payload.id,
      },
      create: {
        key: "attendance_portal_mode",
        value: mode,
        description: "Attendance portal mode: AUTOMATIC (Sundays 7am-12am IST), FORCE_OPEN, or FORCE_CLOSED",
        updated_at: new Date(),
        updated_by: payload.id,
      },
    });

    const status = await getAttendancePortalStatus();

    return NextResponse.json({
      success: true,
      message: `Portal mode updated to ${mode}`,
      data: {
        ...status,
        mode: updated.value,
      },
    });
  } catch (error) {
    console.error("Error updating portal mode:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update portal mode" },
      { status: 500 }
    );
  }
}
