import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAttendancePortalStatus, getKolkataDateTime } from "@/lib/attendance-window";
import { extractTokenFromRequest, verifyTokenNode } from "@/lib/jwt";
import crypto from "crypto";
import type {
  AttendanceCheckinPayload,
  SkippedMemberAttendance,
} from "@/types";

// Helper to convert "YYYY-MM-DD" to UTC midnight Date for PostgreSQL @db.Date column
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export async function POST(request: NextRequest) {
  try {
    // 1. Identify submitter: Admin vs Public
    const token = extractTokenFromRequest(request);
    const adminPayload = token ? verifyTokenNode(token) : null;
    const isAdmin = Boolean(
      adminPayload?.isActive &&
      (adminPayload.role?.toUpperCase().includes("ADMIN") ||
        adminPayload.role?.toUpperCase() === "SUPER ADMIN")
    );

    // 2. If not admin, check if public attendance window is open
    if (!isAdmin) {
      const portalStatus = await getAttendancePortalStatus();
      if (!portalStatus.isOpen) {
        return NextResponse.json(
          {
            success: false,
            message:
              portalStatus.politeMessage ||
              "The TTC Attendance Portal is currently closed. Please check in on Sundays between 7:00 AM and 12:00 AM midnight.",
            isClosed: true,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      familyId,
      attendanceDate: reqDate,
      submissions,
    }: AttendanceCheckinPayload = body;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select at least one present member to record attendance.",
        },
        { status: 400 }
      );
    }

    // 3. Resolve target attendance date
    const todayIST = getKolkataDateTime().dateString;
    const dateStr = reqDate && /^\d{4}-\d{2}-\d{2}$/.test(reqDate) ? reqDate : todayIST;
    const targetDate = parseDateOnly(dateStr);

    const memberIds = submissions.map((s) => s.memberId).filter(Boolean);

    // 4. Verify member IDs exist and fetch their family IDs
    const existingMembers = await prisma.members.findMany({
      where: {
        id: { in: memberIds },
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        family_id: true,
      },
    });

    const memberMap = new Map(existingMembers.map((m) => [m.id, m]));

    // 5. Backend Duplicate Prevention: Check if already attended on targetDate
    const existingAttendances = await prisma.attendance.findMany({
      where: {
        member_id: { in: memberIds },
        attendance_date: targetDate,
      },
      select: {
        member_id: true,
        service: true,
        created_at: true,
      },
    });

    const existingAttendedMap = new Map<
      string,
      { service: string; createdAt: Date; formattedTime: string }
    >();
    for (const att of existingAttendances) {
      const timeStr = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(att.created_at);

      existingAttendedMap.set(att.member_id, {
        service: att.service,
        createdAt: att.created_at,
        formattedTime: timeStr,
      });
    }

    // Filter down to submissions that have NOT already checked in
    const validSubmissions: Array<{
      memberId: string;
      memberName: string;
      familyId: string | null;
      service: string;
      notes?: string;
    }> = [];

    const skippedMembers: SkippedMemberAttendance[] = [];

    for (const sub of submissions) {
      const member = memberMap.get(sub.memberId);
      if (!member) continue;

      const attended = existingAttendedMap.get(sub.memberId);
      if (attended) {
        skippedMembers.push({
          memberId: sub.memberId,
          name: member.name,
          service: attended.service || sub.service,
          submittedAt: attended.createdAt.toISOString(),
          submittedAtFormatted: attended.formattedTime,
        });
      } else {
        validSubmissions.push({
          memberId: sub.memberId,
          memberName: member.name,
          familyId: member.family_id || familyId || null,
          service: sub.service || "SERVICE_1",
          notes: sub.notes,
        });
      }
    }

    if (validSubmissions.length === 0) {
      const single = skippedMembers.length === 1 ? skippedMembers[0] : null;
      const message = single
        ? `${single.name} has already submitted attendance today (${
            single.submittedAtFormatted ? `at ${single.submittedAtFormatted}` : "earlier"
          }).`
        : `All selected members have already submitted attendance today.`;

      return NextResponse.json(
        {
          success: false,
          isAlreadySubmitted: true,
          message,
          recordedCount: 0,
          skippedCount: skippedMembers.length,
          skippedMembers,
          contactPhone: "+91 63798 71925",
          contactHelp:
            "If you have any queries or need to modify your service, please inform church administration or call +91 63798 71925.",
        },
        { status: 409 }
      );
    }

    // 6. Record attendance within transaction
    const batchId = crypto.randomUUID();
    const submittedVia = isAdmin ? "ADMIN_PORTAL" : "QR_PUBLIC";

    try {
      await prisma.$transaction(
        validSubmissions.map((sub) =>
          prisma.attendance.create({
            data: {
              member_id: sub.memberId,
              family_id: sub.familyId,
              service: sub.service,
              attendance_date: targetDate,
              status: "PRESENT",
              submitted_via: submittedVia,
              batch_id: batchId,
              notes: sub.notes || null,
              created_by: adminPayload?.id || null,
            },
          })
        )
      );
    } catch (insertError: unknown) {
      // Catch unique constraint violation (P2002) in case of concurrent requests
      if (
        insertError &&
        typeof insertError === "object" &&
        "code" in insertError &&
        (insertError as { code: string }).code === "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "One or more members were already checked in for this service.",
          },
          { status: 409 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `Attendance successfully recorded for ${validSubmissions.length} member(s).`,
      recordedCount: validSubmissions.length,
      skippedCount: skippedMembers.length,
      batchId,
      recordedMembers: validSubmissions.map((m) => ({
        id: m.memberId,
        name: m.memberName,
        service: m.service,
      })),
      skippedMembers,
      contactPhone: "+91 63798 71925",
    });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to record attendance. Please try again.",
      },
      { status: 500 }
    );
  }
}
