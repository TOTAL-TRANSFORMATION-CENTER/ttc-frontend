import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { extractTokenFromRequest, verifyTokenNode } from "@/lib/jwt";
import { AGE_BRACKETS } from "@/constants";
import type { AttendanceEditPayload } from "@/types";

// Helper to convert "YYYY-MM-DD" to UTC midnight Date for PostgreSQL @db.Date column
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function formatDateOnly(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "calendar" | "roster" | "analytics"
    const month = searchParams.get("month"); // "YYYY-MM"
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD"
    const serviceParam = searchParams.get("service"); // e.g. "SERVICE_1" or "ALL"
    const search = (searchParams.get("search") || "").trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // ─── 1. CALENDAR VIEW: Monthly Aggregation ───
    if (view === "calendar" && month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const mIndex = parseInt(monthStr, 10) - 1;

      const startDate = new Date(Date.UTC(year, mIndex, 1));
      const endDate = new Date(Date.UTC(year, mIndex + 1, 0)); // last day of month

      const records = await prisma.attendance.findMany({
        where: {
          attendance_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          attendance_date: true,
          service: true,
          family_id: true,
          member_id: true,
        },
      });

      // Group by date string (YYYY-MM-DD)
      const datesSummary: Record<
        string,
        {
          total: number;
          uniqueFamilies: number;
          services: Record<string, number>;
          familyIds: string[];
        }
      > = {};

      for (const rec of records) {
        const dStr = formatDateOnly(rec.attendance_date);
        if (!datesSummary[dStr]) {
          datesSummary[dStr] = {
            total: 0,
            uniqueFamilies: 0,
            services: {},
            familyIds: [],
          };
        }

        datesSummary[dStr].total += 1;
        datesSummary[dStr].services[rec.service] = (datesSummary[dStr].services[rec.service] || 0) + 1;
        if (rec.family_id && !datesSummary[dStr].familyIds.includes(rec.family_id)) {
          datesSummary[dStr].familyIds.push(rec.family_id);
        }
      }

      // Convert familyIds array to unique count
      const formattedDates: Record<
        string,
        { total: number; uniqueFamilies: number; services: Record<string, number> }
      > = {};

      for (const [key, val] of Object.entries(datesSummary)) {
        formattedDates[key] = {
          total: val.total,
          uniqueFamilies: val.familyIds.length,
          services: val.services,
        };
      }

      return NextResponse.json({
        success: true,
        month,
        dates: formattedDates,
      });
    }

    // ─── 2. ROSTER DRILLDOWN: Present Members for a Date & Service ───
    if (view === "roster" && dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const targetDate = parseDateOnly(dateParam);
      const whereClause: Prisma.attendanceWhereInput = {
        attendance_date: targetDate,
      };

      if (serviceParam && serviceParam !== "ALL") {
        whereClause.service = serviceParam;
      }

      if (search) {
        whereClause.members = {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      const records = await prisma.attendance.findMany({
        where: whereClause,
        include: {
          members: {
            select: {
              id: true,
              name: true,
              gender: true,
              age: true,
              phone: true,
              email: true,
              church_role: true,
              role: true,
              family: {
                select: {
                  id: true,
                  region: true,
                  address: true,
                  members: {
                    where: { is_head: true },
                    select: { name: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: "asc" },
      });

      const roster = records.map((rec) => {
        const headName = rec.members?.family?.members[0]?.name || rec.members.name;
        return {
          id: rec.id,
          memberId: rec.member_id,
          memberName: rec.members.name,
          gender: rec.members.gender,
          age: rec.members.age,
          phone: rec.members.phone,
          churchRole: rec.members.church_role || rec.members.role,
          familyId: rec.family_id,
          familyName: `${headName}'s Family`,
          region: rec.members?.family?.region || null,
          service: rec.service,
          submittedVia: rec.submitted_via,
          batchId: rec.batch_id,
          createdAt: rec.created_at.toISOString(),
          notes: rec.notes,
        };
      });

      return NextResponse.json({
        success: true,
        date: dateParam,
        service: serviceParam || "ALL",
        count: roster.length,
        roster,
      });
    }

    // ─── 3. ANALYTICS & PAGINATED LIST VIEW ───
    const targetDateStr = dateParam || month || formatDateOnly(new Date());
    const targetDate = parseDateOnly(targetDateStr);

    const whereClause: Prisma.attendanceWhereInput = {
      attendance_date: targetDate,
    };

    if (serviceParam && serviceParam !== "ALL") {
      whereClause.service = serviceParam;
    }

    if (search) {
      whereClause.members = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [totalCount, allRecordsForStats] = await Promise.all([
      prisma.attendance.count({ where: whereClause }),
      prisma.attendance.findMany({
        where: { attendance_date: targetDate },
        include: {
          members: {
            select: {
              gender: true,
              age: true,
            },
          },
        },
      }),
    ]);

    // Calculate Demographic Statistics
    let maleCount = 0;
    let femaleCount = 0;
    let adultCount = 0;
    let youthCount = 0;
    let preYouthCount = 0;
    let childCount = 0;

    const serviceCounts: Record<string, number> = {};
    const uniqueFamilies = new Set<string>();

    for (const rec of allRecordsForStats) {
      serviceCounts[rec.service] = (serviceCounts[rec.service] || 0) + 1;
      if (rec.family_id) uniqueFamilies.add(rec.family_id);

      const gender = (rec.members?.gender || "").toUpperCase();
      if (gender === "MALE") maleCount += 1;
      else if (gender === "FEMALE") femaleCount += 1;

      const age = rec.members?.age ?? null;
      if (age !== null) {
        if (age <= AGE_BRACKETS.CHILD.max) childCount += 1;
        else if (age <= AGE_BRACKETS.PRE_YOUTH.max) preYouthCount += 1;
        else if (age <= AGE_BRACKETS.YOUTH.max) youthCount += 1;
        else adultCount += 1;
      }
    }

    // Fetch paginated rows for the table
    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            gender: true,
            age: true,
            phone: true,
            church_role: true,
            role: true,
            family: {
              select: {
                id: true,
                region: true,
                members: {
                  where: { is_head: true },
                  select: { name: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = records.map((rec) => {
      const headName = rec.members?.family?.members[0]?.name || rec.members.name;
      return {
        id: rec.id,
        memberId: rec.member_id,
        memberName: rec.members.name,
        gender: rec.members.gender,
        age: rec.members.age,
        phone: rec.members.phone,
        churchRole: rec.members.church_role || rec.members.role,
        familyId: rec.family_id,
        familyName: `${headName}'s Family`,
        region: rec.members?.family?.region || null,
        service: rec.service,
        submittedVia: rec.submitted_via,
        createdAt: rec.created_at.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalPresent: allRecordsForStats.length,
        uniqueFamilies: uniqueFamilies.size,
        services: serviceCounts,
        demographics: {
          male: maleCount,
          female: femaleCount,
          adults: adultCount,
          youth: youthCount,
          preYouth: preYouthCount,
          children: childCount,
        },
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      data: items,
      date: targetDateStr,
    });
  } catch (error) {
    console.error("Error in admin attendance endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load admin attendance records" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
        { success: false, message: "Forbidden. Admin privileges required to edit attendance." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<AttendanceEditPayload>;
    const { attendanceId, service, notes } = body;

    if (!attendanceId) {
      return NextResponse.json(
        { success: false, message: "attendanceId is required." },
        { status: 400 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service is required." },
        { status: 400 }
      );
    }

    // 1. Fetch existing attendance record
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    // 2. If service is changing, ensure member doesn't already have a record for this service on that date
    if (existing.service !== service) {
      const conflict = await prisma.attendance.findFirst({
        where: {
          member_id: existing.member_id,
          attendance_date: existing.attendance_date,
          service,
        },
      });

      if (conflict && conflict.id !== attendanceId) {
        return NextResponse.json(
          {
            success: false,
            message: "This member already has an attendance record for this service on this date.",
          },
          { status: 409 }
        );
      }
    }

    // 3. Update record
    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        service,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update attendance record." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
        { success: false, message: "Forbidden. Admin privileges required to delete attendance." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance ID is required to remove record." },
        { status: 400 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance record successfully removed.",
    });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove attendance record." },
      { status: 500 }
    );
  }
}
