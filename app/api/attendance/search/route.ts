import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getKolkataDateTime } from "@/lib/attendance-window";
import type { AttendanceFamilyResult, AttendanceMemberChecklistItem } from "@/types";

// Helper to convert "YYYY-MM-DD" to UTC midnight Date for PostgreSQL @db.Date column
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const dateParam = (searchParams.get("date") || "").trim();

    // Default to today in IST
    const todayIST = getKolkataDateTime().dateString;
    const targetDateStr = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIST;
    const targetDate = parseDateOnly(targetDateStr);

    // 1. Build member search criteria
    const whereMemberClause: Prisma.membersWhereInput = {
      is_deleted: false,
    };

    if (query) {
      whereMemberClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ];
    }

    // 2. Find matching members to get their family_ids
    const matchedMembers = await prisma.members.findMany({
      where: whereMemberClause,
      select: {
        id: true,
        family_id: true,
      },
      take: query ? 50 : 15,
    });

    const familyIds = Array.from(
      new Set(
        matchedMembers
          .map((m) => m.family_id)
          .filter((fid): fid is string => fid !== null && fid !== undefined)
      )
    );

    // If query was empty and no familyIds found from sample, fetch top active families
    if (familyIds.length === 0 && !query) {
      const defaultFamilies = await prisma.family.findMany({
        where: { is_deleted: false },
        take: 10,
        select: { id: true },
      });
      familyIds.push(...defaultFamilies.map((f) => f.id));
    }

    if (familyIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 3. Fetch full family details along with all family members
    const families = await prisma.family.findMany({
      where: {
        id: { in: familyIds },
        is_deleted: false,
      },
      include: {
        members: {
          where: { is_deleted: false },
          orderBy: [
            { is_head: "desc" },
            { age: "desc" },
            { created_at: "asc" },
          ],
        },
      },
    });

    // 4. Fetch all attendance records for these members on targetDate
    const allMemberIds = families.flatMap((f) => f.members.map((m) => m.id));
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        member_id: { in: allMemberIds },
        attendance_date: targetDate,
      },
      select: {
        member_id: true,
        service: true,
        created_at: true,
        status: true,
      },
    });

    // Map existing attendance by member_id
    const attendanceMap = new Map<
      string,
      { service: string; createdAt: string; attendedAtFormatted: string; status: string }
    >();
    for (const record of existingAttendance) {
      const timeStr = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(record.created_at);

      attendanceMap.set(record.member_id, {
        service: record.service,
        createdAt: record.created_at.toISOString(),
        attendedAtFormatted: timeStr,
        status: record.status,
      });
    }

    // 5. Structure payload with Head of Family formatting e.g. "Joyelizabeth's Family"
    const results: AttendanceFamilyResult[] = families.map((fam) => {
      const head = fam.members.find((m) => m.is_head) || fam.members[0];
      const headName = head?.name || "Member";
      const familyDisplayName = `${headName}'s Family`;

      const formattedMembers: AttendanceMemberChecklistItem[] = fam.members.map((m) => {
        const att = attendanceMap.get(m.id);
        return {
          id: m.id,
          name: m.name,
          isHead: m.is_head,
          gender: m.gender,
          age: m.age,
          phone: m.phone,
          churchRole: m.church_role || m.role,
          alreadyAttended: Boolean(att),
          attendedService: att?.service || null,
          attendedAt: att?.createdAt || null,
          attendedAtFormatted: att?.attendedAtFormatted || null,
        };
      });

      return {
        familyId: fam.id,
        familyName: familyDisplayName,
        headName: head?.name || "N/A",
        headPhone: head?.phone || null,
        region: fam.region || null,
        address: fam.address || null,
        totalMembersCount: fam.members.length,
        alreadyAttendedCount: formattedMembers.filter((m) => m.alreadyAttended).length,
        members: formattedMembers,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
      targetDate: targetDateStr,
    });
  } catch (error) {
    console.error("Error searching attendance families:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to search families for attendance",
      },
      { status: 500 }
    );
  }
}
